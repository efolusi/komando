// The draft pages of row W28 (content/drafts/): switched off, honest about the unreleased Mac app, same shape in both languages.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONFIG, PAGES, downloadBlocks, renderDraft } from '../content/drafts/render.mjs';
import * as en from '../content/drafts/copy.en.mjs';
import * as id from '../content/drafts/copy.id.mjs';

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const COPY = { en, id };
const shell = Object.fromEntries(['head', 'header', 'footer'].map((n) => [n, `<!--${n}-->`]));
const kinds = (blocks) => blocks.map((b) => (typeof b === 'string' ? 'p' : Object.keys(b)[0]));
const blocksOf = (c, page) => (page === 'download' ? downloadBlocks(c, CONFIG) : c[page].blocks);

test('the drafts are switched off and name no version or checksum while the Mac app is unreleased', () => {
  assert.equal(CONFIG.switchedOn, false);
  assert.equal(CONFIG.macApp.released, false);
  assert.equal(CONFIG.macApp.version, null);
  assert.equal(CONFIG.macApp.sha256, null);
  assert.match(CONFIG.downloadHost, /\.invalid$/);
});

test('the unreleased download page says so, links no download and shows no checksum', () => {
  for (const lang of ['en', 'id']) {
    const html = renderDraft(lang, 'download', CONFIG, shell);
    assert.match(html, /not released yet|belum dirilis/);
    assert.doesNotMatch(html, /download\.invalid/);
    assert.doesNotMatch(html, /shasum|[0-9a-f]{64}/);
    assert.match(html, /name="robots" content="noindex, nofollow"/);
    assert.match(html, /class="draft-banner"/);
  }
});

test('a released state shows the version, the checksum, the check and the download link', () => {
  const live = { ...CONFIG, downloadHost: 'download.example.org', macApp: { released: true, version: 'v1.2.3', sha256: 'c'.repeat(64), releaseNotesUrl: 'https://example.org/notes' } };
  const html = renderDraft('en', 'download', live, shell);
  assert.match(html, /Komando v1\.2\.3 for Mac/);
  assert.match(html, /href="https:\/\/download\.example\.org\/updates\/mac\/stable\/Komando-v1\.2\.3\.zip"/);
  assert.match(html, /c{64}/);
  assert.match(html, /shasum -a 256 Komando-v1\.2\.3\.zip/);
  assert.match(html, /https:\/\/example\.org\/notes/);
});

test('the update note says HTTPS and a signature check, and the feed path is the one constant', () => {
  const html = renderDraft('en', 'download', CONFIG, shell);
  assert.match(html, /over HTTPS and verifies a signature before it installs/);
  assert.ok(html.includes(CONFIG.feedPath));
});

test('English and Indonesian have the same blocks in the same order, page by page', () => {
  for (const page of PAGES) assert.deepEqual(kinds(blocksOf(id, page)), kinds(blocksOf(en, page)), page);
});

test('pricing: no price, the free list word for word, the sync note and the free path', () => {
  const text = JSON.stringify(en.pricing);
  assert.doesNotMatch(text, /\$\s?\d|Rp\s?\d|USD|per month|per year/);
  assert.match(text, /The CLI has no paid features and never will\./);
  assert.match(text, /Linux and Windows/);
  assert.match(text, /export --sealed/);
  const free = en.pricing.blocks.find((b) => b.ul?.[0]?.startsWith('Everything the CLI does today')).ul;
  assert.equal(free.length, 11);
});

test('no em or en dash, and no page is linked from the navigation or the home pages', () => {
  for (const [lang, c] of Object.entries(COPY)) assert.doesNotMatch(JSON.stringify(c), /[—–]/, lang);
  for (const f of ['content/home.en.mjs', 'content/home.id.mjs', '_shell/en/header.html', '_shell/id/header.html']) {
    assert.doesNotMatch(readFileSync(join(SITE, f), 'utf8'), /drafts/, f);
  }
});

test('the open points show on the page', () => {
  for (const page of ['privacy', 'support', 'pricing']) assert.match(renderDraft('en', page, CONFIG, shell), /class="draft-todo"/, page);
});
