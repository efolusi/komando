# komando site

The website of komando at <https://komando.efolusi.com>: the home page, the user guide and the command line docs.
It is static HTML served by the Cloudflare Worker `komando` (`wrangler.jsonc`).

- `web/site/`: the pages. How they are built and where each fact comes from: `web/site/README.md`.
- `web/deploy/`: `build_dist.py` writes `web/dist` and its `_headers`; `set_release.py` writes a komando release into the pages.
- `scripts/docsgen/`: builds the command line docs from komando's `docs/features`.

The komando command line is at <https://github.com/sgnd/komando>.

## Develop

```bash
python3 -m http.server 8767 --bind 127.0.0.1 --directory web/site
python3 -I web/deploy/test_build_dist.py
python3 -I web/deploy/build_dist.py
```

## Deploy

`.github/workflows/deploy-site.yml` deploys from a `v*` tag on `main`, with the `CLOUDFLARE_API_TOKEN` secret and the
`CLOUDFLARE_ACCOUNT_ID` variable of the `production` environment. Every change reaches `main` through a pull request.

## License

Efolusi Reference License, see [LICENSE](LICENSE). You may read this site and run it locally as a sample of Meridian. You may not copy it into another product. The product name and logo are not part of that grant. Meridian itself remains Apache-2.0.
