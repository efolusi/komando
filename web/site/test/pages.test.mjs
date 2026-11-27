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

// A style attribute needs 'unsafe-inline' in the CSP's style-src. The drawn app screens take their colours from classes in assets/site.css.
const STYLE_ATTR = /<[a-z][^>]*\sstyle\s*=/i;

test('no built page carries a style attribute', () => {
  assert.ok(pages.length > 0, 'no built pages found');
  for (const p of pages) {
    const hit = STYLE_ATTR.exec(p.html);
    assert.ok(!hit, `${p.rel} has a style attribute: ${hit?.[0].slice(0, 120)}`);
  }
});

test('no drawn screen source carries a style attribute', () => {
  const dir = join(SITE, 'content', 'screens');
  for (const f of readdirSync(dir)) {
    const hit = STYLE_ATTR.exec(readFileSync(join(dir, f), 'utf8'));
    assert.ok(!hit, `content/screens/${f} has a style attribute: ${hit?.[0].slice(0, 120)}`);
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

// Breadcrumbs: "Docs > Apps > Page" on the guide, "Docs > Group > Page" on the docs; the docs home and the home page have none.
const decode = (s) => s.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#34;|&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const crumbNavs = (html) => [...html.matchAll(/<nav class="g-crumbs"[^>]*>.*?<\/nav>/gs)].map((m) => m[0]);
const trailPages = pages.filter((p) => /^(id\/)?(guide|docs)\//.test(p.rel) && p.rel !== 'docs/index.html' && p.rel !== 'id/docs/index.html');

test('every guide and docs page has one breadcrumb nav, named in its language, with an ordered list', () => {
  assert.ok(trailPages.length > 100, `only ${trailPages.length} pages walked`);
  for (const p of trailPages) {
    const navs = crumbNavs(p.html);
    assert.equal(navs.length, 1, `${p.rel}: ${navs.length} breadcrumb navs`);
    assert.ok(navs[0].includes(`aria-label="${p.id ? 'Jejak navigasi' : 'Breadcrumb'}"`), `${p.rel}: label`);
    assert.match(navs[0], /^<nav [^>]*><ol>.*<\/ol><\/nav>$/s, `${p.rel}: not an ol in a nav`);
  }
});

test('the last breadcrumb item is the page itself, as text with aria-current, and the others are links', () => {
  for (const p of trailPages) {
    const items = [...crumbNavs(p.html)[0].matchAll(/<li( aria-current="page")?>(.*?)<\/li>/gs)];
    assert.ok(items.length >= 2, `${p.rel}: ${items.length} items`);
    items.forEach((m, i) => {
      const last = i === items.length - 1;
      assert.equal(Boolean(m[1]), last, `${p.rel}: aria-current on item ${i + 1} of ${items.length}`);
      assert.equal(/^<a href="[^"]+">[^<]+<\/a>$/.test(m[2]), !last, `${p.rel}: item ${i + 1} ${last ? 'must be text' : 'must be a link'}`);
    });
    const h1 = decode(/<h1[^>]*>(.*?)<\/h1>/s.exec(p.html)[1]);
    // the Apps landing is "Apps" in the trail and "Komando apps" as its h1
    const current = p.english === 'guide/index.html' ? (p.id ? 'Aplikasi' : 'Apps') : h1;
    assert.equal(decode(items.at(-1)[2]), current, `${p.rel}: the current item is not the page`);
  }
});

test('the trail is as deep as the page: guide home 2, a guide page 3, a docs page 3, and the first item is the docs home', () => {
  for (const p of trailPages) {
    const hrefs = [...crumbNavs(p.html)[0].matchAll(/<li><a href="([^"]+)">/g)].map((m) => m[1]);
    const total = hrefs.length + 1;
    const guideHome = p.english === 'guide/index.html';
    assert.equal(total, guideHome ? 2 : 3, `${p.rel}: ${total} items`);
    assert.ok(exists(p, hrefs[0]) && resolve(dirname(p.path), hrefs[0]) === join(SITE, p.id ? 'id/docs' : 'docs'), `${p.rel}: the first item is not the docs home`);
    if (p.english.startsWith('guide/') && !guideHome) {
      assert.equal(resolve(dirname(p.path), hrefs[1]), dirname(join(SITE, p.id ? 'id' : '', 'guide', 'x', 'index.html')).replace(/\/x$/, ''), `${p.rel}: the second item is not the Apps landing`);
    }
    if (p.english.startsWith('docs/')) {
      const [file, frag] = hrefs[1].split('#');
      const home = pages.find((x) => x.rel === (p.id ? 'id/docs/index.html' : 'docs/index.html'));
      assert.equal(resolve(dirname(p.path), file), dirname(home.path), `${p.rel}: the group links to the docs home`);
      assert.ok(home.html.includes(`<section class="g-group" id="${frag}">`), `${p.rel}: the group anchor #${frag} is not on the docs home`);
    }
  }
});

test('the home pages and the docs home have no breadcrumb', () => {
  for (const rel of ['index.html', 'id/index.html', 'docs/index.html', 'id/docs/index.html']) {
    assert.equal(crumbNavs(pages.find((p) => p.rel === rel).html).length, 0, rel);
  }
});
