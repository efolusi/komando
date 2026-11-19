# komando website

One static page, `index.html`, for the free komando command line and the free Komando apps. No build
step: open it through any static file server (the page loads ES modules, so `file://` does not work).

```bash
python3 -m http.server 8767 --bind 127.0.0.1 --directory web/site
```

## The user guide

`guide/` holds the Komando user guide, one page per task (`/guide/add-a-host/` and so on), built from Markdown by
`guide/build.py`, which also checks every internal link of the site. Its paths, the one list of parts that are not
built yet, and the screenshot files it asks for are in `guide/README.md`. The home page links to it from the
Product menu and the footer.

## The command line docs

`docs/` holds the komando command line docs, one page per feature (`/docs/getting-started/` and so on), built by
`scripts/docsgen` from komando's `docs/features` plus two pages of this site's own. How to build them and where each
page comes from is in `docs/README.md`. The home page links to them from the nav and the footer.

## Where the facts come from

| On the page | Source of truth |
|---|---|
| Latest release (hero and Install), the tag in the install one-liner and its script's sha256 | Written in at release time, never fetched by the page: `python3 -I web/deploy/set_release.py vX.Y.Z` swaps the tag in every `data-release` element of `index.html` (the one-liner runs `install.sh` from that tag, not `main`, and pins it with `KOMANDO_VERSION=<tag>`, so it installs exactly that release), writes the sha256 of that tag's `install.sh` into `data-install-sha`, does the same in `guide/src/first-ten-minutes.md`, and rebuilds the guide. Run it with each komando release and commit what it changed. The install script (from sgnd/komando#183 on) checks that the release is signed with the komando project's key, as `komando update` does, and installs nothing otherwise; the page says so only once the tag it names holds that script |
| Every `komando …` command | `komando schema` (v0.13.0): every command and flag on the page checked against it on 2026-11-13 |
| Go version for `go install` | `go.mod` in sgnd/komando (`go 1.27.4`) |
| Apps: free, everything local; the upgrade (sync, teams, built-in AI, phone approval) coming, not built, no price, no buy link | The owner's decision of 2026-11-12. The apps implement it on their branches: Mac `bfe3f07` (no trial, one Upgrade sheet, no Buy link), iPhone and iPad `3a6e85c` and `aa04a63` (an Upgrade section, nothing for sale), and `docs/product.md` `afe7d6c` |
| Agent: ⌘J, Agent tab on iPhone, Claude Opus 5.5, own API key, asks before a change | `Sources/KomandoKit/Agent`, `Sources/Komando/Shell/RootView.swift`, `Apps/iOS/.../Screens.swift` |

## Checks (2026-11-15, after the quality review of 2026-11-14)

- design-taste-frontend finish gate: `GATE: OPEN 2` after three rounds. The two open FAILs are `kit-edited` on
  `assets/system.js` (forms post only to the site's own origin) and `assets/diagrams/diagram.js` (diagram icons
  parsed as SVG and cleaned with an allowlist): the security hardening of 2026-11-14, kept on purpose; the gate
  never waives a kit edit. Two waivers apply (`no-visual` on #install, `one-section` on the agent's app frame), each
  with its reason in `.taste-skill/waivers.json`; the stale scroll-reveal waiver is gone. `check.mjs` has no
  findings at 1440x900, 1280x800, 1024x768, 820x1180, 768x1024 and 390x844.
- copy-lint: 0 FAIL, 0 WARN (the sample-company names left with the database mock). INFO: seven lists of three,
  all real lists of targets or tools.
- perf: 0 FAIL; layout shift 0.000; no broken request; the page makes no request to another origin.
- Keyboard: a real Tab from Product lands in its menu at once (the 150 ms hover delay no longer applies to focus).
- Copy buttons clicked: the status line says "Copied" or, where the browser blocks the clipboard, selects the line
  and says how to copy it.
- Guide: dark mode follows the system setting; 0 broken links over 25 pages.

## Home page design round (2026-11-17)

`consistency.mjs` at 1440, 1024, 820, 768 and 390 (rhythm at 1440, 820, 768, 390): 45 FAIL, 98 WARN (main before: 56 FAIL,
97 WARN, measured without the 820 rhythm). Every section is one or two whole screens at 1440, 768 and 390; one is left
at 820. The page is 12 screens on a phone (was 12.5).

Owner's yes (2026-11-17): on a phone #one-command lists three of its six lines, the agent's picture ends after the
approval card, and the Upgrade sheet shows its first rows and fades out; on a desktop the install check sits in two
columns. The kit's 64px closing button stays.

Waivers (`.taste-skill/waivers.json`, git-ignored, so they are written here too; the gate allows five):

| Check | Where | Why |
|---|---|---|
| one-section | the agent's app frame | the app-frame recipe: the window holds no heading |
| no-visual | #install | the platforms' real icons on a flat band; no picture by decision |
| button-styles | the closing button | owner: keep the kit's 64px `.btn--xl` |
| split-pair | the hero's app window | the window sits inset on its own sage ground by design |
| off-grid | `ul.swap` code lines | the `$ ` prompt is on the page margin; the check measures the text after it |

Also accepted by the owner, not in the file (it would be a sixth): container-edges on the inventory legend at 390,
which sits inside its frame. Still open and not waived: the #features gap on a tablet (hole), section-gaps,
the inventory diagram's scroll-reveal (the kit's own diagram), the #agent cover's flush, and the #editions empty
area at 820 (two screens there for 1.2 screens of content).

## Waiting on the owner

1. **The upgrade's name, price and how it is bought**, once it is built. The page lists it as coming, with no price
   and no link. The CLI's sync design (`docs/design/sync-security.md`, decision 4) says it is sold only through Apple
   in-app purchase.
2. **Downloads for the apps**: where Komando for Mac comes from (Developer ID outside the store, as the sync design
   says) and the App Store link for iPhone and iPad. The page has no download link for either yet.
3. **Privacy policy and terms**, before the page collects anything (an email form, a checkout).
4. **Footer owner name**: `© 2026 Komando`, or the company (PT Efolusi Dunia Teknologi).
5. **Sage ground** behind the app screens is the skill's lit ground, not a design-system color. Keep it, or use
   `K.window` (`#f3f3f1`).

## Decided

- **Fonts** (owner, 2026-11-13): the app screens drawn on the page (`.kmd`) use the system fonts like the apps
  (`-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif` and `ui-monospace, "SF Mono", Menlo,
  monospace`, from `design/tokens.json`). The marketing text keeps Instrument Sans and DM Mono. On a device without
  SF Pro the screens fall back to that system's own UI font.
- **Domain** (owner, 2026-11-18): `https://komando.efolusi.com`, a subdomain of efolusi.com. The home page, the
  guide and the docs carry `<link rel="canonical">` and an absolute `og:image` on it (`SITE_URL` in
  `guide/build.py`, `siteURL` in `scripts/docsgen`).
- **Hosting** (owner, 2026-11-18): a Cloudflare Worker with static assets, on `komando.efolusi.com`, deployed from
  `main` only. See "Git and deploy".

## Git and deploy

**Git: the site lives in `efolusi/komando`, under `web/site/`** (moved from the apps repo on 2026-11-14, then from `efolusi/komando-cloud` on 2026-11-19; the history before the web-only split is not kept). The app screens on the page are drawn from the apps repo's `design/` (Page
cards, `tokens.json`) and the facts from `docs/product.md` and `Editions.swift`; one repo lets one pull request
change the product and the page together, and lets a test later check the page's feature table against
`Editions.swift`. A separate repo only pays off if the site gets other contributors or a CMS.

