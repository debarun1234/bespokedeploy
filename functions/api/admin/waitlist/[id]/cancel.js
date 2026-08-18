// POST /api/admin/waitlist/[id]/cancel — admin only. Removes an entry from the
// active waiting list (customer withdrew, no longer interested, etc.).
import { json, err, requireAdmin, cors } from '../../../../_shared/auth.js';

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors() });
}

export async function onRequestPost({ request, env, params }) {
  if (!await requireAdmin(request, env)) return err('Unauthorized', 401);

  const now = new Date().toISOString();
  const res = await env.DB.prepare(
    `UPDATE waitlist SET status = 'cancelled', updated_at = ? WHERE id = ?`
  ).bind(now, params.id).run();

  if (!res.meta?.changes) return err('Waitlist entry not found', 404);
  return json({ ok: true });
}
