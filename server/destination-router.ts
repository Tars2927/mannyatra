import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { destinations, destinationPhotos } from "../db/schema";
import { fetchDestinationPreview } from "./lib/wikipedia";

const MAX_PHOTOS_PER_DEST = 5;
const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

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

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.unionId;

      const [dest] = await db
        .select()
        .from(destinations)
        .where(and(eq(destinations.id, input.id), eq(destinations.userId, userId)))
        .limit(1);

      if (!dest) throw new Error("Destination not found");

      const photos = await db
        .select({
          id: destinationPhotos.id,
          caption: destinationPhotos.caption,
          mimeType: destinationPhotos.mimeType,
          createdAt: destinationPhotos.createdAt,
        })
        .from(destinationPhotos)
        .where(eq(destinationPhotos.destinationId, input.id))
        .orderBy(sql`${destinationPhotos.createdAt} DESC`);

      return { ...dest, photos };
    }),

  stats: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user.unionId;

    const all = await db
      .select()
      .from(destinations)
      .where(eq(destinations.userId, userId));

    const total = all.length;
    const planning = all.filter((d) => d.status === "Planning").length;
    const booked = all.filter((d) => d.status === "Booked").length;
    const inProgress = all.filter((d) => d.status === "InProgress").length;
    const done = all.filter((d) => d.status === "Accomplished").length;
    const avg = total === 0 ? 0 : Math.round((done / total) * 100);

    // Count unique countries from destination names (rough heuristic)
    const withCoords = all.filter((d) => d.lat != null && d.lon != null);

    // Continent detection from coordinates
    const continents = new Set<string>();
    for (const d of withCoords) {
      const lat = d.lat!;
      const lon = d.lon!;
      if (lat > 35 && lon > -30 && lon < 60) continents.add("Europe");
      else if (lat > 0 && lon > 60 && lon < 150) continents.add("Asia");
      else if (lat < 0 && lon > 100 && lon < 180) continents.add("Oceania");
      else if (lat < 35 && lat > -35 && lon > -20 && lon < 55) continents.add("Africa");
      else if (lat > 10 && lon > -170 && lon < -30) continents.add("North America");
      else if (lat < 15 && lon > -90 && lon < -30) continents.add("South America");
      else if (lat < -60) continents.add("Antarctica");
      else continents.add("Other");
    }

    // Category breakdown
    const categories: Record<string, number> = {};
    for (const d of all) {
      const cat = d.category ?? "Travel";
      categories[cat] = (categories[cat] ?? 0) + 1;
    }

    // Travel score: weighted metric
    // +10 per destination, +20 per accomplished, +15 per continent, +5 per category
    const travelScore =
      total * 10 + done * 20 + continents.size * 15 + Object.keys(categories).length * 5;

    return {
      total,
      planning,
      booked,
      inProgress,
      done,
      avg,
      continents: continents.size,
      continentList: Array.from(continents),
      categories,
      mappedCount: withCoords.length,
      travelScore,
    };
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
        lat: preview.lat,
        lon: preview.lon,
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
        notes: z.string().max(1000).optional(),
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
      if (input.notes !== undefined) updateData.notes = input.notes;

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

  /**
   * Backfill coordinates (and images) for destinations missing lat/lon.
   * Also fixes dead Unsplash Source URLs.
   */
  backfillCoordinates: authedQuery.mutation(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user.unionId;

    // Find all destinations for this user that are missing coordinates OR have dead image URLs
    const all = await db
      .select()
      .from(destinations)
      .where(eq(destinations.userId, userId));

    const needsFix = all.filter(
      (d) => d.lat == null || !d.imageUrl || d.imageUrl.includes("source.unsplash.com")
    );

    let updated = 0;
    for (const dest of needsFix) {
      try {
        const preview = await fetchDestinationPreview(dest.destination);
        const updateData: Record<string, unknown> = {};

        if (preview.lat != null && dest.lat == null) updateData.lat = preview.lat;
        if (preview.lon != null && dest.lon == null) updateData.lon = preview.lon;
        if ((!dest.imageUrl || dest.imageUrl.includes("source.unsplash.com")) && preview.image) {
          updateData.imageUrl = preview.image;
        }

        if (Object.keys(updateData).length > 0) {
          await db
            .update(destinations)
            .set(updateData)
            .where(eq(destinations.id, dest.id));
          updated++;
        }
      } catch {
        // Skip failed lookups
      }
    }

    return { total: needsFix.length, updated };
  }),

  /* ── Photo endpoints ──────────────────────────────────────────────────── */

  uploadPhoto: authedQuery
    .input(
      z.object({
        destinationId: z.number(),
        data: z.string(), // base64 data URL
        mimeType: z.string(),
        caption: z.string().max(255).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.unionId;

      // Verify ownership
      const [dest] = await db
        .select()
        .from(destinations)
        .where(and(eq(destinations.id, input.destinationId), eq(destinations.userId, userId)))
        .limit(1);
      if (!dest) throw new Error("Destination not found or you don't own it");

      // Validate mime type
      if (!ALLOWED_MIME_TYPES.includes(input.mimeType)) {
        throw new Error("Only JPEG, PNG, and WebP images are allowed");
      }

      // Validate size (base64 is ~33% larger than binary)
      const estimatedBytes = (input.data.length * 3) / 4;
      if (estimatedBytes > MAX_PHOTO_SIZE_BYTES) {
        throw new Error("Image exceeds 5MB size limit");
      }

      // Check photo count limit
      const existing = await db
        .select({ id: destinationPhotos.id })
        .from(destinationPhotos)
        .where(eq(destinationPhotos.destinationId, input.destinationId));
      if (existing.length >= MAX_PHOTOS_PER_DEST) {
        throw new Error(`Maximum of ${MAX_PHOTOS_PER_DEST} photos per destination`);
      }

      const [photo] = await db
        .insert(destinationPhotos)
        .values({
          destinationId: input.destinationId,
          userId,
          data: input.data,
          mimeType: input.mimeType,
          caption: input.caption ?? null,
        })
        .returning();

      return { id: photo.id, caption: photo.caption, mimeType: photo.mimeType, createdAt: photo.createdAt };
    }),

  deletePhoto: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.unionId;

      await db
        .delete(destinationPhotos)
        .where(and(eq(destinationPhotos.id, input.id), eq(destinationPhotos.userId, userId)));

      return { success: true };
    }),

  getPhoto: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx: _ctx, input }) => {
      const db = getDb();
      const [photo] = await db
        .select()
        .from(destinationPhotos)
        .where(eq(destinationPhotos.id, input.id))
        .limit(1);
      if (!photo) throw new Error("Photo not found");
      return photo;
    }),

  listPhotos: authedQuery
    .input(z.object({ destinationId: z.number() }))
    .query(async ({ ctx: _ctx, input }) => {
      const db = getDb();
      return db
        .select({
          id: destinationPhotos.id,
          caption: destinationPhotos.caption,
          mimeType: destinationPhotos.mimeType,
          createdAt: destinationPhotos.createdAt,
        })
        .from(destinationPhotos)
        .where(eq(destinationPhotos.destinationId, input.destinationId))
        .orderBy(sql`${destinationPhotos.createdAt} DESC`);
    }),
});
