-- Migration 003 — adds cost + signup-reason tracking to the waiting list.
-- Run: wrangler d1 execute bespokedeploy-db --remote --file=migrations/003_waitlist_price_reason.sql
-- (drop --remote to also apply to your local dev DB)

ALTER TABLE waitlist ADD COLUMN plan_price INTEGER DEFAULT NULL;
ALTER TABLE waitlist ADD COLUMN reason TEXT NOT NULL DEFAULT 'capacity';
