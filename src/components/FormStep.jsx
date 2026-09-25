import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { C, fadeUp, stagger, fmt } from '../theme';

// Loose client-side check — the real validation happens server-side in
// _shared/otp.js's normalizePhone(). This just decides when to show the
// "Send code" button so we're not firing an SMS on every keystroke.
function looksLikePhone(v) {
  const digits = (v || '').replace(/\D/g, '');
  return digits.length === 10 || (digits.length === 12 && digits.startsWith('91'));
}

// India-only phone input: the "+91 " prefix is fixed and can't be typed
// over or deleted — the user only ever enters the 10-digit number itself.
const PHONE_PREFIX = '+91 ';
function formatIndianPhone(raw) {
  const value = raw || '';
  // The actual number is whatever comes after our fixed "+91 " prefix. Using
  // just the tail (rather than stripping "91" out of the combined digit
  // string) avoids the bug where, once backspacing shrunk the total digit
  // count to 10 or 11, the prefix's own "9" and "1" got mistaken for part of
  // the typed number and spliced onto it.
  const tail = value.startsWith(PHONE_PREFIX) ? value.slice(PHONE_PREFIX.length) : value;
  let digits = tail.replace(/\D/g, '');
  // Only relevant for paste/autofill of a full "+91XXXXXXXXXX"-style string
  // that lands outside the normal typed-after-prefix flow above.
  if (digits.length > 10 && digits.startsWith('91')) digits = digits.slice(2);
  digits = digits.slice(0, 10);
  if (!digits) return PHONE_PREFIX;
  return PHONE_PREFIX + digits.slice(0, 5) + (digits.length > 5 ? ' ' + digits.slice(5) : '');
}

const TIMINGS = [
  'Morning (9am – 12pm)',
  'Afternoon (12pm – 4pm)',
  'Evening (4pm – 7pm)',
  'Night (7pm – 10pm)',
  'Weekends only',
  'Anytime',
];

function Field({ label, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11.5, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
        {label}
      </label>
      {children}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          style={{ fontSize: 12, color: C.red }}
        >
          {error}
        </motion.div>
      )}
    </div>
  );
}

const inputStyle = (hasError) => ({
  background: C.bg,
  border: `1px solid ${hasError ? C.red : C.border}`,
  borderRadius: 10, padding: '11px 14px',
  color: C.text, fontSize: 14.5, outline: 'none',
  transition: 'border-color .2s',
  width: '100%', fontFamily: 'inherit',
});

