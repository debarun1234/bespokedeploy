// GET /api/admin/settings  — get all settings
// PATCH /api/admin/settings — update one or more keys
import { json, err, requireAdmin, cors } from '../../_shared/auth.js';
import { getSettings, setSetting, structureSettings } from '../../_shared/settings.js';

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors() });
}

export async function onRequestGet({ request, env }) {
  if (!await requireAdmin(request, env)) return err('Unauthorized', 401);
  const flat = await getSettings(env.DB);
  return json(structureSettings(flat));
}

export async function onRequestPatch({ request, env }) {
  if (!await requireAdmin(request, env)) return err('Unauthorized', 401);
  const updates = await request.json().catch(() => null);
  if (!updates || typeof updates !== 'object') return err('Invalid JSON');

  // updates is a flat key-value object e.g. { "plans.portfolio.price": 7000, ... }
  for (const [key, value] of Object.entries(updates)) {
    await setSetting(env.DB, key, value);
  }

  const flat = await getSettings(env.DB);
  return json({ ok: true, settings: structureSettings(flat) });
}
