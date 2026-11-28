// Render the home page, the not-found page and the page shell with Meridian's marketing components, to static HTML, in
// English and Indonesian.
//
//   cd web/site && pnpm install && node build.mjs
//
// Writes index.html, 404.html, id/index.html, id/404.html, the shell partials _shell/{en,id}/{head,header,footer}.html
// that guide/build.py and scripts/docsgen read, and copies Meridian's CSS, fonts and plain browser scripts (browser/theme-init.js, theme.js and
// marketing.js) from the pinned package into assets/meridian/. Every output is
// committed, so serving the site needs no build step. Decision: brainOS 05-Knowledge/.../komando/2026-11-20-site-on-meridian-decision.md.
//
// In a partial, {{root}} is the way from the page up to web/site/ ("../" or "../../"), data-nav="ID" marks a nav
// link the builder sets aria-current="page" on, and {{switch}} is the address of the page in the other language.

import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Hero } from '@efolusi/meridian/marketing/Hero.js';
import { Section, SectionHead } from '@efolusi/meridian/marketing/Section.js';
import { FeatureCard, FeatureGrid } from '@efolusi/meridian/marketing/FeatureCard.js';
import { Marquee } from '@efolusi/meridian/marketing/Marquee.js';
import { Tag } from '@efolusi/meridian/display/Tag.js';
import { SiteHeader } from '@efolusi/meridian/marketing/SiteHeader.js';
import { SiteFooter } from '@efolusi/meridian/marketing/SiteFooter.js';
import { LanguageSwitch } from '@efolusi/meridian/marketing/LanguageSwitch.js';
import { LABELS as THEME_LABELS } from '@efolusi/meridian/theme';
import { Icon } from '@efolusi/meridian/icons/Icon.js';
import * as en from './content/home.en.mjs';
import * as id from './content/home.id.mjs';
import { renderDrafts } from './content/drafts/render.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE_URL = 'https://komando.efolusi.com/';
const h = React.createElement;
const raw = (tag, html, props = {}) => h(tag, { ...props, dangerouslySetInnerHTML: { __html: html } });
const LANGS = { en, id };
// the folder a language lives in, under the site's root
const BASE = { en: '', id: 'id/' };

// The year in the footer is worked out at build time (row W48); the pages are committed, so rebuild in January.
const YEAR = new Date().getFullYear();
// Platform terms, Privacy notice and Status are efolusi.com's pages. They are in the footer only once the draft pages
// are switched on (content/drafts/config.json, README "Draft pages").
const DRAFTS_ON = JSON.parse(readFileSync(join(HERE, 'content', 'drafts', 'config.json'), 'utf8')).switchedOn === true;

/** A drawn app screen. Indonesian swaps in its screen-reader description and the lines home.id.mjs names. */
function screen(name, c) {
  let html = readFileSync(join(HERE, 'content', 'screens', `${name}.html`), 'utf8').trim();
  const over = c.screens?.[name];
  if (!over) return html;
  html = html.replace(/aria-label="[^"]*"/, () => `aria-label="${over.label}"`);
  for (const [from, to] of over.replace ?? []) {
    if (!html.includes(from)) throw new Error(`screens.${name}: "${from}" is not in content/screens/${name}.html`);
    html = html.replace(from, () => to);
  }
  return html;
}
const glyph = (name) => readFileSync(join(HERE, 'glyphs', `${name}.svg`), 'utf8').trim()
  .replace('<svg ', '<svg aria-hidden="true" focusable="false" ');

// the product mark: the Komando mark on efolusi.com (three chevrons), drawn on the 64 by 64 artboard of brand/komando.svg.
// It takes the page's text colour, so it follows both themes.
const MARK_PATH = readFileSync(join(HERE, 'brand', 'komando.svg'), 'utf8').match(/ d="([^"]+)"/)[1];
const LOGO = `<svg class="site-logo" viewBox="0 0 64 64" aria-hidden="true"><path fill="currentColor" d="${MARK_PATH}"/></svg>`;
const brand = h(React.Fragment, null, raw('span', LOGO, { className: 'site-logo-wrap' }), 'Komando');

// the icons site.js swaps in when marketing.js changes a button's state; the theme button holds its two icons itself
const SWAP_ICONS = ['menu', 'x', 'play', 'pause'];

