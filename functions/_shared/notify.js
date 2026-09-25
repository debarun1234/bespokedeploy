// ─── Notifications — Email (Resend REST API) + WhatsApp (Meta Cloud API) ──────
//
// Email is sent via Resend (https://resend.com).
// Requires: RESEND_API_KEY secret + RESEND_FROM secret (e.g. "noreply@bespokedeploy.in")
// The "from" domain must be verified in Resend. Until your domain is verified,
// set RESEND_FROM=onboarding@resend.dev and RESEND_TO_OVERRIDE=your@email.com
// for testing (Resend only delivers to the address on file in sandbox mode).

const ADMIN_EMAIL = 'debarun.ghosh.2024@gmail.com';

function fmt(n) { return Number(n).toLocaleString('en-IN'); }

// ── Resend REST API ───────────────────────────────────────────────────────────
export async function sendEmail(env, { to, subject, html, replyTo, attachments }) {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) { throw new Error('RESEND_API_KEY not set in env'); }

  const from = env.RESEND_FROM || 'BespokeDeploy <onboarding@resend.dev>';
  const recipient = env.RESEND_TO_OVERRIDE || to;

  console.log(`[resend] → to:${recipient} | subject:${subject}`);
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from, to: recipient, reply_to: replyTo || ADMIN_EMAIL, subject, html,
        ...(attachments?.length ? { attachments } : {}),
      }),
    });
    const body = await res.text();
    if (!res.ok) {
      throw new Error(`Resend ${res.status}: ${body}`);
    }
  } catch (e) { throw e; }
}

// ── WhatsApp (Meta Cloud API) ─────────────────────────────────────────────────
async function sendWhatsApp(env, phone, templateName, components = []) {
  if (!env.WA_ACCESS_TOKEN || !env.WA_PHONE_NUMBER_ID) {
    console.log('[wa skip] WhatsApp env vars not set'); return;
  }
  const to = phone.replace(/\D/g, '');
  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${env.WA_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${env.WA_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'template', template: { name: templateName, language: { code: 'en' }, components } }),
      }
    );
    if (!res.ok) console.error('[wa error]', await res.text());
  } catch (e) { console.error('[wa error]', e.message); }
}

