/* ================================================================
   Eric Alfonce — interactive terminal.

   Kept because it is genuinely part of who Eric is. The content
   inside it was rewritten to match data.js: it no longer claims
   certifications, CTF progress, tool inventories, proficiency
   percentages, git history or availability that cannot be verified.
   ================================================================ */

'use strict';

import { PROFILE, PROJECTS, SKILLS, ROUTE_TITLES } from './data.js';

/* ── DOM refs ── */
const output    = document.getElementById('output');
const input     = document.getElementById('cmd-input');
const acDrop    = document.getElementById('autocomplete');
const titleEl   = document.getElementById('titlebar-title');
const terminal  = document.getElementById('terminal');
const wrapper   = document.getElementById('terminal-wrapper');
const exitModal = document.getElementById('exit-modal');

/* Every ref above is required for the terminal to function. If the
   homepage is ever rendered without the terminal section, bail out
   quietly instead of throwing on a null listener target. */
const mounted = Boolean(output && input && wrapper && terminal);
if (!mounted) console.warn('[terminal] markup not present — terminal disabled.');

/* ── State ── */
let cmdHistory  = [];
let histIdx     = -1;
let isMaximized = false;
let isMinimized = false;

const prefersReduced = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ================================================================
   COMMANDS
   ================================================================ */

const COMMANDS = {
  '/help':      { fn: cmdHelp,     desc: 'Show all available commands' },
  '/about':     { fn: cmdAbout,    desc: 'About Eric'                },
  '/projects':  { fn: cmdProjects, desc: 'Every project'             },
  '/work':      { fn: cmdWork,     desc: 'Case study index'          },
  '/skills':    { fn: cmdSkills,   desc: 'Skills and tools'          },
  '/contact':   { fn: cmdContact,  desc: 'Links and email'           },

  '/github':    { fn: () => openLink(PROFILE.github),    desc: 'Open GitHub'    },
  '/linkedin':  { fn: () => openLink(PROFILE.linkedin),  desc: 'Open LinkedIn'  },
  '/instagram': { fn: () => openLink(PROFILE.instagram), desc: 'Open Instagram' },
  '/email':     { fn: cmdEmail,                        desc: 'Show email'     },

  '/clear':     { fn: cmdClear,    desc: 'Clear the terminal' },
  '/welcome':   { fn: cmdWelcome,  desc: 'Show the welcome screen' },

  /* desc:null keeps these out of autocomplete and /help. */
  'whoami':    { fn: cmdWhoami,    desc: null },
  'ls':        { fn: cmdLs,        desc: null },
  'pwd':       { fn: cmdPwd,       desc: null },
  'cat readme.md': { fn: cmdReadme, desc: null },
  'ping eric': { fn: cmdPing,      desc: null },
  'hello':     { fn: cmdHello,     desc: null },
  'hi':        { fn: cmdHello,     desc: null },
  'help':      { fn: cmdHelp,      desc: null },
};

const PUBLIC_CMDS = Object.entries(COMMANDS)
  .filter(([, v]) => v.desc !== null)
  .map(([k, v]) => ({ cmd: k, desc: v.desc }));

/* ================================================================
   INIT
   ---------------------------------------------------------------
   Split from the boot overlay (boot.js owns that) so the terminal is
   listening while the sequence plays, and only greets the visitor
   once the overlay is gone.
   ================================================================ */

function initTerminal() {
  bindTitlebar();
  bindKeyboard();
  setTitle('eric@portfolio:~$');
}

/**
 * Called after the boot overlay finishes.
 * Deliberately does NOT call input.focus() — on a scrolling page that
 * would yank the viewport down to the terminal on first load.
 */
export function terminalReady() {
  cmdWelcome();
}

if (mounted) initTerminal();

/* ================================================================
   COMMAND FUNCTIONS
   ================================================================ */

