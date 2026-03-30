/* ================================================================
   Eric Alfonce — Terminal Portfolio  v2.0
   ================================================================ */

'use strict';

/* ── DOM refs ── */
const output       = document.getElementById('output');
const input        = document.getElementById('cmd-input');
const acDrop       = document.getElementById('autocomplete');
const titleEl      = document.getElementById('titlebar-title');
const terminal     = document.getElementById('terminal');
const wrapper      = document.getElementById('terminal-wrapper');
const bootScreen   = document.getElementById('boot-screen');
const bootLog      = document.getElementById('boot-log');
const exitModal    = document.getElementById('exit-modal');
const matCanvas    = document.getElementById('matrix-canvas');

/* ── State ── */
let cmdHistory   = [];
let histIdx      = -1;
let matActive    = false;
let matRAF       = null;
let matCtx       = null;
let matDrops     = [];
let isMaximized  = false;
let isMinimized  = false;
let idleTimer    = null;
let idleStep     = 0;
let currentTheme = localStorage.getItem('ea-theme') || 'dark';

/* Avatar state — set after pixelation */
let avatarDataUrl   = null;   // full-res pixelated data URL
let avatarSmallUrl  = null;   // 52px version for welcome

/* ================================================================
   DATA
   ================================================================ */

const PROFILE = {
  name:      'Eric Alfonce',
  github:    'https://github.com/ericalfonce',
  linkedin:  'https://www.linkedin.com/in/eric-alfonce',
  instagram: 'https://www.instagram.com/ericalfonce',
};

