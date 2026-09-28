/* ================================================================
   Case study renderer — /work/:slug

   Same rules as the homepage: generated from data.js, real links
   only, no invented figures. A project with no public destination
   simply shows no link rather than a broken one.
   ================================================================ */

import { getProject, getNextProject } from '../data.js';
import { esc } from '../utils.js';

/* Where a mark came from, as a bare host. Used as the caption under a
   logo so the panel says what it is instead of being a bare frame
   around a picture. Falls back to the project name when the project
   has no public URL. */
function captionFor(project) {
  if (project.url) {
    try { return new URL(project.url).host.replace(/^www\./, ''); }
    catch { /* not a parseable URL - fall through to the name */ }
  }
  return project.name;
}

function notFound(view) {
  view.innerHTML = `
    <div class="case">
      <a class="case__back" href="/">&larr; Work</a>
      <h1 class="case__name">Not found</h1>
      <p class="case__meta">That project is not in the index.</p>
      <a class="link-arrow" href="/"><span>Back to work</span></a>
    </div>
  `;
}

export function renderProjectRoute(view, slug) {
  if (!view) return;

  const project = getProject(slug);
  if (!project) { notFound(view); return; }

  const meta = [project.category, project.year].filter(Boolean).join(' · ');

  const stack = project.stack.length
    ? `
      <div class="case__block">
        <h2 class="case__block-title">Stack</h2>
        <p class="case__stack">${project.stack.map(esc).join(' · ')}</p>
      </div>
    `
    : '';

  const mark = project.mark
    ? `
      <figure class="case__visual">
        <div class="case__visual-art">
          <img class="case__mark" src="/img/${esc(project.mark)}" alt="${esc(project.name)}" decoding="async" />
        </div>
        <figcaption class="case__caption">${esc(captionFor(project))}</figcaption>
      </figure>
    `
    : '';

  const links = [];
  if (project.url) {
    links.push(`
      <a class="link-arrow" href="${esc(project.url)}" data-native target="_blank" rel="noopener">
        <span>${esc(project.url.replace(/^https?:\/\//, '').replace(/\/$/, ''))}</span>
      </a>
    `);
  }
  if (project.repo && project.repo !== project.url) {
    links.push(`
      <a class="link-arrow" href="${esc(project.repo)}" data-native target="_blank" rel="noopener">
        <span>github.com/${esc(project.repo.split('/').pop())}</span>
      </a>
    `);
  }

  const next = getNextProject(slug);

  view.innerHTML = `
    <div class="case">
      <a class="case__back" href="/">&larr; Work</a>

      <h1 class="case__name" data-route-heading>${esc(project.name)}</h1>
      <p class="case__meta">${esc(meta)}</p>

      <p class="case__summary">${esc(project.summary)}</p>

      ${mark ? `<div class="case__visual">${mark}</div>` : ''}

      <div class="case__prose">
        ${project.body.map((para) => `<p>${esc(para)}</p>`).join('')}
      </div>

      ${stack}

      ${links.length ? `<div class="case__actions">${links.join('')}</div>` : ''}

      ${next ? `
        <a class="case__next" href="/work/${esc(next.slug)}">
          <span class="case__next-label">Next</span>
          <span class="case__next-name">${esc(next.name)}</span>
        </a>
      ` : ''}
    </div>
  `;
}
