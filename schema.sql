-- BespokeDeploy — D1 Database Schema
-- Run: wrangler d1 execute bespokedeploy-db --file=schema.sql

CREATE TABLE IF NOT EXISTS bookings (
  id                    TEXT PRIMARY KEY,          -- BD-YYYYMMDD-XXXX
  plan_id               TEXT NOT NULL,
  plan_name             TEXT NOT NULL,
  plan_price            INTEGER NOT NULL,
  addons                TEXT NOT NULL DEFAULT '[]', -- JSON array of addon objects
  hosting               TEXT NOT NULL,
  total                 INTEGER NOT NULL,
  advance               INTEGER NOT NULL,
  balance               INTEGER NOT NULL,

  -- Customer details
  customer_name         TEXT NOT NULL,
  customer_email        TEXT NOT NULL,
  customer_phone        TEXT NOT NULL,
  customer_city         TEXT DEFAULT '',
  customer_timing       TEXT DEFAULT '',
  customer_notes        TEXT DEFAULT '',

  -- Advance payment
  razorpay_order_id     TEXT DEFAULT NULL,          -- Razorpay order ID (server-created, tamper-proof)
  advance_payment_id    TEXT DEFAULT NULL,          -- Razorpay payment ID

  -- Final payment
  final_payment_id      TEXT DEFAULT NULL,          -- Razorpay payment ID
  final_payment_link_id TEXT DEFAULT NULL,          -- Razorpay payment link ID
  final_payment_link    TEXT DEFAULT NULL,          -- Payment URL sent to customer

  -- Status: new | contacting | in_progress | awaiting_payment | review | complete | cancelled
  status                TEXT NOT NULL DEFAULT 'new',
  cancel_reason         TEXT DEFAULT NULL,

  -- Timestamps (ISO 8601)
  created_at            TEXT NOT NULL,
  updated_at            TEXT NOT NULL,
  review_started_at     TEXT DEFAULT NULL,          -- auto-complete triggers 7 days after this

  -- Capacity slot (project workload limiting — see migrations/002_capacity.sql)
  slot_expires_at       TEXT DEFAULT NULL,          -- created_at + capacity.slot_duration_days
  slot_freed_at         TEXT DEFAULT NULL,          -- set when complete/cancelled or admin frees early

  -- Ownership transfer certificate (see migrations/005_certificate.sql)
  certificate_id        TEXT DEFAULT NULL,
  certificate_issued_at TEXT DEFAULT NULL,
  cert_website_name     TEXT DEFAULT NULL,
  cert_website_url      TEXT DEFAULT NULL,

  -- Promo code redeemed at checkout, if any (see migrations/007_promo_discount.sql)
  promo_code       TEXT DEFAULT NULL,
  discount_amount  INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_bookings_status     ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_email      ON bookings(customer_email);
CREATE INDEX IF NOT EXISTS idx_bookings_slot        ON bookings(slot_freed_at, slot_expires_at);

-- ── Site settings (key-value store for admin-controlled content) ─────────────
CREATE TABLE IF NOT EXISTS site_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- ── Waiting list (when the 2 project slots are full) ──────────────────────────
CREATE TABLE IF NOT EXISTS waitlist (
  id                    TEXT PRIMARY KEY,           -- WL-YYYYMMDD-XXXX
  plan_id               TEXT NOT NULL,
  plan_name             TEXT NOT NULL,
  plan_price            INTEGER DEFAULT NULL,        -- plan cost at time of signup (live D1 price)
  customer_name         TEXT NOT NULL,
  customer_email        TEXT NOT NULL,
  customer_phone        TEXT NOT NULL,
  customer_city         TEXT DEFAULT '',
  notes                 TEXT DEFAULT '',
  is_urgent             INTEGER NOT NULL DEFAULT 0,  -- 0/1 — max 1 active urgent flag per rolling 7 days
  reason                TEXT NOT NULL DEFAULT 'capacity', -- 'capacity' (slots full) | 'unavailable' (admin paused plan)
  -- Status: waiting | notified | converted | cancelled
  status                TEXT NOT NULL DEFAULT 'waiting',
  invite_token          TEXT DEFAULT NULL,           -- set when admin notifies — lets customer bypass capacity
  invite_expires_at     TEXT DEFAULT NULL,
  converted_booking_id  TEXT DEFAULT NULL,
  notified_at           TEXT DEFAULT NULL,
  created_at            TEXT NOT NULL,
  updated_at            TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_waitlist_status     ON waitlist(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_waitlist_token      ON waitlist(invite_token);

-- ── Customer feedback / testimonials (see migrations/004_feedback.sql) ────────
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

-- ── Promotional offers / showcase banners (see migrations/006_promos.sql) ─────
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
  discount_type  TEXT NOT NULL DEFAULT 'percent', -- 'percent' | 'flat' (see migrations/007_promo_discount.sql)
  discount_value REAL NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_promos_enabled ON promos(enabled, starts_at, ends_at);
