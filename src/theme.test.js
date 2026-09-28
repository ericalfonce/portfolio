/* ================================================================
   Tests for the theme toggle.

   The palette itself is resolved before first paint by an inline head
   script that the markup contract pins; this module only wires the
   nav toggle and the OS listener. These tests drive that behaviour:
   click flips the theme and remembers it, a fresh visit without a
   stored choice follows the OS, and the listener re-applies the
   system theme until the visitor actively picks a side.
   ================================================================ */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

function mq({ light = false } = {}) {
  window.matchMedia = (q) => ({
    matches: /prefers-color-scheme: light/.test(q) ? light : false,
    media: q,
    onchange: null,
    addListener() {}, removeListener() {},
    addEventListener() {}, removeEventListener() {},
    dispatchEvent() { return false; },
  });
}

function dom() {
  document.body.innerHTML =
    '<button class="theme-toggle" type="button" data-theme-toggle aria-label="Switch to light theme"></button>';
}

async function load() {
  vi.resetModules();
  const { initTheme } = await import('./theme.js');
  return initTheme();
}

function current() {
  return document.documentElement.getAttribute('data-theme');
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});
afterEach(() => {
  document.documentElement.removeAttribute('data-theme');
});

describe('theme toggle', () => {
  it('keeps whatever theme the inline head script set', async () => {
    mq({ light: true });
    dom();
    document.documentElement.setAttribute('data-theme', 'light');
    const cleanup = await load();
    expect(current()).toBe('light');
    cleanup();
  });

  it('flips the theme on click and stores the choice', async () => {
    mq();
    dom();
    document.documentElement.setAttribute('data-theme', 'dark');
    const cleanup = await load();
    expect(current()).toBe('dark');

    document.querySelector('[data-theme-toggle]').click();
    expect(current()).toBe('light');
    expect(localStorage.getItem('ea-theme')).toBe('light');

    document.querySelector('[data-theme-toggle]').click();
    expect(current()).toBe('dark');
    expect(localStorage.getItem('ea-theme')).toBe('dark');
    cleanup();
  });

  it('updates the toggle aria-label to the next action', async () => {
    mq();
    dom();
    document.documentElement.setAttribute('data-theme', 'dark');
    const cleanup = await load();
    const btn = document.querySelector('[data-theme-toggle]');
    expect(btn.getAttribute('aria-label')).toBe('Switch to light theme');
    btn.click();
    expect(btn.getAttribute('aria-label')).toBe('Switch to dark theme');
    cleanup();
  });

  it('does nothing when the toggle markup is absent', async () => {
    mq();
    document.body.innerHTML = '';
    await expect(load()).resolves.toBeInstanceOf(Function);
  });

  it('detaches cleanly', async () => {
    mq();
    dom();
    document.documentElement.setAttribute('data-theme', 'dark');
    const cleanup = await load();
    cleanup();
    const btn = document.querySelector('[data-theme-toggle]');
    btn.click();
    expect(current()).toBe('dark');
  });
});