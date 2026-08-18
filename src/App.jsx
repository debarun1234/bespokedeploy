import { useReducer, useState, useEffect, lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Landing              from './components/Landing';
import AddonStep            from './components/AddonStep';
import FormStep             from './components/FormStep';
import PaymentStep          from './components/PaymentStep';
import SuccessStep          from './components/SuccessStep';
import FinalPaymentSuccess  from './components/FinalPaymentSuccess';
import ProgressBar          from './components/ProgressBar';
import ContactBubble        from './components/ContactBubble';

// Admin/About/Feedback are separate routes customers never hit on the main
// booking flow — lazy-load them so their code (incl. jsPDF via AdminPage's
// certificate feature) doesn't bloat the main checkout bundle.
const AdminPage    = lazy(() => import('./components/AdminPage'));
const AboutPage    = lazy(() => import('./components/AboutPage'));
const FeedbackPage = lazy(() => import('./components/FeedbackPage'));

const RouteFallback = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--c-bg)' }}>
    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Loading…</div>
  </div>
);

// ─── Route guards ─────────────────────────────────────────
const IS_ADMIN    = window.location.pathname === '/admin';
const IS_ABOUT    = window.location.pathname === '/about';
const IS_FEEDBACK = window.location.pathname === '/feedback';

// Detect Razorpay final payment callback.
// Razorpay appends: razorpay_payment_link_status=paid + razorpay_payment_link_id etc.
// We also check our own ?payment=final param for forward-compat.
function getBookingIdFromCallback() {
  const sp  = new URLSearchParams(window.location.search);
  const rzpStatus = sp.get('razorpay_payment_link_status');
  const ourParam  = sp.get('payment');
  // Matches: Razorpay's own paid callback, OR our ?payment=final param
  if (rzpStatus !== 'paid' && ourParam !== 'final') return null;
  return sp.get('booking') || null;
}

const FINAL_PAYMENT_BOOKING_ID = getBookingIdFromCallback();

// Waitlist invite: ?invite=TOKEN lets a notified customer bypass the
// capacity block for a limited window (see functions/api/admin/waitlist/[id]/notify.js)
const INVITE_TOKEN = new URLSearchParams(window.location.search).get('invite') || null;

// ─── State Machine ────────────────────────────────────────
const init = {
  step:          'landing', // landing | addons | form | payment | success
  dir:           1,
  selectedPlan:  null,
  selectedAddons: {},       // { [id]: addon }
  hostingChoice: 'netlify', // 'netlify' | 'cloudflare'
  formData:      {},
  paymentId:     null,
  bookingId:     null,
  inviteInfo:    null,      // { valid, plan_id, plan_name, customer_name, ... } | null
};

function reducer(s, a) {
  switch (a.type) {
    case 'SELECT_PLAN':
      // Portfolio defaults to Netlify; business plans default to Cloudflare
      return { ...s, selectedPlan: a.plan, selectedAddons: {}, hostingChoice: a.plan.id === 'portfolio' ? 'netlify' : 'cloudflare', step: 'addons', dir: 1 };
    case 'SET_HOSTING':
      return { ...s, hostingChoice: a.choice };
    case 'TOGGLE_ADDON': {
      const next = { ...s.selectedAddons };
      if (next[a.addon.id]) delete next[a.addon.id];
      else next[a.addon.id] = a.addon;
      return { ...s, selectedAddons: next };
    }
    case 'NEXT':
      return { ...s, step: a.step, dir: 1 };
    case 'BACK':
      return { ...s, step: a.step, dir: -1 };
    case 'SET_FORM':
      return { ...s, formData: a.data, step: 'payment', dir: 1 };
    case 'PAYMENT_SUCCESS':
      // total/advance here are what was ACTUALLY charged (post-promo, server-
      // confirmed) — may differ from the plain total/advance computed above
      // from siteSettings, which doesn't know about any applied discount.
      return {
        ...s, paymentId: a.paymentId, bookingId: a.bookingId, step: 'success', dir: 1,
        finalTotal: a.total, finalAdvance: a.advance,
        promoCode: a.promoCode, discountAmount: a.discountAmount,
      };
    case 'SET_INVITE_INFO':
      return { ...s, inviteInfo: a.info };
    default:
      return s;
  }
}

const PREV  = { addons: 'landing', form: 'addons', payment: 'form' };
const INDEX = { addons: 0, form: 1, payment: 2 };

// ─── App ──────────────────────────────────────────────────
// ─── Final Payment Wrapper ────────────────────────────────
// Fetches booking from /api/booking/[id]/public and shows confirmation screen.
function FinalPaymentPage({ bookingId }) {
  const [booking, setBooking] = useState(null);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    fetch(`/api/booking/${bookingId}/public`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(setBooking)
      .catch(() => setError(true));
  }, [bookingId]);

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, background: 'var(--c-bg)' }}>
      <div style={{ fontSize: 32 }}>⚠️</div>
      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Could not load booking details.</div>
      <a href="/" style={{ color: '#0EA5E9', fontSize: 13 }}>← Back to home</a>
    </div>
  );

  if (!booking) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--c-bg)' }}>
      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Loading…</div>
    </div>
  );

  return (
    <div style={{ background: 'var(--c-bg)', minHeight: '100vh' }}>
      <FinalPaymentSuccess
        bookingId={booking.id}
        planName={booking.plan_name}
        total={booking.total}
        balance={booking.balance}
        customerName={booking.customer_name}
      />
      <ContactBubble />
    </div>
  );
}

