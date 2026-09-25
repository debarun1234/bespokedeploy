import { useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { C, fadeUp, stagger } from '../theme';
import ContactBubble from './ContactBubble';
import MsmeBadge from './MsmeBadge';

const TITLE = 'About Debarun Ghosh — BespokeDeploy.in';
const DESC  = 'Solo web developer behind BespokeDeploy.in, based in Bengaluru. Full-stack websites built end-to-end, one client at a time.';

function useDocumentMeta(title, description) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;
    let meta = document.querySelector('meta[name="description"]');
    const prevDesc = meta?.getAttribute('content');
    if (meta) meta.setAttribute('content', description);
    return () => {
      document.title = prevTitle;
      if (meta && prevDesc != null) meta.setAttribute('content', prevDesc);
    };
  }, [title, description]);
}

// ─── Section wrapper with scroll animation (mirrors Landing.jsx's) ──────────
function Section({ children, id, style }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.section
      id={id} ref={ref}
      variants={stagger()} initial="hidden" animate={inView ? 'show' : 'hidden'}
      style={{ maxWidth: 900, margin: '0 auto', padding: '64px 24px', ...style }}
    >
      {children}
    </motion.section>
  );
}

const STACK = [
  { icon: '⚛️', name: 'React + Vite',        desc: 'Fast, modern frontends — no bloat.' },
  { icon: '☁️', name: 'Cloudflare Pages & Workers', desc: 'Edge hosting, serverless functions, free forever.' },
  { icon: '🗄️', name: 'D1 (SQLite)',          desc: 'Bookings, settings, waitlists — all queryable at the edge.' },
  { icon: '💳', name: 'Razorpay',             desc: 'Secure payments, server-verified, live order tracking.' },
  { icon: '✉️', name: 'Resend + WhatsApp API', desc: 'Automated email & WhatsApp updates at every project stage.' },
  { icon: '🎬', name: 'Framer Motion',        desc: 'The small animation details that make a site feel finished.' },
];

const WHY = [
  { icon: '🎯', title: 'Full attention, every project', desc: "I keep my workload deliberately limited so every client gets full attention — not split across a dozen accounts." },
  { icon: '🗣️', title: 'You talk to the builder',      desc: "No account managers, no relay chain. Every call, message, and revision goes through me directly." },
  { icon: '💰', title: 'Transparent, upfront pricing', desc: "The price you see is the price you pay. No hidden fees, no surprise add-ons after the fact." },
  { icon: '⚡', title: 'Free hosting, forever',        desc: "₹0/month on Cloudflare Pages or Netlify — for as long as your site is live." },
];

const WORK = [
  { name: 'Sheetal Chandel',       desc: 'Dietician & nutrition counseling site', url: 'https://sheetalchandel.com/' },
  { name: 'Wound Care by Axcess',  desc: 'Wound care service website',            url: 'https://woundcarebyaxcess.com/' },
  { name: 'insight-ai.dev',        desc: 'AI product landing page',               url: 'https://insight-ai.dev/' },
  { name: 'My Portfolio',          desc: 'Personal work & case studies',          url: 'https://debarunghosh.netlify.app/' },
];

