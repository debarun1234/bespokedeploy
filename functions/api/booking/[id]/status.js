import { json, err, requireAdmin, cors } from '../../../_shared/auth.js';
import { getBooking, updateStatus } from '../../../_shared/db.js';
import { notify } from '../../../_shared/notify.js';

const VALID_TRANSITIONS = {
  new:              ['contacting', 'cancelled'],
  contacting:       ['in_progress', 'cancelled'],
  in_progress:      ['cancelled'],        // payment link flow → awaiting_payment
  awaiting_payment: ['review', 'cancelled'], // admin confirms payment received manually
  review:           ['complete', 'cancelled'],
  complete:         [],
  cancelled:        [],
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors() });
}

export async function onRequestPatch({ request, env, params }) {
  if (!await requireAdmin(request, env)) return err('Unauthorized', 401);

  const { status, cancel_reason } = await request.json().catch(() => ({}));
  if (!status) return err('status required');

  const booking = await getBooking(env.DB, params.id);
  if (!booking) return err('Booking not found', 404);

  const allowed = VALID_TRANSITIONS[booking.status] || [];
  if (!allowed.includes(status)) {
    return err(`Cannot transition from '${booking.status}' to '${status}'`);
  }

  const extra = status === 'cancelled' ? { cancel_reason: cancel_reason || 'Cancelled by admin' } : {};
  await updateStatus(env.DB, params.id, status, extra);

  const updated = { ...booking, status, ...extra };
  let emailDebug = { attempted: false, error: null };
  try {
    await notify(env, updated, status);
    emailDebug.attempted = true;
  } catch (e) {
    emailDebug.attempted = true;
    emailDebug.error = e?.message || String(e);
  }

  return json({ ok: true, id: params.id, status, _email_debug: emailDebug });
}
