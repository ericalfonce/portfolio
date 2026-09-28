import { describe, it, expect, vi } from 'vitest';
import { esc, prefersReducedMotion } from './utils.js';

describe('esc', () => {
  it('escapes the characters that can break out of an attribute or tag', () => {
    expect(esc('<script>alert(1)</script>'))
      .toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(esc('a & b')).toBe('a &amp; b');
    expect(esc('say "hi"')).toBe('say &quot;hi&quot;');
    expect(esc("it's")).toBe('it&#39;s');
  });

  it('escapes ampersands before the entities it introduces', () => {
    /* A naive order would turn &lt; into &amp;lt; */
    expect(esc('&lt;')).toBe('&amp;lt;');
  });

  it('coerces non-strings', () => {
    expect(esc(42)).toBe('42');
    expect(esc(null)).toBe('null');
    expect(esc(undefined)).toBe('undefined');
  });

  it('leaves plain text untouched', () => {
    expect(esc('MulikaScans')).toBe('MulikaScans');
    expect(esc('Python · Flask · PostgreSQL')).toBe('Python · Flask · PostgreSQL');
  });
});

describe('prefersReducedMotion', () => {
  it('reflects the media query', () => {
    /* jsdom does not implement matchMedia, so it is stubbed here. */
    const original = window.matchMedia;
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });

    expect(prefersReducedMotion()).toBe(true);
    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');

    window.matchMedia = original;
  });
});
