import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ClipboardList, Gem, Zap, PenLine, ShieldCheck,
  ExternalLink, LogOut, ChevronRight, RefreshCw, Menu, X, Mail, Users, Star, Megaphone,
} from 'lucide-react';
import { C } from '../theme';
// Certificate PDF builder (jsPDF) is lazy-loaded on demand inside
// CertificateModal — it pulls in a heavy dependency tree that customer-facing
// pages should never have to download just because the admin panel exists.
function generateCertificateId(bookingId) {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BD-CERT-${bookingId}-${rand}`;
}

// ─── Config ────────────────────────────────────────────────
const API = '/api';

// ─── Helpers ───────────────────────────────────────────────
const fmt   = (n) => Number(n).toLocaleString('en-IN');
const token = () => localStorage.getItem('bd_admin_token') || '';

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}`, ...(opts.headers || {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (res.status === 401) { localStorage.removeItem('bd_admin_token'); window.location.reload(); }
  try { return await res.json(); }
  catch { return { error: `HTTP ${res.status} — server returned unexpected response (check Cloudflare Pages logs)`, _httpStatus: res.status }; }
}

// ─── Status config ─────────────────────────────────────────
const STATUS = {
  new:              { label: 'New',              color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  dot: '#F59E0B' },
  contacting:       { label: 'Contacting',       color: C.accent,  bg: 'rgba(232,84,44,0.1)',    dot: C.accent },
  in_progress:      { label: 'In Progress',      color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)',   dot: '#8B5CF6' },
  awaiting_payment: { label: 'Awaiting Payment', color: '#EC4899', bg: 'rgba(236,72,153,0.1)',   dot: '#EC4899' },
  review:           { label: 'Review',           color: '#10B981', bg: 'rgba(16,185,129,0.1)',   dot: '#10B981' },
  complete:         { label: 'Complete',         color: '#6B7280', bg: 'rgba(107,114,128,0.1)',  dot: '#10B981' },
  cancelled:        { label: 'Cancelled',        color: '#EF4444', bg: 'rgba(239,68,68,0.1)',    dot: '#EF4444' },
};
const TABS = ['all', 'new', 'contacting', 'in_progress', 'awaiting_payment', 'review', 'complete', 'cancelled'];

// ─── Design tokens — matched to the main site's brand (src/theme.js) ───────
// Was its own standalone blue/violet dashboard palette; now pulls from the
// same warm near-black bg, burnt-orange accent and cream text the rest of
// BespokeDeploy.in uses, so the admin panel doesn't look like a bolted-on
// third-party tool.
const T = {
  bg:      C.bg,           // var(--c-bg) — #0B0B09
  sidebar: C.surface,      // var(--c-surface) — #16150F
  card:    C.surface,
  border:  C.borderFaint,  // subtle by default — a dense dashboard can't take
  divider: C.borderFaint,  // a full opaque orange outline on every row
  text:    C.text,
  muted:   C.muted,
  dim:     C.dim,
  accent:  C.accent,       // #E8542C — was sky-blue, now the site's burnt orange
  green:   C.green,
  red:     C.red,
  yellow:  C.yellow,
  violet:  '#C4699A',      // warm plum — keeps a second accent for variety
                           // without reintroducing a cold blue/purple note
  input:   C.bg,
};

// ─── Nav ───────────────────────────────────────────────────
const NAV = [
  { id: 'dashboard', label: 'Dashboard',       Icon: LayoutDashboard, color: '#8B5CF6' },
  { id: 'bookings',  label: 'Bookings',        Icon: ClipboardList,   color: C.accent },
  { id: 'capacity',  label: 'Capacity',        Icon: Users,           color: '#F59E0B' },
  { id: 'feedback',  label: 'Feedback',        Icon: Star,            color: '#F59E0B' },
  { id: 'promos',    label: 'Promotions',      Icon: Megaphone,       color: '#8B5CF6' },
  { id: 'plans',     label: 'Plans & Pricing', Icon: Gem,             color: '#F59E0B' },
  { id: 'addons',    label: 'Add-ons',         Icon: Zap,             color: '#10B981' },
  { id: 'email',     label: 'Email',           Icon: Mail,            color: '#EC4899' },
  { id: 'general',   label: 'Site Content',    Icon: PenLine,         color: '#6B7280' },
  { id: 'password',  label: 'Security',        Icon: ShieldCheck,     color: '#6B7280' },
];

// ─── Shared UI helpers ──────────────────────────────────────
// The site's own primary CTAs use a subtle gradient (theme.js's btn()) rather
// than a flat fill — carry that over specifically for the brand-accent
// button so it reads as the same button family as the marketing site.
// Every other color (green/red/yellow/violet) stays flat, which is the right
// call for a dense dashboard full of small status-colored actions.
const solidBtn = (bg, extra = {}) => ({
  background: bg === T.accent ? `linear-gradient(135deg, ${bg}, ${bg}CC)` : bg,
  color: '#fff', border: 'none', borderRadius: 8,
  padding: '8px 18px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
  transition: 'opacity .15s', whiteSpace: 'nowrap', fontFamily: 'inherit',
  display: 'inline-flex', alignItems: 'center', gap: 6,
  ...extra,
});
const ghostBtn = (color, extra = {}) => ({
  background: 'transparent', color, border: `1px solid ${color}40`,
  borderRadius: 8, padding: '8px 16px', fontSize: 12.5, fontWeight: 600,
  cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap', fontFamily: 'inherit',
  display: 'inline-flex', alignItems: 'center', gap: 6,
  ...extra,
});

const card = {
  background: T.card,
  border: `1px solid ${T.border}`,
  borderRadius: 14,
};

// ─── Sub-components ─────────────────────────────────────────
function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.new;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: s.bg, color: s.color, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
      {s.label}
    </span>
  );
}

function MetricCard({ label, value, sub, color }) {
  return (
    <div style={{ ...card, padding: '20px 24px', flex: 1, minWidth: 160 }}>
      <div style={{ fontSize: 11, color: T.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: color || T.accent, letterSpacing: '-0.02em', fontFamily: C.fontDisplay }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function ReviewTimer({ startedAt }) {
  const start   = new Date(startedAt);
  const end     = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  const now     = new Date();
  const total   = end - start;
  const elapsed = Math.min(now - start, total);
  const pct     = Math.round((elapsed / total) * 100);
  const daysLeft = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.muted, marginBottom: 4 }}>
        <span>Review window</span>
        <span style={{ color: daysLeft <= 1 ? T.red : T.green }}>{daysLeft}d remaining</span>
      </div>
      <div style={{ background: T.divider, borderRadius: 4, height: 5 }}>
        <div style={{ background: daysLeft <= 1 ? T.red : T.green, height: '100%', borderRadius: 4, width: `${pct}%`, transition: 'width 0.5s' }} />
      </div>
    </div>
  );
}

function ConfirmDialog({ message, showReason, onConfirm, onCancel }) {
  const [reason, setReason] = useState('');
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ ...card, padding: '28px 32px', maxWidth: 420, width: '90%' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 12 }}>Confirm Action</div>
        <div style={{ fontSize: 14, color: T.muted, marginBottom: showReason ? 16 : 24, lineHeight: 1.6 }}>{message}</div>
        {showReason && (
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, color: T.dim, fontWeight: 600, display: 'block', marginBottom: 7 }}>
              Reason for cancellation <span style={{ fontWeight: 400, color: T.muted }}>(shown to the customer in their cancellation email)</span>
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Client requested cancellation before work began, unresponsive for 30+ days, scope no longer feasible…"
              rows={3}
              style={{ ...inpStyle, width: '100%', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
            />
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel}  style={ghostBtn(T.muted)}>Cancel</button>
          <button onClick={() => onConfirm(reason)} style={solidBtn(T.red)}>Confirm</button>
        </div>
      </motion.div>
    </div>
  );
}

function InfoRow({ label, value, color, mono }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0', borderBottom: `1px solid ${T.divider}` }}>
      <span style={{ color: T.muted }}>{label}</span>
      <span style={{ color: color || T.text, fontFamily: mono ? 'monospace' : 'inherit', fontSize: mono ? 11 : 13 }}>{value}</span>
    </div>
  );
}

function Actions({ booking, onTrigger, loading }) {
  const { status, id } = booking;
  if (loading === id) return <span style={{ fontSize: 12, color: T.muted }}>Working…</span>;
  return (
    <>
      {status === 'new'         && <button style={solidBtn(T.accent)}  onClick={() => onTrigger('status:contacting')}>Start Contacting</button>}
      {status === 'contacting'  && <button style={solidBtn(T.violet)}  onClick={() => onTrigger('status:in_progress')}>Mark In Progress</button>}
      {status === 'in_progress' && <button style={solidBtn(T.green)}   onClick={() => onTrigger('payment-link', 'Create a Razorpay payment link and notify the customer via WhatsApp & email?')}>Send Payment Link</button>}
      {status === 'awaiting_payment' && (
        <>
          <button
            style={solidBtn(T.accent)}
            onClick={() => onTrigger('check-payment')}
          >
            🔄 Check Razorpay Status
          </button>
          <button
            style={solidBtn(T.green)}
            onClick={() => onTrigger('status:review', `Confirm final payment received for ${booking.customer_name}? This moves the booking to Review and notifies the customer.`)}
          >
            ✓ Confirm Manually
          </button>
        </>
      )}
      {status === 'review'      && <button style={solidBtn(T.green)}   onClick={() => onTrigger('status:complete')}>Mark Complete Early</button>}
      {!['complete','cancelled'].includes(status) && (
        <button style={ghostBtn(T.red)} onClick={() => onTrigger('cancel', `Cancel booking ${id} for ${booking.customer_name}? They'll be notified by email. ${booking.status === 'review' ? 'Since final payment was already made, the refund policy is discretionary.' : `Since only the advance (₹${fmt(booking.advance)}) has been paid, it will be refunded within 3 business days.`}`)}>Cancel</button>
      )}
      <button
        style={{ ...ghostBtn(T.red), opacity: 0.6, fontSize: 11 }}
        onClick={() => onTrigger('delete', `Permanently delete booking ${id} (${booking.customer_name})? This cannot be undone and will remove it from all metrics.`)}
      >
        🗑 Delete
      </button>
    </>
  );
}

