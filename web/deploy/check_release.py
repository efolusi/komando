"""Fail when the home page names an older komando release than the newest one.

Run from the repository root:

    python3 -I web/deploy/check_release.py

The release number in web/site/content/home.en.mjs is written at release time by set_release.py, together with the
sha256 of that tag's install.sh, and the install one-liner is pinned to it. This check asks the public GitHub API
(no token) for the newest release and exits 1 when the page names another one, so a page that lags is a red CI job,
never a quiet wrong number. A lookup that fails (no network, a rate limit, an answer that is not a version tag) only
prints a warning and exits 0: a GitHub outage must not block a site change.
"""

import json
import re
import sys
import urllib.request
from pathlib import Path

sys.dont_write_bytecode = True
REPO = Path(__file__).resolve().parents[2]
HOME = REPO / "web" / "site" / "content" / "home.en.mjs"
LATEST = "https://api.github.com/repos/sgnd/komando/releases/latest"
TAG = re.compile(r"^v\d+\.\d+\.\d+$")


def newest_release():
    request = urllib.request.Request(LATEST, headers={"Accept": "application/vnd.github+json", "User-Agent": "site-check"})
    with urllib.request.urlopen(request, timeout=8) as answer:
        tag = json.load(answer).get("tag_name", "")
    if not TAG.match(tag):
        raise ValueError(f"not a version tag: {tag!r}")
    return tag


def check(home, lookup):
    """Returns (exit code, message)."""
    found = re.search(r"export const release = '(v\d+\.\d+\.\d+)'", home.read_text())
    if not found:
        return 1, f"{home} names no release (export const release = 'vX.Y.Z')"
    page = found.group(1)
    try:
        newest = lookup()
        if not TAG.match(newest):
            raise ValueError(f"not a version tag: {newest!r}")
    except (OSError, ValueError, KeyError) as error:
        return 0, f"WARNING: could not read the newest komando release ({error}); the page names {page}, not checked."
    if page != newest:
        return 1, (f"the home page names {page}, the newest komando release is {newest}: run "
                   f"python3 -I web/deploy/set_release.py {newest} and commit what it changes.")
    return 0, f"the home page names the newest komando release, {page}."


if __name__ == "__main__":
    code, message = check(HOME, newest_release)
    print(message, file=sys.stderr if code else sys.stdout)
    sys.exit(code)
