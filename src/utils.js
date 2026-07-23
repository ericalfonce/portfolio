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
