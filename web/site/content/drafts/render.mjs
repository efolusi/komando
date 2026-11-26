// Renders the draft pages of row W28 (download, privacy, support, pricing) to content/drafts/out/<lang>/<page>.html.
// The pages are switched OFF: nothing under content/ is served (web/deploy/build_dist.py copies an allowlist), no
// navigation or sitemap names them, and every one carries noindex and a visible draft banner. check_download.py
// (web/deploy) proves that, and refuses a switched-on page with an open TODO.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as en from './copy.en.mjs';
import * as id from './copy.id.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = join(HERE, '..', '..');
export const CONFIG = JSON.parse(readFileSync(join(HERE, 'config.json'), 'utf8'));
export const PAGES = ['download', 'privacy', 'support', 'pricing'];
const COPY = { en, id };
const OTHER = { en: 'id', id: 'en' };

const esc = (s) => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
// plain text with `code` and [label](href) inline
const inline = (s) => esc(s)
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="site-link" href="$2">$1</a>');

function block(b) {
  if (typeof b === 'string') return `<p>${inline(b)}</p>`;
  if (b.h) return `<h2>${inline(b.h)}</h2>`;
  if (b.h3) return `<h3>${inline(b.h3)}</h3>`;
  if (b.ul) return `<ul>${b.ul.map((i) => `<li>${inline(i)}</li>`).join('')}</ul>`;
  if (b.pre) return `<pre><code>${esc(b.pre)}</code></pre>`;
  if (b.todo) return `<p class="draft-todo"><strong>TODO</strong>${inline(b.todo)}</p>`;
  throw new Error(`unknown block ${JSON.stringify(b)}`);
}

/** The download page's blocks from the copy and the state in config.json. While the Mac app is not released the page
 *  says only that: no date, no link, no version, no checksum, no host. */
export function downloadBlocks(c, config) {
  const app = config.macApp;
  const d = c.download;
  if (!app.released) return [{ h: d.notReleased.title }, ...d.notReleased.body];
  const file = config.archivePath.replace('{channel}', 'stable').replace('{version}', app.version);
  const url = `https://${config.downloadHost}${file}`;
  const out = [{ h: d.released.title }, d.released.lead.replace('{version}', app.version),
    { ul: [`[${d.released.get}](${url})`] }, { h3: d.released.checkTitle }, d.released.checkBody.replace('{sha}', app.sha256),
    { pre: `shasum -a 256 Komando-${app.version}.zip` }];
  if (app.releaseNotesUrl) out.push(`[${d.released.notes}](${app.releaseNotesUrl})`);
  out.push({ h: d.requirements.title }, { ul: d.requirements.items.map((i) => i.replace('{macos}', config.minMacOS)) });
  out.push({ h: d.signing.title }, ...d.signing.body);
  out.push({ h: d.updates.title }, d.updates.body, { pre: d.updates.convention.replace('{path}', config.feedPath).replace('{archive}', config.archivePath) });
  out.push(...d.open);
  return out;
}

function blocksOf(page, c, config) {
  return page === 'download' ? downloadBlocks(c, config) : c[page].blocks;
}

export function renderDraft(lang, page, config = CONFIG, shell = null) {
  const c = COPY[lang];
  const root = '../../../../';
  const parts = shell ?? Object.fromEntries(['head', 'header', 'footer'].map((n) => [n, readFileSync(join(SITE, '_shell', lang, `${n}.html`), 'utf8')]));
  const fill = (s) => s.replaceAll('{{root}}', root).replaceAll('{{switch}}', `../${OTHER[lang]}/${page}.html`);
  const p = c[page];
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.description)}">
<meta name="robots" content="noindex, nofollow">
${fill(parts.head)}
<style>.draft-banner,.draft-todo{border:1px solid currentColor;border-radius:.5rem;padding:.75rem 1rem}.draft-todo strong::after{content:':'}.draft-todo strong{margin-inline-end:.25rem}</style>
<!-- DRAFT of row W28, switched off. Built by web/site/build.mjs from content/drafts/; edit the source, not this file -->
</head>
<body>
${fill(parts.header)}
<main id="top" tabindex="-1" class="ef-section">
<div class="draft-wrap" style="max-width:46rem;margin:0 auto;padding:2rem 1rem">
<p class="draft-banner" role="note"><strong>${esc(c.banner.label)}</strong> ${esc(c.banner.text)}</p>
<h1>${esc(p.h1)}</h1>
${blocksOf(page, c, config).map(block).join('\n')}
</div>
</main>
${fill(parts.footer)}
</body>
</html>
`;
}

export function renderDrafts() {
  for (const lang of Object.keys(COPY)) {
    const dir = join(HERE, 'out', lang);
    mkdirSync(dir, { recursive: true });
    for (const page of PAGES) writeFileSync(join(dir, `${page}.html`), renderDraft(lang, page));
  }
  return PAGES.length * Object.keys(COPY).length;
}
