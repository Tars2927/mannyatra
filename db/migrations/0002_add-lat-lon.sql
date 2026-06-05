CREATE TYPE "public"."vote" AS ENUM('agree', 'disagree');--> statement-breakpoint
CREATE TABLE "invite_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"invite_id" integer NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"user_name" varchar(255),
	"user_avatar" text,
	"message" varchar(300) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invite_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"invite_id" integer NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"user_name" varchar(255),
	"user_avatar" text,
	"vote" "vote" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invites" (
	"id" serial PRIMARY KEY NOT NULL,
	"destination_id" integer NOT NULL,
	"code" varchar(16) NOT NULL,
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invites_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "destinations" ADD COLUMN "lat" real;--> statement-breakpoint
ALTER TABLE "destinations" ADD COLUMN "lon" real;