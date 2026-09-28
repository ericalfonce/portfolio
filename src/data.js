/* ================================================================
   Shared content data — single source of truth.

   Consumed by:
     · terminal.js      (command palette)
     · site/home.js     (homepage)
     · site/project.js  (case study pages)

   ── EDITING NOTES ──────────────────────────────────────────────
   · Every project below is REAL and was verified against either the
     public GitHub API, the project's own live site, or the source
     README on disk. Do not add projects that cannot be verified.

   · `url` is the real public destination. It is `null` for private or
     unreleased work (Network Billing System, TunuPay, ScholarReport)
     — those render as plain text rows with no link, which is honest.
     Do not invent a repo URL to fill the gap.

   · `year` is the verified start year (GitHub `created_at`, or the
     project's own documentation). It is `null` where no date is known
     and the row simply omits it.

   · `mark` is a real brand asset filename in /public/img. It is
     `null` for most projects, because no real logo exists for them
     and a generated placeholder would be a lie.

   · There are deliberately NO metrics, users, revenue, awards,
     certification statuses or client counts anywhere in this file.
     None of that has been verified, so none of it is claimed.
   ================================================================ */

/* ── Person ──────────────────────────────────────────────────── */
export const PROFILE = {
  name:     'Eric Alfonce',
  role:     'Cybersecurity & Software',
  location: 'Arusha, Tanzania',

  /* Short, factual bio. Sources: the public GitHub profile and the
     IklwaLabs site. No aspirations, no adjectives. */
  about: [
    'I build tools that keep East African businesses secure. My focus is web ' +
    'vulnerability scanning, East African fintech, and payment integrations.',

    'Most of my work is Python and JavaScript on Linux servers — Flask and ' +
    'Django backends, PostgreSQL, Nginx, and the networking underneath them. ' +
    'Through IklwaLabs I do cybersecurity and IT work for African SMEs.',

    'The rest is smaller tools built to solve a specific problem: a lab logbook ' +
    'for a computer lab, a hotspot billing backend for a network operator, a ' +
    'text detector released as open source.',
  ],

  /* Every link below was checked and returns a live profile.
     `linkedin` uses the handle from the LinkedIn badge in the public
     GitHub profile README, which is authoritative for this account. */
  github:    'https://github.com/ericalfonce',
  linkedin:  'https://www.linkedin.com/in/ericalfonce',
  instagram: 'https://www.instagram.com/ericalfonce',
  email:     'ericgasperalfonce@gmail.com',
  company:   'https://iklwalabs.co.tz',
};

/* ================================================================
   PROJECTS
   ---------------------------------------------------------------
   `slug`      URL segment → /work/<slug>
   `category`  short discipline line
   `summary`   one factual sentence — the list row
   `body`      two or three factual paragraphs — the case study
   `stack`     languages / infrastructure actually used
   `url`       real public destination, or null
   `mark`      real brand asset in /public/img, or null
   `featured`  true only for MulikaScans, the primary project
   ================================================================ */