const PROJECTS = [
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
    tags: ['iot'],
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

const SKILLS = {
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

const CERTS = [
  { name: 'Google Cybersecurity Certificate', issuer: 'Google / Coursera',    status: 'progress' },
  { name: 'CompTIA Security+',                issuer: 'CompTIA',              status: 'progress' },
  { name: 'Certified Ethical Hacker (CEH)',   issuer: 'EC-Council',           status: 'planned'  },
  { name: 'OSCP',                             issuer: 'Offensive Security',   status: 'planned'  },
  { name: 'AWS Cloud Practitioner',           issuer: 'Amazon Web Services',  status: 'planned'  },
  { name: 'TryHackMe — Jr. Pentester Path',   issuer: 'TryHackMe',            status: 'progress' },
  { name: 'HackTheBox — Starting Point',      issuer: 'HackTheBox',           status: 'progress' },
];

const THEMES = {
  dark:  { label: 'Dark',  desc: 'Deep navy — default'        },
  light: { label: 'Light', desc: 'Clean white — professional' },
  retro: { label: 'Retro', desc: 'Green phosphor CRT'         },
  glass: { label: 'Glass', desc: 'Frosted glass morphism'     },
};

const ROUTE_TITLES = {
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
  '/themes':     'eric@portfolio: themes',
  '/help':       'eric@portfolio: help',
};

/* ================================================================
   COMMANDS
   ================================================================ */

const COMMANDS = {
  /* Core */
  '/help':        { fn: cmdHelp,       desc: 'Show all available commands'     },
  '/about':       { fn: cmdAbout,      desc: 'About me'                        },
  '/projects':    { fn: cmdProjects,   desc: 'View all my projects'            },
  '/skills':      { fn: cmdSkills,     desc: 'Skills & proficiency levels'     },
  '/security':    { fn: cmdSecurity,   desc: 'Cybersecurity focus area'        },
  '/certs':       { fn: cmdCerts,      desc: 'Certifications & learning path'  },
  '/ctf':         { fn: cmdCtf,        desc: 'CTF challenges & platforms'      },
  '/philosophy':  { fn: cmdPhilosophy, desc: 'My philosophy & values'          },
  '/uses':        { fn: cmdUses,       desc: 'Tools & tech stack I use'        },
  '/social':      { fn: cmdSocial,     desc: 'Social media links'              },
  '/contact':     { fn: cmdContact,    desc: 'Get in touch'                    },
  /* Shortcuts */
  '/github':      { fn: () => openLink(PROFILE.github),    desc: 'Open GitHub'    },
  '/linkedin':    { fn: () => openLink(PROFILE.linkedin),  desc: 'Open LinkedIn'  },
  '/instagram':   { fn: () => openLink(PROFILE.instagram), desc: 'Open Instagram' },
  /* Theme */
  '/themes':      { fn: cmdThemes,     desc: 'List & switch themes'            },
  '/dark':        { fn: () => setTheme('dark'),  desc: 'Switch to dark theme'  },
  '/light':       { fn: () => setTheme('light'), desc: 'Switch to light theme' },
  '/retro':       { fn: () => setTheme('retro'), desc: 'Switch to retro theme' },
  '/glass':       { fn: () => setTheme('glass'), desc: 'Switch to glass theme' },
  /* Fun */
  '/matrix':      { fn: cmdMatrix,     desc: 'Toggle matrix rain'             },
  '/party':       { fn: cmdParty,      desc: 'Launch confetti'                 },
  /* Util */
  '/clear':       { fn: cmdClear,      desc: 'Clear the terminal'              },
  '/welcome':     { fn: cmdWelcome,    desc: 'Show welcome screen'             },
  /* Easter eggs — desc:null hides from autocomplete/help */
  'whoami':           { fn: cmdWhoami,        desc: null },
  'ls':               { fn: cmdLs,            desc: null },
  'pwd':              { fn: cmdPwd,           desc: null },
  'cat readme.md':    { fn: cmdCatReadme,     desc: null },
  'git log':          { fn: cmdGitLog,        desc: null },
  'git status':       { fn: cmdGitStatus,     desc: null },
  'ping eric':        { fn: cmdPing,          desc: null },
  'nmap localhost':   { fn: cmdNmap,          desc: null },
  'sudo hire eric':   { fn: cmdHire,          desc: null },
  'sudo rm -rf doubts': { fn: cmdRmDoubts,   desc: null },
  'hello':            { fn: cmdHello,         desc: null },
  'hi':               { fn: cmdHello,         desc: null },
  'help':             { fn: cmdHelp,          desc: null },
};

const PUBLIC_CMDS = Object.entries(COMMANDS)
  .filter(([, v]) => v.desc !== null)
  .map(([k, v]) => ({ cmd: k, desc: v.desc }));

/* ================================================================
   AVATAR — Load, Pixelate, Favicon
   ================================================================ */

/**
 * Pixelates an ImageBitmap/HTMLImageElement onto a square canvas.
 * pixelSize = how many output pixels each "block" occupies (higher = chunkier).
 */
function pixelateToCanvas(img, outSize, pixelSize) {
  const canvas = document.createElement('canvas');
  canvas.width  = outSize;
  canvas.height = outSize;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Determine source aspect — crop to square from centre
  const sw = img.naturalWidth  || img.width  || outSize;
  const sh = img.naturalHeight || img.height || outSize;
  const side = Math.min(sw, sh);
  const sx = (sw - side) / 2;
  const sy = (sh - side) / 2;

  // 1. Draw source cropped to a tiny grid  (down-sample = pixelation)
  const tiny = Math.round(outSize / pixelSize);
  ctx.drawImage(img, sx, sy, side, side, 0, 0, tiny, tiny);

  // 2. Scale back up without smoothing → visible "pixel" blocks
  ctx.drawImage(canvas, 0, 0, tiny, tiny, 0, 0, outSize, outSize);

  return canvas;
}

function loadAvatar() {
  const SOURCES = ['AVATAR.jpg', 'avatar.jpg', 'avatar.jpeg', 'avatar.png', 'avatar.webp', 'photo.jpg'];
  let tried = 0;

  function tryNext() {
    if (tried >= SOURCES.length) return; // no avatar found, that's OK
    const src = SOURCES[tried++];
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = function () {
      // Full-res pixelated (96px display, pixel block = 8px → 12×12 grid)
      const big   = pixelateToCanvas(img, 96,  8);
      // Small version for welcome (80px, block = 8px)
      const small = pixelateToCanvas(img, 80,  8);
      // Favicon (32px, block = 4px)
      const fav   = pixelateToCanvas(img, 32,  4);

      let bigUrl, smallUrl, favUrl;
      try {
        bigUrl   = big.toDataURL('image/png');
        smallUrl = small.toDataURL('image/png');
        favUrl   = fav.toDataURL('image/png');
      } catch (e) {
        // Canvas tainted (file:// CORS) — fall back to direct src
        bigUrl   = src;
        smallUrl = src;
        favUrl   = null;
      }

      avatarDataUrl  = bigUrl;
      avatarSmallUrl = smallUrl;

      // Update <link rel="icon"> with pixelated face
      if (favUrl) {
        const link = document.getElementById('favicon');
        if (link) link.href = favUrl;
      }

      // Retroactively inject avatar if welcome was already rendered
      const wImg = document.getElementById('welcome-avatar-img');
      if (wImg) {
        wImg.src = avatarSmallUrl;
        wImg.parentElement.style.display = '';
      }
      const aImg = document.getElementById('about-avatar-img');
      if (aImg) {
        aImg.src = avatarDataUrl;
        aImg.closest('.avatar-wrap').style.display = '';
      }
    };

    img.onerror = tryNext;
    img.src     = src;
  }

  tryNext();
}

/* ================================================================
   BOOT SEQUENCE
   ================================================================ */

const BOOT_MSGS = [
  { t: '[INIT] eric-portfolio v2.0 — booting...',        cls: 'boot-info', ms: 80  },
  { t: '[  OK] BIOS v2.0: POST completed',               cls: 'boot-ok',   ms: 100 },
  { t: '[  OK] CPU: initialized',                        cls: 'boot-ok',   ms: 80  },
  { t: '[  OK] Memory: 8192MB — healthy',                cls: 'boot-ok',   ms: 90  },
  { t: '[  OK] Storage: /home/eric — mounted',           cls: 'boot-ok',   ms: 80  },
  { t: '[  OK] Network: eth0 — connected',               cls: 'boot-ok',   ms: 100 },
  { t: '[LOAD] Loading kernel modules...',               cls: 'boot-info', ms: 180 },
  { t: '[  OK] module: design.ko — loaded',              cls: 'boot-ok',   ms: 80  },
  { t: '[  OK] module: webdev.ko — loaded',              cls: 'boot-ok',   ms: 80  },
  { t: '[  OK] module: security.ko — loaded',            cls: 'boot-ok',   ms: 80  },
  { t: '[  OK] module: edtech.ko — loaded',              cls: 'boot-ok',   ms: 100 },
  { t: '[AUTH] Authenticating: eric@alfonce...',         cls: 'boot-warn', ms: 280 },
  { t: '[  OK] Identity verified. Access granted.',      cls: 'boot-ok',   ms: 140 },
  { t: '[LOAD] Reading portfolio data...',               cls: 'boot-info', ms: 200 },
  { t: '[  OK] projects: 11 loaded',                     cls: 'boot-ok',   ms: 80  },
  { t: '[  OK] skills: cybersecurity [PRIMARY] — ready', cls: 'boot-ok',   ms: 80  },
  { t: '[  OK] social: 3 profiles linked',               cls: 'boot-ok',   ms: 80  },
  { t: '[ SYS] Starting portfolio shell...',             cls: 'boot-info', ms: 240 },
  { t: '[  OK] Shell ready. Welcome, stranger.',         cls: 'boot-ok',   ms: 120 },
];

function runBoot() {
  applyTheme(currentTheme);
  loadAvatar(); // start loading avatar in background
  let delay = 0;
  BOOT_MSGS.forEach((msg) => {
    delay += msg.ms;
    setTimeout(() => {
      const span = document.createElement('span');
      span.className = `boot-line ${msg.cls}`;
      span.textContent = msg.t;
      bootLog.appendChild(span);
      bootLog.scrollTop = bootLog.scrollHeight;
    }, delay);
  });
  setTimeout(() => {
    bootScreen.classList.add('hidden');
    input.focus();
    cmdWelcome();
    startIdle();
    initKonami();
  }, delay + 520);
}

/* ================================================================
   MATRIX RAIN
   ================================================================ */

function startMatrix() {
  matCanvas.width  = window.innerWidth;
  matCanvas.height = window.innerHeight;
  matCtx   = matCanvas.getContext('2d');
  const fs = 14;
  const cols = Math.floor(matCanvas.width / fs);
  matDrops = Array(cols).fill(1);

  const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノABCDEF0123456789{}[]<>/\\|!@#$%^&*';

  function draw() {
    matCtx.fillStyle = 'rgba(0,0,0,0.06)';
    matCtx.fillRect(0, 0, matCanvas.width, matCanvas.height);
    matCtx.font = `${fs}px monospace`;

    for (let i = 0; i < matDrops.length; i++) {
      const ch = chars[Math.floor(Math.random() * chars.length)];
      const bright = Math.random() > 0.95;
      matCtx.fillStyle = bright ? '#afffcf' : '#00ff41';
      matCtx.fillText(ch, i * fs, matDrops[i] * fs);
      if (matDrops[i] * fs > matCanvas.height && Math.random() > 0.975) matDrops[i] = 0;
      matDrops[i]++;
    }
    matRAF = requestAnimationFrame(draw);
  }
  draw();
  matCanvas.classList.add('active');
  matActive = true;
}

function stopMatrix() {
  if (matRAF) cancelAnimationFrame(matRAF);
  matRAF = null;
  matCanvas.classList.remove('active');
  if (matCtx) matCtx.clearRect(0, 0, matCanvas.width, matCanvas.height);
  matActive = false;
}

window.addEventListener('resize', () => {
  if (matActive) { stopMatrix(); startMatrix(); }
});

/* ================================================================
   CONFETTI
   ================================================================ */

function launchConfetti() {
  const colors = ['#7c6af5','#e87c9e','#4afa9a','#f5e27c','#4ae8fa','#fa4a6e','#ff8c42','#fff'];
  for (let i = 0; i < 100; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    const size = 5 + Math.random() * 8;
    p.style.cssText = `
      left:${Math.random() * 100}vw;
      top:-12px;
      width:${size}px;
      height:${size}px;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      border-radius:${Math.random() > .5 ? '50%' : '2px'};
      animation-duration:${1.8 + Math.random() * 2.2}s;
      animation-delay:${Math.random() * .6}s;
    `;
    document.body.appendChild(p);
    p.addEventListener('animationend', () => p.remove());
  }
}

/* ================================================================
   THEME
   ================================================================ */

function applyTheme(name) {
  document.documentElement.setAttribute('data-theme', name);
  currentTheme = name;
  localStorage.setItem('ea-theme', name);
}

function setTheme(name) {
  applyTheme(name);
  appendBlock(
    `<p class="success-line">Theme switched to <strong style="color:var(--accent)">${name}</strong>. ` +
    `Type <span style="color:var(--accent)">/themes</span> to see all options.</p>`
  );
  setTitle(`eric@portfolio: theme:${name}`);
}

/* ================================================================
   TITLE BAR BUTTONS
   ================================================================ */

document.getElementById('btn-close').addEventListener('click', () => {
  exitModal.hidden = false;
  document.getElementById('exit-cancel').focus();
});

document.getElementById('exit-cancel').addEventListener('click', () => {
  exitModal.hidden = true;
  input.focus();
});

document.getElementById('exit-confirm').addEventListener('click', () => {
  exitModal.hidden = true;
  terminal.style.transition = 'opacity .4s, transform .4s';
  terminal.style.opacity = '0';
  terminal.style.transform = 'scale(.95)';
  setTimeout(() => { terminal.style.display = 'none'; }, 400);
});

document.getElementById('btn-min').addEventListener('click', () => {
  if (isMinimized) {
    terminal.classList.remove('minimized');
    isMinimized = false;
    setTimeout(() => input.focus(), 350);
  } else {
    terminal.classList.add('minimized');
    isMinimized = true;
  }
});

document.getElementById('btn-max').addEventListener('click', () => {
  if (isMaximized) {
    terminal.classList.remove('maximized');
    wrapper.classList.remove('maximized');
    isMaximized = false;
  } else {
    terminal.classList.add('maximized');
    wrapper.classList.add('maximized');
    isMaximized = true;
  }
});

/* Keyboard: Escape closes modal or un-minimizes */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (!exitModal.hidden) { exitModal.hidden = true; input.focus(); }
    if (isMinimized) { terminal.classList.remove('minimized'); isMinimized = false; input.focus(); }
  }
});

