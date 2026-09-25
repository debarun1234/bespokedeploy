// ─── Plan definitions ─────────────────────────────────────
// Portfolio  → personal identity for students & professionals
// Small      → commercial presence for home & local businesses
// Pro        → full-featured for established businesses
//
// included   = everything at base price (shown in AddonStep)
// extras     = what this plan ADDS over the previous (shown on plan card)
// addons     = optional nice-to-haves charged separately

export const PLANS = [
  // ── PORTFOLIO ─────────────────────────────────────────────
  {
    id:          'portfolio',
    name:        'Portfolio',
    tagline:     'Students & professionals',
    description: 'For freshers, job-seekers, freelancers and consultants who need a clean online presence to stand out.',
    price:       6500,
    icon:        '🎓',
    color:       '#10B981',
    colorLight:  'rgba(16,185,129,0.1)',
    highlight:   false,
    badge:       null,
    delivery:    '3–5 working days',
    included: [
      'About / Bio page',
      'Skills / Education / Experience section',
      'Portfolio or Projects showcase page',
      'Contact page with enquiry form',
      'WhatsApp click-to-chat button',
      'Social media links (LinkedIn, GitHub, Instagram)',
      'Basic SEO — meta titles & descriptions',
      'Google Analytics — see who visits your profile',
      'OG tags — rich WhatsApp & social link previews',
      'Mobile responsive design',
      'Free hosting — Netlify or Cloudflare (your choice)',
      'Admin panel — add new projects anytime, zero code',
    ],
    addons: [
      { id: 'p_blog',     name: 'Blog / Writing Section', desc: 'Publish articles, case studies or project write-ups', price: 700 },
      { id: 'p_testi',    name: 'Testimonials Section',   desc: 'Showcase reviews from clients, managers or peers',    price: 250 },
      { id: 'p_logo',     name: 'Personal Logo / Mark',   desc: 'Minimal logo or monogram for your personal brand',    price: 800 },
      { id: 'p_pdf',      name: 'Resume PDF Download',    desc: 'One-click downloadable resume directly from your site', price: 200 },
      { id: 'p_animate',  name: 'Scroll Animations',      desc: 'Smooth entrance effects as visitor scrolls',           price: 500 },
      { id: 'p_darkmode', name: 'Dark Mode Toggle',       desc: 'Light / dark switch — preferred by developers',        price: 400 },
    ],
  },

  // ── SMALL WEBSITE ─────────────────────────────────────────
  {
    id:          'starter',
    name:        'Small Website',
    tagline:     'Home businesses & local services',
    description: 'Ideal for tutors, doctors, dieticians, parlours, yoga teachers, and home entrepreneurs ready to grow online.',
    price:       12000,
    icon:        '🔹',
    color:       '#E8542C',
    colorLight:  'rgba(232,84,44,0.1)',
    highlight:   true,
    badge:       'Most Popular',
    delivery:    '5–7 working days',
    inheritsFrom: 'Portfolio',
    // What this plan adds over Portfolio — shown on the plan card
    extras: [
      'Home page with hero & intro section',
      'Services / Offerings page',
      'Testimonials section',
      'Pricing / Packages page',
      'Google Maps embed for your location',
      'Scroll animations & hover effects',
      'Cloudflare hosting — unlimited bandwidth, SSL, DDoS shield',
    ],
    // Full list for AddonStep
    included: [
      'Home page — hero section + intro',
      'About page',
      'Services / Offerings page',
      'Testimonials section',
      'Pricing / Packages page',
      'Contact page with enquiry form',
      'WhatsApp Business integration',
      'Google Maps embed for your location',
      'Social media links',
      'Basic SEO — titles, keywords, meta descriptions',
      'Google Analytics',
      'OG & Meta tags — rich social & WhatsApp previews',
      'Scroll animations & hover effects',
      'Mobile responsive design',
      'Free Cloudflare hosting — unlimited bandwidth, SSL, DDoS shield',
      'Admin panel — update content anytime, zero code',
    ],
    addons: [
      { id: 's_payment',    name: 'Payment Gateway',         desc: 'Razorpay / UPI / cards — collect payments directly on your site', price: 2000 },
      { id: 's_catalog',    name: 'Menu / Product Catalog',  desc: 'List items with photos & prices — built for cloud kitchens, home bakers & small home shops', price: 1000 },
      { id: 's_blog',       name: 'Blog Setup',              desc: 'Post articles, tips and updates for your audience',    price: 1200 },
      { id: 's_gallery',    name: 'Photo Gallery',           desc: 'Zoomable image gallery with lightbox viewer',          price: 600  },
      { id: 's_booking',    name: 'Appointment Booking',     desc: 'Calendar-based slot booking for your clients',         price: 2000 },
      { id: 's_newsletter', name: 'Newsletter Signup',       desc: 'Collect visitor emails automatically',                 price: 400  },
      { id: 's_logo',       name: 'Logo Design',             desc: 'Clean custom logo built around your brand',            price: 1200 },
      { id: 's_gbp',        name: 'Google Business Profile', desc: 'Set up and appear on Google Maps search results',      price: 800  },
      { id: 's_chat',       name: 'Live Chat Widget',        desc: 'Real-time visitor chat on your site',                  price: 500  },
      { id: 's_speed',      name: 'Speed Optimization',      desc: 'PageSpeed tuning, image compression, lazy loading',    price: 700  },
      { id: 's_ai',         name: 'AI Assistant',            desc: 'Small language model trained on your services — helps visitors instantly pick the right option', price: 3500 },
    ],
  },

  // ── PRO WEBSITE ───────────────────────────────────────────
  {
    id:          'pro',
    name:        'Pro Website',
    tagline:     'Businesses ready to sell online',
    description: 'For established businesses that need to accept payments, showcase their full catalog of work, and rank higher in search — built to grow, not just exist online.',
    price:       22000,
    icon:        '🔸',
    color:       '#EC4899',
    colorLight:  'rgba(236,72,153,0.1)',
    highlight:   false,
    badge:       'Best Value',
    calloutTag:  '🤖 AI Chatbot Included',
    delivery:    '7–10 working days',
    inheritsFrom: 'Small Website',
    // What this plan adds over Small — shown on the plan card. Led with the
    // payment gateway since "ready to get paid online" is Pro's real reason
    // to exist over Small — not just "more pages." AI Chatbot leads the pack
    // since it's the flagship reason Pro is "Best Value" — a paid add-on on
    // every other plan, bundled free here.
    extras: [
      'AI Chatbot Assistant — trained on your business, answers visitor questions & guides them to the right service, 24/7',
      'Online Payment Gateway — Razorpay / UPI / cards, ready to sell or collect payments',
      'Product / Work Gallery page — showcase your full catalog or portfolio of work',
      'Full Testimonials page',
      'Blog setup — for SEO & content marketing',
      'Google Business Profile setup',
      'Advanced speed tuning — PageSpeed score 90+',
      'Schema markup — rich results in Google Search',
    ],
    // Full list for AddonStep
    included: [
      'Home, About, Services, Contact pages',
      'AI Chatbot Assistant — trained on your business, answers visitors 24/7',
      'Online Payment Gateway — Razorpay / UPI / cards',
      'Product / Work Gallery page',
      'Full Testimonials page',
      'Blog setup',
      'Pricing / Packages page',
      'Contact form + WhatsApp Business',
      'Google Maps embed',
      'Google Business Profile setup',
      'Social media links',
      'Advanced SEO + schema markup + Google Analytics',
      'OG & Meta tags for social sharing',
      'Animations & scroll effects',
      'Advanced speed tuning — PageSpeed 90+',
      'Mobile responsive design',
      'Free Cloudflare hosting — unlimited bandwidth, DDoS shield, bot protection, SSL',
      'Admin panel — update content anytime, zero code',
    ],
    addons: [
      { id: 'pro_booking',   name: 'Appointment Booking',      desc: 'Calendar-based slot booking for your clients',              price: 1500 },
      { id: 'pro_ecom',      name: 'E-Commerce (up to 20)',    desc: 'Product listings with images, prices & detail pages',       price: 3000 },
      { id: 'pro_cart',      name: 'Shopping Cart & Checkout', desc: 'Full add-to-cart, checkout & order confirmation flow',       price: 2500 },
      { id: 'pro_multilang', name: 'Multi-language Support',   desc: 'English + Hindi or any regional language toggle',           price: 1500 },
      { id: 'pro_logo',      name: 'Premium Logo Design',      desc: 'Detailed logo with color, mono & favicon variants',         price: 2000 },
      { id: 'pro_team',      name: 'Team / People Page',       desc: 'Profiles, roles & bios for your team members',              price: 700  },
      { id: 'pro_faq',       name: 'FAQ Page',                 desc: 'Accordion-style frequently asked questions page',           price: 500  },
      { id: 'pro_chat',      name: 'Live Chat Widget',         desc: 'Real-time visitor chat integration',                        price: 500  },
      { id: 'pro_darkmode',  name: 'Dark Mode Toggle',         desc: 'Light / dark mode switch for visitors',                     price: 700  },
    ],
  },
];
