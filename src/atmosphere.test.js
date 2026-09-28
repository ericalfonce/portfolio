// @ts-nocheck
// Throwaway: does the atmosphere actually animate, or is the canvas
// silently inert? jsdom has no canvas backend, so this stubs one.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const hits = { fillRect: 0, fillText: 0, clearRect: 0 };

beforeEach(() => {
  hits.fillRect = 0;
  hits.fillText = 0;
  hits.clearRect = 0;

  document.body.innerHTML = '<canvas id="atmosphere" class="atmosphere"></canvas>';

  HTMLCanvasElement.prototype.getContext = function () {
    return {
      canvas: this,
      font: '',
      fillStyle: '',
      textBaseline: '',
      globalAlpha: 1,
      fillRect: (...a) => { hits.fillRect++; },
      fillText: (...a) => { hits.fillText++; },
      clearRect: (...a) => { hits.clearRect++; },
      save() {}, restore() {},
      translate() {}, scale() {}, beginPath() {}, arc() {}, stroke() {},
      measureText: () => ({ width: 10 }),
      createLinearGradient: () => ({ addColorStop() {} }),
    };
  };

  // Give the canvas a real size, since we read clientWidth/Height.
  Object.defineProperty(HTMLCanvasElement.prototype, 'clientWidth', { get: () => 1280, configurable: true });
  Object.defineProperty(HTMLCanvasElement.prototype, 'clientHeight', { get: () => 800, configurable: true });

  vi.useFakeTimers();
});

afterEach(() => { vi.useRealTimers(); });

/* Each test sets matchMedia and DOM first, then calls load(). The
   module is re-imported fresh so its top level never captures a stale
   matchMedia, and vi.resetModules makes the dynamic import return a
   new instance rather than the cached one. */
async function load() {
  vi.resetModules();
  const { initAtmosphere } = await import('./atmosphere.js');
  return initAtmosphere();
}

function advance(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

describe('atmosphere', () => {
  it('marks itself live and paints when motion is allowed', async () => {
    window.matchMedia = (q) => ({ matches: false, media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
    const cleanup = await load();

    const canvas = document.getElementById('atmosphere');
    expect(canvas.dataset.atmosphere).toBe('live');
    expect(canvas.getAttribute('aria-hidden')).toBe('true');

    await vi.advanceTimersByTimeAsync(300);
    expect(hits.fillRect, 'expected the trail fade to paint').toBeGreaterThan(0);
    expect(hits.fillText, 'expected glyphs to be drawn').toBeGreaterThan(0);
    cleanup();
  });

  it('paints a single static frame under prefers-reduced-motion', async () => {
    window.matchMedia = (q) => ({ matches: /reduced-motion/.test(q), media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
    const cleanup = await load();

    const canvas = document.getElementById('atmosphere');
    expect(canvas.dataset.atmosphere).toBe('static');
    const before = hits.fillText;
    await vi.advanceTimersByTimeAsync(500);
    expect(hits.fillText, 'must not keep animating').toBe(before);
    cleanup();
  });

  it('stays off on a narrow viewport, where it is all cost and no atmosphere', async () => {
    window.matchMedia = (q) => ({ matches: false, media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
    Object.defineProperty(HTMLCanvasElement.prototype, 'clientWidth', { get: () => 360, configurable: true });

    const cleanup = await load();
    expect(document.getElementById('atmosphere').dataset.atmosphere).toBe('off');
    await vi.advanceTimersByTimeAsync(300);
    expect(hits.fillText).toBe(0);
    cleanup();
  });

  it('stops drawing when the tab is hidden and resumes when it returns', async () => {
    window.matchMedia = (q) => ({ matches: false, media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
    const cleanup = await load();
    await vi.advanceTimersByTimeAsync(500);
    expect(hits.fillText, 'expected a first painted frame').toBeGreaterThan(0);

    /* jsdom's document.hidden is getter-only, so override it on the
       instance the way a real visibility change would. */
    const setHidden = (v) => Object.defineProperty(document, 'hidden', { value: v, configurable: true });

    setHidden(true);
    document.dispatchEvent(new Event('visibilitychange'));
    const parked = hits.fillText;
    await vi.advanceTimersByTimeAsync(400);
    expect(hits.fillText, 'must not paint while hidden').toBe(parked);

    setHidden(false);
    document.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(500);
    expect(hits.fillText, 'must resume when visible again').toBeGreaterThan(parked);
    cleanup();
  });

  it('does not blow up when the canvas is missing', async () => {
    document.body.innerHTML = '';
    window.matchMedia = (q) => ({ matches: false, media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
    await expect(load()).resolves.toBeInstanceOf(Function);
  });
});
