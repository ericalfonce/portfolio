import { prefersReducedMotion } from './utils.js';

/**
 * Film grain overlay.
 *
 * Rendered at a fraction of viewport resolution and scaled up by CSS —
 * at 1/4 scale this is ~16× less pixel work per frame than filling the
 * canvas at device size, which is what the previous version did. Grain
 * is high-frequency noise, so the upscale is invisible.
 *
 * Throttled to ~12fps (grain at 60fps is wasteful and, on a scrolling
 * page, actively distracting) and paused when the tab is hidden.
 */
export function initGrain() {
  const canvas = document.getElementById('grain-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const SCALE = 0.25;
  const FPS = 12;
  const FRAME_MS = 1000 / FPS;

  let width = 0;
  let height = 0;

  function resize() {
    width = Math.max(1, Math.round(window.innerWidth * SCALE));
    height = Math.max(1, Math.round(window.innerHeight * SCALE));
    canvas.width = width;
    canvas.height = height;
    draw();
  }

  function draw() {
    const image = ctx.createImageData(width, height);
    const data = image.data;
    for (let i = 0; i < data.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      data[i] = data[i + 1] = data[i + 2] = v;
      data[i + 3] = 26;
    }
    ctx.putImageData(image, 0, 0);
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });

  /* Static frame is enough when motion is reduced. */
  if (prefersReducedMotion()) return;

  let raf = null;
  let last = 0;

  function loop(t) {
    raf = requestAnimationFrame(loop);
    if (t - last < FRAME_MS) return;
    last = t;
    draw();
  }

  function start() {
    if (raf === null) raf = requestAnimationFrame(loop);
  }

  function stop() {
    if (raf !== null) { cancelAnimationFrame(raf); raf = null; }
  }

  start();

  /* No point burning frames on a hidden tab. */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else start();
  });
}
