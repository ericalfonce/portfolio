/* ================================================================
   Generative project visuals.

   No images, no WebGL, no canvas — each project's large visual is an
   inline SVG composed deterministically from the project slug, so a
   project always looks identical across reloads and deploys.

   Five "families" map to the kind of work a project actually is, so
   a security tool reads as instrumentation and an IoT project reads
   as a signal rather than both becoming the same abstract pattern.
   ================================================================ */

const ACCENT = '#FF6F00';
const INK = 'rgba(255,255,255,0.13)';
const INK_SOFT = 'rgba(255,255,255,0.06)';
const INK_TEXT = 'rgba(255,255,255,0.34)';

/* ── Seeded RNG (mulberry32) ─────────────────────────────────── */
function seedFrom(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function rng(seed) {
  let a = seed;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (n) => Math.round(n * 100) / 100;

/* ── Pick a family from the project's real tags ──────────────── */
function familyFor(project) {
  const t = project.tags;
  /* Order matters. Hardware wins over everything, then explicit
     security, so a Python security tool reads as a scan rather than
     falling through to the generic ledger or topology drawer. */
  if (t.includes('esp32') || t.includes('hardware') || t.includes('rf') || t.includes('iot')) return 'signal';
  if (t.includes('security')) return 'scan';
  if (t.includes('cloud')) return 'topology';
  if (t.includes('python') || t.includes('php')) return 'ledger';
  if (t.includes('html') || t.includes('css') || t.includes('js')) return 'frame';
  if (t.includes('cyber')) return 'topology';
  return 'topology';
}

/* ── Shared background: vignette + faint grid ────────────────── */
function backdrop(w, h, cols, rows) {
  let verticals = '';
  for (let i = 1; i < cols; i++) {
    const x = round((w / cols) * i);
    verticals += `<line x1="${x}" y1="0" x2="${x}" y2="${h}"/>`;
  }
  let horizontals = '';
  for (let i = 1; i < rows; i++) {
    const y = round((h / rows) * i);
    horizontals += `<line x1="0" y1="${y}" x2="${w}" y2="${y}"/>`;
  }
  return `
    <g stroke="${INK_SOFT}" stroke-width="1">${verticals}${horizontals}</g>`;
}

function glow(w, h, id) {
  return `
    <defs>
      <radialGradient id="${id}" cx="50%" cy="45%" r="62%">
        <stop offset="0%"   stop-color="${ACCENT}" stop-opacity="0.20"/>
        <stop offset="55%"  stop-color="${ACCENT}" stop-opacity="0.04"/>
        <stop offset="100%" stop-color="${ACCENT}" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="${id}-fade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stop-color="#F4F4F4" stop-opacity="0.10"/>
        <stop offset="100%" stop-color="#F4F4F4" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#${id})"/>`;
}

/* ── Family: scan ──────────────────────────────────────────────
   Instrumentation: a target grid with a few flagged cells and
   severity meters underneath. */
function drawScan(w, h, r) {
  const cols = 16;
  const rows = 9;
  const cell = w / cols;
  const cellH = h / (rows + 3);
  let cells = '';

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const roll = r();
      if (roll > 0.9) {
        cells += `<rect x="${round(x * cell + 1)}" y="${round(y * cellH + 1)}" width="${round(cell - 2)}" height="${round(cellH - 2)}" fill="${ACCENT}" fill-opacity="0.14" stroke="${ACCENT}" stroke-opacity="0.5" stroke-width="1"/>`;
      } else if (roll > 0.82) {
        cells += `<rect x="${round(x * cell + 1)}" y="${round(y * cellH + 1)}" width="${round(cell - 2)}" height="${round(cellH - 2)}" fill="#F4F4F4" fill-opacity="0.03"/>`;
      }
    }
  }

  /* Reticle over a flagged cell */
  const tx = round(cell * 5.5);
  const ty = round(cellH * 3);
  const reticle = `
    <g stroke="${ACCENT}" stroke-width="1.5" fill="none">
      <path d="M${tx - 26} ${ty} h16 M${tx + 10} ${ty} h16"/>
      <path d="M${tx} ${ty - 26} v16 M${tx} ${ty + 10} v16"/>
      <rect x="${tx - 10}" y="${ty - 10}" width="20" height="20" stroke-opacity="0.45"/>
    </g>`;

  /* Severity meters */
  const baseY = h - cellH * 1.6;
  const meters = [0.86, 0.44, 0.68, 0.22]
    .map((p, i) => {
      const bw = (w * 0.14);
      const bx = w * 0.08 + i * (bw + w * 0.05);
      return `
        <rect x="${round(bx)}" y="${baseY}" width="${round(bw)}" height="5" fill="#F4F4F4" fill-opacity="0.07"/>
        <rect x="${round(bx)}" y="${baseY}" width="${round(bw * p)}" height="5" fill="${i === 0 ? ACCENT : '#F4F4F4'}" fill-opacity="${i === 0 ? 0.9 : 0.35}"/>`;
    })
    .join('');

  return `<g>${cells}${reticle}${meters}</g>`;
}

