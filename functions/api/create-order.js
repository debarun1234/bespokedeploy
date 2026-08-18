// POST /api/create-order
// Creates a Razorpay order server-side so the amount cannot be tampered with client-side.

import { json, err, cors } from '../_shared/auth.js';
import { getSettings } from '../_shared/settings.js';
import { getCapacityStatus, checkInviteBypass } from '../_shared/capacity.js';
import { getPromoByCode, applyDiscount } from '../_shared/promo.js';

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors() });
}

export async function onRequestPost({ request, env }) {
  // Top-level guard: ANY uncaught throw in here would otherwise produce an
  // opaque Cloudflare HTML 502 page instead of JSON, which breaks the
  // frontend's res.json() call. Always resolve to a real JSON response.
  try {
    return await handleCreateOrder(request, env);
  } catch (e) {
    console.error('[create-order] uncaught error:', e?.message || e, e?.stack);
    return err(`Server error: ${e?.message || 'unknown'}`, 500);
  }
}

async function handleCreateOrder(request, env) {
  const { plan_id, addon_ids = [], invite_token, promo_code } = await request.json().catch(() => ({}));
  if (!plan_id) return err('plan_id required');

  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    console.error('[create-order] RAZORPAY_KEY_ID/SECRET not set in environment');
    return err('Payment gateway is not configured. Please contact support.', 500);
  }

  // Load live prices from D1 (admin may have updated them)
  const settings = await getSettings(env.DB);

  // Capacity gate — at most `capacity.max_slots` active projects at once.
  // A valid, non-expired waitlist invite token lets that specific customer through.
  // Fail OPEN if the capacity check itself errors (e.g. DB migration not yet
  // applied) — a broken capacity feature should never block real payments.
  try {
    const cap = await getCapacityStatus(env.DB, settings);
    if (!cap.available) {
      const bypass = await checkInviteBypass(env.DB, invite_token);
      if (!bypass) return err('Fully booked right now — please join the waiting list.', 409);
    }
  } catch (e) {
    console.error('[create-order] capacity check failed, allowing through:', e?.message || e);
  }

  if (!settings[`plans.${plan_id}.enabled`]) return err('This plan is currently unavailable');

  const base = settings[`plans.${plan_id}.price`];
  if (!base) return err('Invalid plan_id');

  const addonsTotal = addon_ids.reduce((sum, id) => {
    if (!settings[`addons.${id}.enabled`]) return sum; // skip disabled addons
    return sum + (settings[`addons.${id}.price`] || 0);
  }, 0);

  const rawTotal  = base + addonsTotal;

  // Promo discount — looked up fresh from D1 by code, never trusted from the
  // client. If the code is invalid/expired/disabled, we silently proceed at
  // full price rather than blocking the payment over a bad code.
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
  const prices  = { total, advance, balance, discount_amount: discountAmount, promo_code: appliedPromoCode };

  // Create Razorpay order — amount is set on the server, not trusted from client
  // Strip stray whitespace/newlines that can sneak in via `wrangler secret put` paste
  const keyId     = env.RAZORPAY_KEY_ID.trim();
  const keySecret = env.RAZORPAY_KEY_SECRET.trim();
  const auth = btoa(`${keyId}:${keySecret}`);

  const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount:   prices.advance * 100, // paise — set by server
      currency: 'INR',
      receipt:  `bd_${Date.now()}`,
      notes:    { plan_id, addon_ids: addon_ids.join(','), promo_code: appliedPromoCode || '', discount_amount: discountAmount },
    }),
  });

  if (!rzpRes.ok) {
    const e = await rzpRes.json().catch(() => ({}));
    const msg = e?.error?.description || e?.error?.code || JSON.stringify(e) || rzpRes.statusText;
    console.error('[create-order] Razorpay error', rzpRes.status, msg, 'key_id:', keyId ? keyId.slice(0,12)+'…' : 'MISSING');
    return err(`Razorpay: ${msg}`, 502);
  }

  const order = await rzpRes.json();
  return json({ order_id: order.id, ...prices });
}
