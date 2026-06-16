/**
 * Admin Email Campaign Router — completely isolated Hono routes.
 * Mounted at /api/admin/* in app.ts.
 * Auth: simple ADMIN_SECRET password → HTTP-only cookie.
 * Read-only access to the users table; full CRUD on campaign tables.
 */
import { Hono } from "hono";
import { eq, desc, sql } from "drizzle-orm";
import { getDb } from "../../queries/connection";
import { users } from "../../../db/schema";
import { campaigns, campaignRecipients } from "./schema";
import { sendEmail, sendBatch } from "./resend";
import { getTemplateList, buildTemplate, buildTravelPoster } from "./templates";

const admin = new Hono();

/* ── Config (reads directly from process.env) ──────────────────────────── */
const ADMIN_SECRET = () => process.env.ADMIN_SECRET ?? "mannyatra-admin-2026";
const COOKIE_NAME = "mannyatra_admin";
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours

/* ── Cookie helpers ────────────────────────────────────────────────────── */

function setAdminCookie(c: any) {
  // Simple signed token: base64(secret + timestamp)
  const token = Buffer.from(`${ADMIN_SECRET()}:${Date.now()}`).toString("base64url");
  c.header(
    "Set-Cookie",
    `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${COOKIE_MAX_AGE}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`
  );
}

function clearAdminCookie(c: any) {
  c.header("Set-Cookie", `${COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0`);
}

