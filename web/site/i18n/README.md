# Indonesian site copy

Sources for the Indonesian tree of komando.efolusi.com (gap W02). The pages are built under `/id/`; how is in "Languages" of `../README.md`.

- `page-map.md`: every page, its English path and its Indonesian path.
- `home.id.md`: the Indonesian copy of the home page, section by section, in the order of `index.html`. `content/home.id.mjs` is its built form.
- `guide.id.json`: the words of the guide's Indonesian pages: titles, summaries, groups, interface text and the "coming" list.
- `docs.id.json`: the same for the docs.

The guide and the docs get their Indonesian sources beside their English ones (`guide/src/*.id.md`, `docs/src/*.id.md`), built by `guide/build.py` and `scripts/docsgen`.
