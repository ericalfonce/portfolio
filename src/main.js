/* ================================================================
   Entry point.

   Order matters: the router and the terminal are wired first so the
   page is functional even while the boot overlay is still on screen,
   then the boot sequence runs and hands over to the home view.
   ================================================================ */

import { initBoot } from './boot.js';
import { initRouter, onRoute, emitRoute } from './router.js';
import { initGrain } from './grain.js';
import { initCursor } from './cursor.js';
import { terminalReady, runTerminalCommand } from './terminal.js';
import { renderHome } from './site/home.js';
import { renderProjectRoute } from './site/project.js';
import { heroSculpture } from './site/hero-visual.js';
import { initReveals, initParallax, initNavScroll, initPointerTilt, initMarquee } from './site/reveal.js';

/* ── Hero sculpture ── */
const heroVisual = document.querySelector('[data-hero-visual]');
if (heroVisual) heroVisual.innerHTML = heroSculpture();

/* ── Content ── */
renderHome();

/* ── Routing ── */
const homeView = document.querySelector('[data-view="home"]');
const projectView = document.querySelector('[data-view="project"]');

const HOME_TITLE = document.title;

/* Every init* below returns its own teardown, so switching routes
   disposes the previous view's observers and listeners instead of
   stacking a fresh set on top on each navigation. */
let teardown = () => {};

function showView(route) {
  teardown();

  const cleanups = [];
  let disposed = false;
  /* Adopt a teardown only if it is still wanted by the time it
     arrives — an init* called from a rAF can land after a fast
     second navigation. */
  const track = (fn) => {
    if (typeof fn === 'function' && !disposed) cleanups.push(fn);
    else if (disposed && typeof fn === 'function') fn();
  };

  if (route.name === 'project') {
    projectView.hidden = false;
    homeView.hidden = true;
    renderProjectRoute(projectView, route.slug);
    document.body.classList.add('is-project');
  } else {
    projectView.hidden = true;
    homeView.hidden = false;
    document.title = HOME_TITLE;
    document.body.classList.remove('is-project');
  }

  /* Kick the home view in only if it is the one being shown, so
     reveals do not fire against a hidden subtree. */
  if (!homeView.hidden) {
    requestAnimationFrame(() => {
      track(initReveals(homeView));
      track(initPointerTilt(homeView));
    });
  }

  track(initParallax());
  track(initNavScroll());

  teardown = () => {
    disposed = true;
    cleanups.forEach((fn) => fn());
    cleanups.length = 0;
  };
}

initRouter();
onRoute(showView);
/* Resolve whatever the visitor actually requested, so a direct hit
   on /work/:slug (or a back/forward restore) renders that route
   instead of always starting on the homepage. */
emitRoute();

/* ── Ambient layers ── */
initGrain();
initCursor();
initMarquee();

/* ── Mobile menu ── */
function initMobileMenu() {
  const toggle = document.querySelector('.nav__toggle');
  const menu = document.getElementById('mobile-menu');
  if (!toggle || !menu) return;

  function setOpen(open) {
    toggle.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
    document.body.classList.toggle('menu-open', open);
  }

  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });
}
initMobileMenu();

/* ── Page-level interactions ── */
function initPage() {
  /* Command chips under the terminal run real commands. */
  document.querySelectorAll('[data-term-cmd]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cmd = btn.dataset.termCmd;
      runTerminalCommand(cmd);
      btn.closest('.term')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  });

  /* "About Eric" jumps to the terminal and runs /about there. */
  document.querySelectorAll('[data-about-eric]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('terminal-section')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      setTimeout(() => runTerminalCommand('/about'), 600);
    });
  });

  /* Back to top — smooth unless the visitor asked for less motion. */
  document.querySelectorAll('[data-back-to-top]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      history.replaceState({}, '', location.pathname);
    });
  });

  /* "skip to work" needs to work before the router initialises. */
  document.querySelector('.skip-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelector('#work')?.scrollIntoView({ behavior: 'smooth' });
  });
}
initPage();

/* ── Boot ──
   The terminal is wired synchronously above, so it is already
   listening while the overlay plays. terminalReady() only prints the
   greeting once the visitor can actually see it. */
initBoot({ onComplete: terminalReady });