/* ================================================================
   IDLE TIMER
   ================================================================ */

const IDLE_HINTS = [
  'Tip: type <span style="color:var(--accent)">/help</span> to see all commands.',
  'Tip: press <kbd style="color:var(--accent)">Tab</kbd> to autocomplete commands.',
  'Try <span style="color:var(--accent)">/security</span> — it\'s my primary domain.',
  'Feeling adventurous? Try <span style="color:var(--accent)">/matrix</span> or <span style="color:var(--accent)">/party</span>.',
  'Check out <span style="color:var(--accent)">/projects</span> to see what I\'ve built.',
];

function resetIdle() {
  clearTimeout(idleTimer);
  idleStep = 0;
  startIdle();
}

function startIdle() {
  idleTimer = setTimeout(function tick() {
    if (idleStep < IDLE_HINTS.length) {
      appendBlock(`<p class="warn-line">${IDLE_HINTS[idleStep]}</p>`);
      idleStep++;
      idleTimer = setTimeout(tick, 18000);
    }
  }, 15000);
}

/* ================================================================
   KONAMI CODE
   ================================================================ */

function initKonami() {
  const seq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown',
                'ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let pos = 0;
  document.addEventListener('keydown', (e) => {
    if (e.key === seq[pos]) {
      pos++;
      if (pos === seq.length) {
        pos = 0;
        launchConfetti();
        appendBlock(`<p class="success-line">KONAMI CODE! God mode activated. You clearly know your classics.</p>`);
        scrollToBottom();
      }
    } else {
      pos = 0;
    }
  });
}

/* ================================================================
   INPUT HANDLING
   ================================================================ */

input.addEventListener('keydown', (e) => {
  resetIdle();
  if (e.key === 'Enter') {
    const val = input.value.trim();
    input.value = '';
    hideAC();
    if (!val) return;
    cmdHistory.unshift(val);
    if (cmdHistory.length > 80) cmdHistory.pop();
    histIdx = -1;
    echoCmd(val);
    runCommand(val.toLowerCase());
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    histIdx = Math.min(histIdx + 1, cmdHistory.length - 1);
    input.value = cmdHistory[histIdx] || '';
    cursorEnd();
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    histIdx = Math.max(histIdx - 1, -1);
    input.value = histIdx < 0 ? '' : cmdHistory[histIdx];
    cursorEnd();
  } else if (e.key === 'Tab') {
    e.preventDefault();
    const first = getMatches(input.value)[0];
    if (first) { input.value = first.cmd; hideAC(); }
  } else if (e.key === 'Escape') {
    hideAC();
  }
});

input.addEventListener('input', () => {
  const val = input.value;
  if (!val) { hideAC(); return; }
  const m = getMatches(val);
  if (m.length) showAC(m); else hideAC();
});

