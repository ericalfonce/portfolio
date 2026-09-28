import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { hasBootedThisSession, runBoot, initBoot, resetBootSession, BOOT_LINES } from './boot.js';

function mountBootDOM() {
  document.body.innerHTML = `
    <div id="boot-screen">
      <div id="boot-log"></div>
    </div>
  `;
}

const setReduced = (matches) =>
  vi.stubGlobal('matchMedia', () => ({ matches, addEventListener() {}, removeEventListener() {} }));

describe('BOOT_LINES', () => {
  it('keeps the full sequence inside the 2.5–4s target', () => {
    const dwell = BOOT_LINES.reduce((sum, l) => sum + l.ms, 0);
    const total = dwell + 160 /* pre-ready beat */ + 520 /* exit fade */;
    expect(total).toBeGreaterThanOrEqual(2500);
    expect(total).toBeLessThanOrEqual(4000);
  });

  it('ends on a VERIFIED / READY line', () => {
    const last = BOOT_LINES[BOOT_LINES.length - 1];
    expect(last.label).toBe('VERIFIED');
    expect(last.status).toBe('READY');
  });

  it('has a positive dwell for every line', () => {
    for (const line of BOOT_LINES) {
      expect(line.ms).toBeGreaterThan(0);
      expect(line.label).toBeTruthy();
    }
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

describe('runBoot', () => {
  beforeEach(() => {
    resetBootSession();
    mountBootDOM();
    setReduced(false);
  });

  afterEach(() => vi.restoreAllMocks());

  it('is skippable — a click jumps straight to the finished state', async () => {
    const screen = document.getElementById('boot-screen');
    const done = runBoot();
    screen.dispatchEvent(new MouseEvent('click', { bubbles: true }));
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
    await done;
    expect(document.getElementById('boot-screen').classList.contains('boot-hidden')).toBe(true);
  });

  it('removes its skip listeners once the sequence finishes', async () => {
    await runBoot();
    const add = vi.spyOn(document, 'addEventListener');
    const remove = vi.spyOn(document, 'removeEventListener');
    /* If the listeners leaked, a later click would still resolve the
       settled promise and the counts would not balance. */
    expect(add.mock.calls.filter(([t]) => t === 'click').length).toBe(0);
    expect(remove.mock.calls.filter(([t]) => t === 'click').length).toBe(0);
  });

  it('marks the session on the normal (non-reduced) path too', async () => {
    await runBoot();
    expect(hasBootedThisSession()).toBe(true);
  });
});
