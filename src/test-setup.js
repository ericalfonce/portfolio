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

/* requestAnimationFrame is driven by jsdom's own real clock, and the
   timestamp it hands the callback is wall-clock time - neither moves
   when vitest's fake timers advance. Animation code that derives its
   progress from the frame timestamp therefore cannot be tested with
   fake timers alone, and silently reads as "never progresses".

   This replaces rAF with a queue that tests pump by hand, so a test
   can say exactly which frame it is on. Fake timers still drive
   setTimeout, so stagger and delay logic is unaffected. */
let frameQueue = [];
let frameId = 0;
let frameClock = 0;

window.requestAnimationFrame = (cb) => {
  frameId += 1;
  frameQueue.push({ id: frameId, cb });
  return frameId;
};

window.cancelAnimationFrame = (id) => {
  frameQueue = frameQueue.filter((f) => f.id !== id);
};

/** Run every queued frame callback as if `ms` had elapsed, then clear
    the queue. Frames are taken one at a time so callbacks that queue
    another frame run on the next pass, exactly as a browser would. */
function advanceFrames(ms, step = 16) {
  const target = frameClock + ms;
  while (frameClock < target) {
    frameClock = Math.min(target, frameClock + step);
    const due = frameQueue;
    frameQueue = [];
    for (const f of due) f.cb(frameClock);
  }
  /* Anything queued by the last pass gets the final timestamp too, so
     a test never has to guess how many frames a duration implies. */
  const due = frameQueue;
  frameQueue = [];
  for (const f of due) f.cb(frameClock);
}

/** Reset the frame clock and drop any queued frames between tests. */
function resetFrames() {
  frameQueue = [];
  frameId = 0;
  frameClock = 0;
}

/* Published on globalThis rather than exported: vitest loads setup
   files and test files as separate module instances, so an exported
   helper would be a different copy from the one that replaced rAF,
   with its own empty queue. A global is the only shared reference. */
globalThis.advanceFrames = advanceFrames;
globalThis.resetFrames = resetFrames;

export {};
