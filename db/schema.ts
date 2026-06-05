import {
  pgTable,
  pgEnum,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  real,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const statusEnum = pgEnum("status", ["Planning", "Booked", "InProgress", "Accomplished"]);
export const voteEnum = pgEnum("vote", ["agree", "disagree"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const destinations = pgTable("destinations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  destination: varchar("destination", { length: 255 }).notNull(),
  goalTitle: varchar("goal_title", { length: 255 }),
  category: varchar("category", { length: 50 }).default("Travel"),
  status: statusEnum("status").default("Planning").notNull(),
  startDate: varchar("start_date", { length: 20 }),
  endDate: varchar("end_date", { length: 20 }),
  imageUrl: text("image_url"),
  lat: real("lat"),
  lon: real("lon"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Destination = typeof destinations.$inferSelect;
export type InsertDestination = typeof destinations.$inferInsert;

/* ── Invite System ───────────────────────────────────────────────────────── */

export const invites = pgTable("invites", {
  id: serial("id").primaryKey(),
  destinationId: integer("destination_id").notNull(),
  code: varchar("code", { length: 16 }).notNull().unique(),
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Invite = typeof invites.$inferSelect;
export type InsertInvite = typeof invites.$inferInsert;

export const inviteVotes = pgTable("invite_votes", {
  id: serial("id").primaryKey(),
  inviteId: integer("invite_id").notNull(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  userName: varchar("user_name", { length: 255 }),
  userAvatar: text("user_avatar"),
  vote: voteEnum("vote").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type InviteVote = typeof inviteVotes.$inferSelect;
export type InsertInviteVote = typeof inviteVotes.$inferInsert;

export const inviteComments = pgTable("invite_comments", {
  id: serial("id").primaryKey(),
  inviteId: integer("invite_id").notNull(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  userName: varchar("user_name", { length: 255 }),
  userAvatar: text("user_avatar"),
  message: varchar("message", { length: 300 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type InviteComment = typeof inviteComments.$inferSelect;
export type InsertInviteComment = typeof inviteComments.$inferInsert;
