import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { C, fadeUp } from '../theme';

function useDocumentMeta(title, description, noindex = false) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;
    let descMeta = document.querySelector('meta[name="description"]');
    const prevDesc = descMeta?.getAttribute('content');
    if (descMeta) descMeta.setAttribute('content', description);

    let robotsMeta = null;
    if (noindex) {
      robotsMeta = document.createElement('meta');
      robotsMeta.setAttribute('name', 'robots');
      robotsMeta.setAttribute('content', 'noindex, nofollow');
      document.head.appendChild(robotsMeta);
    }
    return () => {
      document.title = prevTitle;
      if (descMeta && prevDesc != null) descMeta.setAttribute('content', prevDesc);
      if (robotsMeta) document.head.removeChild(robotsMeta);
    };
  }, [title, description, noindex]);
}

const PLANS = [
  { id: '',          label: "I'd rather not say" },
  { id: 'Portfolio', label: 'Portfolio' },
  { id: 'Small Website', label: 'Small Website' },
  { id: 'Pro Website',   label: 'Pro Website' },
];

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= (hover || value);
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, fontSize: 34, lineHeight: 1 }}
          >
            <span style={{ color: filled ? '#F59E0B' : C.border, transition: 'color .15s' }}>★</span>
          </button>
        );
      })}
    </div>
  );
}

const inputSt = {
  background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
  padding: '12px 14px', color: C.text, fontSize: 14.5, outline: 'none',
  width: '100%', fontFamily: 'inherit', boxSizing: 'border-box',
};

export default function FeedbackPage() {
  useDocumentMeta('Share Your Feedback — BespokeDeploy.in', 'Rate your experience working with BespokeDeploy.in.', true);
  const [form, setForm] = useState({ name: '', email: '', plan_name: '', rating: 0, message: '' });
  const [status, setStatus] = useState('idle'); // idle | submitting | done | error
  const [errorMsg, setErrorMsg] = useState('');

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim() || !form.rating) {
      setErrorMsg('Please add your name, a rating, and a few words.');
      return;
    }
    setStatus('submitting');
    setErrorMsg('');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: form.name,
          customer_email: form.email,
          plan_name: form.plan_name,
          rating: form.rating,
          message: form.message,
        }),
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
    <div style={{ background: C.bg, minHeight: '100vh', padding: '56px 20px' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        <motion.div initial="hidden" animate="show" variants={fadeUp} style={{ textAlign: 'center', marginBottom: 32 }}>
          <a href="/" style={{ fontSize: 16, fontWeight: 800, textDecoration: 'none', display: 'inline-block', marginBottom: 18 }}>
            <span style={{ color: C.accent }}>Bespoke</span><span style={{ color: C.text }}>Deploy</span><span style={{ color: C.accent }}>.</span><span style={{ color: C.text }}>in</span>
          </a>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, marginBottom: 8 }}>How was your experience?</h1>
          <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>
            Thanks for choosing BespokeDeploy — I'd genuinely love to hear how it went. Your feedback might even be featured on the site.
          </p>
        </motion.div>

        <motion.div
          initial="hidden" animate="show" variants={fadeUp}
          style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, padding: '28px 26px' }}
        >
          {status === 'done' ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🙏</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 8 }}>Thank you!</div>
              <p style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.6 }}>
                Really appreciate you taking the time. It means a lot.
              </p>
            </div>
          ) : (
            <form onSubmit={submit}>
              <div style={{ marginBottom: 22 }}>
                <StarRating value={form.rating} onChange={(n) => setForm((p) => ({ ...p, rating: n }))} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input style={inputSt} placeholder="Your name" value={form.name} onChange={set('name')} required />
                <input style={inputSt} type="email" placeholder="Email (optional)" value={form.email} onChange={set('email')} />
                <select style={{ ...inputSt, cursor: 'pointer' }} value={form.plan_name} onChange={set('plan_name')}>
                  {PLANS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
                <textarea
                  style={{ ...inputSt, resize: 'vertical', minHeight: 100, fontFamily: 'inherit' }}
                  placeholder="What was it like working together? Anything you'd want others to know?"
                  value={form.message} onChange={set('message')} required
                />
              </div>
              {errorMsg && <div style={{ marginTop: 12, fontSize: 12.5, color: C.red }}>{errorMsg}</div>}
              <button
                type="submit" disabled={status === 'submitting'}
                style={{
                  marginTop: 20, background: C.accent, color: '#fff', border: 'none', borderRadius: 12,
                  padding: '14px 20px', fontSize: 15, fontWeight: 700, width: '100%', fontFamily: 'inherit',
                  cursor: status === 'submitting' ? 'not-allowed' : 'pointer', opacity: status === 'submitting' ? 0.6 : 1,
                }}
              >
                {status === 'submitting' ? 'Sending…' : 'Submit Feedback'}
              </button>
            </form>
          )}
        </motion.div>

        <div style={{ textAlign: 'center', fontSize: 12, color: C.muted, marginTop: 20 }}>
          <a href="/" style={{ color: C.muted, textDecoration: 'underline', textUnderlineOffset: 3 }}>← Back to bespokedeploy.in</a>
        </div>
      </div>
    </div>
  );
}
