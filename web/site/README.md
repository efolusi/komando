# komando website

The static site for the free komando command line and the free Komando apps: the home page, the user guide
(`guide/`) and the command line docs (`docs/`), built on the Meridian design system, in English and Indonesian
(`id/`, see "Languages"). The HTML is committed, so serving the site needs no build step.

## How the pages are made

| Part | Made by | From |
|---|---|---|
| `index.html`, `id/index.html`, `404.html`, `id/404.html` | `build.mjs` (Node 26.13.1, pnpm 11.24.0) | `content/home.en.mjs` and `content/home.id.mjs` (the copy, `notFound` for the 404 pages) and `content/screens/*.html` (the drawn app screens, shared), rendered with Meridian's marketing components (`Hero`, `Section`, `SectionHead`, `FeatureGrid`, `FeatureCard`, `Marquee`, `SiteHeader`, `SiteFooter`, `ThemeToggle`) through `renderToStaticMarkup` |
| `_shell/en/` and `_shell/id/`: `head.html`, `header.html`, `footer.html` | `build.mjs` | the same components; `{{root}}` is the way up to `web/site/`, `{{switch}}` the address of the page in the other language, `data-nav="ID"` marks a link the builder sets `aria-current` on |
| `assets/meridian/` | `build.mjs` | copied from the pinned `@efolusi/meridian` package: `styles.css`, `components.css`, `landing.css`, `tokens/`, the fonts and the licence |
| `guide/<page>/index.html`, `id/guide/<page>/index.html` | `guide/build.py` | `guide/src/*.md` and `guide/src/*.id.md`, framed by the shell partials; the Indonesian words are in `i18n/guide.id.json` |
| `docs/<page>/index.html`, `id/docs/<page>/index.html` | `scripts/docsgen` | komando's `docs/features` and `docs/src/*.md`, and `docs/src/*.id.md`, framed by the shell partials; the Indonesian words are in `i18n/docs.id.json` |
| `assets/site.css` | by hand | the site's layer on Meridian's tokens, and the drawn app screens (`.kmd`) on the apps' own tokens |
| `assets/site.js` | by hand | what Meridian's plain `browser/marketing.js` does not cover: the menu and Marquee icons, the Copy buttons and the folding page list. The theme button (light and dark only; a first visit follows the device; `localStorage` `efolusi-theme`, cookie `efolusi_theme`), the header menu and the Marquee pause are `marketing.js`, loaded before `site.js`; `build.mjs` copies it, `theme.js` and `theme-init.js` from the package into `assets/meridian/browser/` |

Build everything, in this order (the guide and the docs read the shell, so build it first). Each builder writes
both languages:

```bash
cd web/site && pnpm install && node build.mjs && node --test test/ && cd ../..
python3 web/site/guide/build.py
go run scripts/docsgen/main.go -src KOMANDO/docs/features -out web/site/docs
python3 -I web/deploy/test_build_dist.py && python3 -I web/deploy/build_dist.py
(cd scripts/docsgen && gofmt -l . && go vet main.go main_test.go && go test main.go main_test.go)
```

A Meridian upgrade is a version bump in `package.json` and `pnpm-workspace.yaml`, then the same commands.

## Draft pages (switched off)