// Meridian's plain theme button (guidelines/theming.md, Plain HTML sites): two choices, light and dark. marketing.js wires
// it and the CSS shows the icon of data-theme-shown. The React ThemeToggle marks itself data-ef-react and marketing.js
// would leave that one alone.
const THEME_ICONS = [['light', 'sun'], ['dark', 'moon']];
function themeToggle(lang) {
  const text = THEME_LABELS[lang];
  return h('button', {
    type: 'button', 'data-slot': 'theme-toggle', className: 'ef-theme-toggle', 'data-theme-shown': 'light',
    'aria-label': `${text.next} ${text.dark.toLowerCase()}`, title: text.light,
  }, THEME_ICONS.map(([theme, name]) => h(Icon, { key: theme, name, size: 20, 'data-theme-icon': theme, 'aria-hidden': 'true' })));
}

/** Where a link goes from a page: a home section, a site page or an outside address. */
function target(link, root, home, lang) {
  const base = BASE[lang];
  if (link.href) return link.href;
  if (link.section) return home ? `#${link.section}` : `${root}${base}index.html#${link.section}`;
  return `${root}${base}${link.page}`;
}

// React writes the prop hrefLang as hrefLang; the attribute is hreflang
const lowerHreflang = (html) => html.replaceAll(' hrefLang=', ' hreflang=');

/**
 * The language switch. The header takes Meridian's LanguageSwitch (MD112, row W68): the codes EN and ID, the page's own
 * language marked and not a link, the other a link (hreflang, lang, its own name in its accessible name). The footer
 * keeps a text link with the full name of the other language, named in the language it goes to.
 */
function switchLink(c, href) {
  const s = c.shell.switch;
  return { href, hrefLang: s.hrefLang, label: s.label, ariaLabel: s.ariaLabel };
}

function languageSwitch(c, switchHref) {
  const s = c.shell.switch;
  const lang = c.meta.lang;
  return h(LanguageSwitch, {
    current: lang, lang,
    languages: [
      { code: lang, label: lang.toUpperCase(), href: '#' },
      { code: s.hrefLang, label: s.short, href: switchHref },
    ].sort((x, y) => (x.code === 'en' ? -1 : y.code === 'en' ? 1 : 0)),
  });
}

function header(c, root, home, switchHref) {
  const lang = c.meta.lang;
  const links = c.shell.nav.map((l) => ({ href: target(l, root, home, lang), label: l.label, 'data-nav': l.id }));
  const actions = h(React.Fragment, null,
    themeToggle(lang),
    h('a', { className: 'ef-btn ef-btn--primary ef-btn--md', href: target({ section: 'install' }, root, home, lang) }, c.shell.install));
  let html = renderToStaticMarkup(h(SiteHeader, {
    brand, brandHref: home ? './' : `${root}${BASE[lang]}index.html`, brandLabel: c.shell.brandLabel, links, actions,
    languageSwitch: languageSwitch(c, switchHref), labels: { skip: c.shell.skip },
    lang, skipHref: '#top',
  }));
  // SiteHeader names its menu panel with React's useId; give it a stable name
  const id = /aria-controls="([^"]+)"/.exec(html)[1];
  html = html.replaceAll(`"${id}"`, '"site-menu"');
  // links carry data-nav for the builders; SiteHeader drops unknown props, so put it on by href
  for (const l of links) {
    html = html.replaceAll(`class="ef-site-header__link" href="${l.href}"`, `class="ef-site-header__link" href="${l.href}" data-nav="${l['data-nav']}"`);
  }
  return lowerHreflang(html);
}

