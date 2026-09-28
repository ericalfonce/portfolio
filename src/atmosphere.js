/* ================================================================
   Atmosphere — a faint circuit trace behind the page.

   This replaced a matrix rain. The matrix read as a cliché rather
   than as cyber, so the texture is now the thing actually associated
   with the work: a circuit board. Thin accent lines at low opacity,
   with a few brighter nodes, drifting very slowly.

   Same performance contract as before, because the previous cinematic
   build was the lesson here — it drew generative art at full device
   resolution and the phone paid for it:

     · ~20fps, not one paint per animation frame
     · drawn from a precomputed path list, so a frame is a handful of
       strokes rather than any per-pixel work
     · pauses entirely when the tab is hidden
     · renders a single static frame under prefers-reduced-motion
     · skips itself below 480px, where it is all cost and no atmosphere
     · node count capped, so a wide monitor stays cheap

   Decorative and non-interactive. It never sits above content, so it
   cannot affect reading, selection or tapping.
   ================================================================ */

import { prefersReducedMotion } from './utils.js';

const FPS = 20;
const MIN_WIDTH = 480;
const MAX_NODES = 34;
const GRID = 56; /* node spacing, px */

/* A handful of hand-written segment patterns, so the traces look laid
   out rather than like random noise. Values are grid offsets. */
const PATTERNS = [
  [[0, 0], [1, 0], [1, 1], [2, 1]],
  [[0, 0], [0, 1], [0, 2], [1, 2], [1, 3]],
  [[0, 0], [1, 0], [2, 0], [2, 1], [3, 1]],
  [[0, 0], [0, 1], [1, 1], [1, 2], [2, 2], [2, 3]],
  [[0, 0], [1, 0], [1, 1]],
  [[0, 0], [1, 0], [1, 1], [1, 2]],
];

function hash(n) {
  /* Deterministic, so the layout is stable across a resize rather than
     reshuffling every time the window changes. */
  let x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

export function initAtmosphere() {
  const canvas = document.getElementById('atmosphere');
  if (!canvas) return () => {};

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return () => {};

  const reduced = prefersReducedMotion();
  let width = 0;
  let height = 0;
  let cols = 0;
  let rows = 0;
  let traces = [];
  let raf = 0;
  let frameCount = 0;
  let running = false;
  let phase = 0;

  /* Walk a pattern from a grid origin and return pixel segments. */
  function place(pattern, ox, oy) {
    const pts = pattern.map(([gx, gy]) => [ox * GRID + gx * GRID, oy * GRID + gy * GRID]);
    const segs = [];
    for (let i = 1; i < pts.length; i++) segs.push([pts[i - 1], pts[i]]);
    return segs;
  }

  function build() {
    cols = Math.max(1, Math.floor(width / GRID));
    rows = Math.max(1, Math.floor(height / GRID));

    /* Cap the count, then thin the grid evenly so coverage looks the
       same on a laptop and on a wide monitor instead of getting denser. */
    const cells = cols * rows;
    const target = Math.min(MAX_NODES, cells);
    const stride = Math.max(1, Math.floor(cells / Math.max(1, target)));

    traces = [];
    let seed = 0;
    for (let c = 0; c < cols && traces.length < target; c++) {
      for (let r = 0; r < rows && traces.length < target; r++) {
        seed++;
        if (seed % stride !== 0) continue;
        if (hash(seed * 1.7) > 0.55) continue;

        const pattern = PATTERNS[Math.floor(hash(seed * 3.1) * PATTERNS.length) % PATTERNS.length];
        const segs = place(pattern, c, r).filter(
          ([[x1, y1], [x2, y2]]) =>
            x1 >= 0 && y1 >= 0 && x2 <= width && y2 <= height
        );
        if (segs.length) {
          traces.push({
            segs,
            /* Each trace has its own phase, so the pulse travels around
               the board instead of blinking in unison. */
            phase: hash(seed * 5.3),
          });
        }
      }
    }
  }

  function resize() {
    const dpr = 1; /* fixed on purpose - see the note at the top */
    width = canvas.clientWidth || window.innerWidth;
    height = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    build();
  }

  function draw(step) {
    phase = (phase + step * 0.012) % 1;

    /* Clear rather than fade: this is line art on a flat ground, so
       there is no trail to accumulate and a clear is cheaper. */
    ctx.clearRect(0, 0, width, height);

    ctx.lineWidth = 1;
    ctx.lineCap = 'round';

    for (const trace of traces) {
      /* One travelling highlight per trace: a short window of the
         pattern lights up, then fades. Reads as a pulse moving across
         the board without any per-node work. */
      const t = (phase + trace.phase) % 1;
      const window = 0.18;
      for (let i = 0; i < trace.segs.length; i++) {
        const p = i / trace.segs.length;
        const d = Math.abs(p - t);
        const near = d < window;
        const intensity = near ? 0.5 * (1 - d / window) : 0;

        ctx.strokeStyle = `rgba(34, 211, 238, ${(0.09 + intensity).toFixed(3)})`;
        const [[x1, y1], [x2, y2]] = trace.segs[i];
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        /* A brighter node at the far end of a lit segment. */
        if (near) {
          ctx.fillStyle = `rgba(34, 211, 238, ${(intensity * 0.8).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(x2, y2, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      /* A dim dot at the head of every trace, always, so the board
         still reads as circuitry when nothing is pulsing. */
      const last = trace.segs[trace.segs.length - 1];
      ctx.fillStyle = 'rgba(34, 211, 238, 0.3)';
      ctx.beginPath();
      ctx.arc(last[1][0], last[1][1], 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* Throttled by counting frames, not by comparing timestamps.
     The rAF timestamp is the frame clock, which is only meaningful
     relative to the display refresh; a frame counter is stable
     regardless of refresh rate and cannot drift when a tab has been
     throttled. Every FRAME_EVERY-th frame is drawn, so the draw rate
     scales with the display instead of being pinned to 20. */
  const FRAME_EVERY = Math.max(1, Math.round(60 / FPS));

  function tick() {
    if (!running) return;
    raf = requestAnimationFrame(tick);
    frameCount++;
    if (frameCount % FRAME_EVERY !== 0) return;
    /* One step per drawn frame keeps the pulse moving at a steady
       rate however fast the display refreshes. */
    draw(1);
  }

  function start() {
    if (running) return;
    running = true;
    raf = requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  canvas.setAttribute('aria-hidden', 'true');

  /* Read width from the element rather than window.innerWidth: the
     canvas is a fixed inset:0 layer and the two agree in a browser. */
  const tooSmall = () => (canvas.clientWidth || window.innerWidth || 0) < MIN_WIDTH;

  if (tooSmall()) {
    canvas.dataset.atmosphere = 'off';
    return () => {};
  }

  resize();

  if (reduced) {
    /* One static frame: the board is drawn, nothing moves. */
    canvas.dataset.atmosphere = 'static';
    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.12)';
    for (const trace of traces) {
      for (const [[x1, y1], [x2, y2]] of trace.segs) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }
    return () => {};
  }

  canvas.dataset.atmosphere = 'live';
  start();

  let resizeTimer = 0;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 200);
  };
  const onVisibility = () => (document.hidden ? stop() : start());

  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVisibility);

  return () => {
    stop();
    window.removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}
