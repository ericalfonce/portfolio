import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';

/* terminal.js reads the DOM at import time and installs its listeners
   on load, so the markup is staged first and the module is imported
   once for the whole file. The ids below mirror index.html. */

const TERMINAL_MARKUP = `
  <div class="view view--home" data-view="home">
    <section class="term" id="terminal-section">
      <div class="terminal-wrapper" id="terminal-wrapper">
        <div class="terminal-window" id="terminal">
          <div class="titlebar">
            <div class="titlebar-controls">
              <button class="ctrl" id="btn-close"></button>
              <button class="ctrl" id="btn-min"></button>
              <button class="ctrl" id="btn-max"></button>
            </div>
            <div class="titlebar-title" id="titlebar-title">eric@portfolio:~$</div>
          </div>
          <div class="terminal-output" id="output" role="log"></div>
          <div class="terminal-input-row">
            <label for="cmd-input">eric@portfolio:~$</label>
            <div class="input-wrap">
              <input id="cmd-input" autocomplete="off" aria-autocomplete="list" aria-expanded="false" aria-controls="autocomplete" />
              <div class="autocomplete-dropdown" id="autocomplete" role="listbox"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
  <div id="exit-modal" hidden>
    <p id="exit-modal-title">Close terminal?</p>
    <button id="exit-cancel">Cancel</button>
    <button id="exit-confirm">Close</button>
  </div>
`;

let term;
const output = () => document.getElementById('output');
const input  = () => document.getElementById('cmd-input');

/** Type a command the way a visitor would and press Enter. */
function run(cmd) {
  const el = input();
  el.value = cmd;
  el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
}

beforeAll(async () => {
  document.body.innerHTML = TERMINAL_MARKUP;
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
  it('exports the hook main.js drives', () => {
    expect(typeof term.terminalReady).toBe('function');
  });

  it('imports without throwing and wires itself up on load', () => {
    expect(document.getElementById('titlebar-title').textContent).toBe('eric@portfolio:~$');
  });
});

describe('terminalReady', () => {
  it('prints a welcome block', () => {
    term.terminalReady();
    expect(output().textContent).toContain('Eric Alfonce');
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

  it('reports unknown commands rather than throwing', () => {
    expect(() => run('/definitely-not-a-command')).not.toThrow();
    expect(output().textContent.toLowerCase()).toContain('not found');
  });

  it('escapes command output instead of injecting it as HTML', () => {
    run('<img src=x onerror=alert(1)>');
    expect(output().querySelector('img')).toBeNull();
  });

  it('clears the buffer on /clear', () => {
    run('/help');
    expect(output().textContent.length).toBeGreaterThan(0);
    run('/clear');
    expect(output().textContent.trim()).toBe('');
  });
});

describe('commands reflect the verified data', () => {
  it('renders /projects from the real project list', () => {
    run('/projects');
    const text = output().textContent;
    expect(text).toContain('MulikaScans');
    expect(text).toContain('Lab Logbook');
    /* Dropped in the rewrite because the repositories do not exist. */
    expect(text).not.toContain('IMEI Guard');
  });

  it('renders /work as a case-study index', () => {
    run('/work');
    expect(output().querySelector('a[href="/work/mulikascans"]')).not.toBeNull();
  });

  it('renders /skills as plain grouped text with no percentages', () => {
    run('/skills');
    const text = output().textContent;
    expect(text).toContain('PostgreSQL');
    expect(text).not.toMatch(/\d+%/);
  });

  it('shows the real contact links', () => {
    run('/contact');
    const text = output().textContent;
    expect(text).toContain('github.com/ericalfonce');
    expect(text).toContain('in/ericalfonce');
  });

  it('makes no unverifiable claims anywhere', () => {
    for (const cmd of ['/about', '/help', '/projects', '/work', '/skills', '/contact', 'cat readme.md']) {
      run(cmd);
      const text = output().textContent;
      for (const claim of [/certified/i, /OSCP/, /CEH/, /in progress/i, /open to (work|opportunit)/i, /\d+%/]) {
        expect(text, `${cmd} matched ${claim}`).not.toMatch(claim);
      }
    }
  });
});

describe('autocomplete', () => {
  it('suggests matching commands and completes with Tab', () => {
    const el = input();
    el.value = '/wor';
    el.dispatchEvent(new Event('input', { bubbles: true }));

    const drop = document.getElementById('autocomplete');
    expect(drop.classList.contains('visible')).toBe(true);
    expect(el.getAttribute('aria-expanded')).toBe('true');

    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(el.value).toBe('/work');
  });

  it('hides when the value is cleared', () => {
    const el = input();
    el.value = '/wor';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.value = '';
    el.dispatchEvent(new Event('input', { bubbles: true }));

    const drop = document.getElementById('autocomplete');
    expect(drop.classList.contains('visible')).toBe(false);
  });
});

describe('titlebar controls', () => {
  it('minimizes and restores', () => {
    const win = document.getElementById('terminal');
    document.getElementById('btn-min').click();
    expect(win.classList.contains('minimized')).toBe(true);
    document.getElementById('btn-min').click();
    expect(win.classList.contains('minimized')).toBe(false);
  });

  it('maximizes and toggles the body scroll lock', () => {
    document.getElementById('btn-max').click();
    expect(document.getElementById('terminal').classList.contains('maximized')).toBe(true);
    expect(document.body.classList.contains('term-is-maximized')).toBe(true);

    document.getElementById('btn-max').click();
    expect(document.body.classList.contains('term-is-maximized')).toBe(false);
  });

  it('asks before closing, then clears the buffer', () => {
    run('/help');
    expect(output().textContent).not.toBe('');

    const modal = document.getElementById('exit-modal');
    document.getElementById('btn-close').click();
    expect(modal.hidden).toBe(false);

    document.getElementById('exit-cancel').click();
    expect(modal.hidden).toBe(true);
    expect(output().textContent).not.toBe('');

    document.getElementById('btn-close').click();
    document.getElementById('exit-confirm').click();
    expect(output().textContent.trim()).toBe('');
  });
});

describe('event scoping', () => {
  it('clicking the terminal focuses its input', () => {
    const spy = vi.spyOn(input(), 'focus');
    document.getElementById('terminal')
      .dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    /* focus is deferred to the next task so mousedown never fights the
       browser's own focus handling. */
    return new Promise((r) => setTimeout(r, 0)).then(() => {
      expect(spy).toHaveBeenCalled();
    });
  });

  it('does not hijack typing outside the terminal', () => {
    run('/help');
    const before = output().innerHTML;
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    expect(output().innerHTML).toBe(before);
  });

  it('delegates quick-link clicks on command output', () => {
    term.terminalReady();
    const link = output().querySelector('[data-cmd]');
    expect(link).not.toBeNull();
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(output().textContent.toLowerCase()).toContain('about');
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
