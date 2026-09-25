import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { C } from '../theme';

// Details pulled from the actual certificate (public/udyam-registration-certificate.pdf)
const CERT = {
  number:   'UDYAM-KR-03-0763553',
  name:     'BESPOKEDEPLOY',
  type:     'Micro',
  activity: 'Services — Computer programming, consultancy & webpage designing',
  since:    '23 September 2026',
};

// ─── Modal: shown in-page, no navigation away ────────────────────────────
export function MsmeModal({ onClose }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 14, scale: 0.97 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: 'min(480px, 94vw)', background: C.surface,
          border: '1.5px solid rgba(16,185,129,0.4)',
          borderRadius: 22, padding: '32px 30px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.45), 0 0 0 1px rgba(16,185,129,0.08)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ position: 'relative', flexShrink: 0 }}>
              <img src="/msme-logo.png" alt="" style={{ width: 48, height: 48, borderRadius: '50%', background: '#fff', objectFit: 'contain', padding: 3 }} />
              <span style={{
                position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: '50%',
                background: C.green, border: `2px solid ${C.surface}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, color: '#fff', fontWeight: 900,
              }}>✓</span>
            </span>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: C.green }}>Udyam Registered</div>
              <div style={{ fontSize: 12, color: C.muted }}>Government of India · Ministry of MSME</div>
            </div>
          </div>
          <button
            onClick={onClose} aria-label="Close"
            style={{ background: 'transparent', border: `1px solid ${C.borderFaint}`, borderRadius: 10, width: 34, height: 34, cursor: 'pointer', fontSize: 17, color: C.muted, flexShrink: 0 }}
          >×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderRadius: 14, overflow: 'hidden', border: `1px solid ${C.borderFaint}` }}>
          {[
            ['Udyam Registration No.', CERT.number, true],
            ['Enterprise Name', CERT.name],
            ['Enterprise Type', CERT.type],
            ['Major Activity', CERT.activity],
            ['Registered Since', CERT.since],
          ].map(([label, value, mono], i) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '11px 14px', background: i % 2 ? 'transparent' : C.surface2, fontSize: 12.5 }}>
              <span style={{ color: C.muted }}>{label}</span>
              <span style={{ color: C.text, fontWeight: 600, textAlign: 'right', fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</span>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, marginTop: 18 }}>
          This is a genuine Udyam registration issued by the Ministry of MSME, Government of India. You're welcome to verify it independently at{' '}
          <a href="https://udyamregistration.gov.in" target="_blank" rel="noopener noreferrer" style={{ color: C.accent }}>udyamregistration.gov.in</a>.
        </p>

        <a
          href="/udyam-registration-certificate.pdf"
          target="_blank" rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            marginTop: 18, padding: '12px', borderRadius: 12, textDecoration: 'none',
            background: `linear-gradient(135deg, ${C.green}, #0ea56f)`, color: '#fff', fontWeight: 700, fontSize: 13.5,
          }}
        >
          ⬇ Open Full Certificate (PDF)
        </a>
      </motion.div>
    </motion.div>
  );
}

