// Render the home page and the page shell with Meridian's marketing components, to static HTML, in English and Indonesian.
//
//   cd web/site && pnpm install && node build.mjs
//
// Writes index.html and id/index.html, the shell partials _shell/{en,id}/{head,header,footer}.html that guide/build.py and
// scripts/docsgen read, and copies Meridian's CSS and fonts from the pinned package into assets/meridian/. Every output is
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
import { SiteHeader } from '@efolusi/meridian/marketing/SiteHeader.js';
import { SiteFooter } from '@efolusi/meridian/marketing/SiteFooter.js';
import { ThemeToggle, themeInitScript } from '@efolusi/meridian/marketing/ThemeToggle.js';
import { Icon } from '@efolusi/meridian/icons/Icon.js';
import * as en from './content/home.en.mjs';
import * as id from './content/home.id.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE_URL = 'https://komando.efolusi.com/';
const h = React.createElement;
const raw = (tag, html, props = {}) => h(tag, { ...props, dangerouslySetInnerHTML: { __html: html } });
const LANGS = { en, id };
// the folder a language lives in, under the site's root
const BASE = { en: '', id: 'id/' };

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

// the K-caret logo (the apps' design/logo.md, the white version for the web)
const LOGO = '<svg class="site-logo" viewBox="0 0 100 100" aria-hidden="true"><rect x=".5" y=".5" width="99" height="99" rx="25" fill="#ffffff" stroke="#e4e4e1"/><rect x="25" y="24.5" width="14" height="51" rx="7" fill="#1659ff"/><path d="M70.5 31 51.5 50 70.5 69" fill="none" stroke="#1c1c1e" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const brand = h(React.Fragment, null, raw('span', LOGO, { className: 'site-logo-wrap' }), 'Komando');

// the icons site.js swaps in when a button changes state
const SWAP_ICONS = ['sun', 'moon', 'monitor', 'menu', 'x', 'play', 'pause'];

/** Where a link goes from a page: a home section, a site page or an outside address. */
function target(link, root, home, lang) {
  const base = BASE[lang];
  if (link.href) return link.href;
  if (link.section) return home ? `#${link.section}` : `${root}${base}index.html#${link.section}`;
  return `${root}${base}${link.page}`;
}

// React writes the prop hrefLang as hrefLang; the attribute is hreflang
const lowerHreflang = (html) => html.replaceAll(' hrefLang=', ' hreflang=');

/** The language switch: a link to this page's twin, named in the language it goes to. */
function switchLink(c, href) {
  const s = c.shell.switch;
  return { href, hrefLang: s.hrefLang, label: s.label, ariaLabel: s.ariaLabel };
}

