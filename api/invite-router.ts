import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { invites, inviteVotes, inviteComments, destinations } from "@db/schema";
import crypto from "crypto";

/** Generate a URL-safe random code */
function generateCode(len = 8): string {
  return crypto.randomBytes(len).toString("base64url").slice(0, len);
}

/** Strip HTML/script tags to prevent XSS in comments */
function sanitizeText(text: string): string {
  return text
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();
}

/** Validate invite code format — only alphanumeric + base64url chars */
const inviteCodeSchema = z.string().min(1).max(16).regex(/^[A-Za-z0-9_-]+$/, "Invalid invite code format");

export const inviteRouter = createRouter({
  /**
   * Create or retrieve an invite for a destination the user owns.
   * One invite per destination — returns existing code if already created.
   */
  create: authedQuery
    .input(z.object({ destinationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.unionId;

      // Verify ownership
      const [dest] = await db
        .select()
        .from(destinations)
        .where(and(eq(destinations.id, input.destinationId), eq(destinations.userId, userId)))
        .limit(1);

      if (!dest) {
        throw new Error("Destination not found or you don't own it");
      }

      // Check for existing invite
      const [existing] = await db
        .select()
        .from(invites)
        .where(eq(invites.destinationId, input.destinationId))
        .limit(1);

      if (existing) {
        return { code: existing.code, inviteId: existing.id };
      }

      // Create new invite
      const code = generateCode();
      const [created] = await db
        .insert(invites)
        .values({
          destinationId: input.destinationId,
          code,
          createdBy: userId,
        })
        .returning();

      return { code: created.code, inviteId: created.id };
    }),

  /**
   * Get full invite details by code — used by the invite landing page.
   * Returns destination info, votes, and comments.
   */
  getByCode: authedQuery
    .input(z.object({ code: inviteCodeSchema }))
    .query(async ({ ctx, input }) => {
      const db = getDb();

      // Get invite
      const [invite] = await db
        .select()
        .from(invites)
        .where(eq(invites.code, input.code))
        .limit(1);

      if (!invite) {
        throw new Error("Invite not found");
      }

      // Get destination
      const [dest] = await db
        .select()
        .from(destinations)
        .where(eq(destinations.id, invite.destinationId))
        .limit(1);

      if (!dest) {
        throw new Error("Destination no longer exists");
      }

      // Get votes
      const votes = await db
        .select()
        .from(inviteVotes)
        .where(eq(inviteVotes.inviteId, invite.id));

      // Get comments
      const comments = await db
        .select()
        .from(inviteComments)
        .where(eq(inviteComments.inviteId, invite.id));

      // Check if current user already voted
      const currentUserId = ctx.user.unionId;
      const myVote = votes.find((v) => v.userId === currentUserId)?.vote ?? null;

      return {
        invite,
        destination: dest,
        votes,
        comments,
        myVote,
        agreeCount: votes.filter((v) => v.vote === "agree").length,
        disagreeCount: votes.filter((v) => v.vote === "disagree").length,
        isOwner: dest.userId === currentUserId,
      };
    }),

  /**
   * Cast or update a vote on an invite.
   */
  vote: authedQuery
    .input(
      z.object({
        inviteId: z.number(),
        vote: z.enum(["agree", "disagree"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.unionId;

      // Check if user already voted
      const [existing] = await db
        .select()
        .from(inviteVotes)
        .where(and(eq(inviteVotes.inviteId, input.inviteId), eq(inviteVotes.userId, userId)))
        .limit(1);

      if (existing) {
        // Update existing vote
        await db
          .update(inviteVotes)
          .set({ vote: input.vote })
          .where(eq(inviteVotes.id, existing.id));
      } else {
        // Insert new vote
        await db.insert(inviteVotes).values({
          inviteId: input.inviteId,
          userId,
          userName: ctx.user.name ?? "Anonymous",
          userAvatar: ctx.user.avatar ?? "",
          vote: input.vote,
        });
      }

      return { success: true };
    }),

  /**
   * Add a comment to an invite (max ~50 words / 300 chars).
   */
  comment: authedQuery
    .input(
      z.object({
        inviteId: z.number(),
        message: z.string().min(1).max(300),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.unionId;

      // Sanitize and validate
      const cleanMessage = sanitizeText(input.message);
      if (!cleanMessage) {
        throw new Error("Message cannot be empty after sanitization");
      }
      const wordCount = cleanMessage.split(/\s+/).filter(Boolean).length;
      if (wordCount > 50) {
        throw new Error("Message exceeds 50-word limit");
      }

      const [created] = await db
        .insert(inviteComments)
        .values({
          inviteId: input.inviteId,
          userId,
          userName: ctx.user.name ?? "Anonymous",
          userAvatar: ctx.user.avatar ?? "",
          message: cleanMessage,
        })
        .returning();

      return created;
    }),

  /**
   * Get invite + votes + comments for a destination the user owns.
   * Used in the InviteModal on destination cards.
   */
  listForDestination: authedQuery
    .input(z.object({ destinationId: z.number() }))
    .query(async ({ ctx: _ctx, input }) => {
      const db = getDb();

      // Get invite for this destination
      const [invite] = await db
        .select()
        .from(invites)
        .where(eq(invites.destinationId, input.destinationId))
        .limit(1);

      if (!invite) {
        return { invite: null, votes: [], comments: [], agreeCount: 0, disagreeCount: 0 };
      }

      const votes = await db
        .select()
        .from(inviteVotes)
        .where(eq(inviteVotes.inviteId, invite.id));

      const comments = await db
        .select()
        .from(inviteComments)
        .where(eq(inviteComments.inviteId, invite.id));

      return {
        invite,
        votes,
        comments,
        agreeCount: votes.filter((v) => v.vote === "agree").length,
        disagreeCount: votes.filter((v) => v.vote === "disagree").length,
      };
    }),
});
