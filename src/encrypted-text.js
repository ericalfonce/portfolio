/* ================================================================
   Encrypted text — the hero types itself out of noise.

   A port of a shadcn/motion EncryptedText component to the site's
   own stack. That component is a React function using `motion` and
   `useInView`; this site is vanilla ES modules, so the same reveal is
   implemented directly on a DOM element and the React dependencies
   are dropped. The behaviour is deliberately identical:

     · every character starts as a random glyph from CHARSET
     · the real characters are revealed left to right, one every
       revealDelayMs
     · characters that are not yet revealed keep re-rolling every
       flipDelayMs, so the text looks like it is being decrypted
     · spaces stay spaces throughout, so line breaks never jump

   Two things differ from the original, both because of this site:

     · prefers-reduced-motion resolves the whole string immediately.
       The site already treats motion as opt-out in cursor.js and
       boot.js, and an effect that cannot be switched off is a
       regression against that, not a feature.
     · the real text is never hidden. It is present in the markup,
       aria-labelled on the wrapper, and the noise is an overlay of
       additional characters, not a replacement of the real ones. A
       failed or interrupted run therefore degrades to plain readable
       text — the same guarantee the glitch effect makes, and the
       reason the old build's reveal observer was a bug.

   The text is also never left as noise: if the element scrolls away
   mid-run, or the tab is backgrounded, the run still completes.
   ================================================================ */

import { prefersReducedMotion } from './utils.js';

/* Same character set the original component ships with. */
const CHARSET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-={}[];:,.<>/?';

const DEFAULTS = {
  revealDelayMs: 50,
  flipDelayMs: 50,
  startDelayMs: 0,
};

/** One random glyph. */
function randomChar(charset) {
  return charset.charAt(Math.floor(Math.random() * charset.length));
}

/** Gibberish of the same length as `text`, with spaces preserved so
    the layout does not reflow while the text is still scrambled. */
function scramble(text, charset) {
  let out = '';
  for (const ch of text) out += ch === ' ' ? ' ' : randomChar(charset);
  return out;
}

/**
 * Build the noise layer for an element.
 *
 * The real text is left in place and the element is labelled with it,
 * so assistive tech and any failure mode read the true string. The
 * noise is a layer of spans marked aria-hidden, positioned over the
 * characters it is standing in for.
 *
 * Each noise character is placed at the exact offset of its real
 * counterpart, measured with a Range per character. A grid of fixed
 * `1ch` columns was tried first and cannot work here: the hero is set
 * in a large proportional display face where an advance width is not
 * a character's width, so the noise drifted wider than the text and
 * wrapped onto a second line part-way through the reveal.
 */
function buildLayer(el, text, charset) {
  const layer = document.createElement('span');
  layer.className = 'enc-layer';
  layer.setAttribute('aria-hidden', 'true');

  const elRect = el.getBoundingClientRect();
  const range = document.createRange();
  const chars = [];
  let index = 0;

  for (const node of [...el.childNodes]) {
    /* Only the element's own text is encrypted. A nested element would
       need its own text walked, and none of the targets have one. */
    if (node.nodeType !== Node.TEXT_NODE) continue;

    for (let i = 0; i < node.textContent.length; i += 1) {
      range.setStart(node, i);
      range.setEnd(node, i + 1);
      const rect = measureRange(range, elRect, node, i);

      const isSpace = text[index] === ' ';
      const cell = document.createElement('span');
      cell.className = 'enc-char';
      cell.textContent = isSpace ? ' ' : randomChar(charset);
      /* Offsets are relative to the host, so the layer does not have to
         be reconciled as the reveal progresses. */
      cell.style.left = `${rect.left}px`;
      cell.style.top = `${rect.top}px`;
      cell.style.width = `${rect.width}px`;
      cell.style.height = `${rect.height}px`;

      layer.appendChild(cell);
      chars.push({ cell, isSpace });
      index += 1;
    }
  }

  el.classList.add('is-encrypted');
  el.setAttribute('aria-label', text);
  el.appendChild(layer);
  return chars;
}

