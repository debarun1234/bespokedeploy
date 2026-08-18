import { useState } from 'react';
import { motion } from 'framer-motion';
import { C, fadeUp, stagger, fmt } from '../theme';
import { PLAN_ICONS } from '../data/planIcons';

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID;
const FORMSPREE_ID = import.meta.env.VITE_FORMSPREE_ID;

function Row({ label, value, highlight }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: '8px 0', borderBottom: `1px solid ${C.borderFaint}`, fontSize: 13.5,
    }}>
      <span style={{ color: C.muted, flex: 1, marginRight: 12 }}>{label}</span>
      <span style={{ color: highlight || C.text, fontWeight: highlight ? 700 : 500, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

export default function PaymentStep({ plan, addons, hostingChoice, formData, total, advance, advancePct, inviteToken, demoMode, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [status,  setStatus]  = useState('idle'); // idle | loading | error

  // ── Promo code — server always recomputes the discount from the code, the
  // client only ever displays what /api/validate-promo returns. ────────────
  const [promoOpen,    setPromoOpen]    = useState(false);
  const [promoInput,   setPromoInput]   = useState('');
  const [promoState,   setPromoState]   = useState('idle'); // idle | checking | valid | invalid
  const [promoError,   setPromoError]   = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null); // { code, discount_amount, total, advance, balance } | null

  const addonList   = Object.values(addons);
  const effectiveTotal   = appliedPromo?.total   ?? total;
  const effectiveAdvance = appliedPromo?.advance ?? advance;
  const balance     = effectiveTotal - effectiveAdvance;
  const hostingLabel = hostingChoice === 'netlify' ? '🌿 Netlify' : '☁️ Cloudflare Pages';

  const applyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoState('checking');
    setPromoError('');
    try {
      const res = await fetch('/api/validate-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: promoInput.trim(),
          plan_id: plan.id,
          addon_ids: addonList.map((a) => a.id),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) throw new Error(data.error || 'Invalid code');
      setAppliedPromo(data);
      setPromoState('valid');
    } catch (e) {
      setAppliedPromo(null);
      setPromoState('invalid');
      setPromoError(e.message);
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoState('idle');
    setPromoInput('');
    setPromoError('');
  };

  // ── Test mode: walk through the checkout UI without touching Razorpay,
  // create-order, or bookings. No real charge, no DB row, no emails. ──────────
  const handleDemoPay = async () => {
    setStatus('loading');
    await new Promise((r) => setTimeout(r, 900)); // brief pause so it reads as "processing", not instant
    const fakePaymentId = `demo_${Date.now().toString(36)}`;
    const fakeBookingId = `DEMO-${Date.now().toString(36).toUpperCase()}`;
    onSuccess(fakePaymentId, fakeBookingId, {
      total: effectiveTotal, advance: effectiveAdvance,
      promoCode: appliedPromo?.code, discountAmount: appliedPromo?.discount_amount,
    });
  };

  const handlePay = async () => {
    if (demoMode) { await handleDemoPay(); return; }
    if (!window.Razorpay) {
      alert('Razorpay failed to load. Please check your internet connection and refresh.');
      return;
    }

    setStatus('loading');

    // ── Step 1: Create Razorpay order server-side (amount locked on server) ───
    let orderData;
    try {
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id:      plan.id,
          addon_ids:    addonList.map((a) => a.id),
          invite_token: inviteToken || undefined,
          promo_code:   appliedPromo?.code || undefined,
        }),
      });
      orderData = await res.json();
      if (!res.ok || !orderData.order_id) throw new Error(orderData.error || 'Order creation failed');
    } catch (e) {
      alert(`Could not initiate payment: ${e.message}`);
      setStatus('idle');
      return;
    }

    // ── Step 2: Open Razorpay with server-issued order_id ─────────────────────
    const options = {
      key:      RAZORPAY_KEY,
      order_id: orderData.order_id,  // amount is now server-controlled
      currency: 'INR',
      name:     'BespokeDeploy',
      description: `${plan.name} Website — Advance (${advancePct * 100}%)`,
      prefill: {
        name:    formData.name,
        email:   formData.email,
        contact: formData.phone,
      },
      theme:  { color: plan.color },
      modal:  { ondismiss: () => setStatus('idle') },
      handler: async (response) => {
        // Step 3: Server verifies Razorpay signature before creating booking
        const bid = await createBooking(response);
        await sendToFormspree(response.razorpay_payment_id);
        onSuccess(response.razorpay_payment_id, bid, {
          total: effectiveTotal, advance: effectiveAdvance,
          promoCode: appliedPromo?.code, discountAmount: appliedPromo?.discount_amount,
        });
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', () => { setStatus('error'); });
    rzp.open();
  };

  const createBooking = async (rzpResponse) => {
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Razorpay payment proof — server verifies signature
          razorpay_order_id:   rzpResponse.razorpay_order_id,
          razorpay_payment_id: rzpResponse.razorpay_payment_id,
          razorpay_signature:  rzpResponse.razorpay_signature,
          // Plan info — server recalculates price, never trusts client amounts
          plan_id:         plan.id,
          addon_ids:       addonList.map((a) => a.id),
          hosting:         hostingChoice,
          customer_name:   formData.name,
          customer_email:  formData.email,
          customer_phone:  formData.phone,
          customer_city:   formData.city || '',
          customer_timing: formData.timing || '',
          customer_notes:  formData.notes || '',
          invite_token:    inviteToken || undefined,
          promo_code:      appliedPromo?.code || undefined,
        }),
      });
      const data = await res.json();
      return data.id || null;
    } catch (_) { return null; }
  };

  const sendToFormspree = async (paymentId) => {
    if (FORMSPREE_ID === 'YOUR_FORMSPREE_FORM_ID') return;
    try {
      const body = new FormData();
      body.append('name',       formData.name);
      body.append('phone',      formData.phone);
      body.append('email',      formData.email);
      body.append('city',       formData.city);
      body.append('timing',     formData.timing);
      body.append('notes',      formData.notes || '—');
      body.append('plan',       plan.name);
      body.append('hosting',    hostingLabel);
      body.append('addons',     addonList.map((a) => a.name).join(', ') || 'None');
      body.append('total',      `₹${fmt(effectiveTotal)}${appliedPromo ? ` (promo ${appliedPromo.code})` : ''}`);
      body.append('advance',    `₹${fmt(effectiveAdvance)} (${advancePct * 100}%)`);
      body.append('payment_id', paymentId);
      body.append('_subject',   `🌐 Paid Quote — ${formData.name} — ${plan.name}`);
      await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: 'POST', body, headers: { Accept: 'application/json' },
      });
    } catch (_) { /* non-blocking */ }
  };

  return (
    <div style={{ minHeight: '100vh', padding: '52px 24px 80px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
      <div style={{ width: '100%', maxWidth: 560 }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 13, color: plan.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
            Step 3 of 3
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: C.text, marginBottom: 8 }}>Review & Pay Advance</h1>
          <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.6 }}>
            Pay a small advance to lock your slot. Balance is due only after you're happy with the site.
          </p>
        </motion.div>

        {/* Demo mode banner */}
        {demoMode && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            style={{
              background: `${C.yellow}15`, border: `1px solid ${C.yellow}40`, borderRadius: 12,
              padding: '12px 16px', marginBottom: 20, fontSize: 13, color: C.yellow, lineHeight: 1.5,
              display: 'flex', alignItems: 'center', gap: 10,
            }}
          >
            <span style={{ fontSize: 16 }}>🧪</span>
            <span><strong>Test mode</strong> — this is a preview of the checkout flow. No real payment gateway will open and no booking will be created.</span>
          </motion.div>
        )}

        {/* Quote Receipt */}
        <motion.div
          variants={stagger(0.05)} initial="hidden" animate="show"
          style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, overflow: 'hidden', marginBottom: 20 }}
        >
          {/* Receipt header */}
          <div style={{ background: `${plan.color}12`, borderBottom: `1px solid ${plan.color}25`, padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{plan.name} Website</div>
              <div style={{ fontSize: 12.5, color: C.muted, marginTop: 2 }}>{plan.delivery} · {hostingLabel} · ₹0/mo</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: C.muted }}>For</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{formData.name}</div>
            </div>
          </div>

          {/* Line items */}
          <div style={{ padding: '18px 22px' }}>
            <Row label={`${plan.name} Plan (base)`} value={`₹${fmt(plan.price)}`} />
            {addonList.map((a) => (
              <Row key={a.id} label={a.name} value={`+₹${fmt(a.price)}`} />
            ))}
            <div style={{ borderTop: `1px solid ${C.border}`, margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, marginBottom: appliedPromo ? 4 : 10 }}>
              <span style={{ color: C.text }}>Total</span>
              <span style={{ color: appliedPromo ? C.muted : C.text, textDecoration: appliedPromo ? 'line-through' : 'none' }}>₹{fmt(total)}</span>
            </div>
            {appliedPromo && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, marginBottom: 10 }}>
                <span style={{ color: C.green, fontWeight: 600 }}>Promo {appliedPromo.code} applied</span>
                <span style={{ color: C.green, fontWeight: 700 }}>−₹{fmt(appliedPromo.discount_amount)}</span>
              </div>
            )}
            {appliedPromo && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, marginBottom: 10 }}>
                <span style={{ color: C.text }}>New total</span>
                <span style={{ color: C.text }}>₹{fmt(effectiveTotal)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, marginBottom: 6 }}>
              <span style={{ color: C.muted }}>Balance on delivery</span>
              <span style={{ color: C.green, fontWeight: 600 }}>₹{fmt(balance)}</span>
            </div>
          </div>
        </motion.div>

        {/* Promo code */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}
          style={{ marginBottom: 20 }}
        >
          {!promoOpen && !appliedPromo && (
            <button
              onClick={() => setPromoOpen(true)}
              style={{ background: 'transparent', border: 'none', color: C.accent, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
            >
              Have a promo code?
            </button>
          )}
          {appliedPromo && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: `${C.green}12`, border: `1px solid ${C.green}40`, borderRadius: 12, padding: '12px 16px' }}>
              <span style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>Code {appliedPromo.code} applied — you saved ₹{fmt(appliedPromo.discount_amount)}</span>
              <button onClick={removePromo} style={{ background: 'transparent', border: 'none', color: C.muted, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}>Remove</button>
            </div>
          )}
          {promoOpen && !appliedPromo && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <input
                  value={promoInput}
                  onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoState('idle'); setPromoError(''); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyPromo(); } }}
                  placeholder="Enter code"
                  style={{
                    width: '100%', boxSizing: 'border-box', background: C.surface, border: `1px solid ${promoState === 'invalid' ? C.red : C.border}`,
                    borderRadius: 10, padding: '10px 14px', color: C.text, fontSize: 13.5, outline: 'none', fontFamily: 'inherit', letterSpacing: '0.03em',
                  }}
                />
                {promoState === 'invalid' && <div style={{ fontSize: 12, color: C.red, marginTop: 6 }}>{promoError}</div>}
              </div>
              <button
                onClick={applyPromo}
                disabled={promoState === 'checking' || !promoInput.trim()}
                style={{
                  background: C.accent, color: '#fff', border: 'none', borderRadius: 10,
                  padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  opacity: promoState === 'checking' || !promoInput.trim() ? 0.6 : 1, flexShrink: 0,
                }}
              >
                {promoState === 'checking' ? 'Checking…' : 'Apply'}
              </button>
            </div>
          )}
        </motion.div>

        {/* Advance box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
          style={{
            background: `${plan.color}12`, border: `1.5px solid ${plan.color}40`,
            borderRadius: 16, padding: '20px 22px', marginBottom: 20,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            boxShadow: `0 0 30px ${plan.color}15`,
          }}
        >
          <div>
            <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 4 }}>Advance to pay now ({advancePct * 100}%)</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: plan.color, letterSpacing: '-0.02em' }}>₹{fmt(effectiveAdvance)}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Secure · One-time · via Razorpay</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>{PLAN_ICONS[plan.id]?.(plan.color)}</div>
        </motion.div>

        {/* Customer info */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
          style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px 20px', marginBottom: 24, fontSize: 13 }}
        >
          <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, fontWeight: 600 }}>Booking for</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 20px', color: C.dim }}>
            <div><span style={{ color: C.muted }}>Name: </span>{formData.name}</div>
            <div><span style={{ color: C.muted }}>Phone: </span>{formData.phone}</div>
            <div><span style={{ color: C.muted }}>Email: </span>{formData.email}</div>
            <div><span style={{ color: C.muted }}>City: </span>{formData.city}</div>
            <div style={{ gridColumn: '1 / -1' }}><span style={{ color: C.muted }}>Best time: </span>{formData.timing}</div>
            {formData.notes && <div style={{ gridColumn: '1 / -1' }}><span style={{ color: C.muted }}>Notes: </span>{formData.notes}</div>}
          </div>
        </motion.div>

        {/* Error */}
        {status === 'error' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: `${C.red}15`, border: `1px solid ${C.red}40`, borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13.5, color: C.red }}>
            Payment failed. Please try again or contact me directly.
          </motion.div>
        )}

        {/* Pay button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          onClick={handlePay}
          disabled={status === 'loading'}
          style={{
            background: status === 'loading'
              ? C.surface2
              : `linear-gradient(135deg, ${plan.color}, ${plan.color}CC)`,
            color: '#fff', border: 'none', borderRadius: 14,
            padding: '18px', fontSize: 17, fontWeight: 800,
            cursor: status === 'loading' ? 'not-allowed' : 'pointer',
            width: '100%', fontFamily: 'inherit',
            boxShadow: status === 'loading' ? 'none' : `0 8px 32px ${plan.color}35`,
            transition: 'all .2s', letterSpacing: '0.01em',
            position: 'relative', overflow: 'hidden',
          }}
          whileHover={status !== 'loading' ? { scale: 1.01 } : {}}
          whileTap={status !== 'loading' ? { scale: 0.99 } : {}}
        >
          {status === 'loading' ? (
            <span>{demoMode ? 'Simulating payment...' : 'Opening payment...'}</span>
          ) : demoMode ? (
            <span>🧪 Preview Payment Flow (Test Mode)</span>
          ) : (
            <span>🔒 Pay ₹{fmt(effectiveAdvance)} Advance via Razorpay</span>
          )}
        </motion.button>

        {/* Trust badges */}
        {demoMode ? (
          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: C.yellow }}>
            🧪 No real payment will be processed
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 16, fontSize: 12, color: C.muted }}>
            <span>🔒 256-bit SSL</span>
            <span>🏦 Razorpay Secure</span>
            <span>✅ UPI / Cards / Wallets</span>
          </div>
        )}

        <div style={{ textAlign: 'center', fontSize: 12, color: C.muted, marginTop: 12, lineHeight: 1.6 }}>
          {demoMode ? (
            <>This preview won't create a real booking or charge any payment method.</>
          ) : (
            <>
              By paying, you confirm you've reviewed the quote above.<br />
              Balance of <strong style={{ color: C.green }}>₹{fmt(balance)}</strong> is due only after final delivery & approval.
            </>
          )}
        </div>
      </div>
    </div>
  );
}