export default function App() {
  if (IS_ADMIN)    return <Suspense fallback={<RouteFallback />}><AdminPage /></Suspense>;
  if (IS_ABOUT)    return <Suspense fallback={<RouteFallback />}><AboutPage /></Suspense>;
  if (IS_FEEDBACK) return <Suspense fallback={<RouteFallback />}><FeedbackPage /></Suspense>;

  // Final payment callback from Razorpay payment link
  if (FINAL_PAYMENT_BOOKING_ID) return <FinalPaymentPage bookingId={FINAL_PAYMENT_BOOKING_ID} />;

  const [s, dispatch] = useReducer(reducer, init);
  const [siteSettings, setSiteSettings] = useState(null);

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(setSiteSettings).catch(() => {});
  }, []);

  useEffect(() => {
    if (!INVITE_TOKEN) return;
    fetch(`/api/waitlist/invite/${INVITE_TOKEN}`)
      .then(r => r.json())
      .then(info => dispatch({ type: 'SET_INVITE_INFO', info }))
      .catch(() => {});
  }, []);

  const total = s.selectedPlan
    ? s.selectedPlan.price + Object.values(s.selectedAddons).reduce((acc, a) => acc + a.price, 0)
    : 0;
  const advThreshold = siteSettings?.general?.advance_threshold ?? 15000;
  const advancePct   = total < advThreshold
    ? (siteSettings?.general?.advance_pct_low  ?? 0.2)
    : (siteSettings?.general?.advance_pct_high ?? 0.3);
  const advance    = Math.round(total * advancePct);

  const isFlow = ['addons', 'form', 'payment'].includes(s.step);

  const pageV = {
    enter:  (d) => ({ opacity: 0, x: d * 60 }),
    center: { opacity: 1, x: 0 },
    exit:   (d) => ({ opacity: 0, x: d * -60 }),
  };

  return (
    <div style={{ background: 'var(--c-bg)', minHeight: '100vh', transition: 'background 0.3s ease' }}>
      {/* Sticky flow header */}
      {isFlow && (
        <ProgressBar
          stepIndex={INDEX[s.step]}
          plan={s.selectedPlan}
          onBack={() => dispatch({ type: 'BACK', step: PREV[s.step] })}
        />
      )}

      <AnimatePresence mode="wait" custom={s.dir}>
        <motion.div
          key={s.step}
          custom={s.dir}
          variants={pageV}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          {s.step === 'landing' && (
            <Landing onSelectPlan={(plan) => dispatch({ type: 'SELECT_PLAN', plan })} siteSettings={siteSettings} inviteInfo={s.inviteInfo} />
          )}

          {s.step === 'addons' && (
            <AddonStep
              plan={s.selectedPlan}
              selectedAddons={s.selectedAddons}
              hostingChoice={s.hostingChoice}
              total={total}
              advance={advance}
              advancePct={advancePct}
              onToggle={(addon) => dispatch({ type: 'TOGGLE_ADDON', addon })}
              onSetHosting={(choice) => dispatch({ type: 'SET_HOSTING', choice })}
              onNext={() => dispatch({ type: 'NEXT', step: 'form' })}
            />
          )}

          {s.step === 'form' && (
            <FormStep
              formData={s.formData}
              plan={s.selectedPlan}
              total={total}
              onNext={(data) => dispatch({ type: 'SET_FORM', data })}
            />
          )}

          {s.step === 'payment' && (
            <PaymentStep
              plan={s.selectedPlan}
              addons={s.selectedAddons}
              hostingChoice={s.hostingChoice}
              formData={s.formData}
              total={total}
              advance={advance}
              advancePct={advancePct}
              inviteToken={s.inviteInfo?.valid ? INVITE_TOKEN : null}
              demoMode={!!siteSettings?.general?.demo_mode}
              onSuccess={(pid, bid, extra) => dispatch({ type: 'PAYMENT_SUCCESS', paymentId: pid, bookingId: bid, ...extra })}
            />
          )}

          {s.step === 'success' && (
            <SuccessStep
              plan={s.selectedPlan}
              addons={s.selectedAddons}
              hostingChoice={s.hostingChoice}
              formData={s.formData}
              total={s.finalTotal ?? total}
              advance={s.finalAdvance ?? advance}
              promoCode={s.promoCode}
              discountAmount={s.discountAmount}
              paymentId={s.paymentId}
              bookingId={s.bookingId}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <ContactBubble />
    </div>
  );
}
