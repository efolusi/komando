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

const hasInlineScript = (html) => /<script(?![^>]*\ssrc=)[^>]*>/.test(html);

test('no page carries an inline script, so the CSP needs no hash, and the theme script is Meridian\'s file', () => {
  for (const p of pages) {
    assert.ok(!hasInlineScript(p.html), `${p.rel} has an inline script`);
    const root = '../'.repeat(p.rel.split('/').length - 1);
    assert.ok(p.html.includes(`<script src="${root}assets/meridian/browser/theme-init.js"></script>`), `${p.rel} does not load theme-init.js`);
    assert.ok(p.html.includes(`<script type="module" src="${root}assets/meridian/browser/marketing.js"></script>`), `${p.rel} does not load marketing.js`);
  }
});

test('nothing built or served removes data-theme or holds the old init script', () => {
  const served = [...pages.map((p) => [p.rel, p.html]),
    ...['assets/site.js', 'assets/meridian/browser/theme-init.js', 'assets/meridian/browser/theme.js', 'assets/meridian/browser/marketing.js']
      .map((f) => [f, readFileSync(join(SITE, f), 'utf8')])];
  for (const [name, text] of served) {
    assert.ok(!/removeAttribute\(\s*['"]data-theme['"]/.test(text), `${name} removes data-theme`);
    assert.ok(!text.includes("if(t==='dark')document.documentElement.setAttribute"), `${name} holds the init script of Meridian 1.26`);
  }
});

test('a missing data-theme is not treated as light anywhere in the site scripts and styles', () => {
  for (const f of ['assets/site.js', 'assets/site.css', 'guide/guide.css', 'docs/docs.css']) {
    const text = readFileSync(join(SITE, f), 'utf8');
    assert.ok(!/hasAttribute\(\s*['"]data-theme/.test(text) && !/:not\(\[data-theme/.test(text), `${f} reads a missing data-theme as light`);
  }
});

test('the docs home lists the agent skill page in Reference, after Settings and before the Glossary, in both languages', () => {
  for (const rel of ['docs/index.html', 'id/docs/index.html']) {
    const html = pages.find((p) => p.rel === rel).html;
    const section = /<section class="g-group" id="reference">(.*?)<\/section>/s.exec(html);
    assert.ok(section, `${rel} has no Reference group`);
    const slugs = [...section[1].matchAll(/<a class="g-card" href="([^"]+)\/">/g)].map((m) => m[1]);
    const at = slugs.indexOf('agent-skill');
    assert.ok(at > 0, `${rel}: agent-skill is not in Reference`);
    assert.equal(slugs[at - 1], 'settings', rel);
    assert.equal(slugs[at + 1], 'glossary', rel);
  }
});

test('the docs home lead and Getting started link the agent skill page, because the pinned install page cannot', () => {
  for (const rel of ['docs/index.html', 'id/docs/index.html', 'docs/getting-started/index.html', 'id/docs/getting-started/index.html']) {
    const html = pages.find((p) => p.rel === rel).html;
    const link = rel.endsWith('getting-started/index.html') ? '../agent-skill/' : 'agent-skill/';
    assert.ok(html.includes(`<a href="${link}">`), `${rel} does not link the agent skill page`);
  }
  const install = pages.find((p) => p.rel === 'docs/install/index.html').html;
  assert.ok(!/<div class="g-body">.*href="\.\.\/agent-skill\/".*<\/div><nav class="g-pager"/s.test(install), 'the install page text links agent-skill: its English source is pinned and must not change');
});
