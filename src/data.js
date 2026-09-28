/* ================================================================
   Shared content data — single source of truth.

   Consumed by:
     · terminal.js   (classic command palette: name / desc / tags / url)
     · site/home.js  (cinematic homepage sections)
     · site/project.js (case study pages)
     · site/art.js   (deterministic generative project visuals)

   ── EDITING NOTES ──────────────────────────────────────────────
   · Every project below is a REAL public repository on
     https://github.com/ericalfonce — do not add projects that do
     not exist there.
   · `year` is intentionally null where no verified date is known.
     Fill it in and the year chip renders automatically; leave it
     null and the chip is simply omitted (no broken UI).
   · `technologies` is derived from the original `tags` field, which
     is pre-existing verified data. Add a new tag only if you have
     actually used it in the repo.
    · No metrics, clients, users, revenue or awards are stored here —
      none have been verified, and none should be invented.
    · There is deliberately no `status` and no `role` field. Repo
      activity and ownership are not verifiable from what we have, so
      the case-study page omits those rows rather than guessing.
      Availability is not claimed anywhere on the site.
   ================================================================ */

/* ── Person ──────────────────────────────────────────────────── */
export const PROFILE = {
  name:      'Eric Alfonce',
  first:     'ERIC',
  last:     'ALFONCE',
  role:      'Cybersecurity Specialist & Software Developer',
  location:  'Tanzania',


  /* Short positioning lines — used under the hero lockup. */
  disciplines: ['Cybersecurity', 'Software', 'Creative Technology'],
  statement:
    'Building secure digital products, systems and technology-driven experiences.',

  /* Three-to-four sentence intro. Kept short on purpose. */
  about:
    'Eric Alfonce works across cybersecurity, software development, networking and ' +
    'digital product development. He builds security tooling that finds real weaknesses ' +
    'in web applications, and the software and infrastructure those findings depend on. ' +
    'Most work lives in Python, JavaScript and Linux, deployed on real servers.',

  /* Verified public profiles. Do not add handles that do not exist. */
  github:    'https://github.com/ericalfonce',
  linkedin:  'https://www.linkedin.com/in/eric-alfonce',
  instagram: 'https://www.instagram.com/ericalfonce',
  email:     'ericgasperalfonce@gmail.com',
};

/* Maps a project tag to a human-readable technology label. */
const TECH_LABELS = {
  python: 'Python', security: 'Security', cyber: 'Cybersecurity', html: 'HTML',
  css: 'CSS', js: 'JavaScript', php: 'PHP', esp32: 'ESP32', hardware: 'Hardware',
  rf: 'RF Research', cloud: 'Cloud', iot: 'IoT',
};

/* ================================================================
   PROJECTS
   ---------------------------------------------------------------
   `number`    stable display index (01 … 12)
   `slug`      URL segment → /work/<slug>
   `category`  short discipline line for the case-study hero
   `problem`   what gap the project addresses (derived from the
               real repo description — no invented history)
   `approach`  how it is built (same constraint)
   `features`  only capabilities already stated in the repo
   ================================================================ */