document.addEventListener('click', (e) => {
  if (!exitModal.hidden) return;
  if (!isMinimized) input.focus();
});

/* ================================================================
   AUTOCOMPLETE
   ================================================================ */

function getMatches(val) {
  const v = val.toLowerCase();
  return PUBLIC_CMDS.filter(({ cmd }) => cmd.startsWith(v));
}

function showAC(items) {
  acDrop.innerHTML = items.slice(0, 8).map(({ cmd, desc }) =>
    `<div class="autocomplete-item" data-cmd="${h(cmd)}" role="option" tabindex="-1">
       ${h(cmd)}<span>${h(desc)}</span>
     </div>`
  ).join('');
  acDrop.classList.add('visible');
  acDrop.querySelectorAll('.autocomplete-item').forEach(el => {
    el.addEventListener('click', () => {
      input.value = el.dataset.cmd;
      hideAC();
      input.focus();
    });
  });
}

function hideAC() {
  acDrop.classList.remove('visible');
  acDrop.innerHTML = '';
}

/* ================================================================
   COMMAND RUNNER
   ================================================================ */

function runCommand(cmd) {
  const entry = COMMANDS[cmd];
  if (entry) {
    entry.fn();
    if (ROUTE_TITLES[cmd]) setTitle(ROUTE_TITLES[cmd]);
    else setTitle('eric@portfolio: ~');
  } else {
    appendBlock(
      `<p class="error-line">command not found: <strong>${h(cmd)}</strong>` +
      ` — type <span style="color:var(--accent)">/help</span> for available commands.</p>`
    );
  }
  scrollToBottom();
}

/* ================================================================
   OUTPUT HELPERS
   ================================================================ */

function appendBlock(html) {
  const div = document.createElement('div');
  div.className = 'out-block';
  div.innerHTML = html;
  output.appendChild(div);
  /* Trigger skill bar animations */
  setTimeout(() => {
    div.querySelectorAll('.skill-bar-fill[data-pct]').forEach((bar, i) => {
      bar.style.setProperty('--delay', `${i * 0.06}s`);
      bar.style.width = bar.dataset.pct + '%';
    });
  }, 60);
  scrollToBottom();
  return div;
}

function echoCmd(cmd) {
  const el = document.createElement('div');
  el.className = 'echo-line';
  el.textContent = cmd;
  output.appendChild(el);
}

