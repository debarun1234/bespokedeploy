import { motion } from 'framer-motion';
import { C, fmt } from '../theme';

const STEPS = ['Add Features', 'Your Details', 'Review & Pay'];

export default function ProgressBar({ stepIndex, plan, onBack }) {
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 200,
      background: `${C.surface}F0`,
      backdropFilter: 'blur(16px)',
      borderBottom: `1px solid ${C.border}`,
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
    }}>
      {/* Back */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={onBack}
          style={{
            background: 'transparent', border: `1px solid ${C.border}`,
            color: C.muted, borderRadius: 8, padding: '6px 14px',
            fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
            transition: 'color .2s, border-color .2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = C.text; e.currentTarget.style.borderColor = C.dim; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.border; }}
        >
          ← Back
        </button>
        <motion.span
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: 'calc(100% + 10px)', left: 0,
            fontSize: 11, color: C.muted, background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 20, padding: '5px 12px', whiteSpace: 'nowrap',
            boxShadow: '0 6px 16px rgba(0,0,0,0.2)', zIndex: 201,
          }}
        >
          Goes to the previous step — not your browser's previous page
          <span style={{
            position: 'absolute', top: -5, left: 16, width: 9, height: 9,
            background: C.surface, borderLeft: `1px solid ${C.border}`, borderTop: `1px solid ${C.border}`,
            transform: 'rotate(45deg)',
          }} />
        </motion.span>
      </div>

      {/* Steps */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 0, overflow: 'hidden' }}>
        {STEPS.map((label, i) => {
          const done    = i < stepIndex;
          const active  = i === stepIndex;
          const color   = done || active ? (plan?.color || C.accent) : C.border;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <motion.div
                  animate={{ background: done ? color : active ? color : C.surface2, borderColor: color }}
                  style={{
                    width: 24, height: 24, borderRadius: '50%',
                    border: `2px solid ${color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
                    color: done || active ? '#fff' : C.muted,
                    transition: 'all .3s',
                  }}
                >
                  {done ? '✓' : i + 1}
                </motion.div>
                <span style={{
                  fontSize: 12.5, fontWeight: active ? 600 : 400,
                  color: active ? C.text : done ? C.dim : C.muted,
                  whiteSpace: 'nowrap',
                  display: window.innerWidth < 500 && !active ? 'none' : 'block',
                }}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 1, margin: '0 8px', background: C.border, minWidth: 12, position: 'relative', overflow: 'hidden' }}>
                  <motion.div
                    animate={{ width: done ? '100%' : '0%' }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    style={{ position: 'absolute', top: 0, left: 0, height: '100%', background: plan?.color || C.accent }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Plan pill */}
      {plan && (
        <div style={{
          background: `${plan.color}20`, border: `1px solid ${plan.color}40`,
          borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600,
          color: plan.color, whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          {plan.name} · ₹{fmt(plan.price)}
        </div>
      )}
    </div>
  );
}
