// ─── Site settings — D1-backed key/value store ───────────────────────────────
// Keys are dot-notation strings e.g. "plans.portfolio.price"
// Values are stored as JSON strings

export const DEFAULTS = {
  // Plans
  'plans.portfolio.price':   6500,
  'plans.portfolio.enabled': true,
  'plans.starter.price':     12000,
  'plans.starter.enabled':   true,
  'plans.pro.price':         22000,
  'plans.pro.enabled':       true,
  // Addons — Portfolio
  'addons.p_blog.price': 700,     'addons.p_blog.enabled': true,
  'addons.p_testi.price': 250,    'addons.p_testi.enabled': true,
  'addons.p_logo.price': 800,     'addons.p_logo.enabled': true,
  'addons.p_pdf.price': 200,      'addons.p_pdf.enabled': true,
  'addons.p_animate.price': 500,  'addons.p_animate.enabled': true,
  'addons.p_darkmode.price': 400, 'addons.p_darkmode.enabled': true,
  // Addons — Starter
  'addons.s_payment.price': 2000,    'addons.s_payment.enabled': true,
  'addons.s_blog.price': 1200,       'addons.s_blog.enabled': true,
  'addons.s_gallery.price': 600,     'addons.s_gallery.enabled': true,
  'addons.s_booking.price': 2000,    'addons.s_booking.enabled': true,
  'addons.s_newsletter.price': 400,  'addons.s_newsletter.enabled': true,
  'addons.s_logo.price': 1200,       'addons.s_logo.enabled': true,
  'addons.s_gbp.price': 800,         'addons.s_gbp.enabled': true,
  'addons.s_chat.price': 500,        'addons.s_chat.enabled': true,
  'addons.s_speed.price': 700,       'addons.s_speed.enabled': true,
  'addons.s_ai.price': 3500,         'addons.s_ai.enabled': true,
  // Addons — Pro
  'addons.pro_booking.price': 1500,   'addons.pro_booking.enabled': true,
  'addons.pro_ecom.price': 3000,      'addons.pro_ecom.enabled': true,
  'addons.pro_cart.price': 2500,      'addons.pro_cart.enabled': true,
  'addons.pro_multilang.price': 1500, 'addons.pro_multilang.enabled': true,
  'addons.pro_logo.price': 2000,      'addons.pro_logo.enabled': true,
  'addons.pro_team.price': 700,       'addons.pro_team.enabled': true,
  'addons.pro_faq.price': 500,        'addons.pro_faq.enabled': true,
  'addons.pro_chat.price': 500,       'addons.pro_chat.enabled': true,
  'addons.pro_darkmode.price': 700,   'addons.pro_darkmode.enabled': true,
  'addons.pro_ai.price': 4500,        'addons.pro_ai.enabled': true,
  // General — two-tier advance: small plans (<15000) get lower %, large plans get higher %
  'general.advance_pct_low':  0.2,   // Portfolio plan (< ₹15,000)
  'general.advance_pct_high': 0.3,   // Small Website & Pro (≥ ₹15,000)
  'general.advance_threshold': 15000, // Amount boundary between tiers
  'general.email':        'debarun.ghosh.2024@gmail.com',
  'general.whatsapp':     '',
  // Payment test mode — when true, checkout is a walkthrough only: no Razorpay
  // checkout opens, no order/booking is created, no emails are sent.
  'general.demo_mode':    false,
  // Capacity — max concurrent projects you can take on at once (solo dev workload limit)
  'capacity.max_slots':          2,
  'capacity.slot_duration_days': 14,
  // Hero content
  'hero.tagline':  '🚀 Custom websites · Free hosting · Built in 5-7 days',
  'hero.subtitle': 'Affordable custom websites for small businesses, professionals & students in India — transparent pricing from ₹6,500, zero monthly fees, delivered in 5-7 days.',
  'hero.cta':      'See Plans & Pricing',
};

// Fetch all settings from D1, merged with defaults
export async function getSettings(db) {
  const rows = await db.prepare('SELECT key, value FROM site_settings').all();
  const overrides = {};
  for (const row of rows.results || []) {
    try { overrides[row.key] = JSON.parse(row.value); } catch { overrides[row.key] = row.value; }
  }
  return { ...DEFAULTS, ...overrides };
}

// Write a single key to D1
export async function setSetting(db, key, value) {
  const now = new Date().toISOString();
  await db.prepare(
    'INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at'
  ).bind(key, JSON.stringify(value), now).run();
}

// Build structured settings object for API response
export function structureSettings(flat) {
  const plans = {};
  for (const id of ['portfolio', 'starter', 'pro']) {
    plans[id] = {
      price:   flat[`plans.${id}.price`],
      enabled: flat[`plans.${id}.enabled`],
    };
  }

  const addonIds = [
    'p_blog','p_testi','p_logo','p_pdf','p_animate','p_darkmode',
    's_payment','s_blog','s_gallery','s_booking','s_newsletter','s_logo','s_gbp','s_chat','s_speed','s_ai',
    'pro_booking','pro_ecom','pro_cart','pro_multilang','pro_logo','pro_team','pro_faq','pro_chat','pro_darkmode','pro_ai',
  ];
  const addons = {};
  for (const id of addonIds) {
    addons[id] = {
      price:   flat[`addons.${id}.price`],
      enabled: flat[`addons.${id}.enabled`],
    };
  }

  return {
    plans,
    addons,
    general: {
      advance_pct_low:   flat['general.advance_pct_low'],
      advance_pct_high:  flat['general.advance_pct_high'],
      advance_threshold: flat['general.advance_threshold'],
      email:             flat['general.email'],
      whatsapp:          flat['general.whatsapp'],
      demo_mode:         flat['general.demo_mode'],
    },
    capacity: {
      max_slots:          flat['capacity.max_slots'],
      slot_duration_days: flat['capacity.slot_duration_days'],
    },
    hero: {
      tagline:  flat['hero.tagline'],
      subtitle: flat['hero.subtitle'],
      cta:      flat['hero.cta'],
    },
  };
}

// Hash password with SHA-256
export async function hashPassword(password) {
  const buf  = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
