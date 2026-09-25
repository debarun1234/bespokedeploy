import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Landing              from './components/Landing';
import AddonStep            from './components/AddonStep';
import FormStep             from './components/FormStep';
import PaymentStep          from './components/PaymentStep';
import SuccessStep          from './components/SuccessStep';
import FinalPaymentSuccess  from './components/FinalPaymentSuccess';
import ProgressBar          from './components/ProgressBar';
import ContactBubble        from './components/ContactBubble';
import CustomCursor         from './components/CustomCursor';
import { BookingProvider, useBooking } from './bookingContext';
import { trackPageView, trackEvent } from './lib/analytics';

// Admin/About/Feedback are separate routes customers never hit on the main
// booking flow — lazy-load them so their code (incl. jsPDF via AdminPage's
// certificate feature) doesn't bloat the main checkout bundle.
const AdminPage    = lazy(() => import('./components/AdminPage'));
const AboutPage    = lazy(() => import('./components/AboutPage'));
const FeedbackPage = lazy(() => import('./components/FeedbackPage'));
const FAQPage      = lazy(() => import('./components/FAQPage'));
const LegalPage     = lazy(() => import('./components/LegalPage'));

const RouteFallback = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--c-bg)' }}>
    <div style={{ color: 'var(--c-muted)', fontSize: 14 }}>Loading…</div>
  </div>
);

// Detect Razorpay final payment callback.
// Razorpay appends: razorpay_payment_link_status=paid + razorpay_payment_link_id etc.
// We also check our own ?payment=final param for forward-compat.
// NOTE: functions/api/booking/[id]/payment-link.js hardcodes the Razorpay
// callback_url to `${origin}/?...` — so the callback always lands on `/`
// with these query params. We keep detecting it there (not a separate
// route) to match that server-side contract; /book/final-payment exists as
// an additional, forward-compatible route for the same component.
function getBookingIdFromCallback() {
  const sp  = new URLSearchParams(window.location.search);
  const rzpStatus = sp.get('razorpay_payment_link_status');
  const ourParam  = sp.get('payment');
  // Matches: Razorpay's own paid callback, OR our ?payment=final param
  if (rzpStatus !== 'paid' && ourParam !== 'final') return null;
  return sp.get('booking') || null;
}

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
      <div style={{ color: 'var(--c-muted)', fontSize: 14 }}>Could not load booking details.</div>
      <a href="/" style={{ color: '#E8542C', fontSize: 13 }}>← Back to home</a>
    </div>
  );

  if (!booking) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--c-bg)' }}>
      <div style={{ color: 'var(--c-muted)', fontSize: 14 }}>Loading…</div>
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

function FinalPaymentRoute() {
  const bookingId = getBookingIdFromCallback();
  if (!bookingId) return <Navigate to="/" replace />;
  return <FinalPaymentPage bookingId={bookingId} />;
}

// ─── Guard: booking routes need a selected plan in context ─
// On direct navigation / refresh with no in-memory state, bounce home.
function RequirePlan({ children }) {
  const { state } = useBooking();
  if (!state.selectedPlan) return <Navigate to="/" replace />;
  return children;
}

const PREV  = { addons: '/', form: '/book/addons', payment: '/book/details' };
const INDEX = { addons: 0, form: 1, payment: 2 };

function RootRoute() {
  const bookingId = getBookingIdFromCallback();
  if (bookingId) return <FinalPaymentPage bookingId={bookingId} />;

  const navigate = useNavigate();
  const { state, dispatch, siteSettings } = useBooking();

  return (
    <>
      <Landing
        onSelectPlan={(plan) => {
          dispatch({ type: 'SELECT_PLAN', plan });
          trackEvent('select_content', { content_type: 'plan', item_id: plan.id, item_name: plan.name, value: plan.price, currency: 'INR' });
          navigate('/book/addons');
        }}
        siteSettings={siteSettings}
        inviteInfo={state.inviteInfo}
      />
      <ContactBubble />
    </>
  );
}

function AddonsRoute() {
  const navigate = useNavigate();
  const { state, dispatch, total, advance, advancePct } = useBooking();
  return (
    <>
      <ProgressBar stepIndex={INDEX.addons} plan={state.selectedPlan} onBack={() => navigate(PREV.addons)} />
      <AddonStep
        plan={state.selectedPlan}
        selectedAddons={state.selectedAddons}
        hostingChoice={state.hostingChoice}
        total={total}
        advance={advance}
        advancePct={advancePct}
        onToggle={(addon) => dispatch({ type: 'TOGGLE_ADDON', addon })}
        onSetHosting={(choice) => dispatch({ type: 'SET_HOSTING', choice })}
        onNext={() => navigate('/book/details')}
      />
    </>
  );
}

