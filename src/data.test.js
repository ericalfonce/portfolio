import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { join, dirname, resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PROFILE, PROJECTS, FEATURED_PROJECTS, OTHER_PROJECTS, SKILLS, getProject, getNextProject } from './data.js';

/* ================================================================
   Data integrity.

   The previous data layer carried a dozen projects that do not exist
   in the public repository, invented skill percentages, and
   certification "statuses". These tests are the guard rail: a project
   cannot be added without a real link or an explicit null, and the
   copy cannot quietly grow claims nobody verified.
   ================================================================ */

const root = resolvePath(dirname(fileURLToPath(import.meta.url)), '..');
const isHttps = (v) => /^https:\/\/[^\s]+$/i.test(v);

describe('profile', () => {
  it('carries the fields the UI reads', () => {
    for (const key of ['name', 'role', 'location', 'about', 'github', 'linkedin', 'instagram', 'email', 'company']) {
      expect(PROFILE[key], `PROFILE.${key} is required`).toBeTruthy();
    }
  });

  it('uses the verified handles', () => {
    expect(PROFILE.github).toBe('https://github.com/ericalfonce');
    expect(PROFILE.linkedin).toBe('https://www.linkedin.com/in/ericalfonce');
    expect(PROFILE.instagram).toBe('https://www.instagram.com/ericalfonce');
  });

  it('uses https for every outbound profile link', () => {
    for (const key of ['github', 'linkedin', 'instagram', 'company']) {
      expect(isHttps(PROFILE[key]), `${key} must be https`).toBe(true);
    }
    expect(PROFILE.email).toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/);
  });

  it('writes the bio as short first-person paragraphs', () => {
    expect(Array.isArray(PROFILE.about)).toBe(true);
    expect(PROFILE.about.length).toBeGreaterThanOrEqual(3);
    for (const para of PROFILE.about) {
      expect(para.length).toBeLessThan(400);
    }
    /* First person throughout — no detached "he/this developer" voice. */
    const bio = PROFILE.about.join(' ');
    expect(bio).toMatch(/\bI\b/);
    expect(bio).not.toMatch(/\b(Eric|He) (is|was|has|builds)\b/);
  });
});