function footer(c, root, home, switchHref, legalOn = DRAFTS_ON) {
  const lang = c.meta.lang;
  const columns = c.shell.footer.columns.map((col) => ({
    heading: col.heading,
    links: col.links.map((l) => ({ label: l.label, href: target(l, root, home, lang) })),
  }));
  const s = switchLink(c, switchHref);
  const legal = legalOn ? c.shell.footer.legal.map((l) => h('a', { key: l.href, className: 'ef-site-footer__link', href: l.href }, l.label)) : [];
  const bottom = h(React.Fragment, null, h('span', null, c.shell.footer.rights.replace('{year}', YEAR)), h('span', null, c.shell.footer.trademarks), ...legal,
    h('a', { className: 'ef-site-footer__link', href: s.href, hrefLang: s.hrefLang, lang: s.hrefLang, 'aria-label': s.ariaLabel }, s.label));
  const icons = SWAP_ICONS.map((name) => `<template id="icon-${name}">${renderToStaticMarkup(h(Icon, { name, size: name === 'play' || name === 'pause' ? 16 : 20, 'aria-hidden': 'true' }))}</template>`).join('');
  return lowerHreflang(renderToStaticMarkup(h(SiteFooter, {
    brand, brandHref: home ? './' : `${root}${BASE[lang]}index.html`, tagline: c.shell.footer.tagline, columns, bottom, lang,
  }))) + `\n${icons}\n<script type="module" src="${root}assets/meridian/browser/marketing.js"></script>\n<script type="module" src="${root}assets/site.js"></script>`;
}

/** The part of <head> every page shares, after its own title, description and canonical link. */
function headShared(root) {
  return [
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
    `<link rel="icon" href="${root}favicon.svg" type="image/svg+xml">`,
    `<meta property="og:image" content="${SITE_URL}share.jpg">`,
    '<meta name="color-scheme" content="light dark">',
    // Meridian's file, before any stylesheet, so the first frame already has the reader's theme; same origin, so
    // script-src 'self' covers it and the CSP holds no hash that a Meridian release could make stale
    `<script src="${root}assets/meridian/browser/theme-init.js"></script>`,
    `<link rel="preload" href="${root}assets/meridian/assets/fonts/Figtree-Variable.woff2" as="font" type="font/woff2" crossorigin>`,
    `<link rel="stylesheet" href="${root}assets/meridian/styles.css">`,
    `<link rel="stylesheet" href="${root}assets/meridian/landing.css">`,
    `<link rel="stylesheet" href="${root}assets/site.css">`,
  ].join('\n');
}

