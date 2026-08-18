import { motion, AnimatePresence } from 'framer-motion';
import { C, fadeUp, stagger, fmt } from '../theme';
import { PLAN_ICONS } from '../data/planIcons';

// ─── Single addon card ────────────────────────────────────
function AddonCard({ addon, selected, color, onToggle }) {
  return (
    <motion.div
      layout
      variants={fadeUp}
      onClick={() => onToggle(addon)}
      whileHover={{ scale: 1.015, transition: { duration: 0.2 } }}
      style={{
        background: selected ? `${color}12` : C.surface2,
        border: selected ? `1.5px solid ${color}` : `1px solid ${C.border}`,
        borderRadius: 13, padding: '16px 18px',
        cursor: 'pointer', transition: 'all .2s',
        display: 'flex', alignItems: 'flex-start', gap: 13,
        boxShadow: selected ? `0 0 20px ${color}18` : 'none',
      }}
    >
      {/* Checkbox */}
      <motion.div
        animate={{
          background: selected ? color : 'transparent',
          borderColor: selected ? color : C.border,
          scale: selected ? [1, 1.2, 1] : 1,
        }}
        transition={{ duration: 0.2 }}
        style={{
          width: 20, height: 20, borderRadius: 6,
          border: `2px solid ${selected ? color : C.border}`,
          flexShrink: 0, marginTop: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <AnimatePresence>
          {selected && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              style={{ color: '#fff', fontSize: 12, fontWeight: 900, lineHeight: 1 }}
            >
              ✓
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: selected ? C.text : C.dim, marginBottom: 3 }}>
          {addon.name}
        </div>
        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.45 }}>{addon.desc}</div>
      </div>

      <div style={{
        fontSize: 13.5, fontWeight: 700, color: selected ? color : C.muted,
        whiteSpace: 'nowrap', flexShrink: 0,
      }}>
        +₹{fmt(addon.price)}
      </div>
    </motion.div>
  );
}

// ─── Hosting Picker (Portfolio only) ─────────────────────
const HOSTING_OPTIONS = [
  {
    id: 'netlify',
    label: 'Netlify',
    badge: '⭐ Recommended',
    badgeColor: '#10B981',
    url: 'yourname.netlify.app',
    desc: 'Fast global CDN · Zero setup · Free forever',
    icon: '🌿',
  },
  {
    id: 'cloudflare',
    label: 'Cloudflare Pages',
    badge: '🛡️ Bot protection',
    badgeColor: '#F59E0B',
    url: 'yourname.pages.dev',
    desc: 'Unlimited bandwidth · 300+ CDN nodes · DDoS shield · Bot protection · Free SSL',
    icon: '☁️',
  },
];

function HostingPicker({ hostingChoice, onSetHosting, planColor }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 12, color: C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
        🌐 Choose your hosting platform
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {HOSTING_OPTIONS.map((opt) => {
          const active = hostingChoice === opt.id;
          return (
            <motion.div
              key={opt.id}
              onClick={() => onSetHosting(opt.id)}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              style={{
                background: active ? `${planColor}12` : C.surface2,
                border: active ? `1.5px solid ${planColor}` : `1px solid ${C.border}`,
                borderRadius: 13, padding: '16px 18px',
                cursor: 'pointer', transition: 'all .2s',
                boxShadow: active ? `0 0 20px ${planColor}18` : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 18 }}>{opt.icon}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: active ? C.text : C.dim }}>{opt.label}</span>
                {active && (
                  <motion.span
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    style={{ marginLeft: 'auto', width: 18, height: 18, borderRadius: '50%', background: planColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 900, flexShrink: 0 }}
                  >✓</motion.span>
                )}
              </div>
              <div style={{ fontSize: 11.5, color: opt.badgeColor, fontWeight: 600, marginBottom: 5 }}>{opt.badge}</div>
              <div style={{ fontSize: 11.5, color: C.muted, fontFamily: 'monospace', marginBottom: 5, background: `${C.bg}`, borderRadius: 6, padding: '3px 7px', display: 'inline-block' }}>
                {opt.url}
              </div>
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.45, marginTop: 4 }}>{opt.desc}</div>
            </motion.div>
          );
        })}
      </div>
      <div style={{ fontSize: 12, color: C.muted, marginTop: 8, lineHeight: 1.5 }}>
        Both are <strong style={{ color: C.text }}>free forever</strong>. You can also buy a custom domain and point it to either platform.
      </div>
    </div>
  );
}

