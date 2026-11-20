# komando website

The static site for the free komando command line and the free Komando apps: the home page, the user guide
(`guide/`) and the command line docs (`docs/`), built on the Meridian design system. The HTML is committed, so
serving the site needs no build step.

## How the pages are made

| Part | Made by | From |
|---|---|---|
| `index.html` | `build.mjs` (Node 26.13.1, pnpm 11.24.0) | `content/home.en.mjs` (the copy) and `content/screens/*.html` (the drawn app screens), rendered with Meridian's marketing components (`Hero`, `Section`, `SectionHead`, `FeatureGrid`, `FeatureCard`, `Marquee`, `SiteHeader`, `SiteFooter`, `ThemeToggle`) through `renderToStaticMarkup` |
| `_shell/en/head.html`, `header.html`, `footer.html` | `build.mjs` | the same components; `{{root}}` is the way up to `web/site/`, `data-nav="ID"` marks a link the builder sets `aria-current` on |
| `assets/meridian/` | `build.mjs` | copied from the pinned `@efolusi/meridian` package: `styles.css`, `components.css`, `landing.css`, `tokens/`, the fonts and the licence |
| `guide/<page>/index.html` | `guide/build.py` | `guide/src/*.md`, framed by the shell partials |
| `docs/<page>/index.html` | `scripts/docsgen` | komando's `docs/features` and `docs/src/`, framed by the shell partials |
| `assets/site.css` | by hand | the site's layer on Meridian's tokens, and the drawn app screens (`.kmd`) on the apps' own tokens |
| `assets/site.js` | by hand | the theme button (Light, Dark, System; `localStorage` `efolusi-theme`, cookie `efolusi_theme`), the header menu, the Marquee pause, the Copy buttons and the folding page list, following Meridian's `ThemeToggle`, `SiteHeader` and `Marquee`. It becomes an import once Meridian 1.27.0 ships these as plain scripts (MD14) |

Build everything, in this order (the guide and the docs read the shell, so build it first):

```bash
cd web/site && pnpm install && node build.mjs && node --test test/ && cd ../..
python3 web/site/guide/build.py
go run scripts/docsgen/main.go -src KOMANDO/docs/features -out web/site/docs
python3 -I web/deploy/test_build_dist.py && python3 -I web/deploy/build_dist.py
```

A Meridian upgrade is a version bump in `package.json` and `pnpm-workspace.yaml`, then the same commands.

## Where the facts come from

| On the page | Source of truth |
|---|---|
| Latest release (hero and Install), the tag in the install one-liner and its script's sha256 | Written in at release time, never fetched by the page: `python3 -I web/deploy/set_release.py vX.Y.Z` writes the tag and sha256 into `content/home.en.mjs` and swaps the tag in every `data-release` element of `index.html` (the one-liner runs `install.sh` from that tag, not `main`, and pins it with `KOMANDO_VERSION=<tag>`, so it installs exactly that release), writes the sha256 of that tag's `install.sh` into `data-install-sha`, does the same in `guide/src/first-ten-minutes.md`, and rebuilds the guide. Run it with each komando release and commit what it changed. The install script (from sgnd/komando#183 on) checks that the release is signed with the komando project's key, as `komando update` does, and installs nothing otherwise; the page says so only once the tag it names holds that script |
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
4. **Footer owner name**: `© 2026 Komando`, or the company (PT Efolusi Dunia Teknologi).
5. **Marketing fonts**: the move to Meridian replaces Instrument Sans and DM Mono (owner, 2026-11-13) with
   Meridian's Figtree, Bricolage Grotesque and JetBrains Mono. Keep Meridian's, or keep the old pair as a brand
   override (`guidelines/theming.md`).

## Decided

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

- It copies only what a visitor needs (an allowlist: `index.html`, `favicon.svg`, `share.jpg`, `glyphs/`, `assets/`,
  the guide and the docs pages and their CSS). `build.mjs`, `content/`, `_shell/`, `test/`, `node_modules/` and the
  notes stay behind. Hidden files and symbolic links are refused.
- It writes `_headers`: a Content-Security-Policy whose `script-src` is `'self'`, Cloudflare's analytics beacon and
  the sha256 of every inline script (only Meridian's theme init script, one hash for every page), worked out at
  each build; `frame-ancestors 'none'`, HSTS, `nosniff`, a strict referrer policy and a one-week cache for
  `/assets/*`. Nothing loads from a CDN: Meridian's CSS and fonts are served from `assets/meridian/`. Styles allow
  `'unsafe-inline'` for the `style="..."` attributes on the drawn app screens and Meridian's icons.

Check it locally with `npx wrangler@4.164.0 dev` after `build_dist.py`.
