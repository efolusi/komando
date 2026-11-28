// W67 and W68: Meridian 2.6.0 draws the theme toggle (no border at rest, one size with the menu button,
// hover fill only where a pointer can hover, MD132) and the language switch (MD112), so the site layer has no block for them.
// What stays: Meridian's focus ring is not removed, and the site layer sizes none of the header controls.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(SITE, rel), 'utf8');
const SITE_CSS = read('assets/site.css');
const MERIDIAN_CSS = read('assets/meridian/components.css');

/** The declarations of every top-level rule whose selector is exactly `selector`, outside any @media block. */
function declarations(css, selector) {
  const flat = css.replace(/@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');
  const escaped = selector.replace(/[.[\]()]/g, '\\$&');
  return [...flat.matchAll(new RegExp(`(?:^|[}\\n])\\s*${escaped}\\s*\\{([^}]*)\\}`, 'g'))].map((m) => m[1]).join(';');
}

test('the toggle keeps Meridian focus ring: no outline or box-shadow is removed', () => {
  assert.match(declarations(MERIDIAN_CSS, '.ef-theme-toggle:focus-visible'), /box-shadow:\s*var\(--focus-ring\)/);
  const own = SITE_CSS.split('\n').filter((line) => line.includes('.ef-theme-toggle')).join('\n');
  assert.doesNotMatch(own, /outline\s*:\s*none|box-shadow\s*:\s*none/);
});

test('the toggle, the menu button and the language switch take their size from Meridian, none from the site layer', () => {
  const size = /width:\s*var\(--control-h-md\);\s*height:\s*var\(--control-h-md\)/; // 36 px at a fine pointer, 44 px at a coarse one
  assert.match(declarations(MERIDIAN_CSS, '.ef-theme-toggle'), size);
  assert.match(declarations(MERIDIAN_CSS, '.ef-site-header__menu'), size);
  assert.match(declarations(MERIDIAN_CSS, '.ef-language-switch__item'), /min-width:\s*var\(--control-h-md\)/);
  assert.doesNotMatch(SITE_CSS, /ef-theme-toggle|ef-language-switch|ef-site-header__menu/, 'the site layer must not size or restyle the header controls');
});
