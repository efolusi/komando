// What web/site/build.mjs renders: the home page and the shell the guide and the docs read.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { renderHome, renderShell } from '../build.mjs';
import * as en from '../content/home.en.mjs';
import * as id from '../content/home.id.mjs';

const MERIDIAN = dirname(createRequire(import.meta.url).resolve('@efolusi/meridian/package.json'));
const HERE = dirname(fileURLToPath(import.meta.url));
const INIT = 'assets/meridian/browser/theme-init.js';
const home = renderHome();
const shell = renderShell();

test('the theme init script is Meridian\'s file, loaded from the head before any stylesheet', () => {
  const head = home.slice(0, home.indexOf('</head>'));
  const script = head.indexOf(`<script src="${INIT}"></script>`);
  assert.ok(script > 0, 'theme-init.js missing from <head>');
  assert.ok(script < head.indexOf('<link rel="stylesheet"'), 'the init script must run before the first stylesheet');
});

test('no page carries an inline script: the CSP needs no hash', () => {
  for (const page of [home, renderHome(id), shell.head, shell.footer]) assert.doesNotMatch(page, /<script(?![^>]*\ssrc=)[^>]*>/);
});

test('the copied theme-init.js and marketing.js are the package files, byte for byte', () => {
  for (const name of ['theme-init.js', 'theme.js', 'marketing.js']) {
    const served = readFileSync(join(HERE, '..', 'assets', 'meridian', 'browser', name), 'utf8');
    assert.equal(served, readFileSync(join(MERIDIAN, 'browser', name), 'utf8'), `${name} differs from @efolusi/meridian`);
  }
});

test('Meridian\'s marketing.js runs before site.js, as modules', () => {
  const marketing = home.indexOf('<script type="module" src="assets/meridian/browser/marketing.js"></script>');
  assert.ok(marketing > 0 && marketing < home.indexOf('<script type="module" src="assets/site.js"></script>'));
});

test('the theme button is the plain markup marketing.js wires: two icons, no data-ef-react', () => {
  const button = /<button[^>]*data-slot="theme-toggle"[^>]*>.*?<\/button>/s.exec(shell.header)[0];
  assert.doesNotMatch(shell.header, /data-ef-react/);
  assert.deepEqual([...button.matchAll(/data-theme-icon="([a-z]+)"/g)].map((m) => m[1]).sort(), ['dark', 'light']);
  assert.match(button, /data-theme-shown="light"/);
  assert.match(button, /aria-label="Switch to dark theme"/);
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
  assert.match(shell.head, /<script src="\{\{root\}\}assets\/meridian\/browser\/theme-init\.js"><\/script>/);
});

const idHome = renderHome(id);
const idShell = renderShell(id);
const sectionIds = (html) => [...html.matchAll(/<section[^>]*\sid="([^"]+)"/g)].map((m) => m[1]);

