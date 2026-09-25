// POST /api/admin/custom-addons — admin only. Create a new add-on that wasn't
// hand-coded into src/data/plans.js. Lives entirely in the site_settings
// key/value store (no new table): price/enabled reuse the same
// 'addons.<id>.price' / 'addons.<id>.enabled' keys the built-in add-ons use
// (so create-order.js / bookings.js validate it with zero code changes),
// and the display metadata lives under 'custom_addons.<id>.*'.
import { json, err, requireAdmin, cors } from '../../../_shared/auth.js';
import { getSettings, setSetting } from '../../../_shared/settings.js';

const PLAN_IDS = ['portfolio', 'starter', 'pro'];

function generateAddonId() {
  const rand = Math.random().toString(36).slice(2, 8);
  return `c_${Date.now().toString(36)}${rand}`;
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors() });
}

export async function onRequestPost({ request, env }) {
  if (!await requireAdmin(request, env)) return err('Unauthorized', 401);

  const body = await request.json().catch(() => null);
  if (!body) return err('Invalid JSON');

  const { plan_id, name, desc, price } = body;
  if (!PLAN_IDS.includes(plan_id)) return err(`plan_id must be one of: ${PLAN_IDS.join(', ')}`);
  if (!name?.trim()) return err('Name is required');
  if (price === undefined || isNaN(Number(price)) || Number(price) < 0) return err('Price must be a non-negative number');

  const id = generateAddonId();

  await setSetting(env.DB, `addons.${id}.price`, Math.round(Number(price)));
  await setSetting(env.DB, `addons.${id}.enabled`, true);
  await setSetting(env.DB, `custom_addons.${id}.name`, name.trim());
  await setSetting(env.DB, `custom_addons.${id}.desc`, desc?.trim() || '');
  await setSetting(env.DB, `custom_addons.${id}.plan_id`, plan_id);

  const flat = await getSettings(env.DB);
  const ids = Array.isArray(flat['custom_addons._ids']) ? flat['custom_addons._ids'] : [];
  await setSetting(env.DB, 'custom_addons._ids', [...ids, id]);

  return json({ id }, 201);
}
