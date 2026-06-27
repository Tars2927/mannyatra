-- Add notes column to destinations
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create destination_photos table for user-uploaded images
CREATE TABLE IF NOT EXISTS destination_photos (
  id              SERIAL PRIMARY KEY,
  destination_id  INTEGER NOT NULL,
  user_id         VARCHAR(255) NOT NULL,
  data            TEXT NOT NULL,
  mime_type       VARCHAR(50) NOT NULL,
  caption         VARCHAR(255),
  created_at      TIMESTAMP DEFAULT NOW() NOT NULL
);
