// POST /api/validate-promo — public: lets the checkout UI preview a discount
// before payment. Recalculates the plan+addon total from live D1 settings
// (never trusts a client-supplied total) and applies the promo's discount
// the exact same way create-order.js and bookings.js do, so what the customer
// sees here always matches what they're actually charged.
import { json, err, cors } from '../_shared/auth.js';
import { getSettings } from '../_shared/settings.js';
import { getPromoByCode, applyDiscount } from '../_shared/promo.js';

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors() });
}

export async function onRequestPost({ request, env }) {
  try {
    const { code, plan_id, addon_ids = [] } = await request.json().catch(() => ({}));
    if (!code?.trim()) return err('Enter a promo code');
    if (!plan_id) return err('plan_id required');

    const settings = await getSettings(env.DB);
    if (!settings[`plans.${plan_id}.enabled`]) return err('This plan is currently unavailable');

    const base = settings[`plans.${plan_id}.price`];
    if (!base) return err('Invalid plan_id');

    const addonsTotal = addon_ids.reduce((sum, id) => {
      if (!settings[`addons.${id}.enabled`]) return sum;
      return sum + (settings[`addons.${id}.price`] || 0);
    }, 0);
    const originalTotal = base + addonsTotal;

    const promo = await getPromoByCode(env.DB, code);
    if (!promo) return err('That code is invalid or has expired');

    const { total, discount_amount } = applyDiscount(originalTotal, promo);
    if (discount_amount <= 0) return err('That code doesn’t apply a discount right now');

    const threshold = settings['general.advance_threshold'] ?? 15000;
    const pct_low    = settings['general.advance_pct_low']  ?? 0.2;
    const pct_high   = settings['general.advance_pct_high'] ?? 0.3;
    const advance    = Math.round(total * (total < threshold ? pct_low : pct_high));
    const balance    = total - advance;

    return json({
      valid: true,
      code: promo.code,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      discount_amount,
      original_total: originalTotal,
      total, advance, balance,
    });
  } catch (e) {
    console.error('[validate-promo] error:', e?.message || e);
    return err('Could not validate that code right now', 500);
  }
}