function header(c, root, home, switchHref) {
  const lang = c.meta.lang;
  const links = c.shell.nav.map((l) => ({ href: target(l, root, home, lang), label: l.label, 'data-nav': l.id }));
  const actions = h(React.Fragment, null,
    h(ThemeToggle, { lang }),
    h('a', { className: 'ef-btn ef-btn--primary ef-btn--sm', href: target({ section: 'install' }, root, home, lang) }, c.shell.install));
  let html = renderToStaticMarkup(h(SiteHeader, {
    brand, brandHref: home ? './' : `${root}${BASE[lang]}index.html`, brandLabel: c.shell.brandLabel, links, actions,
    languageSwitch: switchLink(c, switchHref), labels: { skip: c.shell.skip },
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

function footer(c, root, home, switchHref) {
  const lang = c.meta.lang;
  const columns = c.shell.footer.columns.map((col) => ({
    heading: col.heading,
    links: col.links.map((l) => ({ label: l.label, href: target(l, root, home, lang) })),
  }));
  const s = switchLink(c, switchHref);
  const bottom = h(React.Fragment, null, h('span', null, c.shell.footer.rights), h('span', null, c.shell.footer.trademarks),
    h('a', { className: 'ef-site-footer__link', href: s.href, hrefLang: s.hrefLang, lang: s.hrefLang, 'aria-label': s.ariaLabel }, s.label));
  const icons = SWAP_ICONS.map((name) => `<template id="icon-${name}">${renderToStaticMarkup(h(Icon, { name, size: name === 'menu' || name === 'x' ? 20 : name === 'play' || name === 'pause' ? 16 : 20, 'aria-hidden': 'true' }))}</template>`).join('');
  return lowerHreflang(renderToStaticMarkup(h(SiteFooter, {
    brand, brandHref: home ? './' : `${root}${BASE[lang]}index.html`, tagline: c.shell.footer.tagline, columns, bottom, lang,
  }))) + `\n${icons}\n<script type="module" src="${root}assets/site.js"></script>`;
}

/** The part of <head> every page shares, after its own title, description and canonical link. */
function headShared(root) {
  return [
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
    `<link rel="icon" href="${root}favicon.svg" type="image/svg+xml">`,
    `<meta property="og:image" content="${SITE_URL}share.jpg">`,
    '<meta name="color-scheme" content="light dark">',
    // before any stylesheet, so the first frame already has the reader's theme
    `<script>${themeInitScript()}</script>`,
    `<link rel="preload" href="${root}assets/meridian/assets/fonts/Figtree-Variable.woff2" as="font" type="font/woff2" crossorigin>`,
    `<link rel="stylesheet" href="${root}assets/meridian/styles.css">`,
    `<link rel="stylesheet" href="${root}assets/meridian/landing.css">`,
    `<link rel="stylesheet" href="${root}assets/site.css">`,
  ].join('\n');
}

function homeBody(c, root) {
  const r = c.release;
  const btn = (kind, href, label) => h('a', { className: `ef-btn ef-btn--${kind} ef-btn--lg`, href }, label);

  const hero = h(Hero, {
    id: 'hero', className: 'site-hero', align: 'start', 'aria-labelledby': 'hero-h',
    title: h('span', { id: 'hero-h' }, c.hero.title),
    sub: c.hero.sub,
    actions: h(React.Fragment, null, btn('primary', '#install', c.hero.primary), btn('secondary', 'guide/', c.hero.secondary)),
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
        c.oneCommand.agents.map(([icon, name]) => h('li', { key: icon, className: 'site-chip' },
          h('img', { src: `${root}assets/icons/${icon}.svg`, alt: '', width: 22, height: 22, loading: 'lazy' }), name)))));

  const node = ([icon, label, sub, tint]) => h('li', { key: label, className: 'site-node', 'data-tint': tint },
    raw('span', glyph(icon), { className: 'site-node__icon' }),
    h('span', { className: 'site-node__label' }, label), h('span', { className: 'site-node__sub' }, sub));
  const inventory = h(Section, { id: 'inventory', 'aria-labelledby': 'inventory-h', ruled: true },
    h('div', { className: 'site-split site-split--head' },
      h(SectionHead, { title: h('span', { id: 'inventory-h' }, c.inventory.title) }),
      h('div', { className: 'site-stack' }, h('p', { className: 'site-lede' }, c.inventory.lede),
        h('p', null, h('a', { className: 'site-link', href: '#features' }, c.inventory.link)))),
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
        h('p', null, h('a', { className: 'site-link', href: '#editions' }, c.safety.link))),
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
        h('p', null, h('a', { className: 'site-link', href: '#editions' }, c.agent.link)))),
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
<html lang="${lang}">
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

export function renderShell(c = en) {
  return { head: headShared('{{root}}'), header: header(c, '{{root}}', false, '{{switch}}'), footer: footer(c, '{{root}}', false, '{{switch}}') };
}

function copyMeridian() {
  const pkg = dirname(createRequire(import.meta.url).resolve('@efolusi/meridian/package.json'));
  const out = join(HERE, 'assets', 'meridian');
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  for (const f of ['styles.css', 'components.css', 'landing.css', 'tokens']) cpSync(join(pkg, f), join(out, f), { recursive: true });
  cpSync(join(pkg, 'assets', 'fonts'), join(out, 'assets', 'fonts'), { recursive: true });
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
    const dir = join(HERE, '_shell', lang);
    mkdirSync(dir, { recursive: true });
    for (const [name, html] of Object.entries(renderShell(c))) writeFileSync(join(dir, `${name}.html`), `${html}\n`);
  }
  console.log(`build.mjs: index.html, id/index.html and _shell/{en,id}/ written with @efolusi/meridian ${version}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
