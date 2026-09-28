/* ================================================================
   Theme.

   The palette is resolved before first paint by an inline script in
   the <head>: a stored choice wins, otherwise the OS preference is
   applied to <html data-theme> directly. This module only has to do
   the interactive part — the nav toggle the visitor actually pushed.

   Rules:
     · No FOUC: initTheme() re-reads whatever the inline script set,
       it never guesses the wrong theme back.
     · The toggle writes the choice to localStorage, so the inline
       script on the next visit lands straight on it.
     · While there is no stored choice, the page keeps following the
       OS — a matchMedia listener re-applies the system theme.
   ================================================================ */

const THEME_KEY = 'ea-theme';
const LIGHT_MQ = '(prefers-color-scheme: light)';

function currentTheme() {
  const t = document.documentElement.getAttribute('data-theme');
  return t === 'light' ? 'light' : 'dark';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const toggle = document.querySelector('[data-theme-toggle]');
  if (toggle) {
    toggle.setAttribute(
      'aria-label',
      theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'
    );
  }
}

export function initTheme() {
  const toggle = document.querySelector('[data-theme-toggle]');
  if (!toggle) return () => {};

  const onToggle = () => {
    const next = currentTheme() === 'light' ? 'dark' : 'light';
    try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
    applyTheme(next);
  };
  toggle.addEventListener('click', onToggle);

  /* Follow the OS until the visitor actively picks a side. */
  let mq = null;
  let onSystemChange = null;
  if (window.matchMedia) {
    mq = window.matchMedia(LIGHT_MQ);
    onSystemChange = (e) => {
      try {
        if (!localStorage.getItem(THEME_KEY)) applyTheme(e.matches ? 'light' : 'dark');
      } catch (err) {}
    };
    if (mq.addEventListener) mq.addEventListener('change', onSystemChange);
  }

  return () => {
    toggle.removeEventListener('click', onToggle);
    if (mq && onSystemChange && mq.removeEventListener) {
      mq.removeEventListener('change', onSystemChange);
    }
  };
}