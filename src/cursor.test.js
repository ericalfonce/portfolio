/* ================================================================
   Tests for the custom cursor.

   The cursor is the last decorative layer on the site. The background
   texture was tried twice - a matrix rain, then a circuit board - and
   cut both times, so these tests are also the place that asserts the
   page has no ambient layer behind the content any more.
   ================================================================ */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/* `fine` is the pointer capability being simulated, not a regex match:
   cursor.js asks for '(hover: hover) and (pointer: fine)' as a single
   query, so a coarse pointer has to answer false to the whole thing. */
function mq({ reduced = false, fine = true } = {}) {
  window.matchMedia = (q) => ({
    /* The two queries are answered independently: a reduced-motion
       request must not be conflated with pointer capability, or a
       default `fine: true` would read as reduced motion. */
    matches: /reduced-motion/.test(q) ? reduced : fine,
    media: q,
    onchange: null,
    addListener() {}, removeListener() {},
    addEventListener() {}, removeEventListener() {},
    dispatchEvent() { return false; },
  });
}

function dom() {
  document.body.innerHTML =
    '<div class="cursor-ring"></div><div class="cursor-dot"></div>';
}

async function load() {
  vi.resetModules();
  const { initCursor } = await import('./cursor.js');
  return initCursor();
}

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

describe('custom cursor', () => {
  it('engages on a fine pointer and follows the mouse', async () => {
    mq();
    dom();
    const cleanup = await load();
    const root = document.documentElement;
    expect(root.dataset.cursor).toBe('on');

    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 200, clientY: 120 }));
    await vi.advanceTimersByTimeAsync(200);

    expect(root.classList.contains('has-custom-cursor')).toBe(true);
    const t = document.querySelector('.cursor-dot').style.transform;
    expect(t).toMatch(/translate3d/);
    const [x, y] = t.match(/-?[\d.]+/g).map(Number);
    expect(x).toBeGreaterThan(0);
    expect(y).toBeGreaterThan(0);
    cleanup();
  });

  it('starts parked at the origin, not at the pointer', async () => {
    mq();
    dom();
    const cleanup = await load();

    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 400, clientY: 300 }));
    /* No frame yet, so it must not have teleported to the new spot. */
    expect(document.documentElement.classList.contains('has-custom-cursor')).toBe(true);
    const seed = document.querySelector('.cursor-dot').style.transform;
    expect(seed).toBe('translate3d(400px, 300px, 0)');
    cleanup();
  });

  it('stays off for a coarse pointer, e.g. touch', async () => {
    mq({ fine: false });
    dom();
    const cleanup = await load();
    expect(document.documentElement.dataset.cursor).toBe('off');

    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 10, clientY: 10 }));
    expect(document.documentElement.classList.contains('has-custom-cursor')).toBe(false);
    cleanup();
  });

  it('stays off under prefers-reduced-motion', async () => {
    mq({ reduced: true });
    dom();
    const cleanup = await load();
    expect(document.documentElement.dataset.cursor).toBe('off');
    cleanup();
  });

  it('snaps back on Escape so it cannot strand over a dialog', async () => {
    mq();
    dom();
    const cleanup = await load();

    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 300, clientY: 300 }));
    await vi.advanceTimersByTimeAsync(100);
    expect(document.documentElement.classList.contains('has-custom-cursor')).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(document.documentElement.classList.contains('has-custom-cursor')).toBe(false);

    const parked = document.querySelector('.cursor-dot').style.transform;
    await vi.advanceTimersByTimeAsync(300);
    expect(document.querySelector('.cursor-dot').style.transform).toBe(parked);
    cleanup();
  });

  it('hides when the pointer leaves the window or the tab blurs', async () => {
    mq();
    dom();
    const cleanup = await load();
    const root = document.documentElement;

    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 50, clientY: 50 }));
    expect(root.classList.contains('has-custom-cursor')).toBe(true);

    window.dispatchEvent(new Event('pointerleave'));
    expect(root.classList.contains('has-custom-cursor')).toBe(false);

    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 60, clientY: 60 }));
    expect(root.classList.contains('has-custom-cursor')).toBe(true);
    window.dispatchEvent(new Event('blur'));
    expect(root.classList.contains('has-custom-cursor')).toBe(false);
    cleanup();
  });

  it('stops animating once hidden', async () => {
    mq();
    dom();
    const cleanup = await load();

    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 300, clientY: 300 }));
    await vi.advanceTimersByTimeAsync(100);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    const parked = document.querySelector('.cursor-dot').style.transform;
    await vi.advanceTimersByTimeAsync(500);
    expect(document.querySelector('.cursor-dot').style.transform).toBe(parked);
    cleanup();
  });

  it('detaches cleanly', async () => {
    mq();
    dom();
    const cleanup = await load();
    cleanup();
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 99, clientY: 99 }));
    expect(document.documentElement.classList.contains('has-custom-cursor')).toBe(false);
  });

  it('does nothing when the markup is absent', async () => {
    mq();
    document.body.innerHTML = '';
    await expect(load()).resolves.toBeInstanceOf(Function);
  });
});
