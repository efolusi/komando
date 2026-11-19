"""Write komando's release number, and its install script's sha256, into the site at release time.

Run it from the repository root, with the tag that was just released:

    python3 -I web/deploy/set_release.py v0.14.0

What it changes:

- web/site/index.html: every element with a data-release attribute holds the tag as its whole text (the hero's
  "Latest komando release" line, the Install link and its address (releases/tag/<tag>), the tag inside the install one-liner's URL,
  .../sgnd/komando/<tag>/install.sh, and its pin, KOMANDO_VERSION=<tag>, so the line installs exactly that release). Every element with data-install-sha holds the sha256 of that tag's
  install.sh.
- web/site/guide/src/first-ten-minutes.md: the tag in each install.sh URL, in "release vX.Y.Z" and in each
  KOMANDO_VERSION= pin, and the sha256 after "should be". Then it builds the guide again (guide/build.py).

The sha256 is worked out here from the public file, https://raw.githubusercontent.com/sgnd/komando/<tag>/install.sh,
so it always belongs to the tag the page names. The script stops with an error, and changes nothing, if that file
cannot be read or if a place it expects is missing.

The page itself never asks GitHub: a visit sends nothing to a third party. Commit the changed files with the release.
"""

import hashlib
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
PAGE = REPO / "web" / "site" / "index.html"
GUIDE_SRC = REPO / "web" / "site" / "guide" / "src" / "first-ten-minutes.md"
GUIDE_BUILD = REPO / "web" / "site" / "guide" / "build.py"
SCRIPT_URL = "https://raw.githubusercontent.com/sgnd/komando/{tag}/install.sh"

TAG = re.compile(r"v\d+\.\d+\.\d+")
SHA = re.compile(r"[0-9a-f]{64}")


def element(attr):
    # <tag ... attr ...>text</tag>: the attribute as its own name in the start tag (after a space, and followed by a
    # space, "=", "/" or ">"), so data-release-line or "data-release" inside another attribute's value never counts;
    # the text is the element's whole text
    return re.compile(r"(<[a-z]+\b[^>]*\s" + attr + r"(?=[\s=/>])[^>]*>)([^<]*)(</[a-z]+>)")


def swap_elements(text, attr, shape, new, what):
    found = []

    def swap(m):
        if not shape.fullmatch(m.group(2)):
            raise SystemExit(f"set_release: a {attr} element holds {m.group(2)!r}, not {what}")
        found.append(m.group(2))
        return m.group(1) + new + m.group(3)

    text = element(attr).sub(swap, text)
    if not found:
        raise SystemExit(f"set_release: no {attr} element in index.html")
    return text, found


def script_sha(tag):
    url = SCRIPT_URL.format(tag=tag)
    try:
        with urllib.request.urlopen(url, timeout=30) as r:
            body = r.read()
    except Exception as e:
        raise SystemExit(f"set_release: could not read {url} ({e}); is {tag} tagged on GitHub?")
    return hashlib.sha256(body).hexdigest()


def main():
    if len(sys.argv) != 2 or not TAG.fullmatch(sys.argv[1]):
        raise SystemExit("usage: python3 -I web/deploy/set_release.py vMAJOR.MINOR.PATCH")
    tag = sys.argv[1]
    sha = script_sha(tag)

    page = PAGE.read_text(encoding="utf-8")
    page, tags = swap_elements(page, "data-release", TAG, tag, "a vX.Y.Z tag")
    page, _ = swap_elements(page, "data-install-sha", SHA, sha, "a sha256")
    # the link that shows the tag goes to that release, not to "latest", which moves with the next release
    page, n_link = re.subn(r"(sgnd/komando/releases/tag/)v\d+\.\d+\.\d+", r"\g<1>" + tag, page)
    if not n_link:
        raise SystemExit("set_release: index.html has no link to releases/tag/vX.Y.Z")

    guide = GUIDE_SRC.read_text(encoding="utf-8")
    guide, n_url = re.subn(r"(sgnd/komando/)v\d+\.\d+\.\d+(/install\.sh)", r"\g<1>" + tag + r"\g<2>", guide)
    guide, n_rel = re.subn(r"(release )v\d+\.\d+\.\d+", r"\g<1>" + tag, guide)
    guide, n_sha = re.subn(r"(should be `)[0-9a-f]{64}(`)", r"\g<1>" + sha + r"\g<2>", guide)
    guide, n_pin = re.subn(r"(KOMANDO_VERSION=)v\d+\.\d+\.\d+", r"\g<1>" + tag, guide)
    if not (n_url and n_rel and n_sha and n_pin == 2):
        raise SystemExit("set_release: first-ten-minutes.md lost its install URL, its release tag, its sha256 line "
                         "or one of its two KOMANDO_VERSION pins")

    PAGE.write_text(page, encoding="utf-8")
    GUIDE_SRC.write_text(guide, encoding="utf-8")
    subprocess.run([sys.executable, str(GUIDE_BUILD)], check=True)
    print(f"set_release: index.html ({len(tags)} places) and the guide's first page say {tag}; "
          f"install.sh sha256 {sha}")


if __name__ == "__main__":
    main()
