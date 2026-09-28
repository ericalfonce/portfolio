import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { hasBootedThisSession, runBoot, initBoot, resetBootSession, BOOT_LINES, BOOT_TARGET_MS, BOOT_TOTALS } from './boot.js';

function mountBootDOM({ withSkip = true } = {}) {
  document.body.innerHTML = `
    <div id="boot-screen">
      <div id="boot-log"></div>
      ${withSkip ? '<button type="button" data-boot-skip>skip</button>' : ''}
    </div>
  `;
}

/* Pin navigator.connection so the slow-connection branch is testable
   and cannot depend on whatever the host machine reports. */
function setConnection(conn) {
  vi.stubGlobal('navigator', { ...navigator, connection: conn });
}

const setReduced = (matches) =>
  vi.stubGlobal('matchMedia', () => ({ matches, addEventListener() {}, removeEventListener() {} }));

describe('BOOT_LINES', () => {
  it('runs for the full 20 seconds', () => {
    const dwell = BOOT_LINES.reduce((sum, l) => sum + l.ms, 0);
    const total = dwell + BOOT_TOTALS.preReady + BOOT_TOTALS.exit;
    expect(BOOT_TARGET_MS).toBe(20_000);
    expect(dwell).toBe(BOOT_TARGET_MS);
    expect(total).toBe(20_680);
  });

  it('lands on a signature line before the exit fade', () => {
    const last = BOOT_LINES[BOOT_LINES.length - 1];
    expect(last.label).toBe('CONTENT VERIFIED');
    expect(last.status).toBe('READY');
  });

  it('has a positive dwell for every line', () => {
    for (const line of BOOT_LINES) {
      expect(line.ms).toBeGreaterThan(0);
      expect(line.label).toBeTruthy();
    }
  });

  it('is long enough to fill the log without scrolling on a desktop', () => {
    /* The log reserves 25rem, and 21 lines at line-height 1.9 on
       0.8125rem is about 25.9rem, so this is deliberately at the
       edge rather than far under. Asserted so a future line removal
       cannot quietly leave the box half empty. */
    expect(BOOT_LINES.length).toBeGreaterThanOrEqual(20);
  });
});

describe('hasBootedThisSession', () => {
  beforeEach(() => resetBootSession());

  it('is false on a fresh session', () => {
    expect(hasBootedThisSession()).toBe(false);
  });

  it('is true once the flag is set', () => {
    sessionStorage.setItem('ea-booted', '1');
    expect(hasBootedThisSession()).toBe(true);
  });

  it('treats blocked storage as already booted so the visitor is never trapped', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(hasBootedThisSession()).toBe(true);
    spy.mockRestore();
  });
});

