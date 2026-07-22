# Portfolio Redesign: darkroom.engineering-inspired blend

## Goal
Upgrade the portfolio's visual/motion quality to feel like darkroom.engineering (award-winning agency site: big type, smooth scroll, grain texture, cursor fx, generative visuals) while keeping the site's existing terminal/CLI identity as its signature, not discarding it.

## Current state
- Static site, no build step: `index.html`, `style.css`, `terminal.js` (~2560 lines total).
- Entire UI is a single fake-terminal window. Boot sequence plays, then user types commands (`about`, `projects`, `skills`, `security`, `ctf`, `contact`, etc.) which append output blocks via `cmd*()` functions in `terminal.js`.
- Content data lives inline in `terminal.js`: `PROJECTS` (12 GitHub repos, no screenshots), `SKILLS`, plus hardcoded copy in each `cmd*` function.
- Styling: JetBrains Mono, dark theme, red/green terminal accent colors, scanline/matrix-canvas background effects already present.

## Decisions from brainstorming
1. **Structure**: Blend, not full pivot or reskin-only. Terminal boot + CLI stays as the entry experience. Below/after it, a new scroll-driven site section renders the same content (about/projects/skills/etc.) in a darkroom-style visual format. Terminal is reachable at any time via a toggle in nav, not the only mode.
2. **Tooling**: Add a Vite build. `terminal.js` logic gets split into modules; existing `PROJECTS`/`SKILLS` data is reused (not duplicated) to feed both the CLI output and the new scroll sections.
3. **Motion libraries**: Lenis (smooth scroll) + GSAP/ScrollTrigger (reveals, pinning). Grain and project-card visuals via plain Canvas 2D (not WebGL/Three.js) to keep it light on the existing VPS/static hosting.
4. **Project visuals**: No real screenshots exist. Each project card gets a procedurally generated, tag-keyed background (e.g. `security` → red glitch/scanline pattern, `python` → green matrix-rain-lite, `html/css` → wireframe mesh), rendered once at low res per card — static after generation, not continuously animated (perf, 12 cards).

## Site flow
1. Boot sequence overlay (unchanged behavior).
2. Terminal window, fully interactive as today (all existing commands keep working).
3. A visible affordance (e.g. `scroll ↓ enter site` prompt or nav toggle) transitions — via a glitch/scanline wipe — into the new scroll site.
4. Scroll site sections, populated from shared data:
   - Hero: big animated headline (name/role), letter-reveal on load.
   - About
   - Projects: grid of generative-visual cards (12 items, tag-keyed art, GSAP stagger-in on scroll).
   - Skills: animated fill-on-enter bars/tags.
   - Security/CTF highlights.
   - Contact/CTA.
5. Nav toggle lets the user jump back into pure terminal/CLI mode at any point.

## Visual system
- **Palette**: near-black background (`#0a0a0a`), grayscale everything, with the existing terminal red/green reserved as the only accent colors (status dots, links, tags) — consistent with darkroom's restraint.
- **Type**: JetBrains Mono retained for terminal/labels/code. New large display sans (Inter or similar via Google Fonts) for hero headlines/section titles at 8–12vw scale.
- **Grain**: full-viewport animated canvas noise overlay, ~4% opacity, above background/below content.
- **Custom cursor**: dot/ring that scales on hover over interactive elements.
- **Scroll reveals**: GSAP ScrollTrigger fade/slide-up per section; staggered project card entrance; skill bar fill-on-enter.
- **Transitions**: terminal → scroll-site handoff uses a glitch/scanline wipe (thematically consistent), not a generic fade.

## Out of scope
- Real project screenshots (can be swapped in later; generative visuals are the shipped default).
- WebGL/Three.js — deliberately avoided for perf/complexity given static hosting and no current 3D asset pipeline.
- Rewriting copy/content — reuse existing strings from `terminal.js` `cmd*` functions and `PROFILE`/`PROJECTS`/`SKILLS` data.
- Backend/build pipeline changes beyond adding Vite (no server-side changes; site remains static output for deploy).

## Testing / verification
- Visual check in browser (dev server) for: boot → terminal → transition → each scroll section → nav toggle back to terminal.
- Confirm all existing terminal commands still function unchanged.
- Confirm reduced-motion users get non-animated fallback (prefers-reduced-motion: disable Lenis smoothing, grain animation, and cursor fx; keep static layout).
- Check mobile: scroll site must work without custom cursor (touch), smooth scroll degrades gracefully, project card generative art renders at reduced res.
- Lighthouse/perf spot check after adding canvas grain + Lenis + GSAP to ensure no major regression on the static host.