/* ── Family: topology ──────────────────────────────────────────
   A network graph: nodes at intersections, arcs between them. */
function drawTopology(w, h, r) {
  const nodes = [];
  const count = 7 + Math.floor(r() * 3);
  for (let i = 0; i < count; i++) {
    nodes.push({
      x: round(w * (0.1 + r() * 0.8)),
      y: round(h * (0.14 + r() * 0.7)),
      s: round(3 + r() * 5),
    });
  }

  const edges = nodes.slice(1).map((n, i) => {
    const from = nodes[Math.floor(r() * (i + 1))];
    const mx = round((from.x + n.x) / 2);
    const my = round(Math.min(from.y, n.y) - h * 0.1);
    return `<path d="M${from.x} ${from.y} Q${mx} ${my} ${n.x} ${n.y}" fill="none" stroke="${INK}" stroke-width="1"/>`;
  }).join('');

  const dots = nodes.map((n, i) => {
    const hot = i === 0;
    return `
      <circle cx="${n.x}" cy="${n.y}" r="${n.s + 8}" fill="none" stroke="${hot ? ACCENT : INK}" stroke-opacity="${hot ? 0.35 : 0.5}"/>
      <circle cx="${n.x}" cy="${n.y}" r="${n.s / 2}" fill="${hot ? ACCENT : '#F4F4F4'}" fill-opacity="${hot ? 0.9 : 0.32}"/>`;
  }).join('');

  return `<g>${edges}${dots}</g>`;
}

/* ── Family: signal ────────────────────────────────────────────
   Concentric RF arcs radiating from a source, plus a waveform. */
function drawSignal(w, h, r) {
  const cx = round(w * 0.5);
  const cy = round(h * 0.52);

  const arcs = Array.from({ length: 7 }, (_, i) => {
    const rad = (Math.min(w, h) * 0.075) * (i + 1);
    const hot = i < 3;
    return `<circle cx="${cx}" cy="${cy}" r="${round(rad)}" fill="none" stroke="${hot ? ACCENT : INK}" stroke-opacity="${hot ? 0.3 : 0.7}" stroke-width="1" stroke-dasharray="${hot ? 'none' : '3 5'}"/>`;
  }).join('');

  /* Amplitude trace */
  const steps = 60;
  const amp = h * 0.12;
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const x = round((w / steps) * i);
    const decay = Math.exp(-Math.pow((i - steps * 0.42) / 9, 2));
    const y = round(cy + Math.sin(i * 0.85) * amp * decay + (r() - 0.5) * 3);
    d += `${i === 0 ? 'M' : 'L'}${x} ${y}`;
  }

  const core = `
    <circle cx="${cx}" cy="${cy}" r="6" fill="${ACCENT}" fill-opacity="0.9"/>
    <circle cx="${cx}" cy="${cy}" r="13" fill="none" stroke="${ACCENT}" stroke-opacity="0.5"/>`;

  return `<g>${arcs}<path d="${d}" fill="none" stroke="#F4F4F4" stroke-opacity="0.4" stroke-width="1.5"/>${core}</g>`;
}

/* ── Family: frame ─────────────────────────────────────────────
   An editorial layout skeleton — image block plus type columns. */
