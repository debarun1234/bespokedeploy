import { motion } from 'framer-motion';
import { C, fmt } from '../theme';

// ─── Confetti ─────────────────────────────────────────────
const COLORS = ['#E8542C', '#EC4899', '#10B981', '#FFD23F', '#F0714A', '#F0714A'];

function Confetti() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 999 }}>
      {Array.from({ length: 60 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${Math.random() * 100}%`,
            top: `-${Math.random() * 20 + 10}px`,
            width: `${Math.random() * 8 + 4}px`,
            height: `${Math.random() * 8 + 4}px`,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            background: COLORS[Math.floor(Math.random() * COLORS.length)],
            animation: `confetti-fall ${Math.random() * 2 + 2}s ${Math.random() * 2}s ease-in forwards`,
            opacity: 0.85,
          }}
        />
      ))}
    </div>
  );
}

// ─── What happens next ────────────────────────────────────
const NEXT_STEPS = [
  { icon: '📞', title: 'Call / message within 24hrs',  desc: 'I will reach out at your preferred time to discuss details.' },
  { icon: '📋', title: 'Kick-off & content collection', desc: 'We agree on structure, content, images, and references.' },
  { icon: '🛠️', title: 'Build phase',                   desc: 'I build your site and share previews for feedback.' },
  { icon: '✅', title: 'Review & launch',               desc: '2 free revision rounds. You approve. Site goes live.' },
];

// ─── PDF receipt helper ───────────────────────────────────
function generatePDF({ plan, addons, hostingChoice, formData, total, advance, paymentId, bookingId, promoCode, discountAmount }) {
  const addonList    = Object.values(addons);
  const hostingLabel = hostingChoice === 'netlify' ? 'Netlify (yourname.netlify.app)' : 'Cloudflare Pages (yourname.pages.dev)';
  const balance      = total - advance;
  const date         = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long', timeStyle: 'short' });
  const hasDiscount  = !!promoCode && discountAmount > 0;
  const addonsSum    = addonList.reduce((s, a) => s + (a.price || 0), 0);
  const basePrice    = plan.price ?? (total + (hasDiscount ? discountAmount : 0) - addonsSum);
  const subtotal     = basePrice + addonsSum;

  const addonRows = addonList.length
    ? addonList.map(a => `<tr><td style="padding:7px 0;border-bottom:1px solid #E2E8F0;color:#475569">+ ${a.name || a.id}</td><td style="padding:7px 0;border-bottom:1px solid #E2E8F0;text-align:right;color:#475569">₹${fmt(a.price || 0)}</td></tr>`).join('')
    : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Receipt – ${bookingId || 'BespokeDeploy'}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; color: #0F172A; padding: 48px 40px; max-width: 680px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 36px; padding-bottom: 24px; border-bottom: 2px solid #0F172A; }
    .brand { font-size: 22px; font-weight: 900; letter-spacing: -0.01em; }
    .brand span { color: #E8542C; }
    .brand-sub { font-size: 11px; color: #94A3B8; margin-top: 3px; letter-spacing: 0.05em; text-transform: uppercase; }
    .receipt-label { text-align: right; }
    .receipt-label h1 { font-size: 28px; font-weight: 900; color: #0F172A; }
    .receipt-label .date { font-size: 12px; color: #64748B; margin-top: 4px; }
    .booking-id { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 14px 18px; margin-bottom: 28px; display: flex; align-items: center; justify-content: space-between; }
    .booking-id-label { font-size: 11px; color: #94A3B8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; }
    .booking-id-value { font-size: 20px; font-weight: 800; color: #E8542C; font-family: 'Courier New', monospace; letter-spacing: 0.04em; }
    .status-badge { background: #DCFCE7; color: #15803D; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 20px; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 10px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 10px; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .detail-item { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 10px 14px; }
    .detail-item-label { font-size: 10px; color: #94A3B8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
    .detail-item-value { font-size: 13px; font-weight: 600; color: #0F172A; }
    table { width: 100%; border-collapse: collapse; }
    .amount-table { margin-bottom: 4px; }
    .amount-table tr.total-row td { font-weight: 800; font-size: 16px; padding-top: 12px; border-top: 2px solid #0F172A; }
    .amount-table tr.paid-row td { color: #15803D; font-weight: 700; }
    .amount-table tr.balance-row td { color: #B45309; font-weight: 700; }
    .paid-note { font-size: 11px; color: #94A3B8; margin-top: 12px; }
    .footer { margin-top: 36px; padding-top: 20px; border-top: 1px solid #E2E8F0; font-size: 11px; color: #94A3B8; text-align: center; line-height: 1.7; }
    .footer strong { color: #475569; }
    @media print {
      body { padding: 24px; }
      @page { margin: 16mm; size: A4; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand"><span>Bespoke</span>Deploy</div>
      <div class="brand-sub">bespokedeploy.in</div>
    </div>
    <div class="receipt-label">
      <h1>Receipt</h1>
      <div class="date">${date}</div>
    </div>
  </div>

  <div class="booking-id">
    <div>
      <div class="booking-id-label">Booking ID</div>
      <div class="booking-id-value">${bookingId || '—'}</div>
    </div>
    <div class="status-badge">✓ Advance Paid</div>
  </div>

  <div class="section">
    <div class="section-title">Customer Details</div>
    <div class="detail-grid">
      <div class="detail-item"><div class="detail-item-label">Name</div><div class="detail-item-value">${formData.name}</div></div>
      <div class="detail-item"><div class="detail-item-label">Phone</div><div class="detail-item-value">${formData.phone}</div></div>
      <div class="detail-item" style="grid-column:1/-1"><div class="detail-item-label">Email</div><div class="detail-item-value">${formData.email}</div></div>
      ${formData.city ? `<div class="detail-item"><div class="detail-item-label">City</div><div class="detail-item-value">${formData.city}</div></div>` : ''}
      ${formData.timing ? `<div class="detail-item"><div class="detail-item-label">Best Time to Call</div><div class="detail-item-value">${formData.timing}</div></div>` : ''}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Project Details</div>
    <div class="detail-grid">
      <div class="detail-item"><div class="detail-item-label">Plan</div><div class="detail-item-value">${plan.name} Website</div></div>
      <div class="detail-item"><div class="detail-item-label">Hosting</div><div class="detail-item-value">${hostingLabel}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Payment Summary</div>
    <table class="amount-table">
      <tr>
        <td style="padding:7px 0;border-bottom:1px solid #E2E8F0;color:#475569">${plan.name} Website (base plan)</td>
        <td style="padding:7px 0;border-bottom:1px solid #E2E8F0;text-align:right;color:#475569">₹${fmt(basePrice)}</td>
      </tr>
      ${addonRows}
      ${hasDiscount ? `<tr><td style="padding:7px 0;border-bottom:1px solid #E2E8F0;color:#475569">Subtotal</td><td style="padding:7px 0;border-bottom:1px solid #E2E8F0;text-align:right;color:#475569">₹${fmt(subtotal)}</td></tr>` : ''}
      ${hasDiscount ? `<tr><td style="padding:7px 0;border-bottom:1px solid #E2E8F0;color:#15803D;font-weight:700">Promo ${promoCode} applied</td><td style="padding:7px 0;border-bottom:1px solid #E2E8F0;text-align:right;color:#15803D;font-weight:700">−₹${fmt(discountAmount)}</td></tr>` : ''}
      <tr class="total-row">
        <td>Total</td>
        <td style="text-align:right">₹${fmt(total)}</td>
      </tr>
      <tr class="paid-row">
        <td style="padding:6px 0;font-size:14px">Advance Paid</td>
        <td style="padding:6px 0;text-align:right;font-size:14px">₹${fmt(advance)} ✓</td>
      </tr>
      <tr class="balance-row">
        <td style="padding:6px 0;font-size:14px">Balance Due on Delivery</td>
        <td style="padding:6px 0;text-align:right;font-size:14px">₹${fmt(balance)}</td>
      </tr>
    </table>
    ${paymentId ? `<div class="paid-note">Razorpay Payment Reference: <strong>${paymentId}</strong></div>` : ''}
  </div>

  <div class="footer">
    <strong>BespokeDeploy</strong> · bespokedeploy.in · contact@bespokedeploy.in<br>
    Keep this receipt as your reference. Questions? Reply to your booking confirmation email.
  </div>

  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=800,height=900');
  if (!win) { alert('Allow pop-ups to download the PDF receipt.'); return; }
  win.document.write(html);
  win.document.close();
}

// ─── SuccessStep ──────────────────────────────────────────
export default function SuccessStep({ plan, addons, hostingChoice, formData, total, advance, paymentId, bookingId, promoCode, discountAmount }) {
  const hostingLabel = hostingChoice === 'netlify' ? '🌿 Netlify' : '☁️ Cloudflare Pages';
  const hasDiscount  = !!promoCode && discountAmount > 0;

  return (
    <>
      <Confetti />
      <div style={{ minHeight: '100vh', padding: '60px 24px 80px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
        <div style={{ width: '100%', maxWidth: 600 }}>

          {/* Success icon */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
            style={{ textAlign: 'center', marginBottom: 32 }}
          >
            <div style={{
              width: 88, height: 88, borderRadius: '50%', margin: '0 auto 20px',
              background: `${C.green}20`, border: `2px solid ${C.green}50`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
            }}>
              {/* Pulse ring */}
              <div style={{
                position: 'absolute', inset: -8, borderRadius: '50%',
                border: `2px solid ${C.green}`,
                animation: 'pulse-ring 2s ease-out infinite',
              }} />
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <motion.path
                  d="M8 20 L17 29 L32 12"
                  stroke={C.green}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.4, ease: 'easeOut' }}
                />
              </svg>
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              style={{ fontSize: 34, fontWeight: 900, color: C.text, marginBottom: 8 }}
            >
              Booking Confirmed!
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              style={{ fontSize: 16, color: C.muted, lineHeight: 1.6 }}
            >
              ₹{fmt(advance)} advance paid · I'll reach out to <strong style={{ color: C.text }}>{formData.name}</strong> within 24 hours.
            </motion.p>
          </motion.div>

          {/* Summary card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '22px', marginBottom: 20 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{plan.name} Website</div>
                <div style={{ fontSize: 12.5, color: C.muted }}>Booking: <strong style={{ color: C.accent }}>{bookingId || '—'}</strong></div>
                <div style={{ fontSize: 11, color: C.muted }}>Payment: {paymentId || 'Pending'}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: plan.color }}>₹{fmt(total)}</div>
                <div style={{ fontSize: 12, color: C.muted }}>total</div>
              </div>
            </div>

            {hasDiscount && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: `${C.green}12`, border: `1px solid ${C.green}35`, borderRadius: 10, padding: '9px 14px', marginBottom: 14, fontSize: 12.5 }}>
                <span style={{ color: C.green, fontWeight: 600 }}>Promo {promoCode} applied</span>
                <span style={{ color: C.green, fontWeight: 700 }}>−₹{fmt(discountAmount)} saved</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
              {[
                ['Advance paid',   `₹${fmt(advance)}`,      C.green],
                ['Balance due',    `₹${fmt(total-advance)}`, C.yellow],
                ['Hosting',        hostingLabel,              C.text],
                ['Call at',        formData.timing,           C.text],
                ['Contact',        formData.phone,            C.text],
              ].map(([k, v, c]) => (
                <div key={k} style={{ background: C.bg, borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>{k}</div>
                  <div style={{ fontWeight: 600, color: c }}>{v}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* What's next */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}
            style={{ marginBottom: 28 }}
          >
            <div style={{ fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 16 }}>
              What happens next
            </div>
            {NEXT_STEPS.map((ns, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 14, alignItems: 'flex-start' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: `${C.accent}15`, border: `1px solid ${C.accent}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                }}>
                  {ns.icon}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 3 }}>{ns.title}</div>
                  <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>{ns.desc}</div>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Revision policy */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
            style={{ background: `${C.accent}10`, border: `1px solid ${C.accent}25`, borderRadius: 12, padding: '14px 18px', marginBottom: 24, fontSize: 13, color: C.muted, lineHeight: 1.6 }}
          >
            <strong style={{ color: C.text }}>Revision policy:</strong>{' '}
            First <strong style={{ color: C.accent }}>2 rounds of changes are free</strong> after delivery.
            Subsequent rounds are charged at <strong style={{ color: C.yellow }}>₹500/round</strong>.
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
            style={{ display: 'flex', gap: 12 }}
          >
            <button
              onClick={() => generatePDF({ plan, addons, hostingChoice, formData, total, advance, paymentId, bookingId, promoCode, discountAmount })}
              style={{
                flex: 1, background: C.surface, border: `1px solid ${C.border}`,
                color: C.dim, borderRadius: 12, padding: '13px',
                fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all .2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.text; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.dim; }}
            >
              ↓ Download Receipt PDF
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                flex: 1, background: C.accent,
                border: 'none', color: '#fff', borderRadius: 40,
                padding: '13px', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Build Another Quote →
            </button>
          </motion.div>

          <div style={{ textAlign: 'center', fontSize: 12.5, color: C.muted, marginTop: 20, lineHeight: 1.6 }}>
            A confirmation email was sent to <strong style={{ color: C.text }}>{formData.email}</strong><br />
            Questions? WhatsApp or email <strong style={{ color: C.text }}>contact@bespokedeploy.in</strong>
          </div>
        </div>
      </div>
    </>
  );
}
