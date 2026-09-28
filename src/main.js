/* ================================================================
   Entry point.

   Order matters: the router and terminal are wired first so the page
   is functional even while the boot overlay is still on screen, then
   the boot sequence runs and hands over to the home view.

   On atmosphere: there is no background texture layer. A matrix rain
   was tried and read as a screensaver, a circuit board replaced it and
   was then cut too — the cyber character now comes from the glitch,
   the terminal and the typography, not from anything behind the
   content. The crosshair cursor on fine pointers is the only
   decorative layer left. See src/cursor.js.
   ================================================================ */

import { initBoot } from './boot.js';
import { initRouter, onRoute, emitRoute } from './router.js';
import { terminalReady } from './terminal.js';
import { renderHome } from './site/home.js';
import { renderProjectRoute } from './site/project.js';
import { getProject } from './data.js';
import { initCursor } from './cursor.js';
import { prefersReducedMotion } from './utils.js';

/* ── Content ── */
renderHome();

/* ── Glitch ────────────────────────────────────────────────
   The ghosts are painted from data-text. It is filled in from the
   element's own textContent here, so a ghost can never disagree with
   the real characters or come back empty if a heading is edited.

   The burst is a class toggled for 400ms, never a looping animation,
   and the real text is never hidden. */
function primeGlitchTargets() {
  for (const el of document.querySelectorAll('[data-route-heading]')) {
    if (!el.getAttribute('data-text')) {
      el.setAttribute('data-text', (el.textContent || '').trim());
    }
  }
}

let glitchTimer = 0;
function flashGlitch() {
  if (prefersReducedMotion()) return;
  const root = document.documentElement;
  root.classList.add('is-glitching');
  clearTimeout(glitchTimer);
  glitchTimer = setTimeout(() => root.classList.remove('is-glitching'), 400);
}

/* ── Routing ── */
const homeView = document.querySelector('[data-view="home"]');
const projectView = document.querySelector('[data-view="project"]');

const HOME_TITLE = document.title;

primeGlitchTargets();

function showView(route) {
  if (route.name === 'project') {
    renderProjectRoute(projectView, route.slug);
    projectView.hidden = false;
    homeView.hidden = true;
    document.body.classList.add('is-project');

    const project = getProject(route.slug);
    document.title = project
      ? `${project.name} — Eric Alfonce`
      : 'Not found — Eric Alfonce';
  } else {
    projectView.hidden = true;
    homeView.hidden = false;
    document.title = HOME_TITLE;
    document.body.classList.remove('is-project');
  }
  /* Headings on a case study are generated, so prime them too. */
  primeGlitchTargets();
  flashGlitch();
}

initRouter();
onRoute(showView);
/* Resolve whatever the visitor actually requested, so a direct hit on
   /work/:slug renders that route instead of always starting on home. */
emitRoute();

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

/* ── Cursor ──
   Starts after the content is on screen, so it never competes with
   the boot sequence for the first paint. */
initCursor();

/* ── Boot ──
   The terminal is wired synchronously above, so it is already
   listening while the overlay plays. terminalReady() only prints the
   greeting once the visitor can actually see it. */
initBoot({ onComplete: terminalReady });
