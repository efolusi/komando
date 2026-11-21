# Page map

The site has 55 pages (counted 2026-11-21: home 1, guide 25, docs 29). Every page has an Indonesian twin under `/id/` (55 pages in all). Paths keep the English slugs, so a switch between languages is one prefix.

| Page | English | Indonesian | Built by | Source |
|---|---|---|---|---|
| Home | `/` | `/id/` | `build.mjs` | `content/home.en.mjs`, `content/home.id.mjs` (from `i18n/home.id.md`) |
| User guide home | `/guide/` | `/id/guide/` | `guide/build.py` | `PAGES` in `guide/build.py`, `i18n/guide.id.json` |
| User guide pages (24) | `/guide/<slug>/` | `/id/guide/<slug>/` | `guide/build.py` | `guide/src/<slug>.md`, `guide/src/<slug>.id.md` (the "What is coming" page: `COMING` in `guide/build.py`, `i18n/guide.id.json`) |
| Docs home | `/docs/` | `/id/docs/` | `scripts/docsgen` | komando `docs/features/README.md`, `i18n/docs.id.json` (the Indonesian home lists the pages that have a twin) |
| Docs feature pages (26) | `/docs/<slug>/` | `/id/docs/<slug>/` | `scripts/docsgen` | komando `docs/features/<slug>.md`, Indonesian twin in `docs/src/<slug>.id.md` |
| Docs site pages (2) | `/docs/getting-started/`, `/docs/switch-from-termius/` | `/id/docs/getting-started/`, `/id/docs/switch-from-termius/` | `scripts/docsgen` | `docs/src/<slug>.md`, `docs/src/<slug>.id.md` |
| 404 | (Worker default) | (Worker default) | none yet | add one page per language with W01 |

Rules for the build:

- `<html lang="en">` on English pages, `<html lang="id">` on Indonesian ones; every page links its twin with `<link rel="alternate" hreflang>`, plus `hreflang="x-default"` pointing to the English page. A page without a twin names no Indonesian alternate.
- The header and the footer carry a language switch that keeps the path (`/guide/vpn/` and `/id/guide/vpn/`). On an English page without a twin it goes to the Indonesian docs home.
- An Indonesian page keeps the heading anchors of its English page.
- Commands, flags, file names and error codes stay as they are in both languages; only the prose is translated.
- The sitemap (`sitemap.xml`, written by `web/deploy/build_dist.py`) lists both trees, with `hreflang` alternates on every page that exists in both.
- Check the version numbers in the copy (v0.15.0, Go 1.27.4, Claude Opus 5.5) against the release at publish time.
