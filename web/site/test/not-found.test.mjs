// W43: the not-found pages. Cloudflare serves the nearest 404.html for an unknown address, at any depth, so every
// address in the page is from the site's root, and a search engine is told to leave it out.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pages = { en: 'index.html', id: 'id/index.html' };
const read = (rel) => readFileSync(join(SITE, rel), 'utf8');
const notFound = { en: read('404.html'), id: read('id/404.html') };

test('both languages have a not-found page with a title, one sentence and two links, home and docs', () => {
  for (const [lang, html] of Object.entries(notFound)) {
    assert.match(html, new RegExp(`<html lang="${lang}" data-shape="pill">`));
    assert.equal(html.match(/<h1[\s>]/g).length, 1, `${lang}: one h1`);
    const main = /<main[\s\S]*<\/main>/.exec(html)[0];
    assert.equal(main.match(/<a /g).length, 2, `${lang}: two links in the page body`);
    const prefix = lang === 'en' ? '/' : '/id/';
    assert.ok(main.includes(`href="${prefix}"`), `${lang}: link to home`);
    assert.ok(main.includes(`href="${prefix}docs/"`), `${lang}: link to docs`);
  }
});

test('the title follows the Page · Komando pattern and the page is kept out of search', () => {
  assert.match(notFound.en, /<title>Page not found · Komando<\/title>/);
  assert.match(notFound.id, /<title>Halaman tidak ditemukan · Komando<\/title>/);
  for (const html of Object.values(notFound)) {
    assert.match(html, /<meta name="robots" content="noindex">/);
    assert.ok(!html.includes('rel="canonical"'), 'a not-found page has no canonical address');
    assert.ok(!html.includes('hreflang="x-default"'), 'and no language alternates in its head');
  }
});

test('every local address in a not-found page starts at the root, so it works at any depth', () => {
  for (const [lang, html] of Object.entries(notFound)) {
    for (const [, attr, value] of html.matchAll(/\s(href|src)="([^"]*)"/g)) {
      if (/^(https?:|mailto:|#)/.test(value)) continue;
      assert.ok(value.startsWith('/'), `${lang}: ${attr}="${value}" is relative`);
      const file = value.split('#')[0];
      if (file !== '/' && !file.endsWith('/')) assert.ok(existsSync(join(SITE, file)), `${lang}: ${value} does not exist`);
    }
  }
});

test('the not-found pages carry the same header and footer as the home pages, and no inline script or style', () => {
  for (const [lang, rel] of Object.entries(pages)) {
    const home = read(rel);
    for (const part of ['site-header', 'site-footer']) {
      assert.ok(home.includes(`data-slot="${part}"`) && notFound[lang].includes(`data-slot="${part}"`), `${lang}: ${part}`);
    }
    assert.ok(!/<script(?![^>]*\ssrc=)[^>]*>/.test(notFound[lang]), `${lang}: inline script`);
    assert.ok(!/<style|\sstyle="/.test(notFound[lang]), `${lang}: inline style`);
    assert.ok(!notFound[lang].includes('—'), `${lang}: em dash`);
  }
});
