# komando site

The website of komando at <https://komando.efolusi.com>: the home page, the user guide and the command line docs.
It is static HTML served by the Cloudflare Worker `komando` (`wrangler.jsonc`).

- `web/site/`: the pages. How they are built and where each fact comes from: `web/site/README.md`.
- `web/deploy/`: `build_dist.py` writes `web/dist` and its `_headers`; `set_release.py` writes a komando release into
  the pages; `check_release.py` says when the checkout or the live site names an older release (see "Release").
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

The deploy job, in order:

1. Refuses anything but a `v*` tag whose commit is on `main`.
2. Refuses a commit whose home page names an older komando release than the newest one
   (`check_release.py`; a failed GitHub lookup only warns).
3. Builds `web/dist` and deploys it.
4. Reads the live site (`check_release.py --live --sha <tag commit>`): it waits up to two minutes until both home pages
   (`/` and `/id/`) carry the tag's commit in `<meta name="release">`, then checks that they name the same release as
   the commit and that it is the newest one. A red last step means the deploy did not reach visitors, or the page lags.

The site's `v*` tags are the site's own numbers, one patch higher than the last site tag (`git tag --sort=-v:refname`).
They are not the komando release the page names: site tag `v0.16.2` shipped komando `v0.17.0`.

## Release

The komando release the site names lives in one place, `web/site/content/home.en.mjs` (`release` and `installSha`).
Only `web/deploy/set_release.py` writes it, and it writes the same tag into both home pages and both first guide pages.
The page never asks GitHub at build or visit time.

Checklist for each komando release (CLI tag `vX.Y.Z` in sgnd/komando), the same day, by the site coordinator:

1. The komando release `vX.Y.Z` is published (it is "Latest" on <https://github.com/sgnd/komando/releases>). The CLI
   coordinator tells the site coordinator that day.
2. In a site branch from `main`: `python3 -I web/deploy/set_release.py vX.Y.Z`. It reads that tag's `install.sh`, writes
   the tag and its sha256, and rebuilds the guide. Commit every file it changed, run the site checks
   (`web/site/README.md`) and open a pull request.
3. Merge it on green CI. "Site release check" on `main` turns green.
4. Tag `main` with the next site tag and push the tag. "Deploy site" deploys it and ends with the live check.
5. Done when that run is green. Check from outside at any time:

   ```bash
   python3 -I web/deploy/check_release.py --live
   ```

"Site release check" (`.github/workflows/site-release-check.yml`, not a required check) runs the same script: on each
push to `main` it checks the committed release; every day, and by hand (`gh workflow run site-release-check.yml`), it
checks the live site. Its message names the fix:

| The check says | Fix |
|---|---|
| the home page (or the live page) names `vA`, the newest komando release is `vB` | steps 2 to 4 with `vB` |
| the live page names `vA`, this checkout names `vB` | step 4: the release is merged, not deployed |
| `https://komando.efolusi.com/` serves commit `X`, not the deployed `Y` | the deploy did not reach visitors: run "Deploy site" again on the tag |

A lookup of the newest release that fails (no network, a rate limit) only warns, so a GitHub outage blocks nothing.
To go back to an older site, revert on `main` and tag again; the deploy refuses a commit that names an older komando
release than the newest one.
