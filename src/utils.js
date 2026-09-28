/* ================================================================
   Pure utilities — no DOM side effects beyond a matchMedia read.

   Only what the site and terminal actually call lives here; unused
   helpers are removed rather than kept "just in case".
   ================================================================ */

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Escape for interpolation into innerHTML. terminal.js has its own
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
