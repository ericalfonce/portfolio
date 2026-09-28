/* ================================================================
   Atmosphere — matrix rain behind the whole page.

   Deliberately cheap, because the previous cinematic build was the
   lesson here: it drew generative art at full device resolution and
   the phone paid for it. This one:

     · runs at a fixed low frame rate (~20fps) rather than per rAF tick
     · draws glyphs as fillText on a coarse column grid, not per pixel
     · pauses entirely when the tab is hidden
     · renders a single static frame under prefers-reduced-motion
     · skips itself on very small viewports, where it is all cost and
       no atmosphere

   It is decoration at low opacity and never sits above content, so it
   cannot affect reading, selection or tapping.
   ================================================================ */

import { prefersReducedMotion } from './utils.js';

const GLYPHS = '01ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ';
const FPS = 20;
const FONT_PX = 14;
const MIN_WIDTH = 480; /* below this, not worth the battery */
const MAX_COLUMNS = 90; /* hard ceiling so wide monitors stay cheap */

export function initAtmosphere() {
  const canvas = document.getElementById('atmosphere');
  if (!canvas) return () => {};

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return () => {};

  let width = 0;
  let height = 0;
  let columns = 0;
  let drops = [];
  let frame = 0;
  let raf = 0;
  let last = 0;
  let running = false;

  function build() {
    const cellW = FONT_PX;
    columns = Math.min(MAX_COLUMNS, Math.max(1, Math.floor(width / cellW)));
    drops = Array.from({ length: columns }, () => Math.random() * -40);
  }

  function resize() {
    const dpr = 1; /* fixed on purpose - see the note at the top */
    width = canvas.clientWidth || window.innerWidth;
    height = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    build();
  }

  function drawHead() {
    /* The bright leading glyph of each column. */
    ctx.fillStyle = 'rgba(34, 211, 238, 0.55)';
    for (let c = 0; c < columns; c++) {
      const y = drops[c] * FONT_PX;
      if (y < 0 || y > height) continue;
      ctx.fillText(GLYPHS[(Math.random() * GLYPHS.length) | 0], c * FONT_PX, y);
    }
  }

  function draw(step) {
    /* Fade the previous frame instead of clearing, which is what gives
       the trail. Cheaper than a clearRect plus N fillText calls. */
    ctx.fillStyle = `rgba(8, 14, 20, ${0.09 + step * 0.02})`;
    ctx.fillRect(0, 0, width, height);

    ctx.font = `${FONT_PX}px "JetBrains Mono", monospace`;
    ctx.textBaseline = 'top';

    ctx.fillStyle = 'rgba(34, 211, 238, 0.22)';
    for (let c = 0; c < columns; c++) {
      const ch = GLYPHS[(Math.random() * GLYPHS.length) | 0];
      ctx.fillText(ch, c * FONT_PX, drops[c] * FONT_PX);
    }
    drawHead();

    for (let c = 0; c < columns; c++) {
      drops[c] += 1;
      if (drops[c] * FONT_PX > height && Math.random() > 0.975) drops[c] = 0;
    }
  }

  function tick(now) {
    if (!running) return;
    raf = requestAnimationFrame(tick);
    if (now - last < 1000 / FPS) return;
    const step = Math.min(3, Math.floor((now - last) / (1000 / FPS)));
    last = now;
    draw(step);
  }

  function start() {
    if (running) return;
    running = true;
    last = 0;
    raf = requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  /* ── Decide once, up front ──
     Width is read from the element rather than window.innerWidth,
     because the canvas is a fixed inset:0 layer and the two agree in
     a real browser. Reading innerWidth here also meant a test had to
     fake the whole window to describe a narrow phone. */
  const tooSmall = () => (canvas.clientWidth || window.innerWidth || 0) < MIN_WIDTH;
  const reduced = prefersReducedMotion();
  canvas.setAttribute('aria-hidden', 'true');

  if (tooSmall()) {
    canvas.dataset.atmosphere = 'off';
    return () => {};
  }

  if (reduced) {
    /* One static frame. Still gives the texture without any motion. */
    canvas.dataset.atmosphere = 'static';
    resize();
    ctx.fillStyle = 'rgba(8, 14, 20, 0.5)';
    ctx.fillRect(0, 0, width, height);
    ctx.font = `${FONT_PX}px "JetBrains Mono", monospace`;
    ctx.textBaseline = 'top';
    for (let pass = 0; pass < 14; pass++) {
      const ch = GLYPHS[(Math.random() * GLYPHS.length) | 0];
      ctx.fillStyle = `rgba(34, 211, 238, ${0.05 + pass * 0.012})`;
      ctx.fillText(ch, (Math.random() * columns) * FONT_PX, pass * (height / 14));
    }
    return () => {};
  }

  canvas.dataset.atmosphere = 'live';
  resize();

  let resizeTimer = 0;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 200);
  };
  const onVisibility = () => (document.hidden ? stop() : start());

  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVisibility);
  start();

  return () => {
    stop();
    window.removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}
