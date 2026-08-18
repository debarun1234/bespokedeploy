// PATCH  /api/admin/feedback/[id] — admin only. Approve/unapprove, feature/unfeature.
// DELETE /api/admin/feedback/[id] — admin only. Remove a submission (e.g. spam).
import { json, err, requireAdmin, cors } from '../../../_shared/auth.js';

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors() });
}

export async function onRequestPatch({ request, env, params }) {
  if (!await requireAdmin(request, env)) return err('Unauthorized', 401);

  const body = await request.json().catch(() => ({}));
  const { approved, featured } = body;

  const sets = [];
  const vals = [];
  if (approved !== undefined) { sets.push('approved = ?'); vals.push(approved ? 1 : 0); }
  if (featured !== undefined) { sets.push('featured = ?'); vals.push(featured ? 1 : 0); }
  if (!sets.length) return err('Nothing to update');

  sets.push('updated_at = ?');
  vals.push(new Date().toISOString());
  vals.push(params.id);

  await env.DB.prepare(`UPDATE feedback SET ${sets.join(', ')} WHERE id = ?`).bind(...vals).run();
  return json({ ok: true });
}

export async function onRequestDelete({ request, env, params }) {
  if (!await requireAdmin(request, env)) return err('Unauthorized', 401);
  await env.DB.prepare('DELETE FROM feedback WHERE id = ?').bind(params.id).run();
  return json({ ok: true });
}