function homeBody(c, root) {
  const r = c.release;
  // sizes are Meridian's: both hero actions xl (buttons in one row are one size, as efolusi.com's hero pair), the closing action lg
  const btn = (kind, href, label, size = 'lg') => h('a', { className: `ef-btn ef-btn--${kind} ef-btn--${size}`, href }, label);

  const hero = h(Hero, {
    id: 'hero', className: 'site-hero', align: 'start', 'aria-labelledby': 'hero-h',
    title: h('span', { id: 'hero-h' }, c.hero.title),
    sub: c.hero.sub,
    actions: h(React.Fragment, null, btn('primary', '#install', c.hero.primary, 'xl'), btn('secondary', 'guide/', c.hero.secondary, 'xl')),
    proof: h('span', null, `${c.hero.releaseLabel} `, h('span', { 'data-release': '' }, r)),
  }, raw('div', screen('home', c), { className: 'site-stage' }));

  const marquee = h(Marquee, { items: c.targets.items, label: c.targets.label, lang: c.meta.lang, duration: 40 });

  const oneCommand = h(Section, { id: 'one-command', 'aria-labelledby': 'one-command-h' },
    h(SectionHead, { title: raw('span', c.oneCommand.titleHtml, { id: 'one-command-h' }), className: 'site-statement' },
      raw('p', c.oneCommand.ledeHtml, { className: 'ef-section-head__lede' })),
    h('ul', { className: 'site-swap', 'aria-label': c.oneCommand.swapLabel },
      c.oneCommand.swap.map(([was, line]) => h('li', { key: was }, h('span', { className: 'site-swap__was' }, was), h('code', null, line)))),
    h('div', { className: 'site-agents' },
      raw('p', c.oneCommand.agentsHtml, { id: 'agents-l', className: 'site-small' }),
      h('ul', { className: 'site-chips', 'aria-labelledby': 'agents-l' },
        c.oneCommand.agents.map(([icon, name]) => h('li', { key: icon },
          h(Tag, null, h('img', { src: `${root}assets/icons/${icon}.svg`, alt: '', width: 16, height: 16, loading: 'lazy' }), name))))));

  const node = ([icon, label, sub, tint]) => h('li', { key: label, className: 'site-node', 'data-tint': tint },
    raw('span', glyph(icon), { className: 'site-node__icon' }),
    h('span', { className: 'site-node__label' }, label), h('span', { className: 'site-node__sub' }, sub));
  const inventory = h(Section, { id: 'inventory', 'aria-labelledby': 'inventory-h', ruled: true },
    h('div', { className: 'site-split site-split--head' },
      h(SectionHead, { title: h('span', { id: 'inventory-h' }, c.inventory.title) }),
      h('div', { className: 'site-stack' }, h('p', { className: 'site-lede' }, c.inventory.lede),
        h('p', null, h('a', { href: '#features' }, c.inventory.link)))),
    h('figure', { className: 'site-flow', 'aria-label': c.inventory.alt },
      h('ul', { className: 'site-flow__col', 'aria-label': c.inventory.sourcesLabel }, c.inventory.sources.map((s) => node([...s, s[0] === 'text-bubble' ? 'agent' : 'plain']))),
      h('div', { className: 'site-flow__core', 'aria-hidden': 'true' }, raw('span', LOGO), c.inventory.core),
      h('ul', { className: 'site-flow__col', 'aria-label': c.inventory.reachLabel }, c.inventory.reach.map(node))));

  const safety = h(Section, { id: 'safety', 'aria-labelledby': 'safety-h' },
    h('div', { className: 'site-split' },
      h('div', { className: 'site-stack' },
        h(SectionHead, { title: h('span', { id: 'safety-h' }, c.safety.title), lede: c.safety.lede }),
        h('ul', { className: 'site-rows' }, c.safety.rows.map(([name, value]) => h('li', { key: name },
          h('span', { className: 'site-rows__name' }, name), raw('span', value, { className: 'site-rows__value' })))),
        h('p', null, h('a', { href: '#editions' }, c.safety.link))),
      raw('div', screen('safety', c), { className: 'site-frame site-frame--ink' })));

  const features = h(Section, { id: 'features', 'aria-labelledby': 'features-h', ruled: true },
    h(SectionHead, { title: raw('span', c.features.titleHtml, { id: 'features-h' }) }),
    h(FeatureGrid, { className: 'site-features' }, c.features.cards.map((card) => h(FeatureCard, {
      key: card.screen, icon: card.icon, title: card.title, className: 'site-feature',
    }, raw('p', card.bodyHtml, { className: 'ef-feature-card__body' }), raw('div', screen(card.screen, c), { className: 'site-panel' })))));

  const agent = h(Section, { id: 'agent', tone: 'band', 'aria-labelledby': 'agent-h' },
    h('div', { className: 'site-split site-split--head' },
      h(SectionHead, { title: h('span', { id: 'agent-h' }, c.agent.title) }),
      h('div', { className: 'site-stack' }, h('p', { className: 'site-lede' }, c.agent.lede),
        h('p', null, h('a', { href: '#editions' }, c.agent.link)))),
    raw('div', screen('agent', c), { className: 'site-app' }));

  const rows = (group, next) => [
    h('li', { key: `${group.head[0]}-h`, className: `site-rows__head${next ? ' site-rows__head--next' : ''}` },
      h('span', null, group.head[0]), h('span', null, group.head[1])),
    ...group.rows.map(([name, where]) => h('li', { key: name },
      h('span', { className: 'site-rows__name' }, name), h('span', { className: 'site-rows__value' }, where))),
  ];
  const editions = h(Section, { id: 'editions', 'aria-labelledby': 'editions-h', ruled: true },
    h('div', { className: 'site-split' },
      h('div', { className: 'site-stack' },
        h(SectionHead, { title: h('span', { id: 'editions-h' }, c.editions.title), lede: c.editions.lede }),
        h('ul', { className: 'site-rows site-rows--table' }, rows(c.editions.free, false), rows(c.editions.later, true))),
      raw('div', screen('upgrade', c), { className: 'site-frame site-frame--plain' })));

  const unixLine = `curl --proto '=https' --tlsv1.2 -fsSL https://<wbr>raw.githubusercontent.com/<wbr>sgnd/<wbr>komando/<wbr><span data-release>${r}</span>/<wbr>install.sh | <span class="nw">KOMANDO_VERSION=<span data-release>${r}</span></span> sh`;
  const checkLines = `curl --proto '=https' --tlsv1.2 -fsSLO https://<wbr>raw.githubusercontent.com/<wbr>sgnd/<wbr>komando/<wbr><span data-release>${r}</span>/<wbr>install.sh\nshasum -a 256 install.sh\nless install.sh\nKOMANDO_VERSION=<span data-release>${r}</span> sh install.sh`;
  const cmd = (id, html, kind) => h('div', { className: 'site-cmd' },
    raw('code', html, { id }),
    h('button', { className: `ef-btn ef-btn--${kind} ef-btn--md`, type: 'button', 'data-copy': id, 'aria-describedby': `${id}-status` }, c.install.copy));
  const icons = (list) => h('div', { className: 'site-platforms' }, list.map(([file, alt, w]) =>
    h('img', { key: file, src: `${root}assets/icons/${file}.svg`, alt, width: w, height: 44, loading: 'lazy' })));
  const install = h(Section, { id: 'install', 'aria-labelledby': 'install-h' },
    h(SectionHead, { title: h('span', { id: 'install-h' }, c.install.title) },
      raw('p', c.install.ledeHtml.replaceAll('{release}', r), { className: 'ef-section-head__lede' })),
    h('div', { className: 'site-install' },
      h('article', { className: 'site-card site-card--wide' },
        icons([['apple', 'Apple macOS', 44], ['linux-tux', 'Linux', 44], ['windows', 'Windows', 44]]),
        h('h3', null, c.install.unix.title), h('p', null, c.install.unix.body),
        cmd('cmd-unix', unixLine, 'primary'),
        h('p', { className: 'site-cmd__status', id: 'cmd-unix-status', role: 'status' }),
        h('div', { className: 'site-check' },
          raw('p', `${c.install.unix.checkHtml} <code class="site-check__sha" data-install-sha>${c.installSha}</code>.`, { className: 'site-small' }),
          raw('pre', `<code>${checkLines}</code>`, { className: 'site-check__code' }),
          raw('p', c.install.unix.signed, { className: 'site-small site-muted' }))),
      h('article', { className: 'site-card' },
        icons([['go', 'Go', 120]]),
        h('h3', null, c.install.go.title), h('p', null, c.install.go.body),
        cmd('cmd-go', 'go install github.com/<wbr>sgnd/<wbr>komando/<wbr>cmd/<wbr>komando@latest', 'secondary'),
        h('p', { className: 'site-cmd__status', id: 'cmd-go-status', role: 'status' }))));

  const closing = h(Section, { id: 'start', className: 'site-closing', 'aria-labelledby': 'start-h', ruled: true },
    h(SectionHead, { title: h('span', { id: 'start-h' }, c.closing.title), lede: c.closing.lede, align: 'center' },
      h('div', { className: 'site-closing__action' }, btn('primary', 'guide/first-ten-minutes/', c.closing.action))));

  return renderToStaticMarkup(h('main', { id: 'top', tabIndex: -1 }, hero, marquee, oneCommand, inventory, safety, features, agent, editions, install, closing));
}

