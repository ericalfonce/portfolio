/* ================================================================
   Vitest setup.

   jsdom does not implement window.scrollTo / scrollIntoView, so every
   route change logs "Not implemented" to stderr and buries real
   failures. Stub them — they are no-ops for the behaviour under test.
   ================================================================ */

/* jsdom defines scrollTo but throws "Not implemented" from it, so it
   must be replaced rather than only filled in when absent. */
window.scrollTo = () => {};

/* jsdom's Element.scrollIntoView also throws. */
Element.prototype.scrollIntoView = function scrollIntoView() {};

export {};