export default function FormStep({ formData, plan, total, onNext }) {
  const [form, setForm] = useState({
    name:   formData.name   || '',
    phone:  formatIndianPhone(formData.phone) || PHONE_PREFIX,
    email:  formData.email  || '',
    city:   formData.city   || '',
    timing: formData.timing || '',
    notes:  formData.notes  || '',
  });
  const [errors, setErrors] = useState({});
  const [focused, setFocused] = useState('');

  // ── Phone OTP verification (code emailed to the address below) ─────────
  // idle | sending | sent | verifying | verified
  const [otpStatus, setOtpStatus]     = useState('idle');
  const [otpCode, setOtpCode]         = useState('');
  const [otpError, setOtpError]       = useState('');
  const [otpRef, setOtpRef]           = useState('');
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [phoneToken, setPhoneToken]   = useState('');
  const [resendIn, setResendIn]       = useState(0);

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

  // Auto-send the verification code the moment both a plausible phone number
  // and a syntactically valid email are present — no button click needed.
  // Debounced so it fires once typing pauses (e.g. after finishing
  // "you@gmail.com"), not on every keystroke or on a still-incomplete email.
  useEffect(() => {
    if (otpStatus !== 'idle') return;
    if (!looksLikePhone(form.phone) || !emailValid) return;
    const t = setTimeout(() => { sendOtp(); }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.phone, form.email, otpStatus]);

  // Single source of truth for a field's error, shared by live validation
  // (as-you-type / on blur) and the full-form check on submit.
  const validateField = (key, val, extra = {}) => {
    const phoneIsVerified = 'phoneVerified' in extra ? extra.phoneVerified : phoneVerified;
    switch (key) {
      case 'name':
        return val.trim() ? '' : 'Name is required';
      case 'phone': {
        const digits = val.replace(/\D/g, '').replace(/^91/, '');
        if (!digits) return 'Phone is required';
        if (digits.length < 10) return 'Enter a valid 10-digit Indian mobile number';
        if (!phoneIsVerified) return 'Please verify your phone number before continuing';
        return '';
      }
      case 'email':
        if (!val.trim()) return 'Email is required';
        if (!/\S+@\S+\.\S+/.test(val)) return 'Enter a valid email address';
        return '';
      case 'city':
        return val.trim() ? '' : 'City is required';
      case 'timing':
        return val ? '' : 'Please select a preferred time';
      default:
        return '';
    }
  };

  // Live validation: once a field has been touched (blurred at least once),
  // re-check it on every keystroke so the error clears/updates immediately
  // instead of waiting for the next submit attempt.
  const [touched, setTouched] = useState({});

  const set = (k) => (e) => {
    const val = e.target.value;
    setForm((p) => ({ ...p, [k]: val }));
    if (touched[k]) setErrors((prev) => ({ ...prev, [k]: validateField(k, val) }));
  };

  // Select fields (timing) are a discrete choice, not something typed —
  // validate the moment an option is picked rather than waiting for blur.
  const setTiming = (e) => {
    const val = e.target.value;
    setForm((p) => ({ ...p, timing: val }));
    setTouched((p) => ({ ...p, timing: true }));
    setErrors((prev) => ({ ...prev, timing: validateField('timing', val) }));
  };

  const handlePhoneChange = (e) => {
    const formatted = formatIndianPhone(e.target.value);
    setForm((p) => ({ ...p, phone: formatted }));
    if (touched.phone) setErrors((prev) => ({ ...prev, phone: validateField('phone', formatted) }));
  };

  const markTouched = (k) => () => {
    setFocused('');
    setTouched((p) => ({ ...p, [k]: true }));
    setErrors((prev) => ({ ...prev, [k]: validateField(k, form[k]) }));
  };

  const validate = () => {
    const e = {};
    for (const key of ['name', 'phone', 'email', 'city', 'timing']) {
      const msg = validateField(key, form[key]);
      if (msg) e[key] = msg;
    }
    return e;
  };

  // Phone verification happens outside the phone input itself (OTP step) —
  // once it lands, refresh the phone field's error immediately if it's
  // already been touched, rather than waiting for another keystroke there.
  useEffect(() => {
    if (touched.phone) setErrors((prev) => ({ ...prev, phone: validateField('phone', form.phone) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phoneVerified]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    onNext({ ...form, phone_verify_token: phoneToken });
  };

  const focusStyle = (field) => ({
    ...inputStyle(!!errors[field]),
    borderColor: focused === field ? (plan?.color || C.accent) : errors[field] ? C.red : C.border,
  });

  return (
    <div style={{ minHeight: '100vh', padding: '52px 24px 80px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
      <div style={{ width: '100%', maxWidth: 600 }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 13, color: plan?.color || C.accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
            Step 2 of 3
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: C.text, marginBottom: 8 }}>Share your details</h1>
          <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.6 }}>
            I'll reach out within 24 hours at your preferred time to confirm and get started.
          </p>
        </motion.div>

        {/* Quote pill */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
          style={{ background: `${plan?.color || C.accent}12`, border: `1px solid ${plan?.color || C.accent}30`, borderRadius: 12, padding: '14px 18px', marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div style={{ fontSize: 13.5, color: C.text }}>
            <span style={{ color: plan?.color || C.accent, fontWeight: 700 }}>{plan?.name}</span> plan · {plan?.delivery}
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: plan?.color || C.accent }}>
            ₹{fmt(total)}
          </div>
        </motion.div>

        {/* Form */}
        <motion.form
          variants={stagger(0.07)}
          initial="hidden"
          animate="show"
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
        >
          <motion.div variants={fadeUp} className="form-row" style={{ gap: 16 }}>
            <Field label="Full Name *" error={errors.name}>
              <input
                style={focusStyle('name')}
                type="text" placeholder="Your full name"
                value={form.name} onChange={set('name')}
                onFocus={() => setFocused('name')} onBlur={markTouched('name')}
                required
              />
            </Field>
            <Field label="Email *" error={errors.email}>
              <input
                style={focusStyle('email')}
                type="email" placeholder="you@email.com"
                value={form.email} onChange={set('email')}
                onFocus={() => setFocused('email')} onBlur={markTouched('email')}
                required
              />
            </Field>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Field label="Phone *" error={errors.phone}>
              <input
                style={focusStyle('phone')}
                type="tel" placeholder="+91 XXXXX XXXXX"
                value={form.phone} onChange={handlePhoneChange}
                onFocus={(e) => {
                  setFocused('phone');
                  // Always land the cursor at the end, after the fixed "+91 "
                  // prefix, rather than wherever a click happened to land.
                  const pos = e.target.value.length;
                  requestAnimationFrame(() => e.target.setSelectionRange(pos, pos));
                }}
                onBlur={markTouched('phone')}
                readOnly={phoneVerified}
                required
              />
            </Field>
          </motion.div>

          {(looksLikePhone(form.phone) || emailValid) && (
            <motion.div variants={fadeUp} style={{ marginTop: -8 }}>
              {!looksLikePhone(form.phone) ? (
                <div style={{ fontSize: 12.5, color: C.muted }}>Enter your phone number above to receive a verification code</div>
              ) : phoneVerified ? (
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
                    background: 'transparent', border: `1px solid ${(plan?.color || C.accent)}50`, color: plan?.color || C.accent,
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
                      style={{ ...inputStyle(!!otpError), width: 130, padding: '9px 12px', fontSize: 14 }}
                    />
                    <button
                      type="button" onClick={verifyOtp}
                      disabled={otpStatus === 'verifying' || otpCode.length < 4}
                      style={{
                        background: plan?.color || C.accent, color: '#fff', border: 'none', borderRadius: 8,
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
            </motion.div>
          )}

          <motion.div variants={fadeUp} className="form-row" style={{ gap: 16 }}>
            <Field label="City *" error={errors.city}>
              <input
                style={focusStyle('city')}
                type="text" placeholder="Your city"
                value={form.city} onChange={set('city')}
                onFocus={() => setFocused('city')} onBlur={markTouched('city')}
              />
            </Field>
            <Field label="Best time to call *" error={errors.timing}>
              <select
                style={{ ...focusStyle('timing'), appearance: 'none', cursor: 'pointer' }}
                value={form.timing} onChange={setTiming}
                onFocus={() => setFocused('timing')} onBlur={markTouched('timing')}
              >
                <option value="">Select timing</option>
                {TIMINGS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Field label="Anything to add? (Optional)">
              <input
                style={inputStyle(false)}
                type="text" placeholder="e.g. I have a logo, need it urgent, budget is flexible..."
                value={form.notes} onChange={set('notes')}
                onFocus={() => setFocused('notes')} onBlur={() => setFocused('')}
              />
            </Field>
          </motion.div>

          {/* Submit */}
          <motion.div variants={fadeUp} style={{ paddingTop: 8 }}>
            <button
              type="submit"
              style={{
                background: plan?.color || C.accent,
                color: '#fff', border: 'none', borderRadius: 40,
                padding: '16px', fontSize: 16, fontWeight: 700,
                cursor: 'pointer', width: '100%', fontFamily: 'inherit',
                boxShadow: `0 6px 24px ${plan?.color || C.accent}30`,
                transition: 'transform .2s, box-shadow .2s',
                letterSpacing: '0.01em',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
            >
              Review & Pay → ₹{fmt(total)}
            </button>
            <div style={{ textAlign: 'center', fontSize: 12.5, color: C.muted, marginTop: 12 }}>
              No charge yet · Advance payment on next step
            </div>
          </motion.div>
        </motion.form>
      </div>
    </div>
  );
}
