// Razorpay Webhook — handles payment.captured events
// Configure in Razorpay dashboard → Webhooks → Add new → URL: https://bespokedeploy.in/webhook/razorpay
// Events to subscribe: payment.captured, payment_link.paid

import { json, err, cors } from '../_shared/auth.js';
import { getBooking, updateStatus, listBookings } from '../_shared/db.js';
import { notify } from '../_shared/notify.js';

async function verifySignature(body, signature, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(body));
  const computed = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2,'0')).join('');
  return computed === signature;
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors() });
}

export async function onRequestPost({ request, env }) {
  const rawBody  = await request.text();
  const sig      = request.headers.get('x-razorpay-signature') || '';

  if (env.RAZORPAY_WEBHOOK_SECRET) {
    const valid = await verifySignature(rawBody, sig, env.RAZORPAY_WEBHOOK_SECRET);
    if (!valid) return err('Invalid signature', 401);
  }

  const payload = JSON.parse(rawBody);
  const event   = payload.event;

  // payment_link.paid — final payment received
  if (event === 'payment_link.paid') {
    const plink   = payload.payload?.payment_link?.entity;
    const payment = payload.payload?.payment?.entity;
    if (!plink) return json({ ok: true });

    const bookingId    = plink.notes?.booking_id;
    const finalPayId   = payment?.id;

    if (bookingId) {
      const booking = await getBooking(env.DB, bookingId);
      if (booking && booking.status === 'awaiting_payment') {
        await updateStatus(env.DB, bookingId, 'review', { final_payment_id: finalPayId });
        const updated = { ...booking, status: 'review', final_payment_id: finalPayId };
        notify(env, updated, 'review').catch(console.error);
      }
    }
    return json({ ok: true });
  }

  return json({ ok: true, ignored: event });
}
