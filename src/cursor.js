import { prefersReducedMotion } from './utils.js';

export function initCursor() {
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  if (isCoarsePointer || prefersReducedMotion()) return;

  const dot  = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  if (!dot || !ring) return;

  document.body.classList.add('custom-cursor-active');

  let ringX = 0, ringY = 0;

  window.addEventListener('pointermove', (e) => {
    dot.style.left = `${e.clientX}px`;
    dot.style.top  = `${e.clientY}px`;
    ringX = e.clientX;
    ringY = e.clientY;
  });

  function raf() {
    ring.style.left = `${ringX}px`;
    ring.style.top  = `${ringY}px`;
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  document.addEventListener('pointerover', (e) => {
    const interactive = e.target.closest('a, button, .project-card, [role="button"]');
    ring.classList.toggle('hover', !!interactive);
  });
}