/** Rect of a single character, relative to the host element.
 *
 *    Falls back to a proportional slice of the host box when the
 *    environment cannot measure a Range - jsdom does not implement it,
 *    and a headless or partial DOM would otherwise throw and take the
 *    hero down with it. The fallback is approximate, so the effect
 *    degrades to a slightly-off overlay instead of breaking the page. */
function measureRange(range, elRect, node, i) {
  if (typeof range.getBoundingClientRect === 'function') {
    const r = range.getBoundingClientRect();
    return {
      left: r.left - elRect.left,
      top: r.top - elRect.top,
      width: r.width,
      height: r.height,
    };
  }

  const total = node.textContent.length || 1;
  const width = elRect.width / total;
  return {
    left: i * width,
    top: 0,
    width,
    height: elRect.height,
  };
}

/**
 * Animate an element's text in from noise.
 *
 * @param {HTMLElement} el    element whose text is the string to reveal
 * @param {object} [options]
 * @param {number} [options.revealDelayMs]  ms per revealed character
 * @param {number} [options.flipDelayMs]     ms between noise re-rolls
 * @param {number} [options.startDelayMs]    ms to wait before starting
 * @param {string} [options.charset]         characters used for noise
 * @returns {() => void} cancel function; also called on completion
 */
export function encryptText(el, options = {}) {
  if (!el) return () => {};

  const {
    revealDelayMs = DEFAULTS.revealDelayMs,
    flipDelayMs = DEFAULTS.flipDelayMs,
    startDelayMs = DEFAULTS.startDelayMs,
    charset = CHARSET,
  } = options;

  const text = (el.textContent || '').trim();
  if (!text) return () => {};

  let raf = 0;
  let startTimer = 0;
  let done = false;

  const cleanup = () => {
    if (done) return;
    done = true;
    cancelAnimationFrame(raf);
    clearTimeout(startTimer);
    /* Removing the layer is what ends the effect: the real characters
       were never touched, so the finished state needs no styling of
       its own and cannot be left half-revealed. */
    el.classList.remove('is-encrypted');
    el.removeAttribute('aria-label');
    el.querySelector('.enc-layer')?.remove();
  };

  /* Reduced motion: the finished state, no noise, no timers. */
  if (prefersReducedMotion()) return cleanup;

  const step = Math.max(1, revealDelayMs);
  const flip = Math.max(0, flipDelayMs);

  const run = () => {
    /* Built here rather than up front: the layer is the noise, and a
       staggered element must not show any until its own turn comes. */
    const chars = buildLayer(el, text, charset);
    const total = chars.length;

    /* The start time is taken from the first frame's own timestamp
       rather than from performance.now(). Reading a separate clock can
       disagree with the timestamp the frame callback is handed, which
       would make elapsed time jump and skip or stall the reveal. */
    let start = null;
    let lastFlip = 0;

    const frame = (now) => {
      if (start === null) {
        start = now;
        lastFlip = now;
      }

      const revealed = Math.min(total, Math.floor((now - start) / step));

      /* Only re-roll what is still hidden, and only on the flip
         interval. Re-rolling everything each frame is what makes
         cheap versions of this look like static, not like a decode. */
      if (now - lastFlip >= flip) {
        for (let i = revealed; i < total; i += 1) {
          if (!chars[i].isSpace) chars[i].cell.textContent = randomChar(charset);
        }
        lastFlip = now;
      }

      for (let i = 0; i < total; i += 1) {
        chars[i].cell.classList.toggle('is-revealed', i < revealed);
      }

      if (revealed >= total) {
        cleanup();
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
  };

  if (startDelayMs > 0) startTimer = setTimeout(run, startDelayMs);
  else run();

  return cleanup;
}

/**
 * Encrypt every match of a selector.
 *
 * The hero name and the three statement lines are staggered by index,
 * so the page assembles top to bottom instead of all at once.
 *
 * @returns {() => void} cancels every animation started
 */
export function encryptAll(selector, options = {}) {
  const { staggerMs = 0, ...rest } = options;
  const cleanups = [];

  document.querySelectorAll(selector).forEach((el, i) => {
    cleanups.push(encryptText(el, { ...rest, startDelayMs: i * staggerMs }));
  });

  return () => cleanups.forEach((fn) => fn());
}
