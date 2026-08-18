-- Migration 005 — ownership transfer certificate metadata on bookings.
-- Run: wrangler d1 execute bespokedeploy-db --remote --file=migrations/005_certificate.sql
-- (drop --remote to also apply to your local dev DB)

ALTER TABLE bookings ADD COLUMN certificate_id        TEXT DEFAULT NULL;
ALTER TABLE bookings ADD COLUMN certificate_issued_at TEXT DEFAULT NULL;
ALTER TABLE bookings ADD COLUMN cert_website_name     TEXT DEFAULT NULL;
ALTER TABLE bookings ADD COLUMN cert_website_url      TEXT DEFAULT NULL;
