// GET /api/admin/feedback — admin only. List all feedback (pending + approved).
import { json, err, requireAdmin, cors } from '../../../_shared/auth.js';

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors() });
}

export async function onRequestGet({ request, env }) {
  if (!await requireAdmin(request, env)) return err('Unauthorized', 401);

  const { results } = await env.DB.prepare(
    'SELECT * FROM feedback ORDER BY created_at DESC'
  ).all();

  return json(results || []);
}
