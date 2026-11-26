// The draft pages of row W28 (content/drafts/): switched off, honest about the unreleased Mac app, same shape in both languages.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONFIG, PAGES, downloadBlocks, renderDraft } from '../content/drafts/render.mjs';
import * as en from '../content/drafts/copy.en.mjs';
import * as id from '../content/drafts/copy.id.mjs';

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const COPY = { en, id };
const shell = Object.fromEntries(['head', 'header', 'footer'].map((n) => [n, `<!--${n}-->`]));
const kinds = (blocks) => blocks.map((b) => (typeof b === 'string' ? 'p' : Object.keys(b)[0]));
const blocksOf = (c, page) => (page === 'download' ? downloadBlocks(c, CONFIG) : c[page].blocks);

test('the drafts are switched off, name no version or checksum while the apps are unreleased, and point at the product domain', () => {
  assert.equal(CONFIG.switchedOn, false);
  assert.equal(CONFIG.macApp.released, false);
  assert.equal(CONFIG.macApp.version, null);
  assert.equal(CONFIG.macApp.sha256, null);
  assert.equal(CONFIG.downloadHost, 'komando.efolusi.com');
  assert.equal(CONFIG.feedPath, '/updates/mac/{channel}/feed.json');
  assert.equal(CONFIG.archivePath, '/updates/mac/{channel}/Komando-{version}.zip');
});

