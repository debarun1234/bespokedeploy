import { json, err, requireAdmin, cors } from '../../../_shared/auth.js';
import { getBooking } from '../../../_shared/db.js';

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors() });
}

export async function onRequestGet({ request, env, params }) {
  if (!await requireAdmin(request, env)) return err('Unauthorized', 401);
  const booking = await getBooking(env.DB, params.id);
  if (!booking) return err('Booking not found', 404);
  return json(booking);
}

export async function onRequestDelete({ request, env, params }) {
  if (!await requireAdmin(request, env)) return err('Unauthorized', 401);
  const booking = await getBooking(env.DB, params.id);
  if (!booking) return err('Booking not found', 404);
  await env.DB.prepare('DELETE FROM bookings WHERE id = ?').bind(params.id).run();
  return json({ ok: true, id: params.id });
}
