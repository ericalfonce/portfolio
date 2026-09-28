import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname, resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';

/* ================================================================
   Markup contract.

   index.html was rewritten wholesale, so a typo in an id or a
   data-hook shows up as a silently dead feature rather than a build
   error. This walks every selector the JS actually queries and asserts
   the static markup provides it.

   Hooks that the JS creates at runtime (inside its own template
   strings) are allowlisted below — they legitimately have no static
   counterpart.
   ================================================================ */

const root = resolvePath(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');

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

/* Created inside JS template strings, so absent from index.html. */
const RUNTIME_ONLY_IDS = new Set(['welcome-avatar-img', 'about-avatar-img']);
const RUNTIME_ONLY_HOOKS = new Set(['data-tilt', 'data-pct']);

const staticIds = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
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
        if (staticIds.has(id) || RUNTIME_ONLY_IDS.has(id)) continue;
        missing.push(`${id}  (referenced in ${file})`);
      }
    }
    expect(missing, `missing ids:\n${missing.join('\n')}`).toEqual([]);
  });

  it('every data-* selector the JS queries exists in the static markup', () => {
    const missing = [];
    for (const [file, src] of SOURCES) {
      for (const hook of references(src).hooks) {
        if (staticHooks.has(hook) || RUNTIME_ONLY_HOOKS.has(hook)) continue;
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

  it('locks scrolling while booting, and releases it on .is-booted', () => {
    const css = readFileSync(join(root, 'style.css'), 'utf8');
    expect(css).toMatch(/html\.is-booting[^{]*\{[^}]*overflow:\s*hidden/);
    /* Nothing may keep the lock once boot has handed over. */
    expect(css).not.toMatch(/html\.is-booted[^{]*\{[^}]*overflow:\s*hidden/);
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
    for (const a of anchors) {
      expect(a).toMatch(/#terminal-section/);
    }
  });

  it('escapes the noscript boot trap — no-JS visitors can read the page', () => {
    expect(html).toContain('<noscript>');
    const noscript = html.slice(html.indexOf('<noscript>'), html.indexOf('</noscript>'));
    expect(noscript).toMatch(/#boot-screen\s*\{\s*display:\s*none\s*!important/);
  });

  it('keeps the terminal theme scoped to the terminal wrapper', () => {
    const css = readFileSync(join(root, 'style.css'), 'utf8');
    /* A bare html[data-theme='retro'] rule would restyle the whole page. */
    expect(css).not.toMatch(/html\[data-theme=['"]retro/);
    expect(css).toMatch(/\.terminal-wrapper\[data-theme=['"]retro/);
    expect(html).toContain('id="terminal-wrapper"');
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

  it('points social images at the local favicon, not a hotlinked asset', () => {
    const ogImage = html.match(/property="og:image"\s+content="([^"]+)"/)?.[1];
    expect(ogImage).toBeTruthy();
    expect(ogImage).not.toMatch(/^https?:\/\/(?!ericalfonce)/);
  });
});
