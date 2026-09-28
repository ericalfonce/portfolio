/* ================================================================
   Hero sculpture.

   An abstract faceted metal form — a lens/blade silhouette built
   from stacked contour rings and longitudinal facet lines, so it
   reads as a machined artefact rather than a drawn object. The
   profile is mathematical (a tapered superellipse), which keeps it
   clearly non-literal while still giving it a single, sharp idea.

   SVG + CSS only: no WebGL, no model download, no render loop.
   ================================================================ */

const W = 520;
const H = 900;

/* Half-width of the form at normalised height t (0 = top, 1 = base). */
function profile(t) {
  // Tapered: pinched at the tip, widest at ~38%, drawing into a point.
  const rise = Math.sin(Math.PI * Math.pow(t, 0.62));
  const waist = 0.42 + 0.58 * Math.pow(1 - t, 0.55);
  return 150 * rise * waist;
}

/** Contour ring at height t. */
function ring(t, cx, steps = 44) {
  const y = 96 + t * (H - 208);
  const half = profile(t);
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const a = (Math.PI * 2 * i) / steps;
    const x = cx + Math.cos(a) * half;
    const ry = Math.sin(a) * half * 0.30;
    d += `${i === 0 ? 'M' : 'L'}${Math.round(x * 10) / 10} ${Math.round((y + ry) * 10) / 10}`;
  }
  return d + 'Z';
}

/** Longitudinal facet line at angle a, from tip to base. */
function facet(a) {
  const steps = 60;
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = 96 + t * (H - 208);
    const half = profile(t);
    const x = W / 2 + Math.cos(a) * half;
    const ry = Math.sin(a) * half * 0.30;
    d += `${i === 0 ? 'M' : 'L'}${Math.round(x * 10) / 10} ${Math.round((y + ry) * 10) / 10}`;
  }
  return d;
}

const RINGS = Array.from({ length: 26 }, (_, i) => (i + 1) / 27);
const FACETS = [-1.32, -1.05, -0.72, -0.36, 0, 0.36, 0.72, 1.05, 1.32];

export function heroSculpture() {
  const cx = W / 2;

  const ringPaths = RINGS.map((t, i) => {
    const d = ring(t, cx);
    /* Rings near the waist carry more light — the form appears to
       catch a light source on its left flank. */
    const lit = Math.max(0, 1 - Math.abs(t - 0.38) / 0.55);
    const o = (0.05 + lit * 0.2).toFixed(3);
    const w = (0.6 + lit * 1.1).toFixed(2);
    return `<path d="${d}" fill="none" stroke="rgba(244,244,244,${o})" stroke-width="${w}"/>`;
  }).join('');

  const facetPaths = FACETS.map((a) => {
    const edge = Math.abs(a) > 1.0;
    const o = edge ? 0.16 : 0.09;
    return `<path d="${facet(a)}" fill="none" stroke="rgba(244,244,244,${o})" stroke-width="1"/>`;
  }).join('');

  /* The core spine — the one warm line in the whole hero. */
  const spine = Array.from({ length: 40 }, (_, i) => {
    const t = i / 39;
    const y = 96 + t * (H - 208);
    const o = (0.5 * Math.sin(Math.PI * t) + 0.06).toFixed(3);
    return `<circle cx="${cx}" cy="${Math.round(y)}" r="1.5" fill="#FF6F00" fill-opacity="${o}"/>`;
  }).join('');

  const silhouette = ring(0.5, cx);

  return `<svg class="sculpture" viewBox="0 0 ${W} ${H}" role="img" aria-label="Abstract faceted metal sculpture" focusable="false">
    <defs>
      <radialGradient id="sculpt-glow" cx="50%" cy="42%" r="52%">
        <stop offset="0%"   stop-color="#FF6F00" stop-opacity="0.22"/>
        <stop offset="48%"  stop-color="#FF6F00" stop-opacity="0.05"/>
        <stop offset="100%" stop-color="#FF6F00" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="sculpt-metal" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%"   stop-color="#F4F4F4" stop-opacity="0.02"/>
        <stop offset="34%"  stop-color="#F4F4F4" stop-opacity="0.10"/>
        <stop offset="52%"  stop-color="#F4F4F4" stop-opacity="0.03"/>
        <stop offset="78%"  stop-color="#F4F4F4" stop-opacity="0.07"/>
        <stop offset="100%" stop-color="#F4F4F4" stop-opacity="0.01"/>
      </linearGradient>
      <clipPath id="sculpt-clip"><path d="${silhouette}"/></clipPath>
    </defs>

    <ellipse cx="${cx}" cy="430" rx="250" ry="380" fill="url(#sculpt-glow)"/>
    <g clip-path="url(#sculpt-clip)">
      <rect x="0" y="0" width="${W}" height="${H}" fill="url(#sculpt-metal)"/>
    </g>
    <path d="${silhouette}" fill="none" stroke="rgba(244,244,244,0.26)" stroke-width="1"/>
    ${facetPaths}
    ${ringPaths}
    ${spine}
  </svg>`;
}