test('the Indonesian home page is lang id, its own canonical, with hreflang en, id and x-default', () => {
  assert.match(idHome, /^<!doctype html>\n<html lang="id" data-shape="pill">/);
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

// W18: the product mark is the one on efolusi.com (three chevrons, brand/komando.svg), never the K-caret.
const MARK = readFileSync(join(HERE, '..', 'brand', 'komando.svg'), 'utf8');
const MARK_PATH = MARK.match(/ d="([^"]+)"/)[1];

test('the header mark and the favicon are the system komando mark, and the K-caret is gone', () => {
  assert.match(MARK, /^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" viewBox="0 0 64 64">/);
  const favicon = readFileSync(join(HERE, '..', 'favicon.svg'), 'utf8');
  assert.ok(favicon.includes(MARK_PATH), 'favicon.svg does not carry the system mark');
  assert.doesNotMatch(favicon, /6090ff|linearGradient/i, 'the K-caret is still in favicon.svg');
  for (const page of [home, renderHome(id), shell.header, shell.footer]) {
    // the drawn app screens keep the apps' own blue; only the product mark (class site-logo) is checked
    for (const logo of page.match(/<svg class="site-logo"[^>]*>.*?<\/svg>/g) ?? []) {
      assert.ok(logo.includes(MARK_PATH), 'a site-logo is not the system mark');
      assert.doesNotMatch(logo, /<rect|1659ff|1c1c1e/i, 'the K-caret is still in a site-logo');
    }
  }
  assert.ok((home.match(/<svg class="site-logo"/g) ?? []).length >= 2, 'the home page shows the mark in the header and in the flow');
});

// W19, C277: light and dark only; the vendored copy is Meridian v2.5.0.
test('the theme switch has two choices in both languages, and the vendored copy is 2.5.0', () => {
  for (const page of [home, renderHome(id), shell.header]) {
    assert.doesNotMatch(page, /data-preference|data-theme-icon="system"|system theme|tema sistem/i, 'a system theme option is still on the page');
    assert.match(page, /data-theme-shown="(light|dark)"/);
  }
  assert.equal(readFileSync(join(HERE, '..', 'assets', 'meridian', 'VERSION.txt'), 'utf8').trim(), '@efolusi/meridian 2.5.0');
});

// W20: the social card (share.jpg) is drawn from brand/share-card.html, shows the product mark and no version number.
function jpegSize(file) {
  const b = readFileSync(file);
  for (let i = 2; i < b.length;) {
    if (b[i] !== 0xff) { i += 1; continue; }
    const marker = b[i + 1];
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
    i += 2 + b.readUInt16BE(i + 2);
  }
  throw new Error('no size in the jpeg');
}

test('the social card is 1200 by 630 and its source shows the Komando mark and no version', () => {
  assert.deepEqual(jpegSize(join(HERE, '..', 'share.jpg')), [1200, 630]);
  const card = readFileSync(join(HERE, '..', 'brand', 'share-card.html'), 'utf8');
  assert.ok(card.includes(MARK_PATH), 'the card does not draw the system mark');
  assert.doesNotMatch(card, /\bv?\d+\.\d+\.\d+\b/, 'the card names a version number');
  assert.doesNotMatch(card, /1659ff/i, 'the K-caret blue is on the card');
});

// W26: Meridian 2.1.0 sets one gap between a label and its icon.
test('the vendored CSS carries the label and icon gap tokens', () => {
  const css = ['tokens/base.css', 'components.css', 'landing.css', 'styles.css'].map((f) => {
    try { return readFileSync(join(HERE, '..', 'assets', 'meridian', f), 'utf8'); } catch { return ''; }
  }).join('\n');
  assert.match(css, /--gap-label-icon:\s*var\(--space-2\)/);
  assert.match(css, /--gap-label-icon-sm:\s*var\(--space-1\)/);
});

// W48: the footer's year is computed, the owner is the company, and efolusi.com's legal links wait for the draft pages.
test('the footer reads © <year> PT Efolusi Dunia Teknologi, with the year from the build and Indonesian "Hak cipta dilindungi"', () => {
  const year = new Date().getFullYear();
  assert.ok(renderShell(en).footer.includes(`© ${year} PT Efolusi Dunia Teknologi. All rights reserved.`));
  assert.ok(renderShell(id).footer.includes(`© ${year} PT Efolusi Dunia Teknologi. Hak cipta dilindungi.`));
  for (const c of [en, id]) assert.doesNotMatch(c.shell.footer.rights, /\b20\d\d\b/, 'the year is not typed in the copy');
});

test('Platform terms, Privacy notice and Status appear in the footer only when the draft pages are on', () => {
  const words = { en: ['Platform terms', 'Privacy notice', 'Status'], id: ['Ketentuan platform', 'Pemberitahuan privasi', 'Status'] };
  for (const [lang, c] of [['en', en], ['id', id]]) {
    const off = renderShell(c, false).footer;
    const on = renderShell(c, true).footer;
    for (const w of words[lang]) {
      assert.ok(!off.includes(`>${w}</a>`), `${lang}: ${w} shown while the drafts are off`);
      assert.ok(on.includes(`>${w}</a>`), `${lang}: ${w} missing once the drafts are on`);
    }
  }
  assert.ok(renderShell(en, true).footer.includes('href="https://efolusi.com/en/terms"'));
  assert.ok(renderShell(id, true).footer.includes('href="https://efolusi.com/id/privacy"'));
});

// W44: the sizes are Meridian's. Header action md, hero primary xl and secondary lg, Copy md.
test('buttons take Meridian sizes: header md, hero primary xl and secondary lg, Copy md', () => {
  assert.match(shell.header, /ef-btn ef-btn--primary ef-btn--md/);
  const hero = /<section[^>]*id="hero"[\s\S]*?<\/section>/.exec(home)[0];
  assert.match(hero, /ef-btn ef-btn--primary ef-btn--xl/);
  assert.match(hero, /ef-btn ef-btn--secondary ef-btn--lg/);
  assert.equal(home.match(/<button[^>]*data-copy[^>]*>/g).every((b) => b.includes('ef-btn--md')), true);
  assert.doesNotMatch(home + shell.header, /ef-btn--sm/);
});