export default function AboutPage() {
  useDocumentMeta(TITLE, DESC);
  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>

      {/* ── Nav ── */}
      <div style={{ borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, background: C.bg, zIndex: 50 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" style={{ fontSize: 16, fontWeight: 800, textDecoration: 'none' }}>
            <span style={{ color: C.accent }}>Bespoke</span><span style={{ color: C.text }}>Deploy</span><span style={{ color: C.accent }}>.</span><span style={{ color: C.text }}>in</span>
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ position: 'relative' }}>
            <a href="/" style={{ fontSize: 13.5, color: C.muted, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
              ← Back to home
            </a>
            <motion.span
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                fontSize: 11, color: C.muted, background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 20, padding: '5px 12px', whiteSpace: 'nowrap',
                boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
              }}
            >
              Goes to homepage — not your previous page
              <span style={{
                position: 'absolute', top: -5, right: 16, width: 9, height: 9,
                background: C.surface, borderLeft: `1px solid ${C.border}`, borderTop: `1px solid ${C.border}`,
                transform: 'rotate(45deg)',
              }} />
            </motion.span>
          </div>
          </div>
        </div>
      </div>

      {/* ── Hero ── */}
      <Section>
        <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 18 }}>
          <div style={{
            width: 140, height: 140, borderRadius: '50%', overflow: 'hidden',
            border: `3px solid ${C.accent}`, boxShadow: `0 0 0 8px ${C.accent}15, 0 20px 50px rgba(14,165,233,0.25)`,
          }}>
            <img src="/my_avatar.png" alt="Debarun Ghosh" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
          </div>
          <div>
            <h1 style={{ fontSize: 36, fontWeight: 900, color: C.text, letterSpacing: '-0.02em', marginBottom: 8 }}>Debarun Ghosh</h1>
            <div style={{ fontSize: 15, color: C.accent, fontWeight: 700, marginBottom: 10 }}>Solo Web Developer · Founder, BespokeDeploy.in</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: '6px 14px', fontSize: 13, color: C.muted }}>
              📍 Bengaluru, Karnataka, India
            </div>
          </div>
          <MsmeBadge />
          <p style={{ fontSize: 16.5, color: C.muted, lineHeight: 1.75, maxWidth: 560 }}>
            I design and build custom websites end-to-end — one client at a time, so every project gets the attention it deserves.
          </p>
        </motion.div>
      </Section>

      {/* ── My story ── */}
      <Section>
        <motion.div variants={fadeUp}>
          <div style={{ fontSize: 13, color: C.accent, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>My story</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 15.5, color: C.dim, lineHeight: 1.85 }}>
            <p>
              I'm currently balancing three things at once — a full-time job, a Master's degree, and BespokeDeploy on the side. That might sound like a lot, but it's exactly why I run this the way I do: I don't take on more than I can genuinely commit to.
            </p>
            <p>
              What started as building sites for people I knew turned into something I take seriously — not as a side hustle I rush through, but as a craft I care about getting right, even with a full plate. If I'm going to put my name on it, it has to actually work: fast, clean, and built to last past launch day.
            </p>
            <p>
              That's also why I keep my project load deliberately limited. I'd rather do fewer sites well than take on everything and deliver something average. If you work with me, you're working with the person who actually writes the code — not a sales team handing you off to a developer you'll never talk to.
            </p>
          </div>
        </motion.div>
      </Section>

      {/* ── Stack ── */}
      <Section style={{ background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, maxWidth: 'none', padding: '64px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <motion.div variants={fadeUp} style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 13, color: C.accent, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>What I build with</div>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>Full-stack, not just front-end</h2>
            <p style={{ fontSize: 14.5, color: C.muted, marginTop: 10, maxWidth: 560, lineHeight: 1.6 }}>
              This site runs on the exact same stack I build for clients — so what you see here is what you get.
            </p>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14 }}>
            {STACK.map((s) => (
              <motion.div key={s.name} variants={fadeUp} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
                <div style={{ fontSize: 22, marginBottom: 10 }}>{s.icon}</div>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: C.text, marginBottom: 4 }}>{s.name}</div>
                <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.5 }}>{s.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Why work with me ── */}
      <Section>
        <motion.div variants={fadeUp} style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 13, color: C.accent, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Why work with me</div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>Not an agency. Not a template farm.</h2>
        </motion.div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {WHY.map((w) => (
            <motion.div key={w.title} variants={fadeUp} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '22px 24px' }}>
              <div style={{ fontSize: 24, marginBottom: 10 }}>{w.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>{w.title}</div>
              <div style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.6 }}>{w.desc}</div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── Recent work ── */}
      <Section style={{ background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, maxWidth: 'none', padding: '64px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <motion.div variants={fadeUp} style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 13, color: C.accent, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Recent work</div>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>Sites I've built and shipped</h2>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            {WORK.map((w) => (
              <motion.a
                key={w.name} href={w.url} target="_blank" rel="noopener noreferrer" variants={fadeUp}
                style={{
                  background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: '20px 22px',
                  textDecoration: 'none', display: 'block', transition: 'border-color .2s',
                }}
                whileHover={{ y: -3 }}
              >
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>{w.name}</div>
                <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 10 }}>{w.desc}</div>
                <div style={{ fontSize: 12.5, color: C.accent, fontWeight: 600 }}>Visit site →</div>
              </motion.a>
            ))}
          </div>
        </div>
      </Section>

      {/* ── CTA ── */}
      <Section>
        <motion.div variants={fadeUp} style={{
          textAlign: 'center', background: `linear-gradient(135deg, ${C.accent}15, ${C.accent}05)`,
          border: `1px solid ${C.accent}30`, borderRadius: 20, padding: '48px 32px',
        }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: C.text, marginBottom: 10 }}>Got a project in mind?</h2>
          <p style={{ fontSize: 14.5, color: C.muted, marginBottom: 24, maxWidth: 460, margin: '0 auto 24px' }}>
            Let's talk about what you need — reach out and I'll get back to you within 24 hours.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/#plans" style={{
              background: `linear-gradient(135deg, ${C.accent}, #38BDF8)`, color: '#fff', border: 'none', borderRadius: 13,
              padding: '14px 28px', fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 24px rgba(14,165,233,0.3)',
            }}>
              See Plans & Pricing
            </a>
            <a href="https://www.linkedin.com/in/debarunghosh2024/" target="_blank" rel="noopener noreferrer" style={{
              background: 'transparent', color: C.muted, border: `1px solid ${C.border}`, borderRadius: 13,
              padding: '14px 24px', fontSize: 14.5, fontWeight: 600, textDecoration: 'none',
            }}>
              Connect on LinkedIn
            </a>
          </div>
        </motion.div>
      </Section>

      {/* ── Footer ── */}
      <footer style={{ padding: '32px 24px', textAlign: 'center', borderTop: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 12, color: C.muted }}>© 2026 BespokeDeploy.in · Bengaluru, Karnataka, India</div>
      </footer>

      <ContactBubble />
    </div>
  );
}
