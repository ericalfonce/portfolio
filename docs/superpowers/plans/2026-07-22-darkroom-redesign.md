# darkroom-style Portfolio Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a darkroom.engineering-style scroll site (big type, smooth scroll, grain, generative project art, glitch transitions) beneath the existing terminal-CLI portfolio, without breaking any existing terminal command.

**Architecture:** Move to a Vite-built static site. Extract shared content (`PROFILE`/`PROJECTS`/`SKILLS`) into `src/data.js`, consumed by both the untouched terminal command logic and a new `src/site.js` that renders scroll sections. Lenis drives smooth scroll, GSAP ScrollTrigger drives reveals, plain Canvas 2D drives grain + generative project art + the terminal→site transition wipe. `src/main.js` is the single entry point wiring boot → terminal → transition → site.

**Tech Stack:** Vite 5, vanilla JS (ES modules, no framework), Lenis, GSAP + ScrollTrigger, Vitest (for the handful of pure utility functions), existing JetBrains Mono + new display sans (Inter) via Google Fonts.

## Global Constraints
- Every existing terminal command in `COMMANDS` (terminal.js:201-245) must keep working identically after the refactor.
- No WebGL/Three.js — Canvas 2D only, per spec ("Out of scope").
- Palette stays near-black (`#0a0a0a` for the new site layer) with red/green as the only accents — reuse `--red`/`--green` custom properties already defined in `style.css:18` and `style.css:15`.
- `prefers-reduced-motion: reduce` must disable Lenis smoothing, grain animation, cursor fx, and GSAP entrance animations (elements render in final state, no motion).
- Touch/mobile: no custom cursor, generative art renders at reduced resolution.
- Site remains a static build output — no server-side code, no backend changes.

---

### Task 1: Vite scaffold, migrate existing files unchanged

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `.gitignore` entries for `node_modules`, `dist`
- Move: `terminal.js` → `src/terminal.js` (content unchanged in this task)
- Modify: `index.html:172` (script tag path) 
- Modify: `index.html:72` (stylesheet path, if moved — keep `style.css` at repo root, referenced as `/style.css`, no move needed)

**Interfaces:**
- Produces: `npm run dev` serves the site at localhost with hot reload; `npm run build` outputs to `dist/`.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "eric-alfonce-portfolio",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "devDependencies": {
    "vite": "^5.4.10",
    "vitest": "^2.1.4"
  },
  "dependencies": {
    "gsap": "^3.12.5",
    "lenis": "^1.1.16"
  }
}
```

- [ ] **Step 2: Create `vite.config.js`**

```js
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
  },
});
```

- [ ] **Step 3: Install dependencies**

Run: `npm install`
Expected: `node_modules/` created, `package-lock.json` written, no errors.

- [ ] **Step 4: Move `terminal.js` into `src/`**

Run: `git mv terminal.js src/terminal.js`

- [ ] **Step 5: Update `index.html` script reference**

In `index.html:172`, change:
```html
  <script src="terminal.js"></script>
```
to:
```html
  <script type="module" src="/src/main.js"></script>
```

- [ ] **Step 6: Create placeholder `src/main.js` that just imports the terminal**

```js
import './terminal.js';
```

- [ ] **Step 7: Verify dev server serves the unchanged terminal site**

Run: `npm run dev`
Open the printed localhost URL in a browser. Expected: boot sequence plays, terminal appears, typing `/about` still works exactly as before.

- [ ] **Step 8: Commit**

```bash
git add package.json vite.config.js src/terminal.js src/main.js index.html
git commit -m "chore: scaffold Vite build, migrate terminal.js unchanged"
```

---

### Task 2: Extract shared data into `src/data.js`

**Files:**
- Create: `src/data.js`
- Modify: `src/terminal.js:40-194` (remove `PROFILE`, `PROJECTS`, `SKILLS`, `CERTS`, `THEMES`, `ROUTE_TITLES` definitions, import them instead)

**Interfaces:**
- Produces: `src/data.js` exports `PROFILE`, `PROJECTS`, `SKILLS`, `CERTS`, `THEMES`, `ROUTE_TITLES` — same shapes as currently inline in `terminal.js` (see terminal.js:40-194 for exact current shape, e.g. `PROJECTS` is an array of `{ name, repo, desc, tags, url }`, `SKILLS` is an object keyed by category string mapping to arrays of `{ name, pct, color }`).
- Consumes (by later tasks): `src/site.js` (Task 7) imports `PROFILE`, `PROJECTS`, `SKILLS` from this file.

- [ ] **Step 1: Create `src/data.js` with the extracted content**

Cut the full literal contents of `PROFILE` (terminal.js:40-46), `PROJECTS` (terminal.js:48-133), `SKILLS` (terminal.js:135-162), `CERTS` (terminal.js:164-172), `THEMES` (terminal.js:174-179), `ROUTE_TITLES` (terminal.js:181-194) verbatim into:

```js
/* ================================================================
   Shared content data — consumed by both terminal.js and site.js
   ================================================================ */