// ─── Hosting Info Card (Small/Pro plans) ─────────────────
function HostingInfoCard() {
  return (
    <div style={{
      background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)',
      borderRadius: 13, padding: '16px 20px', marginBottom: 28,
      display: 'flex', gap: 14, alignItems: 'flex-start',
    }}>
      <span style={{ fontSize: 24, flexShrink: 0 }}>☁️</span>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text, marginBottom: 4 }}>Cloudflare Pages — Included Free</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', fontSize: 12, color: C.muted }}>
          {['Unlimited bandwidth', 'Free SSL', 'DDoS shield', 'Bot protection', '300+ global CDN nodes', '20,000 files supported', '100 custom domains'].map((f) => (
            <span key={f} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: '#F59E0B' }}>✓</span> {f}
            </span>
          ))}
        </div>
        <div style={{ fontSize: 11.5, color: C.muted, marginTop: 8 }}>
          Live at <span style={{ fontFamily: 'monospace', background: C.bg, borderRadius: 5, padding: '2px 6px' }}>yourname.pages.dev</span> — point a custom domain anytime. No traffic limits, no surprises.
        </div>
      </div>
    </div>
  );
}

// ─── AddonStep ────────────────────────────────────────────
export default function AddonStep({ plan, selectedAddons, hostingChoice, total, advance, advancePct, onToggle, onSetHosting, onNext }) {
  const selectedCount = Object.keys(selectedAddons).length;
  const isPortfolio = plan.id === 'portfolio';

  // Label shown in sidebar
  const hostingLabel = isPortfolio
    ? (hostingChoice === 'netlify' ? '🌿 Netlify (yourname.netlify.app)' : '☁️ Cloudflare Pages (yourname.pages.dev)')
    : '☁️ Cloudflare Pages';

  return (
    <div style={{ minHeight: '100vh', padding: '40px 24px 80px', maxWidth: 1200, margin: '0 auto' }}>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        style={{ marginBottom: 40 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ display: 'flex', alignItems: 'center' }}>{PLAN_ICONS[plan.id]?.(plan.color)}</span>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: C.text }}>{plan.name} Plan</h1>
          <span style={{ background: `${plan.color}20`, color: plan.color, border: `1px solid ${plan.color}40`, borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700 }}>
            ₹{fmt(plan.price)} base
          </span>
        </div>
        <p style={{ color: C.muted, fontSize: 15 }}>
          {plan.inheritsFrom
            ? <>All of <strong style={{ color: plan.color }}>{plan.inheritsFrom}</strong> is included, plus the features below. Select any extras on top.</>
            : <>Everything below is <strong style={{ color: plan.color }}>already included</strong>. Select any extras you want on top.</>
          }
        </p>
      </motion.div>

      <div className="addon-layout" style={{ alignItems: 'flex-start' }}>

        {/* Left: Included + Add-ons */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Hosting picker / info */}
          {isPortfolio
            ? <HostingPicker hostingChoice={hostingChoice} onSetHosting={onSetHosting} planColor={plan.color} />
            : <HostingInfoCard />
          }

          {/* Included features */}
          <div style={{ background: `${plan.color}08`, border: `1px solid ${plan.color}25`, borderRadius: 16, padding: '24px', marginBottom: 28 }}>
            <div style={{ fontSize: 12, color: plan.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
              ✓ What's included in your plan
            </div>

            {plan.inheritsFrom ? (
              <>
                {/* "Everything from X" pill */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: `${plan.color}18`, border: `1px solid ${plan.color}40`,
                  borderRadius: 8, padding: '7px 14px', marginBottom: 16,
                }}>
                  <span style={{ color: plan.color, fontSize: 14 }}>✦</span>
                  <span style={{ fontSize: 13, color: plan.color, fontWeight: 700 }}>
                    Everything in {plan.inheritsFrom}, plus:
                  </span>
                </div>
                {/* Extras grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px 20px', marginBottom: 16 }}>
                  {plan.extras.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13.5, color: C.dim }}>
                      <span style={{ color: plan.color, fontSize: 12, flexShrink: 0, marginTop: 2 }}>✓</span>
                      {item}
                    </div>
                  ))}
                </div>
                {/* Collapsed full list */}
                <details style={{ marginTop: 4 }}>
                  <summary style={{ fontSize: 12, color: C.muted, cursor: 'pointer', userSelect: 'none', listStyle: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: plan.color, fontSize: 11 }}>▸</span>
                    See all {plan.included.length} included features
                  </summary>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '7px 20px', marginTop: 12, paddingTop: 12, borderTop: `1px solid ${plan.color}20` }}>
                    {plan.included.map((item, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: C.muted }}>
                        <span style={{ color: plan.color, fontSize: 11, flexShrink: 0, marginTop: 2, opacity: 0.6 }}>✓</span>
                        {item}
                      </div>
                    ))}
                  </div>
                </details>
              </>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px 20px' }}>
                {plan.included.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13.5, color: C.dim }}>
                    <span style={{ color: plan.color, fontSize: 12, flexShrink: 0, marginTop: 2 }}>✓</span>
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add-ons */}
          <div style={{ fontSize: 12, color: C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
            ⚡ Available add-ons ({plan.addons.length})
          </div>
          <motion.div
            variants={stagger(0.05)}
            initial="hidden"
            animate="show"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}
          >
            {plan.addons.map((addon) => (
              <AddonCard
                key={addon.id}
                addon={addon}
                selected={!!selectedAddons[addon.id]}
                color={plan.color}
                onToggle={onToggle}
              />
            ))}
          </motion.div>
        </div>

        {/* Right: Live Summary */}
        <div
          className="summary-sidebar"
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          {/* Total card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '22px' }}
          >
            <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Total Estimate</div>
            <motion.div
              key={total}
              initial={{ scale: 0.95, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                fontSize: 36, fontWeight: 900, letterSpacing: '-0.02em',
                background: `linear-gradient(135deg, ${plan.color}, ${plan.color}90)`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}
            >
              ₹{fmt(total)}
            </motion.div>

            <div style={{ borderTop: `1px solid ${C.border}`, margin: '14px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
              <span style={{ color: C.muted }}>Base plan</span>
              <span style={{ color: C.text, fontWeight: 500 }}>₹{fmt(plan.price)}</span>
            </div>
            {Object.values(selectedAddons).map((a) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}
              >
                <span style={{ color: C.muted, flex: 1, marginRight: 8 }}>{a.name}</span>
                <span style={{ color: plan.color, fontWeight: 500, flexShrink: 0 }}>+₹{fmt(a.price)}</span>
              </motion.div>
            ))}

            <div style={{ borderTop: `1px solid ${C.border}`, margin: '10px 0 10px' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
              <span style={{ color: C.muted }}>Advance ({advancePct * 100}%)</span>
              <span style={{ color: C.yellow, fontWeight: 700 }}>₹{fmt(advance)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: C.muted }}>On delivery</span>
              <span style={{ color: C.green, fontWeight: 700 }}>₹{fmt(total - advance)}</span>
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 8, lineHeight: 1.5 }}>
              20% advance for under ₹15k · 30% for ₹15k+
            </div>
          </motion.div>

          {/* Terms */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px 18px', fontSize: 12.5, color: C.muted, lineHeight: 1.7 }}>
            <div style={{ marginBottom: 2 }}>
              <span style={{ color: C.text, fontWeight: 600 }}>Hosting</span>{' '}
              <span style={{ color: '#10B981' }}>{hostingLabel}</span>
            </div>
            <div><span style={{ color: C.text, fontWeight: 600 }}>Cost</span> ₹0/month forever</div>
            <div><span style={{ color: C.text, fontWeight: 600 }}>Domain</span> Optional — you pay direct</div>
            <div><span style={{ color: C.text, fontWeight: 600 }}>Revisions</span> 2 free · ₹500/round after</div>
            <div><span style={{ color: C.text, fontWeight: 600 }}>Delivery</span> {plan.delivery}</div>
          </div>

          {/* CTA */}
          <button
            onClick={onNext}
            style={{
              background: `linear-gradient(135deg, ${plan.color}, ${plan.color}CC)`,
              color: '#fff', border: 'none', borderRadius: 13,
              padding: '16px', fontSize: 15, fontWeight: 700,
              cursor: 'pointer', width: '100%', fontFamily: 'inherit',
              boxShadow: `0 6px 24px ${plan.color}30`,
              transition: 'transform .2s, box-shadow .2s',
              letterSpacing: '0.01em',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 10px 32px ${plan.color}40`; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `0 6px 24px ${plan.color}30`; }}
          >
            Continue → ₹{fmt(total)}
            {selectedCount > 0 && <span style={{ fontSize: 12, opacity: 0.8, display: 'block', fontWeight: 400, marginTop: 2 }}>({selectedCount} add-on{selectedCount > 1 ? 's' : ''} selected)</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