function scrollToBottom() { output.scrollTop = output.scrollHeight; }
function cursorEnd()       { setTimeout(() => { input.selectionStart = input.selectionEnd = input.value.length; }, 0); }
function setTitle(t)       { titleEl.textContent = t; document.title = t.replace('eric@portfolio: ', 'Eric — '); }
function h(s)              { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function openLink(url) {
  appendBlock(
    `<p class="success-line">Opening <a href="${url}" target="_blank" rel="noopener" style="color:var(--cyan)">${url}</a> ...</p>`
  );
  window.open(url, '_blank', 'noopener');
}

/* ================================================================
   COMMAND FUNCTIONS
   ================================================================ */

/* ── Welcome ── */
function cmdWelcome() {
  const avatarSrc = avatarSmallUrl || 'AVATAR.jpg';

  appendBlock(`
    <div class="welcome-block">
      <div class="welcome-hero">
        <div class="welcome-avatar-wrap" id="welcome-avatar-wrap">
          <div class="welcome-avatar-frame">
            <img id="welcome-avatar-img" src="${avatarSrc}" alt="Eric Alfonce" />
          </div>
          <span class="welcome-status-dot"></span>
        </div>
        <div class="welcome-hero-text">
          <p class="welcome-name">Hey, I'm <span class="hl">Eric Alfonce</span></p>
          <p class="welcome-role">Cybersecurity &nbsp;|&nbsp; Dev &nbsp;|&nbsp; Motion Graphics &nbsp;|&nbsp; EdTech</p>
          <p class="welcome-desc">
            Security researcher and builder. I find vulnerabilities before the bad guys do,
            build web apps, design motion graphics, and push EdTech forward — one project at a time.
          </p>
        </div>
      </div>
      <div class="quick-links">
        <button class="cmd-link" onclick="runCommand('/about')">/about</button>
        <button class="cmd-link" onclick="runCommand('/security')">/security</button>
        <button class="cmd-link" onclick="runCommand('/projects')">/projects</button>
        <button class="cmd-link" onclick="runCommand('/skills')">/skills</button>
        <button class="cmd-link" onclick="runCommand('/certs')">/certs</button>
        <button class="cmd-link" onclick="runCommand('/contact')">/contact</button>
      </div>
      <p class="hint-line">Type a command or press <kbd style="color:var(--accent)">Tab</kbd> to autocomplete.
        Use <kbd style="color:var(--accent)">↑↓</kbd> for history.</p>
    </div>
  `);
}

/* ── About ── */
function cmdAbout() {
  const avatarSrc = avatarDataUrl || 'AVATAR.jpg';
  const avatarHtml = `<div class="avatar-wrap">
       <div class="pixel-avatar">
         <img id="about-avatar-img" src="${avatarSrc}" alt="Eric Alfonce — pixelated portrait" />
       </div>
       <div class="avatar-status">
         <span class="avatar-status-dot"></span>
         <span>available</span>
       </div>
     </div>`;

  appendBlock(`
    <div>
      <div class="about-layout">
        ${avatarHtml}
        <div style="flex:1;min-width:0">
          <p class="section-title">about</p>
          <div style="margin-bottom:.9rem">
            <div class="kv-row"><span class="kv-key">name</span>           <span class="kv-val">Eric Alfonce</span></div>
            <div class="kv-row"><span class="kv-key">primary skill</span>  <span class="kv-val" style="color:var(--red)">Cybersecurity</span></div>
            <div class="kv-row"><span class="kv-key">also</span>           <span class="kv-val">Developer · Motion Designer · EdTech</span></div>
            <div class="kv-row"><span class="kv-key">github</span>         <span class="kv-val"><a href="${PROFILE.github}" target="_blank" rel="noopener">github.com/ericalfonce</a></span></div>
            <div class="kv-row"><span class="kv-key">linkedin</span>       <span class="kv-val"><a href="${PROFILE.linkedin}" target="_blank" rel="noopener">in/eric-alfonce</a></span></div>
            <div class="kv-row"><span class="kv-key">instagram</span>      <span class="kv-val"><a href="${PROFILE.instagram}" target="_blank" rel="noopener">@ericalfonce</a></span></div>
            <div class="kv-row"><span class="kv-key">on github since</span><span class="kv-val">January 2022</span></div>
            <div class="kv-row"><span class="kv-key">status</span>         <span class="kv-val" style="color:var(--green)">● open to opportunities</span></div>
          </div>
        </div>
      </div>
      <hr class="divider"/>
      <p class="para">
        I'm a cybersecurity researcher and creative technologist.
        My primary focus is <strong style="color:var(--red)">offensive and defensive security</strong> — finding vulnerabilities,
        understanding attack surfaces, and building tools that make systems safer.
      </p>
      <p class="para">
        On the side, I build full-stack web applications in Python, PHP and JavaScript,
        design motion graphics that tell stories, and explore how technology can reshape education in Africa.
      </p>
      <p class="para">
        My goal: make the digital world more secure, one vulnerability at a time.
        Build technology that matters. Break things to understand them better.
      </p>
    </div>
  `);
}

/* ── Projects ── */
function cmdProjects() {
  const cards = PROJECTS.map((p, i) => {
    const tags = p.tags.map(t => `<span class="tag tag-${h(t)}">${h(t)}</span>`).join('');
    return `
      <div class="project-card" style="--i:${i}">
        <p class="project-name">${h(p.name)}</p>
        <p class="project-desc">${h(p.desc)}</p>
        <div class="project-footer">
          <div class="project-tags">${tags}</div>
          <a class="project-link" href="${p.url}" target="_blank" rel="noopener">↗ GitHub</a>
        </div>
      </div>
    `;
  }).join('');

  appendBlock(`
    <div>
      <p class="section-title">projects (${PROJECTS.length})</p>
      <div class="projects-grid">${cards}</div>
    </div>
  `);
}

/* ── Skills ── */
function cmdSkills() {
  let barIndex = 0;
  const categories = Object.entries(SKILLS).map(([cat, skills]) => {
    const rows = skills.map((s) => {
      const i = barIndex++;
      return `
        <div class="skill-row" style="--i:${i}">
          <span class="skill-name">${h(s.name)}</span>
          <div class="skill-bar-bg">
            <div class="skill-bar-fill" data-pct="${s.pct}" style="background:${s.color}"></div>
          </div>
          <span class="skill-pct">${s.pct}%</span>
        </div>
      `;
    }).join('');

    const isPrimary = cat.includes('PRIMARY');
    return `
      <div class="skill-category">
        <p class="skill-cat-title" style="${isPrimary ? 'color:var(--red);' : ''}">${h(cat)}</p>
        ${rows}
      </div>
    `;
  }).join('');

  appendBlock(`
    <div>
      <p class="section-title">skills</p>
      <div class="skills-section">${categories}</div>
      <p style="color:var(--muted);font-size:.83rem;margin-top:.5rem">
        Type <span style="color:var(--accent)">/security</span> for a deep dive into cybersecurity skills.
      </p>
    </div>
  `);
}

/* ── Security (KEY SECTION) ── */
function cmdSecurity() {
  appendBlock(`
    <div>
      <p class="section-title" style="color:var(--red)">cybersecurity  //  primary domain</p>

      <div class="sec-banner">
        <p class="banner-title">Ethical Hacker &amp; Security Researcher</p>
        <p style="color:var(--muted);font-size:.8rem;margin-top:.2rem">
          "The best defense is understanding offense. Know the attacker's mindset — build unbreakable systems."
        </p>
      </div>

      <div class="sec-columns">

        <div>
          <p class="sec-col-title">Focus Areas</p>
          <ul class="sec-list">
            <li>Web Application Security</li>
            <li>Penetration Testing</li>
            <li>Network Security</li>
            <li>Vulnerability Research</li>
            <li>OSINT &amp; Reconnaissance</li>
            <li>IoT / Hardware Security</li>
            <li>CTF Competitions</li>
          </ul>
        </div>

        <div>
          <p class="sec-col-title">Known Attack Vectors</p>
          <ul class="sec-list">
            <li>XSS / CSRF / IDOR</li>
            <li>SQL Injection</li>
            <li>Open Redirects</li>
            <li>Broken Auth / IDOR</li>
            <li>RF / Bluetooth Attacks</li>
            <li>Directory Traversal</li>
            <li>SSRF / XXE</li>
          </ul>
        </div>

        <div>
          <p class="sec-col-title">Platforms</p>
          <div style="margin-top:.2rem">
            <div class="platform-row">
              <span class="platform-dot dot-active"></span>
              <span style="color:var(--text)">TryHackMe</span>
              <span style="color:var(--muted);font-size:.83rem">— active</span>
            </div>
            <div class="platform-row">
              <span class="platform-dot dot-active"></span>
              <span style="color:var(--text)">HackTheBox</span>
              <span style="color:var(--muted);font-size:.83rem">— active</span>
            </div>
            <div class="platform-row">
              <span class="platform-dot dot-active"></span>
              <span style="color:var(--text)">GitHub</span>
              <span style="color:var(--muted);font-size:.83rem">— active</span>
            </div>
            <div class="platform-row">
              <span class="platform-dot dot-learning"></span>
              <span style="color:var(--text)">PicoCTF</span>
              <span style="color:var(--muted);font-size:.83rem">— learning</span>
            </div>
          </div>
        </div>

      </div>

      <hr class="divider"/>
      <p class="sec-col-title" style="margin-top:.5rem">Arsenal &amp; Tools</p>
      <div class="tools-grid" style="margin-top:.4rem">
        <div>
          <p class="tool-group-title">Recon</p>
          <div class="tool-tags">
            <span class="tool-tag">Nmap</span><span class="tool-tag">Shodan</span>
            <span class="tool-tag">theHarvester</span><span class="tool-tag">Maltego</span>
          </div>
        </div>
        <div>
          <p class="tool-group-title">Web Testing</p>
          <div class="tool-tags">
            <span class="tool-tag">Burp Suite</span><span class="tool-tag">OWASP ZAP</span>
            <span class="tool-tag">SQLMap</span><span class="tool-tag">Nikto</span>
          </div>
        </div>
        <div>
          <p class="tool-group-title">Exploitation</p>
          <div class="tool-tags">
            <span class="tool-tag">Metasploit</span><span class="tool-tag">Hydra</span>
            <span class="tool-tag">John the Ripper</span><span class="tool-tag">Hashcat</span>
          </div>
        </div>
        <div>
          <p class="tool-group-title">Network / RF</p>
          <div class="tool-tags">
            <span class="tool-tag">Wireshark</span><span class="tool-tag">tcpdump</span>
            <span class="tool-tag">Aircrack-ng</span><span class="tool-tag">nRF24L01</span>
          </div>
        </div>
        <div>
          <p class="tool-group-title">OS / Scripting</p>
          <div class="tool-tags">
            <span class="tool-tag">Kali Linux</span><span class="tool-tag">Parrot OS</span>
            <span class="tool-tag">Python</span><span class="tool-tag">Bash</span>
          </div>
        </div>
      </div>

      <hr class="divider"/>
      <p style="color:var(--muted);font-size:.84rem;margin-top:.3rem">
        Notable projects:
        <span style="color:var(--accent)">web-vuln-scanner</span> ·
        <span style="color:var(--accent)">webscanner</span> ·
        <span style="color:var(--accent)">Bluetooth-jammer-esp32</span> —
        type <span style="color:var(--accent)">/projects</span> to view all.
      </p>
    </div>
  `);
}

/* ── Certifications ── */
function cmdCerts() {
  const BADGE_LABEL = { earned: '✓ earned', progress: '⟳ in progress', planned: '◎ planned' };
  const items = CERTS.map((c, i) => `
    <div class="cert-card" style="--i:${i}">
      <div class="cert-info">
        <p class="cert-name">${h(c.name)}</p>
        <p class="cert-issuer">${h(c.issuer)}</p>
      </div>
      <span class="cert-badge badge-${h(c.status)}">${BADGE_LABEL[c.status]}</span>
    </div>
  `).join('');

  appendBlock(`
    <div>
      <p class="section-title">certifications &amp; learning path</p>
      ${items}
      <p style="color:var(--muted);font-size:.84rem;margin-top:.5rem">
        Always learning. Always hacking. — type <span style="color:var(--accent)">/ctf</span> for CTF experience.
      </p>
    </div>
  `);
}

/* ── CTF ── */
function cmdCtf() {
  appendBlock(`
    <div>
      <p class="section-title">ctf &amp; challenges</p>

      <div style="margin-bottom:.85rem">
        <p class="skill-cat-title">Active Platforms</p>
        <div class="platform-row" style="margin-bottom:.3rem">
          <span class="platform-dot dot-active"></span>
          <span style="color:var(--text);font-size:.83rem">TryHackMe</span>
          <span style="color:var(--muted);font-size:.83rem">— completing learning paths</span>
        </div>
        <div class="platform-row" style="margin-bottom:.3rem">
          <span class="platform-dot dot-active"></span>
          <span style="color:var(--text);font-size:.83rem">HackTheBox</span>
          <span style="color:var(--muted);font-size:.83rem">— Starting Point &amp; labs</span>
        </div>
        <div class="platform-row">
          <span class="platform-dot dot-learning"></span>
          <span style="color:var(--text);font-size:.83rem">PicoCTF</span>
          <span style="color:var(--muted);font-size:.83rem">— binary &amp; web challenges</span>
        </div>
      </div>

      <hr class="divider"/>

      <p class="skill-cat-title">Completed / Active Categories</p>
      <div style="font-size:.82rem;line-height:1.9">
        <div class="ctf-row"><span class="ctf-check">✓</span> Web Exploitation (XSS, SQLi, CSRF)</div>
        <div class="ctf-row"><span class="ctf-check">✓</span> Network Analysis &amp; Packet Forensics</div>
        <div class="ctf-row"><span class="ctf-check">✓</span> OSINT Challenges</div>
        <div class="ctf-row"><span class="ctf-check">✓</span> Enumeration &amp; Privilege Escalation</div>
        <div class="ctf-row"><span class="ctf-check">✓</span> Password Cracking &amp; Hash Analysis</div>
        <div class="ctf-row"><span class="ctf-arrow">→</span> <span style="color:var(--yellow)">Binary Exploitation (learning)</span></div>
        <div class="ctf-row"><span class="ctf-arrow">→</span> <span style="color:var(--yellow)">Reverse Engineering (learning)</span></div>
        <div class="ctf-row"><span class="ctf-arrow">→</span> <span style="color:var(--yellow)">Advanced Cryptography (planned)</span></div>
      </div>
    </div>
  `);
}

/* ── Philosophy ── */
function cmdPhilosophy() {
  appendBlock(`
    <div>
      <p class="section-title">philosophy</p>

      <div class="quote-block">
        <p class="quote-text">"The best offense is a good defense — and understanding one requires mastering the other."</p>
        <p class="quote-label">— on security</p>
      </div>

      <div class="phil-section">
        <p class="phil-title">On Cybersecurity</p>
        <p class="phil-text">
          Security isn't a feature you bolt on — it's a mindset you build with.
          Every line of code I write, I think about how it could be broken.
          Understanding the attacker's perspective is the only way to truly defend.
        </p>
      </div>

      <div class="phil-section">
        <p class="phil-title">On Development</p>
        <p class="phil-text">
          Code that doesn't solve a real problem is just text.
          I build with purpose: AgriMarket for farmers, EdTech tools for students,
          scanners for security researchers. Technology should improve lives.
        </p>
      </div>

      <div class="phil-section">
        <p class="phil-title">On Design</p>
        <p class="phil-text">
          Design is not how something looks — it's how it communicates.
          Motion graphics tell stories that static images can't.
          Good design makes complex things feel simple.
        </p>
      </div>

      <div class="phil-section">
        <p class="phil-title">On Learning</p>
        <p class="phil-text">
          Stay curious. Break things deliberately. Build things intentionally. Repeat.
          The best developers and hackers are the ones who never stop being students.
          Every CTF challenge, every failed exploit, every bug — a lesson.
        </p>
      </div>
    </div>
  `);
}

/* ── Uses ── */
function cmdUses() {
  appendBlock(`
    <div>
      <p class="section-title">tools &amp; setup</p>

      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:.9rem">

        <div class="uses-group">
          <p class="uses-title">Security</p>
          <ul class="uses-list">
            <li>Kali Linux (primary OS)</li>
            <li>Burp Suite Community</li>
            <li>Nmap</li>
            <li>Wireshark</li>
            <li>Metasploit Framework</li>
            <li>SQLMap</li>
            <li>Hydra</li>
          </ul>
        </div>

        <div class="uses-group">
          <p class="uses-title">Development</p>
          <ul class="uses-list">
            <li>VS Code</li>
            <li>Git / GitHub</li>
            <li>Python 3</li>
            <li>PHP</li>
            <li>Linux / Bash</li>
            <li>Docker (learning)</li>
          </ul>
        </div>

        <div class="uses-group">
          <p class="uses-title">Design</p>
          <ul class="uses-list">
            <li>Adobe After Effects</li>
            <li>Adobe Premiere Pro</li>
            <li>Figma</li>
            <li>Adobe Photoshop</li>
          </ul>
        </div>

        <div class="uses-group">
          <p class="uses-title">🔩 Hardware</p>
          <ul class="uses-list">
            <li>ESP32</li>
            <li>nRF24L01 (RF module)</li>
            <li>Raspberry Pi</li>
            <li>Arduino</li>
          </ul>
        </div>

      </div>
    </div>
  `);
}

/* ── Social ── */
function cmdSocial() {
  const GH_SVG  = `<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z"/></svg>`;
  const LI_SVG  = `<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065Zm1.782 13.019H3.555V9h3.564v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003Z"/></svg>`;
  const IG_SVG  = `<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069ZM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0Zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881Z"/></svg>`;

  appendBlock(`
    <div>
      <p class="section-title">social</p>
      <div class="social-list">
        <div class="social-item">
          <div class="social-icon" style="color:#fff">${GH_SVG}</div>
          <span class="social-label">GitHub</span>
          <span class="social-handle"><a href="${PROFILE.github}" target="_blank" rel="noopener">@ericalfonce</a></span>
        </div>
        <div class="social-item">
          <div class="social-icon" style="color:#0a66c2">${LI_SVG}</div>
          <span class="social-label">LinkedIn</span>
          <span class="social-handle"><a href="${PROFILE.linkedin}" target="_blank" rel="noopener">eric-alfonce</a></span>
        </div>
        <div class="social-item">
          <div class="social-icon" style="color:#e1306c">${IG_SVG}</div>
          <span class="social-label">Instagram</span>
          <span class="social-handle"><a href="${PROFILE.instagram}" target="_blank" rel="noopener">@ericalfonce</a></span>
        </div>
      </div>
    </div>
  `);
}

/* ── Contact ── */
function cmdContact() {
  appendBlock(`
    <div class="contact-block">
      <p class="section-title">contact</p>
      <p>Open to collaborations, freelance, and opportunities in cybersecurity.</p>
      <br/>
      <p><span class="lbl">GitHub    → </span><a href="${PROFILE.github}"    target="_blank" rel="noopener">github.com/ericalfonce</a></p>
      <p><span class="lbl">LinkedIn  → </span><a href="${PROFILE.linkedin}"  target="_blank" rel="noopener">linkedin.com/in/eric-alfonce</a></p>
      <p><span class="lbl">Instagram → </span><a href="${PROFILE.instagram}" target="_blank" rel="noopener">instagram.com/ericalfonce</a></p>
      <br/>
      <p style="color:var(--muted);font-size:.84rem">
        Quick commands: <span style="color:var(--accent)">/github</span> ·
        <span style="color:var(--accent)">/linkedin</span> ·
        <span style="color:var(--accent)">/instagram</span>
      </p>
    </div>
  `);
}

/* ── Themes ── */
function cmdThemes() {
  const cards = Object.entries(THEMES).map(([key, { label, desc }]) => `
    <div class="theme-card ${key === currentTheme ? 'active' : ''}" onclick="setTheme('${key}')">
      <p class="theme-card-name">${label}${key === currentTheme ? ' ✓' : ''}</p>
      <p class="theme-card-desc">${desc}</p>
    </div>
  `).join('');

  appendBlock(`
    <div>
      <p class="section-title">themes</p>
      <div class="theme-grid">${cards}</div>
      <p style="color:var(--muted);font-size:.84rem;margin-top:.6rem">
        Click a theme card or type <span style="color:var(--accent)">/dark</span> ·
        <span style="color:var(--accent)">/light</span> ·
        <span style="color:var(--accent)">/retro</span> ·
        <span style="color:var(--accent)">/glass</span>
      </p>
    </div>
  `);
}

/* ── Help ── */
function cmdHelp() {
  const groups = [
    { label: 'Core',      cmds: ['/about','/projects','/skills','/security','/certs','/ctf','/philosophy','/uses','/social','/contact'] },
    { label: 'Shortcuts', cmds: ['/github','/linkedin','/instagram'] },
    { label: 'Themes',    cmds: ['/themes','/dark','/light','/retro','/glass'] },
    { label: 'Fun',       cmds: ['/matrix','/party','/clear','/welcome'] },
  ];

  const rows = groups.map(g => {
    const cmdRows = g.cmds.map(cmd => {
      const entry = COMMANDS[cmd];
      return `<span class="help-cmd">${h(cmd)}</span><span class="help-desc">${entry ? h(entry.desc) : ''}</span>`;
    }).join('');
    return `<span class="help-section-label">${g.label}</span>${cmdRows}`;
  }).join('');

  appendBlock(`
    <div>
      <p class="section-title">commands</p>
      <div class="help-table">${rows}</div>
      <p style="color:var(--muted);font-size:.83rem;margin-top:.85rem">
        <kbd style="color:var(--accent)">↑↓</kbd> history &nbsp;|&nbsp;
        <kbd style="color:var(--accent)">Tab</kbd> autocomplete &nbsp;|&nbsp;
        Try the Konami code for a surprise
      </p>
    </div>
  `);
}

/* ── Matrix ── */
function cmdMatrix() {
  if (matActive) {
    stopMatrix();
    appendBlock(`<p class="info-line">Matrix rain stopped. Reality restored.</p>`);
  } else {
    startMatrix();
    appendBlock(`<p class="success-line">Matrix rain started. Wake up, Neo... 🟩</p>`);
  }
}

/* ── Party ── */
function cmdParty() {
  launchConfetti();
  appendBlock(`<p class="success-line">PARTY MODE ACTIVATED! You deserve it.</p>`);
}

/* ── Clear ── */
function cmdClear() { output.innerHTML = ''; setTitle('eric@portfolio: ~'); }

/* ================================================================
   EASTER EGGS
   ================================================================ */

function cmdWhoami() {
  appendBlock(`
    <p class="success-line">eric — cybersecurity researcher, builder, designer, digital explorer.</p>
    <p style="color:var(--muted);font-size:.8rem;margin-top:.2rem">uid=1337(eric) gid=0(hacker) groups=0(hacker),100(devs),200(designers)</p>
  `);
}

function cmdLs() {
  appendBlock(`
    <p style="font-size:.82rem;color:var(--accent)">drwxr-xr-x &nbsp; about/ &nbsp; projects/ &nbsp; security/ &nbsp; skills/ &nbsp; social/ &nbsp; contact/</p>
    <p style="font-size:.84rem;color:var(--text);margin-top:.15rem">drwxr-xr-x &nbsp; certs/ &nbsp; ctf/ &nbsp; philosophy/ &nbsp; uses/</p>
    <p style="font-size:.84rem;color:var(--muted);margin-top:.15rem">-rw-r--r-- &nbsp; README.md &nbsp; (type /about) &nbsp; &nbsp; -rwx------ &nbsp; secrets.enc</p>
  `);
}

function cmdPwd() {
  appendBlock(`<p style="color:var(--text);font-size:.84rem">/home/eric/portfolio</p>`);
}

function cmdCatReadme() {
  appendBlock(`
    <div style="font-size:.83rem;line-height:1.85">
      <p style="color:var(--accent);font-weight:600;margin-bottom:.4rem"># Eric Alfonce — Portfolio README</p>
      <p style="color:var(--muted)">A terminal-themed portfolio for a cybersecurity researcher &amp; developer.</p>
      <br/>
      <p style="color:var(--text)"><strong style="color:var(--accent2)">About:</strong> Passionate about ethical hacking, building web tools, and motion design.</p>
      <p style="color:var(--text)"><strong style="color:var(--accent2)">Primary:</strong> Cybersecurity — pen testing, web vulns, network security, IoT.</p>
      <p style="color:var(--text)"><strong style="color:var(--accent2)">Stack:</strong> Python, PHP, HTML/CSS, JavaScript, Bash, ESP32.</p>
      <br/>
      <p style="color:var(--muted)">Type /help to explore. Type /security for the good stuff.</p>
    </div>
  `);
}

function cmdGitLog() {
  const logs = [
    { hash:'a3f9c12', msg:'feat: add web vulnerability scanner module',       date:'2024-11-15' },
    { hash:'b8e2d44', msg:'fix: patch XSS vulnerability in webscanner UI',    date:'2024-10-28' },
    { hash:'c1a7f88', msg:'feat: add Bluetooth jammer ESP32 implementation',  date:'2024-09-10' },
    { hash:'d5b3e21', msg:'feat: AgriMarket v1.0 — Python marketplace',       date:'2024-08-03' },
    { hash:'e9c4a67', msg:'feat: Lenga Safaris website launch',               date:'2024-06-20' },
    { hash:'f2d8b93', msg:'chore: initial portfolio commit',                  date:'2022-01-17' },
  ];
  const rows = logs.map(l =>
    `<div style="font-size:.8rem;margin-bottom:.25rem">
       <span style="color:var(--yellow)">${l.hash}</span>
       <span style="color:var(--muted);margin:0 .5rem">${l.date}</span>
       <span style="color:var(--text)">${h(l.msg)}</span>
     </div>`
  ).join('');
  appendBlock(`
    <div>
      <p style="color:var(--muted);font-size:.83rem;margin-bottom:.5rem">git log --oneline --pretty=format</p>
      ${rows}
    </div>
  `);
}

function cmdGitStatus() {
  appendBlock(`
    <p style="color:var(--green);font-size:.83rem">On branch main</p>
    <p style="color:var(--text);font-size:.83rem">Your branch is up to date with 'origin/main'.</p>
    <p style="color:var(--muted);font-size:.83rem;margin-top:.3rem">nothing to commit, working tree clean ✓</p>
  `);
}

function cmdPing() {
  appendBlock(`
    <p style="font-size:.82rem;color:var(--text)">PING eric.alfonce — 56 bytes of data</p>
    <p style="font-size:.82rem;color:var(--green);margin-top:.2rem">64 bytes from eric: icmp_seq=1 ttl=64 time=1.337ms</p>
    <p style="font-size:.82rem;color:var(--green)">64 bytes from eric: icmp_seq=2 ttl=64 time=0.420ms</p>
    <p style="font-size:.82rem;color:var(--green)">64 bytes from eric: icmp_seq=3 ttl=64 time=1.000ms</p>
    <p style="font-size:.84rem;color:var(--muted);margin-top:.3rem">3 packets transmitted, 3 received, 0% packet loss. Eric is alive and responsive.</p>
  `);
}

function cmdNmap() {
  appendBlock(`
    <div style="font-size:.8rem;line-height:1.85">
      <p style="color:var(--muted)">Starting Nmap — eric-portfolio scan</p>
      <p style="color:var(--text);margin-top:.3rem">PORT      STATE  SERVICE      VERSION</p>
      <p style="color:var(--green)">80/tcp    open   http         portfolio v2.0</p>
      <p style="color:var(--green)">443/tcp   open   https        TLS 1.3</p>
      <p style="color:var(--green)">1337/tcp  open   hacker-mode  active</p>
      <p style="color:var(--yellow)">22/tcp    open   ssh          authorized keys only</p>
      <p style="color:var(--muted);margin-top:.3rem">4 ports scanned. No vulnerabilities found. This portfolio is secured.</p>
    </div>
  `);
}

function cmdHire() {
  appendBlock(`
    <p class="success-line">Permission granted. Eric Alfonce has been hired.</p>
    <p style="font-size:.8rem;color:var(--muted);margin-top:.3rem">
      Proceed to <a href="${PROFILE.linkedin}" target="_blank" rel="noopener" style="color:var(--cyan)">LinkedIn</a>
      to finalize the paperwork. Great choice!
    </p>
  `);
}

function cmdRmDoubts() {
  appendBlock(`
    <p style="color:var(--yellow);font-size:.83rem">rm: cannot remove 'doubts': Permission denied</p>
    <p style="color:var(--green);font-size:.83rem;margin-top:.2rem">[  OK] Alternative: rm -rf imposter_syndrome && apt-get install confidence</p>
    <p style="color:var(--muted);font-size:.84rem;margin-top:.2rem">Operation completed. You're doing great.</p>
  `);
}

function cmdHello() {
  appendBlock(`<p style="color:var(--green);font-size:.84rem">Hello! Type <span style="color:var(--accent)">/help</span> to explore, or <span style="color:var(--accent)">/security</span> for the fun stuff.</p>`);
}

/* ================================================================
   INIT
   ================================================================ */

window.addEventListener('DOMContentLoaded', runBoot);
