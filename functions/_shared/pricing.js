// ─── Server-side pricing — SINGLE SOURCE OF TRUTH ────────────────────────────
// Keep in sync with src/data/plans.js
// The client NEVER dictates amounts — we always recalculate here.

export const PLAN_PRICES = {
  portfolio: 6500,
  starter:   12000,
  pro:       22000,
};

export const ADDON_PRICES = {
  // Portfolio
  p_blog: 700, p_testi: 250, p_logo: 800, p_pdf: 200, p_animate: 500, p_darkmode: 400,
  // Starter
  s_payment: 2000, s_blog: 1200, s_gallery: 600, s_booking: 2000, s_newsletter: 400,
  s_logo: 1200, s_gbp: 800, s_chat: 500, s_speed: 700, s_ai: 3500,
  // Pro
  pro_booking: 1500, pro_ecom: 3000, pro_cart: 2500, pro_multilang: 1500,
  pro_logo: 2000, pro_team: 700, pro_faq: 500, pro_chat: 500, pro_darkmode: 700, pro_ai: 4500,
};

export const ADVANCE_PCT = 0.3; // 30%

export function calculateTotal(plan_id, addon_ids = []) {
  const base = PLAN_PRICES[plan_id];
  if (!base) return null;
  const addonsTotal = addon_ids.reduce((sum, id) => sum + (ADDON_PRICES[id] || 0), 0);
  const total   = base + addonsTotal;
  const advance = Math.round(total * ADVANCE_PCT);
  const balance = total - advance;
  return { total, advance, balance };
}
