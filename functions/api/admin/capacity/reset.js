// POST /api/admin/capacity/reset — admin only.
// "Reset counter" — force-frees every currently occupied slot immediately.
// Emergency override for when the count looks stuck or wrong.
import { json, err, requireAdmin, cors } from '../../../_shared/auth.js';
import { resetAllSlots } from '../../../_shared/db.js';

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors() });
}

export async function onRequestPost({ request, env }) {
  if (!await requireAdmin(request, env)) return err('Unauthorized', 401);
  await resetAllSlots(env.DB);
  return json({ ok: true });
}