// ── Email HTML wrapper ────────────────────────────────────────────────────────
function wrap(body, { accentColor = '#2563EB', preheader = '' } = {}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>BespokeDeploy</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #EEF2F7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    .preheader { display: none; max-height: 0; overflow: hidden; mso-hide: all; }
    .outer { width: 100%; background: #EEF2F7; padding: 40px 16px; }
    .wrap { max-width: 600px; margin: 0 auto; }

    /* Header */
    .header { background: #ffffff; border-radius: 20px 20px 0 0; padding: 36px 40px; text-align: center; border: 1px solid #E2E8F0; border-bottom: 3px solid ${accentColor}; }
    .header img { height: 220px; width: auto; display: block; margin: 0 auto; }

    /* Hero band */
    .hero { background: #ffffff; padding: 36px 40px 28px; border-left: 1px solid #E2E8F0; border-right: 1px solid #E2E8F0; }
    .badge { display: inline-block; background: ${accentColor}12; color: ${accentColor}; font-size: 11.5px; font-weight: 700; padding: 5px 16px; border-radius: 30px; border: 1px solid ${accentColor}30; margin-bottom: 16px; letter-spacing: 0.04em; text-transform: uppercase; }
    .hero h1 { font-size: 26px; font-weight: 800; color: #0F172A; line-height: 1.25; margin-bottom: 10px; }
    .hero p { color: #64748B; font-size: 14.5px; line-height: 1.75; }

    /* Body */
    .body { background: #ffffff; padding: 0 40px 36px; border-left: 1px solid #E2E8F0; border-right: 1px solid #E2E8F0; }

    /* Booking ID */
    .bid-banner { background: #0F1117; border-radius: 14px; padding: 18px 22px; margin: 20px 0; display: table; width: 100%; }
    .bid-left { display: table-cell; vertical-align: middle; }
    .bid-right { display: table-cell; vertical-align: middle; text-align: right; font-size: 22px; }
    .bid-label { font-size: 10px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.12em; font-weight: 700; margin-bottom: 5px; }
    .bid-value { font-size: 20px; font-weight: 800; color: ${accentColor}; font-family: 'Courier New', monospace; letter-spacing: 0.06em; }

    /* Divider */
    .divider { border: none; border-top: 1px solid #F1F5F9; margin: 24px 0; }
    .section-label { font-size: 10.5px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 14px; }

    /* Detail grid */
    .grid { width: 100%; border-collapse: separate; border-spacing: 8px; margin-bottom: 8px; }
    .grid td { background: #F8FAFC; border: 1px solid #E9EEF4; border-radius: 10px; padding: 12px 14px; vertical-align: top; width: 50%; }
    .cell-label { font-size: 10px; color: #94A3B8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
    .cell-value { font-size: 14px; font-weight: 600; color: #0F172A; word-break: break-word; }
    .cell-full { width: 100% !important; }

    /* Payment summary */
    .pay-box { background: ${accentColor}07; border: 1px solid ${accentColor}22; border-radius: 14px; padding: 20px 22px; margin: 16px 0; }
    .pay-row { display: table; width: 100%; padding: 8px 0; border-bottom: 1px solid ${accentColor}12; font-size: 14px; color: #475569; }
    .pay-row:last-child { border-bottom: none; }
    .pay-row b { color: #0F172A; }
    .pay-row > span:first-child, .pay-row > b:first-child { display: table-cell; text-align: left; vertical-align: middle; padding-right: 14px; }
    .pay-row > span:last-child, .pay-row > b:last-child { display: table-cell; text-align: right; vertical-align: middle; white-space: nowrap; }
    .val-green { font-weight: 700; color: #059669; }
    .val-amber { font-weight: 700; color: #D97706; }
    .val-total { font-weight: 800; color: #0F172A; font-size: 20px; }
    .val-blue  { font-weight: 800; color: ${accentColor}; font-size: 20px; }

    /* Steps */
    .step-row { display: table; width: 100%; padding: 12px 0; border-bottom: 1px solid #F1F5F9; }
    .step-row:last-child { border-bottom: none; }
    .step-icon-cell { display: table-cell; width: 40px; vertical-align: top; padding-top: 1px; }
    .step-icon { width: 34px; height: 34px; background: ${accentColor}10; border: 1px solid ${accentColor}25; border-radius: 50%; text-align: center; line-height: 34px; font-size: 15px; }
    .step-body { display: table-cell; vertical-align: top; padding-left: 12px; }
    .step-title { font-size: 13.5px; font-weight: 700; color: #0F172A; margin-bottom: 3px; }
    .step-desc  { font-size: 12.5px; color: #64748B; line-height: 1.55; }

    /* CTA button */
    .cta-wrap { text-align: center; margin: 28px 0; }
    .cta-btn { display: inline-block; background: ${accentColor}; color: #ffffff !important; font-weight: 700; font-size: 15px; padding: 14px 36px; border-radius: 12px; text-decoration: none !important; letter-spacing: 0.01em; }

    /* Alert boxes */
    .alert-green { background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; padding: 14px 18px; font-size: 13px; color: #166534; line-height: 1.6; margin: 16px 0; }
    .alert-blue  { background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 12px; padding: 14px 18px; font-size: 13px; color: #1E40AF; line-height: 1.6; margin: 16px 0; }
    .alert-red   { background: #FEF2F2; border: 1px solid #FECACA; border-radius: 12px; padding: 14px 18px; font-size: 13px; color: #991B1B; line-height: 1.6; margin: 16px 0; }
    .alert-amber { background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 12px; padding: 14px 18px; font-size: 13px; color: #92400E; line-height: 1.6; margin: 16px 0; }

    /* Footer */
    .footer { background: #F8FAFC; border: 1px solid #E2E8F0; border-top: 3px solid #E2E8F0; border-radius: 0 0 20px 20px; padding: 22px 40px; text-align: center; }
    .footer p { font-size: 12px; color: #94A3B8; line-height: 1.8; }
    .footer a { color: ${accentColor}; text-decoration: none; font-weight: 600; }
    .footer .divider-footer { border-top: 1px solid #E2E8F0; margin: 14px 0; }

    @media only screen and (max-width: 500px) {
      .header, .hero, .body { padding-left: 20px !important; padding-right: 20px !important; }
      .hero h1 { font-size: 21px !important; }
      .grid td { display: block !important; width: 100% !important; margin-bottom: 8px; }
    }
  </style>
</head>
<body>
  <span class="preheader">${preheader}&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌</span>
  <div class="outer">
    <div class="wrap">
      <div class="header">
        <img src="https://bespokedeploy.in/main_logo_light.png" alt="BespokeDeploy" height="420" />
      </div>
      ${body}
      <div class="footer">
        <p>
          <a href="https://bespokedeploy.in">bespokedeploy.in</a> &nbsp;·&nbsp;
          <a href="mailto:debarun.ghosh.2024@gmail.com">debarun.ghosh.2024@gmail.com</a>
        </p>
        <div class="divider-footer"></div>
        <p style="font-size:11px;color:#CBD5E1">Questions? Reply to this email or WhatsApp us directly.<br>© 2025 BespokeDeploy. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ── Booking confirmed: full receipt to customer ───────────────────────────────
function buildConfirmationEmail(booking) {
  const {
    id, customer_name: name, plan_name, plan_id, plan_price,
    hosting, addons = [],
    total, advance, balance,
    advance_payment_id: paymentId,
    customer_timing, customer_notes, customer_city,
    promo_code, discount_amount,
  } = booking;

  const parsedAddons = typeof addons === 'string' ? JSON.parse(addons) : (addons || []);
  const hostingLabel = hosting === 'netlify' ? 'Netlify' : 'Cloudflare Pages';
  const planColor = plan_id === 'portfolio' ? '#059669' : plan_id === 'starter' ? '#2563EB' : '#9333EA';

  const addonRows = parsedAddons.map(a =>
    `<div class="pay-row"><span>+ ${a.name || a.id}</span><span>₹${fmt(a.price)}</span></div>`
  ).join('');

  // plan_price is the true undiscounted base price stored on the booking —
  // deriving it from `total` would be wrong once a promo discount has
  // already been subtracted from `total`.
  const basePrice = plan_price ?? (total - parsedAddons.reduce((s, a) => s + (a.price || 0), 0));
  const subtotal   = basePrice + parsedAddons.reduce((s, a) => s + (a.price || 0), 0);
  const hasDiscount = !!promo_code && discount_amount > 0;

  return wrap(`
    <div class="hero">
      <div class="badge">✅ Booking Confirmed</div>
      <h1>You're all set, ${name}!</h1>
      <p>Your advance payment has been received and your slot is locked in. Here's your full booking receipt.</p>
    </div>
    <div class="body">

      <div class="bid-banner">
        <div class="bid-left">
          <div class="bid-label">Your Booking ID</div>
          <div class="bid-value">${id}</div>
        </div>
        <div class="bid-right">🎉</div>
      </div>

      <hr class="divider">
      <div class="section-label">Plan & Project</div>

      <table class="grid" cellpadding="0" cellspacing="8" width="100%">
        <tr>
          <td><div class="cell-label">Plan</div><div class="cell-value" style="color:${planColor}">${plan_name}</div></td>
          <td><div class="cell-label">Hosting</div><div class="cell-value">${hosting === 'netlify' ? '🌿 Netlify' : '☁️ Cloudflare Pages'}</div></td>
        </tr>
        ${customer_city || customer_timing ? `<tr>
          ${customer_city ? `<td><div class="cell-label">Your City</div><div class="cell-value">${customer_city}</div></td>` : '<td></td>'}
          ${customer_timing ? `<td><div class="cell-label">Best Time to Call</div><div class="cell-value">${customer_timing}</div></td>` : '<td></td>'}
        </tr>` : ''}
        ${customer_notes ? `<tr><td colspan="2" class="cell-full"><div class="cell-label">Your Notes</div><div class="cell-value">${customer_notes}</div></td></tr>` : ''}
      </table>

      <hr class="divider">
      <div class="section-label">Payment Summary</div>

      <div class="pay-box">
        <div class="pay-row"><span>${plan_name} (base)</span><span>₹${fmt(basePrice)}</span></div>
        ${addonRows}
        ${hasDiscount ? `<div class="pay-row" style="padding-top:10px"><span>Subtotal</span><span>₹${fmt(subtotal)}</span></div>` : ''}
        ${hasDiscount ? `<div class="pay-row"><span>Promo <code style="font-family:monospace">${promo_code}</code> applied</span><span class="val-green">−₹${fmt(discount_amount)}</span></div>` : ''}
        <div class="pay-row" style="padding-top:10px"><b>Total</b><span class="val-total">₹${fmt(total)}</span></div>
        <div class="pay-row"><span>Advance paid now</span><span class="val-green">₹${fmt(advance)} ✓</span></div>
        <div class="pay-row"><span>Balance due on delivery</span><span class="val-amber">₹${fmt(balance)}</span></div>
      </div>

      ${paymentId ? `<p style="font-size:12px;color:#94A3B8;margin-bottom:20px">Razorpay Ref: <code style="font-family:monospace;background:#F1F5F9;padding:2px 8px;border-radius:4px">${paymentId}</code></p>` : ''}

      <hr class="divider">
      <div class="section-label">What Happens Next</div>

      <div class="step-row">
        <div class="step-icon-cell"><div class="step-icon">📞</div></div>
        <div class="step-body"><div class="step-title">I'll reach out within 24 hours</div><div class="step-desc">Expect a call or WhatsApp${customer_timing ? ` at your preferred time (${customer_timing})` : ''} to kick things off.</div></div>
      </div>
      <div class="step-row">
        <div class="step-icon-cell"><div class="step-icon">📋</div></div>
        <div class="step-body"><div class="step-title">Content & structure discussion</div><div class="step-desc">We agree on pages, content, images, and references you have in mind.</div></div>
      </div>
      <div class="step-row">
        <div class="step-icon-cell"><div class="step-icon">🛠️</div></div>
        <div class="step-body"><div class="step-title">Build phase</div><div class="step-desc">I build your site and share regular previews for feedback along the way.</div></div>
      </div>
      <div class="step-row">
        <div class="step-icon-cell"><div class="step-icon">🚀</div></div>
        <div class="step-body"><div class="step-title">Review & go live</div><div class="step-desc">2 free revision rounds. You approve. Site goes live on ${hostingLabel}.</div></div>
      </div>

      <div class="alert-green" style="margin-top:20px">
        <strong>Revision policy:</strong> First 2 rounds of changes after delivery are <strong>free</strong>. Further rounds are ₹500 each. The balance of <strong>₹${fmt(balance)}</strong> is due only after you're satisfied and approve the final site.
      </div>

      <p style="margin-top:20px;font-size:13px;color:#64748B">Save this email — your Booking ID <strong style="color:#0F172A;font-family:monospace">${id}</strong> is your reference for all future communication about this project.</p>
    </div>
  `, { accentColor: planColor, preheader: `Booking confirmed! Your ${plan_name} slot is locked in — Booking ID ${id}` });
}

// ── Admin notification email ──────────────────────────────────────────────────
function buildAdminNotificationEmail(booking) {
  const {
    id, customer_name: name, customer_email: email, customer_phone: phone,
    customer_city: city, customer_timing: timing, customer_notes: notes,
    plan_name, hosting, addons = [],
    total, advance, balance, advance_payment_id: paymentId,
    promo_code, discount_amount,
  } = booking;

  const parsedAddons = typeof addons === 'string' ? JSON.parse(addons) : (addons || []);
  const addonRows = parsedAddons.length
    ? parsedAddons.map(a => `<div class="pay-row"><span>+ ${a.name || a.id}</span><span>₹${fmt(a.price)}</span></div>`).join('')
    : '';
  const hasDiscount = !!promo_code && discount_amount > 0;

  return wrap(`
    <div class="hero">
      <div class="badge" style="background:#FFF7ED;color:#C2410C;border-color:#FED7AA">🔔 New Paid Booking</div>
      <h1>${name} booked a ${plan_name}!</h1>
      <p>Advance payment received. Action required within 24 hours.</p>
    </div>
    <div class="body">

      <div class="bid-banner">
        <div class="bid-left">
          <div class="bid-label">Booking ID</div>
          <div class="bid-value" style="color:#F97316">${id}</div>
        </div>
        <div class="bid-right" style="font-size:13px;color:rgba(255,255,255,0.5)">
          <div style="color:#10B981;font-weight:800;font-size:16px">₹${fmt(advance)} received</div>
          <div style="margin-top:2px">Balance: ₹${fmt(balance)}</div>
          ${hasDiscount ? `<div style="margin-top:2px;color:#FBBF24">Promo ${promo_code}: −₹${fmt(discount_amount)}</div>` : ''}
        </div>
      </div>

      <hr class="divider">
      <div class="section-label">Customer Details</div>

      <table class="grid" cellpadding="0" cellspacing="8" width="100%">
        <tr>
          <td><div class="cell-label">Name</div><div class="cell-value">${name}</div></td>
          <td><div class="cell-label">Phone</div><div class="cell-value"><a href="tel:+91${phone.replace(/\D/g,'')}" style="color:#2563EB">${phone}</a></div></td>
        </tr>
        <tr>
          <td colspan="2" class="cell-full"><div class="cell-label">Email</div><div class="cell-value"><a href="mailto:${email}" style="color:#2563EB">${email}</a></div></td>
        </tr>
        ${city || timing ? `<tr>
          ${city ? `<td><div class="cell-label">City</div><div class="cell-value">${city}</div></td>` : '<td></td>'}
          ${timing ? `<td><div class="cell-label">Best Time to Call</div><div class="cell-value">${timing}</div></td>` : '<td></td>'}
        </tr>` : ''}
        ${notes ? `<tr><td colspan="2" class="cell-full"><div class="cell-label">Notes</div><div class="cell-value">${notes}</div></td></tr>` : ''}
      </table>

      <hr class="divider">
      <div class="section-label">Project & Payment</div>

      <table class="grid" cellpadding="0" cellspacing="8" width="100%">
        <tr>
          <td><div class="cell-label">Plan</div><div class="cell-value">${plan_name}</div></td>
          <td><div class="cell-label">Hosting</div><div class="cell-value">${hosting === 'netlify' ? '🌿 Netlify' : '☁️ Cloudflare Pages'}</div></td>
        </tr>
      </table>

      <div class="pay-box" style="background:#FFF7ED07;border-color:#FED7AA44">
        ${addonRows}
        ${hasDiscount ? `<div class="pay-row"><span>Promo <code style="font-family:monospace">${promo_code}</code> applied</span><span class="val-green">−₹${fmt(discount_amount)}</span></div>` : ''}
        <div class="pay-row"><b>Total</b><span class="val-total">₹${fmt(total)}</span></div>
        <div class="pay-row"><span>Advance received</span><span class="val-green">₹${fmt(advance)} ✓</span></div>
        <div class="pay-row"><span>Balance due on delivery</span><span class="val-amber">₹${fmt(balance)}</span></div>
      </div>

      ${paymentId ? `<p style="font-size:12px;color:#94A3B8;margin-bottom:16px">Razorpay Ref: <code style="font-family:monospace;background:#F1F5F9;padding:2px 8px;border-radius:4px">${paymentId}</code></p>` : ''}

      <div class="alert-blue">
        📋 <strong>Action required:</strong> Call or WhatsApp <strong>${name}</strong> at <strong><a href="tel:+91${phone.replace(/\D/g,'')}" style="color:#1E40AF">${phone}</a></strong>${timing ? ` — best time: <strong>${timing}</strong>` : ''} within 24 hours to kick off the project.
      </div>
    </div>
  `, { accentColor: '#F97316', preheader: `New booking from ${name} — ${plan_name} — ₹${fmt(advance)} received` });
}

// ── Waitlist: confirmation email on signup ────────────────────────────────────
function buildWaitlistJoinedEmail({ id, plan_name, customer_name: name, is_urgent, reason }) {
  const isUnavailable = reason === 'unavailable';
  const introLine = isUnavailable
    ? `The <strong>${plan_name}</strong> package is temporarily paused, but you're on the list — I'll reach out personally as soon as it reopens.`
    : `All project slots are full right now, but you're locked into the queue for a <strong>${plan_name}</strong> project.`;
  const nextStepsLine = isUnavailable
    ? `📬 <strong>What happens next:</strong> I'll email you the moment the <strong>${plan_name}</strong> package is available again — no need to check back.`
    : `📬 <strong>What happens next:</strong> I only take on a couple of projects at a time so each one gets proper attention. The moment a slot frees up, I'll email you a link to lock it in with your advance payment — no need to check back.`;

  return wrap(`
    <div class="hero">
      <div class="badge" style="background:#EFF6FF;color:#1D4ED8;border-color:#BFDBFE">📋 You're on the list</div>
      <h1>Hi ${name}, you're on the waiting list!</h1>
      <p>${introLine}</p>
    </div>
    <div class="body">
      <div class="bid-banner">
        <div class="bid-left"><div class="bid-label">Waitlist ID</div><div class="bid-value">${id}</div></div>
        <div class="bid-right">${is_urgent ? '⚡' : '⏳'}</div>
      </div>
      ${is_urgent ? `
      <div class="alert-amber">
        ⚡ <strong>Marked urgent.</strong> I'll prioritize your request as soon as a slot opens.
      </div>` : ''}
      <div class="alert-blue">
        ${nextStepsLine}
      </div>
      <p style="margin-top:16px;font-size:13px;color:#64748B">Save this email — your Waitlist ID <strong style="color:#0F172A;font-family:monospace">${id}</strong> is your reference.</p>
    </div>
  `, { accentColor: '#2563EB', preheader: `You're on the waiting list for a ${plan_name} project — ${id}` });
}

// ── Waitlist: admin alert on signup — new lead to follow up on ────────────────
function buildWaitlistAdminAlertEmail({ id, plan_name, plan_price, customer_name: name, customer_email: email, customer_phone: phone, customer_city: city, notes, is_urgent, reason }) {
  const isUnavailable = reason === 'unavailable';
  return wrap(`
    <div class="hero">
      <div class="badge" style="background:#FFF7ED;color:#C2410C;border-color:#FED7AA">${is_urgent ? '⚡' : '📋'} New Waitlist Signup</div>
      <h1>${name} wants a ${plan_name} project!</h1>
      <p>${isUnavailable ? 'Interested while that package is paused.' : 'All slots are currently full — they joined the waiting list.'} Reach out when you're ready.</p>
    </div>
    <div class="body">
      <div class="bid-banner">
        <div class="bid-left"><div class="bid-label">Waitlist ID</div><div class="bid-value" style="color:#F97316">${id}</div></div>
        <div class="bid-right" style="font-size:13px;color:rgba(255,255,255,0.5)">
          <div style="color:#10B981;font-weight:800;font-size:16px">${plan_price != null ? `₹${fmt(plan_price)}` : plan_name}</div>
          ${is_urgent ? '<div style="margin-top:2px;color:#F59E0B">⚡ Urgent request</div>' : ''}
        </div>
      </div>

      <hr class="divider">
      <div class="section-label">Customer Details</div>

      <table class="grid" cellpadding="0" cellspacing="8" width="100%">
        <tr>
          <td><div class="cell-label">Name</div><div class="cell-value">${name}</div></td>
          <td><div class="cell-label">Phone</div><div class="cell-value"><a href="tel:+91${(phone||'').replace(/\D/g,'')}" style="color:#2563EB">${phone||'—'}</a></div></td>
        </tr>
        <tr>
          <td colspan="2" class="cell-full"><div class="cell-label">Email</div><div class="cell-value"><a href="mailto:${email}" style="color:#2563EB">${email}</a></div></td>
        </tr>
        ${city ? `<tr><td colspan="2" class="cell-full"><div class="cell-label">City</div><div class="cell-value">${city}</div></td></tr>` : ''}
        ${notes ? `<tr><td colspan="2" class="cell-full"><div class="cell-label">Notes</div><div class="cell-value">${notes}</div></td></tr>` : ''}
      </table>

      <hr class="divider">
      <div class="section-label">Interested In</div>
      <table class="grid" cellpadding="0" cellspacing="8" width="100%">
        <tr>
          <td><div class="cell-label">Plan</div><div class="cell-value">${plan_name}</div></td>
          <td><div class="cell-label">Cost</div><div class="cell-value">${plan_price != null ? `₹${fmt(plan_price)}` : 'n/a'}</div></td>
        </tr>
      </table>

      <div class="alert-blue" style="margin-top:20px">
        📋 <strong>Action:</strong> Reach out to <strong>${name}</strong> at <strong><a href="tel:+91${(phone||'').replace(/\D/g,'')}" style="color:#1E40AF">${phone||'—'}</a></strong> or reply to <a href="mailto:${email}" style="color:#1E40AF">${email}</a> when you're ready to take them on. You can also invite them straight to checkout from the admin Waitlist tab.
      </div>
    </div>
  `, { accentColor: '#F97316', preheader: `${name} wants a ${plan_name} project — ${plan_price != null ? `₹${fmt(plan_price)}` : ''}` });
}

// ── Waitlist: slot opened, invite to pay advance ──────────────────────────────
function buildWaitlistSlotOpenEmail({ id, plan_name, customer_name: name, invite_url, invite_expires_at }) {
  const expiresLabel = new Date(invite_expires_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  return wrap(`
    <div class="hero">
      <div class="badge" style="background:#F0FDF4;color:#15803D;border-color:#BBF7D0">🎉 A Slot Just Opened</div>
      <h1>Good news, ${name} — it's your turn!</h1>
      <p>A project slot has opened up and it's reserved for you. Complete your advance payment below to lock it in.</p>
    </div>
    <div class="body">
      <div class="bid-banner">
        <div class="bid-left"><div class="bid-label">Waitlist ID</div><div class="bid-value">${id}</div></div>
        <div class="bid-right">🎉</div>
      </div>
      <div class="cta-wrap">
        <a href="${invite_url}" class="cta-btn">Claim My ${plan_name} Slot →</a>
      </div>
      <div class="alert-amber" style="text-align:center">
        ⏰ This invite is reserved for you until <strong>${expiresLabel}</strong>. After that the slot may be offered to the next person in line.
      </div>
      <p style="margin-top:16px;font-size:13px;color:#64748B">Clicking the link takes you straight to the ${plan_name} plan on the booking page — just pick your add-ons and pay the advance to confirm.</p>
    </div>
  `, { accentColor: '#059669', preheader: `A slot opened up for your ${plan_name} project — claim it before ${expiresLabel}` });
}

// ── Contact bubble: customer submits a concern/dispute ────────────────────────
function buildContactCustomerEmail({ id, customer_name: name, category }) {
  return wrap(`
    <div class="hero">
      <div class="badge" style="background:#EFF6FF;color:#1D4ED8;border-color:#BFDBFE">📨 Message Received</div>
      <h1>Hi ${name}, I've got your message</h1>
      <p>Thanks for reaching out about <strong>${category}</strong>. I read every message personally and will reply within 24 hours.</p>
    </div>
    <div class="body">
      <div class="bid-banner">
        <div class="bid-left"><div class="bid-label">Reference ID</div><div class="bid-value">${id}</div></div>
        <div class="bid-right">📨</div>
      </div>
      <div class="alert-blue">
        📬 <strong>What happens next:</strong> I'll review your message and reply directly to this email address. If it's urgent, feel free to also WhatsApp me.
      </div>
      <p style="margin-top:16px;font-size:13px;color:#64748B">Save this email — your Reference ID <strong style="color:#0F172A;font-family:monospace">${id}</strong> is your reference for this conversation.</p>
    </div>
  `, { accentColor: '#2563EB', preheader: `I've received your message — Reference ${id}` });
}

function buildContactAdminEmail({ id, customer_name: name, customer_email: email, customer_phone: phone, booking_id, category, purpose, message }) {
  return wrap(`
    <div class="hero">
      <div class="badge" style="background:#FEF2F2;color:#B91C1C;border-color:#FECACA">⚠️ New Contact Submission</div>
      <h1>${name} needs help — ${category}</h1>
      <p>Submitted via the site's contact bubble. Reply within 24 hours.</p>
    </div>
    <div class="body">
      <div class="bid-banner">
        <div class="bid-left"><div class="bid-label">Reference ID</div><div class="bid-value" style="color:#F87171">${id}</div></div>
        <div class="bid-right" style="font-size:13px;color:rgba(255,255,255,0.5)">${category}</div>
      </div>

      ${purpose ? `<div class="alert-blue" style="margin-top:16px">🔎 <strong>${purpose}</strong> — passed the genuine-inquiry gate before this email was sent.</div>` : ''}

      <hr class="divider">
      <div class="section-label">Customer Details</div>
      <table class="grid" cellpadding="0" cellspacing="8" width="100%">
        <tr>
          <td><div class="cell-label">Name</div><div class="cell-value">${name}</div></td>
          <td><div class="cell-label">Phone</div><div class="cell-value"><a href="tel:+91${phone.replace(/\D/g,'')}" style="color:#2563EB">${phone}</a></div></td>
        </tr>
        <tr>
          <td colspan="2" class="cell-full"><div class="cell-label">Email</div><div class="cell-value"><a href="mailto:${email}" style="color:#2563EB">${email}</a></div></td>
        </tr>
        ${booking_id ? `<tr><td colspan="2" class="cell-full"><div class="cell-label">Booking ID</div><div class="cell-value">${booking_id}</div></td></tr>` : ''}
      </table>

      <hr class="divider">
      <div class="section-label">Message</div>
      <div class="pay-box" style="display:block">
        <p style="font-size:14px;color:#0F172A;line-height:1.7;white-space:pre-wrap">${message}</p>
      </div>

      <div class="alert-red" style="margin-top:20px">
        ⚠️ <strong>Action required:</strong> Reply to <a href="mailto:${email}" style="color:#991B1B">${email}</a> or call <strong><a href="tel:+91${phone.replace(/\D/g,'')}" style="color:#991B1B">${phone}</a></strong> within 24 hours.
      </div>
    </div>
  `, { accentColor: '#EF4444', preheader: `${name} — ${category} — ${id}` });
}

export async function notifyContact(env, payload) {
  await sendEmail(env, {
    to: payload.customer_email,
    subject: `📨 We've got your message — ${payload.id} | BespokeDeploy`,
    html: buildContactCustomerEmail(payload),
  });
  try {
    await sendEmail(env, {
      to: ADMIN_EMAIL,
      subject: `⚠️ Contact — ${payload.customer_name} — ${payload.category}`,
      html: buildContactAdminEmail(payload),
      replyTo: payload.customer_email,
    });
  } catch (e) {
    console.error('[notify] contact admin alert failed:', e?.message || e);
  }
}

// ── Ownership transfer certificate — emailed as a PDF attachment ──────────────
function buildCertificateEmail({ client_name, website_name, website_url, certificate_id }) {
  return wrap(`
    <div class="hero">
      <div class="badge" style="background:#F5F3FF;color:#6D28D9;border-color:#DDD6FE">🎓 Ownership Certificate</div>
      <h1>Congratulations, ${client_name}!</h1>
      <p>Your website is officially yours. Attached is your certificate of ownership transfer for <strong>${website_name}</strong>.</p>
    </div>
    <div class="body">
      <div class="bid-banner">
        <div class="bid-left"><div class="bid-label">Certificate ID</div><div class="bid-value">${certificate_id}</div></div>
        <div class="bid-right">🎓</div>
      </div>

      <hr class="divider">
      <div class="section-label">Website</div>
      <table class="grid" cellpadding="0" cellspacing="8" width="100%">
        <tr>
          <td><div class="cell-label">Name</div><div class="cell-value">${website_name}</div></td>
          <td><div class="cell-label">URL</div><div class="cell-value"><a href="${website_url}" style="color:#2563EB">${website_url}</a></div></td>
        </tr>
      </table>

      <div class="alert-blue" style="margin-top:20px">
        📄 The attached PDF is your official record — keep it for your files. It confirms full ownership rights have been transferred to you as per the Terms agreed at booking.
      </div>
      <p style="margin-top:16px;font-size:13px;color:#64748B">Thank you for trusting me with your website. If you ever need updates, new features, or a new project, I'm just a message away.</p>
    </div>
  `, { accentColor: '#8B5CF6', preheader: `Your ownership certificate for ${website_name} is attached` });
}

export async function notifyCertificate(env, { customer_email, client_name, website_name, website_url, certificate_id, pdf_base64 }) {
  await sendEmail(env, {
    to: customer_email,
    subject: `🎓 Your Ownership Certificate — ${website_name} | BespokeDeploy`,
    html: buildCertificateEmail({ client_name, website_name, website_url, certificate_id }),
    attachments: [{ filename: `${certificate_id}.pdf`, content: pdf_base64 }],
  });
}

// ── OTP verification email ────────────────────────────────────────────────────
function buildOtpEmail(otp) {
  return wrap(`
    <div class="hero">
      <div class="badge">🔐 Verification Code</div>
      <h1>Your verification code</h1>
      <p>Enter this code to verify your details. It expires in 5 minutes.</p>
    </div>
    <div class="body">
      <div class="bid-banner">
        <div class="bid-left">
          <div class="bid-label">Your Code</div>
          <div class="bid-value" style="font-size:28px;letter-spacing:0.2em">${otp}</div>
        </div>
        <div class="bid-right">🔐</div>
      </div>
      <div class="alert-blue">
        Didn't request this? You can safely ignore this email — no account or booking was affected.
      </div>
    </div>
  `, { preheader: `Your verification code is ${otp}` });
}

export async function notifyOtp(env, email, otp) {
  await sendEmail(env, {
    to: email,
    subject: `🔐 Your verification code: ${otp} | BespokeDeploy`,
    html: buildOtpEmail(otp),
  });
}

// ── Notification dispatcher ───────────────────────────────────────────────────
export async function notify(env, booking, event) {
  if (event === 'waitlist_joined') {
    await sendEmail(env, {
      to: booking.customer_email,
      subject: `📋 You're on the waiting list — ${booking.id} | BespokeDeploy`,
      html: buildWaitlistJoinedEmail(booking),
    });
    // Admin lead alert — non-fatal if it fails, the customer email already succeeded
    try {
      await sendEmail(env, {
        to: ADMIN_EMAIL,
        subject: `${booking.is_urgent ? '⚡' : '📋'} Waitlist — ${booking.customer_name} wants a ${booking.plan_name}${booking.plan_price != null ? ` (₹${fmt(booking.plan_price)})` : ''}`,
        html: buildWaitlistAdminAlertEmail(booking),
        replyTo: booking.customer_email,
      });
    } catch (e) {
      console.error('[notify] waitlist admin alert failed:', e?.message || e);
    }
    return;
  }

  if (event === 'waitlist_slot_open') {
    return sendEmail(env, {
      to: booking.customer_email,
      subject: `🎉 A slot just opened for you — ${booking.id} | BespokeDeploy`,
      html: buildWaitlistSlotOpenEmail(booking),
    });
  }

  const { customer_name: name, customer_email: email, customer_phone: phone,
          id, plan_name, total, advance, balance, final_payment_link, final_payment_id, cancel_reason } = booking;

  switch (event) {

    case 'booking_confirmed': {
      // Customer: full receipt & what-happens-next
      const customerHtml = buildConfirmationEmail(booking);
      await sendEmail(env, {
        to: email,
        subject: `✅ Booking Confirmed — ${id} | BespokeDeploy`,
        html: customerHtml,
        replyTo: ADMIN_EMAIL,
      });

      // Admin: new booking notification
      const adminHtml = buildAdminNotificationEmail(booking);
      await sendEmail(env, {
        to: ADMIN_EMAIL,
        subject: `🔔 New Booking — ${name} — ${plan_name} — ${id}`,
        html: adminHtml,
        replyTo: email,
      });

      // WhatsApp (if configured)
      await sendWhatsApp(env, phone, 'booking_confirmed', [
        { type: 'body', parameters: [
          { type: 'text', text: name },
          { type: 'text', text: id },
          { type: 'text', text: plan_name },
        ]},
      ]);
      break;
    }

    case 'contacting': {
      const html = wrap(`
        <div class="hero">
          <div class="badge">📞 We're Reaching Out</div>
          <h1>Hi ${name}, I'll be in touch shortly!</h1>
          <p>I've reviewed your booking and will contact you via phone or WhatsApp within the next few hours to discuss your project requirements.</p>
        </div>
        <div class="body">
          <div class="bid-banner">
            <div class="bid-left"><div class="bid-label">Booking ID</div><div class="bid-value">${id}</div></div>
            <div class="bid-right">📞</div>
          </div>
          <div class="pay-box">
            <div class="pay-row"><span>Plan</span><b>${plan_name}</b></div>
          </div>
          <p style="margin-top:16px;font-size:14px;color:#64748B">If you'd like to reach out first, simply reply to this email or WhatsApp me directly.</p>
        </div>
      `, { preheader: `I'll be contacting you soon about your ${plan_name} project` });
      await sendEmail(env, { to: email, subject: `📞 I'll be in touch soon — ${id} | BespokeDeploy`, html });
      break;
    }

    case 'in_progress': {
      const html = wrap(`
        <div class="hero">
          <div class="badge" style="background:#EFF6FF;color:#1D4ED8;border-color:#BFDBFE">🔨 In Development</div>
          <h1>Your website is being built, ${name}!</h1>
          <p>Great news — your <strong>${plan_name}</strong> project is now actively in development. I'll share previews and check in regularly.</p>
        </div>
        <div class="body">
          <div class="bid-banner">
            <div class="bid-left"><div class="bid-label">Booking ID</div><div class="bid-value">${id}</div></div>
            <div class="bid-right">🛠️</div>
          </div>
          <div class="pay-box">
            <div class="pay-row"><span>Plan</span><b>${plan_name}</b></div>
            <div class="pay-row"><span>Balance due on delivery</span><span class="val-amber">₹${fmt(balance)}</span></div>
          </div>
          <div class="alert-blue" style="margin-top:20px">
            💡 <strong>Tip:</strong> Start gathering any content, images, or reference websites you'd like to share. The more you have ready, the faster we can move.
          </div>
        </div>
      `, { accentColor: '#2563EB', preheader: `Your ${plan_name} website is now being built` });
      await sendEmail(env, { to: email, subject: `🔨 Your website is in development — ${id} | BespokeDeploy`, html });
      break;
    }

    case 'final_payment': {
      const html = wrap(`
        <div class="hero">
          <div class="badge" style="background:#F0FDF4;color:#15803D;border-color:#BBF7D0">💳 Final Payment Due</div>
          <h1>Your website is ready, ${name}!</h1>
          <p>Your <strong>${plan_name}</strong> website is complete. Complete the final payment to unlock your files and go live.</p>
        </div>
        <div class="body">
          <div class="bid-banner">
            <div class="bid-left"><div class="bid-label">Booking ID</div><div class="bid-value">${id}</div></div>
            <div class="bid-right">✨</div>
          </div>
          <div class="pay-box" style="background:#F0FDF407;border-color:#BBF7D044">
            <div class="pay-row"><b>Final amount due</b><span class="val-blue">₹${fmt(balance)}</span></div>
          </div>
          <div class="cta-wrap">
            <a href="${final_payment_link}" class="cta-btn" style="background:#059669">💳 &nbsp;Pay ₹${fmt(balance)} Now →</a>
          </div>
          <p style="text-align:center;font-size:12px;color:#94A3B8;margin-top:-12px">Secure payment via Razorpay. You'll receive a receipt immediately.</p>
          <div class="alert-green" style="margin-top:20px">
            Once this payment is made, you get <strong>7 days of review</strong> with <strong>2 free rounds of revisions</strong> included at no extra cost — this is your final payment for the project.
          </div>
        </div>
      `, { accentColor: '#059669', preheader: `Your ${plan_name} website is ready — ₹${fmt(balance)} due to go live` });
      await sendEmail(env, { to: email, subject: `💳 Final Payment — Your website is ready! — ${id} | BespokeDeploy`, html });
      break;
    }

    case 'review': {
      const html = wrap(`
        <div class="hero">
          <div class="badge" style="background:#F0FDF4;color:#15803D;border-color:#BBF7D0">🎉 Payment Confirmed</div>
          <h1>Time to review your website, ${name}!</h1>
          <p>Your final payment has been received. Thank you! Your 7-day review window starts now.</p>
        </div>
        <div class="body">
          <div class="bid-banner">
            <div class="bid-left"><div class="bid-label">Booking ID</div><div class="bid-value">${id}</div></div>
            <div class="bid-right">🎉</div>
          </div>
          <div class="pay-box" style="background:#F0FDF407;border-color:#BBF7D044">
            <div class="pay-row"><span>Total paid</span><span class="val-green">₹${fmt(total)} ✓</span></div>
            <div class="pay-row"><span>Review window</span><b>7 days from today</b></div>
            <div class="pay-row"><span>Free revision rounds</span><b>2 rounds included</b></div>
          </div>
          <div class="alert-blue" style="margin-top:20px">
            📝 <strong>How to submit feedback:</strong> Simply reply to this email with your revision requests in writing. I'll confirm receipt and apply changes within 48 hours.
          </div>
          <p style="margin-top:16px;font-size:13.5px;color:#64748B">After 7 days, the project will be marked complete and handover documents will be sent to you.</p>
        </div>
      `, { accentColor: '#059669', preheader: `Payment confirmed — your ${plan_name} review window is open` });
      await sendEmail(env, { to: email, subject: `🎉 Payment received — Review your website now! — ${id} | BespokeDeploy`, html });
      break;
    }

    case 'complete': {
      const html = wrap(`
        <div class="hero">
          <div class="badge" style="background:#EFF6FF;color:#1D4ED8;border-color:#BFDBFE">🚀 Project Complete</div>
          <h1>Your website is live, ${name}!</h1>
          <p>Your <strong>${plan_name}</strong> project is officially complete. All files, credentials, and handover documents have been (or will shortly be) sent to you.</p>
        </div>
        <div class="body">
          <div class="bid-banner">
            <div class="bid-left"><div class="bid-label">Booking ID</div><div class="bid-value">${id}</div></div>
            <div class="bid-right">🚀</div>
          </div>
          <div class="pay-box">
            <div class="pay-row"><span>Total paid</span><span class="val-green">₹${fmt(total)} ✓</span></div>
          </div>
          <div class="alert-blue" style="margin-top:20px">
            🙏 <strong>Thank you for choosing BespokeDeploy!</strong> If you ever need future updates, new features, or a completely new project, I'm just a message away.
          </div>
          <div class="cta-wrap">
            <a href="https://bespokedeploy.in" class="cta-btn">Visit bespokedeploy.in →</a>
          </div>
        </div>
      `, { accentColor: '#2563EB', preheader: `Your ${plan_name} website is live — project complete!` });
      await sendEmail(env, { to: email, subject: `🚀 Your website is live! — ${id} | BespokeDeploy`, html });
      break;
    }

    case 'cancelled': {
      // Advance-stage cancellation = final payment was never made (booking was
      // still at new/contacting/in_progress/awaiting_payment). In that case the
      // advance is refunded on a fixed timeline. Once final payment has been
      // made, the standard discretionary refund policy applies instead.
      const advanceStage = !final_payment_id;
      const refundBlock = advanceStage
        ? `<div class="alert-green">
             <strong>Refund on the way:</strong> Since only the advance had been paid, your <strong>₹${fmt(advance)}</strong> advance payment will be refunded to your original payment method within <strong>3 business days</strong>.
           </div>`
        : `<div class="alert-red">
             <strong>Refund Policy:</strong> As stated in our Terms, payments made after final delivery are non-refundable by default. Refunds are considered only at BespokeDeploy's discretion — reply to this email if you'd like to request one.
           </div>`;

      const html = wrap(`
        <div class="hero">
          <div class="badge" style="background:#FEF2F2;color:#B91C1C;border-color:#FECACA">Booking Cancelled</div>
          <h1>Your booking has been cancelled</h1>
          <p>Booking <strong>${id}</strong> for <strong>${plan_name}</strong> has been cancelled.</p>
        </div>
        <div class="body">
          <div class="bid-banner">
            <div class="bid-left"><div class="bid-label">Booking ID</div><div class="bid-value" style="color:#F87171">${id}</div></div>
            <div class="bid-right">❌</div>
          </div>
          ${cancel_reason && cancel_reason !== 'Cancelled by admin' ? `
          <div class="alert-blue">
            <strong>Reason:</strong> ${cancel_reason}
          </div>` : ''}
          ${refundBlock}
          <p style="margin-top:16px;font-size:14px;color:#64748B">If you'd like to start a new project in the future, we'd be happy to work with you again.</p>
          <div class="cta-wrap">
            <a href="https://bespokedeploy.in" class="cta-btn" style="background:#64748B">Book a New Project →</a>
          </div>
        </div>
      `, { accentColor: advanceStage ? '#10B981' : '#EF4444', preheader: `Your booking ${id} has been cancelled` });
      await sendEmail(env, { to: email, subject: `Booking Cancelled — ${id} | BespokeDeploy`, html });
      break;
    }
  }
}
