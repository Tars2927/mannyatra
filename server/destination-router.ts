import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { destinations } from "../db/schema";
import { fetchDestinationPreview } from "./lib/wikipedia";

// Zod schema for the preview object sent from the client
const previewSchema = z.object({
  source: z.enum(["wikipedia", "fallback"]),
  name: z.string(),
  subtitle: z.string(),
  summary: z.string(),
  image: z.string(),
  lat: z.number().nullable(),
  lon: z.number().nullable(),
  url: z.string(),
}).optional();

export const destinationRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user.unionId;
    return db
      .select()
      .from(destinations)
      .where(eq(destinations.userId, userId))
      .orderBy(sql`${destinations.createdAt} DESC`);
  }),

  stats: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user.unionId;

    const all = await db
      .select()
      .from(destinations)
      .where(eq(destinations.userId, userId));

    const total = all.length;
    const done = all.filter((d) => d.status === "Accomplished").length;
    const avg = total === 0 ? 0 : Math.round((done / total) * 100);
    const people = new Set(all.map((d) => d.userId)).size || 1;

    return { total, done, people, avg };
  }),

  create: authedQuery
    .input(
      z.object({
        destination: z.string().min(1).max(255),
        goalTitle: z.string().max(255).optional(),
        category: z.string().max(50).optional(),
        status: z.enum(["Planning", "Booked", "InProgress", "Accomplished"]).optional(),
        startDate: z.string().max(20).optional(),
        endDate: z.string().max(20).optional(),
        imageUrl: z.string().optional(),
        // Client can pass current preview to avoid a redundant server fetch
        preview: previewSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.unionId;

      // Resolve preview: use client-supplied one if valid, else fetch server-side
      const preview =
        input.preview?.source === "wikipedia"
          ? input.preview
          : await fetchDestinationPreview(input.destination);

      // Pick image: explicit imageUrl > preview image
      const imageUrl = input.imageUrl || preview.image || null;

      await db.insert(destinations).values({
        userId,
        destination: input.destination,
        goalTitle: input.goalTitle ?? null,
        category: input.category ?? "Travel",
        status: input.status ?? "Planning",
        startDate: input.startDate ?? null,
        endDate: input.endDate ?? null,
        imageUrl,
      });

      return { success: true, preview, imageUrl };
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        destination: z.string().min(1).max(255).optional(),
        goalTitle: z.string().max(255).optional(),
        category: z.string().max(50).optional(),
        status: z.enum(["Planning", "Booked", "InProgress", "Accomplished"]).optional(),
        startDate: z.string().max(20).optional(),
        endDate: z.string().max(20).optional(),
        imageUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.unionId;

      const updateData: Record<string, unknown> = {};
      if (input.destination !== undefined) updateData.destination = input.destination;
      if (input.goalTitle !== undefined) updateData.goalTitle = input.goalTitle;
      if (input.category !== undefined) updateData.category = input.category;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.startDate !== undefined) updateData.startDate = input.startDate;
      if (input.endDate !== undefined) updateData.endDate = input.endDate;
      if (input.imageUrl !== undefined) updateData.imageUrl = input.imageUrl;

      await db
        .update(destinations)
        .set(updateData)
        .where(and(eq(destinations.id, input.id), eq(destinations.userId, userId)));

      return { success: true };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.unionId;

      await db
        .delete(destinations)
        .where(and(eq(destinations.id, input.id), eq(destinations.userId, userId)));

      return { success: true };
    }),
});
