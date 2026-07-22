/* ================================================================
   Shared content data — consumed by both terminal.js and site.js
   ================================================================ */

export const PROFILE = {
  name:      'Eric Alfonce',
  github:    'https://github.com/ericalfonce',
  linkedin:  'https://www.linkedin.com/in/eric-alfonce',
  instagram: 'https://www.instagram.com/ericalfonce',
  email:     'ericgasperalfonce@gmail.com',
};

export const PROJECTS = [
  {
    name: 'IMEI Guard',
    repo: 'imei-guard',
    desc: 'East Africa stolen phone registry. FastAPI backend for reporting and checking IMEI numbers against a stolen device database.',
    tags: ['python', 'security'],
    url:  'https://github.com/ericalfonce/imei-guard',
  },
  {
    name: 'Web Vulnerability Scanner',
    repo: 'web-vuln-scanner',
    desc: 'Python tool that scans web applications for common security vulnerabilities. Detects XSS, SQLi, open redirects and more. Built for ethical security research.',
    tags: ['python', 'security', 'cyber'],
    url:  'https://github.com/ericalfonce/web-vuln-scanner',
  },
  {
    name: 'Webscanner',
    repo: 'webscanner',
    desc: 'A web-based security scanner interface built with HTML — provides a front-end layer for scanning and reporting web vulnerabilities.',
    tags: ['html', 'security'],
    url:  'https://github.com/ericalfonce/webscanner',
  },
  {
    name: 'Bluetooth Jammer (ESP32)',
    repo: 'Bluetooth-jammer-esp32',
    desc: 'Hardware security research using ESP32 + nRF24L01 to study Bluetooth 2.4GHz interference and RF signal analysis for educational purposes.',
    tags: ['esp32', 'hardware', 'rf', 'security'],
    url:  'https://github.com/ericalfonce/Bluetooth-jammer-esp32',
  },
  {
    name: 'AgriMarket',
    repo: 'agrimarket',
    desc: 'A Python-powered agricultural marketplace connecting farmers and buyers. Built to make fresh produce more accessible across communities.',
    tags: ['python'],
    url:  'https://github.com/ericalfonce/agrimarket',
  },
  {
    name: 'Lenga Safaris',
    repo: 'lenga-safaris',
    desc: 'A sleek travel & safari website showcasing African wildlife experiences. Fully responsive HTML/CSS frontend with modern layout.',
    tags: ['html', 'css'],
    url:  'https://github.com/ericalfonce/lenga-safaris',
  },
  {
    name: 'Digi Attendance',
    repo: 'digi-attendance',
    desc: 'Digital attendance tracking system for schools — a step toward smarter, paperless EdTech infrastructure.',
    tags: ['html', 'js'],
    url:  'https://github.com/ericalfonce/digi-attendance',
  },
  {
    name: 'School System',
    repo: 'school-system',
    desc: 'PHP-based school management system covering student records, grades, class management and administration workflows.',
    tags: ['php', 'html'],
    url:  'https://github.com/ericalfonce/school-system',
  },
  {
    name: 'Kayandra Web',
    repo: 'kayandra-web',
    desc: 'A custom business website featuring modern responsive layout, clean typography, and polished design patterns.',
    tags: ['html', 'css'],
    url:  'https://github.com/ericalfonce/kayandra-web',
  },
  {
    name: 'Landing Page',
    repo: 'landing-page',
    desc: 'A responsive marketing landing page built with clean semantic HTML & CSS — pixel-perfect, mobile-first design.',
    tags: ['html', 'css'],
    url:  'https://github.com/ericalfonce/landing-page',
  },
  {
    name: 'Cloud Architecture Diagrams',
    repo: 'diagrams',
    desc: 'Diagram-as-code project for prototyping and documenting cloud system architectures using code-based diagramming tools.',
    tags: ['cloud'],
    url:  'https://github.com/ericalfonce/diagrams',
  },
  {
    name: 'Web Dev Curriculum',
    repo: 'Web-Dev-For-Beginners',
    desc: '24 lessons, 12 weeks — a structured web development learning curriculum covering HTML, CSS and JavaScript fundamentals.',
    tags: ['html', 'css', 'js'],
    url:  'https://github.com/ericalfonce/Web-Dev-For-Beginners',
  },
];

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