At the merge, `.gitignore` gets:

```
web/site/.taste-skill/
web/site/shots/
```

(`.taste-skill/` is checker state, `shots/` generated screenshots.) The unused kit parts are pruned from
`web/site/assets/` (`effects/`, `scenes/`, `objects/`, `photos/`, `components/`, `starter.html`, the `ui-*.svg` glyphs
and the icon demo): about 28 MB, nothing on the page asked for them. A second pass (2026-11-12) removed the kit's
demo and lab pages, its stock photos (`layout/img/`, `moments/_demo/`) and the hero samples, about 7 MB; the
scripts and styles the page loads stay.

**Deploy: a Cloudflare Worker with static assets** (owner, 2026-11-18: web frontends deploy as Workers).
`wrangler.jsonc` at the repo root names the Worker `komando` and serves `web/dist` with no Worker script, on the
custom domain `komando.efolusi.com` only. `.github/workflows/deploy-site.yml` deploys from a `v*` tag on `main` (or a manual run on such a tag)
on the self-hosted `efolusi-cd` runner:

```bash
python3 -I web/deploy/build_dist.py
npx wrangler@4.164.0 deploy
```

Never serve `web/site` itself: it also holds notes (`README.md`, `guide/README.md`), the guide's sources
(`guide/build.py`, `guide/src/`) and, on a working machine, the checker state (`.taste-skill/`) and `shots/`. Serve
the output folder that one command makes:

```bash
python3 -I web/deploy/build_dist.py      # writes web/dist/ (git-ignored)
```

- It copies only what a visitor needs: `index.html`, `favicon.svg`, `share.jpg`, `glyphs/`, `assets/`, the docs (`docs/index.html`, `docs/<page>/index.html`, `docs/docs.css`), the guide
  pages (`guide/index.html`, `guide/<page>/index.html`) and `guide/guide.css`. Hidden files are never copied.
- It deletes and remakes the output folder, so it refuses a folder that is not empty and is not its own earlier
  output (one with `_headers` in it).
- It stops with an error when a file that must never be served would land in the output (Markdown, Python, the
  guide's `src/`, `shots/`, a hidden file, a full demo page under `assets/`).
- It writes `web/dist/_headers` (Cloudflare Workers static assets read it; there is no hand-written copy in `web/site`, because the
  policy holds the inline script hashes of each build): a Content-Security-Policy with `frame-ancestors 'none'`,
  `Strict-Transport-Security: max-age=63072000` (no `includeSubDomains`: the efolusi.com zone holds other hosts), `nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Cross-Origin-Opener-Policy: same-origin`, a `Permissions-Policy` that turns off the camera, the
  microphone and the location, and a one-week cache for `/assets/*`.
- The policy lets scripts run only from the site itself, plus each inline `<script>` by its sha256 hash. The script
  works the hashes out at every build, so editing an inline script (or rebuilding the guide) needs no hand edit.
  JSON data blocks need no hash. No other origin is allowed: the fonts are served from `assets/fonts/`, and the page
  fetches nothing: `connect-src` is `'self'` only (the release number is written in by `set_release.py`). Styles also allow `'unsafe-inline'`: the home page has `<style>` blocks
  and about 40 `style="..."` attributes on its app screens, which hashes cannot cover in every browser.
- No Trusted Types (`require-trusted-types-for 'script'`), on purpose (2026-11-15): five kit scripts write `innerHTML`
  (`system.js`, `diagrams/diagram.js`, `ui/ui.js`, `motion/motion.js`, `backgrounds/backgrounds.js`), only from
  same-origin constants and fragment files. Enforcing it means a policy in each of them (kit edits the finish gate
  refuses), or a pass-through `default` policy that trusts every string and protects nothing. Scripts stay locked
  to `'self'` and hashes.
- The build refuses a symbolic link anywhere in what it copies, so a committed link never publishes its target
  (`python3 -I web/deploy/test_build_dist.py` checks it).
- The asset cache is one week, not a year: the file names carry no version, so a longer cache would keep an old
  script after a change.

**Fonts are self-hosted** (owner's yes, 2026-11-15): `assets/fonts/` holds Instrument Sans (variable, width 75 to
100, weight 400 to 700) and DM Mono 400 and 500, the latin subset as Google Fonts serves it, with `fonts.css` and
the two licences (`OFL-InstrumentSans.txt`, `OFL-DMMono.txt`, SIL Open Font License 1.1). The licence files ship
with the fonts. `index.html` and `guide/build.py` link `assets/fonts/fonts.css` and preload the text font.

Test of the diagram icon cleaner (`assets/diagrams/diagram.js`, `cleanSvg`): serve `web/` and open
`/test/diagram-clean.html` (the steps are at the top of that file). It needs a real browser for `DOMParser`, and it
lives outside `web/site`, so it is never deployed.
