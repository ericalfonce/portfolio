import { prefersReducedMotion } from './utils.js';
import { refreshProjectArt } from './site.js';

function playWipe(onMid, done) {
  const overlay = document.getElementById('transition-overlay');
  if (prefersReducedMotion() || !overlay) {
    onMid();
    done && done();
    return;
  }
  overlay.classList.add('wiping');
  setTimeout(onMid, 200);
  overlay.addEventListener('animationend', function handler() {
    overlay.classList.remove('wiping');
    overlay.removeEventListener('animationend', handler);
    done && done();
  });
}

export function enterSite() {
  playWipe(() => {
    document.body.classList.add('site-mode');
    document.getElementById('nav-toggle').textContent = 'terminal';
    window.scrollTo(0, 0);
    refreshProjectArt();
  });
}

export function enterTerminal() {
  playWipe(() => {
    document.body.classList.remove('site-mode');
    document.getElementById('nav-toggle').textContent = 'enter site';
    const input = document.getElementById('cmd-input');
    if (input) input.focus();
    initScrollGate();
  });
}

export function initScrollGate() {
  let triggered = false;
  let touchStartY = null;

  function trigger() {
    if (triggered || document.body.classList.contains('site-mode')) return;
    triggered = true;
    window.removeEventListener('wheel', onWheel);
    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchmove', onTouchMove);
    enterSite();
  }

  function onWheel(e) {
    if (e.deltaY > 0) trigger();
  }
  function onTouchStart(e) {
    touchStartY = e.touches[0].clientY;
  }
  function onTouchMove(e) {
    if (touchStartY !== null && touchStartY - e.touches[0].clientY > 24) trigger();
  }

  window.addEventListener('wheel', onWheel, { passive: true });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: true });
}

export function initTransitionToggle() {
  const toggle = document.getElementById('nav-toggle');
  if (!toggle) return;
  toggle.textContent = 'enter site';
  toggle.addEventListener('click', () => {
    if (document.body.classList.contains('site-mode')) enterTerminal();
    else enterSite();
  });
}
