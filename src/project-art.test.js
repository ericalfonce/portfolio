import { describe, it, expect, beforeAll } from 'vitest';
import { renderProjectArt } from './project-art.js';

beforeAll(() => {
  window.matchMedia = window.matchMedia || (() => ({ matches: false }));
});

describe('renderProjectArt', () => {
  it('draws without throwing for each known tag combination', () => {
    const canvas = document.createElement('canvas');
    Object.defineProperty(canvas, 'clientWidth', { value: 300 });
    Object.defineProperty(canvas, 'clientHeight', { value: 160 });
    for (const tags of [['security'], ['python'], ['html', 'css'], ['cloud']]) {
      expect(() => renderProjectArt(canvas, tags)).not.toThrow();
    }
  });
});
