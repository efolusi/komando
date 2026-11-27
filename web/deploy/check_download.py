"""Fail when a draft page of row W28 promises a download that does not exist, or leaks while it is switched off.

Run from the repository root:

    python3 -I web/deploy/check_download.py

The Mac download, privacy, support and pricing pages are drafts in web/site/content/drafts/ (state in config.json).
While "switchedOn" is false the check proves they are really off:

- config.json names no version and no checksum while the Mac app is "released": false (no fake number);
- web/deploy/build_dist.py (the allowlist and the sitemap) and the home pages and shell partials do not mention
  the drafts, so nothing deploys, lists or links them;
- every built draft page carries noindex.

When "switchedOn" is true it also requires everything a visitor will rely on:

- "released" is true, with a version tag (vX.Y.Z), a 64-digit sha256 and a real download host (not a .invalid
  placeholder);
- no TODO is left in the draft copy;
- the archive at https://<downloadHost><archivePath> exists (HTTP 200) and its sha256 is the one the page names. A
  404 or a different checksum is an error. A lookup that cannot reach the host at all only warns (an outage must
  not block a site change), as check_release.py does.

This check guards the committed files; it is not the proof that the pages are not deployed. That proof is the
allowlist in web/deploy/build_dist.py, tested by web/deploy/test_build_dist.py (content/ is never copied) and by the
dist test in web/site/test/drafts.test.mjs (it runs build_dist.py into a scratch folder and looks for the pages, their
sitemap entries and links). The check fails closed: all eight built pages (PAGES x LANGS) must exist, and every
SHIPPING file must exist, so a renamed or deleted file is an error, never a silent pass.

Tests: web/deploy/test_check_download.py.
"""

import hashlib
import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

sys.dont_write_bytecode = True
REPO = Path(__file__).resolve().parents[2]
SITE = REPO / "web" / "site"
DRAFTS = SITE / "content" / "drafts"
# the pages web/site/content/drafts/render.mjs builds, in these languages: all of them must be there
PAGES = ["download", "privacy", "support", "pricing"]
LANGS = ["en", "id"]
TAG = re.compile(r"^v\d+\.\d+\.\d+$")
SHA256 = re.compile(r"^[0-9a-f]{64}$")
# files that must never name the drafts while they are off
SHIPPING = [REPO / "web" / "deploy" / "build_dist.py", SITE / "content" / "home.en.mjs", SITE / "content" / "home.id.mjs",
            SITE / "_shell" / "en" / "header.html", SITE / "_shell" / "en" / "footer.html",
            SITE / "_shell" / "id" / "header.html", SITE / "_shell" / "id" / "footer.html"]


def archive_url(config):
    path = config["archivePath"].replace("{channel}", "stable").replace("{version}", config["macApp"]["version"] or "")
    return f"https://{config['downloadHost']}{path}"


def fetch_sha256(url):
    """The sha256 of the file at url. Raises HTTPError (404 ...) or URLError/OSError."""
    request = urllib.request.Request(url, headers={"User-Agent": "site-check"})
    digest = hashlib.sha256()
    with urllib.request.urlopen(request, timeout=20) as answer:
        for chunk in iter(lambda: answer.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def check(drafts, shipping, lookup):
    """Returns (exit code, [messages]). drafts is the web/site/content/drafts folder, shipping the files that must not name it."""
    config = json.loads((drafts / "config.json").read_text())
    app = config["macApp"]
    errors, warnings = [], []

    if not app["released"] and (app["version"] or app["sha256"]):
        errors.append("config.json names a version or a checksum while the Mac app is not released (released: false)")

    # fail closed: every built page must exist (an empty or missing out folder is an error, not "nothing to check")
    built = [drafts / "out" / lang / f"{page}.html" for lang in LANGS for page in PAGES]
    for page in built:
        if not page.is_file():
            errors.append(f"the draft page {page.relative_to(drafts)} is missing: run node build.mjs in web/site")
    for path in shipping:
        if not path.exists():
            errors.append(f"{path} does not exist: the check cannot prove it does not name the drafts (renamed or deleted?)")

    if not config["switchedOn"]:
        for path in shipping:
            if path.exists() and re.search(r"content/drafts|drafts/out|/drafts/", path.read_text()):
                errors.append(f"{path.name} names the draft pages, but they are switched off")
        for page in sorted((drafts / "out").glob("*/*.html")):
            if 'name="robots" content="noindex' not in page.read_text():
                errors.append(f"{page.relative_to(drafts)} has no noindex")
    else:
        if not app["released"]:
            errors.append("the pages are switched on but the Mac app is not released")
        if not TAG.match(app["version"] or ""):
            errors.append(f"version {app['version']!r} is not a version tag (vX.Y.Z)")
        if not SHA256.match(app["sha256"] or ""):
            errors.append("sha256 is not 64 hex digits")
        if config["downloadHost"].endswith(".invalid"):
            errors.append(f"downloadHost {config['downloadHost']} is a placeholder")
        for source in sorted(drafts.glob("copy.*.mjs")):
            if "{ todo:" in source.read_text():
                errors.append(f"{source.name} has an open todo block (shown on the page as TODO)")
        if not errors:
            url = archive_url(config)
            try:
                found = lookup(url)
                if found != app["sha256"]:
                    errors.append(f"{url} has sha256 {found}, the page names {app['sha256']}")
            except urllib.error.HTTPError as error:
                errors.append(f"{url} answers {error.code}: the page names a download that does not exist")
            except (OSError, ValueError) as error:
                warnings.append(f"WARNING: could not reach {url} ({error}); the download is not checked.")

    messages = errors + warnings
    if errors:
        return 1, messages
    if not messages:
        state = "on and the download checks out" if config["switchedOn"] else "off and nothing names them"
        messages.append(f"the draft pages are {state}.")
    return 0, messages


if __name__ == "__main__":
    code, messages = check(DRAFTS, SHIPPING, fetch_sha256)
    print("\n".join(messages), file=sys.stderr if code else sys.stdout)
    sys.exit(code)