function DetailsRoute() {
  const navigate = useNavigate();
  const { state, dispatch, total } = useBooking();
  return (
    <>
      <ProgressBar stepIndex={INDEX.form} plan={state.selectedPlan} onBack={() => navigate(PREV.form)} />
      <FormStep
        formData={state.formData}
        plan={state.selectedPlan}
        total={total}
        onNext={(data) => {
          dispatch({ type: 'SET_FORM', data });
          navigate('/book/payment');
        }}
      />
    </>
  );
}

function PaymentRoute() {
  const navigate = useNavigate();
  const { state, dispatch, total, advance, advancePct, siteSettings, inviteToken } = useBooking();
  return (
    <>
      <ProgressBar stepIndex={INDEX.payment} plan={state.selectedPlan} onBack={() => navigate(PREV.payment)} />
      <PaymentStep
        plan={state.selectedPlan}
        addons={state.selectedAddons}
        hostingChoice={state.hostingChoice}
        formData={state.formData}
        total={total}
        advance={advance}
        advancePct={advancePct}
        inviteToken={state.inviteInfo?.valid ? inviteToken : null}
        demoMode={!!siteSettings?.general?.demo_mode}
        onSuccess={(pid, bid, extra) => {
          dispatch({ type: 'PAYMENT_SUCCESS', paymentId: pid, bookingId: bid, ...extra });
          trackEvent('purchase', {
            transaction_id: bid,
            value: extra?.advance ?? advance,
            currency: 'INR',
            items: [{ item_id: state.selectedPlan?.id, item_name: state.selectedPlan?.name, price: extra?.total ?? total }],
          });
          navigate('/book/success');
        }}
      />
      <ContactBubble />
    </>
  );
}

function SuccessRoute() {
  const { state, total, advance } = useBooking();
  return (
    <>
      <SuccessStep
        plan={state.selectedPlan}
        addons={state.selectedAddons}
        hostingChoice={state.hostingChoice}
        formData={state.formData}
        total={state.finalTotal ?? total}
        advance={state.finalAdvance ?? advance}
        promoCode={state.promoCode}
        discountAmount={state.discountAmount}
        paymentId={state.paymentId}
        bookingId={state.bookingId}
      />
      <ContactBubble />
    </>
  );
}

// React Router doesn't reset scroll position on navigation. Without this,
// moving from a long, scrolled-down page (e.g. the plans list) to a shorter
// one (e.g. the addons step) just clamps the existing scroll offset to the
// new page's max — which looks like the page "auto scrolls up" and lands
// you mid-page, right up against the sticky progress bar with seemingly no
// top padding. Force every route change to start at the top instead.
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    // GA4's automatic pageview (index.html) is disabled via send_page_view:
    // false — this fires one manually on every route change instead,
    // including the very first load, so the full booking funnel
    // (/book/addons → /book/details → /book/payment → /book/success) and
    // pages like /about, /faq, /privacy, /terms actually show up in Analytics.
    trackPageView(pathname);
  }, [pathname]);
  return null;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRoute />} />
      <Route path="/book/addons"  element={<RequirePlan><AddonsRoute /></RequirePlan>} />
      <Route path="/book/details" element={<RequirePlan><DetailsRoute /></RequirePlan>} />
      <Route path="/book/payment" element={<RequirePlan><PaymentRoute /></RequirePlan>} />
      <Route path="/book/success" element={<RequirePlan><SuccessRoute /></RequirePlan>} />
      <Route path="/book/final-payment" element={<FinalPaymentRoute />} />
      <Route path="/about"    element={<Suspense fallback={<RouteFallback />}><AboutPage /></Suspense>} />
      <Route path="/faq"      element={<Suspense fallback={<RouteFallback />}><FAQPage /></Suspense>} />
      <Route path="/privacy"  element={<Suspense fallback={<RouteFallback />}><LegalPage doc="privacy" /></Suspense>} />
      <Route path="/terms"    element={<Suspense fallback={<RouteFallback />}><LegalPage doc="tnc" /></Suspense>} />
      <Route path="/feedback" element={<Suspense fallback={<RouteFallback />}><FeedbackPage /></Suspense>} />
      <Route path="/admin"    element={<Suspense fallback={<RouteFallback />}><AdminPage /></Suspense>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <BookingProvider>
        <div className="custom-cursor-zone" style={{ background: 'var(--c-bg)', minHeight: '100vh' }}>
          <CustomCursor />
          <ScrollToTop />
          <AppRoutes />
        </div>
      </BookingProvider>
    </BrowserRouter>
  );
}
