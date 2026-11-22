// Meridian's theme-init.js, run against a stubbed browser: whatever the operating system prefers, the theme
// the reader chose is the one data-theme holds, and the attribute is always light or dark.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const INIT = readFileSync(join(dirname(createRequire(import.meta.url).resolve('@efolusi/meridian/package.json')), 'browser', 'theme-init.js'), 'utf8');

/** Runs the init script with the stored choice, the cookie and the OS preference; returns the page it ran on. */
function run({ stored = null, cookie = '', osDark = false, blocked = false, hostname = 'komando.efolusi.com' }) {
  const page = { attributes: {}, cookie };
  const document = {
    documentElement: {
      setAttribute: (name, value) => { page.attributes[name] = value; },
      removeAttribute: (name) => { delete page.attributes[name]; },
    },
    get cookie() { return page.cookie; },
    set cookie(value) { page.written = value; },
  };
  const localStorage = { getItem() { if (blocked) throw new Error('blocked'); return stored; }, removeItem() { page.removed = true; } };
  const matchMedia = (query) => ({ matches: osDark && query === '(prefers-color-scheme: dark)' });
  vm.runInNewContext(INIT, { window: { matchMedia }, matchMedia, document, localStorage, location: { hostname, protocol: 'https:' } });
  return page;
}

test('Light stays light on a dark operating system', () => {
  assert.equal(run({ stored: 'light', osDark: true }).attributes['data-theme'], 'light');
});

test('Dark stays dark on a light operating system', () => {
  assert.equal(run({ stored: 'dark', osDark: false }).attributes['data-theme'], 'dark');
});

test('System follows the operating system, in both directions', () => {
  assert.equal(run({ stored: 'system', osDark: true }).attributes['data-theme'], 'dark');
  assert.equal(run({ stored: 'system', osDark: false }).attributes['data-theme'], 'light');
});

test('with no saved choice the cookie of another Efolusi site decides, then the operating system', () => {
  assert.equal(run({ cookie: 'efolusi_theme=light', osDark: true }).attributes['data-theme'], 'light');
  assert.equal(run({ cookie: 'efolusi_theme=dark', osDark: false }).attributes['data-theme'], 'dark');
  assert.equal(run({ osDark: true }).attributes['data-theme'], 'dark');
  assert.equal(run({ osDark: false }).attributes['data-theme'], 'light');
});

test('blocked storage falls back to the cookie and still sets the attribute', () => {
  assert.equal(run({ blocked: true, cookie: 'efolusi_theme=dark' }).attributes['data-theme'], 'dark');
  assert.equal(run({ blocked: true }).attributes['data-theme'], 'light');
});

test('data-theme is light or dark for every input, and the script never removes it', () => {
  for (const stored of [null, 'light', 'dark', 'system', 'nonsense']) {
    for (const osDark of [true, false]) {
      assert.match(run({ stored, osDark }).attributes['data-theme'], /^(light|dark)$/, `${stored} on ${osDark ? 'dark' : 'light'}`);
    }
  }
  assert.doesNotMatch(INIT, /removeAttribute/);
});

test('a stored "system" from before is removed once, and the device theme decides', () => {
  const page = run({ stored: 'system', osDark: true });
  assert.equal(page.removed, true);
  assert.equal(page.attributes['data-theme'], 'dark');
  assert.equal(page.written, undefined, 'the script no longer writes a cookie');
  assert.equal(run({ stored: 'light', osDark: true }).removed, undefined);
});
