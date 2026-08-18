-- Migration 004 — customer feedback / testimonials (QR code on thank-you card).
-- Run: wrangler d1 execute bespokedeploy-db --remote --file=migrations/004_feedback.sql
-- (drop --remote to also apply to your local dev DB)

CREATE TABLE IF NOT EXISTS feedback (
  id            TEXT PRIMARY KEY,           -- FB-YYYYMMDD-XXXX
  booking_id    TEXT DEFAULT NULL,          -- optional link to the project this is about
  customer_name TEXT NOT NULL,
  customer_email TEXT DEFAULT '',
  plan_name     TEXT DEFAULT '',
  rating        INTEGER NOT NULL,           -- 1-5
  message       TEXT NOT NULL,
  approved      INTEGER NOT NULL DEFAULT 0, -- 0/1 — admin must approve before it can be shown publicly
  featured      INTEGER NOT NULL DEFAULT 0, -- 0/1 — highlighted on the site's testimonials section
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_feedback_approved   ON feedback(approved, featured);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);
