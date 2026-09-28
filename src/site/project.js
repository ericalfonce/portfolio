/* ================================================================
   Project case study page — /work/:slug

   Structure: hero (title, category, year, large visual) →
   overview → problem → approach → technology → source → next project.

   Nothing here is invented. Where a field has no verified value
   (year, role, release status) the row is simply omitted rather
   than filled with a plausible guess.
   ================================================================ */

import { PROJECTS, getProject, getNextProject, getTechnologies, PROFILE } from '../data.js';
import { projectArtSVG } from './art.js';
import { pad2, esc } from '../utils.js';

function metaRow(label, value) {
  if (!value) return '';
  return `
    <div class="pmeta__row">
      <dt class="pmeta__key">${esc(label)}</dt>
      <dd class="pmeta__val">${esc(value)}</dd>
    </div>`;
}

function featureList(items = []) {
  if (!items.length) return '';
  return `
    <ul class="plist">
      ${items.map((f) => `<li class="plist__item">${esc(f)}</li>`).join('')}
    </ul>`;
}

/* ── Not found ─────────────────────────────────────────────── */
function renderNotFound(view) {
  document.title = 'Project not found — Eric Alfonce';
  view.innerHTML = `
    <section class="notfound section">
      <div class="section__head">
        <span class="section__index">404</span>
        <span class="section__label">Not found</span>
      </div>
      <h1 class="section__title" data-route-heading>
        <span class="line"><span class="line__in">Project not</span></span>
        <span class="line"><span class="line__in">found.</span></span>
      </h1>
      <p class="intro__body">That project does not exist in this portfolio.</p>
      <a class="btn btn--ghost" href="/"><span>Back to home</span></a>
    </section>`;
}

/* ── Case study ────────────────────────────────────────────── */
function renderProject(view, project) {
  const next = getNextProject(project.slug);
  const tech = getTechnologies(project);

  document.title = `${project.title} — Eric Alfonce`;

  view.innerHTML = `
    <article class="case">
      <!-- Hero -->
      <header class="case__hero">
        <a class="case__back" href="/#work">
          <svg width="16" height="10" viewBox="0 0 16 10" fill="none" aria-hidden="true">
            <path d="M6 1L2 5l4 4M2 5h12" stroke="currentColor" stroke-width="1.3"/>
          </svg>
          <span>All work</span>
        </a>

        <div class="case__headline">
          <p class="case__num">${pad2(project.number)} <span>/ ${pad2(PROJECTS.length)}</span></p>
          <h1 class="case__title" data-route-heading>${esc(project.title)}</h1>
          <p class="case__cat">${esc(project.category)}</p>
        </div>

        <div class="case__art">${projectArtSVG(project, { w: 1600, h: 900 })}</div>

        <dl class="pmeta">
          ${metaRow('Category', project.category)}
          ${metaRow('Year', project.year)}
          ${metaRow('Repository', project.url.replace(/^https?:\/\//, ''))}
        </dl>
      </header>

      <!-- Overview -->
      <section class="case__section">
        <div class="case__aside">
          <span class="case__aside-num">01</span>
          <span class="case__aside-label">Overview</span>
        </div>
        <div class="case__body">
          <p class="case__lead">${esc(project.description)}</p>
        </div>
      </section>

      <!-- Problem -->
      <section class="case__section">
        <div class="case__aside">
          <span class="case__aside-num">02</span>
          <span class="case__aside-label">Problem</span>
        </div>
        <div class="case__body">
          <p class="case__text">${esc(project.problem)}</p>
        </div>
      </section>

      <!-- Solution -->
      <section class="case__section">
        <div class="case__aside">
          <span class="case__aside-num">03</span>
          <span class="case__aside-label">Approach</span>
        </div>
        <div class="case__body">
          <p class="case__text">${esc(project.approach)}</p>
          ${featureList(project.features)}
        </div>
      </section>

      <!-- Technology -->
      <section class="case__section">
        <div class="case__aside">
          <span class="case__aside-num">04</span>
          <span class="case__aside-label">Technology</span>
        </div>
        <div class="case__body">
          <ul class="chips">
            ${tech.map((t) => `<li class="chip">${esc(t)}</li>`).join('')}
          </ul>
        </div>
      </section>

      <!-- Visual -->
      <section class="case__section case__section--wide">
        <div class="case__art case__art--detail">${projectArtSVG(project, { w: 1600, h: 900 })}</div>
      </section>

      <!-- Source -->
      <section class="case__section">
        <div class="case__aside">
          <span class="case__aside-num">05</span>
          <span class="case__aside-label">Source</span>
        </div>
        <div class="case__body">
          <p class="case__text">
            ${esc(project.title)} is published as a public repository on GitHub. The source is the
            most current and accurate description of the project.
          </p>
          <p class="case__text case__text--muted">
            Built with ${tech.map((t) => esc(t)).join(', ')}.
          </p>
          <a class="btn btn--ghost" href="${esc(project.url)}" data-native target="_blank" rel="noopener">
            <span>View source</span>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
              <path d="M3 1h5v5M8 1L1 8M1 5v5h5" stroke="currentColor" stroke-width="1.2"/>
            </svg>
          </a>
        </div>
      </section>

      <!-- Next project -->
      ${
        next
          ? `<a class="next" href="/work/${esc(next.slug)}">
              <span class="next__label">Next project</span>
              <span class="next__title">${esc(next.title)}</span>
              <span class="next__arrow" aria-hidden="true">→</span>
            </a>`
          : ''
      }
    </article>`;
}

export function renderProjectRoute(view, slug) {
  const project = getProject(slug);
  if (!project) renderNotFound(view);
  else renderProject(view, project);
}

export { PROFILE };
