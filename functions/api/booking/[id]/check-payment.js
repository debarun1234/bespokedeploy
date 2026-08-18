// POST /api/booking/[id]/check-payment
// Queries Razorpay API for the payment link status.
// If status === 'paid', auto-transitions booking to 'review' and emails the customer.
// Used in dev/test mode where webhooks can't reach localhost.

import { json, err, requireAdmin, cors } from '../../../_shared/auth.js';
import { getBooking, updateStatus } from '../../../_shared/db.js';
import { notify } from '../../../_shared/notify.js';

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors() });
}

export async function onRequestPost({ request, env, params }) {
  if (!await requireAdmin(request, env)) return err('Unauthorized', 401);

  const booking = await getBooking(env.DB, params.id);
  if (!booking) return err('Booking not found', 404);

  if (booking.status !== 'awaiting_payment') {
    return json({ ok: true, already: true, status: booking.status, message: `Booking is already '${booking.status}'` });
  }

  if (!booking.final_payment_link_id) {
    return err('No payment link found for this booking. Send a payment link first.');
  }

  // Query Razorpay for the payment link status
  const auth = 'Basic ' + btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
  let rzpData;
  try {
    const res = await fetch(
      `https://api.razorpay.com/v1/payment_links/${booking.final_payment_link_id}`,
      { headers: { Authorization: auth } }
    );
    if (!res.ok) {
      const e = await res.text();
      return err(`Razorpay API error (${res.status}): ${e}`, 502);
    }
    rzpData = await res.json();
  } catch (e) {
    return err(`Network error querying Razorpay: ${e.message}`, 502);
  }

  const rzpStatus = rzpData.status; // 'created' | 'partially_paid' | 'paid' | 'expired' | 'cancelled'

  if (rzpStatus !== 'paid') {
    return json({
      ok:      false,
      paid:    false,
      rzp_status: rzpStatus,
      message: `Payment link status is '${rzpStatus}' — payment not yet received.`,
    });
  }

  // Payment confirmed — extract the payment ID from Razorpay's payments array
  const payments     = rzpData.payments || [];
  const lastPayment  = payments.find(p => p.payment?.entity?.status === 'captured') || payments[0];
  const finalPayId   = lastPayment?.payment?.entity?.id || null;

  // Transition to review
  await updateStatus(env.DB, params.id, 'review', { final_payment_id: finalPayId });
  const updated = { ...booking, status: 'review', final_payment_id: finalPayId };
  notify(env, updated, 'review').catch(console.error);

  return json({
    ok:      true,
    paid:    true,
    rzp_status: rzpStatus,
    final_payment_id: finalPayId,
    message: 'Payment confirmed ✅ — booking moved to Review, customer notified.',
  });
}
