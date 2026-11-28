// W67: the theme toggle is a Meridian 2.5.2 plain button that sets no border and no background, so the browser draws its
// grey, outset default. The site layer clears it until Meridian 2.6.0 (MD132) does.
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

/** The declarations of `selector` inside the @media block whose query is exactly `query`. */
function inMedia(css, query, selector) {
  const escapedQuery = query.replace(/[().:]/g, '\\$&');
  const block = css.match(new RegExp(`@media\\s*${escapedQuery}\\s*\\{((?:[^{}]*\\{[^{}]*\\})*)\\s*\\}`));
  return block ? declarations(block[1], selector) : '';
}

test('at rest the toggle has no border and a transparent background', () => {
  const rest = declarations(SITE_CSS, '.ef-theme-toggle');
  assert.match(rest, /border:\s*0\b/);
  assert.match(rest, /background:\s*transparent/);
});

test('the fill on hover only comes with a mouse; a tap leaves nothing behind', () => {
  const hoverAnywhere = declarations(SITE_CSS, '.ef-theme-toggle:hover');
  assert.match(hoverAnywhere, /background:\s*transparent/, 'Meridian 2.5.2 fills on every :hover; touch must stay clear');
  assert.match(inMedia(SITE_CSS, '(hover: hover)', '.ef-theme-toggle:hover'), /background:\s*var\(--surface-sunken\)/);
});

test('the toggle keeps Meridian focus ring: no outline or box-shadow is removed', () => {
  assert.match(declarations(MERIDIAN_CSS, '.ef-theme-toggle:focus-visible'), /box-shadow:\s*var\(--focus-ring\)/);
  const own = SITE_CSS.split('\n').filter((line) => line.includes('.ef-theme-toggle')).join('\n');
  assert.doesNotMatch(own, /outline\s*:\s*none|box-shadow\s*:\s*none/);
});

test('the toggle is the size of the language link and the menu button: all three take the touch minimum', () => {
  const size = /width:\s*var\(--tap-min\);\s*height:\s*var\(--tap-min\)/;
  assert.match(declarations(MERIDIAN_CSS, '.ef-theme-toggle'), size);
  assert.match(declarations(MERIDIAN_CSS, '.ef-site-header__menu'), size);
  assert.match(declarations(MERIDIAN_CSS, '.ef-site-header__link'), /min-height:\s*var\(--tap-min\)/);
  assert.match(declarations(SITE_CSS, '.ef-site-header__link[hreflang]'), /min-width:\s*var\(--tap-min\)/);
  assert.doesNotMatch(declarations(SITE_CSS, '.ef-theme-toggle'), /\b(width|height)\s*:/, 'the site layer must not size it apart');
});

test('the override names what removes it', () => {
  assert.match(SITE_CSS, /until Meridian 2\.6\.0 \(MD132\)/);
});
