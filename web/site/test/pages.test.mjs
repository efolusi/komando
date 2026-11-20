// The committed pages of all three builders (build.mjs, guide/build.py, scripts/docsgen), English and Indonesian:
// language, canonical, hreflang, the language switch and the same anchors in both languages.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://komando.efolusi.com/';
const SKIP = new Set(['node_modules', 'assets', 'content', '_shell', 'test', 'i18n', 'glyphs']);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (name === 'index.html') out.push(path);
  }
  return out;
}

const pages = walk(SITE).map((path) => {
  const rel = relative(SITE, path);
  const html = readFileSync(path, 'utf8');
  return { rel, path, html, id: rel.startsWith('id/'), english: rel.replace(/^id\//, '') };
});
const url = (rel) => ORIGIN + rel.replace(/index\.html$/, '');
const alternates = (html) => Object.fromEntries([...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)].map((m) => [m[1], m[2]]));
const switches = (html, hreflang) => [...html.matchAll(new RegExp(`<a [^>]*hreflang="${hreflang}"[^>]*>`, 'g'))].map((m) => /href="([^"]*)"/.exec(m[0])[1]);
const exists = (page, href) => {
  const dest = resolve(dirname(page.path), href.split('#')[0]);
  return existsSync(dest.endsWith('.html') ? dest : join(dest, 'index.html'));
};
const headingIds = (html) => [...html.matchAll(/<h[234] id="([^"]+)"/g)].map((m) => m[1]);

test('every guide source with an Indonesian twin has an Indonesian page, and so has the home page', () => {
  const rels = new Set(pages.map((p) => p.rel));
  assert.ok(rels.has('id/index.html'));
  for (const dir of ['guide', 'docs']) {
    const src = join(SITE, dir, 'src');
    for (const f of readdirSync(src).filter((n) => n.endsWith('.id.md'))) {
      assert.ok(rels.has(`id/${dir}/${f.replace('.id.md', '')}/index.html`), `${dir}/${f} has no page under /id/`);
    }
    assert.ok(rels.has(`id/${dir}/index.html`), `id/${dir}/index.html is missing`);
  }
  assert.ok(rels.has('id/guide/coming/index.html'));
});

test('an Indonesian page is lang id and an English page is lang en', () => {
  for (const p of pages) assert.match(p.html, new RegExp(`^<!doctype html>\\n<html lang="${p.id ? 'id' : 'en'}">`), p.rel);
});

test('every page names its own address as canonical', () => {
  for (const p of pages) assert.match(p.html, new RegExp(`<link rel="canonical" href="${url(p.rel)}">`), p.rel);
});

test('hreflang: en, x-default on the English page, and id when the page has a twin', () => {
  for (const p of pages) {
    const alt = alternates(p.html);
    const en = url(p.english);
    const hasTwin = p.id || existsSync(join(SITE, 'id', p.english));
    assert.equal(alt.en, en, `${p.rel} en`);
    assert.equal(alt['x-default'], en, `${p.rel} x-default`);
    if (hasTwin) assert.equal(alt.id, url(`id/${p.english}`), `${p.rel} id`);
    else assert.equal(alt.id, undefined, `${p.rel} must not name a twin it does not have`);
  }
});

test('the header and the footer each carry a language switch that goes somewhere', () => {
  for (const p of pages) {
    const to = p.id ? 'en' : 'id';
    const header = p.html.slice(p.html.indexOf('<header'), p.html.indexOf('</header>'));
    const footer = p.html.slice(p.html.indexOf('<footer'), p.html.indexOf('</footer>'));
    for (const [name, part] of [['header', header], ['footer', footer]]) {
      const links = switches(part, to);
      assert.ok(links.length >= 1, `${p.rel}: no ${to} switch in the ${name}`);
      for (const href of links) assert.ok(exists(p, href), `${p.rel}: the ${name} switch ${href} goes nowhere`);
    }
    const target = switches(footer, to)[0];
    if (p.id) assert.equal(resolve(dirname(p.path), target.split('#')[0]).replace(/\/$/, ''), resolve(SITE, dirname(p.english)).replace(/\/$/, ''), `${p.rel}: switch goes to its English page`);
    else if (existsSync(join(SITE, 'id', p.english))) assert.equal(resolve(dirname(p.path), target.split('#')[0]).replace(/\/$/, ''), resolve(SITE, 'id', dirname(p.english)).replace(/\/$/, ''), `${p.rel}: switch goes to its twin`);
  }
});

test('an Indonesian page keeps the anchors of its English page', () => {
  for (const p of pages.filter((x) => x.id)) {
    const en = pages.find((x) => x.rel === p.english);
    assert.ok(en, `${p.rel} has no English page`);
    assert.deepEqual(headingIds(p.html), headingIds(en.html), p.rel);
  }
});

test('one h1, unique ids, no em dash', () => {
  for (const p of pages) {
    assert.equal(p.html.match(/<h1[\s>]/g).length, 1, `${p.rel} h1`);
    const ids = [...p.html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(ids.filter((id, i) => ids.indexOf(id) !== i), [], `${p.rel} ids`);
    assert.ok(!p.html.includes('—'), `${p.rel} has an em dash`);
  }
});

test('an Indonesian page says nothing English about itself in its head', () => {
  for (const p of pages.filter((x) => x.id)) {
    const title = /<title>([^<]*)<\/title>/.exec(p.html)[1];
    assert.ok(!/ · Komando guide| · komando docs/.test(title), `${p.rel}: title ${title}`);
  }
});
