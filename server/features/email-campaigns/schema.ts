/**
 * Email Campaign Schema — completely isolated from the main Mannyatra schema.
 * These tables are CREATE-only and never DROP/ALTER existing production tables.
 */
import {
  pgTable,
  pgEnum,
  serial,
  varchar,
  text,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";

export const campaignStatusEnum = pgEnum("campaign_status", [
  "draft",
  "sending",
  "sent",
  "failed",
]);

export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  subject: varchar("subject", { length: 255 }).notNull(),
  previewText: varchar("preview_text", { length: 255 }),
  htmlContent: text("html_content").notNull().default(""),
  templateName: varchar("template_name", { length: 100 }),
  recipientCount: integer("recipient_count").default(0),
  sentCount: integer("sent_count").default(0),
  failedCount: integer("failed_count").default(0),
  status: campaignStatusEnum("status").default("draft").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  sentAt: timestamp("sent_at"),
});

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;

export const campaignRecipients = pgTable("campaign_recipients", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  status: varchar("recipient_status", { length: 20 }).default("pending").notNull(),
  errorMessage: text("error_message"),
  deliveredAt: timestamp("delivered_at"),
});

export type CampaignRecipient = typeof campaignRecipients.$inferSelect;
export type InsertCampaignRecipient = typeof campaignRecipients.$inferInsert;
