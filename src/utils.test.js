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
