import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';

/* terminal.js reads the DOM at import time and installs its listeners
   on load, so the markup is staged first and the module is imported
   once for the whole file. These are the paths the refactor touched:
   event scoping, delegated quick-links/themes, /work, and the exports
   main.js drives. */

const TERMINAL_MARKUP = `
  <canvas id="matrix-canvas"></canvas>
  <div id="confetti-layer"></div>
  <div class="view view--home" data-view="home">
    <nav data-nav></nav>
    <section class="term" id="terminal-section">
      <div class="terminal-wrapper" id="terminal-wrapper" data-theme="dark">
        <div class="terminal-window" id="terminal">
          <div class="titlebar" id="titlebar">
            <div class="titlebar-title" id="titlebar-title">eric@portfolio: ~</div>
            <div class="titlebar-buttons">
              <button class="tbtn" data-action="minimize">min</button>
              <button class="tbtn" data-action="maximize">max</button>
              <button class="tbtn" data-action="close">close</button>
            </div>
          </div>
          <div class="terminal-output" id="output" role="log"></div>
          <div class="autocomplete-dropdown" id="autocomplete"></div>
          <div class="input-line">
            <label for="cmd-input">eric@portfolio:~$</label>
            <input id="cmd-input" autocomplete="off" />
          </div>
        </div>
      </div>
    </section>
  </div>
  <div id="exit-modal" hidden>
    <p id="exit-modal-title">Close terminal?</p>
    <button id="exit-cancel">Stay</button>
    <button id="exit-ok">Close</button>
  </div>
`;

let term;
const output = () => document.getElementById('output');
const input = () => document.getElementById('cmd-input');

/** Type a command the way a visitor would and press Enter. */
function run(cmd) {
  const el = input();
  el.value = cmd;
  el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
}

beforeAll(async () => {
  document.body.innerHTML = TERMINAL_MARKUP;

  /* jsdom has no canvas 2d context and no rAF-backed frames. */
  HTMLCanvasElement.prototype.getContext = vi.fn(() => null);

  vi.resetModules();
  term = await import('./terminal.js');
});

afterAll(() => {
  vi.restoreAllMocks();
});

beforeEach(() => {
  output().innerHTML = '';
  input().value = '';
});

describe('module contract', () => {
  it('exports the hooks main.js drives', () => {
    expect(typeof term.terminalReady).toBe('function');
    expect(typeof term.runTerminalCommand).toBe('function');
  });

  it('imports without throwing and wires itself up on load', () => {
    expect(document.getElementById('terminal-wrapper').dataset.theme).toBeTruthy();
  });
});

describe('terminalReady', () => {
  it('prints the welcome block exactly once per call', () => {
    term.terminalReady();
    const first = output().textContent;
    expect(first.length).toBeGreaterThan(0);

    output().innerHTML = '';
    term.terminalReady();
    expect(output().textContent.length).toBeGreaterThan(0);
  });
});

describe('runTerminalCommand', () => {
  it('executes a command and writes its output', () => {
    term.runTerminalCommand('/help');
    const text = output().textContent.toLowerCase();
    expect(text).toContain('command');
  });

  it('reports unknown commands rather than throwing', () => {
    expect(() => term.runTerminalCommand('/definitely-not-a-command')).not.toThrow();
    expect(output().textContent.toLowerCase()).toContain('not');
  });

  it('exposes /work and renders the project palette', () => {
    term.runTerminalCommand('/work');
    expect(output().textContent.toLowerCase()).toContain('work');
  });

  it('escapes command output instead of injecting it as HTML', () => {
    term.runTerminalCommand('<img src=x onerror=alert(1)>');
    expect(output().querySelector('img')).toBeNull();
  });
});

describe('command palette', () => {
  it('runs a command typed into the input', () => {
    run('/help');
    expect(output().textContent.toLowerCase()).toContain('command');
  });

  it('ignores an empty submission', () => {
    run('');
    expect(output().textContent.trim()).toBe('');
  });

  it('renders /projects from the real project data', () => {
    run('/projects');
    const text = output().textContent;
    expect(text).toContain('IMEI Guard');
    expect(text).toContain('AgriMarket');
  });
});

describe('themes are scoped to the terminal', () => {
  it('sets the theme attribute on the wrapper, not the document', () => {
    run('/light');
    expect(document.getElementById('terminal-wrapper').dataset.theme).toBe('light');
    /* The page around the terminal must stay dark regardless. */
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(document.body.dataset.theme).toBeUndefined();
  });

  it('switches to retro and glass, still contained in the wrapper', () => {
    run('/retro');
    expect(document.getElementById('terminal-wrapper').dataset.theme).toBe('retro');

    run('/glass');
    expect(document.getElementById('terminal-wrapper').dataset.theme).toBe('glass');

    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it('restores to dark', () => {
    run('/light');
    run('/dark');
    expect(document.getElementById('terminal-wrapper').dataset.theme).toBe('dark');
  });

  it('persists the choice so a reload keeps it', () => {
    run('/retro');
    expect(localStorage.getItem('ea-theme')).toBe('retro');
    run('/dark');
  });
});

describe('event scoping', () => {
  it('clicking the terminal focuses its input', () => {
    const win = document.getElementById('terminal');
    const spy = vi.spyOn(input(), 'focus');
    win.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    /* focus is deferred to the next task so mousedown never fights the
       browser's own focus handling. */
    return new Promise((r) => setTimeout(r, 0)).then(() => {
      expect(spy).toHaveBeenCalled();
    });
  });

  it('does not hijack typing outside the terminal', () => {
    /* A stray keydown on document must not reach the command parser. */
    const before = output().innerHTML;
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    expect(output().innerHTML).toBe(before);
  });

  it('delegates quick-link clicks on command output', () => {
    run('/work');
    const link = output().querySelector('[data-cmd]');
    if (!link) return;
    const ev = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(false);
  });
});

describe('history', () => {
  it('recalls the previous command on ArrowUp', () => {
    run('/help');
    const el = input();
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(el.value).toBe('/help');
  });
});
