import { prefersReducedMotion } from './utils.js';

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
  });
}

export function enterTerminal() {
  playWipe(() => {
    document.body.classList.remove('site-mode');
    document.getElementById('nav-toggle').textContent = 'enter site';
    const input = document.getElementById('cmd-input');
    if (input) input.focus();
  });
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
