-- Email Campaign System — CREATE-only migration.
-- Does NOT drop or alter any existing production tables.

DO $$ BEGIN
  CREATE TYPE "campaign_status" AS ENUM ('draft', 'sending', 'sent', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "campaigns" (
  "id"              serial PRIMARY KEY,
  "subject"         varchar(255) NOT NULL,
  "preview_text"    varchar(255),
  "html_content"    text NOT NULL DEFAULT '',
  "template_name"   varchar(100),
  "recipient_count" integer DEFAULT 0,
  "sent_count"      integer DEFAULT 0,
  "failed_count"    integer DEFAULT 0,
  "status"          "campaign_status" NOT NULL DEFAULT 'draft',
  "created_at"      timestamp DEFAULT now() NOT NULL,
  "updated_at"      timestamp DEFAULT now() NOT NULL,
  "sent_at"         timestamp
);

CREATE TABLE IF NOT EXISTS "campaign_recipients" (
  "id"               serial PRIMARY KEY,
  "campaign_id"      integer NOT NULL,
  "email"            varchar(320) NOT NULL,
  "recipient_status" varchar(20) NOT NULL DEFAULT 'pending',
  "error_message"    text,
  "delivered_at"     timestamp
);