function cmdWelcome() {
  appendBlock(`
    <div class="welcome-block">
      <p class="welcome-line">Eric Alfonce — <span class="hl">${esc(PROFILE.role)}</span></p>
      <p class="welcome-line welcome-line--muted">${esc(PROFILE.location)}</p>
      <div class="quick-links">
        <button class="cmd-link" type="button" data-cmd="/about">/about</button>
        <button class="cmd-link" type="button" data-cmd="/work">/work</button>
        <button class="cmd-link" type="button" data-cmd="/projects">/projects</button>
        <button class="cmd-link" type="button" data-cmd="/skills">/skills</button>
        <button class="cmd-link" type="button" data-cmd="/contact">/contact</button>
      </div>
      <p class="hint-line">Type a command, or press <kbd>Tab</kbd> to autocomplete.
        <kbd>&uarr;&darr;</kbd> for history. Click inside this window to type.</p>
    </div>
  `);
}

function cmdAbout() {
  appendBlock(`
    <div>
      <p class="section-title">about</p>
      ${PROFILE.about.map((p) => `<p class="para">${esc(p)}</p>`).join('')}
      <hr class="divider" />
      <div class="kv-rows">
        <div class="kv-row"><span class="kv-key">name</span><span class="kv-val">${esc(PROFILE.name)}</span></div>
        <div class="kv-row"><span class="kv-key">based in</span><span class="kv-val">${esc(PROFILE.location)}</span></div>
        <div class="kv-row"><span class="kv-key">company</span><span class="kv-val"><a href="${esc(PROFILE.company)}" target="_blank" rel="noopener">IklwaLabs</a></span></div>
        <div class="kv-row"><span class="kv-key">github</span><span class="kv-val"><a href="${esc(PROFILE.github)}" target="_blank" rel="noopener">github.com/ericalfonce</a></span></div>
        <div class="kv-row"><span class="kv-key">linkedin</span><span class="kv-val"><a href="${esc(PROFILE.linkedin)}" target="_blank" rel="noopener">in/ericalfonce</a></span></div>
      </div>
    </div>
  `);
}

