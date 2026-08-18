import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { C } from '../theme';

// ─── Floating contact bubble ─────────────────────────────────
// Fixed to the corner of the screen at all times. Opens an overlay that
// collects the customer's info + concern and emails it straight to the
// admin (with a short acknowledgement back to the customer).
const CATEGORIES = [
  { id: 'order',    label: 'Placing an order' },
  { id: 'service',  label: 'During service / build' },
  { id: 'delivery', label: 'Post-delivery' },
  { id: 'payment',  label: 'Payment / refund' },
  { id: 'other',    label: 'Something else' },
];

const inputSt = {
  background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10,
  padding: '11px 14px', color: C.text, fontSize: 14, outline: 'none',
  width: '100%', fontFamily: 'inherit', boxSizing: 'border-box',
};

function ContactOverlay({ onClose }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', booking_id: '', category: 'order', message: '' });
  const [status, setStatus] = useState('idle'); // idle | submitting | done | error
  const [errorMsg, setErrorMsg] = useState('');

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.message.trim()) {
      setErrorMsg('Please fill in your name, email, phone and message.');
      return;
    }
    setStatus('submitting');
    setErrorMsg('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
      setStatus('done');
    } catch (e2) {
      setErrorMsg(e2.message);
      setStatus('error');
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: '28px 26px', width: '100%', maxWidth: 440, maxHeight: '90vh', overflowY: 'auto' }}
      >
        {status === 'done' ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 8 }}>Message sent</div>
            <p style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.6, marginBottom: 20 }}>
              I've received your message and will reply to your email within 24 hours.
            </p>
            <button onClick={onClose} style={{ background: C.accent, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Got it
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div style={{ fontSize: 12, color: C.accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              Get in touch
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 6 }}>
              Report a concern or dispute
            </div>
            <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 20 }}>
              Tell me what's going on and I'll get back to you directly by email within 24 hours.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input style={inputSt} placeholder="Your full name" value={form.name} onChange={set('name')} required />
              <input style={inputSt} type="email" placeholder="you@email.com" value={form.email} onChange={set('email')} required />
              <input style={inputSt} type="tel" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={set('phone')} required />
              <input style={inputSt} placeholder="Booking ID (optional)" value={form.booking_id} onChange={set('booking_id')} />
              <select style={{ ...inputSt, cursor: 'pointer' }} value={form.category} onChange={set('category')}>
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
              <textarea
                style={{ ...inputSt, resize: 'vertical', minHeight: 90, fontFamily: 'inherit' }}
                placeholder="Describe your concern in a few sentences..."
                value={form.message} onChange={set('message')} required
              />
            </div>
            {errorMsg && <div style={{ marginTop: 12, fontSize: 12.5, color: C.red }}>{errorMsg}</div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button
                type="button" onClick={onClose}
                style={{ flex: '0 0 auto', background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, borderRadius: 10, padding: '11px 18px', fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Cancel
              </button>
              <button
                type="submit" disabled={status === 'submitting'}
                style={{ flex: 1, background: C.accent, color: '#fff', border: 'none', borderRadius: 10, padding: '11px 18px', fontSize: 14, fontWeight: 700, cursor: status === 'submitting' ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: status === 'submitting' ? 0.6 : 1 }}
              >
                {status === 'submitting' ? 'Sending…' : 'Send Message'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}

export default function ContactBubble() {
  const [open, setOpen]         = useState(false);
  const [pillShown, setPillShown] = useState(false);
  const [pillHidden, setPillHidden] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setPillShown(true), 1800);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <AnimatePresence>
        {pillShown && !pillHidden && !open && (
          <motion.div
            initial={{ opacity: 0, x: 12, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 12, scale: 0.9 }}
            transition={{ duration: 0.25 }}
            onClick={() => setOpen(true)}
            style={{
              position: 'fixed', right: 88, bottom: 34, zIndex: 999,
              display: 'flex', alignItems: 'center', gap: 8,
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: 24,
              padding: '10px 14px', cursor: 'pointer', whiteSpace: 'nowrap',
              boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>👋 Questions? Contact me</span>
            <span
              onClick={(e) => { e.stopPropagation(); setPillHidden(true); }}
              aria-label="Dismiss"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 16, height: 16, borderRadius: '50%', color: C.muted,
                fontSize: 12, lineHeight: 1, flexShrink: 0,
              }}
            >
              ✕
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen(true)}
        aria-label="Contact us"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: 1, scale: 1,
          boxShadow: pillShown && !pillHidden && !open
            ? ['0 8px 24px rgba(14,165,233,0.35)', '0 8px 28px rgba(14,165,233,0.6)', '0 8px 24px rgba(14,165,233,0.35)']
            : '0 8px 24px rgba(14,165,233,0.35)',
        }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        transition={{ delay: 0.6, duration: 0.3, boxShadow: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } }}
        style={{
          position: 'fixed', right: 22, bottom: 22, zIndex: 999,
          width: 56, height: 56, borderRadius: '50%',
          background: C.accent, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 5.5C4 4.67 4.67 4 5.5 4h13c.83 0 1.5.67 1.5 1.5v10c0 .83-.67 1.5-1.5 1.5H9l-4 3.5v-3.5H5.5A1.5 1.5 0 0 1 4 15.5v-10Z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round"/>
          <circle cx="8.5" cy="10" r="1.1" fill="#fff"/>
          <circle cx="12" cy="10" r="1.1" fill="#fff"/>
          <circle cx="15.5" cy="10" r="1.1" fill="#fff"/>
        </svg>
      </motion.button>

      <AnimatePresence>
        {open && <ContactOverlay onClose={() => { setOpen(false); setPillHidden(true); }} />}
      </AnimatePresence>
    </>
  );
}
