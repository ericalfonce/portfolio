/* ================================================================
   Boot sequence — the portfolio's opening identity.

   A 20 second run. That is a long time on a web page, and it is a
   deliberate trade: this is the first thing anyone sees, and the
   terminal POST has to last long enough to read as a system coming
   up rather than a spinner. It stays skippable, prominently, because
   a 20 second gate that cannot be escaped is a bug, not an identity.

   · 20s by default, counted from the line dwell times so the
     sequence and its test cannot drift apart.
   · Shown once per browsing session (sessionStorage), so internal
     navigation and reloads never replay it.
   · Skippable — any click, keypress or tap jumps to SYSTEM READY.
   · honours prefers-reduced-motion by resolving almost immediately
     with a plain cross-fade and no per-line animation.
   · Scales down on a slow connection, where a long wait on a thin
     pipe is the case most likely to lose a visitor.
   ================================================================ */

import { prefersReducedMotion } from './utils.js';

const SESSION_KEY = 'ea-booted';

/* Target for the full run: 20s of dwell, plus the pre-ready beat and
   the exit fade, lands the visitor on the site at ~21.2s. Exported so
   the tests assert the real number rather than a duplicated constant. */
export const BOOT_TARGET_MS = 20_000;

/**
 * Boot lines. `ms` is the dwell time AFTER the line is written, so
 * the total runtime is the sum of these.
 *
 * The dwell values are spread across the 20s target below rather than
 * typed in as absolutes, which is what keeps the run at 20s when a
 * line is added or removed. Weights are relative: the long pauses sit
 * on the lines that carry the idea.
 */
const WEIGHTED_LINES = [
  { label: 'INITIALIZING SYSTEM',          status: '...',   tone: 'info', weight: 2.0 },
  { label: 'CPU ARCHITECTURE',            status: 'x64',   tone: 'ok',   weight: 1.0 },
  { label: 'MEMORY',                      status: 'OK',    tone: 'ok',   weight: 1.0 },
  { label: 'KERNEL',                      status: 'OK',    tone: 'ok',   weight: 1.0 },
  { label: 'SECURITY SERVICES',           status: 'OK',    tone: 'ok',   weight: 1.6 },
  { label: 'FIREWALL RULESET',            status: 'OK',    tone: 'ok',   weight: 1.2 },
  { label: 'THREAT MODEL',                status: 'LOADED',tone: 'ok',   weight: 1.6 },
  { label: 'PAYMENT GATEWAY',             status: 'OK',    tone: 'ok',   weight: 1.2 },
  { label: 'NETWORK INTERFACE',           status: 'OK',    tone: 'ok',   weight: 1.0 },
  { label: 'DNS RESOLVER',                status: 'OK',    tone: 'ok',   weight: 1.0 },
  { label: 'TLS HANDSHAKE',               status: 'ESTABLISHED', tone: 'ok', weight: 1.4 },
  { label: 'SCANNING ENGINES',            status: 'OK',    tone: 'ok',   weight: 1.2 },
  { label: 'VULNERABILITY DATABASE',      status: 'SYNCED',tone: 'ok',   weight: 1.4 },
  { label: 'FORENSICS TOOLKIT',           status: 'OK',    tone: 'ok',   weight: 1.2 },
  { label: 'LINUX TOOLCHAIN',             status: 'OK',    tone: 'ok',   weight: 1.0 },
  { label: 'TERMINAL',                    status: 'READY', tone: 'ok',   weight: 1.8 },
  { label: 'LOADING PORTFOLIO MODULES',   status: '...',   tone: 'info', weight: 2.0 },
  { label: 'RENDERER',                    status: 'OK',    tone: 'ok',   weight: 1.2 },
  { label: 'GLITCH ENGINE',               status: 'OK',    tone: 'ok',   weight: 1.0 },
  { label: 'TYPE SYSTEM',                 status: 'OK',    tone: 'ok',   weight: 1.0 },
  { label: 'CONTENT VERIFIED',            status: 'READY', tone: 'ok',   weight: 2.0 },
];

/** Distribute BOOT_TARGET_MS across the weighted lines, rounding to
    whole milliseconds so the sum lands exactly on the target. */
function distribute(total, lines) {
  const weightSum = lines.reduce((s, l) => s + l.weight, 0);
  const out = [];
  let assigned = 0;
  lines.forEach((line, i) => {
    const isLast = i === lines.length - 1;
    const ms = isLast
      ? total - assigned
      : Math.round((line.weight / weightSum) * total);
    assigned += ms;
    out.push({ ...line, ms });
  });
  return out;
}

const BOOT_LINES = distribute(BOOT_TARGET_MS, WEIGHTED_LINES);

/* The pre-ready beat and the exit fade are outside the distributed
   budget, so the real total is target + these two. */
const PRE_READY_MS = 160;
const EXIT_MS = 520;

/** A slow connection is exactly where a 20s gate loses people. Cut it
    to a quarter, which still reads as a system check. */
const SLOW_MS = 5_000;
const SLOW_FACTOR = 0.25;

/** True when the connection looks slow enough to warrant a shorter run. */
function onSlowConnection() {
  const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!c) return false;
  if (c.saveData) return true;
  const t = c.effectiveType;
  if (t === '2g' || t === 'slow-2g') return true;
  /* rtt is in ms; 3s or more is a genuinely poor round trip. */
  return typeof c.rtt === 'number' && c.rtt >= 3000;
}

