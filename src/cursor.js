import { prefersReducedMotion } from './utils.js';

/**
 * Custom cursor — desktop, fine-pointer only.
 *
 * A small dot follows exactly; a larger ring lags behind with a
 * spring-free lerp. The ring expands over links and shows a VIEW
 * label over project visuals.
 */
export function initCursor() {
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!fine || prefersReducedMotion()) return;

  const dot = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  const label = document.getElementById('cursor-label');
  if (!dot || !ring) return;

  document.body.classList.add('custom-cursor-active');

  let ringX = window.innerWidth / 2;
  let ringY = window.innerHeight / 2;
  let visible = false;

  window.addEventListener('pointermove', (e) => {
    dot.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    ringX = e.clientX;
    ringY = e.clientY;
    if (!visible) {
      visible = true;
      document.body.classList.add('cursor-visible');
    }
  }, { passive: true });

  document.addEventListener('pointerleave', () => {
    visible = false;
    document.body.classList.remove('cursor-visible');
  });

  /* One rAF loop for the trailing ring. Cancelled while idle so it
     costs nothing when the pointer is off-screen. */
  let raf = null;
  function tick() {
    ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
    raf = visible ? requestAnimationFrame(tick) : null;
  }
  window.addEventListener('pointermove', () => {
    if (raf === null) raf = requestAnimationFrame(tick);
  }, { passive: true });

  document.addEventListener('pointerover', (e) => {
    const target = e.target instanceof Element ? e.target : null;
    if (!target) return;

    const viewTarget = target.closest('[data-cursor-view]');
    const interactive = target.closest('a, button, [role="button"], input, kbd, summary');

    ring.classList.toggle('hover', Boolean(interactive));
    ring.classList.toggle('view', Boolean(viewTarget));

    if (viewTarget && label) {
      label.textContent = viewTarget.dataset.cursorView || 'View';
      label.classList.add('is-visible');
    } else if (label) {
      label.classList.remove('is-visible');
    }
  });
}
