import { motion } from 'framer-motion';
import { C, fadeUp, stagger } from '../theme';

// ─── Legal content — previously a modal on Landing, now living on its own
// routes (/privacy, /terms) per the site's URL-per-page structure, and
// themed with the shared `C` tokens instead of the old hardcoded dark-purple
// palette so it actually matches the rest of the site.
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
        body: `You may request access to, correction of, or deletion of personal data we hold about you by emailing contact@bespokedeploy.in. We will respond within 30 days. Note that some data (e.g. payment/transaction records) may need to be retained regardless of a deletion request, where required by law.`,
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
        body: `For privacy-related queries: contact@bespokedeploy.in`,
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
        body: `For any queries regarding these Terms: contact@bespokedeploy.in`,
      },
    ],
  },
};

export default function LegalPage({ doc }) {
  const content = LEGAL[doc] || LEGAL.privacy;
  const other = doc === 'privacy'
    ? { href: '/terms', label: 'Terms & Conditions' }
    : { href: '/privacy', label: 'Privacy Policy' };

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
        style={{ maxWidth: 780, margin: '0 auto', padding: '64px 24px 100px' }}
      >
        <motion.div variants={fadeUp} style={{ marginBottom: 50 }}>
          <div style={{ fontSize: 13, color: C.accent, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>Legal</div>
          <h1 style={{ fontFamily: C.fontDisplay, fontSize: 'clamp(30px, 4.6vw, 48px)', fontWeight: 800, color: C.text, letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 10 }}>
            {content.title}
          </h1>
          <div style={{ fontSize: 12.5, color: C.muted }}>{content.effective}</div>
        </motion.div>

        <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
          {content.sections.map((s) => (
            <div key={s.heading} style={{ paddingBottom: 26, borderBottom: `1px solid ${C.borderFaint}` }}>
              <div style={{ fontFamily: C.fontDisplay, fontSize: 13.5, fontWeight: 700, color: C.accent, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {s.heading}
              </div>
              <div style={{ fontSize: 14, color: C.dim, lineHeight: 1.8, whiteSpace: 'pre-line' }}>{s.body}</div>
            </div>
          ))}
        </motion.div>

        <motion.div variants={fadeUp} style={{ marginTop: 20, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>
            © 2026 BespokeDeploy · bespokedeploy.in · contact@bespokedeploy.in
          </p>
          <a href={other.href} style={{ fontSize: 13.5, fontWeight: 600, color: C.text, textDecoration: 'underline', textUnderlineOffset: 3 }}>
            Read our {other.label} →
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
}
