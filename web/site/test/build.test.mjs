// What web/site/build.mjs renders: the home page and the shell the guide and the docs read.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { themeInitScript } from '@efolusi/meridian/marketing/ThemeToggle.js';
import { renderHome, renderShell } from '../build.mjs';
import * as en from '../content/home.en.mjs';
import * as id from '../content/home.id.mjs';

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

const idHome = renderHome(id);
const idShell = renderShell(id);
const sectionIds = (html) => [...html.matchAll(/<section[^>]*\sid="([^"]+)"/g)].map((m) => m[1]);

test('the Indonesian home page is lang id, its own canonical, with hreflang en, id and x-default', () => {
  assert.match(idHome, /^<!doctype html>\n<html lang="id">/);
  assert.match(idHome, /<link rel="canonical" href="https:\/\/komando\.efolusi\.com\/id\/">/);
  assert.match(idHome, /<link rel="alternate" hreflang="en" href="https:\/\/komando\.efolusi\.com\/">/);
  assert.match(idHome, /<link rel="alternate" hreflang="id" href="https:\/\/komando\.efolusi\.com\/id\/">/);
  assert.match(idHome, /<link rel="alternate" hreflang="x-default" href="https:\/\/komando\.efolusi\.com\/">/);
  assert.match(home, /<link rel="alternate" hreflang="id" href="https:\/\/komando\.efolusi\.com\/id\/">/);
});

test('both home pages have the same sections, the same ids and the same release', () => {
  assert.deepEqual(sectionIds(idHome), sectionIds(home));
  const ids = (html) => [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]).sort();
  assert.deepEqual(ids(idHome), ids(home));
  assert.equal(id.release, en.release);
  assert.equal(id.installSha, en.installSha);
  assert.equal((idHome.match(/data-release/g) || []).length, (home.match(/data-release/g) || []).length);
  assert.doesNotMatch(idHome, /\{release\}|\{\{/);
});

test('the Indonesian page keeps its root: assets and links resolve from /id/', () => {
  assert.match(idHome, /href="\.\.\/assets\/meridian\/styles\.css"/);
  assert.match(idHome, /src="\.\.\/assets\/icons\/claude-code\.svg"/);
  assert.match(idHome, /<script type="module" src="\.\.\/assets\/site\.js">/);
  assert.match(idHome, /href="\.\.\/id\/guide\/"/);
});

test('the language switch names the other language in that language and goes to the twin', () => {
  assert.match(home, /<a class="ef-site-header__link" href="id\/" hreflang="id" lang="id" aria-label="Baca halaman ini dalam bahasa Indonesia">Bahasa Indonesia<\/a>/);
  assert.match(idHome, /<a class="ef-site-header__link" href="\.\.\/" hreflang="en" lang="en" aria-label="Read this page in English">English<\/a>/);
  assert.match(idHome, /<a class="ef-site-footer__link" href="\.\.\/" hreflang="en" lang="en"/);
  assert.doesNotMatch(home + idHome, / hrefLang=/);
});

test('the shell leaves the switch and the root for the guide and docs builders', () => {
  for (const s of [shell, idShell]) {
    assert.match(s.header, /href="\{\{switch\}\}"/);
    assert.match(s.footer, /href="\{\{switch\}\}"/);
  }
  assert.match(idShell.header, /href="\{\{root\}\}id\/guide\/" data-nav="guide"/);
  assert.match(idShell.header, /href="\{\{root\}\}id\/docs\/" data-nav="docs"/);
  assert.match(idShell.header, /href="\{\{root\}\}id\/index\.html#inventory"/);
  assert.match(idShell.header, /<a href="#top" class="ef-skip">Langsung ke konten<\/a>/);
});

test('the drawn screens speak Indonesian only where home.id.mjs says so', () => {
  assert.match(idHome, /aria-label="Halaman Hosts Komando:/);
  assert.match(idHome, /<p class="khosts__group">Produksi<\/p>/);
  assert.match(idHome, /Belum ada yang bisa dibeli\./);
  assert.doesNotMatch(idHome, /Nothing to buy yet/);
  assert.match(home, /aria-label="Komando’s Hosts page:/);
  assert.match(home, /<p class="khosts__group">Production<\/p>/);
});

test('no em dash in the Indonesian copy', () => {
  assert.ok(!idHome.includes('—') && !idShell.header.includes('—') && !idShell.footer.includes('—'));
});