/** The <link rel="alternate"> lines of a page that has a twin: en, id and x-default (the English page). */
function alternates() {
  return [['en', SITE_URL], ['id', `${SITE_URL}${BASE.id}`], ['x-default', SITE_URL]]
    .map(([lang, href]) => `<link rel="alternate" hreflang="${lang}" href="${href}">`).join('\n');
}

export function renderHome(c = en) {
  const lang = c.meta.lang;
  const root = lang === 'en' ? '' : '../';
  const twin = lang === 'en' ? 'id/' : '../';
  return `<!doctype html>
<html lang="${lang}" data-shape="pill">
<head>
<meta charset="utf-8">
<title>${c.meta.title}</title>
<meta name="description" content="${c.meta.description}">
<link rel="canonical" href="${SITE_URL}${BASE[lang]}">
${alternates()}
<meta property="og:type" content="website">
<meta property="og:title" content="${c.meta.title}">
<meta property="og:description" content="${c.meta.ogDescription}">
<meta name="twitter:card" content="summary_large_image">
${headShared(root)}
<!-- built by web/site/build.mjs from content/; edit the source, not this file -->
</head>
<body>
${header(c, root, true, twin)}
${screen('glyphs', c)}
${homeBody(c, root)}
${footer(c, root, true, twin)}
</body>
</html>
`;
}

