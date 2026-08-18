import { motion } from 'framer-motion';
import { C, fmt } from '../theme';

// ─── Confetti (same as SuccessStep) ────────────────────────
const COLORS = ['#0EA5E9', '#10B981', '#EC4899', '#F59E0B', '#38BDF8'];

function Confetti() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 999 }}>
      {Array.from({ length: 50 }).map((_, i) => (
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

// ─── PDF Receipt ────────────────────────────────────────────
function generateFinalPDF({ bookingId, planName, total, balance, name }) {
  const date = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long', timeStyle: 'short' });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Final Payment Receipt – ${bookingId}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; color: #0F172A; padding: 48px 40px; max-width: 680px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 36px; padding-bottom: 24px; border-bottom: 2px solid #0F172A; }
    .brand { font-size: 22px; font-weight: 900; }
    .brand span { color: #0EA5E9; }
    .brand-sub { font-size: 11px; color: #94A3B8; margin-top: 3px; letter-spacing: 0.05em; text-transform: uppercase; }
    .receipt-label h1 { font-size: 28px; font-weight: 900; text-align: right; }
    .receipt-label .sub { font-size: 12px; color: #10B981; font-weight: 700; text-align: right; margin-top: 4px; }
    .receipt-label .date { font-size: 12px; color: #64748B; text-align: right; margin-top: 2px; }
    .booking-id { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 14px 18px; margin-bottom: 28px; display: flex; align-items: center; justify-content: space-between; }
    .booking-id-label { font-size: 11px; color: #94A3B8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; }
    .booking-id-value { font-size: 20px; font-weight: 800; color: #0EA5E9; font-family: 'Courier New', monospace; letter-spacing: 0.04em; }
    .status-badge { background: #DCFCE7; color: #15803D; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 20px; }
    .section-title { font-size: 10px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
    td { padding: 9px 0; border-bottom: 1px solid #E2E8F0; color: #475569; font-size: 14px; }
    .total-row td { font-weight: 800; font-size: 16px; padding-top: 12px; border-top: 2px solid #0F172A; border-bottom: none; color: #0F172A; }
    .paid-row td { color: #15803D; font-weight: 700; border-bottom: none; font-size: 15px; }
    .review-box { background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 10px; padding: 16px 18px; margin-top: 24px; }
    .review-box h3 { font-size: 14px; font-weight: 700; color: #1E40AF; margin-bottom: 8px; }
    .review-box p { font-size: 13px; color: #3B82F6; line-height: 1.6; }
    .footer { margin-top: 36px; padding-top: 20px; border-top: 1px solid #E2E8F0; font-size: 11px; color: #94A3B8; text-align: center; line-height: 1.7; }
    @media print { body { padding: 24px; } @page { margin: 16mm; size: A4; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand"><span>Bespoke</span>Deploy</div>
      <div class="brand-sub">bespokedeploy.in</div>
    </div>
    <div class="receipt-label">
      <h1>Final Receipt</h1>
      <div class="sub">✓ Fully Paid</div>
      <div class="date">${date}</div>
    </div>
  </div>

  <div class="booking-id">
    <div>
      <div class="booking-id-label">Booking ID</div>
      <div class="booking-id-value">${bookingId}</div>
    </div>
    <div class="status-badge">✓ Payment Complete</div>
  </div>

  <p style="margin-bottom:20px;font-size:14px;color:#475569">Final payment receipt for <strong style="color:#0F172A">${name}</strong> — <strong style="color:#0F172A">${planName}</strong> Website</p>

  <div class="section-title" style="margin-bottom:10px">Payment Summary</div>
  <table>
    <tr class="paid-row">
      <td>Final balance paid</td>
      <td style="text-align:right">₹${fmt(balance)} ✓</td>
    </tr>
    <tr class="total-row">
      <td>Total project cost</td>
      <td style="text-align:right">₹${fmt(total)}</td>
    </tr>
  </table>

  <div class="review-box">
    <h3>🔍 Review Period</h3>
    <p>You now have <strong>7 days</strong> to review the completed website. Submit your feedback by replying to your email — up to <strong>2 free rounds of revisions</strong> are included.<br><br>After 7 days, the project will be marked complete and all handover documents will be sent to you.</p>
  </div>

  <div class="footer">
    <strong>BespokeDeploy</strong> · bespokedeploy.in · debarun.ghosh.2024@gmail.com<br>
    Reference: <strong>${bookingId}</strong> · Keep this receipt for your records.
  </div>

  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=800,height=900');
  if (!win) { alert('Allow pop-ups to download the PDF receipt.'); return; }
  win.document.write(html);
  win.document.close();
}

// ─── Review steps ───────────────────────────────────────────
const REVIEW_STEPS = [
  { icon: '🔍', title: 'Review your website',      desc: 'You have 7 days to go through the site and compile your feedback.' },
  { icon: '✏️', title: 'Submit feedback',           desc: 'Reply to your email with requested changes. 2 free rounds are included.' },
  { icon: '🛠️', title: 'Revisions applied',         desc: 'I\'ll apply your feedback and share updated previews.' },
  { icon: '🚀', title: 'Handover & go live',        desc: 'Once you approve, all files and credentials will be sent over.' },
];

// ─── Component ──────────────────────────────────────────────
export default function FinalPaymentSuccess({ bookingId, planName, total, balance, customerName }) {
  const advance = total - balance;

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
              style={{ fontSize: 32, fontWeight: 900, color: C.text, marginBottom: 8 }}
            >
              Payment Complete!
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              style={{ fontSize: 15, color: C.muted, lineHeight: 1.6 }}
            >
              ₹{fmt(balance)} final payment received · Your project is fully paid.
            </motion.p>
          </motion.div>

          {/* Summary card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '22px', marginBottom: 20 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{planName} Website</div>
                <div style={{ fontSize: 12.5, color: C.muted }}>Booking: <strong style={{ color: C.accent }}>{bookingId}</strong></div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: C.green }}>₹{fmt(total)}</div>
                <div style={{ fontSize: 12, color: C.muted }}>fully paid</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
              {[
                ['Advance (earlier)',  `₹${fmt(advance)}`,  C.muted],
                ['Final payment',      `₹${fmt(balance)}`,  C.green],
                ['Total paid',         `₹${fmt(total)}`,    C.text],
                ['Review window',      '7 days',            C.accent],
              ].map(([k, v, c]) => (
                <div key={k} style={{ background: C.bg, borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>{k}</div>
                  <div style={{ fontWeight: 600, color: c }}>{v}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Review steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
            style={{ marginBottom: 24 }}
          >
            <div style={{ fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 16 }}>
              What happens during review
            </div>
            {REVIEW_STEPS.map((rs, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 14, alignItems: 'flex-start' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: `${C.green}15`, border: `1px solid ${C.green}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                }}>
                  {rs.icon}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 3 }}>{rs.title}</div>
                  <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>{rs.desc}</div>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Revision policy */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }}
            style={{ background: `${C.green}10`, border: `1px solid ${C.green}25`, borderRadius: 12, padding: '14px 18px', marginBottom: 24, fontSize: 13, color: C.muted, lineHeight: 1.6 }}
          >
            <strong style={{ color: C.text }}>Revision policy:</strong>{' '}
            2 free rounds are included. Further rounds are{' '}
            <strong style={{ color: C.yellow }}>₹500/round</strong>.
            You have <strong style={{ color: C.green }}>7 days</strong> from today to submit feedback.
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
            style={{ display: 'flex', gap: 12 }}
          >
            <button
              onClick={() => generateFinalPDF({ bookingId, planName, total, balance, name: customerName })}
              style={{
                flex: 1, background: C.surface, border: `1px solid ${C.border}`,
                color: C.dim, borderRadius: 12, padding: '13px',
                fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all .2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.green; e.currentTarget.style.color = C.text; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.dim; }}
            >
              ↓ Download Receipt PDF
            </button>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                flex: 1, background: `linear-gradient(135deg, ${C.green}, #34D399)`,
                border: 'none', color: '#fff', borderRadius: 12,
                padding: '13px', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Back to Home →
            </button>
          </motion.div>

          <div style={{ textAlign: 'center', fontSize: 12.5, color: C.muted, marginTop: 20, lineHeight: 1.6 }}>
            A payment confirmation was sent to your email.{' '}
            Reference: <strong style={{ color: C.text }}>{bookingId}</strong>
          </div>
        </div>
      </div>
    </>
  );
}
