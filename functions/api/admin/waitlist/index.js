// GET /api/admin/waitlist — admin only. List waiting-list entries.
// Optional ?status= filter (waiting | notified | converted | cancelled).
// Urgent requests sort first, then oldest-first (fair queue order).
import { json, err, requireAdmin, cors } from '../../../_shared/auth.js';

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors() });
}

export async function onRequestGet({ request, env }) {
  if (!await requireAdmin(request, env)) return err('Unauthorized', 401);

  const status = new URL(request.url).searchParams.get('status');
  const query = status
    ? 'SELECT * FROM waitlist WHERE status = ? ORDER BY is_urgent DESC, created_at ASC'
    : 'SELECT * FROM waitlist ORDER BY is_urgent DESC, created_at ASC';
  const { results } = status
    ? await env.DB.prepare(query).bind(status).all()
    : await env.DB.prepare(query).all();

  return json(results || []);
}