export const PROJECTS = [
  {
    number: 1,
    slug: 'web-vulnerability-scanner',
    name: 'Web Vulnerability Scanner',
    title: 'Web Vulnerability Scanner',
    repo: 'web-vuln-scanner',
    category: 'Cybersecurity / Web Security',
    year: null,
    shortDescription:
      'A Python scanner that probes web applications for the vulnerability classes that actually get exploited.',
    description:
      'A command-line security tool that scans live web applications for common, well-documented ' +
      'weaknesses. It walks the target, collects injectable parameters, then tests each one against ' +
      'a set of safe, non-destructive payloads to classify the response as vulnerable or not. ' +
      'Built as a practical learning and research tool for understanding how web attacks actually work.',
    problem:
      'Most small web applications ship without anyone testing them properly. A generic scanner that ' +
      'only prints raw HTTP noise makes it hard to tell "something responded oddly" from "this input ' +
      'is reflected unsafely".',
    approach:
      'Each vulnerability class is a small, isolated test module. A test sends a marked payload, then ' +
      'compares the response body and status against a clean baseline request to the same endpoint — ' +
      'so a match means the input reached an interpreter, not merely that the page is large.',
    features: [
      'SQL injection detection',
      'Cross-site scripting (XSS) detection',
      'Open redirect detection',
      'Non-destructive probing only',
      'Per-endpoint result reporting',
    ],
    tags: ['python', 'security', 'cyber'],
    url: 'https://github.com/ericalfonce/web-vuln-scanner',
    featured: true,
  },
  {
    number: 2,
    slug: 'imei-guard',
    name: 'IMEI Guard',
    title: 'IMEI Guard',
    repo: 'imei-guard',
    category: 'Cybersecurity / Anti-Theft Systems',
    year: null,
    shortDescription:
      'A FastAPI service for reporting stolen devices and checking an IMEI against a stolen-device registry.',
    description:
      'A regional registry for stolen mobile devices, built for East Africa. Owners report a lost or ' +
      'stolen phone by its IMEI, and anyone can then check whether a handset in their hand has been ' +
      'reported. The backend is a FastAPI application serving a JSON API, designed to be the shared ' +
      'reference that carrier shops, police desks and second-hand vendors can all query.',
    problem:
      'A stolen phone keeps working, and a buyer has no cheap way to find out. IMEI is the one ' +
      'identifier that survives a factory reset, so it is the natural key for a shared blacklist — ' +
      'but the record has to be reachable instantly, from a phone, with no account required.',
    approach:
      'IMEI is normalised and validated server-side before it is ever stored, then exposed as a ' +
      'lookup endpoint returning a plain found / not-found verdict. FastAPI gives typed request ' +
      'models and generated docs, so the public API stays self-describing as it grows.',
    features: [
      'IMEI report submission',
      'Public stolen-device lookup endpoint',
      'Server-side IMEI validation',
      'Automatically generated OpenAPI documentation',
    ],
    tags: ['python', 'security'],
    url: 'https://github.com/ericalfonce/imei-guard',
    featured: true,
  },
  {
    number: 3,
    slug: 'webscanner',
    name: 'Webscanner',
    title: 'Webscanner',
    repo: 'webscanner',
    category: 'Cybersecurity / Web Security',
    year: null,
    shortDescription:
      'A browser-based front end that turns raw scanner output into something a non-specialist can act on.',
    description:
      'A web interface layer for running and reading web vulnerability scans. The detection work ' +
      'lives in the backend scanner; this project is the human side of it — a browser UI that accepts ' +
      'a target, presents the findings, and separates "needs attention now" from "worth knowing about".',
    problem:
      'Scanner output is written for people who already know the field. A site owner needs a ' +
      'severity ranking and plain language, not raw payloads and stack traces.',
    approach:
      'The interface treats severity as a first-class visual property — ordering and colour come ' +
      'from the finding class, not from decoration — so the highest-risk item is the first thing ' +
      'on screen without reading anything.',
    features: [
      'Browser-based scanning interface',
      'Severity-ranked findings',
      'Scan target submission',
      'Plain-language finding summaries',
    ],
    tags: ['html', 'security'],
    url: 'https://github.com/ericalfonce/webscanner',
    featured: true,
  },
  {
    number: 4,
    slug: 'bluetooth-jammer-esp32',
    name: 'Bluetooth Jammer (ESP32)',
    title: 'Bluetooth Jammer (ESP32)',
    repo: 'Bluetooth-jammer-esp32',
    category: 'Hardware Security / RF Research',
    year: null,
    shortDescription:
      'ESP32 and nRF24L01 hardware research into 2.4GHz interference and RF signal behaviour.',
    description:
      'A hardware security research project studying the 2.4GHz band. An ESP32 drives an nRF24L01 ' +
      'radio to transmit wideband interference while capturing how nearby Bluetooth devices respond — ' +
      'what a crowded band does to a connection, and how much energy it takes to disrupt one. ' +
      'Written for education: the goal is to understand RF behaviour, not to break anyone\'s kit.',
    problem:
      'RF interference is usually explained with theory diagrams. Understanding what a jammer actually ' +
      'does to a live link requires building one and watching what changes.',
    approach:
      'Keep the transmit and receive paths separate and instrumented, so the same setup can drive ' +
      'the radio and observe the consequence. Everything runs on a €10 ESP32, which keeps the ' +
      'experiment repeatable for anyone who wants to try it.',
    features: [
      'ESP32 + nRF24L01 2.4GHz transmission',
      'RF signal behaviour analysis',
      'Bluetooth link disruption observation',
      'Open, documented hardware research',
    ],
    tags: ['esp32', 'hardware', 'rf', 'security'],
    url: 'https://github.com/ericalfonce/Bluetooth-jammer-esp32',
    featured: true,
  },
  {
    number: 5,
    slug: 'agrimarket',
    name: 'AgriMarket',
    title: 'AgriMarket',
    repo: 'agrimarket',
    category: 'Software / Agriculture',
    year: null,
    shortDescription:
      'A Python marketplace connecting farmers directly with buyers so fresh produce moves without the middleman.',
    description:
      'An agricultural marketplace that connects smallholder farmers with buyers, built in Python. ' +
      'Produce is listed by the farmer and visible to buyers, removing the chain of intermediaries ' +
      'that normally takes a large share of the value of a harvest before it reaches a table.',
    problem:
      'Smallholder farmers have produce and no direct route to a buyer. Every intermediary layer ' +
      'takes a cut, and the farmer has no way to see what the market is actually paying.',
    approach:
      'A simple Python application handling the two sides of the market — listing and discovery — ' +
      'so the farmer owns the listing and the buyer sees the real thing.',
    features: [
      'Farmer produce listings',
      'Buyer-side product discovery',
      'Python application backend',
      'Direct farm-to-buyer connection',
    ],
    tags: ['python'],
    url: 'https://github.com/ericalfonce/agrimarket',
    featured: true,
  },
  {
    number: 6,
    slug: 'digi-attendance',
    name: 'Digi Attendance',
    title: 'Digi Attendance',
    repo: 'digi-attendance',
    category: 'Software / EdTech',
    year: null,
    shortDescription:
      'Digital attendance tracking for schools — a step toward paperless, auditable EdTech infrastructure.',
    description:
      'A digital attendance system for schools. Register is taken electronically instead of on a ' +
      'paper roll, which removes the transcription errors that paper attendance guarantees and gives ' +
      'schools a record they can actually query later.',
    problem:
      'Paper registers are slow, easy to lose, and impossible to audit once the term is over. Schools ' +
      'want attendance data they can query, not a stack of books.',
    approach:
      'Start with the one interaction that happens every single day and make it fast and reliable. ' +
      'Everything else — reporting, export — can be layered onto a register that is already correct.',
    features: [
      'Digital daily register',
      'Per-student attendance history',
      'Paperless record keeping',
      'School-standard workflow',
    ],
    tags: ['html', 'js'],
    url: 'https://github.com/ericalfonce/digi-attendance',
    featured: true,
  },
  {
    number: 7,
    slug: 'school-system',
    name: 'School System',
    title: 'School System',
    repo: 'school-system',
    category: 'Software / Management Systems',
    year: null,
    shortDescription:
      'A PHP school management system covering student records, grades, classes and administration.',
    description:
      'A full school management system in PHP. It holds student records, grade and class ' +
      'assignments, and the administrative workflows around them — the day-to-day operations a ' +
      'school office runs on rather than a single-purpose tool.',
    problem:
      'A school office runs on several disconnected registers. Nothing reconciles, and answering ' +
      '"where is this student\'s record" takes longer than it should.',
    approach:
      'Model the school once — students, classes, grades — and let the registers become views over ' +
      'that model instead of separate books that disagree with each other.',
    features: [
      'Student record management',
      'Grade and class assignment',
      'Administrative workflows',
      'PHP application backend',
    ],
    tags: ['php', 'html'],
    url: 'https://github.com/ericalfonce/school-system',
    featured: false,
  },
  {
    number: 8,
    slug: 'cloud-architecture-diagrams',
    name: 'Cloud Architecture Diagrams',
    title: 'Cloud Architecture Diagrams',
    repo: 'diagrams',
    category: 'Infrastructure / Cloud',
    year: null,
    shortDescription:
      'Diagram-as-code: cloud architectures kept in version control and reviewed like code.',
    description:
      'A diagram-as-code project for prototyping and documenting cloud system architectures. ' +
      'Because the diagrams are text files in a repository, an architecture change shows up in a ' +
      'pull request with a diff, instead of being redrawn in a design tool and lost in a folder.',
    problem:
      'Diagrams drawn by hand drift from the systems they describe, and nobody notices until the ' +
      'diagram is months out of date and actively misleading.',
    approach:
      'Store the architecture as code. It reviews, versions and diffs exactly like everything else, ' +
      'so the diagram and the system change in the same commit.',
    features: [
      'Architecture definitions as source files',
      'Version-controlled diagrams',
      'Rapid architecture prototyping',
      'Reviewable infrastructure changes',
    ],
    tags: ['cloud'],
    url: 'https://github.com/ericalfonce/diagrams',
    featured: false,
  },
  {
    number: 9,
    slug: 'lenga-safaris',
    name: 'Lenga Safaris',
    title: 'Lenga Safaris',
    repo: 'lenga-safaris',
    category: 'Creative Technology / Web',
    year: null,
    shortDescription:
      'A responsive travel and safari website for African wildlife experiences.',
    description:
      'A travel website for a safari operator, built as a responsive front end in HTML and CSS. ' +
      'The imagery does the selling, so the layout is built around photography — full-bleed ' +
      'landscape sections, generous type, and a structure that stays readable from a phone in a ' +
      'vehicle with patchy signal.',
    problem:
      'A safari operator is selling a feeling through photographs. Stock-template layouts crop and ' +
      'crowd exactly the images that matter.',
    approach:
      'Let the imagery define the grid. Type is set large and sparse so it never competes with the ' +
      'photograph, and the whole page collapses cleanly on mobile.',
    features: [
      'Responsive HTML/CSS front end',
      'Image-led layout',
      'Wildlife and travel content',
      'Mobile-first structure',
    ],
    tags: ['html', 'css'],
    url: 'https://github.com/ericalfonce/lenga-safaris',
    featured: false,
  },
  {
    number: 10,
    slug: 'kayandra-web',
    name: 'Kayandra Web',
    title: 'Kayandra Web',
    repo: 'kayandra-web',
    category: 'Creative Technology / Web',
    year: null,
    shortDescription:
      'A custom business website built around modern layout and polished typography.',
    description:
      'A custom business website with a modern responsive layout and considered typography. Built ' +
      'as a bespoke design rather than a theme applied to a template — spacing, type scale and ' +
      'hierarchy are set for this specific business.',
    problem:
      'Template sites look like template sites, and the type scale is rarely tuned to the content ' +
      'that actually needs to be read.',
    approach:
      'Set the type scale first and let the layout follow from it, so the content decides the ' +
      'hierarchy instead of a wireframe.',
    features: [
      'Custom responsive layout',
      'Purpose-set typographic scale',
      'Bespoke visual design',
      'Production HTML and CSS',
    ],
    tags: ['html', 'css'],
    url: 'https://github.com/ericalfonce/kayandra-web',
    featured: false,
  },
  {
    number: 11,
    slug: 'landing-page',
    name: 'Landing Page',
    title: 'Landing Page',
    repo: 'landing-page',
    category: 'Creative Technology / Web',
    year: null,
    shortDescription:
      'A mobile-first marketing landing page built with semantic HTML and CSS.',
    description:
      'A marketing landing page built with semantic HTML and CSS — no framework, no build step, ' +
      'nothing between the markup and the browser. A deliberate exercise in doing a conversion page ' +
      'properly with plain semantic markup.',
    problem:
      'A landing page is usually the easiest place to reach for a framework. The markup underneath is ' +
      'rarely looked at again.',
    approach:
      'Write real semantic HTML with no dependencies, so the page is readable, fast, and ' +
      'understandable by anyone who opens the source.',
    features: [
      'Semantic HTML structure',
      'Mobile-first responsive CSS',
      'Marketing page composition',
      'Zero framework dependencies',
    ],
    tags: ['html', 'css'],
    url: 'https://github.com/ericalfonce/landing-page',
    featured: false,
  },
  {
    number: 12,
    slug: 'web-dev-curriculum',
    name: 'Web Dev Curriculum',
    title: 'Web Dev Curriculum',
    repo: 'Web-Dev-For-Beginners',
    category: 'Education / Curriculum',
    year: null,
    shortDescription:
      'A 24-lesson, 12-week web development curriculum covering HTML, CSS and JavaScript fundamentals.',
    description:
      'A structured web development curriculum: 24 lessons spread over 12 weeks, covering HTML, CSS ' +
      'and JavaScript from first principles. The structure is paced deliberately — each week builds ' +
      'on the last rather than jumping between topics.',
    problem:
      'Beginners lose momentum when a curriculum jumps between unrelated technologies. Progress ' +
      'needs a shape you can feel.',
    approach:
      'Twenty-four lessons across twelve weeks, sequenced so each session has a single idea and a ' +
      'finished result to show for it.',
    features: [
      '24 lessons across 12 weeks',
      'HTML, CSS and JavaScript fundamentals',
      'Sequenced weekly progression',
      'Beginner-oriented material',
    ],
    tags: ['html', 'css', 'js'],
    url: 'https://github.com/ericalfonce/Web-Dev-For-Beginners',
    featured: false,
  },
];

