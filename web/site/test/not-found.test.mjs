// W43 and W68: the not-found pages (Meridian 2.6.0's shared 404.html, both languages in each file, the page's own first). Cloudflare serves the nearest 404.html for an unknown address, at any depth, so every
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

test('both languages have a not-found page with a title, one sentence and one link home per language, as Meridian 404.html', () => {
  for (const [lang, html] of Object.entries(notFound)) {
    const other = lang === 'en' ? 'id' : 'en';
    const home = { en: '/', id: '/id/' };
    assert.match(html, new RegExp(`<html lang="${lang}" data-shape="pill">`));
    assert.equal(html.match(/<h1[\s>]/g).length, 1, `${lang}: one h1`);
    assert.match(html, /<main class="ef-notfound">/);
    assert.match(html, /class="ef-notfound__mark"/);
    const main = /<main[\s\S]*<\/main>/.exec(html)[0];
    assert.equal(main.match(/<a /g).length, 2, `${lang}: one link home in each of the two languages`);
    for (const l of [lang, other]) assert.ok(main.includes(`href="${home[l]}"`), `${lang}: link to ${l} home`);
    const order = [...main.matchAll(/<section class="ef-notfound__lang" lang="(\w+)"/g)].map((m) => m[1]);
    assert.deepEqual(order, [lang, other], `${lang}: its own language first, the other second`);
    assert.match(main, new RegExp(`<h1 class="ef-page-title" id="not-found-${lang}">`), `${lang}: the h1 is its own language`);
    assert.match(main, new RegExp(`<h2 class="ef-page-title" id="not-found-${other}">`), `${lang}: the other language is an h2`);
  }
});

test('the title follows the Page · Komando pattern and the page is kept out of search', () => {
  assert.match(notFound.en, /<title>Page not found · Halaman tidak ditemukan · Komando<\/title>/);
  assert.match(notFound.id, /<title>Halaman tidak ditemukan · Page not found · Komando<\/title>/);
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

test('the not-found pages hold one stylesheet, no script, no style and no em dash (a strict CSP renders them)', () => {
  for (const lang of Object.keys(pages)) {
    assert.equal(notFound[lang].match(/<link rel="stylesheet"/g).length, 1, `${lang}: one stylesheet`);
    assert.ok(!/<script/.test(notFound[lang]), `${lang}: script`);
    assert.ok(!/<style|\sstyle="/.test(notFound[lang]), `${lang}: inline style`);
    assert.ok(!notFound[lang].includes('—'), `${lang}: em dash`);
  }
});
