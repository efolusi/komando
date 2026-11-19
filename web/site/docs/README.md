# komando docs

How to use the komando command line, one page per feature. The pages are static HTML in this folder, built by
`scripts/docsgen` (Go, standard library only). The site still needs no build step to serve: the built pages are
committed.

## Where the pages come from

| Path | Source |
|---|---|
| `/docs/` | made by `scripts/docsgen`: one card per page, in the order of the "Every feature" table in komando's `docs/features/README.md` |
| `/docs/getting-started/`, `/docs/switch-from-termius/` | `src/getting-started.md`, `src/switch-from-termius.md`, this site's own pages, written only from komando's docs and README |
| `/docs/<feature>/` | `docs/features/<feature>.md` in sgnd/komando, read only; each page names the commit it was built from |

A section inside a page has an anchor made the way GitHub makes it, so the feature pages' own `#links` keep working.

## Build and check

From the repository root. `KOMANDO` is your checkout of sgnd/komando:

```bash
go run scripts/docsgen/main.go -src KOMANDO/docs/features -out web/site/docs
```

It builds every page, then checks every internal link and anchor of the docs (a link that starts with `/` counts as
broken, because the domain is not decided). `-check` only checks. Edit `src/*.md` or the feature pages in sgnd/komando,
never the built `index.html` files. Build again after each komando release, so the docs match it.

`docs.css` adds code blocks, tables and `####` headings to the guide's reading layout (`guide/guide.css`).
