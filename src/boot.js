/* ================================================================
   Boot sequence — the portfolio's opening identity.

   A short terminal-style introduction that preserves the site's
   identity without making the page feel stuck.

   · 2.6s on every full page start.
   · The complete site is revealed only after the boot handoff.
   · Skippable — any click, keypress or tap jumps to SYSTEM READY.
   · honours prefers-reduced-motion by resolving almost immediately
     with a plain cross-fade and no per-line animation.
   · Scales down on a slow connection, where a long wait on a thin
     pipe is the case most likely to lose a visitor.
   ================================================================ */

import { prefersReducedMotion } from './utils.js';

/* Target for the full run: 2.6s of dwell, plus the pre-ready beat and
   the exit fade, lands the visitor on the site at ~3s. Exported so
   the tests assert the real number rather than a duplicated constant. */
export const BOOT_TARGET_MS = 2_600;

/**
 * Boot lines. `ms` is the dwell time AFTER the line is written, so
 * the total runtime is the sum of these.
 *
 * The dwell values are spread across the target below rather than
 * typed in as absolutes, which keeps the run on target when a
 * line is added or removed. Weights are relative: the long pauses sit
 * on the lines that carry the idea.
 */
const WEIGHTED_LINES = [
  { time: '0.000000', label: 'Linux version 6.8.0-eric (portfolio@tanzania)', tone: 'info', weight: 1.25 },
  { time: '0.021337', label: 'Command line: quiet portfolio.mode=secure', tone: 'muted', weight: 0.75 },
  { time: '0.083114', label: 'x86/cpu: architecture initialized', status: 'OK', tone: 'ok', weight: 0.8 },
  { time: '0.164802', label: 'Memory: creative workspace available', status: 'OK', tone: 'ok', weight: 0.8 },
  { time: '0.311450', label: 'security: loading application safeguards', status: 'OK', tone: 'ok', weight: 0.9 },
  { time: '0.487219', label: 'net: bringing interface portfolio0 up', status: 'OK', tone: 'ok', weight: 0.9 },
  { time: '0.724006', label: 'crypto: verified project metadata', status: 'OK', tone: 'ok', weight: 0.8 },
  { time: '1.036481', label: 'systemd[1]: Mounted /work and /about', status: 'OK', tone: 'ok', weight: 0.9 },
  { time: '1.402735', label: 'renderer: activating visual interface', status: 'OK', tone: 'ok', weight: 1.0 },
  { time: '1.863290', label: 'portfolio0: link becomes ready', status: 'UP', tone: 'ok', weight: 1.0 },
  { time: '2.218406', label: 'systemd[1]: Reached target Portfolio', status: 'READY', tone: 'ready', weight: 1.1 },
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
const PRE_READY_MS = 80;
const EXIT_MS = 320;

/** Keep the flourish especially brief when data-saving is enabled or
    the connection is poor. */
const SLOW_FACTOR = 0.4;

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

function buildLine({ time, label, status, tone }) {
  const row = document.createElement('div');
  row.className = `boot-line boot-${tone}`;

  const stamp = document.createElement('span');
  stamp.className = 'boot-time';
  stamp.textContent = `[ ${time.padStart(10, ' ')} ]`;

  const name = document.createElement('span');
  name.className = 'boot-label';
  name.textContent = label;

  row.append(stamp, name);
  if (status) {
    const state = document.createElement('span');
    state.className = 'boot-status';
    state.textContent = `[ ${status} ]`;
    row.appendChild(state);
  }
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
    ready.innerHTML = '<span>Welcome to EricOS.</span><span class="boot-cursor" aria-hidden="true"></span>';
    log.appendChild(ready);
    await sleep(120);
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
    /* Write the line, THEN wait. Waiting first left the log empty for
       the whole of the opening dwell — about a second and a half of
       nothing — which reads as a page that has not started rather than
       as a system that is checking itself. */
    log.appendChild(buildLine(BOOT_LINES[i]));
    log.scrollTop = log.scrollHeight;
    didSkip = await race(dwell[i]);
    if (didSkip) break;
  }

  /* Signature final line — always shown, even on skip, so the boot
     always resolves to a readable terminal state. */
  await race(PRE_READY_MS);
  const ready = document.createElement('div');
  ready.className = 'boot-line boot-ready';
  ready.innerHTML = '<span>Welcome to EricOS.</span><span class="boot-cursor" aria-hidden="true"></span>';
  log.appendChild(ready);

  screen.removeEventListener('click', skip);
  screen.removeEventListener('pointerdown', skip);
  window.removeEventListener('keydown', skip);
  skipBtn?.removeEventListener('click', skip);

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
 * Entry point. Run the full sequence on every document load, then
 * reveal the complete site.
 *
 * `?boot=1` forces the sequence and `?boot=0` suppresses it, so the
 * intro can be replayed or suppressed explicitly during debugging.
 */
export async function initBoot({ onComplete } = {}) {
  const forced = readBootOverride();

  if (forced === false) {
    revealSite(onComplete);
    return;
  }

  await runBoot({ onComplete });
}

/** '1' forces the intro, '0' suppresses it, anything else is no opinion. */
function readBootOverride() {
  const param = new URLSearchParams(window.location.search).get('boot');
  if (param === '1' || param === 'true') return true;
  if (param === '0' || param === 'false') return false;
  return null;
}

/** Hand control to the page with the overlay already out of the way. */
function revealSite(onComplete) {
  const screen = document.getElementById('boot-screen');
  if (screen) {
    screen.setAttribute('aria-hidden', 'true');
    screen.style.display = 'none';
  }
  document.documentElement.classList.add('is-booted');
  onComplete?.();
}

export { BOOT_LINES };

/* Exported for tests: the reduced-motion run and the slow-connection
   run are both derived from these, so a test can assert the real
   numbers rather than recomputing the distribution. */
export const BOOT_TOTALS = {
  preReady: PRE_READY_MS,
  exit: EXIT_MS,
  slowTarget: Math.round(BOOT_TARGET_MS * SLOW_FACTOR),
};
