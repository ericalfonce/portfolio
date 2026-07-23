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
    card.classList.add('reveal-up');
    card.innerHTML = `
      <canvas></canvas>
      <div class="site-project-card-label">
        <strong>${p.name}</strong>
        <div style="color:var(--muted);font-size:.85rem">${p.tags.join(' · ')}</div>
      </div>
    `;
    grid.appendChild(card);
    const canvas = card.querySelector('canvas');
    canvas.dataset.tags = p.tags.join(',');
    renderProjectArt(canvas, p.tags);
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

  document.querySelector('.site-hero-title').classList.add('reveal-up');
  document.querySelector('.site-hero-role').classList.add('reveal-up');
  document.querySelectorAll('.site-heading').forEach((el) => el.classList.add('reveal-up'));
  document.getElementById('site-skills').classList.add('reveal-fill');
}

/* Re-render project art at correct resolution once #site becomes visible —
   it's display:none (and thus zero-size) until the visitor enters the site. */
export function refreshProjectArt() {
  document.querySelectorAll('.site-project-card canvas').forEach((canvas) => {
    renderProjectArt(canvas, canvas.dataset.tags.split(','));
  });
}