describe('initBoot', () => {
  beforeEach(() => {
    resetBootSession();
    mountBootDOM();
    setReduced(true);
  });

  afterEach(() => vi.restoreAllMocks());

  it('runs the full sequence on a fresh session and reveals the page', async () => {
    await initBoot();

    const screen = document.getElementById('boot-screen');
    expect(screen.classList.contains('boot-hidden')).toBe(true);
    expect(screen.getAttribute('aria-hidden')).toBe('true');
    expect(document.documentElement.classList.contains('is-booted')).toBe(true);
    expect(document.documentElement.classList.contains('is-booting')).toBe(false);
  });

  it('marks the session under reduced motion, so a reload goes straight to the site', async () => {
    await initBoot();
    expect(hasBootedThisSession()).toBe(true);
  });

  it('writes every boot line plus the final READY marker', async () => {
    await initBoot();
    const log = document.getElementById('boot-log');
    expect(log.querySelectorAll('.boot-line').length).toBe(BOOT_LINES.length + 1);
    expect(log.textContent).toContain('ERIC ALFONCE SYSTEM READY');
  });

  it('hides the overlay entirely when the session is already booted', async () => {
    await initBoot();
    /* A second call stands in for a hard reload in the same session. */
    document.body.innerHTML = `
      <div id="boot-screen"><div id="boot-log"></div></div>
    `;
    await initBoot();

    const screen = document.getElementById('boot-screen');
    expect(screen.style.display).toBe('none');
    expect(document.getElementById('boot-log').children.length).toBe(0);
  });

  it('calls onComplete exactly once', async () => {
    const onComplete = vi.fn();
    await initBoot({ onComplete });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('does not throw when the overlay markup is absent', async () => {
    document.body.innerHTML = '';
    const onComplete = vi.fn();
    await expect(initBoot({ onComplete })).resolves.toBeUndefined();
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(document.documentElement.classList.contains('is-booted')).toBe(true);
  });
});

/* The full run is 20s of real time. Every test that lets it play out
   to the end drives fake timers, so the suite stays fast and the
   20 second contract is still asserted for real. */
describe('runBoot', () => {
  beforeEach(() => {
    /* documentElement classes persist across tests in a file, and an
       earlier initBoot test leaves is-booted set. Clear it so the
       mid-sequence assertions below test this run and not a leftover. */
    document.documentElement.className = '';
    resetBootSession();
    mountBootDOM();
    setReduced(false);
    setConnection({ effectiveType: '4g', rtt: 50, saveData: false });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  /** Let the whole sequence play out, then flush the exit fade. */
  async function playToEnd() {
    const done = runBoot();
    await vi.advanceTimersByTimeAsync(BOOT_TARGET_MS + 5_000);
    return done;
  }

  /** Start the sequence and skip it immediately. */
  function skipNow() {
    const done = runBoot();
    const screen = document.getElementById('boot-screen');
    screen.querySelector('[data-boot-skip]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    return done;
  }

  it('is skippable — a click jumps straight to the finished state', async () => {
    const screen = document.getElementById('boot-screen');
    const done = runBoot();
    screen.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await vi.advanceTimersByTimeAsync(2_000);
    await done;

    expect(screen.classList.contains('boot-hidden')).toBe(true);
    /* The signature line is written even on skip. */
    expect(document.getElementById('boot-log').textContent).toContain('ERIC ALFONCE SYSTEM READY');
    /* The full line list was not. */
    expect(document.getElementById('boot-log').querySelectorAll('.boot-line').length).toBeLessThan(
      BOOT_LINES.length + 1
    );
  });

  it('is skippable with the keyboard', async () => {
    const done = runBoot();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await vi.advanceTimersByTimeAsync(2_000);
    await done;
    expect(document.getElementById('boot-screen').classList.contains('boot-hidden')).toBe(true);
  });

  it('removes its skip listeners once the sequence finishes', async () => {
    /* Spy before starting, so the adds and the removes are both seen. */
    const add = vi.spyOn(document, 'addEventListener');
    const remove = vi.spyOn(document, 'removeEventListener');
    await playToEnd();
    /* If the listeners leaked, a later click would still resolve the
       settled promise and the counts would not balance. */
    expect(add.mock.calls.filter(([t]) => t === 'click').length).toBe(0);
    expect(remove.mock.calls.filter(([t]) => t === 'click').length).toBe(0);
  });

  it('marks the session on the normal (non-reduced) path too', async () => {
    await playToEnd();
    expect(hasBootedThisSession()).toBe(true);
  });

  it('is escapable through the visible skip button', async () => {
    /* A 20 second gate is only acceptable if the way out is visible,
       not merely undocumented. */
    const screen = document.getElementById('boot-screen');
    const done = skipNow();
    await vi.advanceTimersByTimeAsync(2_000);
    await done;
    expect(screen.classList.contains('boot-hidden')).toBe(true);
  });

  it('plays the full 20s and every line when left alone', async () => {
    const screen = document.getElementById('boot-screen');
    const done = runBoot();

    /* Part way through, nothing has handed over yet. */
    await vi.advanceTimersByTimeAsync(10_000);
    expect(screen.classList.contains('boot-hidden')).toBe(false);
    expect(document.documentElement.classList.contains('is-booted')).toBe(false);
    const midway = document.getElementById('boot-log').querySelectorAll('.boot-line').length;
    expect(midway).toBeGreaterThan(0);
    expect(midway).toBeLessThan(BOOT_LINES.length);

    /* At the end everything is written and the page is handed over. */
    await vi.advanceTimersByTimeAsync(15_000);
    await done;
    expect(document.getElementById('boot-log').querySelectorAll('.boot-line').length)
      .toBe(BOOT_LINES.length + 1);
    expect(screen.classList.contains('boot-hidden')).toBe(true);
    expect(document.documentElement.classList.contains('is-booted')).toBe(true);
    expect(screen.classList.contains('boot-fast')).toBe(false);
  });

  it.each([
    ['2g', { effectiveType: '2g', rtt: 20 }],
    ['slow-2g', { effectiveType: 'slow-2g', rtt: 10 }],
    ['a very high rtt', { effectiveType: '4g', rtt: 3000 }],
    ['save-data', { effectiveType: '4g', rtt: 50, saveData: true }],
  ])('shortens the run on %s', async (_label, conn) => {
    setConnection(conn);
    const screen = document.getElementById('boot-screen');
    const done = runBoot();
    expect(screen.classList.contains('boot-fast'), 'flags the shortened run').toBe(true);

    /* The shortened schedule still writes every line, just faster. */
    await vi.advanceTimersByTimeAsync(BOOT_TOTALS.slowTarget + 2_000);
    await done;
    expect(document.getElementById('boot-log').querySelectorAll('.boot-line').length)
      .toBe(BOOT_LINES.length + 1);
    expect(screen.classList.contains('boot-hidden')).toBe(true);
  });

  it('completes the shortened run well before 20s', async () => {
    setConnection({ effectiveType: '2g', rtt: 20 });
    const screen = document.getElementById('boot-screen');
    const done = runBoot();
    await vi.advanceTimersByTimeAsync(BOOT_TOTALS.slowTarget + 2_000);
    await done;
    expect(screen.classList.contains('boot-hidden')).toBe(true);
    expect(BOOT_TOTALS.slowTarget).toBeLessThan(BOOT_TARGET_MS);
  });

  it('still works when navigator.connection is absent', async () => {
    setConnection(undefined);
    const screen = document.getElementById('boot-screen');
    const done = runBoot();
    expect(screen.classList.contains('boot-fast')).toBe(false);
    screen.querySelector('[data-boot-skip]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await vi.advanceTimersByTimeAsync(2_000);
    await done;
    expect(screen.classList.contains('boot-hidden')).toBe(true);
  });
});
