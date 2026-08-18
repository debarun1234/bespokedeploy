// GET /api/booking/[id]/public
// Public endpoint — no auth required.
// Returns only safe, non-sensitive fields needed for the final payment confirmation page.

import { json, err, cors } from '../../../_shared/auth.js';
import { getBooking } from '../../../_shared/db.js';

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors() });
}

export async function onRequestGet({ env, params }) {
  const booking = await getBooking(env.DB, params.id);
  if (!booking) return err('Booking not found', 404);

  // Only expose fields the customer already knows / sees on the payment page
  return json({
    id:            booking.id,
    customer_name: booking.customer_name,
    plan_name:     booking.plan_name,
    total:         booking.total,
    advance:       booking.advance,
    balance:       booking.balance,
    status:        booking.status,
  });
}