export const PROJECTS = [
  {
    slug: 'mulikascans',
    name: 'MulikaScans',
    category: 'Cybersecurity',
    year: 2026,
    featured: true,
    mark: 'mulikascans-logo.png',
    url: 'https://mulikascans.com',
    repo: null,
    summary:
      'Web vulnerability scanning SaaS for East African SMEs, detecting SQL injection, ' +
      'XSS, broken authentication and 200+ vulnerability types.',
    body: [
      'MulikaScans is a web application vulnerability scanner built as a hosted service. ' +
      'A user submits a URL and a scan type; the platform walks the target, runs the ' +
      'relevant detection modules, and returns a report grouped by severity.',
      'Findings carry a CVSS score, the OWASP category and the CWE identifier, alongside ' +
      'the evidence that produced them and the remediation for each. The live site ' +
      'advertises coverage of 200+ vulnerability types, and the codebase carries 28 ' +
      'active scanner modules.',

      'Detection is not limited to request/response probing. There is an out-of-band ' +
      'component for blind vulnerabilities, a Playwright-based DOM scanner for ' +
      'client-side and stored XSS, and a static analysis path that accepts a ZIP archive ' +
      'or a GitHub URL. A proof-of-concept validator checks exploit payloads against ' +
      'signed authorisation tokens and keeps an audit trail.',

      'It runs as a Python/Flask application on PostgreSQL behind Gunicorn and Nginx on ' +
      'an Ubuntu VPS, and is built for this market: PesaPal and Flutterwave payments, ' +
      'Google OAuth with TOTP two-factor, four subscription plans, PDF report export ' +
      'and scheduled recurring scans.',
    ],
    stack: ['Python', 'Flask', 'PostgreSQL', 'Gunicorn', 'Nginx', 'Playwright', 'PesaPal', 'Flutterwave'],
  },
  {
    slug: 'iklwalabs',
    name: 'IklwaLabs',
    category: 'Cybersecurity / IT',
    year: 2026,
    featured: false,
    mark: 'iklwalabs-logo.png',
    url: 'https://iklwalabs.co.tz',
    repo: 'https://github.com/ericalfonce/iklwalabs',
    summary:
      'Cybersecurity and IT solutions company in Arusha, Tanzania — web vulnerability ' +
      'scanning, digital forensics, security training and IT infrastructure.',
    body: [
      'IklwaLabs is the company I build and work through, based in Arusha, Tanzania. ' +
      'The public site describes it as a cybersecurity and IT solutions company ' +
      'serving African SMEs.',
      'The service lines listed are web vulnerability scanning, digital forensics, ' +
      'security training, and IT infrastructure. MulikaScans is the scanning product ' +
      'built on top of that practice.',
    ],
    stack: ['TypeScript', 'Next.js', 'Cloud', 'Digital Forensics'],
  },
  {
    slug: 'network-billing-system',
    name: 'Network Billing System',
    category: 'Networking / Billing',
    year: null,
    featured: false,
    mark: null,
    url: null,
    repo: null,
    summary:
      'Multi-tenant hotspot billing backend that sells Wi-Fi packages and grants ' +
      'entitlements a MikroTik + FreeRADIUS network can enforce.',
    body: [
      'A multi-tenant backend for businesses that sell hotspot Wi-Fi access. Businesses ' +
      'register, define packages, and sell access to their own customers. Once Django ' +
      'verifies a payment, an entitlement is created and written as a RADIUS ' +
      'authorisation that the MikroTik network enforces as time, speed and data.',

      'The stack is Python, Django, Django REST Framework, PostgreSQL, Redis and Celery, ' +
      'with FreeRADIUS handling the network side. Entitlement creation is idempotent so ' +
      'a retried payment callback cannot grant access twice.',

      'Phase 1 — the backend foundation — is complete. Real payment providers, live ' +
      'FreeRADIUS pairing and the captive portal are phase 2.',
    ],
    stack: ['Python', 'Django', 'DRF', 'PostgreSQL', 'Redis', 'Celery', 'FreeRADIUS', 'MikroTik'],
  },
  {
    slug: 'lab-logbook',
    name: 'Lab Logbook',
    category: 'Software / Education',
    year: 2026,
    featured: false,
    mark: null,
    url: 'https://github.com/ericalfonce/lab-logbook',
    repo: 'https://github.com/ericalfonce/lab-logbook',
    summary:
      'Computer laboratory usage logbook with check-in/check-out, a live status board, ' +
      'history, reports and an admin panel. Runs entirely offline.',
    body: [
      'A logbook for a shared computer laboratory. Students check in and out, and the ' +
      'system keeps the history, shows who is currently at each machine on a live ' +
      'status board, and produces reports for whoever runs the lab.',
      'It is a Flask application on SQLite and needs no internet connection, which ' +
      'matters more than it sounds for a lab that sits behind a school network. ' +
      'An admin panel handles users and configuration.',
    ],
    stack: ['Python', 'Flask', 'SQLite'],
  },
  {
    slug: 'ai-text-detector-humanizer',
    name: 'AI Text Detector & Humanizer',
    category: 'Software / Open Source',
    year: 2026,
    featured: false,
    mark: null,
    url: 'https://github.com/ericalfonce/ai-detector-humanizer',
    repo: 'https://github.com/ericalfonce/ai-detector-humanizer',
    summary:
      'Open-source AI-text detector and humanizer, shipped as a FastAPI backend, a web ' +
      'app and a Chrome extension.',
    body: [
      'An open-source tool that scores text for AI-generated patterns and offers a ' +
      'free humanizer to rewrite it. It ships as three pieces that share one backend: ' +
      'a FastAPI service, a web single-page app, and a browser extension so the ' +
      'check works inside whatever page you are already writing in.',
    ],
    stack: ['Python', 'FastAPI', 'JavaScript', 'Chrome Extension'],
  },
  {
    slug: 'mikrotik-voucher-system',
    name: 'MikroTik Voucher System',
    category: 'Networking / Software',
    year: 2026,
    featured: false,
    mark: null,
    url: 'https://github.com/ericalfonce/mikrotik-voucher-system',
    repo: 'https://github.com/ericalfonce/mikrotik-voucher-system',
    summary:
      'Management dashboard for MikroTik hotspot vouchers — generating, tracking and ' +
      'reconciling prepaid access codes.',
    body: [
      'A dashboard for running prepaid hotspot access on MikroTik equipment. Vouchers ' +
      'are generated, tracked and reconciled, which is the part operators get wrong ' +
      'by hand once a code base grows past a page of paper.',
      'Built in TypeScript.',
    ],
    stack: ['TypeScript', 'MikroTik'],
  },
  {
    slug: 'pelekapro',
    name: 'PelekaPro',
    category: 'Client Work / E-commerce',
    year: 2026,
    featured: false,
    mark: null,
    url: 'https://pelekapro.vercel.app',
    repo: 'https://github.com/ericalfonce/pelekapro',
    summary:
      'Phone accessories storefront for Arusha, Moshi, Dar es Salaam and Mwanza, with ' +
      'M-Pesa, Tigo Pesa and Airtel Money checkout.',
    body: [
      'An online store for phone accessories — cases, chargers, power banks, earbuds ' +
      'and smartwatches — delivering across Arusha, Moshi, Dar es Salaam and Mwanza.',
      'The point of interest is the payment layer: checkout is built on M-Pesa, Tigo ' +
      'Pesa and Airtel Money rather than card payments, because that is how the market ' +
      'actually pays. Built with Next.js and TypeScript.',
    ],
    stack: ['Next.js', 'TypeScript', 'Mobile Money'],
  },
  {
    slug: 'katembo-safari',
    name: 'Katembo Safari',
    category: 'Client Work / Travel',
    year: 2026,
    featured: false,
    mark: null,
    url: 'https://katembo-site.vercel.app',
    repo: 'https://github.com/ericalfonce/katembo-site',
    summary:
      'Private, tailor-made safari operator covering Tanzania and East Africa, from ' +
      'the Serengeti and Ngorongoro to the coast.',
    body: [
      'A site for a private, tailor-made safari operator. The trips are planned around ' +
      'one traveller rather than sold from a fixed departure list, so the site leads ' +
      'with destinations and the planning process instead of a booking calendar.',
    ],
    stack: ['HTML', 'CSS', 'JavaScript'],
  },
  {
    slug: 'lenga-safaris',
    name: 'Lenga Safaris',
    category: 'Client Work / Travel',
    year: 2025,
    featured: false,
    mark: null,
    url: 'https://lenga-safaris.vercel.app',
    repo: 'https://github.com/ericalfonce/lenga-safaris',
    summary:
      'Safari operator site covering Serengeti, Ngorongoro, Kilimanjaro and the ' +
      'Wildebeest Migration.',
    body: [
      'A site for a Tanzanian safari operator, covering the Serengeti, Ngorongoro, ' +
      'Kilimanjaro and the Wildebeest Migration, with wildlife, landscape and ' +
      'culture content built around expert guiding.',
    ],
    stack: ['HTML', 'CSS'],
  },
  {
    slug: 'tunupay',
    name: 'TunuPay',
    category: 'Fintech',
    year: null,
    featured: false,
    mark: null,
    url: null,
    repo: null,
    summary: 'Agri-finance savings platform — still in development.',
    body: [
      'A savings platform for agriculture, listed on my public profile as work in ' +
      'progress. It is not released publicly yet.',
    ],
    stack: [],
  },
  {
    slug: 'scholarreport',
    name: 'ScholarReport',
    category: 'EdTech',
    year: null,
    featured: false,
    mark: null,
    url: null,
    repo: null,
    summary: 'School results and reporting system — still in development.',
    body: [
      'A results and reporting system for schools, listed on my public profile as ' +
      'work in progress. It is not released publicly yet.',
    ],
    stack: [],
  },
];

