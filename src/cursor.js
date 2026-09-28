/* ================================================================
   Custom cursor — a crosshair dot and ring, fine pointers only.

   The old build did this site-wide and hid the native arrow, which is
   worse for anyone using a screen magnifier, a stylus, or a keyboard.
   This version only ever engages where a real hovering pointer exists:

     · @media (hover: hover) and (pointer: fine), so touch and coarse
       pointers never get it and keep the native behaviour
     · the native cursor is not set to none, so if the transform lags
       a frame the arrow is still there underneath
     · Escape, blur and pointerleave all snap it back to the centre
       and stop the loop, so it cannot get stranded under a dialog
     · disabled outright under prefers-reduced-motion

   The elements are aria-hidden and non-interactive, and they live
   outside the tab order, so nothing here is reachable by keyboard.
   ================================================================ */

import { prefersReducedMotion } from './utils.js';

const RING_LERP = 0.18; /* how tightly the ring trails the pointer */
const DOT_LERP = 0.45;

export function initCursor() {
  const dot = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  if (!dot || !ring) return () => {};

  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const root = document.documentElement;

  let on = false;
  let raf = 0;
  let x = 0;
  let y = 0;
  let rx = 0;
  let ry = 0;
  let dx = 0;
  let dy = 0;

  function place() {
    dot.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
  }

  function frame() {
    if (!on) return;
    dx += (x - dx) * DOT_LERP;
    dy += (y - dy) * DOT_LERP;
    rx += (x - rx) * RING_LERP;
    ry += (y - ry) * RING_LERP;
    place();
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (on) return;
    on = true;
    /* Seed both positions at the pointer so nothing flies in from 0,0. */
    dx = x; dy = y; rx = x; ry = y;
    place();
    root.classList.add('has-custom-cursor');
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    if (!on) return;
    on = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    root.classList.remove('has-custom-cursor');
    dx = 0; dy = 0; rx = 0; ry = 0;
    place();
  }

  function onMove(e) {
    x = e.clientX;
    y = e.clientY;
    start();
  }

  function onLeave() { stop(); }
  function onEnter() { start(); }

  function onKey(e) {
    if (e.key === 'Escape') stop();
  }

  if (!fine.matches || prefersReducedMotion()) {
    root.dataset.cursor = 'off';
    return () => {};
  }
  root.dataset.cursor = 'on';

  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', onMove, { passive: true });
  window.addEventListener('pointerleave', onLeave);
  window.addEventListener('blur', onLeave);
  document.documentElement.addEventListener('pointerenter', onEnter);
  document.addEventListener('keydown', onKey);

  return () => {
    stop();
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerdown', onMove);
    window.removeEventListener('pointerleave', onLeave);
    window.removeEventListener('blur', onLeave);
    document.documentElement.removeEventListener('pointerenter', onEnter);
    document.removeEventListener('keydown', onKey);
  };
}
