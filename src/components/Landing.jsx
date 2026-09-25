import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { PLANS } from '../data/plans';
import { PLAN_ICONS, PAUSE_ICON } from '../data/planIcons';
import { C, fadeUp, stagger, fmt } from '../theme';
import HeroLightFX from './HeroLightFX';
import MsmeBadge, { MsmeSeal } from './MsmeBadge';

// ─── Promo Banner ───────────────────────────────────────────
// Fetches from GET /api/promos — a public, read-only endpoint that only ever
// returns an admin-enabled promo currently inside its date window (see
// functions/api/promos.js). Nothing here can be written to or spoofed from
// the browser: creating/editing/toggling a promo requires the admin's bearer
// token, checked server-side on every write (functions/api/admin/promos/).
const PROMO_THEME_COLORS = {
  accent: { c1: '#E8542C', c2: '#F0714A' },
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
        stroke="#E8542C" strokeWidth="2" strokeLinejoin="round" fill="rgba(232,84,44,0.08)"/>
      <circle cx="22" cy="22" r="5" stroke="#E8542C" strokeWidth="2" fill="rgba(232,84,44,0.18)"/>
      <circle cx="22" cy="22" r="2" fill="#E8542C"/>
      {/* Lashes / rays */}
      <line x1="22" y1="8" x2="22" y2="11" stroke="#E8542C" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="10" y1="13" x2="12.5" y2="15.5" stroke="#E8542C" strokeWidth="1.8" strokeLinecap="round" opacity="0.5"/>
      <line x1="34" y1="13" x2="31.5" y2="15.5" stroke="#E8542C" strokeWidth="1.8" strokeLinecap="round" opacity="0.5"/>
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
// ─── Testimonials ───────────────────────────────────────────
// Pulls from GET /api/feedback — public, read-only, and only ever returns
// rows an admin has already approved (see functions/api/feedback.js). If
// there's nothing approved yet, this section renders nothing at all rather
// than showing an empty block.
function TestimonialStars({ n }) {
  return (
    <span style={{ color: '#F59E0B', fontSize: 14, letterSpacing: 1 }}>
      {'★'.repeat(n)}<span style={{ color: C.border }}>{'★'.repeat(5 - n)}</span>
    </span>
  );
}

function TestimonialsSection() {
  const [items, setItems] = useState(null); // null = loading, [] = none yet

  useEffect(() => {
    fetch('/api/feedback?limit=12')
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch(() => setItems([]));
  }, []);

  if (!items || items.length === 0) return null;

  return (
    <div style={{ background: C.surface, borderTop: `1px solid ${C.borderFaint}`, borderBottom: `1px solid ${C.borderFaint}` }}>
      <Section id="testimonials">
        <motion.div variants={fadeUp} style={{ marginBottom: 44 }}>
          <div style={{ fontSize: 13, color: C.accent, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>What clients say</div>
          <h2 style={{ fontFamily: C.fontDisplay, fontSize: 'clamp(26px, 3.4vw, 40px)', fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>Real feedback, from real projects</h2>
        </motion.div>
        <motion.div
          variants={fadeUp}
          style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            background: C.border, border: `1px solid ${C.border}`, gap: 1,
          }}
        >
          {items.map((t) => (
            <div key={t.id} style={{ background: C.bg, padding: '26px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <TestimonialStars n={t.rating} />
              <p style={{ fontSize: 14.5, color: C.dim, lineHeight: 1.65, flex: 1, margin: 0 }}>&ldquo;{t.message}&rdquo;</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                <div style={{ fontFamily: C.fontDisplay, fontSize: 14, fontWeight: 700, color: C.text }}>{t.customer_name}</div>
                {!!t.plan_name && (
                  <span style={{ fontSize: 11, color: C.accent, fontWeight: 700, border: `1px solid ${C.accent}`, padding: '2px 9px' }}>{t.plan_name}</span>
                )}
              </div>
            </div>
          ))}
        </motion.div>
      </Section>
    </div>
  );
}

function CompareSection() {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const COLS = [
    { key: 'ai',  label: 'AI Builders' },
    { key: 'diy', label: 'Wix / Squarespace' },
    { key: 'me',  label: 'BespokeDeploy', me: true },
  ];

  return (
    <motion.section
      ref={ref}
      variants={stagger()}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      id="compare"
      style={{ padding: '20px 24px 120px', maxWidth: 1100, margin: '0 auto' }}
    >
      <motion.div variants={fadeUp} style={{ marginBottom: 44 }}>
        <div style={{ fontSize: 13, color: C.accent, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
          See the difference
        </div>
        <h2 style={{ fontFamily: C.fontDisplay, fontSize: 'clamp(28px, 3.6vw, 44px)', fontWeight: 800, color: C.text, letterSpacing: '-0.02em', marginBottom: 14, maxWidth: 620, lineHeight: 1.05 }}>
          Why not just use an AI builder or Wix?
        </h2>
        <p style={{ fontSize: 15.5, color: C.muted, maxWidth: 560, lineHeight: 1.65 }}>
          They look cheap monthly — but over time they cost more, look generic, and leave you alone. Here's the honest comparison.
        </p>
      </motion.div>

      {/* Flat hairline table */}
      <motion.div variants={fadeUp} style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: 640, border: `2px solid ${C.text}` }}>
          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1.2fr' }}>
            <div style={{ background: C.text, color: C.bg, fontFamily: C.fontDisplay, fontWeight: 700, fontSize: 13.5, padding: '15px 18px' }}>Pricing model</div>
            {COLS.map((c) => (
              <div
                key={c.key}
                style={{
                  background: c.me ? C.accent : C.text,
                  color: c.me ? '#fff' : C.bg,
                  fontFamily: C.fontDisplay, fontWeight: 700, fontSize: 13.5,
                  padding: '15px 14px', textAlign: 'center',
                }}
              >
                {c.label}
              </div>
            ))}
          </div>
          {/* Data rows */}
          {COMPARE_ROWS.slice(0, 6).map((row, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1.2fr', borderTop: `1px solid ${C.borderFaint}` }}>
              <div style={{ padding: '14px 18px', fontSize: 13.5, fontWeight: 600, color: C.text, display: 'flex', alignItems: 'center' }}>{row.label}</div>
              <div style={{ padding: '14px', fontSize: 13, color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>{row.ai}</div>
              <div style={{ padding: '14px', fontSize: 13, color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>{row.diy}</div>
              <div style={{ padding: '14px', fontSize: 13, fontWeight: 700, color: C.accent, background: `${C.accent}0D`, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>{row.me}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Callout */}
      <motion.div
        variants={fadeUp}
        style={{
          marginTop: 32, background: C.surface,
          border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.accent}`,
          padding: '20px 26px', fontSize: 14, color: C.muted, lineHeight: 1.7,
        }}
      >
        <strong style={{ color: C.text }}>The hidden math: </strong>
        A ₹1,500/mo Wix plan costs ₹18,000 in Year 1, ₹54,000 by Year 3, and ₹90,000 by Year 5 — with ads, limited SEO, and no real human if something breaks.{' '}
        My Pro website at ₹22,000 pays itself back in under 15 months and costs nothing after that.
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
// Full FAQ content now lives on its own route — see FAQPage.jsx. This is
// just a compact teaser strip linking there, matching Concept A's minimal
// "Before you ask" treatment rather than a long inline accordion.
function FAQTeaser() {
  return (
    <Section id="faq">
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap',
        border: `2px solid ${C.text}`, padding: '40px 44px', background: C.surface,
      }}>
        <div>
          <div style={{ fontSize: 13, color: C.accent, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>Questions</div>
          <h2 style={{ fontFamily: C.fontDisplay, fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>
            Got questions before you commit?
          </h2>
        </div>
        <a
          href="/faq"
          style={{ background: C.text, color: C.bg, borderRadius: 40, padding: '15px 28px', fontSize: 14.5, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}
        >
          See all FAQs →
        </a>
      </div>
    </Section>
  );
}

// ─── AI Chatbot corner stamp ────────────────────────────────
// A rubber-stamp-style seal (perforated dashed outer ring, curved text on an
// inner ring, custom chat-bubble mark at center — no emoji, matches the
// MsmeSeal's visual language). Hovering it reveals a small mocked chat-widget
// preview so the claim reads as "here's what it looks like," not just a tag.
function AiChatbotStamp({ color }) {
  const [hovered, setHovered] = useState(false);
  const uidRef = useRef(`ai-stamp-ring-${Math.random().toString(36).slice(2)}`);
  const uid = uidRef.current;

  return (
    <div
      style={{ position: 'absolute', top: 18, right: 18, zIndex: 6 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.7, rotate: -22 }}
        animate={{ opacity: 1, scale: 1, rotate: -12 }}
        whileHover={{ scale: 1.08, rotate: -6 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: 'relative', width: 96, height: 96, cursor: 'pointer' }}
      >
        <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <path id={uid} d="M 50,50 m -36,0 a 36,36 0 1,1 72,0 a 36,36 0 1,1 -72,0" />
          </defs>
          {/* perforated outer edge — sits clear of the text ring */}
          <circle cx="50" cy="50" r="48" fill="none" stroke={color} strokeWidth="1.3" strokeDasharray="1.4 3" opacity="0.8" />
          {/* solid inked disc so white text reads clearly */}
          <circle cx="50" cy="50" r="44" fill={color} opacity="0.94" />
          <circle cx="50" cy="50" r="30" fill="none" stroke="#fff" strokeWidth="0.8" opacity="0.5" />
          <text fill="#fff" fontSize="8.4" fontWeight="800" letterSpacing="1.1">
            <textPath href={`#${uid}`} startOffset="1%">★ AI CHATBOT ★ INCLUDED ★ </textPath>
          </text>
        </svg>
        <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2C6.48 2 2 5.94 2 10.78c0 2.56 1.28 4.86 3.32 6.46L4 22l4.86-1.9c1 .28 2.06.44 3.14.44 5.52 0 10-3.94 10-8.76S17.52 2 12 2Z"
              fill="#fff" opacity="0.14" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round"
            />
            <circle cx="8.4" cy="10.6" r="1.15" fill="#fff" />
            <circle cx="12" cy="10.6" r="1.1" fill="#fff" />
            <circle cx="15.6" cy="10.6" r="1.1" fill="#fff" />
          </svg>
        </span>
      </motion.div>

      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.94 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'absolute', top: '100%', right: 0, marginTop: 10,
              width: 228, borderRadius: 14, overflow: 'hidden',
              background: '#fff', boxShadow: '0 18px 44px rgba(0,0,0,0.45)',
              zIndex: 30,
            }}
          >
            <div style={{ background: color, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />
              <span style={{ color: '#fff', fontSize: 11.5, fontWeight: 700 }}>AI Assistant · Online</span>
            </div>
            <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 7, background: '#F6F6F4' }}>
              <div style={{ alignSelf: 'flex-start', background: '#fff', border: '1px solid #ececec', borderRadius: '10px 10px 10px 2px', padding: '6px 9px', fontSize: 10.5, color: '#333', maxWidth: '85%', lineHeight: 1.4 }}>
                Hi! Looking for a service?
              </div>
              <div style={{ alignSelf: 'flex-end', background: color, color: '#fff', borderRadius: '10px 10px 2px 10px', padding: '6px 9px', fontSize: 10.5, maxWidth: '85%', lineHeight: 1.4 }}>
                Do you offer home visits?
              </div>
              <div style={{ alignSelf: 'flex-start', background: '#fff', border: '1px solid #ececec', borderRadius: '10px 10px 10px 2px', padding: '6px 9px', fontSize: 10.5, color: '#333', maxWidth: '85%', lineHeight: 1.4 }}>
                Yes — I can book that for you right now →
              </div>
            </div>
            <div style={{ padding: '7px 12px', fontSize: 9.5, color: '#999', textAlign: 'center', borderTop: '1px solid #eee' }}>
              Example — trained on your site content
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      style={{
        background: plan.highlight ? '#111111' : C.surface,
        border: `2px solid ${plan.highlight ? '#111111' : C.border}`,
        borderRadius: 0,
        padding: '32px 28px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* Badge */}
      {plan.badge && (
        <div style={{
          position: 'absolute', top: -14, left: 28,
          background: C.accent, color: '#fff',
          fontSize: 11, fontWeight: 800, letterSpacing: '0.06em',
          padding: '4px 14px', borderRadius: 20, whiteSpace: 'nowrap',
          textTransform: 'uppercase',
        }}>
          {plan.badge}
        </div>
      )}

      {/* AI stamp — corner seal */}
      {plan.calloutTag && <AiChatbotStamp color={plan.color} />}

      {/* Header */}
      <div style={{ marginBottom: 14 }}>{PLAN_ICONS[plan.id]?.(plan.color)}</div>
      <div style={{ fontFamily: C.fontDisplay, fontSize: 22, fontWeight: 700, color: plan.highlight ? '#ffffff' : C.text, marginBottom: 4 }}>{plan.name}</div>
      <div style={{ fontSize: 13, color: plan.highlight ? 'rgba(255,255,255,0.6)' : C.muted, marginBottom: 22, lineHeight: 1.55 }}>{plan.tagline}</div>

      {/* Price */}
      <div style={{ marginBottom: 26 }}>
        <div style={{ fontSize: 11, color: plan.highlight ? 'rgba(255,255,255,0.5)' : C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>One-time price</div>
        <div style={{ fontFamily: C.fontDisplay, fontSize: 42, fontWeight: 800, letterSpacing: '-0.02em', color: C.accent }}>
          <CountPrice value={plan.price} />
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
            {plan.extras.slice(0, 6).map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 9, marginBottom: 9, alignItems: 'flex-start' }}>
                <span style={{ color: plan.color, fontSize: 13, marginTop: 2, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 13.5, color: plan.highlight ? 'rgba(255,255,255,0.75)' : C.dim, lineHeight: 1.45 }}>{item}</span>
              </div>
            ))}
            {plan.extras.length > 6 && (
              <div style={{ fontSize: 12.5, color: plan.highlight ? 'rgba(255,255,255,0.5)' : C.muted, marginTop: 4, paddingLeft: 22 }}>
                +{plan.extras.length - 6} more included — see full details →
              </div>
            )}
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
          background: plan.highlight ? C.accent : 'transparent',
          color: plan.highlight ? '#fff' : (plan.highlight ? '#fff' : C.text),
          border: plan.highlight ? 'none' : `2px solid ${C.text}`,
          borderRadius: 0, padding: '14px 20px',
          fontSize: 14, fontWeight: 700, cursor: 'pointer',
          width: '100%', transition: 'all .2s',
          fontFamily: 'inherit', letterSpacing: '0.01em', textAlign: 'center',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = C.accent; e.currentTarget.style.color = '#fff'; e.currentTarget.style.border = 'none'; }}
        onMouseLeave={(e) => {
          if (plan.highlight) { e.currentTarget.style.background = C.accent; e.currentTarget.style.color = '#fff'; }
          else { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.text; e.currentTarget.style.border = `2px solid ${C.text}`; }
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
                background: isAnswered ? (ans ? 'rgba(232,84,44,0.07)' : C.bg) : C.bg,
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
      <path d="M80 168 Q110 182 140 168 L148 198 Q110 210 72 198Z" fill="#E8542C" opacity="0.9"/>
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
    border: '3px solid rgba(232,84,44,0.55)',
    boxShadow: '0 0 0 8px rgba(232,84,44,0.07), 0 24px 60px rgba(232,84,44,0.30)',
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
              <span style={{ color: C.accent }}>D</span><span style={{ color: C.text }}>ev</span>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(232,84,44,0.75)', letterSpacing: '0.16em', textTransform: 'uppercase', marginTop: 4 }}>BespokeDeploy.in</div>
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

// ─── Hero projector FX (dark mode only) ─────────────────────
// Superseded by HeroLightFX.jsx — a real WebGL shader (physically-inspired
// cone falloff, fBm/curl-noise smoke, tunable dust motes) with a DOM overlay
// synced to the same math for the headline "catching" the light. See that
// file for the implementation and HERO_LIGHT_CONFIG for tuning knobs.

// ─── Marquee strip halves ──────────────────────────────────
// Renders exactly 2 halves (required for the translateX(-50%) loop trick),
// each half repeating `words` STRIP_REPEAT times so a half's rendered width
// comfortably exceeds any real viewport — otherwise on wide screens the
// content runs out mid-scroll and a blank gap flashes before the loop.
const STRIP_REPEAT = 6;
function StripHalves({ words }) {
  const items = [];
  words.forEach((w) => items.push({ t: w }, { s: true }));
  return Array(2).fill(0).flatMap((_, half) => (
    Array(STRIP_REPEAT).fill(0).flatMap((__, rep) => (
      items.map((item, i) => (
        <span key={`${half}-${rep}-${i}`} className={item.s ? 'accent' : undefined} style={{ marginRight: 48 }}>
          {item.s ? '★' : item.t}
        </span>
      ))
    ))
  ));
}

// ─── Count-up price — animates ₹0 → the real price once scrolled into view ──
function CountPrice({ value }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const dur = 1100;
    const start = performance.now();
    let raf;
    const step = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);
  return <span ref={ref}>₹{fmt(display)}</span>;
}

// ─── Site preview modal — small "browser window" showing the live site,
// click anywhere on the preview to open the real site in a new tab.
// (Some sites block iframe embedding via X-Frame-Options — the window
// chrome and click-through still work fine even if the preview stays blank.)
function SitePreviewModal({ link, onClose }) {
  return (
    <AnimatePresence>
      {link && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(17,17,17,0.75)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{ width: 'min(920px, 94vw)', height: 'min(600px, 82vh)', background: C.surface, border: `2px solid ${C.text}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            {/* Window title bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: `1px solid ${C.borderFaint}`, background: C.bg, flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }} />
              </div>
              <div style={{ flex: 1, textAlign: 'center', fontSize: 12.5, color: C.muted, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {link.href.replace(/^https?:\/\//, '')}
              </div>
              <button onClick={onClose} aria-label="Close preview" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: C.muted, lineHeight: 1 }}>×</button>
            </div>

            {/* Live preview — click anywhere to open the real site */}
            <div
              onClick={() => window.open(link.href, '_blank', 'noopener,noreferrer')}
              title={`Open ${link.label} in a new tab`}
              style={{ position: 'relative', flex: 1, cursor: 'pointer', background: link.noPreview ? C.bg : '#fff' }}
            >
              {link.noPreview && link.previewImage ? (
                // This site blocks iframe embedding (X-Frame-Options) — show a
                // static screenshot instead, since no live preview is possible.
                <img
                  src={link.previewImage}
                  alt={`${link.label} preview`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }}
                />
              ) : link.noPreview ? (
                // This site blocks being embedded in an iframe (X-Frame-Options) —
                // show a clean branded fallback instead of the browser's broken-page icon.
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 40, textAlign: 'center' }}>
                  <div style={{ fontFamily: C.fontDisplay, fontSize: 22, fontWeight: 700, color: C.text }}>{link.label}</div>
                  <p style={{ fontSize: 13.5, color: C.muted, maxWidth: 360, lineHeight: 1.6 }}>
                    This site doesn't allow live previews to be embedded — click anywhere to open it directly.
                  </p>
                </div>
              ) : (
                <iframe
                  src={link.href}
                  title={link.label}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
                />
              )}
              <div style={{
                position: 'absolute', bottom: 16, right: 16,
                background: C.text, color: C.bg, fontSize: 12.5, fontWeight: 700,
                padding: '8px 16px', borderRadius: 40, boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
              }}>
                Click to visit {link.label} ↗
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
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

// ─── Capacity banner ────────────────────────────────────────
function CapacityBanner({ capacity }) {
  if (!capacity) return null;
  if (capacity.available) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 20, padding: '6px 14px', fontSize: 12.5, color: '#10B981', fontWeight: 600, marginBottom: 18 }}>
        ✅ Currently accepting new projects
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
                : `I'm at full capacity right now so every project gets proper attention. Leave your details and I'll notify you the moment a slot opens.`}
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
                    {!urgentAvailable && <span style={{ color: C.muted }}> — urgent priority is currently taken</span>}
                    {urgentAvailable && <span style={{ color: C.muted }}> — gets priority when a slot opens</span>}
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
    // Merge admin-set prices/enabled onto the hardcoded add-ons…
    const builtInAddons = plan.addons.map(a => {
      const aov = siteSettings?.addons?.[a.id];
      return aov ? { ...a, price: aov.price ?? a.price, enabled: aov.enabled ?? true } : a;
    });
    // …and append any admin-created custom add-ons for this plan.
    const customAddons = (siteSettings?.custom_addons || []).filter(a => a.plan_id === plan.id);
    const addons = [...builtInAddons, ...customAddons].filter(a => a.enabled !== false);
    return { ...plan, price: ov.price ?? plan.price, addons, _enabled: ov.enabled ?? true };
  });
  const effectivePlans = allPlans.filter(plan => plan._enabled !== false);
  const allPlansUnavailable = siteSettings != null && effectivePlans.length === 0;
  // Dark is the site's only theme now — no toggle, no light mode.
  const heroHeadlineRef = useRef(null); // "make people" line — the light's aim target
  const heroTitleRef = useRef(null); // whole h1 — gets the lit drop-shadow
  const [previewLink, setPreviewLink] = useState(null); // { href, label } | null
  const [navOpen, setNavOpen] = useState(false); // mobile hamburger menu
  const [capacity, setCapacity] = useState(null);
  const [waitlistModal, setWaitlistModal] = useState(null); // { plan, reason } | null
  const [promos, setPromos] = useState([]);
  const [promoDismissed, setPromoDismissed] = useState(false);
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

  return (
    <div>
      <AnimatePresence>
        {promos.length > 0 && !promoDismissed && (
          <PromoBanner promos={promos} onDismiss={() => setPromoDismissed(true)} />
        )}
      </AnimatePresence>

      {/* Nav — page-level sticky bar, not clipped by the hero's overflow */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="site-nav"
        style={{
          position: 'sticky', top: 0, zIndex: 30,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 40px', borderBottom: `1px solid ${C.borderFaint}`,
          background: 'rgba(var(--c-bg-rgb), 0.85)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
        }}
      >
        <a href="/" style={{ fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 19, letterSpacing: '-0.01em', color: C.text, textDecoration: 'none' }}>
          BespokeDeploy<span style={{ color: C.accent }}>.</span>
        </a>
        <div className="site-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 36, fontSize: 14, fontWeight: 600, color: C.muted, transition: 'color 0.3s ease' }}>
          <a href="#usps" onClick={(e) => { e.preventDefault(); document.getElementById('usps')?.scrollIntoView({ behavior: 'smooth' }); }} style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.color = C.accent; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'inherit'; }}>Why me</a>
          <a href="#plans" onClick={(e) => { e.preventDefault(); document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' }); }} style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.color = C.accent; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'inherit'; }}>Pricing</a>
          <a href="/faq" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.color = C.accent; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'inherit'; }}>FAQ</a>
          <a href="/about" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.color = C.accent; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'inherit'; }}>About</a>
        </div>
        <div className="site-nav-cta nav-right" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ background: C.text, color: C.bg, border: 'none', borderRadius: 40, padding: '11px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
          >
            Start a project →
          </button>
        </div>

        {/* Hamburger — hidden on desktop, shown below the .site-nav-links
            breakpoint (see index.css) since 4 links + a CTA button doesn't
            fit next to the wordmark on a phone without wrapping/overflowing. */}
        <button
          className="site-nav-hamburger"
          onClick={() => setNavOpen((o) => !o)}
          aria-label={navOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={navOpen}
          style={{
            display: 'none', background: 'transparent', border: `1px solid ${C.borderFaint}`, borderRadius: 10,
            width: 40, height: 40, cursor: 'pointer', color: C.text, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          <div style={{ width: 18, height: 13, position: 'relative' }}>
            <motion.span animate={{ rotate: navOpen ? 45 : 0, y: navOpen ? 5.5 : 0 }} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 1.6, background: C.text, borderRadius: 2 }} />
            <motion.span animate={{ opacity: navOpen ? 0 : 1 }} style={{ position: 'absolute', top: 5.5, left: 0, width: '100%', height: 1.6, background: C.text, borderRadius: 2 }} />
            <motion.span animate={{ rotate: navOpen ? -45 : 0, y: navOpen ? -5.5 : 0 }} style={{ position: 'absolute', top: 11, left: 0, width: '100%', height: 1.6, background: C.text, borderRadius: 2 }} />
          </div>
        </button>
      </motion.div>

      {/* Mobile nav dropdown — links + CTA stacked, only rendered/shown below
          the hamburger breakpoint (CSS handles hiding it on desktop too, as
          a belt-and-suspenders in case JS state lingers across a resize). */}
      <AnimatePresence>
        {navOpen && (
          <motion.div
            className="site-nav-mobile-panel"
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'sticky', top: 61, zIndex: 29, overflow: 'hidden',
              background: 'rgba(var(--c-bg-rgb), 0.98)', backdropFilter: 'blur(10px)',
              borderBottom: `1px solid ${C.borderFaint}`,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', padding: '8px 24px 20px' }}>
              {[
                { label: 'Why me', onClick: () => document.getElementById('usps')?.scrollIntoView({ behavior: 'smooth' }) },
                { label: 'Pricing', onClick: () => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' }) },
                { label: 'FAQ', href: '/faq' },
                { label: 'About', href: '/about' },
              ].map((item) => (
                item.href ? (
                  <a key={item.label} href={item.href} style={{ padding: '14px 4px', fontSize: 15.5, fontWeight: 600, color: C.text, textDecoration: 'none', borderBottom: `1px solid ${C.borderFaint}` }}>
                    {item.label}
                  </a>
                ) : (
                  <button
                    key={item.label}
                    onClick={() => { item.onClick(); setNavOpen(false); }}
                    style={{ padding: '14px 4px', fontSize: 15.5, fontWeight: 600, color: C.text, background: 'transparent', border: 'none', borderBottom: `1px solid ${C.borderFaint}`, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    {item.label}
                  </button>
                )
              ))}
              <button
                onClick={() => { document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' }); setNavOpen(false); }}
                style={{ marginTop: 16, background: C.text, color: C.bg, border: 'none', borderRadius: 40, padding: '13px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Start a project →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HERO ── */}
      <div className="hero-root">
        {/* Background — two blurred blobs only, matching the mockup (no grid, no old orbs) */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', width: 480, height: 480, borderRadius: '50%', background: '#E8542C', filter: 'blur(90px)', opacity: 0.22, top: '-18%', right: '-8%' }} />
          <div style={{ position: 'absolute', width: 360, height: 360, borderRadius: '50%', background: '#FFD23F', filter: 'blur(90px)', opacity: 0.18, bottom: '-12%', left: '-6%' }} />
        </div>

        {/* Projector light + smoke — dark mode only. WebGL shader + synced
            DOM text-overlay; aims at heroHeadlineRef (the "make people" line). */}
        <HeroLightFX targetRef={heroHeadlineRef} shadowRef={heroTitleRef} enabled={true} />

        {/* Hero content — Concept A: big word-reveal headline, no avatar */}
        <div className="hero-inner" style={{ flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', gap: 0, maxWidth: 1080, width: '100%', padding: 'clamp(40px, 7vh, 90px) clamp(20px, 4vw, 40px)' }}>

          <motion.div variants={fadeUp} initial="hidden" animate="show" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.accent, marginBottom: 26 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.accent, animation: 'pulse-ring 1.6s ease-in-out infinite' }} />
            {siteSettings?.hero?.tagline || 'Custom websites · Free hosting · Built in 5-7 days'}
          </motion.div>

          <h1 ref={heroTitleRef} style={{ fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 'clamp(42px, 8.2vw, 112px)', lineHeight: 0.92, letterSpacing: '-0.035em', color: C.text, marginBottom: 30, maxWidth: 960 }}>
            {['Websites that', 'make people'].map((line, li) => (
              <div key={li} ref={li === 1 ? heroHeadlineRef : undefined} style={{ overflow: 'hidden' }}>
                {line.split(' ').map((word, wi) => (
                  <span key={wi} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', marginRight: '0.28em' }}>
                    <motion.span
                      initial={{ y: '110%' }}
                      animate={{ y: 0 }}
                      transition={{ duration: 0.7, delay: 0.15 + (li * 2 + wi) * 0.06, ease: [0.19, 1, 0.22, 1] }}
                      style={{ display: 'inline-block' }}
                    >
                      {word}
                    </motion.span>
                  </span>
                ))}
              </div>
            ))}
            <div style={{ overflow: 'hidden' }}>
              {'stop scrolling.'.split(' ').map((word, wi) => (
                <span key={wi} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', marginRight: '0.28em' }}>
                  <motion.span
                    initial={{ y: '110%' }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.7, delay: 0.15 + (4 + wi) * 0.06, ease: [0.19, 1, 0.22, 1] }}
                    style={{
                      display: 'inline-block',
                      background: 'linear-gradient(135deg, #E8542C 0%, #EC4899 50%, #F0714A 100%)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {word}
                  </motion.span>
                </span>
              ))}
            </div>
          </h1>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.6 }}
            style={{ fontSize: 18, color: C.muted, lineHeight: 1.65, maxWidth: 520, marginBottom: 40, fontWeight: 400 }}
          >
            {siteSettings?.hero?.subtitle || 'Affordable custom websites for small businesses, professionals & students in India — transparent pricing from ₹6,500, zero monthly fees, delivered in 5-7 days.'}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.05, duration: 0.5 }}
            style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginBottom: 34 }}
          >
            <button
              onClick={() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                background: '#E8542C',
                color: '#fff', border: 'none', borderRadius: 40,
                padding: '17px 34px', fontSize: 16, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.01em',
                boxShadow: '0 8px 32px rgba(232,84,44,0.35)',
                transition: 'transform .2s, box-shadow .2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(232,84,44,0.45)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(232,84,44,0.35)'; }}
            >
              {siteSettings?.hero?.cta || 'See plans & pricing →'}
            </button>
            <button
              onClick={() => document.getElementById('compare')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                background: 'transparent',
                color: C.muted, border: `2px solid ${C.border}`,
                borderRadius: 40, padding: '15px 24px',
                fontSize: 15, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all .2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.text; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
            >
              Why me?
            </button>
            <a
              href="/about"
              style={{
                background: 'transparent',
                color: C.muted, border: `2px solid ${C.border}`,
                borderRadius: 40, padding: '15px 24px',
                fontSize: 15, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all .2s', textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.text; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
            >
              About me
            </a>
          </motion.div>

          {/* Trust row — recent client work, folded in as a compact inline strip instead of floating bubbles */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.25, duration: 0.5 }}
            style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap', fontSize: 13, color: C.muted }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ color: C.green }}>✓</span> No obligation</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ color: C.green }}>✓</span> Hosting ₹0/mo</span>
            <span style={{ width: 1, height: 14, background: C.border }} />
            <span style={{ fontWeight: 700, color: C.text }}>Recent work:</span>
            {[
              { href: 'https://debarunghosh.netlify.app/', label: 'My Portfolio' },
              { href: 'https://sheetalchandel.com/', label: 'Sheetal Chandel', noPreview: true, previewImage: '/preview-sheetalchandel.jpg' },
              { href: 'https://woundcarebyaxcess.com/', label: 'Wound Care by Axcess' },
            ].map((l) => (
              <button
                key={l.href}
                onClick={() => setPreviewLink(l)}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', color: C.text, fontWeight: 600, fontSize: 13, textDecoration: 'none', borderBottom: `1px solid ${C.border}`, paddingBottom: 1 }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.text; }}
              >
                {l.label} →
              </button>
            ))}
            <span style={{ width: 1, height: 14, background: C.border }} />
            <a
              href="https://www.linkedin.com/in/debarunghosh2024/" target="_blank" rel="noopener noreferrer"
              style={{ color: C.muted, fontWeight: 600, textDecoration: 'none', borderBottom: `1px solid ${C.border}`, paddingBottom: 1 }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
            >
              Connect on LinkedIn →
            </a>
          </motion.div>

        </div>

        {/* MSME trust seal — pinned to the hero's corner like a storefront
            stamp, rather than sitting inline in the text (spins slowly,
            opens the certificate details on click; see MsmeBadge.jsx). */}
        <MsmeSeal
          size={110}
          className="hero-msme-seal"
          style={{ position: 'absolute', top: 'clamp(16px, 3vh, 28px)', right: 'clamp(16px, 3vw, 40px)', zIndex: 20 }}
        />
      </div>

      {/* ── Marquee ticker strips ──
           The track is built from exactly TWO halves so translateX(-50%)
           loops seamlessly (each item — incl. the last one of a half —
           carries its own trailing marginRight, so both halves are
           pixel-identical widths, no drift). Each half repeats the base
           word list enough times (STRIP_REPEAT) to stay wider than any
           realistic viewport — otherwise on wide screens the halves are
           narrower than the screen and a blank gap flashes before it loops. */}
      <div className="strip">
        <div className="strip-track">
          <StripHalves words={['PORTFOLIO', 'SMALL WEBSITE', 'PRO WEBSITE', '5–7 DAY DELIVERY', 'FREE HOSTING FOREVER']} />
        </div>
      </div>
      <div className="strip">
        <div className="strip-track rev">
          <StripHalves words={['NO SUBSCRIPTIONS', 'NO WATERMARKS', 'NO MONTHLY FEES', '2 FREE REVISIONS', '100% YOURS']} />
        </div>
      </div>

      {/* ── TESTIMONIALS ── */}
      <TestimonialsSection />

      {/* ── USPs — Concept A: numbered, hairline-grid cards touching edge to edge ── */}
      <div style={{ background: C.bg }}>
        <Section id="usps">
          <motion.div variants={fadeUp} style={{ marginBottom: 50 }}>
            <div style={{ fontSize: 13, color: C.accent, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>Why BespokeDeploy</div>
            <h2 style={{ fontFamily: C.fontDisplay, fontSize: 'clamp(28px, 3.6vw, 44px)', fontWeight: 800, color: C.text, letterSpacing: '-0.02em', maxWidth: 620, lineHeight: 1.05 }}>
              Four reasons this beats a template every time.
            </h2>
          </motion.div>
          <motion.div
            variants={fadeUp}
            style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              background: C.border, border: `1px solid ${C.border}`, gap: 1,
            }}
          >
            {USPS.map((u, i) => (
              <div key={u.title} style={{ background: C.surface, padding: '32px 26px' }}>
                <div style={{ fontFamily: C.fontDisplay, fontSize: 14, fontWeight: 700, color: C.accent, marginBottom: 34 }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div style={{ fontFamily: C.fontDisplay, fontSize: 19, fontWeight: 700, color: C.text, marginBottom: 10, letterSpacing: '-0.01em' }}>{u.title}</div>
                <div style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.6 }}>{u.desc}</div>
              </div>
            ))}
          </motion.div>
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
      <FAQTeaser />

      {/* ── FOOTER — Concept A: black band, giant ghost-text marquee behind the CTA ── */}
      <footer style={{ background: '#111111', color: '#F5F3EE', padding: 'clamp(56px, 12vw, 100px) clamp(20px, 5vw, 40px) clamp(36px, 6vw, 60px)', position: 'relative', overflow: 'hidden', zIndex: 1, isolation: 'isolate' }}>
        <div style={{
          position: 'absolute', top: '50%', left: 0, transform: 'translateY(-50%)',
          whiteSpace: 'nowrap', fontFamily: C.fontDisplay, fontWeight: 800,
          fontSize: 'clamp(56px, 14vw, 140px)', color: 'rgba(245,243,238,0.04)', animation: 'stripScroll 30s linear infinite', zIndex: 0,
        }}>
          LET'S BUILD SOMETHING EXTRAORDINARY — LET'S BUILD SOMETHING EXTRAORDINARY —
        </div>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h2 style={{ fontFamily: C.fontDisplay, fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 800, letterSpacing: '-0.02em', maxWidth: 640, lineHeight: 1.08, marginBottom: 30 }}>
            Ready to build something that actually looks bespoke?
          </h2>
          <button
            onClick={() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ background: C.accent, color: '#fff', border: 'none', borderRadius: 40, padding: '16px 32px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Start your project →
          </button>

          <div style={{ marginTop: 80, paddingTop: 28, borderTop: '1px solid rgba(245,243,238,0.15)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, fontSize: 12.5, color: 'rgba(245,243,238,0.45)' }}>
            <span>© 2026 BespokeDeploy.in · All prices in INR</span>
            <div style={{ display: 'flex', gap: 20 }}>
              <a href="/about" style={{ color: 'inherit', textDecoration: 'none' }}>About</a>
              <a href="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy Policy</a>
              <a href="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>Terms & Conditions</a>
            </div>
          </div>
        </div>
      </footer>

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

      {/* ── SITE PREVIEW MODAL ── */}
      <SitePreviewModal link={previewLink} onClose={() => setPreviewLink(null)} />
    </div>
  );
}
