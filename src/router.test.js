import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolve, initRouter, onRoute, navigate, emitRoute } from './router.js';

/* resolve() is pure — it takes a pathname and returns a route object,
   so it needs no DOM at all. */

describe('resolve', () => {
  it('maps the site root to the home view', () => {
    expect(resolve('/')).toEqual({ name: 'home' });
  });

  it('maps /work/:slug to the project view', () => {
    expect(resolve('/work/imei-guard')).toEqual({ name: 'project', slug: 'imei-guard' });
  });

  it('normalises trailing slashes', () => {
    expect(resolve('/work/agrimarket/')).toEqual({ name: 'project', slug: 'agrimarket' });
  });

  it('is case-insensitive on the path prefix', () => {
    expect(resolve('/WORK/webscanner').name).toBe('project');
  });

  it('falls back to home for unknown paths', () => {
    expect(resolve('/about')).toEqual({ name: 'home' });
    expect(resolve('/nope/deep')).toEqual({ name: 'home' });
  });

  it('does not treat a bare /work as a project route', () => {
    expect(resolve('/work')).toEqual({ name: 'home' });
  });

  it('normalises an empty or slash-only pathname to the root', () => {
    expect(resolve('')).toEqual({ name: 'home' });
    expect(resolve('//')).toEqual({ name: 'home' });
  });

  it('rejects anything outside the slug character set', () => {
    expect(resolve('/work/../../etc/passwd')).toEqual({ name: 'home' });
    expect(resolve('/work/abc<script>')).toEqual({ name: 'home' });
    expect(resolve('/work/a b')).toEqual({ name: 'home' });
  });

  it('rejects percent-encoded slugs without throwing', () => {
    /* The slug is matched before decoding, so "%2D" can never reach
       decodeURIComponent — a malformed escape cannot throw. */
    expect(resolve('/work/imei%2Dguard')).toEqual({ name: 'home' });
    expect(() => resolve('/work/%E0%A4%A')).not.toThrow();
    expect(() => resolve('/work/%')).not.toThrow();
  });
});

/* --- History + link interception. These are DOM-bound, so the router
   is installed once for the whole file (a second install would add a
   duplicate document listener and the first one to fire would win). */
describe('navigate', () => {
  let off;

  beforeEach(() => {
    window.history.replaceState({}, '', '/');
    initRouter();
    const seen = [];
    off = onRoute((r) => seen.push(r));
    off.seen = seen;
  });

  afterEach(() => off());

  it('pushes history and emits the new route', () => {
    navigate('/work/lenga-safaris');
    expect(window.location.pathname).toBe('/work/lenga-safaris');
    expect(off.seen).toEqual([{ name: 'project', slug: 'lenga-safaris' }]);
  });

  it('emits the home route for the root path', () => {
    navigate('/work/school-system');
    navigate('/');
    expect(off.seen).toEqual([{ name: 'project', slug: 'school-system' }, { name: 'home' }]);
  });

  it('is a no-op when navigating to the current URL', () => {
    navigate('/work/agrimarket');
    navigate('/work/agrimarket');
    expect(off.seen).toHaveLength(1);
  });

  it('emits the current route for a deep link on first resolve', () => {
    window.history.replaceState({}, '', '/work/school-system');
    emitRoute();
    expect(off.seen).toEqual([{ name: 'project', slug: 'school-system' }]);
  });

  it('is idempotent — a second install does not double-navigate', () => {
    initRouter();
    const a = document.createElement('a');
    a.href = '/work/webscanner';
    document.body.appendChild(a);

    a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));

    expect(off.seen).toEqual([{ name: 'project', slug: 'webscanner' }]);
    expect(window.location.pathname).toBe('/work/webscanner');
  });
});

describe('link interception', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
    initRouter();
    document.body.innerHTML = `
      <a id="internal"  href="/work/agrimarket">internal</a>
      <a id="external"  href="https://github.com/ericalfonce">external</a>
      <a id="blank"     href="/work/agrimarket" target="_blank">blank</a>
      <a id="mail"      href="mailto:x@example.com">mail</a>
      <a id="hash"      href="#work">hash</a>
      <a id="native"    href="/work/agrimarket" data-native>native</a>
      <a id="download"  href="/work/agrimarket" download>download</a>
    `;
  });

  function click(id, init = {}) {
    const ev = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init });
    document.getElementById(id).dispatchEvent(ev);
    return ev;
  }

  it('intercepts a same-origin path anchor', () => {
    const ev = click('internal');
    expect(ev.defaultPrevented).toBe(true);
    expect(window.location.pathname).toBe('/work/agrimarket');
  });

  it('leaves cross-origin, mailto and hash links to the browser', () => {
    /* preventDefault stays false for all of these. */
    expect(click('external').defaultPrevented).toBe(false);
    expect(click('mail').defaultPrevented).toBe(false);
    expect(click('hash').defaultPrevented).toBe(false);
    expect(click('blank').defaultPrevented).toBe(false);
    expect(click('native').defaultPrevented).toBe(false);
    expect(click('download').defaultPrevented).toBe(false);
  });

  it('leaves modified clicks (new tab / new window) alone', () => {
    for (const modifier of ['metaKey', 'ctrlKey', 'shiftKey', 'altKey']) {
      expect(click('internal', { [modifier]: true }).defaultPrevented).toBe(false);
    }
  });

  it('leaves non-primary mouse buttons alone', () => {
    expect(click('internal', { button: 1 }).defaultPrevented).toBe(false);
  });

  it('ignores clicks that were already handled by another handler', () => {
    const el = document.getElementById('internal');
    el.addEventListener('click', (e) => e.preventDefault());
    const ev = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    el.dispatchEvent(ev);
    expect(window.location.pathname).toBe('/');
  });
});
