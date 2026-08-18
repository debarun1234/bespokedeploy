import { useState } from 'react';
import { motion } from 'framer-motion';
import { C, fadeUp, stagger, fmt } from '../theme';

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
    phone:  formData.phone  || '',
    email:  formData.email  || '',
    city:   formData.city   || '',
    timing: formData.timing || '',
    notes:  formData.notes  || '',
  });
  const [errors, setErrors] = useState({});
  const [focused, setFocused] = useState('');

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())        e.name   = 'Name is required';
    if (!form.phone.trim())       e.phone  = 'Phone is required';
    else if (!/^\+?[\d\s\-]{7,}$/.test(form.phone)) e.phone = 'Enter a valid phone number';
    if (!form.email.trim())       e.email  = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email))       e.email = 'Enter a valid email address';
    if (!form.city.trim())        e.city   = 'City is required';
    if (!form.timing)             e.timing = 'Please select a preferred time';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    onNext(form);
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
                onFocus={() => setFocused('name')} onBlur={() => setFocused('')}
              />
            </Field>
            <Field label="Phone *" error={errors.phone}>
              <input
                style={focusStyle('phone')}
                type="tel" placeholder="+91 XXXXX XXXXX"
                value={form.phone} onChange={set('phone')}
                onFocus={() => setFocused('phone')} onBlur={() => setFocused('')}
              />
            </Field>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Field label="Email *" error={errors.email}>
              <input
                style={focusStyle('email')}
                type="email" placeholder="you@email.com"
                value={form.email} onChange={set('email')}
                onFocus={() => setFocused('email')} onBlur={() => setFocused('')}
              />
            </Field>
          </motion.div>

          <motion.div variants={fadeUp} className="form-row" style={{ gap: 16 }}>
            <Field label="City *" error={errors.city}>
              <input
                style={focusStyle('city')}
                type="text" placeholder="Your city"
                value={form.city} onChange={set('city')}
                onFocus={() => setFocused('city')} onBlur={() => setFocused('')}
              />
            </Field>
            <Field label="Best time to call *" error={errors.timing}>
              <select
                style={{ ...focusStyle('timing'), appearance: 'none', cursor: 'pointer' }}
                value={form.timing} onChange={set('timing')}
                onFocus={() => setFocused('timing')} onBlur={() => setFocused('')}
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
                background: `linear-gradient(135deg, ${plan?.color || C.accent}, ${plan?.color || C.accent}CC)`,
                color: '#fff', border: 'none', borderRadius: 13,
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