test('the unreleased download page says only that the apps are built and in testing: no date, no link, no host, no checksum', () => {
  const said = { en: /built and in testing\. They cannot be downloaded until an Apple Developer account exists\./, id: /sudah dibuat dan sedang diuji\. Aplikasi ini belum bisa diunduh sampai akun Apple Developer tersedia\./ };
  for (const lang of ['en', 'id']) {
    const html = renderDraft(lang, 'download', CONFIG, shell);
    const main = html.slice(html.indexOf('<h1>'));
    assert.match(main, said[lang]);
    assert.doesNotMatch(main, /<a /, `${lang}: a link`);
    assert.doesNotMatch(main, /komando\.efolusi\.com|download\.invalid|https?:/);
    assert.doesNotMatch(main, /shasum|[0-9a-f]{64}|\bv\d+\.\d+|\b20\d\d\b|\d{4}-\d{2}/, `${lang}: a version, checksum or date`);
    assert.doesNotMatch(main, /draft-todo|TODO/, `${lang}: nothing else to say`);
    assert.equal((main.match(/<h2>/g) ?? []).length, 1, `${lang}: one heading, one statement`);
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

test('a released download page names the update feed over HTTPS with a signature check, and the paths are the config constants', () => {
  const live = { ...CONFIG, macApp: { released: true, version: 'v1.2.3', sha256: 'c'.repeat(64), releaseNotesUrl: null } };
  const html = renderDraft('en', 'download', live, shell);
  assert.match(html, /over HTTPS and verifies a signature before it installs/);
  assert.ok(html.includes(CONFIG.feedPath));
  assert.ok(html.includes(CONFIG.archivePath));
  assert.match(html, /href="https:\/\/komando\.efolusi\.com\/updates\/mac\/stable\/Komando-v1\.2\.3\.zip"/);
});

test('English and Indonesian have the same blocks in the same order, page by page', () => {
  for (const page of PAGES) assert.deepEqual(kinds(blocksOf(id, page)), kinds(blocksOf(en, page)), page);
});

// "What always stays free" of the plan note (plans.md), word for word, minus its three internal notes (U34).
const FREE_FOREVER = [
  'Everything the CLI does today and adds later. The CLI has no paid features and never will.',
  'Every Mac, iPhone and iPad screen that works on your own data, on one device or paired to your own komando host.',
  'Bring-your-own AI: your own key, your own endpoint, and the private on-device mode when it comes.',
  'Local safety: the approval window, the approval code, protected marks, dry runs, policy, masking, and the local audit log with `audit verify`.',
  'Moving your data yourself: import, export, export with secrets, the sealed phone export from Linux or Windows, Save a sealed copy, and a person-started LAN exchange.',
  'After a plan ends: your local data, and AI with your own key.',
  'Widgets, Live Activities, Shortcuts and local notifications, because they work on local data.',
  'Backing up and restoring your own data (Time Machine, a device backup, a new computer), and the last-known view when a host cannot be reached.',
  'Accessibility, any translated app text, and update channels (stable and beta).',
  'Support through GitHub issues and the docs, and security reports through SECURITY.md.',
  'No trial anywhere in the free apps, and no telemetry.',
];

test('pricing: no price, and the free list word for word in both languages (U34)', () => {
  const text = JSON.stringify(en.pricing);
  assert.doesNotMatch(text, /\$\s?\d|Rp\s?\d|USD|per month|per year/);
  const list = (c) => c.pricing.blocks.find((b) => b.ul && b.ul.length > 5).ul;
  assert.deepEqual(list(en), FREE_FOREVER);
  assert.equal(list(id).length, FREE_FOREVER.length);
});

test('pricing: before purchase, Linux and Windows CLI users cannot sync and the free path stays, in both languages (W27)', () => {
  const sync = { en: /command line on Linux and Windows is not a sync device/, id: /Baris perintah di Linux dan Windows bukan perangkat sinkronisasi/ };
  for (const [lang, c] of Object.entries(COPY)) {
    const blocks = c.pricing.blocks;
    const text = JSON.stringify(blocks);
    assert.match(text, sync[lang], lang);
    assert.ok(text.includes('komando export --sealed --to move.kmdseal'), lang);
    assert.ok(text.includes('komando import komando move.kmdseal'), lang);
    // the warning comes before the "always free" list, so it is read before any purchase
    const at = (f) => blocks.findIndex(f);
    assert.ok(at((b) => JSON.stringify(b).includes('export --sealed')) < at((b) => b.ul && b.ul.length > 5), lang);
  }
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

// The pages stay OFF: not in the sitemap, not in the deployed folder, not linked from any page that ships.
const DRAFT_PAGES = new RegExp(`(^|/)(${PAGES.join('|')})(\\.html|/|$)`);
const walk = (dir) => readdirSync(dir).filter((n) => n !== 'node_modules').flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)]));

test('the pages are not in web/dist or its sitemap (build_dist.py run into a scratch folder)', () => {
  const repo = resolve(SITE, '..', '..');
  const out = mkdtempSync(join(tmpdir(), 'komando-dist-'));
  try {
    const run = spawnSync('python3', ['-I', join(repo, 'web', 'deploy', 'build_dist.py'), out], { cwd: repo, encoding: 'utf8', env: { ...process.env, GITHUB_SHA: 'a'.repeat(40) } });
    assert.equal(run.status, 0, run.stderr);
    const files = walk(out).map((f) => relative(out, f).split('\\').join('/'));
    assert.deepEqual(files.filter((f) => f.includes('draft') || DRAFT_PAGES.test(f)), [], 'a draft page is deployed');
    const sitemap = readFileSync(join(out, 'sitemap.xml'), 'utf8');
    assert.doesNotMatch(sitemap, /draft/i);
    assert.doesNotMatch(sitemap, /\/(download|privacy|support|pricing)(\.html|\/)?</);
    for (const f of files.filter((n) => n.endsWith('.html'))) {
      assert.doesNotMatch(readFileSync(join(out, f), 'utf8'), /drafts\/|href="[^"]*\/(download|privacy|support|pricing)(\.html|\/)?(#[^"]*)?"/, `${f} links a draft page`);
    }
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

test('no committed page, shell part or content file names a draft page, and build.mjs adds no sitemap entry and no lookup', () => {
  const shipped = walk(SITE).filter((f) => /\.(html|mjs|json)$/.test(f))
    .filter((f) => !relative(SITE, f).startsWith(join('content', 'drafts')) && !relative(SITE, f).startsWith('test') && relative(SITE, f) !== 'build.mjs');
  for (const f of shipped) {
    assert.doesNotMatch(readFileSync(f, 'utf8'), /content\/drafts|drafts\/out/, relative(SITE, f));
  }
  const build = readFileSync(join(SITE, 'build.mjs'), 'utf8');
  assert.doesNotMatch(build, /sitemap|fetch\(|api\.github\.com/, 'build.mjs: no sitemap entry, no build-time lookup (W23)');
  const deploy = readFileSync(join(SITE, '..', 'deploy', 'build_dist.py'), 'utf8');
  assert.doesNotMatch(deploy, /drafts/);
});
