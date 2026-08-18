// ─── Promo code lookup + discount math — SINGLE SOURCE OF TRUTH ─────────────
// Used identically by /api/validate-promo (pre-payment preview), /api/create-order
// (sets the actual Razorpay order amount), and /api/bookings (what gets stored
// after payment). The client only ever sends a code string — the discount
// amount is always recomputed here from the live DB row, never trusted from
// the browser.

export async function getPromoByCode(db, rawCode) {
  const code = (rawCode || '').trim().toUpperCase();
  if (!code) return null;

  const now = new Date().toISOString();
  const { results } = await db.prepare(`
    SELECT * FROM promos
    WHERE UPPER(code) = ?
      AND code <> ''
      AND enabled = 1
      AND (starts_at IS NULL OR starts_at <= ?)
      AND (ends_at   IS NULL OR ends_at   >= ?)
    LIMIT 1
  `).bind(code, now, now).all();

  return results?.[0] || null;
}

// Returns { total, discount_amount } — total is always clamped to >= 0 and
// discount_amount can never exceed the original total.
export function applyDiscount(total, promo) {
  if (!promo) return { total, discount_amount: 0 };

  let discount = 0;
  if (promo.discount_type === 'percent') {
    discount = Math.round(total * (Number(promo.discount_value) / 100));
  } else if (promo.discount_type === 'flat') {
    discount = Math.round(Number(promo.discount_value));
  }
  discount = Math.max(0, Math.min(discount, total));

  return { total: total - discount, discount_amount: discount };
}
