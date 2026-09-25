// DELETE /api/admin/custom-addons/[id] — admin only. Permanently removes an
// admin-created add-on: drops it from the _ids index and deletes its
// underlying keys. Existing bookings that already used this add-on keep
// their own stored {id, name, price} snapshot (see bookings.js), so past
// receipts/admin views stay readable even after deletion.
//
// Price/enabled edits for a custom add-on go through the existing
// PATCH /api/admin/settings (same 'addons.<id>.price' / '.enabled' keys as
// the built-in add-ons) — this route only handles create-time-only fields
// (name/desc/plan) via delete + recreate, kept deliberately simple.
import { json, err, requireAdmin, cors } from '../../../_shared/auth.js';
import { getSettings, setSetting, deleteSetting } from '../../../_shared/settings.js';

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors() });
}

export async function onRequestDelete({ request, env, params }) {
  if (!await requireAdmin(request, env)) return err('Unauthorized', 401);

  const { id } = params;
  const flat = await getSettings(env.DB);
  const ids = Array.isArray(flat['custom_addons._ids']) ? flat['custom_addons._ids'] : [];
  if (!ids.includes(id)) return err('Add-on not found', 404);

  await setSetting(env.DB, 'custom_addons._ids', ids.filter(x => x !== id));
  await deleteSetting(env.DB, `addons.${id}.price`);
  await deleteSetting(env.DB, `addons.${id}.enabled`);
  await deleteSetting(env.DB, `custom_addons.${id}.name`);
  await deleteSetting(env.DB, `custom_addons.${id}.desc`);
  await deleteSetting(env.DB, `custom_addons.${id}.plan_id`);

  return json({ ok: true });
}
