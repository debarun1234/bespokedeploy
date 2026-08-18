// ─── Edge middleware — dynamic pricing + promo SEO injection ─────────────────
// index.html ships with {{PRICE_...}} placeholders in its meta tags / JSON-LD
// (title, price properties, FAQ answer) instead of hardcoded numbers, plus a
// <!--PROMO_JSONLD--> marker. On every HTML document response we:
//   1. swap the price placeholders for live D1 prices, so if you change a
//      plan price in the admin dashboard, Google's structured data and the
//      meta description update automatically — no code deploy needed.
//   2. replace the promo marker with a live JSON-LD block describing the
//      currently active promotion (if any), so a limited-time offer is
//      visible to search crawlers, not just to visitors with JS enabled.
//
// Only runs against text/html responses (API routes return JSON and pass
// through untouched). Fails open: if anything goes wrong, the original
// response — still valid HTML with the built-in default prices, no promo
// block — is served.

import { getSettings } from './_shared/settings.js';

function fmt(n) {
  return Number(n).toLocaleString('en-IN');
}

const SITE_URL = 'https://bespokedeploy.in/';

async function getActivePromo(db) {
  const now = new Date().toISOString();
  const { results } = await db.prepare(`
    SELECT title, subtitle, code, starts_at, ends_at
    FROM promos
    WHERE enabled = 1
      AND (starts_at IS NULL OR starts_at <= ?)
      AND (ends_at   IS NULL OR ends_at   >= ?)
    ORDER BY created_at DESC
    LIMIT 1
  `).bind(now, now).all();
  return results?.[0] || null;
}

function buildPromoJsonLd(promo) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Offer',
    name: promo.title,
    description: promo.subtitle || promo.title,
    url: SITE_URL,
    priceCurrency: 'INR',
    availability: 'https://schema.org/InStock',
    seller: { '@type': 'Organization', name: 'BespokeDeploy.in', url: SITE_URL },
    ...(promo.starts_at ? { validFrom: promo.starts_at } : {}),
    ...(promo.ends_at   ? { priceValidUntil: promo.ends_at.slice(0, 10) } : {}),
    ...(promo.code      ? { identifier: promo.code } : {}),
  };
  return `<script type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n</script>`;
}

export async function onRequest(context) {
  const { next, env } = context;
  const response = await next();

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  try {
    const settings  = await getSettings(env.DB);
    const portfolio = settings['plans.portfolio.price'] ?? 6500;
    const starter   = settings['plans.starter.price']   ?? 12000;
    const pro       = settings['plans.pro.price']        ?? 22000;

    let promoBlock = '';
    try {
      const promo = await getActivePromo(env.DB);
      if (promo) promoBlock = buildPromoJsonLd(promo);
    } catch (e) {
      // promos table may not exist yet (migration 006 not applied) — just skip it
      console.error('[middleware] promo lookup failed, skipping promo JSON-LD:', e?.message || e);
    }

    let html = await response.text();
    html = html
      .replaceAll('{{PRICE_PORTFOLIO_RAW}}', String(portfolio))
      .replaceAll('{{PRICE_STARTER_RAW}}',   String(starter))
      .replaceAll('{{PRICE_PRO_RAW}}',       String(pro))
      .replaceAll('{{PRICE_PORTFOLIO}}',     fmt(portfolio))
      .replaceAll('{{PRICE_STARTER}}',       fmt(starter))
      .replaceAll('{{PRICE_PRO}}',           fmt(pro))
      .replace('<!--PROMO_JSONLD-->',        promoBlock);

    const headers = new Headers(response.headers);
    headers.delete('content-length'); // body length changed
    return new Response(html, { status: response.status, statusText: response.statusText, headers });
  } catch (e) {
    console.error('[middleware] price injection failed, serving default HTML:', e?.message || e);
    return response;
  }
}
