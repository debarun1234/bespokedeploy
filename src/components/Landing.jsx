import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { PLANS } from '../data/plans';
import { PLAN_ICONS, PAUSE_ICON } from '../data/planIcons';
import { C, fadeUp, stagger, fmt } from '../theme';

// ─── Promo Banner ───────────────────────────────────────────
// Fetches from GET /api/promos — a public, read-only endpoint that only ever
// returns an admin-enabled promo currently inside its date window (see
// functions/api/promos.js). Nothing here can be written to or spoofed from
// the browser: creating/editing/toggling a promo requires the admin's bearer
// token, checked server-side on every write (functions/api/admin/promos/).
const PROMO_THEME_COLORS = {
  accent: { c1: '#0EA5E9', c2: '#38BDF8' },
  gold:   { c1: '#F59E0B', c2: '#FBBF24' },
  green:  { c1: '#10B981', c2: '#34D399' },
  purple: { c1: '#8B5CF6', c2: '#A78BFA' },
};

// Custom animated sparkle mark — twinkling star + a smaller offset dot,
// looping via framer-motion. No emoji anywhere in the promo UI.
function PromoSparkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
      <motion.path
        d="M10 1 L11.8 8.2 L19 10 L11.8 11.8 L10 19 L8.2 11.8 L1 10 L8.2 8.2 Z"
        fill="#fff"
        style={{ transformOrigin: '10px 10px' }}
        animate={{ opacity: [0.55, 1, 0.55], scale: [0.85, 1.05, 0.85], rotate: [0, 14, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.circle
        cx="16.5" cy="4" r="1.3" fill="#fff"
        animate={{ opacity: [0, 1, 0], scale: [0.4, 1, 0.4] }}
        transition={{ duration: 1.9, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />
    </svg>
  );
}

function PromoBannerContent({ promo }) {
  const { c1, c2 } = PROMO_THEME_COLORS[promo.theme] || PROMO_THEME_COLORS.accent;
  return (
    <motion.div
      key={promo.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: `linear-gradient(90deg, ${c1}, ${c2})`,
        padding: '11px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 12, flexWrap: 'wrap', textAlign: 'center',
      }}
    >
      <PromoSparkIcon />
      {!!promo.badge_text && (
        <span style={{
          background: 'rgba(255,255,255,0.22)', color: '#fff', fontWeight: 800,
          fontSize: 11, letterSpacing: '0.06em', borderRadius: 20, padding: '3px 11px',
          flexShrink: 0,
        }}>
          {promo.badge_text}
        </span>
      )}
      <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{promo.title}</span>
      {!!promo.subtitle && (
        <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: 400 }}>{promo.subtitle}</span>
      )}
      {!!promo.code && (
        <span style={{
          background: 'rgba(0,0,0,0.18)', color: '#fff', fontWeight: 700,
          fontSize: 12, borderRadius: 8, padding: '3px 10px', letterSpacing: '0.03em', fontFamily: 'monospace',
        }}>
          CODE: {promo.code}
        </span>
      )}
    </motion.div>
  );
}

// Rotates through every currently-live promo every 2 seconds when there's
// more than one. `promos` is always the freshly-fetched array from
// GET /api/promos — nothing here is user-editable.
function PromoBanner({ promos, onDismiss }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (promos.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % promos.length), 2000);
    return () => clearInterval(id);
  }, [promos.length]);

  const active = promos[index % promos.length];

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{ overflow: 'hidden', position: 'relative', zIndex: 20 }}
    >
      <AnimatePresence mode="wait">
        <PromoBannerContent key={active.id} promo={active} />
      </AnimatePresence>

      {promos.length > 1 && (
        <div style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5 }}>
          {promos.map((p, i) => (
            <span key={p.id} style={{
              width: 5, height: 5, borderRadius: '50%',
              background: i === index ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)',
              transition: 'background .2s',
            }} />
          ))}
        </div>
      )}

      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        style={{
          position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
          background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.85)',
          fontSize: 18, lineHeight: 1, cursor: 'pointer', padding: 4, zIndex: 1,
        }}
      >
        ×
      </button>
    </motion.div>
  );
}

// ─── USP SVG Icons ────────────────────────────────────────
const USP_ICONS = {
  // Cloud with checkmark — free, always-on hosting
  hosting: (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <path d="M12 30a7 7 0 01-.8-13.9A10 10 0 0131 18a6.5 6.5 0 01-1 13z"
        stroke="#10B981" strokeWidth="2" strokeLinejoin="round" fill="rgba(16,185,129,0.08)"/>
      <polyline points="17,25 20.5,29 29,19"
        stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),

  // Clock with speed lines — fast delivery
  delivery: (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <circle cx="24" cy="22" r="13" stroke="#F59E0B" strokeWidth="2" fill="rgba(245,158,11,0.07)"/>
      <polyline points="24,13 24,22 30,28"
        stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Speed lines left */}
      <line x1="4" y1="17" x2="9" y2="17" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"/>
      <line x1="2" y1="22" x2="8" y2="22" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" opacity="0.55"/>
      <line x1="4" y1="27" x2="9" y2="27" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
    </svg>
  ),

  // Open eye — see every rupee, full transparency
  transparency: (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <path d="M5 22c0 0 7-11 17-11s17 11 17 11-7 11-17 11S5 22 5 22z"
        stroke="#0EA5E9" strokeWidth="2" strokeLinejoin="round" fill="rgba(14,165,233,0.08)"/>
      <circle cx="22" cy="22" r="5" stroke="#0EA5E9" strokeWidth="2" fill="rgba(14,165,233,0.18)"/>
      <circle cx="22" cy="22" r="2" fill="#0EA5E9"/>
      {/* Lashes / rays */}
      <line x1="22" y1="8" x2="22" y2="11" stroke="#0EA5E9" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="10" y1="13" x2="12.5" y2="15.5" stroke="#0EA5E9" strokeWidth="1.8" strokeLinecap="round" opacity="0.5"/>
      <line x1="34" y1="13" x2="31.5" y2="15.5" stroke="#0EA5E9" strokeWidth="1.8" strokeLinecap="round" opacity="0.5"/>
    </svg>
  ),

  // Two circular arrows — revision loop
  revisions: (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      {/* Top arc → right */}
      <path d="M12 18a12 12 0 0120 0" stroke="#EC4899" strokeWidth="2" strokeLinecap="round"/>
      {/* Arrow at right end */}
      <polyline points="28,13 33,18 28,21" stroke="#EC4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Bottom arc → left */}
      <path d="M32 26a12 12 0 01-20 0" stroke="#EC4899" strokeWidth="2" strokeLinecap="round"/>
      {/* Arrow at left end */}
      <polyline points="16,31 11,26 16,23" stroke="#EC4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {/* "2×" center */}
      <text x="22" y="26" textAnchor="middle" fill="#EC4899" fontSize="9.5" fontWeight="800" fontFamily="Inter,sans-serif">2×</text>
    </svg>
  ),
};

// ─── USPs ─────────────────────────────────────────────────
const USPS = [
  { id: 'hosting',      title: 'Free Hosting Forever', desc: 'Cloudflare Pages: unlimited bandwidth, 20,000 files, 100 custom domains, 300+ global data centres, free SSL, DDoS shield — all at ₹0/month, forever. No traffic limits, no surprises.' },
  { id: 'delivery',     title: '5–7 Day Delivery',     desc: 'No waiting weeks. You get updates at every stage of the build.' },
  { id: 'transparency', title: 'Full Transparency',    desc: 'What you pick is what you pay. Every rupee is visible before you commit.' },
  { id: 'revisions',    title: '2 Free Revisions',     desc: 'After delivery, two full rounds of changes included. Zero questions asked.' },
];

// ─── Comparison data ──────────────────────────────────────
const COMPARE_ROWS = [
  { label: 'Pricing model',          ai: 'Monthly forever',             diy: 'Monthly forever',            me: 'One-time payment ✨' },
  { label: 'Year 1 total cost',      ai: '₹10,000 – ₹18,000',          diy: '₹15,000 – ₹25,000',         me: '₹6,500 – ₹22,000',   meGood: true },
  { label: 'Year 3 total cost',      ai: '₹30,000 – ₹54,000',          diy: '₹45,000 – ₹75,000',         me: '₹6,500 – ₹22,000',   meGood: true },
  { label: 'Year 5 total cost',      ai: '₹50,000 – ₹90,000',          diy: '₹75,000 – ₹1,25,000',       me: '₹6,500 – ₹22,000 ✅', meGood: true },
  { label: 'Hosting',                ai: 'Paid add-on / compulsory',    diy: 'Compulsory (included in sub)', me: 'Free forever — unlimited bandwidth, 300+ CDN nodes' },
  { label: 'Custom design',          ai: 'Template only',               diy: 'Drag-and-drop limits',       me: 'Fully custom for you' },
  { label: 'Your branding & colors', ai: 'Template-bound',              diy: 'Template-bound',             me: 'Built around your brand' },
  { label: 'Wix / AI logo on site',  ai: 'Yes — hard to remove',        diy: 'Yes on free plans',          me: 'Never — it\'s your site' },
  { label: 'Human support',          ai: 'AI chatbot only',             diy: 'Community forums',           me: 'Direct WhatsApp / call' },
  { label: 'Revisions / changes',    ai: 'DIY or pay per edit',         diy: 'DIY only',                   me: '2 free rounds included' },
  { label: 'SEO control',            ai: 'Very limited',                diy: 'Basic only',                 me: 'Full control + meta tags' },
  { label: 'India context & language', ai: 'No',                        diy: 'No',                         me: 'Yes — built for Indian users' },
];

