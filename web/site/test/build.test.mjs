// What web/site/build.mjs renders: the home page and the shell the guide and the docs read.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { themeInitScript } from '@efolusi/meridian/marketing/ThemeToggle.js';
import { renderHome, renderShell } from '../build.mjs';

const home = renderHome();
const shell = renderShell();

test('the theme init script is inline in the head, before any stylesheet', () => {
  const head = home.slice(0, home.indexOf('</head>'));
  const script = head.indexOf(`<script>${themeInitScript()}</script>`);
  assert.ok(script > 0, 'themeInitScript missing from <head>');
  assert.ok(script < head.indexOf('<link rel="stylesheet"'), 'the init script must run before the first stylesheet');
});

test('nothing loads from another origin', () => {
  for (const page of [home, shell.head, shell.header, shell.footer]) {
    assert.doesNotMatch(page, /<(?:script|link)[^>]+(?:src|href)="(?:https?:)?\/\/(?!komando\.efolusi\.com)/);
  }
});

test('the page uses Meridian, not the old kit', () => {
  assert.match(home, /assets\/meridian\/styles\.css/);
  assert.doesNotMatch(home, /system\.(?:css|js)|assets\/(?:moments|diagrams|backgrounds|layout|ui|motion)\//);
});

test('every in-page link has its target', () => {
  const ids = new Set([...home.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  for (const [, id] of home.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.has(id), `#${id} has no target`);
});

test('ids are unique', () => {
  const ids = [...home.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(ids.filter((id, i) => ids.indexOf(id) !== i), []);
});

test('no em dash in the copy', () => {
  assert.ok(!home.includes('—') && !shell.header.includes('—') && !shell.footer.includes('—'));
});

test('one h1, a main landmark and the skip link target', () => {
  assert.equal(home.match(/<h1[\s>]/g).length, 1);
  assert.match(home, /<main id="top"/);
  assert.match(home, /class="ef-skip" href="#top"|href="#top" class="ef-skip"/);
});

test('the release is still written in by set_release.py', () => {
  assert.ok((home.match(/data-release/g) || []).length >= 5);
  assert.match(home, /data-install-sha/);
});

test('the shell partials carry the root and the current-page markers the builders replace', () => {
  assert.match(shell.head, /href="\{\{root\}\}assets\/meridian\/styles\.css"/);
  assert.match(shell.header, /data-nav="guide"/);
  assert.match(shell.header, /data-nav="docs"/);
  assert.match(shell.footer, /src="\{\{root\}\}assets\/site\.js"/);
  assert.ok(shell.head.includes(themeInitScript()));
});
