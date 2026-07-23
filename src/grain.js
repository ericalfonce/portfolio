import { prefersReducedMotion } from './utils.js';

export function initGrain() {
  const canvas = document.getElementById('grain-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduced = prefersReducedMotion();

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function drawFrame() {
    const { width, height } = canvas;
    const imageData = ctx.createImageData(width, height);
    const buf = imageData.data;
    for (let i = 0; i < buf.length; i += 4) {
      const v = Math.random() * 255;
      buf[i] = buf[i + 1] = buf[i + 2] = v;
      buf[i + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);
  }

  drawFrame();
  if (reduced) return;

  let raf = null;
  function loop() {
    drawFrame();
    raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame(loop);
}