Rows W28 and W32 (efolusi/komando#53, #58). The Mac download, privacy, support and pricing pages are drafts in `content/drafts/`, in both languages. They are not in the navigation, not in the sitemap and not deployed: `build_dist.py` copies an allowlist and `content/` is not on it. `node build.mjs` renders them to `content/drafts/out/<lang>/<page>.html`, only so a reviewer can open them (noindex, a visible "Draft" banner, every open point shown as TODO).

| File | Holds |
|---|---|
| `content/drafts/config.json` | One place for the state: `switchedOn`, `downloadHost` (`komando.efolusi.com`, the product domain, row O19), `feedPath` and `archivePath` (the path convention on that host, rows M21 and M38), `minMacOS`, and `macApp` (`released`, `version`, `sha256`, `releaseNotesUrl`) |
| `content/drafts/copy.en.mjs`, `copy.id.mjs` | The copy, block for block in both languages |
| `content/drafts/render.mjs` | The renderer `build.mjs` calls |
| `web/deploy/check_download.py` | The CI check: while off, nothing names the drafts and no fake version or checksum is in `config.json`; once switched on, the version, checksum, host, an empty TODO list and a real archive with the named sha256 are required |

Until the apps can be downloaded the download page says only that they are built and in testing and need an Apple Developer account first: no date, no link. The privacy text is copied from the apps repo's `PRIVACY.md`; the pricing text from `plans.md` ("What always stays free"). No price is named (row O03 is open).

The links inside the drafts (the home page, the guide and docs, the language switch) are relative and written for the current depth, `content/drafts/out/<lang>/`. They work when you open the built files there, and break if a page moves to another folder, so check them again when the pages are switched on and given their real addresses.

To switch on, after review: fill `config.json` (released, version, sha256, release notes), clear every TODO, add the pages to `build_dist.py`'s allowlist and to the navigation, then run `python3 -I web/deploy/check_download.py`.

From then on the footer also shows efolusi.com's Platform terms, Privacy notice and Status (`content/home.*.mjs`, `shell.footer.legal`).

## Social card

`share.jpg` (1200 by 630, the og and Twitter image) is drawn from `brand/share-card.html`: the Komando mark, the home headline, no version number. To change it, edit that file and render it with headless Chrome, then convert to JPEG:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=1 --window-size=1200,630 --screenshot=/tmp/card.png "file://$PWD/web/site/brand/share-card.html"
sips -s format jpeg -s formatOptions 90 /tmp/card.png --out web/site/share.jpg
```

## Docs groups

The docs home and the side navigation group the pages in the same order, in both languages (plan: brainOS `komando/2026-11-21-docs-grouping-plan.md`):

- **Command line:** the sections in `sections` in `scripts/docsgen/main.go` (Start here, What komando manages, Safety and secrets, Reference). A page in no section stops the build, so a new feature page is placed on purpose. The section names are translated in `i18n/docs.id.json`.
- **Apps:** the user guide (`/guide/`, URLs unchanged), shown on the docs home and in the side navigation under "Apps". The guide home is the Apps landing: it names the apps, says they are built and in testing with no download link and no date, and points to four pages (`START` in `guide/build.py`). It has no download link and no date.
- **Breadcrumbs:** `Docs > Apps > Page` on every guide page (`Docs > Apps` on the landing) and `Docs > Group > Page` on every docs page except the docs home. One `nav` with an ordered list, the last item `aria-current="page"`; `breadcrumb` in `guide/build.py` and in `scripts/docsgen/main.go`, styled by `.g-crumbs` in `guide/guide.css`. The label is translated ("Breadcrumb", "Jejak navigasi").
- **Agent skill:** `docs/src/agent-skill.md` and `.id.md`, in the Reference section after `settings`. Written only from the `docs/features` pages at the commit the docs name (`install`, `safety`, `settings`, `security-standards`, `output`); the English feature pages cannot link to it, so the docs home lead and `getting-started` do.
- **Cloud plan:** `docs/src/cloud-plan.md` and `.id.md`. The plan is not live: the page says so and names no price or date. Write the real pages at private beta.

## Languages

English is at `/`, Indonesian at `/id/`. Same slugs, so a switch between languages is one prefix
(`/guide/vpn/` and `/id/guide/vpn/`). Page list: `i18n/page-map.md`.

- **Twin rule.** A page is built in Indonesian only when it has an Indonesian source: the home page
  (`content/home.id.mjs`), a guide page with `guide/src/<slug>.id.md`, a docs page with `docs/src/<slug>.id.md`. A page
  without a twin is not built under `/id/`. A link to it from an Indonesian page goes to the English page. Its own
  language switch goes to the Indonesian docs home, which says the other pages are English.
- **Every page** has `<html lang>`, a canonical link, and `hreflang` links: `en` and `x-default` (the English page), and
  `id` when the twin exists. The shell header carries one language switch, the short code of the other language (`ID` or `EN`, a 44 px target); the footer
  keeps the full name as a text link. Both are named in the language they go to and carry `hreflang` (row W46).
- **Anchors.** An Indonesian page keeps its English page's heading anchors, heading by heading, so a link such as
  `/guide/log-in/#make-or-import-a-key` works in both languages. The build stops if the two sources have a different
  number of headings. Keep every Indonesian source heading for heading with its English page.
- **Words.** Page titles, summaries, groups, the interface text the builders write and the guide's "coming" list are in
  `i18n/guide.id.json` and `i18n/docs.id.json`; the home page's and the shell's are in `content/home.id.mjs`. A string
  that is missing stops the build: an Indonesian page never falls back to English.
- **Stays as it is** in both languages: product names, commands, flags, file names, error codes, and the app's own button
  and menu names (the drawn app screens are the app's English interface; only their description for screen readers and
  the few lines `content/home.id.mjs` names are Indonesian. The Upgrade sheet is drawn wholly in Indonesian on the
  Indonesian page, because the app has no such screen yet: its words are the editions table's, row W59).
- **Releases.** `set_release.py` writes the tag and the install script's sha256 into both home pages and both first guide
  pages. Check the version numbers in the Indonesian copy against the release (`i18n/page-map.md`).
- A new language is a new folder beside `id/`, its `_shell/<lang>/` and word files; nothing else is hard-wired to two.

## Where the facts come from

| On the page | Source of truth |
|---|---|
| Latest release (hero and Install), the tag in the install one-liner and its script's sha256 | Written in at release time, never fetched by the page: `python3 -I web/deploy/set_release.py vX.Y.Z` writes the tag and sha256 into `content/home.en.mjs` and swaps the tag in every `data-release` element of `index.html` (the one-liner runs `install.sh` from that tag, not `main`, and pins it with `KOMANDO_VERSION=<tag>`, so it installs exactly that release), writes the sha256 of that tag's `install.sh` into `data-install-sha`, does the same in `guide/src/first-ten-minutes.md`, and rebuilds the guide. Run it with each komando release, in a site pull request; the steps up to the live page are "Release" in the repository `README.md`, and `web/deploy/check_release.py --live` checks the live page. The install script (from sgnd/komando#183 on) checks that the release is signed with the komando project's key, as `komando update` does, and installs nothing otherwise; the page says so only once the tag it names holds that script |
| The release marker in every page's head, `<meta name="release" content="<full git sha>">` | Written at build time by `web/deploy/build_dist.py`, never committed: `GITHUB_SHA` in CI (on a `v*` tag it is the tag's commit) or `git rev-parse HEAD` of the checkout. `curl -s https://komando.efolusi.com/ \| grep 'name="release"'` shows which commit is live, as `GET /healthz` does for the APIs |
| Every `komando …` command | `komando schema` (v0.13.0): every command and flag on the page checked against it on 2026-11-13 |
| Go version for `go install` | `go.mod` in sgnd/komando (`go 1.27.4`) |
| Apps: free, everything local; the upgrade (sync, teams, built-in AI, phone approval) coming, not built, no price, no buy link | The owner's decision of 2026-11-12. The apps implement it on their branches: Mac `bfe3f07` (no trial, one Upgrade sheet, no Buy link), iPhone and iPad `3a6e85c` and `aa04a63` (an Upgrade section, nothing for sale), and `docs/product.md` `afe7d6c` |
| Agent: ⌘J, Agent tab on iPhone, Claude Opus 5.5, own API key, asks before a change | `Sources/KomandoKit/Agent`, `Sources/Komando/Shell/RootView.swift`, `Apps/iOS/.../Screens.swift` |

## Waiting on the owner

1. **The upgrade's name, price and how it is bought**, once it is built. The page lists it as coming, with no price
   and no link. The CLI's sync design (`docs/design/sync-security.md`, decision 4) says it is sold only through Apple
   in-app purchase.
2. **Downloads for the apps**: where Komando for Mac comes from (Developer ID outside the store, as the sync design
   says) and the App Store link for iPhone and iPad. The page has no download link for either yet.
3. **Privacy policy and terms**, before the page collects anything (an email form, a checkout).
4. **Marketing fonts**: the move to Meridian replaces Instrument Sans and DM Mono (owner, 2026-11-13) with
   Meridian's Figtree, Bricolage Grotesque and JetBrains Mono. Keep Meridian's, or keep the old pair as a brand
   override (`guidelines/theming.md`).

## Decided

- **Page titles** (sweep row W45, 2026-11-27): the home page is `Komando · <tagline>`; every other page is `<Page> · Komando`, and a docs or guide page puts its section before the product (`Servers · Docs · Komando`, `Servers · User guide · Komando`), because the two parts share page names. The docs home is `Docs · Komando`, the guide home `User guide · Komando`. Indonesian: `Dokumentasi`, `Panduan pengguna`.
- **Footer** (W48): `© <year> PT Efolusi Dunia Teknologi. All rights reserved.` (Indonesian `Hak cipta dilindungi.`), as efolusi.com. The year is worked out by `build.mjs` (`YEAR`); the pages are committed, so rebuild in January. Platform terms, Privacy notice and Status (efolusi.com's pages and status page) show in the footer only when `content/drafts/config.json` has `switchedOn: true`.
- **Not-found pages** (W43, W68): `404.html` and `id/404.html`, with `"not_found_handling": "404-page"` in `wrangler.jsonc`. Cloudflare serves the nearest one up the path, so `/id/...` gets the Indonesian page. Since Meridian 2.6.0 each is Meridian's shared 404 page (MD110), both languages in each file (the page's own first), as the shared file has them: the Komando mark, one link home per language, one stylesheet (`assets/meridian/styles.css`), no script, no `<style>`, no `style` attribute, light or dark from the system (no theme script). It has no header, footer or Docs link any more. `build.mjs` writes both from `notFound` in `content/home.*.mjs`. Every address in them starts at the root, they carry `noindex` and are not in the sitemap.
- **Button sizes** (W44): Meridian's, none of our own. Header action `md`, hero main action `xl` and second action `lg`, Copy `md`.
- **Meridian 2.5.0** (W44 and the second W42 bump, 2026-11-27): `data-shape="pill"` is on the `html` element of every page (the four builders and the drafts renderer), so buttons, tags and badges are pills and fields are 16 px; the site draws none of that. Page titles of the guide and the docs are `ef-page-title`, the "Coming" and "In testing" markers are Meridian's warning Badge, the agent names are Meridian's Tag, links in running text are Meridian's classless anchors (underlined by Meridian). The site has no `--ember-*` token, no text field and no forced-colors rule. Stays: the underline of the breadcrumb and the contents list (navigation lists, not running text) and the drawn app screens (`.kmd`) with the apps' own pill and blue.
- **Meridian 2.5.1** (W52, 2026-11-28): classless links in `li`, `td`, `caption`, `label` and the Alert description are underlined by Meridian too, so the site's own `li` and `td` underline rule in `guide.css` is deleted. The site has no `Input`, so the password reveal change does not apply.
- **Meridian 2.5.2** (W55, 2026-11-28): the link underline no longer reaches classless links inside `nav`, `role=navigation`, `menu`, `menubar`, `tablist` and `toolbar` (a defect of 2.5.1). The side navigation sits in a `nav`, so the site's `.g-side li a` rule is deleted. Links in running text are still underlined.
- **Meridian 2.6.0** (W68, 2026-11-28): the theme toggle is Meridian's (no border at rest, one size with the menu button and the language link, fill on hover only where a pointer can hover, MD132), so the `.ef-theme-toggle` block in `site.css` and tests 1, 2 and 5 of `test/theme-toggle.test.mjs` (W67) are deleted. The 404 pages are Meridian's shared page (see Not-found pages). Measurements and the in-place table: brainOS notes `komando/research/2026-11-28-w68-site-2-6-0/note.md`.
- **Language switch** (W46, 2026-11-28): Meridian 2.5.2 has no language switch component, only `SiteHeader`'s `languageSwitch` link, so the header link shows `shell.switch.short` (`ID`, `EN`) and `site.css` makes it a 44 px wide target. Its accessible name starts with the visible code (`ID: Baca halaman ini dalam bahasa Indonesia`, WCAG 2.5.3). Undo: set `short` to the full name. The footer link stays the full name.
- **Footer** (W48, 2026-11-28): checked, nothing left to build: wording, entity and the computed year are in `build.mjs`; efolusi.com's legal links stay behind the draft pages switch, as the row says.
- **Side list** (W58, 2026-11-28): under `pointer: coarse` each link of the page list is at least `--tap-min` (44 px) high, at every width; a mouse keeps the compact list.
- **Dashes** (W60, 2026-11-28): `scripts/docsgen` writes a number range such as `4–43` as `4 to 43` (`sampai` on an Indonesian page) and stops on any other en or em dash in a source, naming its line.

- **Fonts** (owner, 2026-11-13): the app screens drawn on the page (`.kmd`) use the system fonts like the apps
  (`-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif` and `ui-monospace, "SF Mono", Menlo,
  monospace`, from `design/tokens.json`). On a device without SF Pro the screens fall back to that system's own UI
  font. The marketing text uses Meridian's fonts (see Waiting on the owner, 5).
- **Domain** (owner, 2026-11-18): `https://komando.efolusi.com`, a subdomain of efolusi.com. The home page, the
  guide and the docs carry `<link rel="canonical">` and an absolute `og:image` on it (`SITE_URL` in
  `guide/build.py`, `siteURL` in `scripts/docsgen`).
- **Hosting** (owner, 2026-11-18): a Cloudflare Worker with static assets, on `komando.efolusi.com`, deployed from
  `main` only. See "Git and deploy".

- **Meridian** (Web coordinator, 2026-11-20, issues #5 and #7): the site is built on `@efolusi/meridian`, as the
  owner's rule for product pages asks. Decision note: brainOS `05-Knowledge/03-Business/Efolusi/komando/2026-11-20-site-on-meridian-decision.md`.

## Git and deploy

The site lives in `efolusi/komando`, under `web/site/`. It deploys as a Cloudflare Worker with static assets
(`wrangler.jsonc`, Worker `komando`, custom domain `komando.efolusi.com` only, no Worker script) from a `v*` tag on
`main` (`.github/workflows/deploy-site.yml`). Never serve `web/site` itself; serve what `web/deploy/build_dist.py`
writes to `web/dist/`:

- It copies only what a visitor needs (an allowlist: `index.html`, `404.html`, `favicon.svg`, `share.jpg`, `assets/`,
  the guide and the docs pages and their CSS, and the same pages under `id/`, `id/404.html` among them). `build.mjs`, `content/`, `_shell/`, `glyphs/` (inlined into the pages at build time), `test/`, `node_modules/` and the
  notes stay behind. Hidden files and symbolic links are refused.
- It puts the release marker in the head of every page (see "Where the facts come from"), checks that each page has
  exactly one, and writes `sitemap.xml` (every page but the two not-found pages, with `hreflang` alternates for the pages that exist in both
  languages) and `robots.txt` (everything allowed, the sitemap's address).
- It writes `_headers`: a Content-Security-Policy whose `script-src` is `'self'`, Cloudflare's analytics beacon and
  the sha256 of every inline script, worked out at each build (the site has none: Meridian's `theme-init.js` is a
  same-origin file in the head, so `'self'` covers it and no Meridian release can make a hash stale); `frame-ancestors 'none'`, HSTS, `nosniff`, a strict referrer policy and `Cache-Control: no-cache` for
  `/assets/*` (the browser asks on every use; an unchanged file costs a 304). Nothing loads from a CDN: Meridian's CSS and fonts are served from `assets/meridian/`. `style-src` is
  `'self'` only: no page has a `style="..."` attribute or a `<style>` element, and the build stops when one does.

Check it locally with `npx wrangler@4.164.0 dev` after `build_dist.py`.
