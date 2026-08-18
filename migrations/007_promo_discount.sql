-- Migration 007 — make promo codes actually redeemable at checkout.
-- Run: wrangler d1 execute bespokedeploy-db --remote --file=migrations/007_promo_discount.sql
-- (drop --remote to also apply to your local dev DB)

ALTER TABLE promos ADD COLUMN discount_type  TEXT NOT NULL DEFAULT 'percent'; -- 'percent' | 'flat'
ALTER TABLE promos ADD COLUMN discount_value REAL NOT NULL DEFAULT 0;         -- 20 = 20% off, or ₹20 off if flat

-- Record which promo (if any) a booking used, and how much it saved — for
-- admin visibility and so the stored total always matches what was actually
-- charged via Razorpay.
ALTER TABLE bookings ADD COLUMN promo_code      TEXT DEFAULT NULL;
ALTER TABLE bookings ADD COLUMN discount_amount INTEGER DEFAULT 0;
