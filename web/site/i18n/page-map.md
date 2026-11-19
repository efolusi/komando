# Page map

The site has 74 pages. Each gets an Indonesian twin under `/id/`. Paths keep the English slugs, so a switch between languages is one prefix.

| Page | English | Indonesian | Built by | Source |
|---|---|---|---|---|
| Home | `/` | `/id/` | hand-written | `index.html`, `i18n/home.id.md` |
| User guide home | `/guide/` | `/id/guide/` | `guide/build.py` | `guide/src/README.md` |
| User guide pages (26) | `/guide/<slug>/` | `/id/guide/<slug>/` | `guide/build.py` | `guide/src/<slug>.md`, `guide/src/<slug>.id.md` |
| Docs home | `/docs/` | `/id/docs/` | `scripts/docsgen` | komando `docs/features/README.md` |
| Docs feature pages (28) | `/docs/<slug>/` | `/id/docs/<slug>/` | `scripts/docsgen` | komando `docs/features/<slug>.md`, Indonesian twin in `docs/src/<slug>.id.md` |
| Docs site pages (2) | `/docs/getting-started/`, `/docs/switch-from-termius/` | `/id/docs/...` | `scripts/docsgen` | `docs/src/<slug>.md`, `docs/src/<slug>.id.md` |
| 404 | (Worker default) | (Worker default) | none yet | add one page per language with W01 |

Rules for the build:

- `<html lang="en">` on English pages, `<html lang="id">` on Indonesian ones; every page links its twin with `<link rel="alternate" hreflang>`.
- The header carries a language switch that keeps the path (`/guide/vpn/` and `/id/guide/vpn/`).
- Commands, flags, file names and error codes stay as they are in both languages; only the prose is translated.
- The sitemap lists both trees.