// ─── Compare Section ──────────────────────────────────────
function CompareSection() {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const COL = {
    ai:  { label: 'AI Builders',       sub: 'Durable · Framer · 10Web',    color: '#6B7280', bg: `${C.surface2}` },
    diy: { label: 'Wix / Squarespace', sub: 'Popular DIY platforms',        color: '#9CA3AF', bg: `${C.surface2}` },
    me:  { label: 'BespokeDeploy.in',      sub: 'Custom · Human · One-time',    color: '#0EA5E9', bg: 'rgba(14,165,233,0.07)' },
  };

  const tick  = (v, isMe) => {
    if (isMe) return <span style={{ color: '#10B981', fontWeight: 700 }}>{v}</span>;
    return <span style={{ color: C.muted }}>{v}</span>;
  };

  return (
    <motion.section
      ref={ref}
      variants={stagger()}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      id="compare"
      style={{ padding: '64px 24px', maxWidth: 1100, margin: '0 auto' }}
    >
      <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 60 }}>
        <div style={{ fontSize: 13, color: C.accent, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
          See the difference
        </div>
        <h2 style={{ fontSize: 40, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', marginBottom: 14 }}>
          Why not just use an AI builder or Wix?
        </h2>
        <p style={{ fontSize: 16, color: C.muted, maxWidth: 580, margin: '0 auto', lineHeight: 1.65 }}>
          They look cheap monthly — but over time they cost more, look generic, and leave you alone.
          Here's the honest comparison.
        </p>
      </motion.div>

      {/* Table */}
      <motion.div variants={fadeUp} style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: 640 }}>

          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1.2fr', gap: 8, marginBottom: 8 }}>
            <div /> {/* empty label cell */}
            {Object.entries(COL).map(([key, col]) => (
              <div
                key={key}
                style={{
                  background: key === 'me' ? 'rgba(14,165,233,0.12)' : C.surface,
                  border: key === 'me' ? '1.5px solid rgba(14,165,233,0.45)' : `1px solid ${C.border}`,
                  borderRadius: '14px 14px 0 0',
                  padding: '16px 14px',
                  textAlign: 'center',
                  boxShadow: key === 'me' ? '0 0 40px rgba(14,165,233,0.12)' : 'none',
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 800, color: key === 'me' ? col.color : C.text, marginBottom: 3 }}>{col.label}</div>
                <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.4 }}>{col.sub}</div>
                {key === 'me' && (
                  <div style={{ marginTop: 8, background: C.accent, color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 20, padding: '3px 10px', display: 'inline-block', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Recommended
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Rows */}
          {COMPARE_ROWS.map((row, i) => {
            const isCost = row.label.includes('cost');
            return (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.6fr 1fr 1fr 1.2fr',
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                {/* Label */}
                <div style={{
                  background: isCost ? 'rgba(14,165,233,0.05)' : C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  padding: '11px 16px',
                  fontSize: 13, fontWeight: isCost ? 700 : 500,
                  color: isCost ? C.text : C.dim,
                  display: 'flex', alignItems: 'center',
                }}>
                  {row.label}
                </div>

                {/* AI col */}
                <div style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  padding: '11px 12px',
                  fontSize: 12.5,
                  color: isCost ? '#F87171' : C.muted,
                  fontWeight: isCost ? 700 : 400,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                  lineHeight: 1.45,
                }}>
                  {row.ai}
                </div>

                {/* DIY col */}
                <div style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  padding: '11px 12px',
                  fontSize: 12.5,
                  color: isCost ? '#F87171' : C.muted,
                  fontWeight: isCost ? 700 : 400,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                  lineHeight: 1.45,
                }}>
                  {row.diy}
                </div>

                {/* Me col */}
                <div style={{
                  background: isCost ? 'rgba(16,185,129,0.08)' : 'rgba(14,165,233,0.07)',
                  border: '1.5px solid rgba(14,165,233,0.3)',
                  borderRadius: 10,
                  padding: '11px 12px',
                  fontSize: 12.5,
                  color: isCost ? '#10B981' : C.text,
                  fontWeight: isCost ? 800 : 500,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                  lineHeight: 1.45,
                  boxShadow: isCost ? '0 0 20px rgba(16,185,129,0.1)' : 'none',
                }}>
                  {row.me}
                </div>
              </div>
            );
          })}

          {/* Bottom cap for "me" column */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1.2fr', gap: 8, marginTop: 4 }}>
            <div />
            <div />
            <div />
            <div style={{
              background: 'rgba(14,165,233,0.12)',
              border: '1.5px solid rgba(14,165,233,0.45)',
              borderTop: 'none',
              borderRadius: '0 0 14px 14px',
              padding: '14px',
              textAlign: 'center',
              fontSize: 12.5,
              color: C.accent,
              fontWeight: 700,
              boxShadow: '0 0 40px rgba(14,165,233,0.12)',
            }}>
              No monthly trap. You own it forever.
            </div>
          </div>
        </div>
      </motion.div>

      {/* Callout */}
      <motion.div
        variants={fadeUp}
        style={{
          marginTop: 40, background: 'rgba(16,185,129,0.07)',
          border: '1px solid rgba(16,185,129,0.2)', borderRadius: 16,
          padding: '20px 28px', display: 'flex', alignItems: 'flex-start', gap: 16,
        }}
      >
        <span style={{ fontSize: 28, flexShrink: 0 }}>💡</span>
        <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.7 }}>
          <strong style={{ color: C.text }}>The hidden math: </strong>
          A ₹1,500/mo Wix plan costs ₹18,000 in Year 1, ₹54,000 by Year 3, and ₹90,000 by Year 5 — with ads, limited SEO, and no real human if something breaks.{' '}
          My Pro website at ₹22,000 pays itself back in under 15 months and costs nothing after that.
          The choice is clear.
        </div>
      </motion.div>
    </motion.section>
  );
}

// ─── How it works ─────────────────────────────────────────
const HOW = [
  { n: '01', title: 'Pick a Plan',      desc: 'Choose from Portfolio, Small Website, or Pro based on what you need.' },
  { n: '02', title: 'Customise It',     desc: 'Add specific features. See the exact price update live.' },
  { n: '03', title: 'Share Details',    desc: 'Tell me your contact info and preferred time to connect.' },
  { n: '04', title: 'Pay & Launch',     desc: 'Pay a small advance to lock your slot. I build it. You own it.' },
];

// ─── FAQ ──────────────────────────────────────────────────
const FAQ_GROUPS = [
  {
    title: 'Placing an order',
    items: [
      { q: 'How do I choose the right plan?', a: 'Portfolio suits individuals and students, Small Website suits local businesses and professionals, and Pro Website suits growing businesses that need more pages and functionality. Use the "Help me pick" quiz above the plans if you\'re unsure, or message me directly via the contact bubble.' },
      { q: 'What happens right after I pay the advance?', a: 'Your slot is locked in immediately. I\'ll reach out within 24 hours by call or WhatsApp to discuss your content, structure, and any references you have in mind.' },
      { q: 'Can I switch plans or add features after booking?', a: 'Yes — just let me know during our first conversation and I\'ll adjust your quote and balance accordingly before any build work starts.' },
      { q: 'Are there only 2 project slots available at a time?', a: 'Yes, I only take on 2 projects at once so each one gets proper attention. If both slots are full, you can join the waiting list and I\'ll notify you the moment one opens.' },
      { q: 'How much does a custom website cost in India?', a: 'Custom websites here start at ₹6,500 for a portfolio site, ₹12,000 for a small business website, and ₹22,000 for a full-featured Pro site — all one-time payments with hosting included free, forever. No hidden fees or recurring charges.' },
      { q: 'Should I hire a freelancer or an agency for my website?', a: 'For most small businesses, professionals, and students, a solo freelancer offers better value — you work directly with the person building your site (no account managers or handoffs), pricing is more transparent, and turnaround is faster since there\'s no internal approval chain to wait on.' },
      { q: 'Do you build websites for clinics, dieticians, or local service businesses?', a: 'Yes — recent projects include a nutrition and dietician counseling website (Sheetal\'s Prakritik Nutrition) and a wound care service website (Wound Care by Axcess). I regularly build for healthcare, wellness, and local service businesses alongside portfolios and general small-business sites.' },
    ],
  },
  {
    title: 'During service',
    items: [
      { q: 'How long does a project take?', a: 'Most projects are built within 5-7 days of our first content discussion, depending on plan complexity and how quickly you share content and feedback.' },
      { q: 'What do I need to provide?', a: 'Your business/profile content, any images or logos you have, and references to sites or styles you like. The more ready this is upfront, the faster we move.' },
      { q: 'Can I see progress before it\'s finished?', a: 'Yes — I share regular previews during the build phase so you can give feedback before the final version is locked in.' },
      { q: 'What if I go quiet for a while during the build?', a: 'That\'s fine for short gaps, but if there\'s no response from you for 14+ consecutive days the project may be treated as abandoned under our Terms, with the advance forfeited as a result.' },
    ],
  },
  {
    title: 'Post-delivery',
    items: [
      { q: 'What happens after final payment?', a: 'You get a 7-day review window with 2 free rounds of revisions included. Reply to the confirmation email with any change requests and I\'ll turn them around within 48 hours.' },
      { q: 'What if I need more than 2 revision rounds?', a: 'Additional rounds after the first 2 free ones are ₹500 each.' },
      { q: 'Do I own the final website?', a: 'Yes, full ownership and files transfer to you once final payment is complete and the project is marked done.' },
      { q: 'What if something breaks after delivery?', a: 'Message me via the contact bubble or reply to any project email — I\'ll help sort it out. Ongoing maintenance beyond the free revision window can be arranged separately.' },
    ],
  },
  {
    title: 'Payments & refunds',
    items: [
      { q: 'How much is the advance payment?', a: 'Typically 20-30% of the total project cost depending on the plan, paid upfront to lock your slot. The remaining balance is due only after you\'re satisfied with the final site.' },
      { q: 'What if I cancel before final payment?', a: 'If you cancel while only the advance has been paid, it\'s refunded in full to your original payment method within 3 business days (this doesn\'t apply if the project was treated as abandoned — see above).' },
      { q: 'What if I cancel after final payment?', a: 'Once final payment is made or the site is delivered, payments are non-refundable by default. Refunds after this point are considered at BespokeDeploy\'s discretion — reach out and I\'ll hear you out.' },
      { q: 'Is hosting really free?', a: 'Yes, hosting on Cloudflare Pages or Netlify is ₹0/month forever. A custom domain is optional and paid directly by you to your registrar of choice.' },
    ],
  },
];

