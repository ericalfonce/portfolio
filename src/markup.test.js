import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';

/* ================================================================
   Markup contract.

   index.html and the data layer were both rewritten, so a typo in an
   id or a data-hook shows up as a silently dead feature rather than a
   build error. This walks every selector the JS actually queries and
   asserts the static markup provides it, then pins the specific
   decisions this redesign was made to guarantee.
   ================================================================ */

const root = resolvePath(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css  = readFileSync(join(root, 'style.css'), 'utf8');

/** Every .js under src/, excluding tests. */
function sourceFiles(dir = join(root, 'src'), out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(p, out);
    else if (entry.name.endsWith('.js') && !entry.name.endsWith('.test.js')) out.push(p);
  }
  return out;
}

const SOURCES = sourceFiles().map((f) => [f.slice(root.length + 1), readFileSync(f, 'utf8')]);

const staticIds   = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
const staticHooks = new Set([...html.matchAll(/\b(data-[a-z-]+)(?==|\s|>)/g)].map((m) => m[1]));

/** id + data-* selectors referenced from a source file. */
function references(src) {
  const ids = new Set();
  const hooks = new Set();

  for (const m of src.matchAll(/getElementById\(\s*['"`]([^'"`]+)['"`]\s*\)/g)) ids.add(m[1]);

  for (const m of src.matchAll(/querySelector(?:All)?\(\s*['"`]([^'"`]*?)['"`]\s*\)/g)) {
    for (const id of m[1].matchAll(/#([A-Za-z][\w-]*)/g)) ids.add(id[1]);
    for (const h of m[1].matchAll(/\[(data-[\w-]+)/g)) hooks.add(h[1]);
  }
  return { ids, hooks };
}

describe('markup contract', () => {
  it('found source files to check', () => {
    expect(SOURCES.length).toBeGreaterThan(5);
  });

  it('every getElementById target exists in the static markup', () => {
    const missing = [];
    for (const [file, src] of SOURCES) {
      for (const id of references(src).ids) {
        if (staticIds.has(id)) continue;
        missing.push(`${id}  (referenced in ${file})`);
      }
    }
    expect(missing, `missing ids:\n${missing.join('\n')}`).toEqual([]);
  });

  it('every data-* selector the JS queries exists in the static markup', () => {
    const missing = [];
    for (const [file, src] of SOURCES) {
      for (const hook of references(src).hooks) {
        if (staticHooks.has(hook)) continue;
        missing.push(`${hook}  (referenced in ${file})`);
      }
    }
    expect(missing, `missing hooks:\n${missing.join('\n')}`).toEqual([]);
  });

  it('has no duplicate ids', () => {
    const all = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
    const dupes = all.filter((id, i) => all.indexOf(id) !== i);
    expect([...new Set(dupes)]).toEqual([]);
  });

  it('ships the two views the router toggles', () => {
    expect(html).toContain('data-view="home"');
    expect(html).toContain('data-view="project"');
  });

  it('hides the project view by default so the homepage paints first', () => {
    const project = html.slice(html.indexOf('data-view="project"'));
    expect(project.slice(0, 200)).toMatch(/hidden/);
  });

  it('provides the boot overlay with the ids boot.js writes into', () => {
    expect(html).toContain('id="boot-screen"');
    expect(html).toContain('id="boot-log"');
  });

  it('gives the terminal section and the terminal window different ids', () => {
    /* A shared id would make getElementById('terminal') return the
       section, and the window CSS (.terminal-window.maximized) would
       never match. */
    const section = html.match(/<section[^>]*class="term[^"]*"[^>]*id="([^"]+)"/)?.[1];
    const win = html.match(/<div[^>]*class="terminal-window"[^>]*id="([^"]+)"/)?.[1];
    expect(section).toBe('terminal-section');
    expect(win).toBe('terminal');
  });

  it('anchors the terminal nav links at the section, not the window', () => {
    const anchors = [...html.matchAll(/href="[^"]*#terminal[^"]*"/g)].map((m) => m[0]);
    expect(anchors.length).toBeGreaterThan(0);
    for (const a of anchors) expect(a).toMatch(/#terminal-section/);
  });

  it('escapes the noscript boot trap — no-JS visitors can read the page', () => {
    expect(html).toContain('<noscript>');
    const noscript = html.slice(html.indexOf('<noscript>'), html.indexOf('</noscript>'));
    expect(noscript).toMatch(/#boot-screen\s*\{\s*display:\s*none\s*!important/);
  });

  it('hides the page until boot hands over, then shows it', () => {
    expect(css).toMatch(/html\s*\{[^}]*opacity:\s*0/);
    expect(css).toMatch(/html\.is-booted\s*\{[^}]*opacity:\s*1/);
  });
});

/* ================================================================
   The redesign's explicit requirements, pinned as tests so a later
   change cannot quietly reintroduce them.
   ================================================================ */
describe('restrained structure', () => {
  it('carries no ambient effect layers', () => {
    for (const gone of [
      'cursor-dot', 'cursor-ring', 'cursor-label',
      'grain-canvas', 'matrix-canvas', 'bg-layer',
      'footer__marquee', 'data-marquee', 'data-hero-visual', 'data-parallax',
    ]) {
      expect(html, `${gone} should be gone`).not.toContain(gone);
    }
  });

  it('has no numbered section labels', () => {
    expect(html).not.toMatch(/section__index/);
    expect(css).not.toMatch(/\.section__index/);
    /* The mobile menu used to prefix every link with 01, 02, 03 … */
    const menu = html.slice(html.indexOf('id="mobile-menu"'), html.indexOf('mobile-menu__foot'));
    expect(menu).not.toMatch(/>\s*0\d\s/);
  });

  it('says exactly name, discipline and location in the hero', () => {
    const hero = html.slice(html.indexOf('class="hero"'), html.indexOf('class="work section"'));
    const text = hero
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim();
    expect(text).toContain('ERIC ALFONCE');
    expect(text).toContain('Cybersecurity & Software');
    expect(text).toContain('Tanzania');
    /* No secondary tagline, scroll cue or statement paragraph. */
    expect(html).not.toContain('hero__statement');
    expect(html).not.toContain('hero__scroll');
    expect(html).not.toContain('hero__meta');
  });

  it('keeps the footer to the name and the year', () => {
    const footer = html.slice(html.indexOf('<footer'), html.indexOf('</footer>'));
    const links = footer.match(/<a\b/g) || [];
    expect(links, 'footer should have no links').toHaveLength(0);
    expect(footer).toContain('data-year');
    expect(footer).toContain('footer__name');
  });

  it('has no capabilities grid or intro manifesto', () => {
    expect(html).not.toContain('data-caps-grid');
    expect(html).not.toContain('caps__grid');
    expect(html).not.toContain('intro__statement');
    expect(html).not.toContain('id="intro"');
  });

  it('uses the sampled brand palette and only one accent hue', () => {
    expect(css).toContain('--bg:          #080E14');
    expect(css).toContain('--accent:      #22D3EE');
    /* No gradients or glowing text-shadows anywhere. */
    expect(css).not.toMatch(/linear-gradient/);
    expect(css).not.toMatch(/radial-gradient/);
    expect(css).not.toMatch(/text-shadow/);
    expect(css).not.toMatch(/box-shadow/);
  });

  it('loads exactly two font families', () => {
    const fonts = html.match(/fonts\.googleapis\.com\/css2\?([^"]+)"/)?.[1] || '';
    const families = fonts.match(/family=([^:&]+)/g) || [];
    expect(families).toHaveLength(2);
  });

  it('keeps the name as the only oversized type', () => {
    const h1Size = css.match(/\.hero__name\s*\{[^}]*font-size:\s*clamp\([^)]*\)/)?.[0] || '';
    const sectionSize = css.match(/\.section__title\s*\{[^}]*font-size:\s*clamp\([^)]*\)/)?.[0] || '';
    const heroMin = Number(h1Size.match(/clamp\(([\d.]+)rem/)?.[1]);
    const sectionMax = Number(sectionSize.match(/,\s*([\d.]+)rem\)/)?.[1]);
    expect(heroMin).toBeGreaterThan(sectionMax);
  });

  it('respects prefers-reduced-motion', () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/);

    /* Every animation must be backed by real keyframes. */
    const names = [...css.matchAll(/\banimation:\s*([a-z][a-z-]*)/g)].map((m) => m[1]);
    expect(names.length).toBeGreaterThan(0);
    for (const name of new Set(names)) {
      expect(css, `${name} is animated but has no @keyframes`).toMatch(
        new RegExp(`@keyframes\\s+${name}\\b`)
      );
    }

    /* And the opt-out has to actually neutralise them. */
    const block = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
    expect(block).toMatch(/animation-duration:\s*0\.01ms/);
    expect(block).toMatch(/transition-duration:\s*0\.01ms/);
  });
});

describe('seo shell', () => {
  it('has a single title and description', () => {
    expect(html.match(/<title>/g)).toHaveLength(1);
    expect(html.match(/name="description"/g)).toHaveLength(1);
  });

  it('declares canonical, og and twitter tags', () => {
    expect(html).toContain('rel="canonical"');
    expect(html).toContain('property="og:title"');
    expect(html).toContain('name="twitter:card"');
  });

  it('points the social image at a local asset', () => {
    const ogImage = html.match(/property="og:image"\s+content="([^"]+)"/)?.[1];
    expect(ogImage).toBeTruthy();
    expect(ogImage).toMatch(/ericalfonce-portfolio\.vercel\.app\//);
  });

  it('lists the same social profiles that are in the data layer', () => {
    const data = readFileSync(join(root, 'src/data.js'), 'utf8');
    for (const u of ['github.com/ericalfonce', 'linkedin.com/in/ericalfonce', 'instagram.com/ericalfonce']) {
      expect(data, `data.js should contain ${u}`).toContain(u);
    }
  });
});