export const FEATURED_PROJECTS = PROJECTS.filter((p) => p.featured);
export const OTHER_PROJECTS   = PROJECTS.filter((p) => !p.featured);

export const getProject = (slug) => PROJECTS.find((p) => p.slug === slug);

/** Next project in the list — powers the case-study footer link. */
export const getNextProject = (slug) => {
  const i = PROJECTS.findIndex((p) => p.slug === slug);
  return i < 0 ? null : PROJECTS[(i + 1) % PROJECTS.length];
};

/* ================================================================
   SKILLS — plain grouped text. No percentages, no bars, no badges.
   Every entry is backed by shipped code or a documented capability.
   ================================================================ */
export const SKILLS = {
  'Security': [
    'Web application security',
    'Vulnerability assessment',
    'Digital forensics',
    'OWASP Top 10',
    'CVSS scoring',
    'Out-of-band detection',
  ],
  'Backend': [
    'Python',
    'Flask',
    'Django',
    'FastAPI',
    'PostgreSQL',
    'Redis',
    'Celery',
  ],
  'Infrastructure': [
    'Linux',
    'Nginx',
    'Gunicorn',
    'VPS deployment',
    'MikroTik',
    'FreeRADIUS',
  ],
  'Frontend': [
    'JavaScript',
    'TypeScript',
    'Next.js',
    'HTML',
    'CSS',
    'Bash',
  ],
};

/* Terminal window titles after each command. */
export const ROUTE_TITLES = {
  '/help':      'eric@portfolio: help',
  '/about':     'eric@portfolio: about',
  '/projects':  'eric@portfolio: projects',
  '/work':      'eric@portfolio: work',
  '/skills':    'eric@portfolio: skills',
  '/contact':   'eric@portfolio: contact',
};
