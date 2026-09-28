/* ================================================================
   Home view — renders the data-driven parts of the homepage.

   Everything else (hero, intro, capabilities shell, about, contact,
   terminal) is authored directly in index.html so it is present in
   the served HTML for crawlers and paints with no layout shift.
   Only the repeated, data-derived blocks are generated here.
   ================================================================ */

import {
  PROJECTS, FEATURED_PROJECTS, OTHER_PROJECTS,
  CAPABILITIES, PROFILE,
} from '../data.js';
import { projectArtSVG } from './art.js';
import { pad2, esc } from '../utils.js';

/* ── Selected work ────────────────────────────────────────────
   Large alternating poster sections. Number, title, category,
   year (omitted when unknown — no invented dates), description,
   the generated visual, and a link into the case study. */
function workCard(project, i) {
  const flip = i % 2 === 1;
  const year = project.year
    ? `<span class="work-card__year">${esc(project.year)}</span>`
    : '';

  return `
    <article class="work-card${flip ? ' work-card--flip' : ''}" data-reveal>
      <a class="work-card__link" href="/work/${esc(project.slug)}" data-tilt="5" data-cursor-view="View" aria-label="View the ${esc(project.title)} case study">
        <div class="work-card__frame">
          <div class="work-card__art">${projectArtSVG(project)}</div>
          <span class="work-card__badge" aria-hidden="true">View project</span>
        </div>
      </a>

      <div class="work-card__body">
        <p class="work-card__meta">
          <span class="work-card__num">${pad2(project.number)}</span>
          <span class="work-card__cat">${esc(project.category)}</span>
          ${year}
        </p>

        <h3 class="work-card__title">${esc(project.title)}</h3>
        <p class="work-card__desc">${esc(project.shortDescription)}</p>

        <a class="work-card__cta" href="/work/${esc(project.slug)}" tabindex="-1" aria-hidden="true">
          <span>View project</span>
          <svg width="16" height="10" viewBox="0 0 16 10" fill="none" aria-hidden="true">
            <path d="M10 1l4 4-4 4M14 5H2" stroke="currentColor" stroke-width="1.3"/>
          </svg>
        </a>
      </div>
    </article>`;
}

/* ── Full index of every project ───────────────────────────── */
function workIndexItem(project) {
  return `
    <li class="work__index-item">
      <a href="/work/${esc(project.slug)}">
        <span class="work__index-num">${pad2(project.number)}</span>
        <span class="work__index-name">${esc(project.title)}</span>
        <span class="work__index-cat">${esc(project.category)}</span>
      </a>
    </li>`;
}

/* ── Capabilities grid ─────────────────────────────────────── */
function capsColumn(cap, i) {
  return `
    <div class="caps__col" data-reveal>
      <p class="caps__num">${pad2(i + 1)}</p>
      <h3 class="caps__title">${esc(cap.title)}</h3>
      <ul class="caps__list">
        ${cap.items.map((item) => `<li>${esc(item)}</li>`).join('')}
      </ul>
    </div>`;
}

/* ── Public API ────────────────────────────────────────────── */
export function renderHome() {
  const list = document.querySelector('[data-work-list]');
  if (list) list.innerHTML = FEATURED_PROJECTS.map(workCard).join('');

  const index = document.querySelector('[data-work-index]');
  if (index) index.innerHTML = PROJECTS.map(workIndexItem).join('');

  const caps = document.querySelector('[data-caps-grid]');
  if (caps) caps.innerHTML = CAPABILITIES.map(capsColumn).join('');

  const year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
}

export { PROFILE, OTHER_PROJECTS };