// ─── The badge itself — a real button, opens the modal above rather than
// navigating away, and sized/styled to read as a deliberate trust element
// rather than a small tucked-away pill. ───────────────────────────────────
export default function MsmeBadge({ compact = false }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.015, y: -2 }}
        whileTap={{ scale: 0.99 }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: compact ? 12 : 16,
          background: 'linear-gradient(135deg, rgba(16,185,129,0.14), rgba(16,185,129,0.05))',
          border: '1.5px solid rgba(16,185,129,0.45)',
          boxShadow: '0 8px 28px rgba(16,185,129,0.18)',
          borderRadius: 18,
          padding: compact ? '10px 20px 10px 10px' : '14px 26px 14px 12px',
          cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
          transition: 'box-shadow .2s, border-color .2s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(16,185,129,0.8)'; e.currentTarget.style.boxShadow = '0 10px 34px rgba(16,185,129,0.3)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(16,185,129,0.45)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(16,185,129,0.18)'; }}
      >
        <span style={{ position: 'relative', flexShrink: 0 }}>
          <img
            src="/msme-logo.png" alt="Udyam / MSME Registered"
            style={{ width: compact ? 34 : 44, height: compact ? 34 : 44, borderRadius: '50%', background: '#fff', objectFit: 'contain', padding: 3 }}
          />
          <span style={{
            position: 'absolute', bottom: -3, right: -3,
            width: compact ? 16 : 19, height: compact ? 16 : 19, borderRadius: '50%',
            background: C.green, border: `2px solid ${C.bg}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: compact ? 9 : 10.5, color: '#fff', fontWeight: 900, lineHeight: 1,
          }}>✓</span>
        </span>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: compact ? 13.5 : 15.5, fontWeight: 800, color: C.green, letterSpacing: '-0.01em' }}>
            ✓ Udyam Registered (MSME)
          </span>
          <span style={{ fontSize: compact ? 11 : 12, color: C.muted, fontFamily: 'monospace' }}>{CERT.number}</span>
          <span style={{ fontSize: compact ? 11 : 12, color: C.dim, fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 2 }}>
            Tap to verify — see certificate →
          </span>
        </span>
      </motion.button>

      <AnimatePresence>
        {open && <MsmeModal onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  );
}

// ─── Seal — a rotating "official stamp" badge for pinning in a corner ─────
// (e.g. the hero section) rather than sitting inline in a text row. Circular
// text spins slowly around a static center logo, like a trust seal on a
// storefront — meant to be seen, not read carefully.
const SEAL_TEXT = '★ UDYAM REGISTERED ★ GOVT. OF INDIA ★ MSME VERIFIED ';

export function MsmeSeal({ size = 116, style, className }) {
  const [open, setOpen] = useState(false);
  const uid = 'msme-seal-ring';

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Udyam Registered (MSME) — tap to view certificate"
        className={className}
        initial={{ opacity: 0, scale: 0.8, rotate: -8 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ delay: 1.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.96 }}
        style={{
          position: 'relative', width: size, height: size, flexShrink: 0,
          border: 'none', background: 'transparent', cursor: 'pointer', padding: 0,
          ...style,
        }}
      >
        {/* Pulsing glow behind the seal */}
        <span
          style={{
            position: 'absolute', inset: -10, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16,185,129,0.35) 0%, rgba(16,185,129,0) 70%)',
            animation: 'msme-seal-pulse 2.6s ease-in-out infinite',
          }}
        />
        {/* Rotating circular text ring */}
        <svg viewBox="0 0 200 200" width="100%" height="100%" style={{ position: 'absolute', inset: 0, animation: 'msme-seal-spin 14s linear infinite' }}>
          <defs>
            <path id={uid} d="M 100,100 m -78,0 a 78,78 0 1,1 156,0 a 78,78 0 1,1 -156,0" />
          </defs>
          <circle cx="100" cy="100" r="96" fill="none" stroke="rgba(16,185,129,0.5)" strokeWidth="1.5" />
          <text fill="#10B981" fontSize="12.5" fontWeight="800" letterSpacing="1.5">
            <textPath href={`#${uid}`} startOffset="0%">{SEAL_TEXT.repeat(2)}</textPath>
          </text>
        </svg>
        {/* Static center medallion */}
        <span style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '56%', height: '56%', borderRadius: '50%',
          background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.35), 0 0 0 3px rgba(16,185,129,0.5)',
        }}>
          <img src="/msme-logo.png" alt="" style={{ width: '78%', height: '78%', objectFit: 'contain' }} />
        </span>
        {/* Verified check */}
        <span style={{
          position: 'absolute', bottom: '6%', right: '6%',
          width: '22%', height: '22%', minWidth: 18, minHeight: 18, borderRadius: '50%',
          background: C.green, border: `2px solid ${C.bg}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.11, color: '#fff', fontWeight: 900, lineHeight: 1,
        }}>✓</span>
      </motion.button>

      <style>{`
        @keyframes msme-seal-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes msme-seal-pulse { 0%, 100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.12); } }
      `}</style>

      <AnimatePresence>
        {open && <MsmeModal onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
