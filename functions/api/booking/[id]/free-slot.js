// POST /api/booking/[id]/free-slot — admin only.
// Manually frees a booking's capacity slot early (e.g. project effectively
// wrapped up ahead of the usual 14-day window) so new work can be taken on,
// without needing to change the booking's status.
import { json, err, requireAdmin, cors } from '../../../_shared/auth.js';
import { getBooking, freeSlot } from '../../../_shared/db.js';

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors() });
}

export async function onRequestPost({ request, env, params }) {
  if (!await requireAdmin(request, env)) return err('Unauthorized', 401);

  const booking = await getBooking(env.DB, params.id);
  if (!booking) return err('Booking not found', 404);
  if (booking.slot_freed_at) return err('This slot is already free');

  await freeSlot(env.DB, params.id);
  return json({ ok: true });
}
