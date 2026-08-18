import { json, err, requireAdmin, cors } from '../_shared/auth.js';
import { createBooking, listBookings } from '../_shared/db.js';
import { notify } from '../_shared/notify.js';
import { getSettings } from '../_shared/settings.js';
import { getCapacityStatus, checkInviteBypass } from '../_shared/capacity.js';
import { getPromoByCode, applyDiscount } from '../_shared/promo.js';

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors() });
}

// ── Verify Razorpay payment signature ────────────────────────────────────────
async function verifySignature(order_id, payment_id, signature, secret) {
  const enc  = new TextEncoder();
  const key  = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig  = await crypto.subtle.sign('HMAC', key, enc.encode(`${order_id}|${payment_id}`));
  const hex  = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
  return hex === signature;
}

// GET /api/bookings — admin only
export async function onRequestGet({ request, env }) {
  if (!await requireAdmin(request, env)) return err('Unauthorized', 401);
  const status   = new URL(request.url).searchParams.get('status');
  const bookings = await listBookings(env.DB, status || null);
  return json(bookings);
}

// POST /api/bookings — public: called after advance payment succeeds
export async function onRequestPost({ request, env }) {
  // Top-level guard: never let an uncaught throw produce an opaque Cloudflare
  // HTML 502 page — the customer already paid, so this must always resolve
  // to a readable JSON response.
  try {
    return await handleCreateBooking(request, env);
  } catch (e) {
    console.error('[bookings] uncaught error:', e?.message || e, e?.stack);
    return err(`Server error: ${e?.message || 'unknown'}`, 500);
  }
}

async function handleCreateBooking(request, env) {
  const body = await request.json().catch(() => null);
  if (!body) return err('Invalid JSON');

  const {
    razorpay_order_id, razorpay_payment_id, razorpay_signature,
    plan_id, addon_ids = [],
    hosting, customer_name, customer_email, customer_phone,
    customer_city, customer_timing, customer_notes,
    invite_token, promo_code,
  } = body;

  // ── 1. Required fields ──────────────────────────────────────────────────────
  if (!razorpay_order_id)  return err('Missing razorpay_order_id');
  if (!razorpay_payment_id) return err('Missing razorpay_payment_id');
  if (!razorpay_signature) return err('Missing razorpay_signature');
  if (!plan_id)            return err('Missing plan_id');
  if (!customer_name)      return err('Missing customer_name');
  if (!customer_email)     return err('Missing customer_email');
  if (!customer_phone)     return err('Missing customer_phone');

  // ── 2. Verify Razorpay signature — rejects tampered payments ───────────────
  if (!env.RAZORPAY_KEY_SECRET) {
    console.error('[bookings] RAZORPAY_KEY_SECRET not set in environment');
    return err('Payment gateway is not configured. Please contact support.', 500);
  }
  const valid = await verifySignature(
    razorpay_order_id, razorpay_payment_id, razorpay_signature,
    env.RAZORPAY_KEY_SECRET.trim()
  );
  if (!valid) return err('Payment verification failed', 403);

  // ── 3. Recalculate price server-side using live D1 settings ──────────────────
  const settings = await getSettings(env.DB);
  const base = settings[`plans.${plan_id}.price`];
  if (!base) return err('Invalid plan_id');

  const addonsTotal = addon_ids.reduce((sum, id) => sum + (settings[`addons.${id}.price`] || 0), 0);
  const rawTotal  = base + addonsTotal;

  // Re-derive the same discount independently (never trust a client total) —
  // must match what create-order.js applied when the Razorpay order/charge
  // was created, so the stored booking reflects what was actually paid.
  let discountAmount = 0;
  let appliedPromoCode = null;
  if (promo_code) {
    const promo = await getPromoByCode(env.DB, promo_code);
    if (promo) {
      const applied = applyDiscount(rawTotal, promo);
      discountAmount = applied.discount_amount;
      if (discountAmount > 0) appliedPromoCode = promo.code;
    }
  }
  const total = rawTotal - discountAmount;

  const threshold = settings['general.advance_threshold'] ?? 15000;
  const pct_low   = settings['general.advance_pct_low']  ?? 0.2;
  const pct_high  = settings['general.advance_pct_high'] ?? 0.3;
  const advance   = Math.round(total * (total < threshold ? pct_low : pct_high));
  const balance = total - advance;
  const prices  = { total, advance, balance };

  const planName = { portfolio: 'Portfolio', starter: 'Small Website', pro: 'Pro Website' }[plan_id] || plan_id;

  const addonList = addon_ids
    .filter(id => settings[`addons.${id}.price`])
    .map(id => ({ id, price: settings[`addons.${id}.price`] }));

  const bookingData = {
    plan_id,
    plan_name:          planName,
    plan_price:         base,
    addons:             addonList,
    hosting:            hosting || 'cloudflare',
    total:              prices.total,
    advance:            prices.advance,
    balance:            prices.balance,
    customer_name,
    customer_email,
    customer_phone,
    customer_city:      customer_city || '',
    customer_timing:    customer_timing || '',
    customer_notes:     customer_notes || '',
    advance_payment_id: razorpay_payment_id,
    razorpay_order_id,
    promo_code:         appliedPromoCode,
    discount_amount:    discountAmount,
  };

  // Best-effort capacity check (payment already succeeded by this point — the
  // real gate is at /api/create-order — this just flags an over-capacity edge
  // case, e.g. a race between two simultaneous checkouts, for admin visibility).
  // Never let this — or the booking itself — fail just because the capacity
  // feature errors (e.g. DB migration not yet applied); the payment is real.
  let overCapacity = false;
  try {
    const cap = await getCapacityStatus(env.DB, settings);
    overCapacity = !cap.available && !(await checkInviteBypass(env.DB, invite_token));
  } catch (e) {
    console.error('[bookings] capacity check failed, continuing:', e?.message || e);
  }

  const slotDurationDays = settings['capacity.slot_duration_days'] ?? 14;

  let id;
  try {
    id = await createBooking(env.DB, bookingData, slotDurationDays);
  } catch (e) {
    console.error('[bookings] createBooking failed:', e?.message || e);
    return err('Booking could not be saved. Please contact support with your payment ID: ' + razorpay_payment_id, 500);
  }
  const booking = { ...bookingData, id };

  // If this booking came from a waitlist invite, mark that entry converted
  // so it stops occupying the waitlist / urgent-slot bookkeeping.
  if (invite_token) {
    try {
      const now = new Date().toISOString();
      await env.DB.prepare(`
        UPDATE waitlist SET status = 'converted', converted_booking_id = ?, updated_at = ?
        WHERE invite_token = ? AND status = 'notified'
      `).bind(id, now, invite_token).run();
    } catch (e) {
      console.error('[bookings] failed to mark waitlist converted:', e?.message || e);
    }
  }

  let emailDebug = { attempted: false, error: null };
  try {
    await notify(env, booking, 'booking_confirmed');
    emailDebug.attempted = true;
  } catch (e) {
    emailDebug.attempted = true;
    emailDebug.error = e?.message || String(e);
  }

  return json({ id, over_capacity: overCapacity, _email_debug: emailDebug }, 201);
}
