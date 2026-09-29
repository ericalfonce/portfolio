/* ================================================================
   Tests for the encrypted hero text.

   The effect is decorative, so what matters is that it cannot damage
   the thing it decorates. The real characters are never replaced, the
   text is always readable if the animation does not finish, and it
   steps aside entirely under prefers-reduced-motion. Those three
   guarantees are what these tests hold.
   ================================================================ */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const mq = (reduced) =>
  vi.stubGlobal('matchMedia', (q) => ({
    matches: /reduced-motion/.test(q) ? reduced : true,
    media: q,
    addEventListener() {}, removeEventListener() {},
  }));

function hero() {
  document.body.innerHTML = `
    <h1 class="hero__name">ERIC ALFONCE</h1>
    <p class="hero__statement">
      <span class="glitch">I build secure</span>
      <span class="glitch">digital systems</span>
      <span class="glitch">and experiences</span>
    </p>
  `;
}

async function load() {
  vi.resetModules();
  return import('./encrypted-text.js');
}

/** The visible text of an element, noise layer excluded. */
function realText(el) {
  const clone = el.cloneNode(true);
  clone.querySelectorAll('.enc-layer').forEach((n) => n.remove());
  return clone.textContent;
}

beforeEach(() => {
  vi.useFakeTimers();
  globalThis.resetFrames();
  hero();
  mq(false);
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('encryptText', () => {
  it('leaves the real text in place and never hides it', async () => {
    const { encryptText } = await load();
    const el = document.querySelector('.hero__name');

    encryptText(el);
    globalThis.advanceFrames(20);

    /* The whole point: the headline is real text at every frame. The
       noise is an added layer, so a stalled or interrupted run
       degrades to readable text instead of to nothing. */
    expect(realText(el)).toBe('ERIC ALFONCE');
    expect(el.querySelector('.enc-layer')).not.toBeNull();
  });

  it('labels the element with its true text for assistive tech', async () => {
    const { encryptText } = await load();
    const el = document.querySelector('.hero__name');
    encryptText(el);
    globalThis.advanceFrames(20);

    /* The layer is aria-hidden, so the accessible name has to come
       from the element itself or the noise would be read aloud. */
    expect(el.getAttribute('aria-label')).toBe('ERIC ALFONCE');
    expect(el.querySelector('.enc-layer').getAttribute('aria-hidden')).toBe('true');
  });

  it('reveals left to right, one character per delay', async () => {
    const { encryptText } = await load();
    const el = document.querySelector('.hero__name');
    encryptText(el, { revealDelayMs: 50, flipDelayMs: 50 });

    const revealed = () =>
      el.querySelectorAll('.enc-char.is-revealed').length;

    globalThis.advanceFrames(10);
    expect(revealed()).toBe(0);

    /* 12 characters at 50ms each: 200ms in, the first four are real. */
    globalThis.advanceFrames(200);
    expect(revealed()).toBe(4);

    /* The run finishes at 600ms, at which point the layer is gone
       rather than left fully revealed, so there is nothing to count. */
    globalThis.advanceFrames(400);
    expect(el.querySelector('.enc-layer')).toBeNull();
  });

  it('removes the layer once the run completes', async () => {
    const { encryptText } = await load();
    const el = document.querySelector('.hero__name');
    encryptText(el, { revealDelayMs: 10 });

    globalThis.advanceFrames(10 * 12 + 100);

    /* Finished state is plain text with no leftover layer or class, so
       nothing can be left half-revealed on screen. */
    expect(el.querySelector('.enc-layer')).toBeNull();
    expect(el.classList.contains('is-encrypted')).toBe(false);
    expect(el.hasAttribute('aria-label')).toBe(false);
    expect(el.textContent).toBe('ERIC ALFONCE');
  });

  it('keeps spaces as spaces so the layout cannot jump', async () => {
    const { encryptText } = await load();
    const el = document.querySelector('.hero__name');
    encryptText(el, { flipDelayMs: 0 });

    globalThis.advanceFrames(1);

    const cells = [...el.querySelectorAll('.enc-char')];
    const real = 'ERIC ALFONCE';
    cells.forEach((cell, i) => {
      expect(cell.textContent === ' ').toBe(real[i] === ' ');
    });
  });

  it('only re-rolls characters that are still hidden', async () => {
    const { encryptText } = await load();
    const el = document.querySelector('.hero__name');
    encryptText(el, { revealDelayMs: 10_000, flipDelayMs: 10 });

    globalThis.advanceFrames(50);
    const before = [...el.querySelectorAll('.enc-char')].map((c) => c.textContent);

    globalThis.advanceFrames(50);
    const after = [...el.querySelectorAll('.enc-char')].map((c) => c.textContent);

    /* A long reveal delay means nothing is revealed yet, so the noise
       should be moving. If a "cheap" version re-rolled on every frame
       the text would read as static; this is what makes it a decode. */
    expect(after.join('')).not.toBe(before.join(''));
  });

  it('renders the final state immediately under reduced motion', async () => {
    mq(true);
    const { encryptText } = await load();
    const el = document.querySelector('.hero__name');

    encryptText(el);

    /* No timers advanced at all, and nothing was built: a visitor who
       asked for less motion gets the text, not an animation of it. */
    expect(el.querySelector('.enc-layer')).toBeNull();
    expect(el.classList.contains('is-encrypted')).toBe(false);
    expect(el.textContent).toBe('ERIC ALFONCE');
  });

  it('restores the element when cancelled mid-run', async () => {
    const { encryptText } = await load();
    const el = document.querySelector('.hero__name');

    const cancel = encryptText(el, { revealDelayMs: 50 });
    globalThis.advanceFrames(120);
    expect(el.querySelectorAll('.enc-char.is-revealed').length).toBeGreaterThan(0);

    cancel();
    /* Cancelling must not leave noise over the text, which is the
       failure mode a naive implementation would have. */
    expect(el.querySelector('.enc-layer')).toBeNull();
    expect(el.classList.contains('is-encrypted')).toBe(false);
    expect(el.textContent).toBe('ERIC ALFONCE');
  });

  it('still animates where a Range cannot be measured', async () => {
    /* jsdom has no Range.getBoundingClientRect, which stands in for any
       environment that cannot lay text out. The hero must not throw
       there - a decorative effect is not worth a broken headline. */
    const { encryptText } = await load();
    const el = document.querySelector('.hero__name');

    expect(() => encryptText(el, { revealDelayMs: 10 })).not.toThrow();
    globalThis.advanceFrames(400);

    expect(el.querySelector('.enc-layer')).toBeNull();
    expect(el.textContent).toBe('ERIC ALFONCE');
  });

  it('is safe on a missing or empty element', async () => {
    const { encryptText } = await load();
    expect(() => encryptText(null)()).not.toThrow();

    const empty = document.createElement('p');
    empty.textContent = '   ';
    expect(() => encryptText(empty, { revealDelayMs: 10 })()).not.toThrow();
    expect(empty.querySelector('.enc-layer')).toBeNull();
  });

  it('restarts cleanly when the text changes underneath it', async () => {
    const { encryptText } = await load();
    const el = document.querySelector('.hero__name');

    encryptText(el, { revealDelayMs: 10 });
    globalThis.advanceFrames(10 * 12 + 100);
    expect(el.textContent).toBe('ERIC ALFONCE');

    el.textContent = 'ERIC ALFONCE II';
    encryptText(el, { revealDelayMs: 10 });
    globalThis.advanceFrames(10 * 15 + 100);

    /* One layer at a time - a second run must not stack noise on top of
       noise, which is what re-running on a stale element would do. */
    expect(el.querySelectorAll('.enc-layer')).toHaveLength(0);
    expect(el.textContent).toBe('ERIC ALFONCE II');
  });
});

describe('encryptAll', () => {
  it('animates every match and clears up after itself', async () => {
    const { encryptAll } = await load();
    const cancel = encryptAll('.hero__statement .glitch', {
      revealDelayMs: 10,
      staggerMs: 20,
    });

    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(0);
    globalThis.advanceFrames(400);

    const lines = [...document.querySelectorAll('.glitch')];
    expect(lines.map(realText)).toEqual([
      'I build secure', 'digital systems', 'and experiences',
    ]);

    cancel();
    expect(document.querySelectorAll('.enc-layer')).toHaveLength(0);
  });

  it('staggers by index so the statement reads top to bottom', async () => {
    const { encryptAll } = await load();
    encryptAll('.hero__statement .glitch', { revealDelayMs: 10, staggerMs: 200 });

    /* No timer is advanced here on purpose: the first line has a zero
       start delay so it is already running, and the other two are
       still waiting on a real 200ms/400ms timeout. */
    globalThis.advanceFrames(16);

    const started = [...document.querySelectorAll('.glitch')]
      .filter((l) => l.classList.contains('is-encrypted'));
    expect(started).toHaveLength(1);
    expect(started[0]).toBe(document.querySelectorAll('.glitch')[0]);
  });
});