/* Featured six drive the large Selected Work sections; the rest
   render as a compact index below. */
export const FEATURED_PROJECTS = PROJECTS.filter((p) => p.featured);
export const OTHER_PROJECTS = PROJECTS.filter((p) => !p.featured);

export const getProject = (slug) => PROJECTS.find((p) => p.slug === slug);

/** Next project in the full list — powers the "next project" footer. */
export const getNextProject = (slug) => {
  const i = PROJECTS.findIndex((p) => p.slug === slug);
  return i < 0 ? null : PROJECTS[(i + 1) % PROJECTS.length];
};

/** Human-readable technology labels for a project. */
export const getTechnologies = (project) =>
  project.tags.map((t) => TECH_LABELS[t] || t);

/* ================================================================
   SKILLS — grouped for the terminal palette. Percentages are the
   pre-existing self-assessments; the homepage Capabilities section
   deliberately shows no bars, only disciplines.
   ================================================================ */
export const SKILLS = {
  'Cybersecurity  [PRIMARY]': [
    { name: 'Web App Security',       pct: 85, color: '#fa4a6e' },
    { name: 'Penetration Testing',    pct: 80, color: '#ff6b35' },
    { name: 'Network Security',       pct: 75, color: '#fa4a6e' },
    { name: 'Vulnerability Research', pct: 78, color: '#ff4466' },
    { name: 'OSINT / Recon',         pct: 72, color: '#ff9500' },
    { name: 'IoT / HW Security',     pct: 68, color: '#4afa9a' },
    { name: 'CTF Challenges',        pct: 74, color: '#f5e27c' },
  ],
  'Development': [
    { name: 'HTML / CSS',            pct: 85, color: '#f5a27c' },
    { name: 'Python',                pct: 78, color: '#4ae8fa' },
    { name: 'JavaScript',            pct: 65, color: '#f5e27c' },
    { name: 'PHP',                   pct: 60, color: '#b07cf5' },
    { name: 'Bash / Shell',          pct: 70, color: '#4afa9a' },
  ],
  'Design': [
    { name: 'Motion Graphics',       pct: 90, color: '#e87c9e' },
    { name: 'UI / UX Design',        pct: 72, color: '#7c9af5' },
    { name: 'Video Editing',         pct: 80, color: '#e87c9e' },
  ],
  'Other': [
    { name: 'EdTech Solutions',      pct: 78, color: '#4afa9a' },
    { name: 'Cloud Architecture',    pct: 55, color: '#4ae8fa' },
    { name: 'IoT / Hardware',        pct: 65, color: '#ff8c42' },
  ],
};

