// GET  /api/admin/promos — admin only. List all promos (past, active, scheduled).
// POST /api/admin/promos — admin only. Create a new promo (starts disabled by default).
import { json, err, requireAdmin, cors } from '../../../_shared/auth.js';

function generatePromoId() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PR-${date}-${rand}`;
}

const THEMES = ['accent', 'gold', 'green', 'purple'];
const DISCOUNT_TYPES = ['percent', 'flat'];

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors() });
}

export async function onRequestGet({ request, env }) {
  if (!await requireAdmin(request, env)) return err('Unauthorized', 401);
  const { results } = await env.DB.prepare(
    'SELECT * FROM promos ORDER BY created_at DESC'
  ).all();

  // Attach redemption stats per promo — how many bookings actually used it
  // and how much was discounted in total, straight from the bookings table
  // so this can never drift from what was really charged.
  let promos = results || [];
  try {
    const { results: usage } = await env.DB.prepare(`
      SELECT promo_code, COUNT(*) AS redemptions, SUM(discount_amount) AS total_discounted
      FROM bookings
      WHERE promo_code IS NOT NULL AND promo_code <> ''
      GROUP BY promo_code
    `).all();
    const byCode = Object.fromEntries((usage || []).map(u => [u.promo_code, u]));
    promos = promos.map(p => ({
      ...p,
      redemptions: byCode[p.code]?.redemptions || 0,
      total_discounted: byCode[p.code]?.total_discounted || 0,
    }));
  } catch (e) {
    console.error('[admin/promos] usage stats query failed, skipping:', e?.message || e);
  }

  return json(promos);
}

export async function onRequestPost({ request, env }) {
  if (!await requireAdmin(request, env)) return err('Unauthorized', 401);

  const body = await request.json().catch(() => null);
  if (!body) return err('Invalid JSON');

  const { badge_text, title, subtitle, code, theme, enabled, starts_at, ends_at, discount_type, discount_value } = body;
  if (!title?.trim()) return err('Title is required');
  if (theme && !THEMES.includes(theme)) return err(`theme must be one of: ${THEMES.join(', ')}`);
  if (discount_type && !DISCOUNT_TYPES.includes(discount_type)) return err(`discount_type must be one of: ${DISCOUNT_TYPES.join(', ')}`);
  if (discount_value !== undefined && (isNaN(Number(discount_value)) || Number(discount_value) < 0)) return err('discount_value must be a non-negative number');
  if (code?.trim() && (!discount_value || Number(discount_value) <= 0)) return err('A promo code needs a discount value greater than 0, or customers won’t get anything for using it');

  const id  = generatePromoId();
  const now = new Date().toISOString();

  await env.DB.prepare(`
    INSERT INTO promos (
      id, badge_text, title, subtitle, code, theme, enabled, starts_at, ends_at,
      discount_type, discount_value, created_at, updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).bind(
    id,
    badge_text?.trim() || '',
    title.trim(),
    subtitle?.trim() || '',
    code?.trim() || '',
    theme || 'accent',
    enabled ? 1 : 0,
    starts_at || null,
    ends_at || null,
    discount_type || 'percent',
    Number(discount_value) || 0,
    now, now
  ).run();

  return json({ id }, 201);
}
