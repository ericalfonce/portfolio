/* ================================================================
   Boot sequence — the portfolio's opening identity.

   Kept deliberately terminal-flavoured (system POST, not a progress
   bar) but tightened to a ~3s run so it feels cinematic rather than
   like a loading screen.

   · Shown once per browsing session (sessionStorage), so internal
     navigation never replays it.
   · Skippable — any click or keypress jumps to SYSTEM READY.
   · honours prefers-reduced-motion by resolving almost immediately
     with a plain cross-fade and no per-line animation.
   ================================================================ */

import { prefersReducedMotion } from './utils.js';

const SESSION_KEY = 'ea-booted';

/**
 * Boot lines. `ms` is the dwell time AFTER the line is written, so
 * the total runtime is the sum — kept around 2.1s of dwell plus the
 * 520ms exit fade, landing just inside the 2.5–4s target.
 */
const BOOT_LINES = [
  { label: 'INITIALIZING SYSTEM',            status: '...',  tone: 'info', ms: 220 },
  { label: 'CORE',                           status: 'OK',   tone: 'ok',   ms: 150 },
  { label: 'SECURITY SERVICES',              status: 'OK',   tone: 'ok',   ms: 150 },
  { label: 'NETWORK INTERFACE',              status: 'OK',   tone: 'ok',   ms: 150 },
  { label: 'PROJECT DATABASE',               status: 'OK',   tone: 'ok',   ms: 150 },
  { label: 'INTERFACE ENGINE',               status: 'OK',   tone: 'ok',   ms: 150 },
  { label: 'TERMINAL',                      status: 'READY',tone: 'ok',   ms: 300 },
  { label: 'LOADING PORTFOLIO MODULES',      status: '...',  tone: 'info', ms: 220 },
  { label: 'RENDERER',                      status: 'OK',   tone: 'ok',   ms: 160 },
  { label: 'VERIFIED',                      status: 'READY',tone: 'ok',   ms: 280 },
];

const EXIT_MS = 520;

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

  /** Resolves true if the visitor skipped, false if the timer won. */
  const race = (ms) => Promise.race([sleep(ms).then(() => false), skipped]);

  screen.classList.add('boot-active');

  let didSkip = false;
  for (const line of BOOT_LINES) {
    didSkip = await race(line.ms);
    if (didSkip) break;
    log.appendChild(buildLine(line));
    log.scrollTop = log.scrollHeight;
  }

  /* Signature final line — always shown, even on skip, so the boot
     always resolves to a readable terminal state. */
  await race(160);
  const ready = document.createElement('div');
  ready.className = 'boot-line boot-ready';
  ready.textContent = 'ERIC ALFONCE SYSTEM READY';
  log.appendChild(ready);

  screen.removeEventListener('click', skip);
  screen.removeEventListener('pointerdown', skip);
  window.removeEventListener('keydown', skip);

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
