/* ================================================================
   Homepage renderer.

   Everything below is generated from data.js so the markup and the
   content can never drift apart. No decorative or generated visuals —
   the only imagery used is a real brand asset (project.mark).

   Sections are rendered in the order they appear in index.html:
     · feature        → the primary project (MulikaScans)
     · work index     → every other project, quietly
     · about body     → factual biography
     · about skills   → grouped skill text
     · contact links  → verified destinations
   ================================================================ */

import { PROFILE, FEATURED_PROJECTS, OTHER_PROJECTS, SKILLS } from '../data.js';
import { esc } from '../utils.js';

/* ── Primary project ─────────────────────────────────────────── */
function renderFeature() {
  const host = document.querySelector('[data-feature]');
  if (!host) return;

  host.innerHTML = FEATURED_PROJECTS.map((p) => {
    const meta = [p.category, p.year].filter(Boolean).join(' · ');
    const mark = p.mark
      ? `<img class="feature__mark" src="/img/${esc(p.mark)}" alt="${esc(p.name)}" loading="eager" decoding="async" />`
      : '';

    /* Both destinations are real: the case study always exists, and
       p.url is set only when the project is actually public. */
    const link = p.url
      ? `<a class="link-arrow" href="${esc(p.url)}" data-native target="_blank" rel="noopener">
           <span>${esc(p.url.replace(/^https?:\/\//, '').replace(/\/$/, ''))}</span>
         </a>`
      : '';

    return `
      <article class="feature__inner">
        <div>
          <h3 class="feature__name" data-route-heading>${esc(p.name)}</h3>
          <p class="feature__meta">${esc(meta)}</p>
          <p class="feature__summary">${esc(p.summary)}</p>
          <div class="feature__actions">
            <a class="link-arrow" href="/work/${esc(p.slug)}">
              <span>Case study</span>
            </a>
            ${link}
          </div>
        </div>
        ${mark ? `<div class="feature__visual">${mark}</div>` : ''}
      </article>
    `;
  }).join('');
}

/* ── Quiet index of remaining projects ───────────────────────── */
function renderIndex() {
  const host = document.querySelector('[data-work-index]');
  if (!host) return;

  if (!OTHER_PROJECTS.length) { host.hidden = true; return; }

  host.innerHTML = `
    <h3 class="index__title">Also</h3>
    <ul class="index__list">
      ${OTHER_PROJECTS.map((p) => {
        const meta = [p.category, p.year].filter(Boolean).join(' · ');
        return `
          <li class="index__row">
            <a class="index__link" href="/work/${esc(p.slug)}">
              <span class="index__name">${esc(p.name)}</span>
              <span class="index__meta">${esc(meta)}</span>
              <span class="index__summary">${esc(p.summary)}</span>
            </a>
          </li>
        `;
      }).join('')}
    </ul>
  `;
}

/* ── About ───────────────────────────────────────────────────── */
function renderAbout() {
  const body = document.querySelector('[data-about-body]');
  if (body) {
    body.innerHTML = PROFILE.about.map((para) => `<p>${esc(para)}</p>`).join('');
  }

  const skills = document.querySelector('[data-about-skills]');
  if (skills) {
    skills.innerHTML = Object.entries(SKILLS).map(([group, items]) => `
      <div>
        <p class="skills__title">${esc(group)}</p>
        <p class="skills__list">${items.map(esc).join(' · ')}</p>
      </div>
    `).join('');
  }
}

/* ── Contact ─────────────────────────────────────────────────── */
function renderContact() {
  const host = document.querySelector('[data-contact-links]');
  if (!host) return;

  const links = [
    { label: 'Email',     value: PROFILE.email,     href: `mailto:${PROFILE.email}` },
    { label: 'GitHub',    value: 'github.com/ericalfonce',      href: PROFILE.github },
    { label: 'LinkedIn',  value: 'in/ericalfonce',   href: PROFILE.linkedin },
    { label: 'Instagram', value: '@ericalfonce',     href: PROFILE.instagram },
    { label: 'IklwaLabs', value: 'iklwalabs.co.tz',  href: PROFILE.company },
  ];

  host.innerHTML = links.map((l) => {
    const external = l.href.startsWith('http');
    return `
      <li class="contact__row">
        <span class="contact__label">${esc(l.label)}</span>
        <a class="contact__value"
           href="${esc(l.href)}"
           ${external ? 'data-native target="_blank" rel="noopener"' : 'data-native'}>${esc(l.value)}</a>
      </li>
    `;
  }).join('');
}

export function renderHome() {
  renderFeature();
  renderIndex();
  renderAbout();
  renderContact();

  /* Footer year is rendered rather than hand-written so it stays
     current without a code edit. */
  const year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
}
