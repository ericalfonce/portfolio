/* ================================================================
   Tiny history router — no dependencies.

   Routes:
     /             → homepage
     /work/:slug   → project case study

   Deep links work because vercel.json rewrites every path to
   /index.html (Vercel checks the filesystem before rewrites, so
   built assets still resolve).
   ================================================================ */

/** Parse the current URL into a route object. */
export function resolve(pathname = window.location.pathname) {
  const clean = pathname.replace(/\/+$/, '') || '/';

  const work = clean.match(/^\/work\/([a-z0-9-]+)$/i);
  if (work) return { name: 'project', slug: decodeURIComponent(work[1]) };

  return { name: 'home' };
}

const listeners = new Set();

/** Subscribe to route changes. Returns an unsubscribe function. */
export function onRoute(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  const route = resolve();
  listeners.forEach((fn) => fn(route));
}

/**
 * Navigate. Same-origin paths are handled in-app; anything with a
 * different origin, a protocol, or a download target is left alone
 * so external links behave normally.
 */
export function navigate(to, { replace = false } = {}) {
  const current = window.location.pathname + window.location.search + window.location.hash;
  if (to === current) return;

  if (replace) window.history.replaceState({}, '', to);
  else window.history.pushState({}, '', to);

  emit();
  scrollToTarget(to);
}

/**
 * Scroll behaviour after a route change:
 *   · a #hash scrolls that anchor into view (nav links keep working)
 *   · otherwise start at the top
 * Native scrolling is used deliberately — no scroll hijacking, so
 * keyboard paging, find-in-page and browser history all behave.
 */
function scrollToTarget(to) {
  const hash = to.includes('#') ? to.slice(to.indexOf('#')) : '';
  const target = hash && hash.length > 1 ? document.querySelector(hash) : null;

  if (target) {
    target.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'start' });
  } else {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
}

function prefersReduced() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** True when an anchor should be handled by the router. */
function isInternalLink(anchor) {
  if (!anchor || anchor.target === '_blank') return false;
  if (anchor.hasAttribute('download')) return false;
  if (anchor.dataset.native !== undefined) return false;

  const href = anchor.getAttribute('href');
  if (!href || href.startsWith('#') || /^(mailto|tel|sms):/i.test(href)) return false;

  // Resolve relative hrefs against the current origin so that
  // href="mailto:" / "https://" and "/work/x" are distinguished.
  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return false;
  if (url.pathname.startsWith('/assets/')) return false;

  return true;
}

let installed = false;

export function initRouter() {
  /* Idempotent. A second call would install a duplicate document
     listener, and the first one to run would navigate — making the
     second call a silent no-op via navigate()'s same-URL guard. */
  if (installed) return;
  installed = true;

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const anchor = e.target.closest('a[href]');
    if (!isInternalLink(anchor)) return;

    e.preventDefault();
    const url = new URL(anchor.href, window.location.href);
    navigate(url.pathname + url.search + url.hash, { replace: false });

    /* Keep focus sane for keyboard + screen-reader users: move it to
       the newly rendered view's heading instead of leaving it on a
       link that no longer exists. */
    requestAnimationFrame(() => {
      const heading = document.querySelector('[data-route-heading]');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
    });
  });

  window.addEventListener('popstate', () => {
    emit();
    /* The browser restores scroll on popstate, but a hash target
       may not have existed when it tried. Re-apply it now that the
       view has rendered. */
    if (window.location.hash.length > 1) {
      requestAnimationFrame(() => {
        const target = document.querySelector(window.location.hash);
        target?.scrollIntoView({ block: 'start' });
      });
    }
  });
}

export { emit as emitRoute };

/** Test hook: clear the "router installed" flag between cases. */
export function _resetRouterForTests() {
  installed = false;
}
