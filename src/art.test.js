import { describe, it, expect } from 'vitest';
import { projectArtSVG, artFamily, seedFrom } from './site/art.js';
import { PROJECTS, getProject, getNextProject, getTechnologies } from './data.js';

describe('family selection', () => {
  it('routes hardware tags to the signal family', () => {
    expect(artFamily({ tags: ['esp32', 'hardware', 'rf'] })).toBe('signal');
  });

  it('routes security tags to the scan family even alongside python', () => {
    expect(artFamily({ tags: ['python', 'security'] })).toBe('scan');
  });

  it('routes security tags to scan even when cyber is also present', () => {
    expect(artFamily({ tags: ['python', 'security', 'cyber'] })).toBe('scan');
  });

  it('routes cloud-only tags to topology', () => {
    expect(artFamily({ tags: ['cloud'] })).toBe('topology');
  });

  it('routes non-security python tags to ledger', () => {
    expect(artFamily({ tags: ['python'] })).toBe('ledger');
  });

  it('routes html/css/js tags to frame', () => {
    expect(artFamily({ tags: ['html', 'css', 'js'] })).toBe('frame');
    expect(artFamily({ tags: ['html', 'js'] })).toBe('frame');
  });

  it('falls back to topology for empty tags', () => {
    expect(artFamily({ tags: [] })).toBe('topology');
  });
});

describe('projectArtSVG', () => {
  const project = PROJECTS[0];

  it('renders a complete svg with a viewBox and accessible label', () => {
    const svg = projectArtSVG(project);
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg.endsWith('</svg>')).toBe(true);
    expect(svg).toContain('viewBox="0 0 1200 750"');
    expect(svg).toContain(`aria-label="Abstract scan diagram representing ${project.title}"`);
  });

  it('is deterministic — the same project renders identically twice', () => {
    const a = projectArtSVG(project).replace(/g-[a-z0-9-]+-\d+/g, 'ID');
    const b = projectArtSVG(project).replace(/g-[a-z0-9-]+-\d+/g, 'ID');
    expect(a).toBe(b);
  });

  it('honours explicit dimensions', () => {
    expect(projectArtSVG(project, { w: 1600, h: 900 })).toContain('viewBox="0 0 1600 900"');
  });

  it('gives each rendered instance unique gradient ids', () => {
    const first = projectArtSVG(project, { index: 'a' });
    const second = projectArtSVG(project, { index: 'b' });
    expect(first).toContain('id="g-web-vulnerability-scanner-a"');
    expect(second).toContain('id="g-web-vulnerability-scanner-b"');
  });

  it('emits unique ids across two consecutive calls without an index', () => {
    const a = projectArtSVG(project);
    const b = projectArtSVG(project);
    const idOf = (s) => s.match(/id="(g-[^"]+)"/)[1];
    expect(idOf(a)).not.toBe(idOf(b));
  });

  it('produces balanced markup for every project', () => {
    for (const p of PROJECTS) {
      const svg = projectArtSVG(p, { index: 'test' });
      expect(svg).not.toContain('NaN');
      expect(svg).not.toContain('undefined');
      expect((svg.match(/<g[ >]/g) || []).length).toBe((svg.match(/<\/g>/g) || []).length);
    }
  });
});

describe('seedFrom', () => {
  it('is stable for the same input', () => {
    expect(seedFrom('imei-guard')).toBe(seedFrom('imei-guard'));
  });

  it('differs between different inputs', () => {
    expect(seedFrom('imei-guard')).not.toBe(seedFrom('webscanner'));
  });
});

describe('data integrity', () => {
  it('has 12 projects with unique slugs and repo URLs', () => {
    expect(PROJECTS).toHaveLength(12);
    expect(new Set(PROJECTS.map((p) => p.slug)).size).toBe(12);
    expect(new Set(PROJECTS.map((p) => p.url)).size).toBe(12);
  });

  it('numbers projects 01–12 in order', () => {
    expect(PROJECTS.map((p) => p.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('uses url-safe slugs so they are valid /work/ segments', () => {
    for (const p of PROJECTS) {
      expect(p.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('points every project at the owner GitHub account', () => {
    for (const p of PROJECTS) {
      expect(p.url).toMatch(/^https:\/\/github\.com\/ericalfonce\/[A-Za-z0-9._-]+$/);
    }
  });

  it('claims no year or status anywhere — unverified fields are absent', () => {
    for (const p of PROJECTS) {
      expect(p.year).toBeNull();
      expect('status' in p).toBe(false);
    }
  });

  it('gives every project real copy and tags for its case study', () => {
    for (const p of PROJECTS) {
      expect(p.description.length).toBeGreaterThan(80);
      expect(p.problem.length).toBeGreaterThan(40);
      expect(p.approach.length).toBeGreaterThan(40);
      expect(p.features.length).toBeGreaterThan(0);
      expect(p.tags.length).toBeGreaterThan(0);
    }
  });

  it('looks up by slug and returns undefined for unknown slugs', () => {
    expect(getProject('imei-guard').title).toBe('IMEI Guard');
    expect(getProject('nope')).toBeUndefined();
  });

  it('wraps around to the first project at the end of the list', () => {
    expect(getNextProject('web-dev-curriculum').slug).toBe(PROJECTS[0].slug);
    expect(getNextProject('web-vulnerability-scanner').slug).toBe(PROJECTS[1].slug);
  });

  it('returns null for next when the slug is unknown', () => {
    expect(getNextProject('nope')).toBeNull();
  });

  it('maps tags to human-readable technology labels', () => {
    expect(getTechnologies({ tags: ['python', 'security'] })).toEqual(['Python', 'Security']);
    expect(getTechnologies({ tags: ['esp32'] })).toEqual(['ESP32']);
  });
});