function isAdminAuthenticated(c: any): boolean {
  const cookieHeader = c.req.header("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return false;
  try {
    const decoded = Buffer.from(match[1], "base64url").toString();
    const [secret] = decoded.split(":");
    return secret === ADMIN_SECRET();
  } catch {
    return false;
  }
}

/* ── Auth middleware ────────────────────────────────────────────────────── */

admin.use("/*", async (c, next) => {
  const path = new URL(c.req.url).pathname;
  // Allow login and check without auth
  if (path.endsWith("/login") || path.endsWith("/check")) {
    return next();
  }
  if (!isAdminAuthenticated(c)) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  return next();
});

/* ── Auth routes ───────────────────────────────────────────────────────── */

admin.post("/login", async (c) => {
  const body = await c.req.json<{ password: string }>();
  if (body.password !== ADMIN_SECRET()) {
    return c.json({ error: "Invalid password" }, 403);
  }
  setAdminCookie(c);
  return c.json({ ok: true });
});

admin.post("/logout", (c) => {
  clearAdminCookie(c);
  return c.json({ ok: true });
});

admin.get("/check", (c) => {
  return c.json({ authenticated: isAdminAuthenticated(c) });
});

/* ── Audience (read-only from users table) ─────────────────────────────── */

admin.get("/audience", async (c) => {
  const db = getDb();
  const allUsers = await db
    .select({ id: users.id, name: users.name, email: users.email, avatar: users.avatar })
    .from(users);

  return c.json({
    total: allUsers.length,
    users: allUsers.filter((u) => u.email),
  });
});

/* ── Templates ─────────────────────────────────────────────────────────── */

admin.get("/templates", (c) => {
  return c.json(getTemplateList());
});

admin.post("/templates/preview", async (c) => {
  const body = await c.req.json<{
    templateId: string;
    heading?: string;
    body?: string;
    heroImage?: string;
    ctaText?: string;
    ctaUrl?: string;
    previewText?: string;
  }>();
  const html = buildTemplate(body.templateId, body);
  return c.json({ html });
});

admin.post("/templates/poster", async (c) => {
  const body = await c.req.json<{
    heroImage: string;
    title: string;
    subtitle: string;
    ctaText: string;
    ctaUrl: string;
  }>();
  const html = buildTravelPoster(body);
  return c.json({ html });
});

/* ── Campaign CRUD ─────────────────────────────────────────────────────── */

admin.get("/campaigns", async (c) => {
  const db = getDb();
  const all = await db
    .select()
    .from(campaigns)
    .orderBy(desc(campaigns.createdAt));
  return c.json(all);
});

admin.get("/campaigns/:id", async (c) => {
  const db = getDb();
  const id = parseInt(c.req.param("id"));
  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
  if (!campaign) return c.json({ error: "Not found" }, 404);

  const recipients = await db
    .select()
    .from(campaignRecipients)
    .where(eq(campaignRecipients.campaignId, id));

  return c.json({ ...campaign, recipients });
});

// Create or update campaign (save draft)
admin.post("/campaigns", async (c) => {
  const db = getDb();
  const body = await c.req.json<{
    id?: number;
    subject: string;
    previewText?: string;
    htmlContent: string;
    templateName?: string;
  }>();

  if (body.id) {
    // Update existing draft
    await db
      .update(campaigns)
      .set({
        subject: body.subject,
        previewText: body.previewText ?? null,
        htmlContent: body.htmlContent,
        templateName: body.templateName ?? null,
        updatedAt: new Date(),
      })
      .where(eq(campaigns.id, body.id));
    return c.json({ id: body.id, saved: true });
  }

  // Create new campaign
  const [created] = await db
    .insert(campaigns)
    .values({
      subject: body.subject,
      previewText: body.previewText ?? null,
      htmlContent: body.htmlContent,
      templateName: body.templateName ?? null,
    })
    .returning({ id: campaigns.id });

  return c.json({ id: created.id, saved: true });
});

// Duplicate campaign as new draft
admin.post("/campaigns/:id/duplicate", async (c) => {
  const db = getDb();
  const id = parseInt(c.req.param("id"));
  const [original] = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
  if (!original) return c.json({ error: "Not found" }, 404);

  const [dup] = await db
    .insert(campaigns)
    .values({
      subject: `[Copy] ${original.subject}`,
      previewText: original.previewText,
      htmlContent: original.htmlContent,
      templateName: original.templateName,
    })
    .returning({ id: campaigns.id });

  return c.json({ id: dup.id });
});

/* ── Send test email ───────────────────────────────────────────────────── */

admin.post("/campaigns/:id/send-test", async (c) => {
  const db = getDb();
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json<{ email: string }>();
  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
  if (!campaign) return c.json({ error: "Not found" }, 404);

  const result = await sendEmail({
    to: body.email,
    subject: `[TEST] ${campaign.subject}`,
    html: campaign.htmlContent,
  });

  return c.json(result);
});

/* ── Send campaign (batch) ─────────────────────────────────────────────── */

admin.post("/campaigns/:id/send", async (c) => {
  const db = getDb();
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json<{ emails: string[] }>();
  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
  if (!campaign) return c.json({ error: "Not found" }, 404);
  if (campaign.status === "sending") return c.json({ error: "Campaign already sending" }, 400);

  const emails = body.emails.filter((e) => e && e.includes("@"));
  if (emails.length === 0) return c.json({ error: "No valid recipients" }, 400);

  // Mark campaign as sending
  await db
    .update(campaigns)
    .set({ status: "sending", recipientCount: emails.length, sentCount: 0, failedCount: 0 })
    .where(eq(campaigns.id, id));

  // Insert recipients
  await db.insert(campaignRecipients).values(
    emails.map((email) => ({ campaignId: id, email, status: "pending" }))
  );

  // Send in background (non-blocking response)
  sendBatch(emails, campaign.subject, campaign.htmlContent, async (sent, failed, total) => {
    // Update campaign progress
    await db
      .update(campaigns)
      .set({ sentCount: sent, failedCount: failed })
      .where(eq(campaigns.id, id));
  }).then(async (result) => {
    // Finalize
    await db
      .update(campaigns)
      .set({
        status: result.failed === emails.length ? "failed" : "sent",
        sentCount: result.sent,
        failedCount: result.failed,
        sentAt: new Date(),
      })
      .where(eq(campaigns.id, id));

    // Update individual recipient statuses
    for (const err of result.errors) {
      await db
        .update(campaignRecipients)
        .set({ status: "failed", errorMessage: err.error })
        .where(
          sql`${campaignRecipients.campaignId} = ${id} AND ${campaignRecipients.email} = ${err.email}`
        );
    }
    // Mark successful ones
    await db
      .update(campaignRecipients)
      .set({ status: "sent", deliveredAt: new Date() })
      .where(
        sql`${campaignRecipients.campaignId} = ${id} AND ${campaignRecipients.status} = 'pending'`
      );
  });

  return c.json({ started: true, recipientCount: emails.length });
});

/* ── Campaign progress (polling) ───────────────────────────────────────── */

admin.get("/campaigns/:id/progress", async (c) => {
  const db = getDb();
  const id = parseInt(c.req.param("id"));
  const [campaign] = await db
    .select({
      status: campaigns.status,
      recipientCount: campaigns.recipientCount,
      sentCount: campaigns.sentCount,
      failedCount: campaigns.failedCount,
    })
    .from(campaigns)
    .where(eq(campaigns.id, id))
    .limit(1);

  if (!campaign) return c.json({ error: "Not found" }, 404);
  return c.json(campaign);
});

export default admin;