function cmdProjects() {
  const rows = PROJECTS.map((p) => {
    const meta = [p.category, p.year].filter(Boolean).join(' · ');
    return `
      <div class="project-row">
        <p class="project-name">${esc(p.name)}</p>
        <p class="project-meta">${esc(meta)}</p>
        <p class="project-desc">${esc(p.summary)}</p>
        ${p.url ? `<a class="project-link" href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.url.replace(/^https?:\/\//, '').replace(/\/$/, ''))}</a>` : ''}
      </div>
    `;
  }).join('');

  appendBlock(`
    <div>
      <p class="section-title">projects (${PROJECTS.length})</p>
      <div class="projects-grid">${rows}</div>
    </div>
  `);
}

function cmdWork() {
  const rows = PROJECTS.map((p) => `
    <div class="work-row">
      <span class="work-row-title">${esc(p.name)}</span>
      <a class="work-row-link" href="/work/${esc(p.slug)}">${esc(p.category)} &rarr;</a>
    </div>
  `).join('');

  appendBlock(`
    <div>
      <p class="section-title">case studies</p>
      ${rows}
      <p class="para para--muted">Each row opens a full case study in the site.</p>
    </div>
  `);
}

function cmdSkills() {
  const groups = Object.entries(SKILLS).map(([group, items]) => `
    <div class="skill-category">
      <p class="skill-cat-title">${esc(group)}</p>
      <p class="skill-list">${items.map(esc).join(' · ')}</p>
    </div>
  `).join('');

  appendBlock(`
    <div>
      <p class="section-title">skills</p>
      <div class="skills-section">${groups}</div>
    </div>
  `);
}

function cmdContact() {
  appendBlock(`
    <div>
      <p class="section-title">contact</p>
      <p><span class="lbl">Email &rarr; </span><a href="mailto:${esc(PROFILE.email)}">${esc(PROFILE.email)}</a></p>
      <p><span class="lbl">GitHub &rarr; </span><a href="${esc(PROFILE.github)}" target="_blank" rel="noopener">github.com/ericalfonce</a></p>
      <p><span class="lbl">LinkedIn &rarr; </span><a href="${esc(PROFILE.linkedin)}" target="_blank" rel="noopener">in/ericalfonce</a></p>
      <p><span class="lbl">Instagram &rarr; </span><a href="${esc(PROFILE.instagram)}" target="_blank" rel="noopener">@ericalfonce</a></p>
      <p><span class="lbl">Company &rarr; </span><a href="${esc(PROFILE.company)}" target="_blank" rel="noopener">iklwalabs.co.tz</a></p>
    </div>
  `);
}

function cmdEmail() {
  appendBlock(`<p class="success-line">${esc(PROFILE.email)}</p>`);
}

function cmdClear() {
  output.innerHTML = '';
  setTitle('eric@portfolio:~$');
}

function cmdHelp() {
  const rows = PUBLIC_CMDS.map(({ cmd, desc }) =>
    `<span class="help-cmd">${esc(cmd)}</span><span class="help-desc">${esc(desc)}</span>`
  ).join('');

  appendBlock(`
    <div>
      <p class="section-title">commands</p>
      <div class="help-table">${rows}</div>
      <p class="para para--muted">
        <kbd>&uarr;&darr;</kbd> history &nbsp;|&nbsp; <kbd>Tab</kbd> autocomplete
      </p>
    </div>
  `);
}

/* ── Easter eggs ── */
function cmdWhoami() {
  appendBlock(`<p class="success-line">${esc(PROFILE.name)} — ${esc(PROFILE.role)}, ${esc(PROFILE.location)}</p>`);
}

function cmdLs() {
  appendBlock(`<p class="para">about/ &nbsp; work/ &nbsp; projects/ &nbsp; skills/ &nbsp; contact/ &nbsp; README.md</p>`);
}

function cmdPwd() {
  appendBlock(`<p class="para">/home/eric/portfolio</p>`);
}

function cmdReadme() {
  appendBlock(`
    <div>
      <p class="section-title">README.md</p>
      ${PROFILE.about.map((p) => `<p class="para">${esc(p)}</p>`).join('')}
      <p class="para para--muted">Type <span class="hl">/work</span> for the project index,
        or <span class="hl">/contact</span> for links.</p>
    </div>
  `);
}

function cmdPing() {
  appendBlock(`
    <p class="para">PING eric — 56 bytes of data</p>
    <p class="success-line">64 bytes from eric: icmp_seq=1 ttl=64 time=0.9ms</p>
    <p class="success-line">64 bytes from eric: icmp_seq=2 ttl=64 time=1.1ms</p>
  `);
}

function cmdHello() {
  appendBlock(`<p class="success-line">Hello. Type <span class="hl">/help</span> to see everything.</p>`);
}

/* ================================================================
   TITLE BAR
   ================================================================ */

function bindTitlebar() {
  const btnClose  = document.getElementById('btn-close');
  const btnMin    = document.getElementById('btn-min');
  const btnMax    = document.getElementById('btn-max');
  const btnCancel = document.getElementById('exit-cancel');
  const btnOk     = document.getElementById('exit-confirm');

  btnClose?.addEventListener('click', () => {
    exitModal.hidden = false;
    btnCancel?.focus();
  });

  btnCancel?.addEventListener('click', () => {
    exitModal.hidden = true;
    focusInput();
  });

  btnOk?.addEventListener('click', () => {
    exitModal.hidden = true;
    terminal.classList.add('is-closed');
    output.innerHTML = '';
  });

  btnMin?.addEventListener('click', () => {
    if (isMinimized) {
      terminal.classList.remove('minimized');
      isMinimized = false;
      setTimeout(focusInput, 350);
    } else {
      terminal.classList.add('minimized');
      isMinimized = true;
    }
  });

  btnMax?.addEventListener('click', () => {
    isMaximized = !isMaximized;
    terminal.classList.toggle('maximized', isMaximized);
    wrapper.classList.toggle('maximized', isMaximized);
    document.body.classList.toggle('term-is-maximized', isMaximized);
  });
}

/* ================================================================
   INPUT
   ================================================================ */

function bindKeyboard() {
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const val = input.value.trim();
      input.value = '';
      hideAC();
      if (!val) return;
      cmdHistory.unshift(val);
      if (cmdHistory.length > 80) cmdHistory.pop();
      histIdx = -1;
      echoCmd(val);
      runCommand(val.toLowerCase());
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      histIdx = Math.min(histIdx + 1, cmdHistory.length - 1);
      input.value = cmdHistory[histIdx] || '';
      cursorEnd();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      histIdx = Math.max(histIdx - 1, -1);
      input.value = histIdx < 0 ? '' : cmdHistory[histIdx];
      cursorEnd();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const first = getMatches(input.value)[0];
      if (first) { input.value = first.cmd; hideAC(); }
    } else if (e.key === 'Escape') {
      hideAC();
    }
  });

  input.addEventListener('input', () => {
    const val = input.value;
    if (!val) { hideAC(); return; }
    const m = getMatches(val);
    if (m.length) showAC(m); else hideAC();
  });

  /* Escape closes the modal / restores a minimized terminal, but only
     while the terminal actually has focus. */
  terminal.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (exitModal && !exitModal.hidden) {
      exitModal.hidden = true;
      focusInput();
    }
    if (isMinimized) {
      terminal.classList.remove('minimized');
      isMinimized = false;
      focusInput();
    }
  });

  /* Click-to-focus, scoped to the terminal. A document-level handler
     would drag the viewport down to the terminal on every click. */
  terminal.addEventListener('mousedown', () => {
    if (exitModal && !exitModal.hidden) return;
    if (isMinimized) return;
    /* Defer so the click still lands on its target first. */
    setTimeout(focusInput, 0);
  });

  /* Delegated handler so the command buttons inside the output area
     work without inline onclick attributes. */
  output.addEventListener('click', (e) => {
    const cmdBtn = e.target.closest('[data-cmd]');
    if (!cmdBtn) return;
    e.preventDefault();
    runCommand(cmdBtn.dataset.cmd.toLowerCase());
    scrollToBottom();
  });
}

/* preventScroll keeps the viewport still when focus moves into the
   input, which sits at the bottom of a long page. */
function focusInput() {
  if (isMinimized) return;
  input.focus({ preventScroll: true });
}

/* ── Autocomplete ── */
function getMatches(val) {
  const v = val.toLowerCase();
  return PUBLIC_CMDS.filter(({ cmd }) => cmd.startsWith(v));
}

function showAC(items) {
  acDrop.innerHTML = items.slice(0, 8).map(({ cmd, desc }) =>
    `<div class="autocomplete-item" data-cmd="${esc(cmd)}" role="option" tabindex="-1">
       ${esc(cmd)}<span>${esc(desc)}</span>
     </div>`
  ).join('');
  acDrop.classList.add('visible');
  input.setAttribute('aria-expanded', 'true');
  acDrop.querySelectorAll('.autocomplete-item').forEach((el) => {
    el.addEventListener('mousedown', (e) => {
      /* mousedown, not click: the wrapper's mousedown handler would
         otherwise re-focus the input and collapse the list first. */
      e.preventDefault();
      input.value = el.dataset.cmd;
      hideAC();
      focusInput();
    });
  });
}

function hideAC() {
  acDrop.classList.remove('visible');
  acDrop.innerHTML = '';
  input.setAttribute('aria-expanded', 'false');
}

/* ================================================================
   RUNNER + OUTPUT HELPERS
   ================================================================ */

function runCommand(cmd) {
  const entry = COMMANDS[cmd];
  if (entry) {
    entry.fn();
    setTitle(ROUTE_TITLES[cmd] || 'eric@portfolio:~$');
  } else {
    appendBlock(
      `<p class="error-line">command not found: <strong>${esc(cmd)}</strong>` +
      ` — type <span class="hl">/help</span> for the list.`
    );
    setTitle('eric@portfolio:~$');
  }
  scrollToBottom();
}

function appendBlock(html) {
  const div = document.createElement('div');
  div.className = 'out-block';
  div.innerHTML = html;
  output.appendChild(div);
  scrollToBottom();
  return div;
}

function echoCmd(cmd) {
  const el = document.createElement('div');
  el.className = 'echo-line';
  el.textContent = cmd;
  output.appendChild(el);
}

function scrollToBottom() { output.scrollTop = output.scrollHeight; }
function cursorEnd()       { setTimeout(() => { input.selectionStart = input.selectionEnd = input.value.length; }, 0); }

function setTitle(t) {
  titleEl.textContent = t;
  document.title = t === 'eric@portfolio:~$'
    ? 'Eric Alfonce — Cybersecurity & Software'
    : `${t.replace('eric@portfolio: ', '')} — Eric Alfonce`;
}

function openLink(url) {
  appendBlock(`<p class="success-line">Opening <a href="${esc(url)}" target="_blank" rel="noopener">${esc(url)}</a> &hellip;</p>`);
  window.open(url, '_blank', 'noopener');
}

/* Local esc, so this module does not depend on site-layer internals. */
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
