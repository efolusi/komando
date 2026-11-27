// W44, W42 and W52: Meridian 2.5.2 does the pill shape, the page title, the link underline (also in li and td), the 16 px phone
// fields and the forced-colors focus, so the site draws none of them. The drawn Komando screens (.kmd) keep the
// apps' own pill.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(SITE, rel), 'utf8');
const GENERATORS = ['build.mjs', 'content/drafts/render.mjs', 'guide/build.py', '../../scripts/docsgen/main.go'];
// the site's own CSS without the drawn app screens, which are the apps' design
const ownCss = ['assets/site.css', 'guide/guide.css', 'docs/docs.css'].map(read).join('\n')
  .split('\n').filter((line) => !/\.kmd|\.kfrag|\.khosts|\.k-|\.app\b|\.ks\b/.test(line)).join('\n');

function pagesIn(dir, out = []) {
  for (const name of readdirSync(join(SITE, dir))) {
    if (['node_modules', 'assets', 'content', '_shell', 'test', 'i18n', 'glyphs', 'brand'].includes(name)) continue;
    const rel = join(dir, name);
    if (statSync(join(SITE, rel)).isDirectory()) pagesIn(rel, out);
    else if (name.endsWith('.html')) out.push(rel);
  }
  return out;
}
const pages = pagesIn('.');

test('the package is pinned to exactly 2.5.2 and only that version is excluded from the release age', () => {
  assert.equal(JSON.parse(read('package.json')).dependencies['@efolusi/meridian'], '2.5.2');
  assert.match(read('pnpm-workspace.yaml'), /^minimumReleaseAgeExclude:\n {2}- '@efolusi\/meridian@2\.5\.2'\n$/);
});

test('every generator and every committed page sets data-shape="pill" on the html element', () => {
  for (const g of GENERATORS) assert.match(read(g), /<html lang="[^"]+" data-shape="pill">/, g);
  assert.ok(pages.length > 100, `${pages.length} pages found`);
  for (const rel of pages) assert.match(read(rel), /^<!doctype html>\n<html lang="[a-z]+" data-shape="pill">/, rel);
});

test('the site draws no pill, no ember token, no link underline, no forced-colors focus and no 16 px phone rule', () => {
  assert.doesNotMatch(ownCss, /--ember-/, 'ember tokens are removed in 2.5.0');
  assert.doesNotMatch(ownCss, /radius-full|999px/, 'the pill shape is data-shape="pill"');
  // the breadcrumb and the contents list are navigation lists, not running text, so they underline their links themselves;
  // Meridian underlines classless links in p, li, td, dd, blockquote, figcaption, caption and label
  const underlined = ownCss.split('\n').filter((l) => /text-decoration:\s*underline/.test(l) && !/^\.g-(crumbs|toc) /.test(l));
  assert.deepEqual(underlined, [], 'links in running text are underlined by Meridian');
  assert.doesNotMatch(ownCss, /forced-colors/, 'one focus rule in Meridian base.css');
  assert.doesNotMatch(ownCss, /(input|textarea|select)[^{}]*\{[^}]*font-size/, 'text controls are 16 px at phone width in Meridian');
  assert.doesNotMatch(ownCss, /\.g-article h1/, 'the page title is .ef-page-title');
});

test('no page or generator uses a hand-rolled pill, chip or link class', () => {
  for (const rel of [...pages, ...GENERATORS, 'content/home.en.mjs', 'content/home.id.mjs']) {
    assert.doesNotMatch(read(rel), /\b(g-pill|site-chip|site-link)\b/, rel);
  }
});

test('the guide and docs page titles are .ef-page-title, one per page, and the home page keeps the Hero title', () => {
  for (const rel of pages.filter((p) => /(^|\/)(guide|docs)\//.test(p))) {
    const h1s = read(rel).match(/<h1[^>]*>/g) || [];
    assert.deepEqual(h1s, ['<h1 class="ef-page-title">'], rel);
  }
  assert.doesNotMatch(read('index.html'), /ef-page-title/);
});

test('a "Coming" marker is a Meridian warning Badge and an agent name is a Meridian Tag', () => {
  assert.match(read('guide/index.html'), /class="ef-badge ef-badge--warning"/);
  assert.match(read('index.html'), /<li><span class="ef-tag"><img /);
});

test('a link in a list item or table cell of the page text has no site rule; Meridian underlines it', () => {
  assert.doesNotMatch(read('guide/guide.css'), /\.g-body (li|td) a/);
});

test('the side navigation sits in a nav element and has no site rule; Meridian 2.5.2 keeps classless links in a nav plain', () => {
  assert.doesNotMatch(read('guide/guide.css'), /\.g-side li a/);
  assert.doesNotMatch(read('guide/guide.css'), /\n\.g-side a \{[^}]*text-decoration/, 'the home link in a paragraph stays underlined');
  assert.match(read('guide/build.py'), /<nav class="g-side"/);
});
