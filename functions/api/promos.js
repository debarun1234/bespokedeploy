// GET /api/promos — public: all currently live promos (enabled + within date
// window), most recent first. Read-only — this is the only endpoint the
// customer-facing site ever calls, so there is no way for a visitor to
// create, edit, or disable a promo. All writes require an admin bearer token
// (see /api/admin/promos). Returns an array so the homepage banner can rotate
// through more than one active promo.
import { json, cors } from '../_shared/auth.js';

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors() });
}

export async function onRequestGet({ env }) {
  const now = new Date().toISOString();
  const { results } = await env.DB.prepare(`
    SELECT id, badge_text, title, subtitle, code, theme
    FROM promos
    WHERE enabled = 1
      AND (starts_at IS NULL OR starts_at <= ?)
      AND (ends_at   IS NULL OR ends_at   >= ?)
    ORDER BY created_at DESC
    LIMIT 10
  `).bind(now, now).all();

  return json(results || []);
}