export const PROFILE = {
  name:      'Eric Alfonce',
  github:    'https://github.com/ericalfonce',
  linkedin:  'https://www.linkedin.com/in/eric-alfonce',
  instagram: 'https://www.instagram.com/ericalfonce',
  email:     'ericgasperalfonce@gmail.com',
};

export const PROJECTS = [
  // ... exact 12 entries currently at terminal.js:48-133, unchanged
];

export const SKILLS = {
  // ... exact content currently at terminal.js:135-162, unchanged
};

export const CERTS = [
  // ... exact content currently at terminal.js:164-172, unchanged
];

export const THEMES = {
  // ... exact content currently at terminal.js:174-179, unchanged
};

export const ROUTE_TITLES = {
  // ... exact content currently at terminal.js:181-194, unchanged
};
```

(Copy the real object literals — do not abbreviate them in the actual file.)

- [ ] **Step 2: Replace the inline definitions in `src/terminal.js` with an import**

At the top of `src/terminal.js`, after the existing DOM refs block (terminal.js:7-17), add:

```js
import { PROFILE, PROJECTS, SKILLS, CERTS, THEMES, ROUTE_TITLES } from './data.js';
```

Delete the original inline `PROFILE`/`PROJECTS`/`SKILLS`/`CERTS`/`THEMES`/`ROUTE_TITLES` blocks (terminal.js:40-194), keeping everything else in the file as-is.

- [ ] **Step 3: Verify terminal still works**

Run: `npm run dev`, open browser, run `/about`, `/projects`, `/skills`, `/certs`, `/themes` commands.
Expected: identical output to before Task 2 — data-driven sections render unchanged.

- [ ] **Step 4: Commit**

```bash
git add src/data.js src/terminal.js
git commit -m "refactor: extract shared content data into src/data.js"
```

---

### Task 3: Pure utility module with unit tests (reduced-motion + tag→art config)

**Files:**
- Create: `src/utils.js`
- Test: `src/utils.test.js`

**Interfaces:**
- Produces:
  - `prefersReducedMotion(): boolean` — reads `window.matchMedia('(prefers-reduced-motion: reduce)').matches`.
  - `getProjectArtConfig(tags: string[]): { pattern: 'glitch' | 'matrix' | 'wireframe' | 'default', color: string }` — maps a project's tags to a generative-art style. Priority: `security`/`cyber` → glitch/red; `python` → matrix/green; `html`/`css` → wireframe/muted; anything else → default/muted. Consumed by Task 6 (`src/project-art.js`).

- [ ] **Step 1: Write failing tests**

```js
// src/utils.test.js
import { describe, it, expect, vi } from 'vitest';
import { getProjectArtConfig, prefersReducedMotion } from './utils.js';

describe('getProjectArtConfig', () => {
  it('maps security/cyber tags to the glitch pattern in red', () => {
    expect(getProjectArtConfig(['python', 'security'])).toEqual({ pattern: 'glitch', color: '#fa4a6e' });
    expect(getProjectArtConfig(['cyber'])).toEqual({ pattern: 'glitch', color: '#fa4a6e' });
  });

  it('maps python-only tags to the matrix pattern in green', () => {
    expect(getProjectArtConfig(['python'])).toEqual({ pattern: 'matrix', color: '#4afa9a' });
  });

  it('maps html/css tags to the wireframe pattern in muted', () => {
    expect(getProjectArtConfig(['html', 'css'])).toEqual({ pattern: 'wireframe', color: '#9b9bbf' });
  });

  it('falls back to default pattern for unrecognized tags', () => {
    expect(getProjectArtConfig(['cloud'])).toEqual({ pattern: 'default', color: '#9b9bbf' });
  });

  it('prioritizes security over other matches when multiple tags present', () => {
    expect(getProjectArtConfig(['html', 'security'])).toEqual({ pattern: 'glitch', color: '#fa4a6e' });
  });
});

