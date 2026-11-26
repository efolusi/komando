"""Fail when the home page names an older komando release than the newest one, in the checkout or on the live site.

Run from the repository root:

    python3 -I web/deploy/check_release.py                        # the checkout
    python3 -I web/deploy/check_release.py --live                 # the live site
    python3 -I web/deploy/check_release.py --live --sha <commit>  # the live site, right after deploying <commit>

The release number in web/site/content/home.en.mjs is written at release time by set_release.py, together with the
sha256 of that tag's install.sh, and the install one-liner is pinned to it. This check asks the public GitHub API
(no token) for the newest release and exits 1 when the page names another one, so a page that lags is a red CI job,
never a quiet wrong number. A lookup that fails (no network, a rate limit, an answer that is not a version tag) only
prints a warning and exits 0: a GitHub outage must not block a site change.

--live reads both live home pages (/ and /id/ on https://komando.efolusi.com) and checks that every data-release
element on them names one tag, the tag of the checkout, and the newest release. With --sha it first waits (up to two
minutes) until both pages carry that commit in <meta name="release"> (build_dist.py writes it), so the deploy job can
prove the new build reached visitors. A live page that cannot be read is a failure. The steps of a release are
"Release" in README.md.
"""

import json
import re
import sys
import time
import urllib.request
from pathlib import Path

sys.dont_write_bytecode = True
REPO = Path(__file__).resolve().parents[2]
HOME = REPO / "web" / "site" / "content" / "home.en.mjs"
LATEST = "https://api.github.com/repos/sgnd/komando/releases/latest"
SITE = "https://komando.efolusi.com"
LIVE_PAGES = ("/", "/id/")
TAG = re.compile(r"^v\d+\.\d+\.\d+$")
# the text of every element whose start tag has data-release as its own attribute (as set_release.py finds them)
RELEASE_ELEMENT = re.compile(r"<[a-z]+\b[^>]*\sdata-release(?=[\s=/>])[^>]*>([^<]*)<")
RELEASE_META = re.compile(r'<meta name="release" content="([0-9a-f]{40})">')
USAGE = "usage: python3 -I web/deploy/check_release.py [--live [--sha <40-digit commit>]]"


def newest_release():
    request = urllib.request.Request(LATEST, headers={"Accept": "application/vnd.github+json", "User-Agent": "site-check"})
    with urllib.request.urlopen(request, timeout=8) as answer:
        tag = json.load(answer).get("tag_name", "")
    if not TAG.match(tag):
        raise ValueError(f"not a version tag: {tag!r}")
    return tag


def committed_release(home):
    found = re.search(r"export const release = '(v\d+\.\d+\.\d+)'", home.read_text())
    return found.group(1) if found else None


def lookup_newest(lookup):
    """Returns (the newest tag, None) or (None, why the lookup failed)."""
    try:
        newest = lookup()
        if not TAG.match(newest):
            raise ValueError(f"not a version tag: {newest!r}")
    except (OSError, ValueError, KeyError) as error:
        return None, str(error)
    return newest, None


def check(home, lookup):
    """The checkout. Returns (exit code, message)."""
    page = committed_release(home)
    if not page:
        return 1, f"{home} names no release (export const release = 'vX.Y.Z')"
    newest, error = lookup_newest(lookup)
    if error:
        return 0, f"WARNING: could not read the newest komando release ({error}); the page names {page}, not checked."
    if page != newest:
        return 1, (f"the home page names {page}, the newest komando release is {newest}: run "
                   f"python3 -I web/deploy/set_release.py {newest} and commit what it changes.")
    return 0, f"the home page names the newest komando release, {page}."


def fetch_live(fetch, expect_sha, tries=12, wait=10, sleep=time.sleep):
    """Reads every live home page. With expect_sha, reads again (tries times, wait seconds apart) until every page
    carries that commit, and returns what was served last. A page that still cannot be read on the last try raises."""
    for attempt in range(1, tries + 1):
        try:
            pages = {path: fetch(path) for path in LIVE_PAGES}
        except OSError:
            if expect_sha is None or attempt == tries:
                raise
        else:
            if expect_sha is None or all(served_sha(html) == expect_sha for html in pages.values()):
                return pages
            if attempt == tries:
                return pages
        sleep(wait)


def served_sha(html):
    found = RELEASE_META.search(html)
    return found.group(1) if found else None


def check_live(pages, committed, lookup, expect_sha=None):
    """The live site: pages maps each path to the HTML served. Returns (exit code, message)."""
    live = {}
    for path, html in pages.items():
        if expect_sha and served_sha(html) != expect_sha:
            return 1, (f"{SITE}{path} serves commit {served_sha(html)}, not the deployed {expect_sha}: the deploy did "
                       "not reach visitors; run Deploy site again on the tag.")
        tags = set(RELEASE_ELEMENT.findall(html))
        if len(tags) != 1:
            return 1, f"{SITE}{path} should name one komando release in its data-release elements, it names {sorted(tags)}."
        live[path] = tags.pop()
    if len(set(live.values())) != 1:
        return 1, f"the live home pages name different releases: {live}."
    page = next(iter(live.values()))
    if page != committed:
        return 1, (f"the live page names {page}, this checkout names {committed}: the release is merged, not "
                   "deployed; tag main with the next site tag (README.md, \"Release\").")
    newest, error = lookup_newest(lookup)
    if error:
        return 0, f"WARNING: could not read the newest komando release ({error}); the live page names {page}, not checked."
    if page != newest:
        return 1, (f"the live page names {page}, the newest komando release is {newest}: run "
                   f"python3 -I web/deploy/set_release.py {newest} in a site pull request, merge it, then tag main "
                   "with the next site tag (README.md, \"Release\").")
    return 0, f"the live page names the newest komando release, {page}."


def fetch_page(path):
    # a query that changes every call, so no cache between here and the Worker answers for it
    url = f"{SITE}{path}?release-check={time.time_ns()}"
    request = urllib.request.Request(url, headers={"User-Agent": "site-check", "Cache-Control": "no-cache"})
    with urllib.request.urlopen(request, timeout=15) as answer:
        return answer.read().decode("utf-8")


def main(argv):
    if not argv:
        return check(HOME, newest_release)
    if argv[0] != "--live" or len(argv) not in (1, 3) or (len(argv) == 3 and argv[1] != "--sha"):
        return 2, USAGE
    expect_sha = argv[2] if len(argv) == 3 else None
    if expect_sha is not None and not re.fullmatch(r"[0-9a-f]{40}", expect_sha):
        return 2, USAGE
    committed = committed_release(HOME)
    if not committed:
        return 1, f"{HOME} names no release (export const release = 'vX.Y.Z')"
    try:
        pages = fetch_live(fetch_page, expect_sha)
    except OSError as error:
        return 1, f"could not read the live site {SITE} ({error})."
    return check_live(pages, committed, newest_release, expect_sha)


if __name__ == "__main__":
    code, message = main(sys.argv[1:])
    print(message, file=sys.stderr if code else sys.stdout)
    sys.exit(code)
