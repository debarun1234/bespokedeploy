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
];

// Mandatory gate shown before any other field — this exists specifically to
// keep unrelated requests (course-project help, general coding questions,
// anything not about hiring BespokeDeploy) out of the inbox. Only 'build'
// and 'existing' can actually submit the form.
const PURPOSES = [
  { id: 'build',     label: 'Yes — I want a website built', desc: 'New project, a quote, or general questions before booking.' },
  { id: 'existing',  label: "I'm an existing customer", desc: 'I already have a booking and need help with it.' },
  { id: 'unrelated', label: "Something else", desc: 'Not about getting a website built by BespokeDeploy.' },
];

const inputSt = {
  background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10,
  padding: '11px 14px', color: C.text, fontSize: 14, outline: 'none',
  width: '100%', fontFamily: 'inherit', boxSizing: 'border-box',
};

// Loose client-side check — the real validation happens server-side in
// _shared/otp.js's normalizePhone(). Just decides when to show the "Send
// code" button so we're not firing a WhatsApp message on every keystroke.
function looksLikePhone(v) {
  const digits = (v || '').replace(/\D/g, '');
  return digits.length === 10 || (digits.length === 12 && digits.startsWith('91'));
}

function ContactOverlay({ onClose }) {
  const [purpose, setPurpose] = useState(''); // '' | 'build' | 'existing' | 'unrelated'
  const [form, setForm] = useState({ name: '', email: '', phone: '', booking_id: '', category: 'order', message: '' });
  const [status, setStatus] = useState('idle'); // idle | submitting | done | error
  const [errorMsg, setErrorMsg] = useState('');

  // ── Phone OTP verification (code emailed to the address above) — same mechanism as booking checkout ──
  const [otpStatus, setOtpStatus] = useState('idle'); // idle | sending | sent | verifying | verified
  const [otpCode, setOtpCode]     = useState('');
  const [otpError, setOtpError]   = useState('');
  const [otpRef, setOtpRef]       = useState('');
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [phoneToken, setPhoneToken]       = useState('');
  const [resendIn, setResendIn]           = useState(0);

  const phoneVerified = otpStatus === 'verified' && verifiedPhone === form.phone.trim();
  const emailValid = /\S+@\S+\.\S+/.test(form.email.trim());

  // Editing the phone after verifying invalidates it — must re-verify the new number.
  useEffect(() => {
    if (verifiedPhone && form.phone.trim() !== verifiedPhone) {
      setOtpStatus('idle'); setOtpCode(''); setOtpError(''); setOtpRef(''); setPhoneToken(''); setVerifiedPhone('');
    }
  }, [form.phone]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!resendIn) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const sendOtp = async () => {
    setOtpError('');
    setOtpStatus('sending');
    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: form.phone, email: form.email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || 'Could not send code');
      setOtpRef(data.otp_ref || '');
      setOtpStatus('sent');
      setResendIn(30);
    } catch (e) {
      setOtpStatus('idle');
      setOtpError(e.message);
    }
  };

  const verifyOtp = async () => {
    setOtpError('');
    setOtpStatus('verifying');
    try {
      const res = await fetch('/api/otp/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: form.phone, otp: otpCode, otp_ref: otpRef }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || 'Incorrect code');
      setOtpStatus('verified');
      setVerifiedPhone(form.phone.trim());
      setPhoneToken(data.token);
    } catch (e) {
      setOtpStatus('sent');
      setOtpError(e.message);
    }
  };

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.message.trim()) {
      setErrorMsg('Please fill in your name, email, phone and message.');
      return;
    }
    if (!phoneVerified) {
      setErrorMsg('Please verify your phone number before sending.');
      return;
    }
    setStatus('submitting');
    setErrorMsg('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, purpose, phone_verify_token: phoneToken }),
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
          <div>
            <div style={{ fontSize: 12, color: C.accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              Get in touch
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 6 }}>
              {purpose ? 'Report a concern or dispute' : 'Before we start...'}
            </div>
            <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 18 }}>
              {purpose
                ? "Tell me what's going on and I'll get back to you directly by email within 24 hours."
                : 'This form is only for people looking to get a website built, or existing customers with a question — quick check first:'}
            </p>

            {/* ── Mandatory gate — keeps unrelated requests (course help, general
                 coding questions, anything not about hiring BespokeDeploy) out
                 of the inbox. Nothing below this appears until answered. ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: purpose ? 18 : 0 }}>
              {PURPOSES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPurpose(p.id)}
                  style={{
                    textAlign: 'left', width: '100%', cursor: 'pointer', fontFamily: 'inherit',
                    background: purpose === p.id ? `${C.accent}15` : C.bg,
                    border: `1px solid ${purpose === p.id ? C.accent : C.border}`,
                    borderRadius: 10, padding: '10px 14px',
                  }}
                >
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: purpose === p.id ? C.accent : C.text }}>{p.label}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{p.desc}</div>
                </button>
              ))}
            </div>

            {purpose === 'unrelated' && (
              <div style={{ marginTop: 16, padding: '14px 16px', background: `${C.yellow}12`, border: `1px solid ${C.yellow}40`, borderRadius: 10, fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
                This form is specifically for website-building inquiries and existing BespokeDeploy customers, so I can't help through here — thanks for understanding, and best of luck with what you're working on!
                <div style={{ marginTop: 12 }}>
                  <button type="button" onClick={onClose} style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, borderRadius: 10, padding: '9px 16px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Close
                  </button>
                </div>
              </div>
            )}

            {(purpose === 'build' || purpose === 'existing') && (
              <form onSubmit={submit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <input style={inputSt} placeholder="Your full name" value={form.name} onChange={set('name')} required />
                  <input style={inputSt} type="email" placeholder="you@email.com" value={form.email} onChange={set('email')} required />
                  <input
                    style={inputSt} type="tel" placeholder="+91 XXXXX XXXXX"
                    value={form.phone} onChange={set('phone')} required
                    readOnly={phoneVerified}
                  />

                  {looksLikePhone(form.phone) && (
                    <div style={{ marginTop: -4 }}>
                      {phoneVerified ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: C.green, fontWeight: 600 }}>
                          <span>✓ Verified via email</span>
                          <button
                            type="button"
                            onClick={() => { setOtpStatus('idle'); setVerifiedPhone(''); setPhoneToken(''); setOtpCode(''); setOtpRef(''); }}
                            style={{ background: 'transparent', border: 'none', color: C.muted, fontSize: 11.5, textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit' }}
                          >
                            change number
                          </button>
                        </div>
                      ) : !emailValid ? (
                        <div style={{ fontSize: 12.5, color: C.muted }}>Enter your email above to receive a verification code</div>
                      ) : (otpStatus === 'idle' || otpStatus === 'sending') ? (
                        <button
                          type="button"
                          onClick={sendOtp}
                          disabled={otpStatus === 'sending'}
                          style={{
                            background: 'transparent', border: `1px solid ${C.accent}50`, color: C.accent,
                            borderRadius: 8, padding: '8px 16px', fontSize: 12.5, fontWeight: 700, cursor: otpStatus === 'sending' ? 'not-allowed' : 'pointer',
                            fontFamily: 'inherit', opacity: otpStatus === 'sending' ? 0.6 : 1,
                          }}
                        >
                          {otpStatus === 'sending' ? 'Sending code…' : 'Send verification code'}
                        </button>
                      ) : (
                        <div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <input
                              value={otpCode}
                              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              placeholder="6-digit code"
                              inputMode="numeric"
                              style={{ ...inputSt, width: 130, padding: '9px 12px', fontSize: 14 }}
                            />
                            <button
                              type="button" onClick={verifyOtp}
                              disabled={otpStatus === 'verifying' || otpCode.length < 4}
                              style={{
                                background: C.accent, color: '#fff', border: 'none', borderRadius: 8,
                                padding: '9px 16px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                                opacity: (otpStatus === 'verifying' || otpCode.length < 4) ? 0.6 : 1,
                              }}
                            >
                              {otpStatus === 'verifying' ? 'Checking…' : 'Verify'}
                            </button>
                            <button
                              type="button" onClick={sendOtp} disabled={resendIn > 0}
                              style={{ background: 'transparent', border: 'none', color: C.muted, fontSize: 12, textDecoration: resendIn > 0 ? 'none' : 'underline', cursor: resendIn > 0 ? 'default' : 'pointer', fontFamily: 'inherit' }}
                            >
                              {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
                            </button>
                          </div>
                          <div style={{ fontSize: 11.5, color: C.muted, marginTop: 6 }}>Sent to {form.email} — check your inbox (and spam folder)</div>
                        </div>
                      )}
                      {otpError && <div style={{ fontSize: 12, color: C.red, marginTop: 6 }}>{otpError}</div>}
                    </div>
                  )}

                  {purpose === 'existing' && (
                    <input style={inputSt} placeholder="Booking ID (optional)" value={form.booking_id} onChange={set('booking_id')} />
                  )}
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
                    type="submit" disabled={status === 'submitting' || !phoneVerified}
                    style={{ flex: 1, background: C.accent, color: '#fff', border: 'none', borderRadius: 10, padding: '11px 18px', fontSize: 14, fontWeight: 700, cursor: (status === 'submitting' || !phoneVerified) ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: (status === 'submitting' || !phoneVerified) ? 0.6 : 1 }}
                  >
                    {status === 'submitting' ? 'Sending…' : phoneVerified ? 'Send Message' : 'Verify phone to continue'}
                  </button>
                </div>
              </form>
            )}
          </div>
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
              position: 'fixed', right: 88, bottom: 102, zIndex: 1500,
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
          position: 'fixed', right: 22, bottom: 90, zIndex: 1500,
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