function CertificateModal({ booking, onClose, onToast }) {
  const [form, setForm] = useState({
    client_name: booking.customer_name || '',
    website_name: booking.cert_website_name || '',
    website_url:  booking.cert_website_url  || '',
  });
  const [busy, setBusy] = useState(null); // 'download' | 'email' | null
  const [certId] = useState(() => booking.certificate_id || generateCertificateId(booking.id));

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const valid = () => {
    if (!form.client_name.trim() || !form.website_name.trim() || !form.website_url.trim()) {
      onToast('Please fill in client name, website name, and website URL', false);
      return false;
    }
    return true;
  };

  const buildDoc = async () => {
    const { buildCertificatePdf } = await import('../lib/certificate');
    return buildCertificatePdf({
      clientName:  form.client_name.trim(),
      websiteName: form.website_name.trim(),
      websiteUrl:  form.website_url.trim(),
      planName:    booking.plan_name,
      amount:      booking.total,
      dateStr,
      certId,
    });
  };

  const handleDownload = async () => {
    if (!valid()) return;
    setBusy('download');
    try {
      const doc = await buildDoc();
      doc.save(`${certId}.pdf`);
      onToast('Certificate downloaded ✅');
    } catch (e) {
      console.error(e);
      onToast('Failed to generate PDF', false);
    }
    setBusy(null);
  };

  const handleEmail = async () => {
    if (!valid()) return;
    setBusy('email');
    try {
      const doc = await buildDoc();
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      const res = await apiFetch(`/booking/${booking.id}/certificate`, {
        method: 'POST',
        body: {
          client_name:    form.client_name.trim(),
          website_name:   form.website_name.trim(),
          website_url:    form.website_url.trim(),
          certificate_id: certId,
          pdf_base64:     pdfBase64,
        },
      });
      if (res.ok) { onToast('Certificate emailed to customer ✅'); onClose(); }
      else onToast(res.error || 'Failed to send certificate', false);
    } catch (e) {
      console.error(e);
      onToast('Failed to send certificate', false);
    }
    setBusy(null);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ ...card, padding: '26px 28px', width: '100%', maxWidth: 440 }}>
        <div style={{ fontSize: 12, color: T.accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Ownership Certificate</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 16 }}>{booking.customer_name} · {booking.id}</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: T.muted, fontWeight: 600, display: 'block', marginBottom: 5 }}>Client Name</label>
            <input value={form.client_name} onChange={set('client_name')} style={{ ...inpStyle, width: '100%' }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.muted, fontWeight: 600, display: 'block', marginBottom: 5 }}>Website Name</label>
            <input value={form.website_name} onChange={set('website_name')} placeholder="e.g. Sheetal's Prakritik Nutrition" style={{ ...inpStyle, width: '100%' }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.muted, fontWeight: 600, display: 'block', marginBottom: 5 }}>Website URL</label>
            <input value={form.website_url} onChange={set('website_url')} placeholder="https://example.com" style={{ ...inpStyle, width: '100%' }} />
          </div>
        </div>

        <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(14,165,233,0.08)', borderRadius: 8, fontSize: 12, color: T.dim, lineHeight: 1.6 }}>
          Package: <strong>{booking.plan_name}</strong> · Amount paid: <strong>₹{fmt(booking.total)}</strong>
          <br /><span style={{ color: T.muted }}>Pulled automatically from this booking — not editable here.</span>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
          <button onClick={onClose} disabled={!!busy} style={ghostBtn(T.muted)}>Cancel</button>
          <button onClick={handleDownload} disabled={!!busy} style={solidBtn(T.accent)}>{busy === 'download' ? 'Generating…' : '⬇ Download PDF'}</button>
          <button onClick={handleEmail} disabled={!!busy} style={solidBtn(T.green)}>{busy === 'email' ? 'Sending…' : '✉ Email to Customer'}</button>
        </div>
      </div>
    </div>
  );
}

