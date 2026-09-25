import { createContext, useContext, useReducer, useState, useEffect } from 'react';

// ─── State Machine ────────────────────────────────────────
// Lifted out of App.jsx unchanged — this is the single source of truth for
// booking data (selectedPlan, selectedAddons, formData, etc.) shared across
// the /book/* routes via BookingProvider/useBooking().
const init = {
  step:          'landing', // landing | addons | form | payment | success (kept for compat, no longer drives rendering)
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

// Waitlist invite: ?invite=TOKEN lets a notified customer bypass the
// capacity block for a limited window (see functions/api/admin/waitlist/[id]/notify.js)
const INVITE_TOKEN = new URLSearchParams(window.location.search).get('invite') || null;

const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, init);
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

  const total = state.selectedPlan
    ? state.selectedPlan.price + Object.values(state.selectedAddons).reduce((acc, a) => acc + a.price, 0)
    : 0;
  const advThreshold = siteSettings?.general?.advance_threshold ?? 15000;
  const advancePct   = total < advThreshold
    ? (siteSettings?.general?.advance_pct_low  ?? 0.2)
    : (siteSettings?.general?.advance_pct_high ?? 0.3);
  const advance = Math.round(total * advancePct);

  const value = {
    state, dispatch, siteSettings,
    total, advance, advancePct,
    inviteToken: INVITE_TOKEN,
  };

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used within a BookingProvider');
  return ctx;
}
