import { json, err, requireAdmin, cors } from '../../_shared/auth.js';
import { getMetrics } from '../../_shared/db.js';

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors() });
}

export async function onRequestGet({ request, env }) {
  if (!await requireAdmin(request, env)) return err('Unauthorized', 401);
  const metrics = await getMetrics(env.DB);
  return json(metrics);
}