function drawFrame(w, h, r) {
  const pad = w * 0.07;
  const imgH = h * 0.46;
  const blockTop = pad + imgH + h * 0.09;

  const lines = [0.62, 0.94, 0.78, 0.5, 0.86]
    .map((p, i) => `<rect x="${round(pad)}" y="${round(blockTop + i * h * 0.062)}" width="${round((w - pad * 2) * p)}" height="7" fill="#F4F4F4" fill-opacity="0.1"/>`)
    .join('');

  const imgLabel = `
    <rect x="${round(pad + w * 0.06)}" y="${round(pad + imgH * 0.42)}" width="${round(w * 0.16)}" height="1.5" fill="${ACCENT}"/>`;

  const sideBlock = `<rect x="${round(w * 0.68)}" y="${round(blockTop + h * 0.13)}" width="${round((w - pad * 0.68 - pad) * 0.9)}" height="${round(h * 0.26)}" fill="none" stroke="${INK}"/>`;

  const marks = Array.from({ length: 4 }, (_, i) => {
    const x = round(pad + (w - pad * 2) * r() * 0.7);
    const y = round(pad + imgH * 0.2 + imgH * 0.6 * r());
    return `<circle cx="${x}" cy="${y}" r="1.5" fill="#F4F4F4" fill-opacity="0.2"/>`;
  }).join('');

  return `
    <g>
      <rect x="${round(pad)}" y="${round(pad)}" width="${round(w - pad * 2)}" height="${round(imgH)}" fill="none" stroke="${INK}"/>
      ${imgLabel}${marks}${lines}${sideBlock}
    </g>`;
}

/* ── Family: ledger ────────────────────────────────────────────
   Structured rows — records, listings, table output. */
function drawLedger(w, h, r) {
  const pad = w * 0.07;
  const top = h * 0.16;
  const rowH = (h - top - h * 0.16) / 7;

  const header = `<rect x="${round(pad)}" y="${round(top - rowH * 0.5)}" width="${round(w - pad * 2)}" height="1" fill="${ACCENT}" fill-opacity="0.5"/>`;

  const rows = Array.from({ length: 7 }, (_, i) => {
    const y = round(top + i * rowH);
    const barW = round((w - pad * 2) * (0.14 + r() * 0.3));
    const rightW = round((w - pad * 2) * (0.06 + r() * 0.12));
    const hot = i === 2;
    return `
      <line x1="${round(pad)}" y1="${y}" x2="${round(w - pad)}" y2="${y}" stroke="${INK}" stroke-width="1"/>
      <rect x="${round(pad)}" y="${round(y + rowH * 0.3)}" width="${barW}" height="6" fill="${hot ? ACCENT : '#F4F4F4'}" fill-opacity="${hot ? 0.75 : 0.14}"/>
      <rect x="${round(w - pad - rightW)}" y="${round(y + rowH * 0.3)}" width="${rightW}" height="6" fill="#F4F4F4" fill-opacity="0.08"/>`;
  }).join('');

  return `<g>${header}${rows}</g>`;
}

const DRAWERS = { scan: drawScan, topology: drawTopology, signal: drawSignal, frame: drawFrame, ledger: drawLedger };

/**
 * Render a project's visual as an inline SVG string.
 *
 * The drawing is fully deterministic from the slug, so a project
 * always looks identical across reloads and deploys. Only the
 * gradient ids are made unique per call, because a case study renders
 * the same project twice and duplicate SVG ids would otherwise make
 * the second `url(#…)` reference resolve against the first.
 *
 * @param {object} project
 * @param {{w?:number,h?:number,index?:number}} [opts]
 * @returns {string} SVG markup (no <svg> wrapper attributes beyond the ones added here)
 */
let instance = 0;

export function projectArtSVG(project, opts = {}) {
  const w = opts.w ?? 1200;
  const h = opts.h ?? 750;
  const id = `g-${project.slug}-${opts.index ?? instance++}`;
  const r = rng(seedFrom(project.slug));
  const family = familyFor(project);
  const draw = DRAWERS[family](w, h, r);

  return `<svg class="art-svg" data-family="${family}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Abstract ${family} diagram representing ${project.title}" focusable="false">
    <rect width="${w}" height="${h}" fill="#0B0B0B"/>
    ${glow(w, h, id)}
    ${backdrop(w, h, 16, 9)}
    ${draw}
    <rect width="${w}" height="${h}" fill="url(#${id}-fade)" opacity="0.5"/>
  </svg>`;
}

/** Which family a project resolves to — used by tests and CSS hooks. */
export const artFamily = familyFor;

export { seedFrom, rng };