/** Scale the distributed dwell times down, or leave them alone. */
function dwellTimes() {
  if (!onSlowConnection()) return BOOT_LINES.map((l) => l.ms);

  const scaled = distribute(Math.round(BOOT_TARGET_MS * SLOW_FACTOR), WEIGHTED_LINES);
  return scaled.map((l) => l.ms);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Has the full sequence already played in this tab session? */
export function hasBootedThisSession() {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    /* Private mode / blocked storage — treat as "already booted" so
       we never trap the visitor in a loop they cannot escape. */
    return true;
  }
}

function markBooted() {
  try {
    sessionStorage.setItem(SESSION_KEY, '1');
  } catch { /* non-fatal */ }
}

function clearSessionFlag() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch { /* non-fatal */ }
}

function buildLine({ label, status, tone }) {
  const row = document.createElement('div');
  row.className = `boot-line boot-${tone}`;

  const name = document.createElement('span');
  name.className = 'boot-label';
  name.textContent = label;

  const dots = document.createElement('span');
  dots.className = 'boot-dots';
  /* Dots are decorative padding that aligns every status column. */
  const labelWidth = Math.max(0, 24 - label.length);
  dots.textContent = ' '.repeat(labelWidth) + ' ';

  const state = document.createElement('span');
  state.className = 'boot-status';
  state.textContent = status;

  row.append(name, dots, state);
  return row;
}

/**
 * Run the boot overlay.
 * @param {object} opts
 * @param {() => void} opts.onComplete  fired once the overlay is gone
 * @returns {Promise<void>}
 */
export async function runBoot({ onComplete } = {}) {
  const screen = document.getElementById('boot-screen');
  const log = document.getElementById('boot-log');
  const reduced = prefersReducedMotion();

  if (!screen || !log) {
    document.documentElement.classList.add('is-booted');
    onComplete?.();
    return;
  }

  document.documentElement.classList.add('is-booting');
  log.textContent = '';

  /* Slow connection: say so, so the shorter run reads as deliberate. */
  if (onSlowConnection()) screen.classList.add('boot-fast');

  /* Reduce motion: paint the finished state, then cross-fade. */
  if (reduced) {
    screen.classList.add('boot-reduced');
    BOOT_LINES.forEach((line) => log.appendChild(buildLine(line)));
    const ready = document.createElement('div');
    ready.className = 'boot-line boot-ready';
    ready.textContent = 'ERIC ALFONCE SYSTEM READY';
    log.appendChild(ready);
    /* The sequence has been shown, just briefly — still mark the
       session so a reload goes straight to the site. */
    markBooted();
    await sleep(420);
    await finish(screen, onComplete);
    return;
  }

  let resolveSkip;
  /* Resolves with true, so it is distinguishable from sleep()'s undefined. */
  const skipped = new Promise((r) => { resolveSkip = r; });
  const skip = () => resolveSkip(true);

  screen.addEventListener('click', skip);
  window.addEventListener('keydown', skip);
  window.addEventListener('pointerdown', skip);

  /* The visible skip button resolves the same promise. Wired here
     rather than in markup onclick so the listener is removed with the
     rest, and so a removed button cannot leave a dangling handler. */
  const skipBtn = screen.querySelector('[data-boot-skip]');
  skipBtn?.addEventListener('click', skip);

  /** Resolves true if the visitor skipped, false if the timer won. */
  const race = (ms) => Promise.race([sleep(ms).then(() => false), skipped]);

  screen.classList.add('boot-active');

  const dwell = dwellTimes();

  let didSkip = false;
  for (let i = 0; i < BOOT_LINES.length; i++) {
    didSkip = await race(dwell[i]);
    if (didSkip) break;
    log.appendChild(buildLine(BOOT_LINES[i]));
    log.scrollTop = log.scrollHeight;
  }

  /* Signature final line — always shown, even on skip, so the boot
     always resolves to a readable terminal state. */
  await race(PRE_READY_MS);
  const ready = document.createElement('div');
  ready.className = 'boot-line boot-ready';
  ready.textContent = 'ERIC ALFONCE SYSTEM READY';
  log.appendChild(ready);

  screen.removeEventListener('click', skip);
  screen.removeEventListener('pointerdown', skip);
  window.removeEventListener('keydown', skip);
  skipBtn?.removeEventListener('click', skip);

  markBooted();
  await finish(screen, onComplete);
}

/** Cross-fade the overlay away and hand control back to the page. */
async function finish(screen, onComplete) {
  screen.classList.add('boot-done');
  await sleep(EXIT_MS);

  screen.setAttribute('aria-hidden', 'true');
  screen.classList.add('boot-hidden');

  document.documentElement.classList.remove('is-booting');
  document.documentElement.classList.add('is-booted');

  onComplete?.();

  /* Remove from the a11y tree and stop it covering anything. The
     node stays in the DOM so a later "replay boot" (if ever needed)
     has something to write into. */
  setTimeout(() => {
    if (screen.classList.contains('boot-hidden')) screen.style.display = 'none';
  }, 700);
}

/**
 * Entry point. Full sequence once per session, otherwise skip
 * straight to the site.
 */
export async function initBoot({ onComplete } = {}) {
  if (hasBootedThisSession()) {
    const screen = document.getElementById('boot-screen');
    if (screen) {
      screen.setAttribute('aria-hidden', 'true');
      screen.style.display = 'none';
    }
    document.documentElement.classList.add('is-booted');
    onComplete?.();
    return;
  }

  await runBoot({ onComplete });
}

export { clearSessionFlag as resetBootSession, BOOT_LINES };

/* Exported for tests: the reduced-motion run and the slow-connection
   run are both derived from these, so a test can assert the real
   numbers rather than recomputing the distribution. */
export const BOOT_TOTALS = {
  preReady: PRE_READY_MS,
  exit: EXIT_MS,
  slowTarget: Math.round(BOOT_TARGET_MS * SLOW_FACTOR),
};
