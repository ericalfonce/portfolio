import { describe, it, expect, beforeAll, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PROJECTS, PROFILE, SKILLS } from './data.js';

/* ================================================================
   Render smoke test.

   Boots the real index.html into jsdom, runs the actual renderers,
   and then cross-checks every CSS class the generated markup uses
   against style.css. That last step is what catches the class of bug
   this redesign is most exposed to: markup and stylesheet drifting
   apart, so a section renders unstyled and silently.

   There is no browser in this environment, so this stands in for a
   visual pass. It cannot judge how the page looks.
   ================================================================ */

const root = resolvePath(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css  = readFileSync(join(root, 'style.css'), 'utf8');

/* Classes the browser supplies or JS creates that style.css has no rule
   for, by design. Everything else must be styled. */
const UNSTYLED_OK = new Set([
  'view', 'view--home', 'view--project', // toggled by [hidden]
  'ctrl', 'ctrl-close', 'ctrl-min', 'ctrl-max',
  'quick-links', 'cmd-link',
  'hl', 'lbl', 'lbl',
  'project-row', 'project-name', 'project-meta', 'project-desc', 'project-link',
  'welcome-line', 'welcome-line--muted', 'hint-line',
  'kv-rows', 'kv-key', 'kv-val',
  'help-table', 'help-cmd', 'help-desc',
  'work-row', 'work-row-title', 'work-row-link',
  'skill-category', 'skill-cat-title', 'skill-list', 'skills-section',
  'out-block', 'echo-line', 'success-line', 'error-line', 'para', 'para--muted',
  'divider', 'section-title', 'welcome-block', 'out-block',
]);

let home;
let project;

/** The router-controlled case-study container from index.html. */
const view = () => document.querySelector('[data-view="project"]');

beforeAll(async () => {
  /* The renderers only touch the body, so the full document is not
     required — but the real markup keeps the test honest. */
  document.documentElement.innerHTML = html
    .replace(/<\/?(html|head|body)[^>]*>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '');

  /* jsdom has no layout engine; these are called during render. */
  window.scrollTo = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();

  vi.resetModules();
  home = await import('./site/home.js');
  project = await import('./site/project.js');
});

describe('homepage render', () => {
  it('renders without throwing', () => {
    expect(() => home.renderHome()).not.toThrow();
  });

  it('puts the primary project in the feature slot', () => {
    const feature = document.querySelector('[data-feature]');
    expect(feature.textContent).toContain('MulikaScans');
    expect(feature.querySelector('a[href="/work/mulikascans"]')).not.toBeNull();
    /* The real live link, not a fabricated repo URL. */
    expect(feature.querySelector('a[href="https://mulikascans.com"]')).not.toBeNull();
    /* The real brand asset, referenced from /public/img. */
    expect(feature.querySelector('img[src="/img/mulikascans-logo.png"]')).not.toBeNull();
  });

  it('lists every other project once, and none of the primary', () => {
    const index = document.querySelector('[data-work-index]');
    const names = [...index.querySelectorAll('.index__name')].map((n) => n.textContent);
    expect(names).not.toContain('MulikaScans');
    for (const p of PROJECTS.filter((x) => !x.featured)) {
      expect(names, `${p.name} missing from the index`).toContain(p.name);
    }
  });

  it('never renders a link to a project that has no public url', () => {
    const html2 = document.body.innerHTML;
    for (const p of PROJECTS) {
      if (p.url) continue;
      expect(html2, `${p.slug} has no url but was linked`).not.toContain(`href="${p.url}"`);
      expect(html2).not.toContain(`"${p.slug}-undefined"`);
    }
  });

  it('writes the biography and the skill groups', () => {
    const body = document.querySelector('[data-about-body]');
    expect(body.querySelectorAll('p')).toHaveLength(PROFILE.about.length);

    const groups = document.querySelector('.about__skills').children;
    expect(groups).toHaveLength(Object.keys(SKILLS).length);
    for (const g of groups) {
      expect(g.querySelector('.skills__title')).not.toBeNull();
      expect(g.querySelector('.skills__list').textContent).toMatch(/\w/);
    }
  });

  it('renders the contact links from the verified profile', () => {
    const links = [...document.querySelectorAll('.contact__value')].map((a) => a.href);
    expect(links).toContain(PROFILE.github);
    expect(links).toContain(PROFILE.linkedin);
    expect(links).toContain(PROFILE.instagram);
    expect(links).toContain(`mailto:${PROFILE.email}`);
    /* Not a sales pitch. */
    expect(document.querySelector('#contact').textContent.toLowerCase())
      .not.toMatch(/hire me|let'?s work|get in touch|available for/);
  });

  it('sets the footer year to the current year', () => {
    const year = document.querySelector('[data-year]').textContent;
    expect(Number(year)).toBe(new Date().getFullYear());
  });
});

describe('case study render', () => {
  it('renders every project without throwing', () => {
    for (const p of PROJECTS) {
      expect(() => project.renderProjectRoute(view(), p.slug), p.slug).not.toThrow();
      expect(view().textContent, p.slug).toContain(p.name);
    }
  });

  it('gives every logo panel a caption, so it is not a bare frame', () => {
    for (const p of PROJECTS) {
      if (!p.mark) continue;
      project.renderProjectRoute(view(), p.slug);
      const fig = view().querySelector('figure.case__visual');
      expect(fig, `${p.slug}: mark is not in a figure`).not.toBeNull();
      const caption = fig.querySelector('figcaption.case__caption');
      expect(caption, `${p.slug}: logo panel has no caption`).not.toBeNull();
      expect(caption.textContent.trim(), `${p.slug}: caption is empty`).toMatch(/[a-z]/i);
    }
  });

  it('caps a logo panel with where it came from, never a bare image', () => {
    project.renderProjectRoute(view(), 'mulikascans');
    expect(view().querySelector('figcaption.case__caption').textContent).toBe('mulikascans.com');
    project.renderProjectRoute(view(), 'iklwalabs');
    expect(view().querySelector('figcaption.case__caption').textContent).toBe('iklwalabs.co.tz');
  });

  it('omits the panel entirely for projects with no mark', () => {
    for (const p of PROJECTS.filter((x) => !x.mark)) {
      project.renderProjectRoute(view(), p.slug);
      expect(view().querySelector('.case__visual'), p.slug).toBeNull();
    }
  });

  it('handles an unknown slug instead of throwing', () => {
    expect(() => project.renderProjectRoute(view(), 'does-not-exist')).not.toThrow();
    expect(view().textContent).toContain('Not found');
  });

  it('links out only to real destinations', () => {
    for (const p of PROJECTS) {
      project.renderProjectRoute(view(), p.slug);
      const hrefs = [...view().querySelectorAll('a[target="_blank"]')].map((a) => a.getAttribute('href'));
      for (const href of hrefs) expect(href).toMatch(/^https:\/\//);
      if (!p.url) expect(hrefs.some((h) => h === p.url)).toBe(false);
    }
  });
});

/* ================================================================
   Markup / stylesheet agreement
   ================================================================ */
describe('rendered classes are styled', () => {
  /** Classes style.css has a rule for. */
  const styled = new Set(
    [...css.matchAll(/\.([a-z][a-z0-9_-]*)/g)].map((m) => m[1])
  );

  /** Every class actually present in the rendered DOM. */
  function renderedClasses() {
    const found = new Set();
    for (const el of document.querySelectorAll('[class]')) {
      for (const c of el.classList) found.add(c);
    }
    return found;
  }

  it('styles the homepage', () => {
    home.renderHome();
    const missing = [...renderedClasses()].filter((c) => !styled.has(c) && !UNSTYLED_OK.has(c));
    expect(missing, `unstyled classes on the homepage:\n${missing.join('\n')}`).toEqual([]);
  });

  it('styles every case study', () => {
    const missing = new Set();
    for (const p of PROJECTS) {
      project.renderProjectRoute(view(), p.slug);
      for (const c of renderedClasses()) {
        if (!styled.has(c) && !UNSTYLED_OK.has(c)) missing.add(c);
      }
    }
    expect([...missing], `unstyled case-study classes:\n${[...missing].join('\n')}`).toEqual([]);
  });
});

describe('mobile safety', () => {
  it('lets long content wrap rather than overflow', () => {
    expect(css).toMatch(/overflow-wrap:\s*anywhere/);
    expect(css).toMatch(/body\s*\{[^}]*overflow-x:\s*hidden/);
  });

  it('collapses the two-column feature and the index on small screens', () => {
    const query = css.slice(css.indexOf('@media (max-width: 860px)'));
    expect(query).toMatch(/\.feature__inner\s*\{[^}]*grid-template-columns:\s*1fr/);
    expect(query).toMatch(/\.index__link\s*\{[^}]*grid-template-columns:\s*1fr/);
  });

  it('collapses the contact rows and hides the desktop nav on phones', () => {
    expect(css).toMatch(/\.nav__links\s*\{\s*display:\s*none/);
    expect(css).toMatch(/\.contact__row\s*\{\s*grid-template-columns:\s*1fr/);
  });

  it('gives touch and keyboard their own feedback, not just hover', () => {
    /* A tap must never be the only way to find out something is
       interactive, and :hover must not be left to do that job. */
    expect(css).toMatch(/@media \(hover: hover\) and \(pointer: fine\)/);
    expect(css).toMatch(/:active/);
    expect(css).toMatch(/:focus-visible/);
  });

  it('keeps every :hover rule inside the hover-capable query', () => {
    /* Otherwise a tap on a phone leaves :hover stuck, and rows shift
       sideways and stay shifted. */
    const scoped = css.indexOf('@media (hover: hover)');
    expect(scoped).toBeGreaterThan(-1);
    const strays = [...css.matchAll(/^[^\n{}]*:hover[^\n{]*\{/gm)]
      .map((m) => m[0].trim());
    for (const s of strays) {
      expect(css.indexOf(s), `top-level :hover rule: ${s}`).toBeGreaterThanOrEqual(scoped);
    }
  });

  it('marks work rows as tappable without any interaction', () => {
    /* The permanent cue is what replaces hover on a phone. */
    expect(css).toMatch(/\.index__name::after\s*\{[^}]*content:\s*'\\2192'/);
  });

  it('makes every work row a real link, so a tap navigates', () => {
    home.renderHome();
    const rows = [...document.querySelectorAll('.index__row')];
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      const a = row.querySelector('a');
      expect(a, 'row is not a link').not.toBeNull();
      expect(a.getAttribute('href')).toMatch(/^\/work\/[a-z0-9-]+$/);
    }
  });

  it('never forces a logo panel into a shape the mark is not', () => {
    /* The marks are square (2160x2160). A hardcoded aspect-ratio on
       the panel shrank them to fit a wide box and left the panel
       looking half empty, which read as a broken image. The panel must
       hug its content, with a height cap instead of a forced shape. */
    for (const sel of ['.feature__visual', '.case__visual']) {
      const m = css.match(new RegExp('\\' + sel + '\\s*\\{([^}]*)\\}'));
      expect(m, `${sel} has no rule`).not.toBeNull();
      expect(m[1], `${sel} must not force an aspect-ratio`).not.toMatch(/aspect-ratio/);
    }
    for (const sel of ['.feature__mark', '.case__mark']) {
      const m = css.match(new RegExp('\\' + sel + '\\s*\\{([^}]*)\\}'));
      expect(m, `${sel} has no rule`).not.toBeNull();
      expect(m[1], `${sel} needs a height cap so a big asset cannot dominate`)
        .toMatch(/max-height:\s*min\(/);
      expect(m[1], `${sel} must not be height-constrained by the parent`)
        .not.toMatch(/max-height:\s*100%/);
    }
  });

  it('sizes the terminal so it cannot push the page wider than the screen', () => {
    /* A fixed px width here is the classic mobile overflow bug. */
    const win = css.slice(css.indexOf('.terminal-window {'), css.indexOf('.titlebar {'));
    expect(win).not.toMatch(/width:\s*\d+px/);
    expect(win).toMatch(/height:\s*clamp\(/);
  });
});
