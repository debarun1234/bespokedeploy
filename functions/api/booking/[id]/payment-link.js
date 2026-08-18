// Create Razorpay Payment Link for final balance payment
// Razorpay's own notify.email + notify.sms sends payment link to customer automatically
// We also send our branded email + WhatsApp on top

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
  if (booking.status !== 'in_progress') return err('Booking must be in_progress to send payment link');

  const auth   = 'Basic ' + btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
  const origin = new URL(request.url).origin;

  // Build callback URL — embed booking data so the success page renders without an API call
  const cbParams = new URLSearchParams({
    payment: 'final',
    booking: booking.id,
    total:   booking.total,
    balance: booking.balance,
    plan:    booking.plan_name,
    name:    booking.customer_name,
  });

  const rzpRes = await fetch('https://api.razorpay.com/v1/payment_links', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': auth },
    body: JSON.stringify({
      amount:      booking.balance * 100,
      currency:    'INR',
      description: `${booking.plan_name} Website — Final Payment | ${booking.id}`,
      customer: {
        name:    booking.customer_name,
        email:   booking.customer_email,
        contact: booking.customer_phone,
      },
      notify:          { sms: true, email: true },
      reminder_enable: true,
      notes:           { booking_id: booking.id, plan: booking.plan_name },
      callback_url:    `${origin}/?${cbParams.toString()}`,
      callback_method: 'get',
    }),
  });

  if (!rzpRes.ok) {
    const e = await rzpRes.json().catch(() => ({}));
    return err(`Razorpay error: ${e?.error?.description || rzpRes.statusText}`, 502);
  }

  const link = await rzpRes.json();
  const extra = {
    final_payment_link_id: link.id,
    final_payment_link:    link.short_url,
  };
  await updateStatus(env.DB, params.id, 'awaiting_payment', extra);

  // Send our branded notification (email + WhatsApp) with the payment link
  const updated = { ...booking, ...extra, status: 'awaiting_payment' };
  let emailDebug = { attempted: false, error: null };
  try {
    await notify(env, updated, 'final_payment');
    emailDebug.attempted = true;
  } catch (e) {
    emailDebug.attempted = true;
    emailDebug.error = e?.message || String(e);
  }

  return json({ ok: true, payment_link: link.short_url, link_id: link.id, _email_debug: emailDebug });
}
