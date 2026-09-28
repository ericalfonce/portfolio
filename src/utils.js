/* ================================================================
   Pure utilities — no DOM side effects beyond matchMedia reads
   ================================================================ */

const ART_RULES = [
  { test: (tags) => tags.includes('security') || tags.includes('cyber'), pattern: 'glitch',    color: '#fa4a6e' },
  { test: (tags) => tags.includes('python'),                             pattern: 'matrix',     color: '#4afa9a' },
  { test: (tags) => tags.includes('html') || tags.includes('css'),       pattern: 'wireframe',  color: '#9b9bbf' },
];

export function getProjectArtConfig(tags) {
  const rule = ART_RULES.find((r) => r.test(tags));
  return rule ? { pattern: rule.pattern, color: rule.color } : { pattern: 'default', color: '#9b9bbf' };
}

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

/** "01" … "12" */
export const pad2 = (n) => String(n).padStart(2, '0');

/** Escape for interpolation into innerHTML. Terminal.js has its own
    copy of this (`h`); kept separate so the site layer never depends
    on terminal internals. */
export function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Strip protocol + trailing slash for display in links. */
export function prettyUrl(url) {
  return String(url).replace(/^https?:\/\//, '').replace(/\/$/, '');
}
