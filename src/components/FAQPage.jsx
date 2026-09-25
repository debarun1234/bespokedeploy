import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { C, fadeUp, stagger } from '../theme';

// ─── FAQ content — same questions previously shown inline on Landing,
// now living on their own route (/faq) per the site's URL-per-page structure.
const FAQ_GROUPS = [
  {
    title: 'Placing an order',
    items: [
      { q: 'How do I choose the right plan?', a: 'Portfolio suits individuals and students, Small Website suits local businesses and professionals, and Pro Website suits growing businesses that need more pages and functionality. Use the "Help me pick" quiz above the plans if you\'re unsure, or message me directly via the contact bubble.' },
      { q: 'What happens right after I pay the advance?', a: 'Your slot is locked in immediately. I\'ll reach out within 24 hours by call or WhatsApp to discuss your content, structure, and any references you have in mind.' },
      { q: 'Can I switch plans or add features after booking?', a: 'Yes — just let me know during our first conversation and I\'ll adjust your quote and balance accordingly before any build work starts.' },
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

export default function FAQPage() {
  const [openKey, setOpenKey] = useState(null);

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      {/* Nav */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 30,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 40px', borderBottom: `1px solid ${C.borderFaint}`,
        background: 'rgba(var(--c-bg-rgb), 0.85)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
      }}>
        <a href="/" style={{ fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 19, letterSpacing: '-0.01em', color: C.text, textDecoration: 'none' }}>
          BespokeDeploy<span style={{ color: C.accent }}>.</span>
        </a>
        <a href="/" style={{ fontSize: 13.5, fontWeight: 600, color: C.muted, textDecoration: 'none' }}>← Back home</a>
      </div>

      <motion.div
        variants={stagger(0.06)}
        initial="hidden"
        animate="show"
        style={{ maxWidth: 820, margin: '0 auto', padding: '64px 24px 100px' }}
      >
        <motion.div variants={fadeUp} style={{ marginBottom: 50 }}>
          <div style={{ fontSize: 13, color: C.accent, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>Questions</div>
          <h1 style={{ fontFamily: C.fontDisplay, fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 800, color: C.text, letterSpacing: '-0.03em', lineHeight: 1.02 }}>
            Before you ask.
          </h1>
        </motion.div>

        {FAQ_GROUPS.map((group) => (
          <motion.div key={group.title} variants={fadeUp} style={{ marginBottom: 46 }}>
            <div style={{ fontFamily: C.fontDisplay, fontSize: 13, color: C.accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, paddingBottom: 14, borderBottom: `2px solid ${C.text}` }}>
              {group.title}
            </div>
            {group.items.map((item, i) => {
              const key = `${group.title}-${i}`;
              const isOpen = openKey === key;
              return (
                <div key={key} className="faq-item" style={{ borderBottom: `1px solid ${C.borderFaint}` }}>
                  <button
                    onClick={() => setOpenKey(isOpen ? null : key)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20,
                      background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                      padding: '20px 0', fontFamily: 'inherit',
                    }}
                  >
                    <span style={{ fontFamily: C.fontDisplay, fontSize: 16.5, fontWeight: 700, color: C.text }}>{item.q}</span>
                    <motion.span
                      animate={{ rotate: isOpen ? 45 : 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ flexShrink: 0, fontSize: 24, fontWeight: 400, color: C.accent, lineHeight: 1 }}
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
                        <div style={{ padding: '0 0 20px', fontSize: 14, color: C.muted, lineHeight: 1.7, maxWidth: 680 }}>
                          {item.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </motion.div>
        ))}

        <motion.div variants={fadeUp} style={{ marginTop: 20, textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: C.muted, marginBottom: 18 }}>Still have a question?</p>
          <a
            href="/"
            style={{ display: 'inline-block', background: C.accent, color: '#fff', borderRadius: 40, padding: '14px 30px', fontSize: 14.5, fontWeight: 700, textDecoration: 'none' }}
          >
            Back to pricing →
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
}