describe('projects', () => {
  it('is not empty and every project is complete enough to render', () => {
    expect(PROJECTS.length).toBeGreaterThan(5);
    for (const p of PROJECTS) {
      for (const key of ['slug', 'name', 'category', 'summary', 'body', 'stack']) {
        expect(p[key], `${p.slug} is missing ${key}`).toBeTruthy();
      }
      expect(Array.isArray(p.body)).toBe(true);
      expect(p.body.length).toBeGreaterThanOrEqual(1);
      expect(p.summary.length).toBeLessThan(300);
    }
  });

  it('has unique slugs and names', () => {
    for (const key of ['slug', 'name']) {
      const values = PROJECTS.map((p) => p[key]);
      expect([...new Set(values)].length, `duplicate ${key}`).toBe(values.length);
    }
  });

  it('gives every project a slug the router can match', () => {
    for (const p of PROJECTS) expect(p.slug).toMatch(/^[a-z0-9-]+$/);
  });

  it('never invents a url or repo link', () => {
    for (const p of PROJECTS) {
      for (const key of ['url', 'repo']) {
        if (p[key] === null || p[key] === undefined) continue;
        expect(isHttps(p[key]), `${p.slug}.${key} must be an https URL or null, got ${p[key]}`).toBe(true);
      }
    }
  });

  it('only sets mark when the real asset is actually on disk', () => {
    for (const p of PROJECTS) {
      if (!p.mark) continue;
      const path = join(root, 'public', 'img', p.mark);
      expect(existsSync(path), `${p.slug} points at a missing asset: ${p.mark}`).toBe(true);
    }
  });

  it('only uses brand assets that belong to the real projects', () => {
    const allowed = new Set([
      'mulikascans-logo.png',
      'mulikascans-icon.png',
      'iklwalabs-logo.png',
    ]);
    for (const p of PROJECTS) {
      if (!p.mark) continue;
      expect(allowed.has(p.mark), `unexpected generated mark: ${p.mark}`).toBe(true);
    }
  });

  it('keeps year null or a plausible four-digit year', () => {
    for (const p of PROJECTS) {
      if (p.year === null) continue;
      expect(String(p.year)).toMatch(/^\d{4}$/);
      expect(p.year).toBeGreaterThanOrEqual(2020);
      expect(p.year).toBeLessThanOrEqual(new Date().getFullYear());
    }
  });

  it('has exactly one featured project and it leads the list', () => {
    expect(FEATURED_PROJECTS).toHaveLength(1);
    expect(FEATURED_PROJECTS[0].slug).toBe('mulikascans');
    expect(PROJECTS[0].slug).toBe('mulikascans');
    expect(OTHER_PROJECTS.every((p) => !p.featured)).toBe(true);
    expect(OTHER_PROJECTS.length).toBe(PROJECTS.length - 1);
  });

  it('gives the featured project a real public link', () => {
    expect(FEATURED_PROJECTS[0].url).toBe('https://mulikascans.com');
  });

  it('drops the invented repositories from the previous data set', () => {
    /* These were listed before but are not in the public account. */
    const gone = ['imei-guard', 'webscanner', 'Bluetooth-jammer-esp32', 'diagrams', 'Web-Dev-For-Beginners'];
    const blob = JSON.stringify(PROJECTS);
    for (const repo of gone) expect(blob, `${repo} should not be listed`).not.toContain(repo);
  });

  it('makes no unverifiable claims in the copy', () => {
    const blob = PROJECTS.flatMap((p) => [p.summary, ...p.body]).join(' ');
    for (const claim of [
      /\d+\s*%\s*(faster|more|higher|improvement|increase)/i,
      /\b\d[\d,]*\s*(users|customers|clients|companies|scans run|downloads)\b/i,
      /\b(revenue|turnover|arr|mrr|funding|raised)\b/i,
      /\b(award|award-winning|certified by|industry-leading|world-class|best-in-class)\b/i,
      /\b\d+\+?\s*years of experience\b/i,
    ]) {
      expect(blob, `unverified claim matched ${claim}`).not.toMatch(claim);
    }
  });

  it('does not claim unearned certifications', () => {
    const blob = JSON.stringify(PROJECTS);
    /* Note: these are matched literally — "Security+" must be escaped,
       or the + is read as a regex quantifier and matches "Security".
       Only certificate names belong here. "work in progress" is
       allowed, because saying a project is unreleased is the truth. */
    for (const cert of ['OSCP', 'CEH', 'Security+', 'AWS Certified', 'Google Cybersecurity']) {
      expect(blob, `${cert} should not be claimed`).not.toContain(cert);
    }
  });
});

describe('skills', () => {
  it('is grouped plain text with no percentages or bars', () => {
    const groups = Object.entries(SKILLS);
    expect(groups.length).toBeGreaterThan(0);
    for (const [group, items] of groups) {
      expect(items.length, `${group} should list skills`).toBeGreaterThan(0);
      for (const item of items) {
        expect(typeof item).toBe('string');
        /* No proficiency numbers. Digits are fine — "OWASP Top 10" is a
           name, not a score — but a % is always a claim. */
        expect(item, `${group} contains a percentage`).not.toMatch(/%/);
      }
    }
    expect(JSON.stringify(SKILLS)).not.toMatch(/\bpct\b/i);
  });
});

describe('lookups', () => {
  it('finds a project by slug and returns null otherwise', () => {
    expect(getProject('mulikascans')?.name).toBe('MulikaScans');
    expect(getProject('nope')).toBeUndefined();
  });

  it('cycles to the next project, skipping unknown slugs', () => {
    expect(getNextProject('mulikascans')?.slug).not.toBe('mulikascans');
    expect(getNextProject('nope')).toBeNull();
    /* Every project must have a successor, so "next" is never dead. */
    for (const p of PROJECTS) expect(getNextProject(p.slug)).toBeTruthy();
  });
});