/**
 * The not-found page (rows W43 and W68). It is Meridian 2.6.0's shared 404.html (MD110, guidelines/frameworks.md "A 404
 * page on a static site"), both languages in it as the shared file has them: the mark, the product name in the title and
 * the home links are the things changed. The page's own language comes first (h1), the other second (h2). One language
 * alone is not used: Meridian's grid is two columns from 880 px, so a single section sits off centre (found in W68).
 * Cloudflare serves it for any unknown address, at any depth, and takes the nearest 404.html up the path, so /id/... gets
 * id/404.html. Every address in it is therefore from the site's root. It holds one stylesheet, no script, no <style>
 * and no style attribute, and follows the system's light or dark (a saved theme needs the theme script).
 */
export function renderNotFound(c = en) {
  const lang = c.meta.lang;
  const order = [lang, ...Object.keys(LANGS).filter((l) => l !== lang)];
  const sections = order.map((l, i) => {
    const nf = LANGS[l].notFound;
    const heading = i === 0 ? 'h1' : 'h2';
    return `    <section class="ef-notfound__lang" lang="${l}" aria-labelledby="not-found-${l}">
      <${heading} class="ef-page-title" id="not-found-${l}">${nf.title}</${heading}>
      <p>${nf.sub}</p>
      <a class="ef-notfound__home" href="/${BASE[l]}">${nf.home}</a>
    </section>`;
  }).join('\n');
  const titles = order.map((l) => LANGS[l].notFound.title).join(' · ');
  return `<!doctype html>
<html lang="${lang}" data-shape="pill">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titles} · Komando</title>
<meta name="robots" content="noindex">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/meridian/styles.css">
<!-- built by web/site/build.mjs from content/; edit the source, not this file. Shape: Meridian 404.html (MD110) -->
</head>
<body>
<main class="ef-notfound">
  <img class="ef-notfound__mark" src="/favicon.svg" alt="" width="40" height="40">
  <p class="ef-notfound__code">404</p>
  <div class="ef-notfound__langs">
${sections}
  </div>
</main>
</body>
</html>
`;
}

export function renderShell(c = en, legalOn = DRAFTS_ON) {
  return { head: headShared('{{root}}'), header: header(c, '{{root}}', false, '{{switch}}'), footer: footer(c, '{{root}}', false, '{{switch}}', legalOn) };
}

function copyMeridian() {
  const pkg = dirname(createRequire(import.meta.url).resolve('@efolusi/meridian/package.json'));
  const out = join(HERE, 'assets', 'meridian');
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  for (const f of ['styles.css', 'components.css', 'landing.css', 'tokens']) cpSync(join(pkg, f), join(out, f), { recursive: true });
  cpSync(join(pkg, 'assets', 'fonts'), join(out, 'assets', 'fonts'), { recursive: true });
  mkdirSync(join(out, 'browser'));
  for (const f of ['theme-init.js', 'theme.js', 'marketing.js']) cpSync(join(pkg, 'browser', f), join(out, 'browser', f));
  cpSync(join(pkg, 'LICENSE'), join(out, 'LICENSE.txt'));
  const { version } = JSON.parse(readFileSync(join(pkg, 'package.json'), 'utf8'));
  writeFileSync(join(out, 'VERSION.txt'), `@efolusi/meridian ${version}\n`);
  return version;
}

function main() {
  const version = copyMeridian();
  for (const [lang, c] of Object.entries(LANGS)) {
    const home = join(HERE, BASE[lang], 'index.html');
    mkdirSync(dirname(home), { recursive: true });
    writeFileSync(home, renderHome(c));
    writeFileSync(join(HERE, BASE[lang], '404.html'), renderNotFound(c));
    const dir = join(HERE, '_shell', lang);
    mkdirSync(dir, { recursive: true });
    for (const [name, html] of Object.entries(renderShell(c))) writeFileSync(join(dir, `${name}.html`), `${html}\n`);
  }
  const drafts = renderDrafts();
  console.log(`build.mjs: ${drafts} draft pages (switched off) written to content/drafts/out/, index.html, 404.html, id/index.html, id/404.html and _shell/{en,id}/ written with @efolusi/meridian ${version}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
