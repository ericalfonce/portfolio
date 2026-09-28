// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const strokes = { stroke: 0, arc: 0, clearRect: 0, fillRect: 0, fillText: 0 };

function stubCanvas(width = 1280, height = 800) {
  HTMLCanvasElement.prototype.getContext = function () {
    return {
      canvas: this, font: '', fillStyle: '', strokeStyle: '',
      lineWidth: 1, lineCap: '',
      beginPath() {}, moveTo() {}, lineTo() {},
      stroke() { strokes.stroke++; },
      arc() { strokes.arc++; },
      fill() {},
      clearRect() { strokes.clearRect++; },
      fillRect() { strokes.fillRect++; },
      fillText() { strokes.fillText++; },
      save() {}, restore() {},
      measureText: () => ({ width: 8 }),
    };
  };
  Object.defineProperty(HTMLCanvasElement.prototype, 'clientWidth', { get: () => width, configurable: true });
  Object.defineProperty(HTMLCanvasElement.prototype, 'clientHeight', { get: () => height, configurable: true });
}

function mq(reduced = false, fine = true) {
  window.matchMedia = (q) => ({
    matches: reduced ? /reduced-motion/.test(q) : (/hover:\s*hover/.test(q) ? fine : false),
    media: q,
    addListener() {}, removeListener() {},
    addEventListener() {}, removeEventListener() {},
    dispatchEvent() { return false; },
  });
}

beforeEach(() => {
  for (const k of Object.keys(strokes)) strokes[k] = 0;
  document.body.innerHTML = '<canvas id="atmosphere" class="atmosphere"></canvas>';
  stubCanvas();
  vi.useFakeTimers();
});

afterEach(() => { vi.useRealTimers(); });

async function load(mod = './atmosphere.js') {
  vi.resetModules();
  const m = await import(mod);
  return mod.endsWith('cursor.js') ? m.initCursor() : m.initAtmosphere();
}

describe('circuit atmosphere', () => {
  it('draws circuit traces and animates when motion is allowed', async () => {
    mq(false);
    const cleanup = await load();
    const canvas = document.getElementById('atmosphere');
    expect(canvas.dataset.atmosphere).toBe('live');
    expect(canvas.getAttribute('aria-hidden')).toBe('true');

    await vi.advanceTimersByTimeAsync(300);
    expect(strokes.stroke, 'expected trace segments').toBeGreaterThan(0);
    expect(strokes.arc, 'expected node dots').toBeGreaterThan(0);
    /* No falling characters: the matrix is gone. */
    expect(strokes.fillText, 'must not draw glyphs any more').toBe(0);

    const a = strokes.stroke;
    await vi.advanceTimersByTimeAsync(300);
    expect(strokes.stroke, 'expected it to keep redrawing').toBeGreaterThan(a);
    cleanup();
  });

  it('draws one static frame under prefers-reduced-motion', async () => {
    mq(true);
    const cleanup = await load();
    const canvas = document.getElementById('atmosphere');
    expect(canvas.dataset.atmosphere).toBe('static');
    const before = strokes.stroke;
    await vi.advanceTimersByTimeAsync(600);
    expect(strokes.stroke, 'must not keep redrawing').toBe(before);
    cleanup();
  });

  it('stays off on a narrow viewport', async () => {
    mq(false);
    stubCanvas(360, 800);
    const cleanup = await load();
    expect(document.getElementById('atmosphere').dataset.atmosphere).toBe('off');
    await vi.advanceTimersByTimeAsync(300);
    expect(strokes.stroke).toBe(0);
    cleanup();
  });

  it('pauses when the tab is hidden and resumes when it returns', async () => {
    mq(false);
    const cleanup = await load();
    await vi.advanceTimersByTimeAsync(300);
    expect(strokes.stroke).toBeGreaterThan(0);

    const setHidden = (v) => Object.defineProperty(document, 'hidden', { value: v, configurable: true });
    setHidden(true);
    document.dispatchEvent(new Event('visibilitychange'));
    const parked = strokes.stroke;
    await vi.advanceTimersByTimeAsync(400);
    expect(strokes.stroke, 'must not paint while hidden').toBe(parked);

    setHidden(false);
    document.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(300);
    expect(strokes.stroke, 'must resume when visible again').toBeGreaterThan(parked);
    cleanup();
  });

  it('caps trace density so a wide monitor does not get heavier', async () => {
    mq(false);
    const narrow = await load();
    await vi.advanceTimersByTimeAsync(200);
    const smallStrokes = strokes.stroke;
    narrow();
    for (const k of Object.keys(strokes)) strokes[k] = 0;

    stubCanvas(3840, 2160);
    const wide = await load();
    await vi.advanceTimersByTimeAsync(200);
    const wideStrokes = strokes.stroke;
    wide();
    /* Not proportional to area - that is the point of the cap. */
    expect(wideStrokes).toBeLessThan(smallStrokes * 6);
  });

  it('survives a missing canvas', async () => {
    document.body.innerHTML = '';
    await expect(load()).resolves.toBeInstanceOf(Function);
  });
});

describe('custom cursor', () => {
  function cursorDom() {
    document.body.innerHTML =
      '<div class="cursor-ring"></div><div class="cursor-dot"></div>';
  }

  it('engages on a fine pointer and follows the mouse', async () => {
    mq(false, true);
    cursorDom();
    const cleanup = await load('./cursor.js');
    expect(document.documentElement.dataset.cursor).toBe('on');

    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 200, clientY: 120 }));
    await vi.advanceTimersByTimeAsync(200);

    const dot = document.querySelector('.cursor-dot');
    expect(document.documentElement.classList.contains('has-custom-cursor')).toBe(true);
    /* Trailed toward the pointer, not parked at the origin. */
    const t = dot.style.transform;
    expect(t).toMatch(/translate3d/);
    const nums = t.match(/-?[\d.]+/g).map(Number);
    expect(nums[0]).toBeGreaterThan(0);
    expect(nums[1]).toBeGreaterThan(0);
    cleanup();
  });

  it('stays off for a coarse pointer, e.g. touch', async () => {
    mq(false, false);
    cursorDom();
    const cleanup = await load('./cursor.js');
    expect(document.documentElement.dataset.cursor).toBe('off');
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 10, clientY: 10 }));
    expect(document.documentElement.classList.contains('has-custom-cursor')).toBe(false);
    cleanup();
  });

  it('stays off under prefers-reduced-motion', async () => {
    mq(true, true);
    cursorDom();
    const cleanup = await load('./cursor.js');
    expect(document.documentElement.dataset.cursor).toBe('off');
    cleanup();
  });

  it('snaps back on Escape so it cannot strand over a dialog', async () => {
    mq(false, true);
    cursorDom();
    const cleanup = await load('./cursor.js');
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

  it('hides when the pointer leaves the window', async () => {
    mq(false, true);
    cursorDom();
    const cleanup = await load('./cursor.js');
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 50, clientY: 50 }));
    expect(document.documentElement.classList.contains('has-custom-cursor')).toBe(true);
    window.dispatchEvent(new Event('pointerleave'));
    expect(document.documentElement.classList.contains('has-custom-cursor')).toBe(false);
    cleanup();
  });

  it('detaches cleanly', async () => {
    mq(false, true);
    cursorDom();
    const cleanup = await load('./cursor.js');
    cleanup();
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 99, clientY: 99 }));
    expect(document.documentElement.classList.contains('has-custom-cursor')).toBe(false);
  });
});
