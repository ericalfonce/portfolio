/* ================================================================
   Entry point.

   Order matters: the router and terminal are wired first so the page
   is functional even while the boot overlay is still on screen, then
   the boot sequence runs and hands over to the home view.

   There are no ambient effect layers, observers or pointer handlers
   here any more — the previous cinematic layer (grain, custom cursor,
   parallax, pointer tilt, marquee) was removed with the redesign.
   ================================================================ */

import { initBoot } from './boot.js';
import { initRouter, onRoute, emitRoute } from './router.js';
import { terminalReady } from './terminal.js';
import { renderHome } from './site/home.js';
import { renderProjectRoute } from './site/project.js';
import { getProject } from './data.js';

/* ── Content ── */
renderHome();

/* ── Routing ── */
const homeView = document.querySelector('[data-view="home"]');
const projectView = document.querySelector('[data-view="project"]');

const HOME_TITLE = document.title;

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

/* ── Boot ──
   The terminal is wired synchronously above, so it is already
   listening while the overlay plays. terminalReady() only prints the
   greeting once the visitor can actually see it. */
initBoot({ onComplete: terminalReady });