function FAQSection() {
  const [openKey, setOpenKey] = useState(null);
  return (
    <Section id="faq">
      <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ fontSize: 13, color: C.accent, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Questions</div>
        <h2 style={{ fontSize: 40, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>Frequently asked questions</h2>
      </motion.div>

      <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 36 }}>
        {FAQ_GROUPS.map((group) => (
          <motion.div key={group.title} variants={fadeUp}>
            <div style={{ fontSize: 12.5, color: C.accent, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>
              {group.title}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {group.items.map((item, i) => {
                const key = `${group.title}-${i}`;
                const isOpen = openKey === key;
                return (
                  <div
                    key={key}
                    style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}
                  >
                    <button
                      onClick={() => setOpenKey(isOpen ? null : key)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                        background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                        padding: '16px 20px', fontFamily: 'inherit',
                      }}
                    >
                      <span style={{ fontSize: 14.5, fontWeight: 700, color: C.text }}>{item.q}</span>
                      <motion.span
                        animate={{ rotate: isOpen ? 45 : 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ flexShrink: 0, fontSize: 20, fontWeight: 400, color: C.accent, lineHeight: 1 }}
                      >
                        +
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div style={{ padding: '0 20px 18px', fontSize: 13.5, color: C.muted, lineHeight: 1.65 }}>
                            {item.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

// ─── Plan Card ────────────────────────────────────────────
function PlanCard({ plan, onSelect, capacity }) {
  const timelineNote = capacity
    ? (capacity.available
        ? 'Can start right away'
        : `Next opening ~${capacity.nextFreeAt ? new Date(capacity.nextFreeAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'soon'}`)
    : null;
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -8, transition: { duration: 0.25 } }}
      style={{
        background: plan.highlight
          ? 'linear-gradient(160deg, #16163A 0%, #0D0D22 100%)'
          : C.surface,
        border: plan.highlight
          ? `2px solid ${plan.color}`
          : `1px solid ${C.border}`,
        borderRadius: 22,
        padding: '32px 28px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        boxShadow: plan.highlight ? `0 0 60px ${plan.color}25` : 'none',
        transition: 'box-shadow .3s',
      }}
    >
      {/* Badge */}
      {plan.badge && (
        <div style={{
          position: 'absolute', top: -14, left: '50%',
          transform: 'translateX(-50%)',
          background: plan.color, color: '#fff',
          fontSize: 11, fontWeight: 800, letterSpacing: '0.06em',
          padding: '4px 16px', borderRadius: 20, whiteSpace: 'nowrap',
          textTransform: 'uppercase',
        }}>
          {plan.badge}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 14 }}>{PLAN_ICONS[plan.id]?.(plan.color)}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: plan.highlight ? '#ffffff' : C.text, marginBottom: 4 }}>{plan.name}</div>
      <div style={{ fontSize: 13, color: plan.highlight ? 'rgba(255,255,255,0.6)' : C.muted, marginBottom: 22, lineHeight: 1.55 }}>{plan.tagline}</div>

      {/* Price */}
      <div style={{ marginBottom: 26 }}>
        <div style={{ fontSize: 11, color: plan.highlight ? 'rgba(255,255,255,0.5)' : C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>One-time price</div>
        <div style={{
          fontSize: 40, fontWeight: 900, letterSpacing: '-0.02em',
          background: `linear-gradient(135deg, ${plan.color}, ${plan.color}99)`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          ₹{fmt(plan.price)}
        </div>
        <div style={{ fontSize: 12, color: plan.highlight ? 'rgba(255,255,255,0.5)' : C.muted, marginTop: 4 }}>+ ₹0/month hosting · ⏱ {plan.delivery}</div>
        {timelineNote && (
          <div style={{ fontSize: 11.5, color: capacity.available ? '#10B981' : '#F59E0B', marginTop: 6, fontWeight: 600 }}>
            {capacity.available ? '✓' : '⏳'} {timelineNote}{capacity.available ? ` · delivered in ${plan.delivery}` : ''}
          </div>
        )}
      </div>

      {/* Included */}
      <div style={{ flex: 1, marginBottom: 26 }}>
        {plan.inheritsFrom ? (
          <>
            {/* "Everything from X" pill */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: `${plan.color}14`, border: `1px solid ${plan.color}35`,
              borderRadius: 8, padding: '6px 12px', marginBottom: 14,
            }}>
              <span style={{ color: plan.color, fontSize: 13, fontWeight: 700 }}>✦</span>
              <span style={{ fontSize: 12.5, color: plan.color, fontWeight: 600 }}>
                Everything in {plan.inheritsFrom}, plus:
              </span>
            </div>
            {plan.extras.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 9, marginBottom: 9, alignItems: 'flex-start' }}>
                <span style={{ color: plan.color, fontSize: 13, marginTop: 2, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 13.5, color: plan.highlight ? 'rgba(255,255,255,0.75)' : C.dim, lineHeight: 1.45 }}>{item}</span>
              </div>
            ))}
          </>
        ) : (
          <>
            <div style={{ fontSize: 11, color: plan.highlight ? 'rgba(255,255,255,0.5)' : C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
              Included
            </div>
            {plan.included.slice(0, 6).map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 9, marginBottom: 9, alignItems: 'flex-start' }}>
                <span style={{ color: plan.color, fontSize: 13, marginTop: 2, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 13.5, color: plan.highlight ? 'rgba(255,255,255,0.75)' : C.dim, lineHeight: 1.45 }}>{item}</span>
              </div>
            ))}
            {plan.included.length > 6 && (
              <div style={{ fontSize: 12.5, color: plan.highlight ? 'rgba(255,255,255,0.5)' : C.muted, marginTop: 4, paddingLeft: 22 }}>
                +{plan.included.length - 6} more included — see full details →
              </div>
            )}
          </>
        )}
        <div style={{ fontSize: 12.5, color: plan.color, marginTop: 10, fontWeight: 500 }}>
          + {plan.addons.length} optional add-ons available →
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={() => onSelect(plan)}
        style={{
          background: plan.highlight
            ? `linear-gradient(135deg, ${plan.color}, ${plan.color}BB)`
            : plan.colorLight,
          color: plan.highlight ? '#fff' : plan.color,
          border: plan.highlight ? 'none' : `1px solid ${plan.color}50`,
          borderRadius: 13, padding: '15px 20px',
          fontSize: 15, fontWeight: 700, cursor: 'pointer',
          width: '100%', transition: 'all .2s',
          fontFamily: 'inherit', letterSpacing: '0.01em',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = plan.color;
          e.currentTarget.style.color = '#fff';
          e.currentTarget.style.border = 'none';
        }}
        onMouseLeave={(e) => {
          if (plan.highlight) {
            e.currentTarget.style.background = `linear-gradient(135deg, ${plan.color}, ${plan.color}BB)`;
            e.currentTarget.style.color = '#fff';
          } else {
            e.currentTarget.style.background = plan.colorLight;
            e.currentTarget.style.color = plan.color;
            e.currentTarget.style.border = `1px solid ${plan.color}50`;
          }
        }}
      >
        {capacity && !capacity.available ? `Join Waiting List — ${plan.name}` : `Choose ${plan.name} →`}
      </button>
    </motion.div>
  );
}

// ─── Plan Decider Quiz ────────────────────────────────────
// Each question maps to a real feature difference between Small and Pro.
// smallAddon = what it costs as an addon on Small (null = not available in Small at all)
// inPro      = included in Pro base price
const QUIZ = [
  {
    id: 'payment',
    question: 'Do you need customers to pay you directly on your website?',
    hint: 'UPI, cards, Razorpay — for booking fees, course fees, product purchases',
    feature: 'Payment Gateway',
    smallAddon: 2000,
    inPro: true,
  },
  {
    id: 'blog',
    question: 'Will you publish blog posts, articles or updates regularly?',
    hint: 'e.g. health tips, recipes, client stories, behind-the-scenes posts',
    feature: 'Blog Setup',
    smallAddon: 1200,
    inPro: true,
  },
  {
    id: 'gmaps',
    question: 'Do you want to show up on Google Maps and local search?',
    hint: 'Google Business Profile — so nearby customers can find and call you',
    feature: 'Google Business Profile',
    smallAddon: 800,
    inPro: true,
  },
  {
    id: 'gallery',
    question: 'Do you have a gallery or portfolio of work to showcase?',
    hint: 'e.g. makeovers, interior shots, food photos, project case studies',
    feature: 'Portfolio / Gallery Page',
    smallAddon: 600,
    inPro: true,
  },
  {
    id: 'speed',
    question: 'Is ranking high on Google and fast loading critical for you?',
    hint: 'PageSpeed 90+ score + schema markup — helps you appear higher in search results',
    feature: 'Advanced Speed & SEO',
    smallAddon: 700,    // speed optimization addon on Small
    inPro: true,
  },
];

function PlanDecider({ onSelectPlan, plans }) {
  const [answers, setAnswers] = useState({});
  const [open,    setOpen]    = useState(false);

  const answered = Object.keys(answers).length;
  const done     = answered === QUIZ.length;

  // Features the user said Yes to
  const needed = done ? QUIZ.filter(q => answers[q.id] === true) : [];

  // Cost of Small + addons for needed features
  const SMALL_BASE = 12000;
  const addonTotal = needed.reduce((sum, q) => sum + (q.smallAddon ?? 0), 0);
  const smallTotal = SMALL_BASE + addonTotal;

  // Any needed feature that Small can't offer at all?
  const hasGap = needed.some(q => q.smallAddon === null);

  // Recommend Pro if: a needed feature isn't in Small,
  // OR adding all needed addons brings Small within ₹6,000 of Pro (not worth it)
  const PRO_PRICE = 22000;
  const recommend = done
    ? (hasGap || smallTotal >= PRO_PRICE - 6000) ? 'pro' : 'starter'
    : null;

  const recommended = recommend ? (plans || PLANS).find(p => p.id === recommend) : null;
  const reset = () => setAnswers({});

  // Build the result explanation
  const buildExplanation = () => {
    if (!done || !recommended) return null;
    if (needed.length === 0) {
      return (
        <>You don't need any of the advanced features — <strong style={{ color: C.text }}>Small Website covers everything</strong> your business needs right now. Save ₹10,000 and upgrade anytime if you grow.</>
      );
    }
    if (recommend === 'pro') {
      const gapFeatures = needed.filter(q => q.smallAddon === null);
      const expensiveFeatures = needed.filter(q => q.smallAddon !== null);
      return (
        <>
          {gapFeatures.length > 0 && (
            <><strong style={{ color: C.text }}>{gapFeatures.map(q => q.feature).join(', ')}</strong> {gapFeatures.length > 1 ? 'are' : 'is'} not available on Small at all — {gapFeatures.length > 1 ? 'they\'re' : 'it\'s'} only in Pro.{' '}</>
          )}
          {expensiveFeatures.length > 0 && (
            <>Adding <strong style={{ color: C.text }}>{expensiveFeatures.map(q => q.feature).join(' + ')}</strong> as addons on Small would cost ₹{fmt(addonTotal)} extra, bringing your total to <strong style={{ color: '#F87171' }}>₹{fmt(smallTotal)}</strong> — only ₹{fmt(PRO_PRICE - smallTotal)} less than Pro, which includes all of this and more.</>
          )}
          {expensiveFeatures.length === 0 && <> Pro includes all of these out of the box — no add-ons, no surprises.</>}
        </>
      );
    }
    // Small with addons is clearly cheaper
    return (
      <>You need <strong style={{ color: C.text }}>{needed.map(q => q.feature).join(' + ')}</strong>. These are available as add-ons on Small for <strong style={{ color: C.green }}>+₹{fmt(addonTotal)}</strong>, bringing your total to <strong style={{ color: C.green }}>₹{fmt(smallTotal)}</strong> — saving you <strong style={{ color: C.green }}>₹{fmt(PRO_PRICE - smallTotal)}</strong> compared to Pro while getting exactly what you need.</>
    );
  };

  const QuizContent = () => (
    <>
      {/* Questions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {QUIZ.map((q, i) => {
          const ans = answers[q.id];
          const isAnswered = ans !== undefined;
          return (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              style={{
                background: isAnswered ? (ans ? 'rgba(14,165,233,0.07)' : C.bg) : C.bg,
                border: `1px solid ${isAnswered && ans ? C.accent + '45' : C.border}`,
                borderRadius: 12, padding: '14px 18px', transition: 'all .2s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 3 }}>
                    <span style={{ color: C.muted, marginRight: 8, fontSize: 12 }}>{i + 1}.</span>{q.question}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: C.muted }}>{q.hint}</span>
                    {q.smallAddon !== null
                      ? <span style={{ fontSize: 11, background: C.surface2, color: C.muted, borderRadius: 6, padding: '2px 7px' }}>+₹{fmt(q.smallAddon)} addon on Small</span>
                      : <span style={{ fontSize: 11, background: 'rgba(236,72,153,0.12)', color: '#EC4899', borderRadius: 6, padding: '2px 7px' }}>Pro only</span>
                    }
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {[true, false].map(val => (
                    <button
                      key={String(val)}
                      onClick={() => setAnswers(prev => ({ ...prev, [q.id]: val }))}
                      style={{
                        padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                        cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
                        background: ans === val ? (val ? C.accent : C.surface2) : 'transparent',
                        color: ans === val ? '#fff' : C.muted,
                        border: ans === val ? 'none' : `1px solid ${C.border}`,
                      }}
                    >
                      {val ? 'Yes' : 'No'}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: C.bg, borderRadius: 2, marginBottom: 20, overflow: 'hidden' }}>
        <motion.div
          animate={{ width: `${(answered / QUIZ.length) * 100}%` }}
          transition={{ duration: 0.3 }}
          style={{ height: '100%', background: `linear-gradient(90deg, ${C.accent}, #EC4899)`, borderRadius: 2 }}
        />
      </div>

      {/* Result */}
      <AnimatePresence>
        {done && recommended && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{
              background: `${recommended.color}10`,
              border: `1.5px solid ${recommended.color}50`,
              borderRadius: 14, padding: '22px 24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <div>{PLAN_ICONS[recommended.id]?.(recommended.color)}</div>
              <div>
                <div style={{ fontSize: 12, color: recommended.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                  Our recommendation
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: C.text }}>
                  {recommended.name} — ₹{fmt(recommended.price)}
                  {recommend === 'starter' && needed.length > 0 && (
                    <span style={{ fontSize: 14, fontWeight: 600, color: C.muted, marginLeft: 10 }}>
                      + ₹{fmt(addonTotal)} addons = ₹{fmt(smallTotal)} total
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.75, marginBottom: 18 }}>
              {buildExplanation()}
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={() => { onSelectPlan(recommended); setOpen(false); }}
                style={{
                  background: `linear-gradient(135deg, ${recommended.color}, ${recommended.color}CC)`,
                  color: '#fff', border: 'none', borderRadius: 10,
                  padding: '13px 24px', fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Get started with {recommended.name} →
              </button>
              <button
                onClick={reset}
                style={{
                  background: 'transparent', color: C.muted,
                  border: `1px solid ${C.border}`, borderRadius: 10,
                  padding: '13px 20px', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Retake quiz
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  return (
    <>
      {/* Trigger button — renders inline where placed */}
      <button
        onClick={() => setOpen(true)}
        style={{
          background: C.surface, border: `1px dashed ${C.border}`,
          color: C.muted, borderRadius: 20, padding: '8px 18px',
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
          fontFamily: 'inherit', transition: 'all .2s',
          display: 'inline-flex', alignItems: 'center', gap: 7,
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.text; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
      >
        🤔 Not sure? Take the quiz
      </button>

      {/* Overlay modal */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setOpen(false); reset(); }}
              style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.75)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                zIndex: 999,
              }}
            />

            {/* Modal panel — centering via flex wrapper, not transform */}
            <div style={{
              position: 'fixed', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1000, pointerEvents: 'none',
              padding: '24px',
            }}>
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 22,
                padding: '32px',
                width: 'min(740px, 92vw)',
                maxHeight: '88vh',
                overflowY: 'auto',
                pointerEvents: 'all',
                boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
              }}
            >
              {/* Modal header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 4 }}>Help me choose the right plan</div>
                  <div style={{ fontSize: 13, color: C.muted }}>Answer based on your actual business — we'll do the cost math for you.</div>
                </div>
                <button
                  onClick={() => { setOpen(false); reset(); }}
                  style={{ background: C.surface2, border: 'none', color: C.muted, fontSize: 16, cursor: 'pointer', lineHeight: 1, padding: '6px 10px', borderRadius: 8, fontFamily: 'inherit' }}
                >
                  ✕
                </button>
              </div>

              <QuizContent />
            </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Coin Flip Hero ────────────────────────────────────────
function AvatarSVG() {
  return (
    <svg width="220" height="240" viewBox="0 0 220 240" fill="none">
      <defs>
        <radialGradient id="avatarBg" cx="50%" cy="60%">
          <stop offset="0%" stopColor="#0f2a4a"/>
          <stop offset="100%" stopColor="#071525"/>
        </radialGradient>
      </defs>
      <circle cx="110" cy="140" r="100" fill="url(#avatarBg)"/>
      {/* Body */}
      <ellipse cx="110" cy="200" rx="62" ry="46" fill="#0D2B4A"/>
      {/* Shirt */}
      <path d="M80 168 Q110 182 140 168 L148 198 Q110 210 72 198Z" fill="#0EA5E9" opacity="0.9"/>
      {/* Head */}
      <circle cx="110" cy="108" r="50" fill="#F4C08A"/>
      {/* Hair */}
      <path d="M63 98 Q66 60 110 56 Q154 60 157 98 Q148 68 110 65 Q72 68 63 98Z" fill="#1A1A2E"/>
      <path d="M63 98 Q60 110 64 118 Q68 106 70 98Z" fill="#1A1A2E"/>
      <path d="M157 98 Q160 110 156 118 Q152 106 150 98Z" fill="#1A1A2E"/>
      {/* Eyes */}
      <ellipse cx="95" cy="108" rx="6" ry="6.5" fill="#1A1A2E"/>
      <ellipse cx="125" cy="108" rx="6" ry="6.5" fill="#1A1A2E"/>
      <circle cx="96.5" cy="106.5" r="2.2" fill="white"/>
      <circle cx="126.5" cy="106.5" r="2.2" fill="white"/>
      {/* Smile */}
      <path d="M95 126 Q110 140 125 126" stroke="#C87840" strokeWidth="2.8" strokeLinecap="round" fill="none"/>
      {/* Left arm */}
      <path d="M72 165 Q56 178 50 195" stroke="#F4C08A" strokeWidth="15" strokeLinecap="round" fill="none"/>
      {/* Right waving arm */}
      <g style={{ transformOrigin: '148px 165px', animation: 'wave-hand 2.8s ease-in-out infinite' }}>
        <path d="M148 165 Q168 148 174 130" stroke="#F4C08A" strokeWidth="15" strokeLinecap="round" fill="none"/>
        <ellipse cx="176" cy="124" rx="11" ry="10" fill="#F4C08A"/>
        <path d="M168 115 L165 103" stroke="#F4C08A" strokeWidth="5.5" strokeLinecap="round"/>
        <path d="M177 113 L175 100" stroke="#F4C08A" strokeWidth="5.5" strokeLinecap="round"/>
        <path d="M185 116 L185 103" stroke="#F4C08A" strokeWidth="5.5" strokeLinecap="round"/>
        <path d="M191 122 L193 111" stroke="#F4C08A" strokeWidth="5" strokeLinecap="round"/>
      </g>
    </svg>
  );
}

function CoinFlip() {
  const [flipped, setFlipped] = useState(false);
  useEffect(() => {
    const t  = setTimeout(() => setFlipped(true), 2800);
    const iv = setInterval(() => setFlipped(f => !f), 4200);
    return () => { clearTimeout(t); clearInterval(iv); };
  }, []);

  const face = {
    position: 'absolute', width: '100%', height: '100%',
    backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
    borderRadius: '50%', overflow: 'hidden',
    border: '3px solid rgba(14,165,233,0.55)',
    boxShadow: '0 0 0 8px rgba(14,165,233,0.07), 0 24px 60px rgba(14,165,233,0.30)',
  };

  return (
    <div
      title="Click to flip"
      onClick={() => setFlipped(f => !f)}
      className="coin-flip-inner"
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: '100%', height: '100%', transformStyle: 'preserve-3d', position: 'relative' }}
      >
        {/* Front — Logo */}
        <div style={{ ...face, background: '#06091a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <img
            src="/hero_logo.png"
            alt="BespokeDeploy.in logo"
            style={{ width: '65%', height: '65%', objectFit: 'contain' }}
            onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling.style.display = 'flex'; }}
          />
          {/* Fallback wordmark */}
          <div style={{ display: 'none', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.03em' }}>
              <span style={{ color: '#0EA5E9' }}>D</span><span style={{ color: C.text }}>ev</span>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(14,165,233,0.65)', letterSpacing: '0.16em', textTransform: 'uppercase', marginTop: 4 }}>BespokeDeploy.in</div>
          </div>
          <div style={{ position: 'absolute', top: 0, bottom: 0, width: '35%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)', animation: 'coin-shine 5s ease-in-out infinite', pointerEvents: 'none' }} />
        </div>

        {/* Back — 3D Avatar photo */}
        <div style={{ ...face, transform: 'rotateY(180deg)', background: 'linear-gradient(160deg, #0f1e38 0%, #071020 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img
            src="/my_avatar.png"
            alt="Debarun avatar"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
            onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling.style.display = 'flex'; }}
          />
          {/* Fallback — simple SVG until image is added */}
          <div style={{ display: 'none', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
            <AvatarSVG />
          </div>
          <div style={{ position: 'absolute', top: 0, bottom: 0, width: '35%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)', animation: 'coin-shine 5s ease-in-out infinite 2.5s', pointerEvents: 'none' }} />
        </div>
      </motion.div>
    </div>
  );
}

// ─── Section wrapper with scroll animation ─────────────────
function Section({ children, id }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.section
      id={id}
      ref={ref}
      variants={stagger()}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      className="section-root"
    >
      {children}
    </motion.section>
  );
}

// ─── Legal Modal ──────────────────────────────────────────
const LEGAL = {
  privacy: {
    title: 'Privacy Policy',
    effective: 'Effective Date: 2 August 2026',
    sections: [
      {
        heading: '1. Who We Are',
        body: `BespokeDeploy (bespokedeploy.in) is a sole-proprietorship web-development studio operated by Debarun Ghosh, based in India. We build custom websites for individuals and businesses on a one-time project basis.`,
      },
      {
        heading: '2. Information We Collect',
        body: `We collect only what is necessary to deliver your project, process payment, and communicate with you:\n\n• Contact details — name, email address, phone number, city\n• Project requirements — brief, design preferences, business information you share with us\n• Booking & waiting-list data — plan selected, notes, and preferred contact timing, if you join our waiting list when project slots are full\n• Technical data — IP address, browser type, device type, and pages visited (collected automatically via Google Analytics for website performance purposes)\n• Payment information — we do not collect or store card numbers, UPI IDs, or banking credentials. All payment transactions are processed directly by Razorpay (a PCI-DSS-compliant payment gateway). We only receive a transaction reference ID to confirm payment status.`,
      },
      {
        heading: '3. How We Use Your Information',
        body: `Your information is used solely to:\n• Deliver the agreed website project\n• Communicate project updates, clarifications, and delivery timelines\n• Process payments via Razorpay\n• Manage our project capacity and waiting list, and notify you when a slot opens\n• Analyse website traffic in aggregate (via Google Analytics) to improve our service\n\nWe do not use your data for advertising, profiling, or marketing without explicit consent, and we do not sell your data under any circumstances.`,
      },
      {
        heading: '4. Data Sharing',
        body: `We do not sell, rent, or trade your personal data. Data is shared only with the following service providers, strictly to operate this business:\n\n• Razorpay — for payment processing (governed by Razorpay's own Privacy Policy)\n• Resend — for transactional emails (booking confirmations, status updates, receipts)\n• Google Analytics — for anonymised traffic analytics\n• Cloudflare — for hosting, database infrastructure, and security (this website and your project, if hosted with us)\n• Netlify — as an alternative hosting provider for certain project plans\n\nAll third-party services operate under their own privacy and security frameworks, are industry-standard, reputable providers, and may process or store data on servers located outside India. We select providers that maintain appropriate technical and organisational safeguards, but we do not control and are not responsible for their independent security practices — please refer to each provider's own privacy policy for details.`,
      },
      {
        heading: '5. Data Retention',
        body: `We retain project-related communications and files for a period of 12 months after project delivery, after which they may be deleted. Waiting-list entries that do not convert into a booking may be retained for up to 12 months to manage future capacity. Payment records and transaction references are retained as required by applicable Indian tax and accounting laws (currently up to 8 years).`,
      },
      {
        heading: '6. Your Rights',
        body: `You may request access to, correction of, or deletion of personal data we hold about you by emailing debarun.ghosh.2024@gmail.com. We will respond within 30 days. Note that some data (e.g. payment/transaction records) may need to be retained regardless of a deletion request, where required by law.`,
      },
      {
        heading: '7. Cookies',
        body: `This website uses Google Analytics cookies to understand visitor behaviour in aggregate. No personally identifiable information is tied to these cookies. You may disable cookies in your browser settings at any time.`,
      },
      {
        heading: '8. Children’s Privacy',
        body: `Our services are intended for individuals aged 18 and above, or businesses engaging us through an authorised adult representative. We do not knowingly collect personal data from children under 18. If you believe a child has provided us with personal data, contact us and we will delete it.`,
      },
      {
        heading: '9. Security & Limitation of Liability',
        body: `We take reasonable technical measures to protect the data we hold, and rely on the security infrastructure of PCI-DSS-compliant and industry-standard providers listed above. However, no method of electronic storage or transmission is 100% secure. To the maximum extent permitted by law, BespokeDeploy is not liable for unauthorised access, data breaches, or losses arising from circumstances beyond our reasonable control, including failures or breaches at third-party service providers.`,
      },
      {
        heading: '10. Changes to This Policy',
        body: `We may update this policy periodically. The effective date at the top of this page will reflect the latest revision. Continued use of our website after any change constitutes acceptance of the updated policy.`,
      },
      {
        heading: '11. Contact',
        body: `For privacy-related queries: debarun.ghosh.2024@gmail.com`,
      },
    ],
  },
  tnc: {
    title: 'Terms & Conditions',
    effective: 'Effective Date: 2 August 2026',
    sections: [
      {
        heading: '1. Acceptance of Terms',
        body: `By placing an order, making an advance payment, joining our waiting list, or engaging BespokeDeploy (bespokedeploy.in) for any web-development service, you ("the Client") agree to be bound by these Terms & Conditions in full. If you do not agree, do not proceed with any booking or payment.`,
      },
      {
        heading: '2. Services',
        body: `BespokeDeploy provides custom website design and development services as described in the selected plan (Portfolio, Small Website, or Pro Website). The scope of work is limited to what is agreed in writing (via email or the booking form) prior to commencement.\n\n• Any additional features, pages, or changes requested outside the originally agreed scope will be quoted and billed separately, and work on them will not begin until agreed and, where applicable, paid for.\n• Verbal discussions (calls, WhatsApp voice notes) are for convenience only and are not binding on their own — any change to scope, price, or timeline is valid only once confirmed in writing (email, or written message with an explicit acknowledgement from BespokeDeploy).\n• Delivery timelines shown at booking (e.g. "3–5 working days") are estimates, not guarantees, and are calculated from the point the Client has supplied all required content and feedback. Delays caused by the Client (late content, late feedback, unavailability) extend the timeline accordingly and are not a breach by BespokeDeploy.`,
      },
      {
        heading: '3. Payments',
        body: `All prices are quoted in Indian Rupees (INR) inclusive of applicable taxes unless stated otherwise.\n\n• An advance payment (20%–30% of total project value) is required to reserve a project slot and begin work. This advance is consideration for reserving that slot and commencing work — not merely a booking fee — and its treatment on cancellation is governed by Section 4 below.\n• The remaining balance is due before the final deliverable, source files, or hosting credentials are handed over. BespokeDeploy is entitled to withhold delivery, staging access, and source files until the full balance is received.\n• Payments are processed via Razorpay. BespokeDeploy does not store your payment credentials. All transactions are subject to Razorpay's Terms of Service.\n• Late payment of the balance (beyond 15 days from the final-payment request) may attract a delay fee of 2% per month on the outstanding amount, and may result in the project being paused or the completed work being taken offline until payment is received.`,
      },
      {
        heading: '4. Refunds & Cancellation',
        body: `• Advance-stage cancellations: if the Client cancels before final payment has been made (i.e. only the advance has been paid), BespokeDeploy will refund the advance payment in full to the Client's original payment method within 3 business days of the cancellation being confirmed.\n• This advance-stage refund does not apply where the Client has been unresponsive for 14 or more consecutive days and the project is treated as abandoned under Section 8 — in that case the advance is forfeited.\n• Once final payment has been made and/or the final deliverable has been handed over or the project marked complete, payments are non-refundable by default. BespokeDeploy may, at its sole and absolute discretion, agree to refund all or part of a post-final-payment amount — for example by mutual agreement — but this is not an entitlement of the Client. Any such discretionary refund will be net of payment gateway fees and the value of work already completed, confirmed in writing, and processed within 7–14 business days of that written agreement.\n• In the event BespokeDeploy is unable to complete the agreed work for reasons within its control, an amount proportional to the uncompleted portion will be refunded within 3 business days.\n• By making any payment, the Client acknowledges and accepts this policy.`,
      },
      {
        heading: '5. Payment Disputes & Chargebacks',
        body: `If the Client initiates a chargeback, payment dispute, or reversal through their bank, card network, or Razorpay for any payment where services were rendered, in progress, or a slot was reserved, this is treated as a material breach of these Terms.\n\n• The Client agrees to first raise any billing concern directly with BespokeDeploy in writing, and allow 14 days for it to be resolved, before initiating a chargeback or dispute.\n• Where a chargeback is filed without prior notice, BespokeDeploy reserves the right to immediately suspend or take down any hosted deliverable, revoke access, and pursue the disputed amount plus any bank or gateway penalty fees incurred as a result.\n• An unresolved or bad-faith chargeback may result in the Client being refused future services.`,
      },
      {
        heading: '6. Revisions & Review Phases',
        body: `Each project includes two (2) free revision rounds, to be requested within 7 days of each delivery milestone.\n\n• Revision requests must be clearly documented in writing (email or written brief).\n• Revisions are limited to adjustments within the original agreed scope; new features or redesigns are out of scope and will be quoted separately.\n• Revision requests raised after the 7-day window, or beyond the two free rounds, will be billed at ₹500–₹1,500 per hour depending on complexity.\n• BespokeDeploy shall not be liable for any issues, errors, or deficiencies identified after the free revision phases have been exhausted or expired.`,
      },
      {
        heading: '7. Ownership & Handover',
        body: `Full ownership of the delivered website code, design assets, and content created as part of the project transfers to the Client only upon receipt of full and final payment. Until full payment is received, all work product (including any preview, staging link, or draft) remains the sole property of BespokeDeploy, is licensed to the Client for review purposes only, and may not be copied, redeployed, or used commercially.\n\n• BespokeDeploy retains the right to display the completed project in its portfolio unless the Client explicitly requests otherwise in writing before project commencement.\n• Third-party assets (stock images, fonts, plugins) remain subject to their respective licence terms; the Client is responsible for ensuring ongoing compliance with those licences.\n• Hosting accounts, domain names, and third-party service subscriptions initiated by the Client remain the Client's sole responsibility after handover.`,
      },
      {
        heading: '8. Client Responsiveness & Project Abandonment',
        body: `Timely delivery depends on the Client's participation. If the Client does not respond to a request for content, feedback, or approval for 14 consecutive days, BespokeDeploy may treat the project as paused; if unresponsive for 30 consecutive days, BespokeDeploy may treat the project as abandoned by the Client.\n\n• Where a project is treated as abandoned, the advance payment is forfeited under Section 4, and the reserved project slot is released for other work.\n• The Client may request to resume an abandoned project subject to a new timeline, current pricing, and slot availability.`,
      },
      {
        heading: '9. Limitation of Liability',
        body: `The website is delivered "as is" upon handover. BespokeDeploy makes no guarantee of specific business outcomes (e.g. search rankings, traffic, leads, or sales) resulting from the website.\n\nAfter the project is handed over and/or the free revision phases are complete, BespokeDeploy shall not be held liable for:\n\n• Loss, corruption, or compromise of website files, databases, or data\n• Downtime, service interruptions, or security breaches on third-party hosting or payment platforms\n• Any inaccuracies, outdated information, or errors in content provided by the Client\n• Loss of business, revenue, profit, or opportunities arising from website unavailability, errors, or third-party service changes\n• Changes made to the website by the Client or any third party after handover\n• Incompatibility with future updates to third-party plugins, APIs, or platforms, unless covered by a separately purchased maintenance agreement\n\nBespokeDeploy's total liability under any and all circumstances, whether in contract, tort, or otherwise, shall not exceed the total amount actually paid by the Client for the specific project in question.`,
      },
      {
        heading: '10. Client Responsibilities',
        body: `The Client is responsible for:\n• Providing accurate, complete, and timely content (text, images, logos, brand guidelines)\n• Ensuring they have the legal right to use any content supplied to BespokeDeploy\n• Reviewing and approving deliverables within the stipulated revision windows\n• Maintaining hosting accounts, domain renewals, and third-party subscriptions post-handover`,
      },
      {
        heading: '11. Intellectual Property — Content Supplied by Client',
        body: `The Client warrants that all content, images, trademarks, and materials provided to BespokeDeploy are owned by or properly licensed to the Client, and that their use does not infringe any third-party rights. The Client indemnifies and holds BespokeDeploy harmless against any claim, loss, or cost (including legal fees) arising from such content or from the Client's use of the completed website after handover.`,
      },
      {
        heading: '12. Force Majeure',
        body: `BespokeDeploy shall not be liable for any delay or failure to perform resulting from causes beyond its reasonable control, including but not limited to internet or power outages, third-party service or API outages (hosting, payment gateway, email delivery), illness, or other unforeseeable events. Affected timelines will be extended by a reasonable period.`,
      },
      {
        heading: '13. Independent Contractor',
        body: `BespokeDeploy is engaged as an independent contractor. Nothing in these Terms creates an employment, partnership, joint venture, or agency relationship between BespokeDeploy and the Client.`,
      },
      {
        heading: '14. Confidentiality',
        body: `Both parties agree to keep confidential any non-public business information shared during the project, and to use it solely for the purpose of completing the engagement. This does not restrict BespokeDeploy's right to display the completed, publicly-live website in its portfolio under Section 7.`,
      },
      {
        heading: '15. Governing Law & Dispute Resolution',
        body: `These Terms are governed by the laws of India.\n\n• In the event of a dispute, both parties agree to first attempt to resolve it through good-faith written negotiation for a period of 14 days.\n• If unresolved, the dispute shall be referred to and finally resolved by arbitration under the Arbitration and Conciliation Act, 1996, with a sole arbitrator, seated in Bengaluru, Karnataka, India, with proceedings conducted in English.\n• Subject to the above, the courts of Bengaluru, Karnataka, India shall have exclusive jurisdiction.`,
      },
      {
        heading: '16. Changes to These Terms',
        body: `BespokeDeploy reserves the right to update these Terms at any time. The effective date will be updated accordingly. Continued use of our services constitutes acceptance of the revised Terms.`,
      },
      {
        heading: '17. Contact',
        body: `For any queries regarding these Terms: debarun.ghosh.2024@gmail.com`,
      },
    ],
  },
};

function LegalModal({ doc, onClose, isDark }) {
  const content = LEGAL[doc];
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 2000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', overflowY: 'auto' }}
    >
      <motion.div
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background: isDark ? '#0D0D1A' : '#ffffff',
          border: `1px solid ${isDark ? '#1E1E40' : '#CBD5E1'}`,
          borderRadius: 20, padding: '40px 48px', maxWidth: 780, width: '100%',
          boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: isDark ? '#F1F0FF' : '#0F172A', marginBottom: 4 }}>{content.title}</div>
            <div style={{ fontSize: 12, color: isDark ? '#6B7280' : '#64748B' }}>{content.effective}</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: `1px solid ${isDark ? '#1E1E40' : '#CBD5E1'}`, borderRadius: 10, width: 36, height: 36, cursor: 'pointer', fontSize: 18, color: isDark ? '#9CA3AF' : '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 16 }}
          >×</button>
        </div>
        {/* Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {content.sections.map((s) => (
            <div key={s.heading}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0EA5E9', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.heading}</div>
              <div style={{ fontSize: 14, color: isDark ? '#9CA3AF' : '#475569', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{s.body}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 40, paddingTop: 24, borderTop: `1px solid ${isDark ? '#1E1E40' : '#CBD5E1'}`, textAlign: 'center', fontSize: 12, color: isDark ? '#6B7280' : '#94A3B8' }}>
          © 2026 BespokeDeploy · bespokedeploy.in · debarun.ghosh.2024@gmail.com
        </div>
      </motion.div>
    </div>
  );
}

// ─── Capacity banner ────────────────────────────────────────
function CapacityBanner({ capacity }) {
  if (!capacity) return null;
  if (capacity.available) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 20, padding: '6px 14px', fontSize: 12.5, color: '#10B981', fontWeight: 600, marginBottom: 18 }}>
        ✅ {capacity.slotsAvailable} of {capacity.maxSlots} project slot{capacity.maxSlots !== 1 ? 's' : ''} open right now
      </div>
    );
  }
  const nextDate = capacity.nextFreeAt
    ? new Date(capacity.nextFreeAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : null;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 20, padding: '6px 14px', fontSize: 12.5, color: '#F59E0B', fontWeight: 600, marginBottom: 18 }}>
      ⏳ Fully booked right now{nextDate ? ` — next opening ~${nextDate}` : ''}. Join the waiting list below.
    </div>
  );
}

// ─── Waitlist modal ───────────────────────────────────────
function WaitlistModal({ plan, maxSlots, urgentAvailable, reason = 'capacity', onClose }) {
  const [form, setForm]       = useState({ name: '', email: '', phone: '', city: '', notes: '', urgent: false });
  const [status, setStatus]   = useState('idle'); // idle | submitting | done | error
  const [errorMsg, setErrorMsg] = useState('');
  const isUnavailable = reason === 'unavailable';

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setErrorMsg('Please fill in your name, email and phone.');
      return;
    }
    setStatus('submitting');
    setErrorMsg('');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: plan.id,
          customer_name: form.name,
          customer_email: form.email,
          customer_phone: form.phone,
          customer_city: form.city,
          notes: form.notes,
          is_urgent: isUnavailable ? false : form.urgent,
          reason,
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

  const inputSt = {
    background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10,
    padding: '10px 13px', color: C.text, fontSize: 14, outline: 'none',
    width: '100%', fontFamily: 'inherit', boxSizing: 'border-box',
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: '28px 26px', width: '100%', maxWidth: 420, maxHeight: '90vh', overflowY: 'auto' }}
      >
        {status === 'done' ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 8 }}>You're on the list!</div>
            <p style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.6, marginBottom: 20 }}>
              {isUnavailable
                ? `I'll email you the moment the ${plan.name} package is available again.`
                : `I'll email you the moment a ${plan.name} slot opens up, with a link to pay your advance and lock it in.`}
            </p>
            <button onClick={onClose} style={{ background: plan.color, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Got it
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div style={{ fontSize: 12, color: plan.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              {isUnavailable ? 'Notify Me' : 'Join Waiting List'}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 6 }}>
              {plan.name} — {isUnavailable ? 'currently unavailable' : 'fully booked'}
            </div>
            <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 20 }}>
              {isUnavailable
                ? `This package is paused for now. Leave your details and I'll reach out personally the moment it reopens.`
                : `I only take on ${maxSlots || 2} project${(maxSlots || 2) !== 1 ? 's' : ''} at a time so each one gets full attention. Leave your details and I'll notify you the moment a slot opens.`}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input style={inputSt} placeholder="Your full name" value={form.name} onChange={set('name')} required />
              <input style={inputSt} type="email" placeholder="you@email.com" value={form.email} onChange={set('email')} required />
              <input style={inputSt} type="tel" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={set('phone')} required />
              <input style={inputSt} placeholder="City (optional)" value={form.city} onChange={set('city')} />
              <input style={inputSt} placeholder="Anything to add? (optional)" value={form.notes} onChange={set('notes')} />
              {!isUnavailable && (
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12.5, color: urgentAvailable ? C.dim : C.muted, cursor: urgentAvailable ? 'pointer' : 'not-allowed', lineHeight: 1.5 }}>
                  <input
                    type="checkbox" checked={form.urgent} disabled={!urgentAvailable}
                    onChange={(e) => setForm((p) => ({ ...p, urgent: e.target.checked }))}
                    style={{ marginTop: 2 }}
                  />
                  <span>
                    Mark as urgent
                    {!urgentAvailable && <span style={{ color: C.muted }}> — this week's urgent request is already taken</span>}
                    {urgentAvailable && <span style={{ color: C.muted }}> — only 1 urgent request allowed per week, gets priority when a slot opens</span>}
                  </span>
                </label>
              )}
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
                style={{ flex: 1, background: plan.color, color: '#fff', border: 'none', borderRadius: 10, padding: '11px 18px', fontSize: 14, fontWeight: 700, cursor: status === 'submitting' ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: status === 'submitting' ? 0.6 : 1 }}
              >
                {status === 'submitting' ? 'Submitting…' : (isUnavailable ? 'Notify Me' : 'Join Waiting List')}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}

// ─── Disabled plan placeholder ──────────────────────────────
// Renders in a plan's grid slot when the admin has turned it off, instead of
// just leaving a gap — keeps the 3-column layout intact and still captures
// interest via the same waitlist pipeline.
function DisabledPlanCard({ plan, onNotify }) {
  return (
    <div style={{
      background: C.surface, border: `1px dashed ${C.border}`, borderRadius: 22,
      padding: '32px 28px', display: 'flex', flexDirection: 'column',
      opacity: 0.72,
    }}>
      <div style={{ marginBottom: 14, filter: 'grayscale(1)', opacity: 0.6 }}>{PLAN_ICONS[plan.id]?.(C.muted)}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: C.muted, marginBottom: 4 }}>{plan.name}</div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 22, lineHeight: 1.55 }}>{plan.tagline}</div>

      <div style={{ marginBottom: 26 }}>
        <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>One-time price</div>
        <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-0.02em', color: C.muted }}>₹{fmt(plan.price)}</div>
      </div>

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', gap: 8, padding: '20px 10px', marginBottom: 26,
        background: C.bg, borderRadius: 14, border: `1px solid ${C.border}`,
      }}>
        <div>{PAUSE_ICON(C.muted, 34)}</div>
        <div style={{ fontSize: 13.5, color: C.dim, fontWeight: 600 }}>This package isn't available right now</div>
        <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.5 }}>Try one of the other plans, or let me know you're interested — I'll reach out when it reopens.</div>
      </div>

      <button
        onClick={() => onNotify(plan)}
        style={{
          background: 'transparent', color: C.dim, border: `1px solid ${C.border}`,
          borderRadius: 13, padding: '15px 20px', fontSize: 15, fontWeight: 700,
          cursor: 'pointer', width: '100%', fontFamily: 'inherit',
        }}
      >
        Notify Me When Available
      </button>
    </div>
  );
}

// ─── All plans unavailable — fallback interest form ─────────
// Shown instead of the whole plans grid when every plan has been disabled.
function AllUnavailableForm({ plans }) {
  const [planId, setPlanId] = useState(plans[0]?.id || '');
  const [form, setForm]     = useState({ name: '', email: '', phone: '', city: '', notes: '' });
  const [status, setStatus] = useState('idle'); // idle | submitting | done | error
  const [errorMsg, setErrorMsg] = useState('');

  const selected = plans.find(p => p.id === planId) || plans[0];
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const inputSt = {
    background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10,
    padding: '11px 14px', color: C.text, fontSize: 14, outline: 'none',
    width: '100%', fontFamily: 'inherit', boxSizing: 'border-box',
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setErrorMsg('Please fill in your name, email and phone.');
      return;
    }
    setStatus('submitting');
    setErrorMsg('');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: selected.id,
          customer_name: form.name,
          customer_email: form.email,
          customer_phone: form.phone,
          customer_city: form.city,
          notes: form.notes,
          reason: 'unavailable',
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

  if (status === 'done') {
    return (
      <div style={{ textAlign: 'center', maxWidth: 480, margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ fontSize: 44, marginBottom: 16 }}>🎉</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 10 }}>You're on the list!</div>
        <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>
          I'll email you the moment the {selected.name} package is available again, and reach out personally.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: 520, margin: '0 auto', background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 22, padding: '40px 36px',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>{PAUSE_ICON(C.accent, 50)}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 8 }}>All packages are paused right now</div>
        <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>
          I'm not taking on new bookings at the moment. Tell me which package you're interested in and leave your details — I'll reach out personally when it reopens.
        </p>
      </div>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, color: C.muted, fontWeight: 600, display: 'block', marginBottom: 7 }}>Which package?</label>
          <select value={planId} onChange={e => setPlanId(e.target.value)} style={{ ...inputSt, cursor: 'pointer', appearance: 'none' }}>
            {plans.map(p => <option key={p.id} value={p.id}>{p.name} — ₹{fmt(p.price)}</option>)}
          </select>
        </div>
        <input style={inputSt} placeholder="Your full name" value={form.name} onChange={set('name')} required />
        <input style={inputSt} type="email" placeholder="you@email.com" value={form.email} onChange={set('email')} required />
        <input style={inputSt} type="tel" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={set('phone')} required />
        <input style={inputSt} placeholder="City (optional)" value={form.city} onChange={set('city')} />
        <input style={inputSt} placeholder="Anything to add? (optional)" value={form.notes} onChange={set('notes')} />
        {errorMsg && <div style={{ fontSize: 12.5, color: C.red }}>{errorMsg}</div>}
        <button
          type="submit" disabled={status === 'submitting'}
          style={{
            background: C.accent, color: '#fff', border: 'none', borderRadius: 12,
            padding: '14px 20px', fontSize: 15, fontWeight: 700, marginTop: 6,
            cursor: status === 'submitting' ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            opacity: status === 'submitting' ? 0.6 : 1,
          }}
        >
          {status === 'submitting' ? 'Submitting…' : 'Notify Me When Available'}
        </button>
      </form>
    </div>
  );
}

// ─── Landing ──────────────────────────────────────────────
export default function Landing({ onSelectPlan, siteSettings, inviteInfo }) {
  // Merge admin-controlled prices/enabled flags into static plan definitions
  // Keep ALL plans (including admin-disabled ones) so we can render a
  // placeholder in their grid slot instead of just hiding them.
  const allPlans = PLANS.map(plan => {
    const ov = siteSettings?.plans?.[plan.id];
    if (!ov) return plan;
    // Merge addon prices too
    const addons = plan.addons.map(a => {
      const aov = siteSettings?.addons?.[a.id];
      return aov ? { ...a, price: aov.price ?? a.price, enabled: aov.enabled ?? true } : a;
    }).filter(a => a.enabled !== false);
    return { ...plan, price: ov.price ?? plan.price, addons, _enabled: ov.enabled ?? true };
  });
  const effectivePlans = allPlans.filter(plan => plan._enabled !== false);
  const allPlansUnavailable = siteSettings != null && effectivePlans.length === 0;
  const [isDark, setIsDark] = useState(false);
  const [showDarkPrompt, setShowDarkPrompt] = useState(false);
  const [legalDoc, setLegalDoc] = useState(null); // 'privacy' | 'tnc' | null
  const [capacity, setCapacity] = useState(null);
  const [waitlistModal, setWaitlistModal] = useState(null); // { plan, reason } | null
  const [promos, setPromos] = useState([]);
  const [promoDismissed, setPromoDismissed] = useState(false);
  useEffect(() => {
    document.documentElement.dataset.theme = 'light';
    // Show dark mode prompt after 3s on first visit
    const timer = setTimeout(() => setShowDarkPrompt(true), 3000);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    fetch('/api/capacity').then(r => r.json()).then(setCapacity).catch(() => {});
  }, []);
  useEffect(() => {
    fetch('/api/promos').then(r => r.json()).then(d => setPromos(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  // A valid waitlist invite bypasses the capacity block for that customer.
  const hasBypass = inviteInfo?.valid === true;
  const handleChoosePlan = (plan) => {
    if (capacity && !capacity.available && !hasBypass) { setWaitlistModal({ plan, reason: 'capacity' }); return; }
    onSelectPlan(plan);
  };
  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    setShowDarkPrompt(false);
    document.documentElement.dataset.theme = next ? '' : 'light';
  };

  return (
    <div>
      <AnimatePresence>
        {promos.length > 0 && !promoDismissed && (
          <PromoBanner promos={promos} onDismiss={() => setPromoDismissed(true)} />
        )}
      </AnimatePresence>

      {/* ── HERO ── */}
      <div className="hero-root">
        {/* Animated background orbs */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.13) 0%, transparent 70%)', top: '-10%', left: '-5%', animation: 'floatA 12s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.10) 0%, transparent 70%)', top: '30%', right: '-10%', animation: 'floatB 14s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.09) 0%, transparent 70%)', bottom: '0%', left: '30%', animation: 'floatA 16s ease-in-out infinite reverse' }} />
          {/* Grid overlay */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${C.borderFaint} 1px, transparent 1px), linear-gradient(90deg, ${C.borderFaint} 1px, transparent 1px)`, backgroundSize: '60px 60px', opacity: 0.4 }} />
        </div>

        {/* Nav */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="nav-root"
        >
          <img
            src={isDark ? '/main_logo_dark.png' : '/main_logo_light.png'}
            alt="BespokeDeploy logo"
            className="nav-logo"
          />
          <div className="nav-right">
            <div className="nav-pills">
              {['Portfolio', 'Small Website', 'Pro'].map((p) => (
                <span key={p} className="nav-pill" style={{ color: C.muted, border: `1px solid ${C.border}` }}>{p}</span>
              ))}
            </div>
            {/* Theme toggle */}
            <div style={{ position: 'relative', marginLeft: 8 }}>
              {/* Dark mode prompt bubble */}
              {showDarkPrompt && !isDark && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="dark-prompt-bubble"
                >
                  {/* Tail */}
                  <div style={{ position: 'absolute', top: -7, right: 10, width: 12, height: 12, background: '#1a1a3a', border: '1px solid rgba(14,165,233,0.4)', borderBottom: 'none', borderRight: 'none', transform: 'rotate(45deg)' }} />
                  <div style={{ fontSize: 12, color: '#e0e8ff', fontWeight: 600, lineHeight: 1.4 }}>
                    🌙 Prefer dark mode?
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={toggleTheme}
                      style={{ fontSize: 11, fontWeight: 700, background: '#0EA5E9', color: '#fff', border: 'none', borderRadius: 8, padding: '5px 12px', cursor: 'pointer' }}
                    >
                      Switch to Dark
                    </button>
                    <button
                      onClick={() => setShowDarkPrompt(false)}
                      style={{ fontSize: 11, fontWeight: 600, background: 'transparent', color: '#6B7280', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer' }}
                    >
                      No thanks
                    </button>
                  </div>
                </motion.div>
              )}
              <button
                onClick={toggleTheme}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                style={{
                  background: C.surface2, border: `1px solid ${C.border}`,
                  borderRadius: 20, width: 36, height: 36,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', fontSize: 16, transition: 'all .2s',
                  flexShrink: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; }}
              >
                {isDark ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Hero content — split layout */}
        <div className="hero-inner">

          {/* Left: Text */}
          <motion.div
            variants={stagger(0.1)}
            initial="hidden"
            animate="show"
            className="hero-text"
          >
            <motion.div variants={fadeUp} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `${C.accent}18`, border: `1px solid ${C.accent}35`, borderRadius: 20, padding: '6px 16px', fontSize: 12.5, color: C.accent, fontWeight: 600, marginBottom: 28, letterSpacing: '0.04em' }}>
              {siteSettings?.hero?.tagline || '🚀 Custom websites · Free hosting · Built in 5-7 days'}
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="hero-title"
              style={{ fontWeight: 900, lineHeight: 1.06, letterSpacing: '-0.03em', marginBottom: 22, color: C.text }}
            >
              Custom website design,{' '}
              <span style={{
                background: 'linear-gradient(135deg, #0EA5E9 0%, #EC4899 50%, #38BDF8 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                display: 'inline-block',
              }}>
                built fast & affordable.
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} style={{ fontSize: 17.5, color: C.muted, lineHeight: 1.65, maxWidth: 480, marginBottom: 36, fontWeight: 400 }}>
              {siteSettings?.hero?.subtitle || 'Affordable custom websites for small businesses, professionals & students in India — transparent pricing from ₹6,500, zero monthly fees, delivered in 5-7 days.'}
            </motion.p>

            <motion.div variants={fadeUp} style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                onClick={() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' })}
                style={{
                  background: 'linear-gradient(135deg, #0EA5E9, #38BDF8)',
                  color: '#fff', border: 'none', borderRadius: 13,
                  padding: '16px 32px', fontSize: 16, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.01em',
                  boxShadow: '0 8px 32px rgba(14,165,233,0.35)',
                  transition: 'transform .2s, box-shadow .2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(14,165,233,0.45)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(14,165,233,0.35)'; }}
              >
                {siteSettings?.hero?.cta || 'See Plans & Pricing'}
              </button>
              <button
                onClick={() => document.getElementById('compare')?.scrollIntoView({ behavior: 'smooth' })}
                style={{
                  background: 'transparent',
                  color: C.muted, border: `1px solid ${C.border}`,
                  borderRadius: 13, padding: '16px 24px',
                  fontSize: 15, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all .2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.text; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
              >
                Why me? 🤔
              </button>
              <a
                href="/about"
                style={{
                  background: 'transparent',
                  color: C.muted, border: `1px solid ${C.border}`,
                  borderRadius: 13, padding: '16px 24px',
                  fontSize: 15, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all .2s', textDecoration: 'none',
                  display: 'inline-flex', alignItems: 'center',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.text; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
              >
                👋 About Me
              </a>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: C.muted, fontSize: 14 }}>
                <span style={{ color: C.green }}>✓</span> No obligation
                <span style={{ color: C.green }}>✓</span> Hosting ₹0/mo
              </div>
            </motion.div>
          </motion.div>

          {/* Right: Coin + compact mobile links */}
          <div className="hero-coin-section">
          <motion.div
            initial={{ opacity: 0, scale: 0.85, x: 40 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="hero-coin-wrap"
          >
            {/* Spinning decorative rings */}
            <div style={{ position: 'absolute', inset: -24, borderRadius: '50%', border: '1px dashed rgba(14,165,233,0.35)', animation: 'spin-slow 18s linear infinite', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', inset: -48, borderRadius: '50%', border: '1px dashed rgba(236,72,153,0.2)', animation: 'spin-slow 28s linear infinite reverse', pointerEvents: 'none' }} />

            {/* Glow */}
            <div style={{ position: 'absolute', inset: -10, borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.25) 0%, transparent 70%)', filter: 'blur(24px)', pointerEvents: 'none' }} />

            {/* Coin */}
            <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%' }}>
              <CoinFlip />
            </div>

            {/* Bubble: Portfolio — top-left */}
            <motion.a
              href="https://debarunghosh.netlify.app/"
              target="_blank" rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0, x: 10, y: 10 }}
              animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              transition={{ delay: 1.1, type: 'spring', stiffness: 260, damping: 18 }}
              whileHover={{ scale: 1.08, y: -3 }}
              className="hero-bubble"
              style={{
                position: 'absolute', top: 10, left: -60,
                background: isDark ? 'linear-gradient(135deg, #1a1a3a, #12122a)' : '#ffffff',
                border: '1px solid rgba(14,165,233,0.5)',
                borderRadius: '18px 18px 18px 4px',
                padding: '10px 14px',
                textDecoration: 'none', zIndex: 10,
                boxShadow: isDark ? '0 8px 24px rgba(14,165,233,0.25)' : '0 8px 24px rgba(14,165,233,0.15)',
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {/* Portfolio icon */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <rect width="24" height="24" rx="5" fill="rgba(14,165,233,0.15)"/>
                <circle cx="12" cy="9" r="3.5" fill="#0EA5E9"/>
                <path d="M5 19c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="#0EA5E9" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              <div>
                <div style={{ fontSize: 10, color: 'rgba(14,165,233,0.9)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1 }}>My Portfolio</div>
                <div style={{ fontSize: 11.5, color: C.text, fontWeight: 600, marginTop: 2 }}>View my work →</div>
              </div>
              {/* Bubble tail */}
              <div style={{ position: 'absolute', bottom: -7, left: 14, width: 12, height: 12, background: isDark ? '#1a1a3a' : '#ffffff', border: '1px solid rgba(14,165,233,0.5)', borderTop: 'none', borderRight: 'none', transform: 'rotate(-45deg)', borderRadius: '0 0 0 3px' }} />
            </motion.a>

            {/* Bubble: Customer — top-right */}
            <motion.a
              href="https://sheetalchandel.com/"
              target="_blank" rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0, x: -10, y: 10 }}
              animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              transition={{ delay: 1.3, type: 'spring', stiffness: 260, damping: 18 }}
              whileHover={{ scale: 1.08, y: -3 }}
              className="hero-bubble"
              style={{
                position: 'absolute', top: 50, right: -70,
                background: isDark ? 'linear-gradient(135deg, #1a1a3a, #12122a)' : '#ffffff',
                border: '1px solid rgba(16,185,129,0.5)',
                borderRadius: '18px 18px 4px 18px',
                padding: '10px 14px',
                textDecoration: 'none', zIndex: 10,
                boxShadow: isDark ? '0 8px 24px rgba(16,185,129,0.2)' : '0 8px 24px rgba(16,185,129,0.12)',
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {/* Sheetal / nutrition icon — leaf */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <rect width="24" height="24" rx="5" fill="rgba(16,185,129,0.15)"/>
                <path d="M12 19c0 0-7-4-7-10 0 0 4-3 7-3s7 3 7 3c0 6-7 10-7 10z" fill="#10B981"/>
                <path d="M12 19V9" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
                <path d="M12 14c-2-1.5-3.5-3-3.5-5" stroke="white" strokeWidth="1.1" strokeLinecap="round"/>
              </svg>
              <div>
                <div style={{ fontSize: 10, color: 'rgba(16,185,129,0.9)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1 }}>Recent Client</div>
                <div style={{ fontSize: 11.5, color: C.text, fontWeight: 600, marginTop: 2 }}>Sheetal Chandel →</div>
              </div>
              {/* Bubble tail */}
              <div style={{ position: 'absolute', bottom: -7, right: 14, width: 12, height: 12, background: isDark ? '#1a1a3a' : '#ffffff', border: '1px solid rgba(16,185,129,0.5)', borderTop: 'none', borderLeft: 'none', transform: 'rotate(45deg)', borderRadius: '0 0 3px 0' }} />
            </motion.a>

            {/* Bubble: insight-ai — bottom-left */}
            <motion.a
              href="https://insight-ai.dev/"
              target="_blank" rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0, x: 10, y: 10 }}
              animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              transition={{ delay: 1.1, type: 'spring', stiffness: 260, damping: 18 }}
              whileHover={{ scale: 1.08, y: -3 }}
              className="hero-bubble"
              style={{
                position: 'absolute', bottom: 70, left: -35,
                background: isDark ? 'linear-gradient(135deg, #1a1a3a, #12122a)' : '#ffffff',
                border: '1px solid rgba(14,165,233,0.5)',
                borderRadius: '18px 18px 4px 18px',
                padding: '10px 14px',
                textDecoration: 'none', zIndex: 10,
                boxShadow: isDark ? '0 8px 24px rgba(14,165,233,0.2)' : '0 8px 24px rgba(14,165,233,0.12)',
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {/* insight-ai icon */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <rect width="24" height="24" rx="5" fill="rgba(14,165,233,0.15)"/>
                <circle cx="12" cy="12" r="4" fill="none" stroke="#0EA5E9" strokeWidth="1.6"/>
                <circle cx="12" cy="12" r="1.5" fill="#0EA5E9"/>
                <path d="M12 5v2M12 17v2M5 12h2M17 12h2M7.05 7.05l1.42 1.42M15.54 15.54l1.41 1.41M7.05 16.95l1.42-1.41M15.54 8.46l1.41-1.41" stroke="#0EA5E9" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              <div>
                <div style={{ fontSize: 10, color: 'rgba(14,165,233,0.9)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1 }}>insight-ai.dev</div>
                <div style={{ fontSize: 11.5, color: C.text, fontWeight: 600, marginTop: 2 }}>Visit my site →</div>
              </div>
              {/* Bubble tail */}
              <div style={{ position: 'absolute', bottom: -7, left: 14, width: 12, height: 12, background: isDark ? '#1a1a3a' : '#ffffff', border: '1px solid rgba(14,165,233,0.5)', borderTop: 'none', borderRight: 'none', transform: 'rotate(-45deg)', borderRadius: '0 0 0 3px' }} />
            </motion.a>

            {/* Bubble: LinkedIn — bottom-right */}
            <motion.a
              href="https://www.linkedin.com/in/debarunghosh2024/"
              target="_blank" rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0, x: -10, y: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              transition={{ delay: 1.5, type: 'spring', stiffness: 260, damping: 18 }}
              whileHover={{ scale: 1.08, y: -3 }}
              className="hero-bubble"
              style={{
                position: 'absolute', bottom: 40, right: -75,
                background: isDark ? 'linear-gradient(135deg, #0a1929, #0d2137)' : '#ffffff',
                border: '1px solid rgba(10,102,194,0.6)',
                borderRadius: '18px 18px 4px 18px',
                padding: '10px 14px',
                textDecoration: 'none', zIndex: 10,
                boxShadow: isDark ? '0 8px 24px rgba(10,102,194,0.3)' : '0 8px 24px rgba(10,102,194,0.15)',
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {/* LinkedIn icon */}
              <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <rect width="24" height="24" rx="5" fill="#0A66C2"/>
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" fill="white" transform="scale(0.72) translate(1.7, 1.7)"/>
              </svg>
              <div>
                <div style={{ fontSize: 10, color: '#0A66C2', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1 }}>LinkedIn</div>
                <div style={{ fontSize: 11.5, color: C.text, fontWeight: 600, marginTop: 2 }}>Let's connect →</div>
              </div>
              {/* Bubble tail */}
              <div style={{ position: 'absolute', bottom: -7, right: 14, width: 12, height: 12, background: isDark ? '#0d2137' : '#ffffff', border: '1px solid rgba(10,102,194,0.6)', borderTop: 'none', borderLeft: 'none', transform: 'rotate(45deg)', borderRadius: '0 0 3px 0' }} />
            </motion.a>

            {/* Name badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="hero-name-badge"
              style={{
                position: 'absolute', bottom: -18, left: '50%',
                transform: 'translateX(-50%)',
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 20, padding: '7px 18px',
                fontSize: 12.5, fontWeight: 700, color: C.text,
                whiteSpace: 'nowrap', zIndex: 2,
                boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
              }}
            >
              BespokeDeploy.in · Web Studio
            </motion.div>
          </motion.div>

          {/* ── Mobile compact link row (replaces absolute bubbles on small screens) ── */}
          <div className="hero-bubbles-row">
            <a
              href="https://debarunghosh.netlify.app/"
              target="_blank" rel="noopener noreferrer"
              className="hero-bubble-pill"
              style={{ borderColor: 'rgba(14,165,233,0.5)', color: '#0EA5E9' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="9" r="4.5" fill="currentColor" opacity="0.8"/>
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              My Portfolio
            </a>
            <a
              href="https://sheetalchandel.com/"
              target="_blank" rel="noopener noreferrer"
              className="hero-bubble-pill"
              style={{ borderColor: 'rgba(16,185,129,0.5)', color: '#10B981' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <path d="M12 21c0 0-7-4-7-10 0 0 3.5-3.5 7-3.5s7 3.5 7 3.5c0 6-7 10-7 10z" fill="currentColor" opacity="0.8"/>
                <line x1="12" y1="21" x2="12" y2="11" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Sheetal Chandel
            </a>
            <a
              href="https://www.linkedin.com/in/debarunghosh2024/"
              target="_blank" rel="noopener noreferrer"
              className="hero-bubble-pill"
              style={{ borderColor: 'rgba(10,102,194,0.5)', color: '#0A66C2' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <rect width="24" height="24" rx="4" fill="#0A66C2"/>
                <text x="5" y="17" fill="white" fontSize="11" fontWeight="800" fontFamily="Inter,Arial,sans-serif">in</text>
              </svg>
              LinkedIn
            </a>
          </div>

          </div>{/* end hero-coin-section */}
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }}
          onClick={() => document.getElementById('usps')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <span style={{ fontSize: 12, color: C.muted, letterSpacing: '0.08em' }}>SCROLL</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ color: C.muted, fontSize: 18 }}>↓</motion.div>
        </motion.div>
      </div>

      {/* ── USPs ── */}
      <div style={{ background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <Section id="usps">
          <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontSize: 13, color: C.accent, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Why choose me</div>
            <h2 style={{ fontSize: 40, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>What makes this different</h2>
          </motion.div>
          <div className="usps-grid">
            {USPS.map((u) => (
              <motion.div key={u.title} variants={fadeUp} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 16, padding: '28px 24px' }}>
                <div style={{ marginBottom: 16 }}>{USP_ICONS[u.id]}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8 }}>{u.title}</div>
                <div style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.6 }}>{u.desc}</div>
              </motion.div>
            ))}
          </div>
        </Section>
      </div>

      {/* ── COMPARISON ── */}
      <CompareSection />

      {/* ── PLANS ── */}
      <Section id="plans">
        {allPlansUnavailable ? (
          <>
            <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 40 }}>
              <div style={{ fontSize: 13, color: C.accent, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Transparent pricing</div>
              <h2 style={{ fontSize: 44, fontWeight: 900, color: C.text, letterSpacing: '-0.025em', marginBottom: 10 }}>Pick your plan</h2>
              <p style={{ fontSize: 15.5, color: C.muted, maxWidth: 480, lineHeight: 1.6, margin: '0 auto' }}>
                All packages are paused for new bookings right now. Tell me what you're after and I'll reach out personally.
              </p>
            </motion.div>
            <AllUnavailableForm plans={allPlans} />
          </>
        ) : (
          <>
            <motion.div variants={fadeUp} style={{ marginBottom: 48 }}>
              {/* Header row: title left, quiz button right */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 13, color: C.accent, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Transparent pricing</div>
                  <h2 style={{ fontSize: 44, fontWeight: 900, color: C.text, letterSpacing: '-0.025em', marginBottom: 10 }}>Pick your plan</h2>
                  <p style={{ fontSize: 15.5, color: C.muted, maxWidth: 460, lineHeight: 1.6, margin: '0 0 6px' }}>
                    Every plan is a starting point. Add exactly what you need — nothing more, nothing less.
                  </p>
                  <div><CapacityBanner capacity={capacity} /></div>
                </div>
                <PlanDecider onSelectPlan={handleChoosePlan} plans={effectivePlans} />
              </div>
            </motion.div>

            <div className="plans-grid" style={{ alignItems: 'start' }}>
              {allPlans.map((plan, i) => (
                plan._enabled === false
                  ? <DisabledPlanCard key={plan.id} plan={plan} onNotify={(p) => setWaitlistModal({ plan: p, reason: 'unavailable' })} />
                  : <PlanCard key={plan.id} plan={plan} onSelect={handleChoosePlan} capacity={hasBypass ? null : capacity} index={i} />
              ))}
            </div>

            <motion.div variants={fadeUp} style={{ textAlign: 'center', marginTop: 28, fontSize: 13, color: C.muted }}>
              Custom domain optional (paid directly by you) · Hosting ₹0/month forever · 2 free revision rounds post-delivery
            </motion.div>
          </>
        )}
      </Section>

      {/* ── HOW IT WORKS ── */}
      <div style={{ background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <Section>
          <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontSize: 13, color: C.accent, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Simple process</div>
            <h2 style={{ fontSize: 40, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>How it works</h2>
          </motion.div>
          <div className="how-grid">
            {HOW.map((h, i) => (
              <motion.div key={h.n} variants={fadeUp} style={{ textAlign: 'center', padding: '24px 20px' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%', margin: '0 auto 20px',
                  background: `linear-gradient(135deg, ${C.accent}30, ${C.accent}10)`,
                  border: `1px solid ${C.accent}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 800, color: C.accent,
                }}>
                  {h.n}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 8 }}>{h.title}</div>
                <div style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.6 }}>{h.desc}</div>
              </motion.div>
            ))}
          </div>
        </Section>
      </div>

      {/* ── FAQ ── */}
      <FAQSection />

      {/* ── FOOTER ── */}
      <footer style={{ padding: '40px 24px', textAlign: 'center', borderTop: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>
          <span style={{ color: C.accent }}>Bespoke</span><span style={{ color: C.text }}>Deploy</span><span style={{ color: C.accent }}>.</span><span style={{ color: C.text }}>in</span>
        </div>
        <div style={{ fontSize: 13, color: C.muted }}>
          BespokeDeploy.in · Built with care · India
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 16, flexWrap: 'wrap' }}>
          <a
            href="/about"
            style={{ fontSize: 12, color: C.muted, textDecoration: 'underline', textUnderlineOffset: 3 }}
          >About Me</a>
          <button
            onClick={() => setLegalDoc('privacy')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: C.muted, textDecoration: 'underline', textUnderlineOffset: 3, padding: 0 }}
          >Privacy Policy</button>
          <button
            onClick={() => setLegalDoc('tnc')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: C.muted, textDecoration: 'underline', textUnderlineOffset: 3, padding: 0 }}
          >Terms & Conditions</button>
        </div>
        <div style={{ fontSize: 12, color: C.border, marginTop: 12 }}>
          © 2026 BespokeDeploy.in. All prices in INR.
        </div>
      </footer>

      {/* ── LEGAL MODALS ── */}
      <AnimatePresence>
        {legalDoc && (
          <LegalModal doc={legalDoc} onClose={() => setLegalDoc(null)} isDark={isDark} />
        )}
      </AnimatePresence>

      {/* ── WAITLIST MODAL ── */}
      <AnimatePresence>
        {waitlistModal && (
          <WaitlistModal
            plan={waitlistModal.plan}
            reason={waitlistModal.reason}
            maxSlots={capacity?.maxSlots}
            urgentAvailable={capacity?.urgentAvailable ?? true}
            onClose={() => setWaitlistModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
