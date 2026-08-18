// ─── Design Tokens ───────────────────────────────────────
// Base colors switch via CSS vars (dark/light toggle).
// Accent stays sky-blue hex — works with ${C.accent}xx opacity trick.
export const C = {
  bg:          'var(--c-bg)',
  surface:     'var(--c-surface)',
  surface2:    'var(--c-surface2)',
  border:      'var(--c-border)',
  borderFaint: 'var(--c-border-faint)',   // replaces ${C.border}22 patterns
  accent:      '#0EA5E9',                 // Sky blue — hex for opacity compat
  accentLt:    'rgba(14,165,233,0.12)',
  pink:        '#EC4899',
  green:       '#10B981',
  yellow:      '#F59E0B',
  red:         '#EF4444',
  text:        'var(--c-text)',
  muted:       'var(--c-muted)',
  dim:         'var(--c-dim)',
};

// ─── Shared motion variants ───────────────────────────────
export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export const stagger = (delay = 0.08) => ({
  hidden: {},
  show:   { transition: { staggerChildren: delay, delayChildren: 0.15 } },
});

export const slideIn = (dir = 1) => ({
  hidden: { opacity: 0, x: dir * 30 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
});

// ─── Shared style helpers ────────────────────────────────
export const card = (extra = {}) => ({
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: 16,
  ...extra,
});

export const btn = (color = C.accent, variant = 'solid') =>
  variant === 'solid'
    ? {
        background: `linear-gradient(135deg, ${color}, ${color}CC)`,
        color: '#fff',
        border: 'none',
        borderRadius: 12,
        padding: '14px 24px',
        fontSize: 15,
        fontWeight: 700,
        cursor: 'pointer',
        letterSpacing: '0.01em',
        transition: 'opacity .2s, transform .15s',
      }
    : {
        background: `${color}15`,
        color,
        border: `1px solid ${color}40`,
        borderRadius: 12,
        padding: '14px 24px',
        fontSize: 15,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all .2s',
      };

// ─── Helpers ─────────────────────────────────────────────
export const fmt = (n) => Number(n).toLocaleString('en-IN');