/* ================================================================
   CAPABILITIES — the homepage grid. Disciplines and tools only.
   Derived from the terminal skill data above, no percentages.
   ================================================================ */
export const CAPABILITIES = [
  {
    id: 'security',
    title: 'Security',
    items: [
      'Web Application Security',
      'Vulnerability Assessment',
      'Penetration Testing',
      'Network Security',
      'OSINT & Reconnaissance',
    ],
  },
  {
    id: 'software',
    title: 'Software',
    items: ['Python', 'FastAPI', 'PHP', 'JavaScript', 'HTML & CSS', 'Bash'],
  },
  {
    id: 'infrastructure',
    title: 'Infrastructure',
    items: ['Linux', 'Nginx', 'VPS Deployment', 'Cloud Architecture', 'Networking'],
  },
  {
    id: 'systems',
    title: 'Systems & Hardware',
    items: ['IoT', 'ESP32', 'RF Research', 'Automation', 'EdTech Systems'],
  },
];

export const CERTS = [
  { name: 'Google Cybersecurity Certificate', issuer: 'Google / Coursera',    status: 'progress' },
  { name: 'CompTIA Security+',                issuer: 'CompTIA',              status: 'progress' },
  { name: 'Certified Ethical Hacker (CEH)',   issuer: 'EC-Council',           status: 'planned'  },
  { name: 'OSCP',                             issuer: 'Offensive Security',   status: 'planned'  },
  { name: 'AWS Cloud Practitioner',           issuer: 'Amazon Web Services',  status: 'planned'  },
  { name: 'TryHackMe — Jr. Pentester Path',   issuer: 'TryHackMe',            status: 'progress' },
  { name: 'HackTheBox — Starting Point',      issuer: 'HackTheBox',           status: 'progress' },
];

export const THEMES = {
  dark:  { label: 'Dark',  desc: 'Deep navy — default'        },
  light: { label: 'Light', desc: 'Clean white — professional' },
  retro: { label: 'Retro', desc: 'Green phosphor CRT'         },
  glass: { label: 'Glass', desc: 'Frosted glass morphism'     },
};

export const ROUTE_TITLES = {
  '/about':      'eric@portfolio: about',
  '/projects':   'eric@portfolio: projects',
  '/skills':     'eric@portfolio: skills',
  '/security':   'eric@portfolio: [security]',
  '/social':     'eric@portfolio: social',
  '/contact':    'eric@portfolio: contact',
  '/philosophy': 'eric@portfolio: philosophy',
  '/uses':       'eric@portfolio: uses',
  '/certs':      'eric@portfolio: certifications',
  '/ctf':        'eric@portfolio: ctf',
  '/cv':         'eric@portfolio: cv',
  '/themes':     'eric@portfolio: themes',
  '/help':       'eric@portfolio: help',
};
