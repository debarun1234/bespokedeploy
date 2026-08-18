-- Migration 002b — finishes what 002_capacity.sql couldn't, because
-- slot_expires_at already existed on the live DB (partial prior run).
-- Everything here is safe to run more than once.
-- Run: wrangler d1 execute bespokedeploy-db --remote --file=migrations/002b_capacity_rest.sql

CREATE INDEX IF NOT EXISTS idx_bookings_slot ON bookings(slot_freed_at, slot_expires_at);

CREATE TABLE IF NOT EXISTS waitlist (
  id                    TEXT PRIMARY KEY,
  plan_id               TEXT NOT NULL,
  plan_name             TEXT NOT NULL,
  customer_name         TEXT NOT NULL,
  customer_email        TEXT NOT NULL,
  customer_phone        TEXT NOT NULL,
  customer_city         TEXT DEFAULT '',
  notes                 TEXT DEFAULT '',
  is_urgent             INTEGER NOT NULL DEFAULT 0,
  status                TEXT NOT NULL DEFAULT 'waiting',
  invite_token          TEXT DEFAULT NULL,
  invite_expires_at     TEXT DEFAULT NULL,
  converted_booking_id  TEXT DEFAULT NULL,
  notified_at           TEXT DEFAULT NULL,
  created_at            TEXT NOT NULL,
  updated_at            TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_waitlist_status     ON waitlist(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_waitlist_token      ON waitlist(invite_token);

UPDATE bookings
SET slot_expires_at = datetime('now', '+14 days')
WHERE status NOT IN ('complete', 'cancelled') AND slot_expires_at IS NULL;

UPDATE bookings
SET slot_freed_at = datetime('now')
WHERE status IN ('complete', 'cancelled') AND slot_freed_at IS NULL;