function BookingCard({ booking, onAction, loading, onToast }) {
  const [expanded, setExpanded] = useState(false);
  const [confirm,  setConfirm]  = useState(null);
  const [certModal, setCertModal] = useState(false);

  const trigger = (action, message) => {
    if (message) setConfirm({ message, action });
    else onAction(booking.id, action);
  };

  return (
    <div style={{ ...card, marginBottom: 8, overflow: 'hidden' }}>
      <div onClick={() => setExpanded(e => !e)} style={{ padding: '14px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '0 0 auto' }}>
          <div style={{ fontSize: 10, color: T.muted, fontWeight: 600, letterSpacing: '0.05em' }}>ID</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.accent, fontFamily: 'monospace' }}>{booking.id}</div>
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{booking.customer_name}</div>
          <div style={{ fontSize: 12, color: T.muted }}>{booking.customer_email}</div>
        </div>
        <div style={{ flex: '0 0 auto', textAlign: 'right' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{booking.plan_name}</div>
          <div style={{ fontSize: 12, color: T.muted }}>₹{fmt(booking.total)}</div>
          {!!booking.promo_code && (
            <div style={{ fontSize: 10.5, color: T.violet, fontWeight: 700, marginTop: 2 }}>
              {booking.promo_code} · −₹{fmt(booking.discount_amount)}
            </div>
          )}
        </div>
        <StatusBadge status={booking.status} />
        <span style={{ color: T.muted, fontSize: 12 }}>{expanded ? '▲' : '▼'}</span>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            style={{ borderTop: `1px solid ${T.divider}`, overflow: 'hidden' }}>
            <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
              <div>
                <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Customer</div>
                <InfoRow label="Phone"  value={booking.customer_phone} />
                <InfoRow label="City"   value={booking.customer_city || '—'} />
                <InfoRow label="Timing" value={booking.customer_timing || '—'} />
                {booking.customer_notes && <InfoRow label="Notes" value={booking.customer_notes} />}
                <div style={{ marginTop: 18, fontSize: 11, color: T.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Payments</div>
                {!!booking.promo_code && (
                  <InfoRow label="Promo Code" value={`${booking.promo_code} (−₹${fmt(booking.discount_amount)})`} color={T.violet} />
                )}
                <InfoRow label="Total"        value={`₹${fmt(booking.total)}`} />
                <InfoRow label="Advance Paid" value={`₹${fmt(booking.advance)}`}  color={T.green} />
                <InfoRow label="Balance Due"  value={`₹${fmt(booking.balance)}`}  color={booking.status === 'complete' ? T.green : T.yellow} />
                {booking.advance_payment_id && <InfoRow label="Advance Ref" value={booking.advance_payment_id} mono />}
                {booking.final_payment_id   && <InfoRow label="Final Ref"   value={booking.final_payment_id}   mono color={T.green} />}
                {booking.final_payment_link && (
                  <div style={{ marginTop: 8 }}>
                    <a href={booking.final_payment_link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: T.accent, textDecoration: 'underline' }}>Payment Link ↗</a>
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Plan & Add-ons</div>
                <InfoRow label="Plan"    value={booking.plan_name} />
                <InfoRow label="Hosting" value={booking.hosting} />
                {booking.addons?.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    {booking.addons.map((a, i) => (
                      <div key={i} style={{ fontSize: 12, color: T.dim, padding: '3px 0', display: 'flex', justifyContent: 'space-between' }}>
                        <span>+ {a.name || a.id}</span><span style={{ color: T.muted }}>₹{fmt(a.price)}</span>
                      </div>
                    ))}
                  </div>
                )}
                <InfoRow label="Booked" value={new Date(booking.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })} />
                {booking.cancel_reason && <InfoRow label="Reason" value={booking.cancel_reason} color={T.red} />}
                {booking.status === 'review' && booking.review_started_at && <ReviewTimer startedAt={booking.review_started_at} />}
                {booking.status === 'awaiting_payment' && (
                  <div style={{ marginTop: 16, background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.3)', borderRadius: 10, padding: '12px 14px', fontSize: 12, color: T.dim, lineHeight: 1.6 }}>
                    <div style={{ fontWeight: 700, color: '#EC4899', marginBottom: 6 }}>⏳ Waiting for final payment</div>
                    Verify payment was received in your{' '}
                    <a href="https://dashboard.razorpay.com/app/payment-links" target="_blank" rel="noopener noreferrer" style={{ color: T.accent }}>Razorpay dashboard →</a>
                    <br />Once confirmed, click <strong style={{ color: T.green }}>✓ Confirm Payment Received</strong> below to move to Review and notify the customer.
                  </div>
                )}
                <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <Actions booking={booking} onTrigger={trigger} loading={loading} />
                  {['review', 'complete'].includes(booking.status) && (
                    <button style={solidBtn('#8B5CF6')} onClick={() => setCertModal(true)}>
                      🎓 {booking.certificate_id ? 'Re-send Certificate' : 'Generate Certificate'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {confirm && (
        <ConfirmDialog message={confirm.message}
          showReason={confirm.action === 'cancel'}
          onConfirm={(reason) => { onAction(booking.id, confirm.action, reason); setConfirm(null); }}
          onCancel={() => setConfirm(null)} />
      )}

      {certModal && (
        <CertificateModal booking={booking} onClose={() => setCertModal(false)} onToast={onToast} />
      )}
    </div>
  );
}

// ─── Settings helpers ───────────────────────────────────────
// Matched to the actual per-plan colors used on the live site (src/data/plans.js).
const PLAN_META = [
  { id: 'portfolio', name: 'Portfolio',     color: '#10B981' },
  { id: 'starter',   name: 'Small Website', color: C.accent },
  { id: 'pro',       name: 'Pro Website',   color: '#EC4899' },
];

const ADDON_META = [
  { id: 'p_blog',      name: 'Blog / Writing',         plan: 'Portfolio' },
  { id: 'p_testi',     name: 'Testimonials',            plan: 'Portfolio' },
  { id: 'p_logo',      name: 'Personal Logo',           plan: 'Portfolio' },
  { id: 'p_pdf',       name: 'Resume PDF',              plan: 'Portfolio' },
  { id: 'p_animate',   name: 'Scroll Animations',       plan: 'Portfolio' },
  { id: 'p_darkmode',  name: 'Dark Mode Toggle',         plan: 'Portfolio' },
  { id: 's_payment',   name: 'Payment Gateway',         plan: 'Small Website' },
  { id: 's_blog',      name: 'Blog Setup',              plan: 'Small Website' },
  { id: 's_gallery',   name: 'Photo Gallery',           plan: 'Small Website' },
  { id: 's_booking',   name: 'Appointment Booking',     plan: 'Small Website' },
  { id: 's_newsletter',name: 'Newsletter Signup',       plan: 'Small Website' },
  { id: 's_logo',      name: 'Logo Design',             plan: 'Small Website' },
  { id: 's_gbp',       name: 'Google Business Profile', plan: 'Small Website' },
  { id: 's_chat',      name: 'Live Chat Widget',        plan: 'Small Website' },
  { id: 's_speed',     name: 'Speed Optimization',      plan: 'Small Website' },
  { id: 's_ai',        name: 'AI Assistant',            plan: 'Small Website' },
  { id: 'pro_booking', name: 'Appointment Booking',     plan: 'Pro' },
  { id: 'pro_ecom',    name: 'E-Commerce (up to 20)',   plan: 'Pro' },
  { id: 'pro_cart',    name: 'Shopping Cart',           plan: 'Pro' },
  { id: 'pro_multilang',name:'Multi-language',          plan: 'Pro' },
  { id: 'pro_logo',    name: 'Premium Logo',            plan: 'Pro' },
  { id: 'pro_team',    name: 'Team Page',               plan: 'Pro' },
  { id: 'pro_faq',     name: 'FAQ Page',                plan: 'Pro' },
  { id: 'pro_chat',    name: 'Live Chat Widget',        plan: 'Pro' },
  { id: 'pro_darkmode',name: 'Dark Mode Toggle',         plan: 'Pro' },
  { id: 'pro_ai',      name: 'AI Assistant',            plan: 'Pro' },
];

function Toggle({ checked, onChange }) {
  return (
    <div onClick={() => onChange(!checked)} style={{ width: 38, height: 21, borderRadius: 11, background: checked ? T.green : 'rgba(255,255,255,0.12)', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 3, left: checked ? 19 : 3, width: 15, height: 15, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
    </div>
  );
}

const inpStyle = {
  background: T.input, border: `1px solid ${T.border}`, borderRadius: 8,
  padding: '8px 12px', color: T.text, fontSize: 13, boxSizing: 'border-box',
  fontFamily: 'inherit', outline: 'none',
};

function Inp({ value, onChange, type = 'text', step, placeholder, wide, suffix }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 0 }}>
      <input
        type={type} step={step} placeholder={placeholder}
        value={value ?? ''}
        onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
        style={{ ...inpStyle, width: wide ? '100%' : suffix ? 80 : 110, borderRadius: suffix ? '8px 0 0 8px' : 8 }}
      />
      {suffix && (
        <span style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`, borderLeft: 'none', borderRadius: '0 8px 8px 0', padding: '8px 10px', fontSize: 12, color: T.muted, fontWeight: 600 }}>
          {suffix}
        </span>
      )}
    </div>
  );
}

function SectionTitle({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: 0 }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 13, color: T.muted, marginTop: 4, marginBottom: 0 }}>{subtitle}</p>}
    </div>
  );
}

function SaveBar({ dirty, onSave, saving }) {
  if (!dirty) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
      <button onClick={onSave} disabled={saving} style={solidBtn(T.green)}>
        {saving ? 'Saving…' : `Save ${dirty} Change${dirty > 1 ? 's' : ''}`}
      </button>
    </div>
  );
}

// ─── Plans & Pricing ────────────────────────────────────────
function PlansSettings({ onToast }) {
  const [settings, setSettings] = useState(null);
  const [dirty,    setDirty]    = useState({});
  const [saving,   setSaving]   = useState(false);

  useEffect(() => { apiFetch('/admin/settings').then(s => { if (!s?.error) setSettings(s); }); }, []);

  const update = (key, value) => {
    setDirty(d => ({ ...d, [key]: value }));
    setSettings(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const parts = key.split('.');
      let obj = next;
      for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
      obj[parts[parts.length - 1]] = value;
      return next;
    });
  };

  // Advance % is stored as decimal (0.2) but shown/edited as percent (20)
  const getPct = (val) => val != null ? Math.round(val * 100) : '';
  const setPct = (key, pctValue) => update(key, pctValue / 100);

  const save = async () => {
    setSaving(true);
    const res = await apiFetch('/admin/settings', { method: 'PATCH', body: dirty });
    setSaving(false);
    if (res.ok) { setDirty({}); onToast('Plans saved ✅'); }
    else onToast(res.error || 'Save failed', false);
  };

  if (!settings) return <div style={{ color: T.muted, padding: 40, textAlign: 'center' }}>Loading…</div>;

  const dirtyCount = Object.keys(dirty).length;

  return (
    <div>
      <SectionTitle title="Plans & Pricing" subtitle="Set base prices and visibility for each website package." />
      <SaveBar dirty={dirtyCount} onSave={save} saving={saving} />

      {/* Plan cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
        {PLAN_META.map(p => (
          <div key={p.id} style={{ ...card, padding: '18px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: p.color }}>{p.name}</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 2, fontFamily: 'monospace' }}>{p.id}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: T.muted }}>₹</span>
                <Inp type="number" value={settings.plans?.[p.id]?.price} onChange={v => update(`plans.${p.id}.price`, v)} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Toggle checked={settings.plans?.[p.id]?.enabled ?? true} onChange={v => update(`plans.${p.id}.enabled`, v)} />
                <span style={{ fontSize: 12, color: T.muted }}>{settings.plans?.[p.id]?.enabled ? 'Visible' : 'Hidden'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Advance % tiers */}
      <div style={{ ...card, padding: '22px 24px' }}>
        <div style={{ fontSize: 12, color: T.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Advance Payment Tiers</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 20 }}>
          <div>
            <label style={{ fontSize: 12, color: T.dim, fontWeight: 600, display: 'block', marginBottom: 7 }}>
              Small plan advance
              <span style={{ fontWeight: 400, color: T.muted }}> (total &lt; threshold)</span>
            </label>
            <Inp
              type="number" step="1" suffix="%"
              value={getPct(settings.general?.advance_pct_low)}
              onChange={v => setPct('general.advance_pct_low', v)}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: T.dim, fontWeight: 600, display: 'block', marginBottom: 7 }}>
              Large plan advance
              <span style={{ fontWeight: 400, color: T.muted }}> (total ≥ threshold)</span>
            </label>
            <Inp
              type="number" step="1" suffix="%"
              value={getPct(settings.general?.advance_pct_high)}
              onChange={v => setPct('general.advance_pct_high', v)}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: T.dim, fontWeight: 600, display: 'block', marginBottom: 7 }}>
              Threshold amount
              <span style={{ fontWeight: 400, color: T.muted }}> (separates tiers)</span>
            </label>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 0 }}>
              <span style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`, borderRight: 'none', borderRadius: '8px 0 0 8px', padding: '8px 10px', fontSize: 12, color: T.muted, fontWeight: 600 }}>₹</span>
              <input
                type="number"
                value={settings.general?.advance_threshold ?? ''}
                onChange={e => update('general.advance_threshold', Number(e.target.value))}
                style={{ ...inpStyle, width: 100, borderRadius: '0 8px 8px 0', borderLeft: 'none' }}
              />
            </div>
          </div>
        </div>
        <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(16,185,129,0.08)', borderRadius: 8, border: '1px solid rgba(16,185,129,0.15)' }}>
          <span style={{ fontSize: 12, color: T.green }}>
            Currently: <strong>{getPct(settings.general?.advance_pct_low)}%</strong> advance for orders under ₹{fmt(settings.general?.advance_threshold ?? 15000)},
            and <strong>{getPct(settings.general?.advance_pct_high)}%</strong> advance for orders ₹{fmt(settings.general?.advance_threshold ?? 15000)}+
          </span>
        </div>
      </div>

      {/* Payment test mode */}
      <div style={{ ...card, padding: '22px 24px', marginTop: 20, border: settings.general?.demo_mode ? `1px solid ${T.yellow}55` : `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ fontSize: 12, color: T.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Payment Test Mode</div>
            <div style={{ fontSize: 13, color: T.dim, lineHeight: 1.5 }}>
              Lets visitors walk through the full checkout as a preview. The "Pay" button simulates success instead of opening Razorpay — no real charge, order, or booking gets created, and no emails go out.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Toggle checked={settings.general?.demo_mode ?? false} onChange={v => update('general.demo_mode', v)} />
            <span style={{ fontSize: 12, color: settings.general?.demo_mode ? T.yellow : T.muted, fontWeight: 600 }}>
              {settings.general?.demo_mode ? 'Test Mode ON' : 'Live'}
            </span>
          </div>
        </div>
        {settings.general?.demo_mode && (
          <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(245,158,11,0.08)', borderRadius: 8, border: '1px solid rgba(245,158,11,0.2)' }}>
            <span style={{ fontSize: 12, color: T.yellow }}>
              ⚠️ Real bookings are disabled site-wide right now. Turn this off before you're ready to accept real payments.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Add-ons ────────────────────────────────────────────────
// Maps the admin panel's plan-group labels to the plan_id used by
// custom-addon records (portfolio/starter/pro) and by /api/admin/custom-addons.
const GROUP_PLAN_ID = { 'Portfolio': 'portfolio', 'Small Website': 'starter', 'Pro': 'pro' };
const BLANK_NEW_ADDON = { name: '', desc: '', price: '' };

function NewAddonForm({ onCreate, creating, onCancel }) {
  const [form, setForm] = useState(BLANK_NEW_ADDON);
  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const valid = form.name.trim() && Number(form.price) > 0;

  return (
    <div style={{ ...card, padding: '14px 18px', border: `1px solid ${T.accent}40`, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input
        placeholder="Add-on name (e.g. Custom Favicon)"
        value={form.name} onChange={e => setField('name', e.target.value)}
        style={{ ...inpStyle, width: '100%' }}
      />
      <input
        placeholder="Short description shown to customers"
        value={form.desc} onChange={e => setField('desc', e.target.value)}
        style={{ ...inpStyle, width: '100%' }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: T.muted }}>₹</span>
          <Inp type="number" value={form.price} onChange={v => setField('price', v)} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} style={ghostBtn(T.muted, { fontSize: 11.5, padding: '6px 14px' })}>Cancel</button>
          <button
            onClick={() => onCreate(form)}
            disabled={creating || !valid}
            style={solidBtn(T.accent, { fontSize: 11.5, padding: '6px 16px', opacity: !valid ? 0.5 : 1 })}
          >
            {creating ? 'Adding…' : 'Add Add-on'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddonsSettings({ onToast }) {
  const [settings, setSettings] = useState(null);
  const [dirty,    setDirty]    = useState({});
  const [saving,   setSaving]   = useState(false);
  const [addingTo, setAddingTo] = useState(null);   // group label currently showing the "new add-on" form
  const [creating, setCreating] = useState(false);
  const [busyId,   setBusyId]   = useState(null);   // custom addon id currently being deleted

  const load = useCallback(async () => {
    const s = await apiFetch('/admin/settings');
    if (!s?.error) setSettings(s);
  }, []);

  useEffect(() => { load(); }, [load]);

  const update = (key, value) => {
    setDirty(d => ({ ...d, [key]: value }));
    setSettings(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const parts = key.split('.');
      let obj = next;
      for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
      obj[parts[parts.length - 1]] = value;
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    const res = await apiFetch('/admin/settings', { method: 'PATCH', body: dirty });
    setSaving(false);
    if (res.ok) { setDirty({}); onToast('Add-ons saved ✅'); }
    else onToast(res.error || 'Save failed', false);
  };

  const createAddon = async (group, form) => {
    setCreating(true);
    const res = await apiFetch('/admin/custom-addons', {
      method: 'POST',
      body: { plan_id: GROUP_PLAN_ID[group], name: form.name, desc: form.desc, price: Number(form.price) },
    });
    setCreating(false);
    if (!res?.error) { onToast('Add-on created'); setAddingTo(null); load(); }
    else onToast(res.error || 'Failed', false);
  };

  const deleteAddon = async (id) => {
    setBusyId(id);
    const res = await apiFetch(`/admin/custom-addons/${id}`, { method: 'DELETE' });
    setBusyId(null);
    if (!res?.error) {
      onToast('Add-on deleted');
      // Drop any unsaved price/enabled edits for the id we just removed.
      setDirty(d => Object.fromEntries(Object.entries(d).filter(([k]) => !k.startsWith(`addons.${id}.`))));
      load();
    } else onToast(res.error || 'Failed', false);
  };

  if (!settings) return <div style={{ color: T.muted, padding: 40, textAlign: 'center' }}>Loading…</div>;

  const dirtyCount = Object.keys(dirty).length;
  const customAddons = settings.custom_addons || [];

  return (
    <div>
      <SectionTitle title="Add-ons" subtitle="Set prices and visibility for each optional add-on, or create your own." />
      <SaveBar dirty={dirtyCount} onSave={save} saving={saving} />

      {['Portfolio', 'Small Website', 'Pro'].map(group => {
        const groupCustom = customAddons.filter(a => a.plan_id === GROUP_PLAN_ID[group]);
        return (
          <div key={group} style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '0 4px' }}>
              <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{group}</div>
              {addingTo !== group && (
                <button onClick={() => setAddingTo(group)} style={ghostBtn(T.accent, { fontSize: 11, padding: '4px 10px' })}>+ Add-on</button>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {ADDON_META.filter(a => a.plan === group).map(a => (
                <div key={a.id} style={{ ...card, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, fontSize: 13, color: T.text }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: T.muted, fontFamily: 'monospace' }}>{a.id}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, color: T.muted }}>₹</span>
                    <Inp type="number" value={settings.addons?.[a.id]?.price} onChange={v => update(`addons.${a.id}.price`, v)} />
                  </div>
                  <Toggle checked={settings.addons?.[a.id]?.enabled ?? true} onChange={v => update(`addons.${a.id}.enabled`, v)} />
                </div>
              ))}
              {groupCustom.map(a => (
                <div key={a.id} style={{ ...card, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', border: `1px solid ${T.accent}30` }}>
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <div style={{ fontSize: 13, color: T.text }}>{a.name}</div>
                    {a.desc && <div style={{ fontSize: 11.5, color: T.muted, marginTop: 2 }}>{a.desc}</div>}
                  </div>
                  <div style={{ fontSize: 10.5, color: T.accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Custom</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, color: T.muted }}>₹</span>
                    <Inp type="number" value={settings.addons?.[a.id]?.price} onChange={v => update(`addons.${a.id}.price`, v)} />
                  </div>
                  <Toggle checked={settings.addons?.[a.id]?.enabled ?? true} onChange={v => update(`addons.${a.id}.enabled`, v)} />
                  <button
                    onClick={() => deleteAddon(a.id)}
                    disabled={busyId === a.id}
                    style={ghostBtn(T.red, { fontSize: 11, padding: '5px 12px', opacity: busyId === a.id ? 0.5 : 1 })}
                  >
                    {busyId === a.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              ))}
              {addingTo === group && (
                <NewAddonForm
                  creating={creating}
                  onCancel={() => setAddingTo(null)}
                  onCreate={(form) => createAddon(group, form)}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Capacity & Waitlist ────────────────────────────────────
const dateLabel = (iso) => iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const dateTimeLabel = (iso) => iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

function ActiveSlotCard({ booking, onFree, busy }) {
  const planColor = { portfolio: '#10B981', starter: C.accent, pro: '#EC4899' }[booking.plan_id] || T.accent;
  return (
    <div style={{ ...card, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 8 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: planColor, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 140 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{booking.customer_name}</div>
        <div style={{ fontSize: 12, color: planColor }}>{booking.plan_name}</div>
      </div>
      <div style={{ fontSize: 12, color: T.muted }}>Started {dateLabel(booking.created_at)}</div>
      <div style={{ fontSize: 12, color: T.muted }}>Frees {dateLabel(booking.slot_expires_at)}</div>
      <StatusBadge status={booking.status} />
      <button
        style={ghostBtn(T.yellow, { fontSize: 11.5, padding: '6px 12px', opacity: busy === booking.id ? 0.5 : 1 })}
        disabled={busy === booking.id}
        onClick={() => onFree(booking.id)}
      >
        {busy === booking.id ? 'Working…' : 'Free Slot Early'}
      </button>
    </div>
  );
}

function WaitlistCard({ entry, onNotify, onCancel, busy }) {
  return (
    <div style={{ ...card, padding: '14px 18px', marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        {!!entry.is_urgent && (
          <span style={{ background: 'rgba(245,158,11,0.15)', color: T.yellow, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>⚡ Urgent</span>
        )}
        {entry.reason === 'unavailable' && (
          <span style={{ background: 'rgba(139,92,246,0.15)', color: T.violet, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>Plan Paused</span>
        )}
        <div style={{ flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{entry.customer_name}</div>
          <div style={{ fontSize: 12, color: T.muted }}>{entry.customer_email} · {entry.customer_phone}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, color: T.accent, fontWeight: 600 }}>{entry.plan_name}</div>
          {entry.plan_price != null && <div style={{ fontSize: 12, color: T.muted }}>₹{fmt(entry.plan_price)}</div>}
        </div>
        <div style={{ fontSize: 12, color: T.muted }}>Joined {dateLabel(entry.created_at)}</div>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
          background: entry.status === 'notified' ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.06)',
          color: entry.status === 'notified' ? T.green : T.muted,
        }}>
          {entry.status === 'waiting' ? 'Waiting' : entry.status === 'notified' ? 'Invited' : entry.status}
        </span>
      </div>
      {entry.notes && <div style={{ fontSize: 12, color: T.dim, marginTop: 8 }}>{entry.notes}</div>}
      {entry.status === 'notified' && (
        <div style={{ marginTop: 10, fontSize: 11.5, color: T.muted }}>
          Invite sent {dateTimeLabel(entry.notified_at)} · expires {dateTimeLabel(entry.invite_expires_at)}
        </div>
      )}
      {entry.status === 'waiting' && (
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button
            style={solidBtn(T.green, { fontSize: 11.5, padding: '6px 14px', opacity: busy === entry.id ? 0.5 : 1 })}
            disabled={busy === entry.id}
            onClick={() => onNotify(entry.id)}
          >
            {busy === entry.id ? 'Working…' : '🎉 Notify — Slot Open'}
          </button>
          <button
            style={ghostBtn(T.red, { fontSize: 11.5, padding: '6px 14px' })}
            disabled={busy === entry.id}
            onClick={() => onCancel(entry.id)}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

function CapacitySection({ onToast }) {
  const [overview, setOverview] = useState(null);
  const [waitlist, setWaitlist] = useState([]);
  const [dirty,    setDirty]    = useState({});
  const [saving,   setSaving]   = useState(false);
  const [busy,     setBusy]     = useState(null);
  const [confirm,  setConfirm]  = useState(null);

  const load = useCallback(async () => {
    const [o, w] = await Promise.all([apiFetch('/admin/capacity'), apiFetch('/admin/waitlist')]);
    if (!o?.error) setOverview(o);
    if (Array.isArray(w)) setWaitlist(w);
  }, []);

  useEffect(() => { load(); }, [load]);

  const update = (key, value) => setDirty(d => ({ ...d, [key]: value }));

  const saveSettings = async () => {
    setSaving(true);
    const res = await apiFetch('/admin/settings', { method: 'PATCH', body: dirty });
    setSaving(false);
    if (res.ok) { setDirty({}); onToast('Capacity settings saved ✅'); load(); }
    else onToast(res.error || 'Save failed', false);
  };

  const freeSlot = async (id) => {
    setBusy(id);
    const res = await apiFetch(`/booking/${id}/free-slot`, { method: 'POST' });
    setBusy(null);
    if (res.ok) { onToast('Slot freed ✅'); load(); }
    else onToast(res.error || 'Failed', false);
  };

  const resetAll = async () => {
    setConfirm(null);
    setBusy('reset');
    const res = await apiFetch('/admin/capacity/reset', { method: 'POST' });
    setBusy(null);
    if (res.ok) { onToast('All slots reset ✅'); load(); }
    else onToast(res.error || 'Failed', false);
  };

  const notifyWaitlist = async (id) => {
    setBusy(id);
    const res = await apiFetch(`/admin/waitlist/${id}/notify`, { method: 'POST' });
    setBusy(null);
    if (res.ok) { onToast('Customer notified — invite sent ✅'); load(); }
    else onToast(res.error || 'Failed', false);
  };

  const cancelWaitlist = async (id) => {
    setBusy(id);
    const res = await apiFetch(`/admin/waitlist/${id}/cancel`, { method: 'POST' });
    setBusy(null);
    if (res.ok) { onToast('Removed from waiting list'); load(); }
    else onToast(res.error || 'Failed', false);
  };

  if (!overview) return <div style={{ color: T.muted, padding: 40, textAlign: 'center' }}>Loading…</div>;

  const dirtyCount = Object.keys(dirty).length;
  const waiting = waitlist.filter(w => w.status === 'waiting' || w.status === 'notified');
  const maxSlots = dirty['capacity.max_slots'] ?? overview.maxSlots;
  const slotDuration = dirty['capacity.slot_duration_days'] ?? overview.slotDurationDays;

  return (
    <div>
      <SectionTitle title="Capacity" subtitle="Limit how many projects you're actively running at once — customers see a waiting list once slots are full." />

      {/* Metrics */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <MetricCard label="Active Slots" value={`${overview.activeCount} / ${overview.maxSlots}`} color={overview.available ? T.green : T.red} />
        <MetricCard label="Waiting List" value={overview.waitingCount} color={T.accent} />
        <MetricCard label="Next Opening" value={overview.nextFreeAt ? dateLabel(overview.nextFreeAt) : '—'} color={T.muted} />
        <MetricCard label="Urgent This Week" value={overview.urgentAvailable ? 'Available' : 'Used'} color={overview.urgentAvailable ? T.green : T.yellow} />
      </div>

      {/* Settings */}
      <div style={{ ...card, padding: '20px 24px', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontSize: 12, color: T.dim, fontWeight: 600, display: 'block', marginBottom: 7 }}>Max concurrent projects</label>
              <Inp type="number" value={maxSlots} onChange={v => update('capacity.max_slots', v)} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: T.dim, fontWeight: 600, display: 'block', marginBottom: 7 }}>Slot duration</label>
              <Inp type="number" value={slotDuration} onChange={v => update('capacity.slot_duration_days', v)} suffix="days" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            {dirtyCount > 0 && (
              <button onClick={saveSettings} disabled={saving} style={solidBtn(T.green)}>{saving ? 'Saving…' : 'Save'}</button>
            )}
            <button
              onClick={() => setConfirm({ message: 'Force-free every currently active slot? This immediately opens up capacity for new bookings, even for in-progress projects. Use only if the counter looks stuck.', action: 'reset' })}
              style={ghostBtn(T.red)}
              disabled={busy === 'reset'}
            >
              {busy === 'reset' ? 'Working…' : 'Reset Counter'}
            </button>
          </div>
        </div>
        <div style={{ marginTop: 14, fontSize: 12, color: T.muted, lineHeight: 1.6 }}>
          A project occupies a slot from booking until it's marked Complete/Cancelled, {slotDuration} days pass, or you free it early below.
        </div>
      </div>

      {/* Active projects */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
          Active Projects ({overview.activeCount})
        </div>
        {overview.active.length === 0 ? (
          <div style={{ ...card, padding: 24, textAlign: 'center', color: T.muted, fontSize: 13 }}>No active projects — all slots open.</div>
        ) : (
          overview.active.map(b => <ActiveSlotCard key={b.id} booking={b} onFree={freeSlot} busy={busy} />)
        )}
      </div>

      {/* Waitlist */}
      <div>
        <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
          Waiting List ({waiting.length})
        </div>
        {waiting.length === 0 ? (
          <div style={{ ...card, padding: 24, textAlign: 'center', color: T.muted, fontSize: 13 }}>No one waiting right now.</div>
        ) : (
          waiting.map(w => <WaitlistCard key={w.id} entry={w} onNotify={notifyWaitlist} onCancel={cancelWaitlist} busy={busy} />)
        )}
      </div>

      {confirm && (
        <ConfirmDialog
          message={confirm.message}
          onConfirm={resetAll}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

// ─── Feedback ───────────────────────────────────────────────
function StarsRow({ n }) {
  return (
    <span style={{ color: T.yellow, fontSize: 13, letterSpacing: 1 }}>
      {'★'.repeat(n)}<span style={{ color: T.border }}>{'★'.repeat(5 - n)}</span>
    </span>
  );
}

function FeedbackCard({ entry, onPatch, onDelete, busy }) {
  return (
    <div style={{ ...card, padding: '16px 20px', marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{entry.customer_name}</span>
            <StarsRow n={entry.rating} />
            {!!entry.plan_name && (
              <span style={{ fontSize: 11, color: T.accent, background: 'rgba(14,165,233,0.1)', borderRadius: 20, padding: '2px 9px' }}>{entry.plan_name}</span>
            )}
          </div>
          <div style={{ fontSize: 13, color: T.dim, lineHeight: 1.6 }}>{entry.message}</div>
          <div style={{ fontSize: 11, color: T.muted, marginTop: 8 }}>
            {entry.customer_email && <>{entry.customer_email} · </>}{dateLabel(entry.created_at)}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Toggle checked={!!entry.approved} onChange={v => onPatch(entry.id, { approved: v })} />
            <span style={{ fontSize: 11.5, color: entry.approved ? T.green : T.muted, fontWeight: 600 }}>
              {entry.approved ? 'Approved' : 'Pending'}
            </span>
          </div>
          {!!entry.approved && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Toggle checked={!!entry.featured} onChange={v => onPatch(entry.id, { featured: v })} />
              <span style={{ fontSize: 11.5, color: entry.featured ? T.yellow : T.muted, fontWeight: 600 }}>
                {entry.featured ? 'Featured' : 'Feature it'}
              </span>
            </div>
          )}
          <button
            onClick={() => onDelete(entry.id)}
            disabled={busy === entry.id}
            style={{ ...ghostBtn(T.red, { fontSize: 11, padding: '5px 12px' }) }}
          >
            {busy === entry.id ? 'Working…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

function FeedbackSection({ onToast }) {
  const [items, setItems] = useState(null);
  const [busy,  setBusy]  = useState(null);
  const [filter, setFilter] = useState('all'); // all | pending | approved | featured

  const load = useCallback(async () => {
    const data = await apiFetch('/admin/feedback');
    if (Array.isArray(data)) setItems(data);
  }, []);

  useEffect(() => { load(); }, [load]);

  const patch = async (id, body) => {
    setBusy(id);
    const res = await apiFetch(`/admin/feedback/${id}`, { method: 'PATCH', body });
    setBusy(null);
    if (!res?.error) { onToast('Updated ✅'); load(); }
    else onToast(res.error || 'Failed', false);
  };

  const remove = async (id) => {
    setBusy(id);
    const res = await apiFetch(`/admin/feedback/${id}`, { method: 'DELETE' });
    setBusy(null);
    if (!res?.error) { onToast('Removed'); load(); }
    else onToast(res.error || 'Failed', false);
  };

  if (!items) return <div style={{ color: T.muted, padding: 40, textAlign: 'center' }}>Loading…</div>;

  const filtered = items.filter(f => {
    if (filter === 'pending')  return !f.approved;
    if (filter === 'approved') return !!f.approved;
    if (filter === 'featured') return !!f.featured;
    return true;
  });
  const avgRating = items.length ? (items.reduce((s, f) => s + f.rating, 0) / items.length).toFixed(1) : '—';

  return (
    <div>
      <SectionTitle title="Feedback" subtitle="Reviews customers submit via the QR code on your thank-you card. Approve the ones you're happy with, feature your favorites on the site." />

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <MetricCard label="Total Reviews" value={items.length} color={T.accent} />
        <MetricCard label="Average Rating" value={avgRating} color={T.yellow} />
        <MetricCard label="Pending Review" value={items.filter(f => !f.approved).length} color={T.muted} />
        <MetricCard label="Featured" value={items.filter(f => f.featured).length} color={T.green} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['all', 'pending', 'approved', 'featured'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              background: filter === f ? T.accent : 'transparent',
              color: filter === f ? '#fff' : T.muted,
              border: `1px solid ${filter === f ? T.accent : T.border}`,
              borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ ...card, padding: 32, textAlign: 'center', color: T.muted, fontSize: 13 }}>No feedback here yet.</div>
      ) : (
        filtered.map(f => <FeedbackCard key={f.id} entry={f} onPatch={patch} onDelete={remove} busy={busy} />)
      )}
    </div>
  );
}

// ─── Promotions ─────────────────────────────────────────────
// Writes require the admin bearer token (requireAdmin on every /admin/promos
// route, see functions/api/admin/promos/) — no visitor, script, or API caller
// without that token can create, edit, enable, or delete a promo. The public
// /api/promos endpoint is read-only and only ever returns enabled promos that
// are inside their date window.
const PROMO_THEMES = [
  { id: 'accent', label: 'Sky',    color: T.accent },
  { id: 'gold',   label: 'Gold',   color: T.yellow },
  { id: 'green',  label: 'Green',  color: T.green },
  { id: 'purple', label: 'Purple', color: T.violet },
];

function toDateInput(iso) {
  return iso ? iso.slice(0, 10) : '';
}
function fromDateInput(dateStr, endOfDay) {
  if (!dateStr) return null;
  return `${dateStr}T${endOfDay ? '23:59:59.999Z' : '00:00:00.000Z'}`;
}

function ThemePicker({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {PROMO_THEMES.map(t => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          title={t.label}
          style={{
            width: 26, height: 26, borderRadius: '50%', background: t.color, cursor: 'pointer',
            border: value === t.id ? '2px solid #fff' : '2px solid transparent',
            boxShadow: value === t.id ? `0 0 0 2px ${t.color}` : 'none',
            padding: 0,
          }}
        />
      ))}
    </div>
  );
}

function DiscountTypePicker({ value, onChange }) {
  const opts = [{ id: 'percent', label: '%' }, { id: 'flat', label: '₹ flat' }];
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {opts.map(o => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          style={{
            background: value === o.id ? T.accent : 'transparent',
            color: value === o.id ? '#fff' : T.muted,
            border: `1px solid ${value === o.id ? T.accent : T.border}`,
            borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function PromoFields({ form, setField }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 160px' }}>
          <label style={{ fontSize: 11, color: T.muted, fontWeight: 600, display: 'block', marginBottom: 5 }}>Badge text</label>
          <Inp value={form.badge_text} onChange={v => setField('badge_text', v)} placeholder="LIMITED TIME" wide />
        </div>
        <div style={{ flex: '2 1 240px' }}>
          <label style={{ fontSize: 11, color: T.muted, fontWeight: 600, display: 'block', marginBottom: 5 }}>Title *</label>
          <Inp value={form.title} onChange={v => setField('title', v)} placeholder="20% off Small Website plans" wide />
        </div>
      </div>
      <div>
        <label style={{ fontSize: 11, color: T.muted, fontWeight: 600, display: 'block', marginBottom: 5 }}>Subtitle</label>
        <Inp value={form.subtitle} onChange={v => setField('subtitle', v)} placeholder="Book before month-end and lock in the discount." wide />
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 160px' }}>
          <label style={{ fontSize: 11, color: T.muted, fontWeight: 600, display: 'block', marginBottom: 5 }}>Redeemable code (optional)</label>
          <Inp value={form.code} onChange={v => setField('code', v.toUpperCase())} placeholder="FESTIVE20" wide />
        </div>
        <div>
          <label style={{ fontSize: 11, color: T.muted, fontWeight: 600, display: 'block', marginBottom: 5 }}>Color</label>
          <ThemePicker value={form.theme} onChange={v => setField('theme', v)} />
        </div>
      </div>
      {!!form.code && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end', background: 'rgba(139,92,246,0.08)', border: `1px solid ${T.violet}30`, borderRadius: 10, padding: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: T.muted, fontWeight: 600, display: 'block', marginBottom: 5 }}>Discount type</label>
            <DiscountTypePicker value={form.discount_type} onChange={v => setField('discount_type', v)} />
          </div>
          <div style={{ flex: '1 1 120px' }}>
            <label style={{ fontSize: 11, color: T.muted, fontWeight: 600, display: 'block', marginBottom: 5 }}>
              Discount value {form.discount_type === 'flat' ? '(₹ off)' : '(% off)'}
            </label>
            <Inp type="number" value={form.discount_value} onChange={v => setField('discount_value', v)} placeholder={form.discount_type === 'flat' ? '500' : '20'} wide />
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 140px' }}>
          <label style={{ fontSize: 11, color: T.muted, fontWeight: 600, display: 'block', marginBottom: 5 }}>Starts (optional)</label>
          <input type="date" value={toDateInput(form.starts_at)} onChange={e => setField('starts_at', fromDateInput(e.target.value, false))} style={{ ...inpStyle, width: '100%' }} />
        </div>
        <div style={{ flex: '1 1 140px' }}>
          <label style={{ fontSize: 11, color: T.muted, fontWeight: 600, display: 'block', marginBottom: 5 }}>Ends (optional)</label>
          <input type="date" value={toDateInput(form.ends_at)} onChange={e => setField('ends_at', fromDateInput(e.target.value, true))} style={{ ...inpStyle, width: '100%' }} />
        </div>
      </div>
      <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.5 }}>
        Leave dates blank for an always-on promo until you switch it off. {form.code
          ? 'Customers who enter this code at checkout get the discount above automatically — the amount they pay is recalculated on the server, so it can’t be tampered with.'
          : 'No code set — this banner is a display-only announcement with nothing to redeem.'}
      </div>
    </div>
  );
}

function PromoCard({ entry, onSave, onDelete, busy }) {
  const [form, setForm] = useState(entry);
  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const dirty = JSON.stringify(form) !== JSON.stringify(entry);

  return (
    <div style={{ ...card, padding: '18px 20px', marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Toggle checked={!!form.enabled} onChange={v => setField('enabled', v)} />
          <span style={{ fontSize: 12, fontWeight: 700, color: form.enabled ? T.green : T.muted }}>
            {form.enabled ? 'Live on site' : 'Off'}
          </span>
        </div>
        <div style={{ fontSize: 11, color: T.muted }}>Created {dateLabel(entry.created_at)}</div>
      </div>

      {!!entry.code && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 14, fontSize: 12, color: T.dim }}>
          <span><strong style={{ color: T.text }}>{entry.redemptions || 0}</strong> redemption{entry.redemptions === 1 ? '' : 's'}</span>
          <span><strong style={{ color: T.green }}>₹{fmt(entry.total_discounted || 0)}</strong> given in discounts</span>
        </div>
      )}

      <PromoFields form={form} setField={setField} />

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
        <button onClick={() => onDelete(entry.id)} disabled={busy === entry.id} style={ghostBtn(T.red, { fontSize: 11.5, padding: '6px 14px' })}>
          {busy === entry.id ? 'Working…' : 'Delete'}
        </button>
        {dirty && (
          <button onClick={() => onSave(entry.id, form)} disabled={busy === entry.id} style={solidBtn(T.green, { fontSize: 11.5, padding: '6px 16px' })}>
            {busy === entry.id ? 'Saving…' : 'Save Changes'}
          </button>
        )}
      </div>
    </div>
  );
}

const BLANK_PROMO = { badge_text: '', title: '', subtitle: '', code: '', theme: 'accent', enabled: false, starts_at: null, ends_at: null, discount_type: 'percent', discount_value: 0 };

function NewPromoForm({ onCreate, creating, onCancel }) {
  const [form, setForm] = useState(BLANK_PROMO);
  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ ...card, padding: '18px 20px', marginBottom: 16, border: `1px solid ${T.accent}40` }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 14 }}>New promotion</div>
      <PromoFields form={form} setField={setField} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
        <button onClick={onCancel} style={ghostBtn(T.muted, { fontSize: 11.5, padding: '6px 14px' })}>Cancel</button>
        <button
          onClick={() => onCreate(form)}
          disabled={creating || !form.title.trim()}
          style={solidBtn(T.accent, { fontSize: 11.5, padding: '6px 16px', opacity: !form.title.trim() ? 0.5 : 1 })}
        >
          {creating ? 'Creating…' : 'Create Promotion'}
        </button>
      </div>
    </div>
  );
}

function PromosSection({ onToast }) {
  const [items,    setItems]    = useState(null);
  const [busy,     setBusy]     = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    const data = await apiFetch('/admin/promos');
    if (Array.isArray(data)) setItems(data);
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async (form) => {
    if (!form.title.trim()) return;
    setCreating(true);
    const res = await apiFetch('/admin/promos', { method: 'POST', body: form });
    setCreating(false);
    if (!res?.error) { onToast('Promotion created'); setShowForm(false); load(); }
    else onToast(res.error || 'Failed', false);
  };

  const save = async (id, form) => {
    setBusy(id);
    const res = await apiFetch(`/admin/promos/${id}`, { method: 'PATCH', body: form });
    setBusy(null);
    if (!res?.error) { onToast('Saved'); load(); }
    else onToast(res.error || 'Failed', false);
  };

  const remove = async (id) => {
    setBusy(id);
    const res = await apiFetch(`/admin/promos/${id}`, { method: 'DELETE' });
    setBusy(null);
    if (!res?.error) { onToast('Deleted'); load(); }
    else onToast(res.error || 'Failed', false);
  };

  if (!items) return <div style={{ color: T.muted, padding: 40, textAlign: 'center' }}>Loading…</div>;

  const liveCount = items.filter(p => p.enabled).length;

  return (
    <div>
      <SectionTitle title="Promotions" subtitle="Showcase a limited-time offer on the homepage. Only you can create, edit, or turn these on — visitors can only see the one that's currently live." />

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <MetricCard label="Total Promotions" value={items.length} color={T.violet} />
        <MetricCard label="Currently Live" value={liveCount} color={T.green} />
        <MetricCard label="Total Redemptions" value={items.reduce((s, p) => s + (p.redemptions || 0), 0)} color={T.accent} />
        <MetricCard label="Total Discounted" value={`₹${fmt(items.reduce((s, p) => s + (p.total_discounted || 0), 0))}`} color={T.yellow} />
      </div>

      {!showForm && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button onClick={() => setShowForm(true)} style={solidBtn(T.violet)}>+ New Promotion</button>
        </div>
      )}
      {showForm && <NewPromoForm onCreate={create} creating={creating} onCancel={() => setShowForm(false)} />}

      {items.length === 0 ? (
        <div style={{ ...card, padding: 32, textAlign: 'center', color: T.muted, fontSize: 13 }}>No promotions yet — create one to show a banner on the homepage.</div>
      ) : (
        items.map(p => <PromoCard key={p.id} entry={p} onSave={save} onDelete={remove} busy={busy} />)
      )}
    </div>
  );
}

// ─── Email Settings ─────────────────────────────────────────
function EmailSettings() {
  const [config,   setConfig]   = useState(null);
  const [testing,  setTesting]  = useState(false);
  const [result,   setResult]   = useState(null);

  useEffect(() => {
    apiFetch('/admin/email-status').then(d => { if (!d?.error) setConfig(d); else setConfig({ _error: d.error }); });
  }, []);

  const runTest = async () => {
    setTesting(true);
    setResult(null);
    const data = await apiFetch('/test-email');
    setResult({ ok: data.ok === true, data });
    setTesting(false);
  };

  const row = (label, value, color) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: `1px solid ${T.border}`, gap: 12 }}>
      <span style={{ fontSize: 12, color: T.muted, fontWeight: 600, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12, color: color || T.text, textAlign: 'right', fontFamily: 'monospace', wordBreak: 'break-all' }}>{value}</span>
    </div>
  );

  const modeColor  = config?.mode === 'production' ? T.green : config?.mode === 'sandbox_restricted' ? T.red : T.yellow;
  const modeLabel  = config?.mode === 'production' ? '✅ Production — full delivery' : config?.mode === 'sandbox_restricted' ? '⚠️ Sandbox — only Resend account email can receive' : config?.mode === 'sandbox_override' ? '🧪 Sandbox with override recipient' : '…';

  const sandboxRestricted = config?.mode === 'sandbox_restricted';
  const rawResponse = result?.data?.resend_response;
  const sandboxError = typeof rawResponse === 'string' && rawResponse.includes('testing emails');

  return (
    <div>
      <SectionTitle title="Email" subtitle="Live configuration from Cloudflare Pages secrets." />

      {/* Live config from server */}
      <div style={{ ...card, padding: '20px 24px', marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Live Configuration</div>
        {!config ? (
          <div style={{ fontSize: 12, color: T.muted }}>Loading…</div>
        ) : config._error ? (
          <div style={{ fontSize: 12, color: T.red }}>{config._error}</div>
        ) : (
          <>
            {row('API key',         config.api_key_set ? `${config.api_key_prefix} (set ✓)` : '❌ NOT SET', config.api_key_set ? T.green : T.red)}
            {row('From address',    config.from,  config.from?.startsWith('⚠️') ? T.red : T.text)}
            {row('To override',     config.to_override || '(none — emails go to customers ✓)', config.to_override ? T.yellow : T.green)}
            {row('Mode',            modeLabel, modeColor)}
          </>
        )}

        {sandboxRestricted && (
          <div style={{ marginTop: 14, background: 'rgba(239,68,68,0.08)', border: `1px solid ${T.red}40`, borderRadius: 8, padding: '12px 14px', fontSize: 12, color: T.dim, lineHeight: 1.7 }}>
            <strong style={{ color: T.red }}>Why customers aren't getting emails:</strong> You're using{' '}
            <code style={{ fontFamily: 'monospace', fontSize: 11 }}>onboarding@resend.dev</code> as the sender.
            Resend sandbox only delivers to your Resend account email.{' '}
            <strong style={{ color: T.text }}>Fix: verify bespokedeploy.in at{' '}
            <a href="https://resend.com/domains" target="_blank" rel="noreferrer" style={{ color: T.accent }}>resend.com/domains</a>,
            then update the <code style={{ fontFamily: 'monospace', fontSize: 11 }}>RESEND_FROM</code> secret to{' '}
            <code style={{ fontFamily: 'monospace', fontSize: 11 }}>BespokeDeploy &lt;noreply@bespokedeploy.in&gt;</code>.</strong>
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <button onClick={runTest} disabled={testing} style={solidBtn(T.accent, { padding: '10px 20px', fontSize: 13, opacity: testing ? 0.5 : 1 })}>
            <Mail size={14} />
            {testing ? 'Sending…' : 'Send Test Email'}
          </button>
        </div>
      </div>

      {/* Test result */}
      {result && (
        <div style={{
          ...card, padding: '20px 24px', marginBottom: 16,
          borderColor: result.ok ? T.green + '60' : T.red + '60',
          background:  result.ok ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 18 }}>{result.ok ? '✅' : '❌'}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: result.ok ? T.green : T.red }}>
              {result.ok ? 'Test email sent — check your inbox' : 'Send failed'}
            </span>
          </div>
          {result.data.sent_to   && row('Sent to',   result.data.sent_to)}
          {result.data.sent_from && row('Sent from', result.data.sent_from)}
          {result.data.api_key_prefix && row('API key', result.data.api_key_prefix)}
          {result.data.resend_status  && row('Resend HTTP', String(result.data.resend_status))}
          {(result.data.error || result.data.resend_response || result.data.hint) && (
            <pre style={{
              marginTop: 10, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8,
              padding: '10px 14px', fontSize: 11.5, color: T.dim,
              overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace', lineHeight: 1.6,
            }}>
              {[result.data.error, result.data.hint, result.data.resend_response].filter(Boolean).join('\n\n')}
            </pre>
          )}
          {sandboxError && (
            <div style={{ marginTop: 12, fontSize: 12, color: T.yellow, lineHeight: 1.6 }}>
              ⚠️ Resend sandbox restriction — domain not verified yet.<br />
              Verify <strong>bespokedeploy.in</strong> at <a href="https://resend.com/domains" target="_blank" rel="noreferrer" style={{ color: T.accent }}>resend.com/domains</a> then update the <code style={{ fontFamily: 'monospace', fontSize: 11 }}>RESEND_FROM</code> secret.
            </div>
          )}
        </div>
      )}

      {/* Trigger reference */}
      <div style={{ ...card, padding: '20px 24px' }}>
        <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Email Triggers</div>
        {[
          ['Booking confirmed', 'Advance paid → full receipt to customer + admin alert'],
          ['Contacting',        'Admin marks Contacting'],
          ['In Progress',       'Admin marks In Progress'],
          ['Payment Link',      'Admin sends final payment link'],
          ['Review',            'Final payment confirmed → review window email'],
          ['Complete',          'Admin marks Complete → handover email'],
          ['Cancelled',         'Admin cancels → cancellation notice'],
        ].map(([t, d]) => (
          <div key={t} style={{ display: 'flex', gap: 12, padding: '7px 0', borderBottom: `1px solid ${T.divider}` }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.accent, minWidth: 130, flexShrink: 0 }}>{t}</span>
            <span style={{ fontSize: 12, color: T.muted }}>{d}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Site Content ───────────────────────────────────────────
function GeneralSettings({ onToast }) {
  const [settings, setSettings] = useState(null);
  const [dirty,    setDirty]    = useState({});
  const [saving,   setSaving]   = useState(false);

  useEffect(() => { apiFetch('/admin/settings').then(s => { if (!s?.error) setSettings(s); }); }, []);

  const update = (key, value) => {
    setDirty(d => ({ ...d, [key]: value }));
    setSettings(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const parts = key.split('.');
      let obj = next;
      for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
      obj[parts[parts.length - 1]] = value;
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    const res = await apiFetch('/admin/settings', { method: 'PATCH', body: dirty });
    setSaving(false);
    if (res.ok) { setDirty({}); onToast('Settings saved ✅'); }
    else onToast(res.error || 'Save failed', false);
  };

  if (!settings) return <div style={{ color: T.muted, padding: 40, textAlign: 'center' }}>Loading…</div>;

  const dirtyCount = Object.keys(dirty).length;

  const fields = [
    { key: 'general.email',    label: 'Contact Email',        placeholder: 'you@email.com',             val: settings.general?.email    },
    { key: 'general.whatsapp', label: 'WhatsApp Number',      placeholder: '91XXXXXXXXXX',              val: settings.general?.whatsapp },
    { key: 'hero.tagline',     label: 'Hero Badge Text',      placeholder: '🚀 Custom websites · Free hosting', val: settings.hero?.tagline  },
    { key: 'hero.subtitle',    label: 'Hero Subtitle',        placeholder: 'From portfolio pages to full business sites…', val: settings.hero?.subtitle },
    { key: 'hero.cta',         label: 'Hero CTA Button Text', placeholder: 'See Plans & Pricing',       val: settings.hero?.cta         },
  ];

  return (
    <div>
      <SectionTitle title="Site Content" subtitle="Control text that appears on the customer-facing website." />
      <SaveBar dirty={dirtyCount} onSave={save} saving={saving} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {fields.map(({ key, label, val, placeholder }) => (
          <div key={key} style={{ ...card, padding: '18px 22px' }}>
            <label style={{ fontSize: 12, color: T.muted, fontWeight: 600, display: 'block', marginBottom: 8 }}>{label}</label>
            <input
              type="text" value={val ?? ''} placeholder={placeholder}
              onChange={e => update(key, e.target.value)}
              style={{ ...inpStyle, width: '100%' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Security ───────────────────────────────────────────────
function SecuritySettings({ onToast }) {
  const [curPw,  setCurPw]  = useState('');
  const [newPw,  setNewPw]  = useState('');
  const [confPw, setConfPw] = useState('');
  const [busy,   setBusy]   = useState(false);

  const valid = curPw && newPw.length >= 8 && newPw === confPw;

  const change = async () => {
    if (!valid) return;
    setBusy(true);
    const res = await apiFetch('/admin/change-password', { method: 'POST', body: { current_password: curPw, new_password: newPw } });
    setBusy(false);
    if (res.ok) {
      onToast('Password changed — logging out…');
      setCurPw(''); setNewPw(''); setConfPw('');
      setTimeout(() => { localStorage.removeItem('bd_admin_token'); window.location.reload(); }, 1800);
    } else {
      onToast(res.error || 'Failed', false);
    }
  };

  return (
    <div>
      <SectionTitle title="Security" subtitle="Change your admin password. You will be logged out immediately after." />
      <div style={{ ...card, padding: '28px', maxWidth: 440 }}>
        {[
          { label: 'Current Password', val: curPw,  set: setCurPw,  ph: '••••••••', hint: '' },
          { label: 'New Password',     val: newPw,  set: setNewPw,  ph: '••••••••', hint: '(min 8 characters)' },
          { label: 'Confirm Password', val: confPw, set: setConfPw, ph: '••••••••', hint: '' },
        ].map(({ label, val, set, ph, hint }) => (
          <div key={label} style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: T.muted, fontWeight: 600, display: 'block', marginBottom: 7 }}>
              {label} {hint && <span style={{ fontWeight: 400 }}>{hint}</span>}
            </label>
            <input type="password" value={val} onChange={e => set(e.target.value)} placeholder={ph}
              style={{ ...inpStyle, width: '100%' }} />
          </div>
        ))}
        {confPw && newPw !== confPw && <div style={{ fontSize: 12, color: T.red, marginBottom: 14 }}>Passwords don't match</div>}
        <button onClick={change} disabled={busy || !valid}
          style={{ ...solidBtn(T.accent, { width: '100%', padding: '12px', fontSize: 14, justifyContent: 'center', opacity: (!valid || busy) ? 0.4 : 1 }) }}>
          {busy ? 'Updating…' : 'Update Password'}
        </button>
      </div>
    </div>
  );
}

// ─── Dashboard Section ─────────────────────────────────────
function DashboardSection({ metrics, bookings, loading, onAction, tab, setTab, onToast }) {
  const counts   = {};
  for (const b of bookings) counts[b.status] = (counts[b.status] || 0) + 1;
  const filtered = tab === 'all' ? bookings : bookings.filter(b => b.status === tab);

  return (
    <div>
      {metrics && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
          <MetricCard label="Total Revenue"   value={`₹${fmt(metrics.totalRevenue)}`}  color={T.green} />
          <MetricCard label="Pending Balance" value={`₹${fmt(metrics.pendingBalance)}`} color={T.yellow}
            sub={`${metrics.activeCount} active project${metrics.activeCount !== 1 ? 's' : ''}`} />
          <MetricCard label="Active Projects" value={metrics.activeCount}    color={T.accent} />
          <MetricCard label="Completed"       value={metrics.completedCount} color={T.muted} sub={`of ${metrics.total} total`} />
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {TABS.map(t => {
          const active = tab === t;
          const count  = t === 'all' ? bookings.length : (counts[t] || 0);
          const s      = STATUS[t];
          return (
            <button key={t} onClick={() => setTab(t)} style={{
              background: active ? (s?.bg || 'rgba(232,84,44,0.12)') : 'transparent',
              color:      active ? (s?.color || T.accent) : T.muted,
              border:     `1px solid ${active ? (s?.color || T.accent) + '50' : T.border}`,
              borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', transition: 'all .15s', fontFamily: 'inherit',
            }}>
              {t === 'all' ? 'All' : (s?.label || t)} {count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="popLayout">
        {filtered.length === 0 ? (
          <div style={{ ...card, padding: 40, textAlign: 'center', color: T.muted }}>
            No bookings {tab !== 'all' ? `with status "${STATUS[tab]?.label || tab}"` : 'yet'}.
          </div>
        ) : (
          filtered.map(b => (
            <motion.div key={b.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <BookingCard booking={b} onAction={onAction} loading={loading} onToast={onToast} />
            </motion.div>
          ))
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Admin Page ────────────────────────────────────────
export default function AdminPage() {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'robots');
    meta.setAttribute('content', 'noindex, nofollow');
    document.head.appendChild(meta);
    return () => document.head.removeChild(meta);
  }, []);

  const [authed,    setAuthed]    = useState(!!localStorage.getItem('bd_admin_token'));
  const [password,  setPassword]  = useState('');
  const [loginErr,  setLoginErr]  = useState('');
  const [loginBusy, setLoginBusy] = useState(false);

  const [bookings,  setBookings]  = useState([]);
  const [metrics,   setMetrics]   = useState(null);
  const [tab,       setTab]       = useState('all');
  const [loading,   setLoading]   = useState(null);
  const [toast,     setToast]     = useState(null);
  const [fetching,  setFetching]  = useState(false);
  const [page,      setPage]      = useState('dashboard');
  const [time,      setTime]      = useState('');
  const [sideOpen,  setSideOpen]  = useState(false);

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginBusy(true); setLoginErr('');
    const res = await fetch(`${API}/admin/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    }).then(r => r.json()).catch(() => ({}));
    setLoginBusy(false);
    if (res.token) { localStorage.setItem('bd_admin_token', res.token); setAuthed(true); }
    else setLoginErr(res.error || 'Login failed');
  };

  const fetchAll = useCallback(async () => {
    setFetching(true);
    const [b, m] = await Promise.all([apiFetch('/bookings'), apiFetch('/admin/metrics')]);
    if (Array.isArray(b)) setBookings(b);
    if (m?.totalRevenue !== undefined) setMetrics(m);
    setFetching(false);
  }, []);

  useEffect(() => { if (authed) fetchAll(); }, [authed, fetchAll]);

  // ── Auto-poll when bookings are awaiting payment ──────────
  useEffect(() => {
    if (!authed) return;
    const hasAwaiting = bookings.some(b => b.status === 'awaiting_payment');
    if (!hasAwaiting) return;

    const prevIds = new Set(
      bookings.filter(b => b.status === 'awaiting_payment').map(b => b.id)
    );

    const poll = setInterval(async () => {
      const fresh = await apiFetch('/bookings');
      if (!Array.isArray(fresh)) return;

      // Detect bookings that moved out of awaiting_payment → review
      const justPaid = fresh.filter(b => b.status === 'review' && prevIds.has(b.id));
      if (justPaid.length > 0) {
        justPaid.forEach(b => {
          showToast(`💳 Final payment received — ${b.customer_name} (${b.id})`, true);
        });
      }

      setBookings(fresh);
      // If nothing awaiting anymore, stop polling
      if (!fresh.some(b => b.status === 'awaiting_payment')) clearInterval(poll);
    }, 8000);

    return () => clearInterval(poll);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, bookings.map(b => b.id + b.status).join(',')]);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 5000);
  };

  const handleAction = async (id, action, reason) => {
    setLoading(id);
    try {
      if (action === 'payment-link') {
        const res = await apiFetch(`/booking/${id}/payment-link`, { method: 'POST' });
        if (res.ok) showToast('Payment link sent ✅');
        else showToast(res.error || 'Failed to create payment link', false);
      } else if (action === 'check-payment') {
        const res = await apiFetch(`/booking/${id}/check-payment`, { method: 'POST' });
        if (res.paid) showToast(res.message || 'Payment confirmed ✅ — moved to Review');
        else if (res.already) showToast(`Already ${res.status}`, true);
        else showToast(res.message || res.error || 'Payment not yet received', false);
      } else if (action === 'delete') {
        const res = await apiFetch(`/booking/${id}`, { method: 'DELETE' });
        if (res.ok) showToast('Booking deleted 🗑');
        else showToast(res.error || 'Failed to delete', false);
      } else if (action === 'cancel') {
        const body = { status: 'cancelled' };
        if (reason && reason.trim()) body.cancel_reason = reason.trim();
        const res = await apiFetch(`/booking/${id}/status`, { method: 'PATCH', body });
        if (res.ok) showToast('Booking cancelled');
        else showToast(res.error || 'Failed to cancel', false);
      } else if (action.startsWith('status:')) {
        const status = action.replace('status:', '');
        const res = await apiFetch(`/booking/${id}/status`, { method: 'PATCH', body: { status } });
        if (res.ok) showToast(`Status → ${STATUS[status]?.label || status} ✅`);
        else showToast(res.error || 'Failed', false);
      }
      await fetchAll();
    } catch { showToast('Network error', false); }
    finally { setLoading(null); }
  };

  // ── Login screen ─────────────────────────────────────────
  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter,system-ui,sans-serif' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ ...card, padding: '44px 40px', width: '100%', maxWidth: 380 }}>

          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: `${T.accent}18`, border: `1px solid ${T.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Zap size={20} color={T.accent} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: T.text, fontFamily: C.fontDisplay }}><span style={{ color: T.accent }}>Bespoke</span>Deploy</div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 1, letterSpacing: '0.04em' }}>Admin Dashboard</div>
            </div>
          </div>

          <form onSubmit={handleLogin}>
            <label style={{ fontSize: 12, color: T.muted, fontWeight: 600, display: 'block', marginBottom: 7 }}>Admin Password</label>
            <input
              type="password" placeholder="••••••••" value={password}
              onChange={e => setPassword(e.target.value)} autoFocus
              style={{ ...inpStyle, width: '100%', marginBottom: 12 }}
            />
            {loginErr && <div style={{ fontSize: 13, color: T.red, marginBottom: 10 }}>{loginErr}</div>}
            <button type="submit" disabled={loginBusy}
              style={{ ...solidBtn(T.accent, { width: '100%', padding: '12px', fontSize: 14, justifyContent: 'center' }) }}>
              {loginBusy ? 'Logging in…' : 'Log In'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // ── Main layout ──────────────────────────────────────────
  const activeNav = NAV.find(n => n.id === page);

  const navTo = (id) => { setPage(id); setSideOpen(false); };
  const signOut = () => { localStorage.removeItem('bd_admin_token'); setAuthed(false); };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', fontFamily: 'Inter,system-ui,sans-serif', color: T.text }}>

      {/* Mobile overlay */}
      {sideOpen && (
        <div
          onClick={() => setSideOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 30, backdropFilter: 'blur(4px)' }}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside style={{
        width: 240, flexShrink: 0,
        background: T.sidebar,
        borderRight: `1px solid ${T.divider}`,
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
        // Mobile: fixed + slide
        ...(typeof window !== 'undefined' && window.innerWidth < 1024 ? {
          position: 'fixed', top: 0, left: 0, zIndex: 40, height: '100%',
          transform: sideOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
        } : {}),
      }}>

        {/* Brand */}
        <div style={{ padding: '24px 20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${T.accent}18`, border: `1px solid ${T.accent}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Zap size={18} color={T.accent} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: T.text, fontFamily: C.fontDisplay }}><span style={{ color: T.accent }}>Bespoke</span>Deploy</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.green, display: 'inline-block', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>Admin · {time}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: T.divider, margin: '0 16px 6px' }} />

        {/* Nav */}
        <nav style={{ flex: 1, padding: '4px 12px', overflowY: 'auto' }}>
          {NAV.map(({ id, label, Icon, color }) => {
            const active = page === id;
            return (
              <button
                key={id}
                onClick={() => navTo(id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 12, border: 'none',
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  marginBottom: 2, position: 'relative',
                  background: active ? `${T.accent}1A` : 'transparent',
                  color: active ? T.text : T.muted,
                  fontSize: 13.5, fontWeight: active ? 600 : 400,
                  transition: 'all .15s',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                {/* Active left bar */}
                {active && (
                  <span style={{
                    position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                    width: 3, height: 20, borderRadius: '0 3px 3px 0',
                    background: T.accent,
                  }} />
                )}
                <Icon size={16} color={active ? T.text : color} strokeWidth={active ? 2.2 : 1.8} />
                <span style={{ flex: 1 }}>{label}</span>
                {active && <ChevronRight size={13} color={`rgba(255,255,255,0.25)`} />}
              </button>
            );
          })}
        </nav>

        {/* Divider */}
        <div style={{ height: 1, background: T.divider, margin: '6px 16px' }} />

        {/* Footer links */}
        <div style={{ padding: '6px 12px 20px' }}>
          <a
            href="/" target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, color: T.muted, fontSize: 13, textDecoration: 'none', transition: 'color .15s' }}
            onMouseEnter={e => e.currentTarget.style.color = T.text}
            onMouseLeave={e => e.currentTarget.style.color = T.muted}
          >
            <ExternalLink size={15} />
            <span>View Website</span>
          </a>
          <button
            onClick={signOut}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, border: 'none', background: 'transparent', color: T.muted, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s', textAlign: 'left' }}
            onMouseEnter={e => { e.currentTarget.style.color = T.red; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = T.muted; e.currentTarget.style.background = 'transparent'; }}
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: '100vh' }}>

        {/* Top bar */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 20,
          height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 28px',
          // NOTE: T.sidebar is now var(--c-surface) — can't suffix a hex alpha
          // directly onto a var() reference (silently drops the whole
          // declaration, same bug fixed earlier in Landing/FAQPage/ProgressBar).
          background: 'rgba(var(--c-surface-rgb), 0.8)',
          borderBottom: `1px solid ${T.divider}`,
          backdropFilter: 'blur(12px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Mobile hamburger */}
            <button
              onClick={() => setSideOpen(o => !o)}
              style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: T.muted, padding: 4 }}
              className="mobile-menu-btn"
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: T.muted }}>
              <span>Admin</span>
              <ChevronRight size={12} color={T.muted} />
              <span style={{ color: T.text, fontWeight: 600 }}>{activeNav?.label}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {page === 'dashboard' && (
              <button
                onClick={fetchAll} disabled={fetching}
                style={ghostBtn(T.muted, { fontSize: 12, padding: '6px 14px' })}
              >
                <RefreshCw size={12} style={{ animation: fetching ? 'spin 1s linear infinite' : 'none' }} />
                {fetching ? 'Refreshing…' : 'Refresh'}
              </button>
            )}
            {/* Avatar indicator */}
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${T.accent}20`, border: `1.5px solid ${T.accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={14} color={T.accent} />
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto', background: T.bg }}>
          <AnimatePresence mode="wait">
            <motion.div key={page} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
              {page === 'dashboard' && (
                <DashboardSection metrics={metrics} bookings={bookings} loading={loading} onAction={handleAction} tab={tab} setTab={setTab} onToast={showToast} />
              )}
              {page === 'bookings' && (
                <DashboardSection metrics={null} bookings={bookings} loading={loading} onAction={handleAction} tab={tab} setTab={setTab} onToast={showToast} />
              )}
              {page === 'capacity' && <CapacitySection onToast={showToast} />}
              {page === 'feedback' && <FeedbackSection onToast={showToast} />}
              {page === 'promos'   && <PromosSection   onToast={showToast} />}
              {page === 'plans'    && <PlansSettings   onToast={showToast} />}
              {page === 'addons'   && <AddonsSettings  onToast={showToast} />}
              {page === 'email'    && <EmailSettings />}
              {page === 'general'  && <GeneralSettings onToast={showToast} />}
              {page === 'password' && <SecuritySettings onToast={showToast} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
            style={{
              position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
              background: toast.ok ? T.green : T.red,
              color: '#fff', borderRadius: 10, padding: '12px 22px',
              fontSize: 13, fontWeight: 600, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              zIndex: 999, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 1023px) {
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
