-- Migration 006 — promotional offers / showcase banners.
-- Run: wrangler d1 execute bespokedeploy-db --remote --file=migrations/006_promos.sql
-- (drop --remote to also apply to your local dev DB)

CREATE TABLE IF NOT EXISTS promos (
  id          TEXT PRIMARY KEY,           -- PR-YYYYMMDD-XXXX
  badge_text  TEXT DEFAULT '',            -- small eyebrow tag e.g. "LIMITED TIME"
  title       TEXT NOT NULL,              -- headline e.g. "20% off Small Website plans"
  subtitle    TEXT DEFAULT '',            -- supporting line
  code        TEXT DEFAULT '',            -- optional promo code to quote (display only, no auto-apply)
  theme       TEXT NOT NULL DEFAULT 'accent', -- 'accent' | 'gold' | 'green' | 'purple'
  enabled     INTEGER NOT NULL DEFAULT 0, -- 0/1 — admin on/off switch
  starts_at   TEXT DEFAULT NULL,          -- ISO date, optional — promo hidden before this
  ends_at     TEXT DEFAULT NULL,          -- ISO date, optional — promo hidden after this
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_promos_enabled ON promos(enabled, starts_at, ends_at);