describe('prefersReducedMotion', () => {
  it('returns true when matchMedia reports reduced motion', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    expect(prefersReducedMotion()).toBe(true);
  });

  it('returns false when matchMedia reports no preference', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    expect(prefersReducedMotion()).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/utils.test.js`
Expected: FAIL — `src/utils.js` does not exist / exports undefined.

- [ ] **Step 3: Implement `src/utils.js`**

```js
/* ================================================================
   Pure utilities — no DOM side effects beyond matchMedia reads
   ================================================================ */

const ART_RULES = [
  { test: (tags) => tags.includes('security') || tags.includes('cyber'), pattern: 'glitch',    color: '#fa4a6e' },
  { test: (tags) => tags.includes('python'),                             pattern: 'matrix',     color: '#4afa9a' },
  { test: (tags) => tags.includes('html') || tags.includes('css'),       pattern: 'wireframe',  color: '#9b9bbf' },
];

export function getProjectArtConfig(tags) {
  const rule = ART_RULES.find((r) => r.test(tags));
  return rule ? { pattern: rule.pattern, color: rule.color } : { pattern: 'default', color: '#9b9bbf' };
}

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/utils.test.js`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add src/utils.js src/utils.test.js
git commit -m "feat: add prefersReducedMotion and getProjectArtConfig utilities"
```

---

### Task 4: Grain canvas overlay

**Files:**
- Create: `src/grain.js`
- Modify: `index.html` (add `<canvas id="grain-canvas">` element)
- Modify: `style.css` (append grain layer styles)
- Modify: `src/main.js` (init grain)

**Interfaces:**
- Consumes: `prefersReducedMotion()` from `src/utils.js` (Task 3).
- Produces: `initGrain(): void` — starts the animated noise overlay; no-ops (renders one static frame) if reduced motion is preferred.

- [ ] **Step 1: Add the canvas element to `index.html`**

After the existing background layers block (`index.html:103-106`), add:

```html
  <canvas id="grain-canvas" aria-hidden="true"></canvas>
```

- [ ] **Step 2: Append grain styles to `style.css`**

```css
/* ── Grain overlay ── */
#grain-canvas {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 5;
  opacity: 0.04;
  mix-blend-mode: overlay;
}
```

- [ ] **Step 3: Implement `src/grain.js`**

```js
import { prefersReducedMotion } from './utils.js';

export function initGrain() {
  const canvas = document.getElementById('grain-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduced = prefersReducedMotion();

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function drawFrame() {
    const { width, height } = canvas;
    const imageData = ctx.createImageData(width, height);
    const buf = imageData.data;
    for (let i = 0; i < buf.length; i += 4) {
      const v = Math.random() * 255;
      buf[i] = buf[i + 1] = buf[i + 2] = v;
      buf[i + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);
  }

  drawFrame();
  if (reduced) return;

  let raf = null;
  function loop() {
    drawFrame();
    raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame(loop);
}
```

- [ ] **Step 4: Wire into `src/main.js`**

```js
import './terminal.js';
import { initGrain } from './grain.js';

initGrain();
```

- [ ] **Step 5: Verify in browser**

Run: `npm run dev`. Expected: a faint animated static/noise texture visible over the whole page, subtle (4% opacity), does not obscure the terminal.

- [ ] **Step 6: Commit**

```bash
git add index.html style.css src/grain.js src/main.js
git commit -m "feat: add animated grain canvas overlay"
```

---

### Task 5: Custom cursor

**Files:**
- Create: `src/cursor.js`
- Modify: `index.html` (add cursor DOM elements)
- Modify: `style.css` (append cursor styles)
- Modify: `src/main.js` (init cursor)

**Interfaces:**
- Consumes: `prefersReducedMotion()` from `src/utils.js`.
- Produces: `initCursor(): void` — no-ops entirely on touch devices (`matchMedia('(pointer: coarse)')`) or when reduced motion is preferred.

- [ ] **Step 1: Add cursor DOM to `index.html`**

Right after `<body>` (`index.html:74`), add:

```html
  <div id="cursor-dot" aria-hidden="true"></div>
  <div id="cursor-ring" aria-hidden="true"></div>
```

- [ ] **Step 2: Append cursor styles to `style.css`**

```css
/* ── Custom cursor ── */
#cursor-dot, #cursor-ring {
  position: fixed;
  top: 0; left: 0;
  border-radius: 50%;
  pointer-events: none;
  z-index: 999;
  transform: translate(-50%, -50%);
  will-change: transform;
}
#cursor-dot {
  width: 6px; height: 6px;
  background: var(--red);
}
#cursor-ring {
  width: 32px; height: 32px;
  border: 1px solid var(--muted);
  transition: width .15s ease, height .15s ease, border-color .15s ease;
}
#cursor-ring.hover {
  width: 48px; height: 48px;
  border-color: var(--red);
}
body.custom-cursor-active, body.custom-cursor-active a, body.custom-cursor-active button {
  cursor: none;
}
```

- [ ] **Step 3: Implement `src/cursor.js`**

```js
import { prefersReducedMotion } from './utils.js';

export function initCursor() {
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  if (isCoarsePointer || prefersReducedMotion()) return;

  const dot  = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  if (!dot || !ring) return;

  document.body.classList.add('custom-cursor-active');

  let ringX = 0, ringY = 0;

  window.addEventListener('pointermove', (e) => {
    dot.style.left = `${e.clientX}px`;
    dot.style.top  = `${e.clientY}px`;
    ringX = e.clientX;
    ringY = e.clientY;
  });

  function raf() {
    ring.style.left = `${ringX}px`;
    ring.style.top  = `${ringY}px`;
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  document.addEventListener('pointerover', (e) => {
    const interactive = e.target.closest('a, button, .project-card, [role="button"]');
    ring.classList.toggle('hover', !!interactive);
  });
}
```

- [ ] **Step 4: Wire into `src/main.js`**

```js
import './terminal.js';
import { initGrain } from './grain.js';
import { initCursor } from './cursor.js';

initGrain();
initCursor();
```

- [ ] **Step 5: Verify in browser**

Run: `npm run dev`. Expected on desktop: default cursor hidden, a small red dot + ring follow the mouse, ring grows over links/buttons. On a mobile emulator (coarse pointer): no custom cursor, default touch behavior.

- [ ] **Step 6: Commit**

```bash
git add index.html style.css src/cursor.js src/main.js
git commit -m "feat: add custom cursor with hover scaling"
```

---

### Task 6: Generative project-art canvas

**Files:**
- Create: `src/project-art.js`

**Interfaces:**
- Consumes: `getProjectArtConfig(tags)` from `src/utils.js` (Task 3).
- Produces: `renderProjectArt(canvas: HTMLCanvasElement, tags: string[]): void` — draws a static (one-shot, non-animated) pattern onto the given canvas sized to its `clientWidth`/`clientHeight`, at a capped resolution for perf (see Task 10 for the mobile reduced-res tie-in).

- [ ] **Step 1: Implement `src/project-art.js`**

```js
import { getProjectArtConfig } from './utils.js';

const MAX_DEVICE_PIXEL_RATIO = 2;

function drawGlitch(ctx, w, h, color) {
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) {
    const y = Math.random() * h;
    const barH = Math.random() * 4 + 1;
    ctx.fillStyle = color;
    ctx.globalAlpha = Math.random() * 0.5 + 0.1;
    ctx.fillRect(0, y, w, barH);
  }
  ctx.globalAlpha = 1;
}

function drawMatrix(ctx, w, h, color) {
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, w, h);
  const fontSize = 12;
  const cols = Math.floor(w / fontSize);
  ctx.font = `${fontSize}px monospace`;
  ctx.fillStyle = color;
  for (let i = 0; i < cols; i++) {
    const len = Math.floor(Math.random() * (h / fontSize));
    for (let j = 0; j < len; j++) {
      ctx.globalAlpha = j === len - 1 ? 1 : 0.15;
      ctx.fillText(Math.round(Math.random()), i * fontSize, j * fontSize);
    }
  }
  ctx.globalAlpha = 1;
}

function drawWireframe(ctx, w, h, color) {
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.4;
  const step = 24;
  for (let x = 0; x <= w; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawDefault(ctx, w, h, color) {
  const gradient = ctx.createLinearGradient(0, 0, w, h);
  gradient.addColorStop(0, '#0a0a0a');
  gradient.addColorStop(1, color);
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 1;
}

const PATTERNS = { glitch: drawGlitch, matrix: drawMatrix, wireframe: drawWireframe, default: drawDefault };

export function renderProjectArt(canvas, tags) {
  const { pattern, color } = getProjectArtConfig(tags);
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
  const w = canvas.clientWidth || 300;
  const h = canvas.clientHeight || 160;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  (PATTERNS[pattern] || drawDefault)(ctx, w, h, color);
}
```

- [ ] **Step 2: Add a unit test for pattern selection routing**

```js
// src/project-art.test.js
import { describe, it, expect } from 'vitest';
import { renderProjectArt } from './project-art.js';

describe('renderProjectArt', () => {
  it('draws without throwing for each known tag combination', () => {
    const canvas = document.createElement('canvas');
    Object.defineProperty(canvas, 'clientWidth', { value: 300 });
    Object.defineProperty(canvas, 'clientHeight', { value: 160 });
    for (const tags of [['security'], ['python'], ['html', 'css'], ['cloud']]) {
      expect(() => renderProjectArt(canvas, tags)).not.toThrow();
    }
  });
});
```

Note: requires a DOM-capable test environment. Add to `vite.config.js`:

```js
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: { outDir: 'dist' },
  test: { environment: 'jsdom' },
});
```

Run: `npm install -D jsdom`

- [ ] **Step 3: Run the test**

Run: `npx vitest run src/project-art.test.js`
Expected: PASS, 1 test (4 assertions).

- [ ] **Step 4: Commit**

```bash
git add src/project-art.js src/project-art.test.js vite.config.js package.json package-lock.json
git commit -m "feat: add generative tag-keyed project art canvas"
```

---

### Task 7: Scroll site DOM + base layout/typography CSS

**Files:**
- Create: `src/site.js`
- Modify: `index.html` (add `<section id="site">` mount point after the terminal `<main>`)
- Modify: `style.css` (append site section styles, big display type)

**Interfaces:**
- Consumes: `PROFILE`, `PROJECTS`, `SKILLS` from `src/data.js` (Task 2); `renderProjectArt` from `src/project-art.js` (Task 6).
- Produces: `buildSite(): void` — renders hero/about/projects/skills/security/contact sections into `#site` and calls `renderProjectArt` for each project card canvas. Called once, before scroll/animation wiring (Task 8) attaches to the resulting DOM.

- [ ] **Step 1: Add the site mount point to `index.html`**

After the closing `</main>` of the terminal (`index.html:146`), add:

```html
  <section id="site" aria-label="Portfolio">
    <div id="site-hero" class="site-section">
      <h1 class="site-hero-title"></h1>
      <p class="site-hero-role"></p>
    </div>
    <div id="site-about" class="site-section">
      <h2 class="site-heading">About</h2>
      <p class="site-about-text"></p>
    </div>
    <div id="site-projects" class="site-section">
      <h2 class="site-heading">Projects</h2>
      <div id="site-projects-grid" class="site-projects-grid"></div>
    </div>
    <div id="site-skills" class="site-section">
      <h2 class="site-heading">Skills</h2>
      <div id="site-skills-groups"></div>
    </div>
    <div id="site-contact" class="site-section">
      <h2 class="site-heading">Contact</h2>
      <a id="site-contact-email" class="site-contact-link" href="#"></a>
    </div>
  </section>
```

- [ ] **Step 2: Add the display font and site styles to `style.css`**

Add to `index.html:71`, alongside the existing JetBrains Mono link:

```html
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet" />
```

Append to `style.css`:

```css
/* ================================================================
   Scroll site — darkroom-style sections
   ================================================================ */
#site {
  position: relative;
  background: #0a0a0a;
  color: var(--text);
  z-index: 2;
}
.site-section {
  min-height: 100vh;
  padding: 8vw 6vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.site-hero-title {
  font-family: 'Inter', sans-serif;
  font-weight: 800;
  font-size: clamp(3rem, 10vw, 9rem);
  line-height: 0.95;
  letter-spacing: -0.02em;
}
.site-hero-role {
  font-family: var(--font);
  color: var(--muted);
  font-size: clamp(1rem, 2vw, 1.4rem);
  margin-top: 1rem;
}
.site-heading {
  font-family: 'Inter', sans-serif;
  font-weight: 800;
  font-size: clamp(2rem, 6vw, 5rem);
  margin-bottom: 2rem;
}
.site-about-text {
  font-family: var(--font);
  max-width: 60ch;
  font-size: clamp(1rem, 1.5vw, 1.25rem);
  color: var(--muted);
  line-height: 1.6;
}
.site-projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}
.site-project-card {
  position: relative;
  border: 1px solid var(--win-border);
  border-radius: var(--radius);
  overflow: hidden;
  aspect-ratio: 16 / 10;
  display: flex;
  align-items: flex-end;
}
.site-project-card canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.site-project-card-label {
  position: relative;
  z-index: 1;
  padding: 1rem;
  background: linear-gradient(transparent, rgba(0,0,0,.85));
  width: 100%;
  font-family: var(--font);
}
.site-skills-group h3 {
  font-family: 'Inter', sans-serif;
  font-size: 1.2rem;
  margin: 1.5rem 0 .75rem;
}
.site-skill-bar-track {
  height: 6px;
  background: var(--win-border);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: .6rem;
}
.site-skill-bar-fill {
  height: 100%;
  width: 0%;
}
.site-contact-link {
  font-family: 'Inter', sans-serif;
  font-size: clamp(1.5rem, 4vw, 3rem);
  color: var(--text);
  text-decoration: none;
  border-bottom: 2px solid var(--red);
}
```

- [ ] **Step 3: Implement `src/site.js`**

```js
import { PROFILE, PROJECTS, SKILLS } from './data.js';
import { renderProjectArt } from './project-art.js';

export function buildSite() {
  document.querySelector('.site-hero-title').textContent = PROFILE.name;
  document.querySelector('.site-hero-role').textContent =
    'Cybersecurity Specialist · Developer · Motion Designer';

  document.querySelector('.site-about-text').textContent =
    "I'm a cybersecurity researcher and creative technologist. My primary focus is offensive and defensive security — finding vulnerabilities, understanding attack surfaces, and building tools that make systems safer. On the side, I build full-stack web applications, design motion graphics, and explore EdTech in Africa.";

  const grid = document.getElementById('site-projects-grid');
  PROJECTS.forEach((p) => {
    const card = document.createElement('div');
    card.className = 'site-project-card';
    card.innerHTML = `
      <canvas></canvas>
      <div class="site-project-card-label">
        <strong>${p.name}</strong>
        <div style="color:var(--muted);font-size:.85rem">${p.tags.join(' · ')}</div>
      </div>
    `;
    grid.appendChild(card);
    renderProjectArt(card.querySelector('canvas'), p.tags);
    card.addEventListener('click', () => window.open(p.url, '_blank', 'noopener'));
  });

  const groupsEl = document.getElementById('site-skills-groups');
  Object.entries(SKILLS).forEach(([groupName, items]) => {
    const group = document.createElement('div');
    group.className = 'site-skills-group';
    group.innerHTML = `<h3>${groupName}</h3>`;
    items.forEach((skill) => {
      const row = document.createElement('div');
      row.innerHTML = `
        <div style="display:flex;justify-content:space-between;font-family:var(--font);font-size:.85rem;color:var(--muted)">
          <span>${skill.name}</span><span>${skill.pct}%</span>
        </div>
        <div class="site-skill-bar-track">
          <div class="site-skill-bar-fill" data-pct="${skill.pct}" style="background:${skill.color}"></div>
        </div>
      `;
      group.appendChild(row);
    });
    groupsEl.appendChild(group);
  });

  const contactLink = document.getElementById('site-contact-email');
  contactLink.href = `mailto:${PROFILE.email}`;
  contactLink.textContent = PROFILE.email;
}
```

- [ ] **Step 4: Wire into `src/main.js`**

```js
import './terminal.js';
import { initGrain } from './grain.js';
import { initCursor } from './cursor.js';
import { buildSite } from './site.js';

initGrain();
initCursor();
buildSite();
```

- [ ] **Step 5: Verify in browser**

Run: `npm run dev`, scroll past the terminal. Expected: hero/about/projects (12 cards with generated canvas backgrounds)/skills (bars at 0% width, animation wired in Task 8)/contact sections render with correct data, big Inter display type visible.

- [ ] **Step 6: Commit**

```bash
git add index.html style.css src/site.js src/main.js
git commit -m "feat: build darkroom-style scroll site sections from shared data"
```

---

### Task 8: Lenis smooth scroll + GSAP ScrollTrigger reveals

**Files:**
- Create: `src/scroll.js`
- Modify: `style.css` (initial hidden states for reveal targets)
- Modify: `src/main.js` (init scroll after `buildSite`)

**Interfaces:**
- Consumes: `prefersReducedMotion()` from `src/utils.js`; DOM built by `buildSite()` (Task 7) — must run after it.
- Produces: `initScroll(): void` — sets up Lenis + GSAP ScrollTrigger reveal animations for `.site-section` children; fully skipped (elements shown at rest, native scroll) when reduced motion is preferred.

- [ ] **Step 1: Add initial-hidden styles to `style.css`**

```css
/* ── Reveal targets (JS adds .revealed on scroll-in) ── */
.reveal-up {
  opacity: 0;
  transform: translateY(40px);
}
.reveal-up.revealed {
  opacity: 1;
  transform: translateY(0);
}
.reveal-fill .site-skill-bar-fill {
  transition: width 1s ease;
}
```

- [ ] **Step 2: Mark reveal targets in `src/site.js`**

In `buildSite()` (Task 7), add `reveal-up` class to the hero title/role, each `.site-heading`, each `.site-project-card`, and add `reveal-fill` to `#site-skills`:

```js
document.querySelector('.site-hero-title').classList.add('reveal-up');
document.querySelector('.site-hero-role').classList.add('reveal-up');
document.querySelectorAll('.site-heading').forEach((el) => el.classList.add('reveal-up'));
document.getElementById('site-skills').classList.add('reveal-fill');
```

And when creating each project card in the `PROJECTS.forEach` loop, add `card.classList.add('reveal-up');` right after `card.className = 'site-project-card';`.

- [ ] **Step 3: Implement `src/scroll.js`**

```js
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './utils.js';

gsap.registerPlugin(ScrollTrigger);

export function initScroll() {
  if (prefersReducedMotion()) {
    document.querySelectorAll('.reveal-up').forEach((el) => el.classList.add('revealed'));
    document.querySelectorAll('.site-skill-bar-fill').forEach((el) => {
      el.style.width = `${el.dataset.pct}%`;
    });
    return;
  }

  const lenis = new Lenis({ smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  document.querySelectorAll('.reveal-up').forEach((el, i) => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      onEnter: () => {
        gsap.to(el, { opacity: 1, y: 0, duration: 0.8, delay: (i % 6) * 0.05, ease: 'power3.out' });
        el.classList.add('revealed');
      },
    });
  });

  document.querySelectorAll('.site-skill-bar-fill').forEach((el) => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      onEnter: () => {
        gsap.to(el, { width: `${el.dataset.pct}%`, duration: 1, ease: 'power2.out' });
      },
    });
  });
}
```

- [ ] **Step 4: Wire into `src/main.js`, after `buildSite()`**

```js
import './terminal.js';
import { initGrain } from './grain.js';
import { initCursor } from './cursor.js';
import { buildSite } from './site.js';
import { initScroll } from './scroll.js';

initGrain();
initCursor();
buildSite();
initScroll();
```

- [ ] **Step 5: Verify in browser**

Run: `npm run dev`. Expected: page scroll feels smoothed (Lenis); hero/headings/project cards fade+slide in as they enter viewport; skill bars animate from 0 to their `pct` width on scroll-in. With OS-level "reduce motion" enabled, everything should render at rest immediately with normal native scroll.

- [ ] **Step 6: Commit**

```bash
git add style.css src/site.js src/scroll.js src/main.js
git commit -m "feat: add Lenis smooth scroll and GSAP ScrollTrigger reveals"
```

---

### Task 9: Terminal ↔ site transition (glitch wipe) + nav toggle

**Files:**
- Create: `src/transition.js`
- Modify: `index.html` (add "enter site" prompt in terminal, add nav toggle button, add transition overlay element)
- Modify: `style.css` (transition + toggle styles, hide `#site` until entered)
- Modify: `src/terminal.js` (add `/enter` command)
- Modify: `src/main.js` (wire transition triggers)

**Interfaces:**
- Consumes: `prefersReducedMotion()` from `src/utils.js`.
- Produces: `enterSite(): void` (glitch-wipes from terminal to `#site`, scrolls into it), `enterTerminal(): void` (reverse), both exported for use by the nav toggle and the new `/enter` terminal command.

- [ ] **Step 1: Add transition overlay + nav toggle to `index.html`**

After the cursor elements added in Task 5, add:

```html
  <div id="transition-overlay" aria-hidden="true"></div>
  <button id="nav-toggle" type="button">terminal</button>
```

- [ ] **Step 2: Hide `#site` initially and style the toggle/overlay in `style.css`**

```css
#site { display: none; }
body.site-mode #site { display: block; }
body.site-mode .terminal-wrapper { display: none; }

#nav-toggle {
  position: fixed;
  top: 1rem; right: 1rem;
  z-index: 998;
  font-family: var(--font);
  background: var(--win-bg);
  color: var(--text);
  border: 1px solid var(--win-border);
  border-radius: 6px;
  padding: .4rem .8rem;
  cursor: pointer;
}

#transition-overlay {
  position: fixed;
  inset: 0;
  z-index: 997;
  background: #0a0a0a;
  pointer-events: none;
  opacity: 0;
}
#transition-overlay.wiping {
  animation: wipe-flash .4s steps(4) forwards;
}
@keyframes wipe-flash {
  0%   { opacity: 0; }
  25%  { opacity: 1; }
  50%  { opacity: 0.2; }
  75%  { opacity: 1; }
  100% { opacity: 0; }
}
```

- [ ] **Step 3: Implement `src/transition.js`**

```js
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
```

- [ ] **Step 4: Add `/enter` command to `src/terminal.js`**

In the `COMMANDS` object (terminal.js:201-245), add under `/util`:

```js
  '/enter':       { fn: () => { import('./transition.js').then((m) => m.enterSite()); }, desc: 'Enter the full site' },
```

- [ ] **Step 5: Wire `initTransitionToggle` into `src/main.js`**

```js
import './terminal.js';
import { initGrain } from './grain.js';
import { initCursor } from './cursor.js';
import { buildSite } from './site.js';
import { initScroll } from './scroll.js';
import { initTransitionToggle } from './transition.js';

initGrain();
initCursor();
buildSite();
initScroll();
initTransitionToggle();
```

- [ ] **Step 6: Verify in browser**

Run: `npm run dev`. Expected: nav toggle button reads "enter site" while in terminal; clicking it (or typing `/enter` in the terminal) plays a brief glitch flash and reveals the scroll site, hiding the terminal; toggle now reads "terminal" and clicking it flashes back to the terminal with focus restored to the input. With reduced motion, the switch is instant with no flash.

- [ ] **Step 7: Commit**

```bash
git add index.html style.css src/transition.js src/terminal.js src/main.js
git commit -m "feat: add terminal/site glitch transition and nav toggle"
```

---

### Task 10: Mobile fallbacks, resolution capping, final integration pass

**Files:**
- Modify: `src/project-art.js` (already caps via `MAX_DEVICE_PIXEL_RATIO`; add a mobile-width downscale)
- Modify: `style.css` (mobile breakpoint adjustments)
- Modify: `README.md` if present, else skip

**Interfaces:**
- No new exports — this task tunes existing behavior.

- [ ] **Step 1: Add a mobile resolution cap to `renderProjectArt` in `src/project-art.js`**

Replace:
```js
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
```
with:
```js
  const isMobile = window.matchMedia('(max-width: 640px)').matches;
  const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1 : MAX_DEVICE_PIXEL_RATIO);
```

- [ ] **Step 2: Add mobile layout tweaks to `style.css`**

```css
@media (max-width: 640px) {
  .site-section { padding: 12vw 6vw; min-height: auto; padding-top: 4rem; padding-bottom: 4rem; }
  .site-hero-title { font-size: clamp(2.5rem, 14vw, 4rem); }
  #nav-toggle { top: .5rem; right: .5rem; padding: .3rem .6rem; font-size: .8rem; }
}
```

- [ ] **Step 3: Manual verification checklist**

Run: `npm run dev`. Walk through, in a real or emulated browser:
1. Boot sequence plays, terminal shows welcome screen — unchanged from before this project.
2. Every command in `COMMANDS` (terminal.js) still produces correct output (`/about`, `/projects`, `/skills`, `/security`, `/certs`, `/ctf`, `/philosophy`, `/uses`, `/social`, `/contact`, `/cv`, `/themes`, `/matrix`, `/party`, `/clear`, easter eggs).
3. `/enter` and the nav toggle both transition into the scroll site with the glitch flash; toggle again returns to terminal with input focused.
4. Scroll site: hero, about, 12 project cards (generated art visible, distinct per tag group), skills (bars fill on scroll), contact (mailto link correct) all render and reveal on scroll.
5. Chrome DevTools → toggle device toolbar (mobile emulation): no custom cursor, layout doesn't overflow horizontally, project art still renders (lower-res, no visible artifacting).
6. DevTools → Rendering → "Emulate CSS prefers-reduced-motion: reduce": grain is a single static frame (not animated), cursor fx disabled, reveals appear at rest immediately, transition wipe is instant.
7. `npm run build && npm run preview` — production build serves correctly with no console errors.

- [ ] **Step 4: Run full test suite**

Run: `npx vitest run`
Expected: all tests from Task 3 and Task 6 pass.

- [ ] **Step 5: Commit**

```bash
git add src/project-art.js style.css
git commit -m "feat: cap generative art resolution on mobile, tune mobile layout"
```

---

## Post-plan notes
- Real project screenshots can later replace `renderProjectArt` output per-project by adding an `image` field to entries in `src/data.js` `PROJECTS` and branching in `src/site.js`'s card-building loop — out of scope here per the spec.
- `AVATAR.jpg` pixelation logic (terminal.js `loadAvatar`/`pixelateToCanvas`) was untouched by this plan; the scroll site's hero does not currently show the avatar — a follow-up could add it if desired.
