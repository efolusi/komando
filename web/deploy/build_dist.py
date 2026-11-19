"""Copy the servable website into one output folder, and write its _headers file.

Run it from the repository root:

    python3 -I web/deploy/build_dist.py            # writes web/dist/
    python3 -I web/deploy/build_dist.py OUT_DIR    # writes OUT_DIR/

Only these parts of web/site are copied (an allowlist):

    index.html, favicon.svg, share.jpg, glyphs/, assets/,
    guide/index.html, guide/<page>/index.html, guide/guide.css,
    docs/index.html, docs/<page>/index.html, docs/docs.css

Hidden files (.DS_Store, .taste-skill/ ...) are never copied. A symbolic link anywhere in what is copied stops the
build: a committed link would otherwise publish whatever it points to (test: web/deploy/test_build_dist.py).
Everything else stays behind: README.md, guide/README.md, guide/build.py, guide/src/, docs/README.md, docs/src/, shots/. After the copy, the script checks the output again
and stops with an error if a file that must never be served is in it (notes, Python, Markdown sources,
checker state, a demo page under assets/).

The _headers file (Cloudflare Workers static assets read it; wrangler.jsonc serves this folder) sets the Content-Security-Policy and a few other
safety headers. script-src lists the sha256 hash of every inline <script> in the copied pages, worked out
now, so a later page edit gets the right hash at the next build.
"""

import base64
import hashlib
import shutil
import sys
from html.parser import HTMLParser
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
SITE = REPO / "web" / "site"
DEFAULT_OUT = REPO / "web" / "dist"

TOP_FILES = ["index.html", "favicon.svg", "share.jpg"]
TOP_DIRS = ["glyphs", "assets"]
GUIDE_FILES = ["guide/index.html", "guide/guide.css"]
DOCS_FILES = ["docs/index.html", "docs/docs.css"]

# a <script> with one of these types holds data, not code: the browser never runs it, so it needs no hash
DATA_TYPES = {"application/json", "application/ld+json", "importmap"}

# the origins the pages load from, besides their own (checked against index.html and the guide pages)
CSP = [
    ("default-src", ["'self'"]),
    ("script-src", ["'self'"]),  # the inline script hashes are added here
    # 'unsafe-inline': index.html has two <style> blocks and about 40 style="..." attributes (CSS custom
    # properties on the app screens), and the scripts set styles too. Hashes cannot cover style attributes
    # in every browser. Scripts stay locked to 'self' and hashes, which is where the danger is.
    ("style-src", ["'self'", "'unsafe-inline'"]),
    ("font-src", ["'self'"]),  # Instrument Sans and DM Mono are served from assets/fonts/
    ("img-src", ["'self'", "data:"]),
    ("connect-src", ["'self'"]),  # the release number is written in at release time (set_release.py)
    ("frame-ancestors", ["'none'"]),
    ("base-uri", ["'self'"]),
    ("form-action", ["'self'"]),
    ("object-src", ["'none'"]),
]

OTHER_HEADERS = [
    ("X-Content-Type-Options", "nosniff"),
    # https only, for two years; no includeSubDomains: the efolusi.com zone holds other hosts
    ("Strict-Transport-Security", "max-age=63072000"),
    ("Referrer-Policy", "strict-origin-when-cross-origin"),
    ("Permissions-Policy", "camera=(), microphone=(), geolocation=()"),
    # frame-ancestors already stops framing; this says the same to a browser too old to read it
    ("X-Frame-Options", "DENY"),
    # a page this site opens, or that opens it, gets no handle on its window
    ("Cross-Origin-Opener-Policy", "same-origin"),
]

# the asset file names carry no version, so a year-long "immutable" cache would keep an old script after
# a change; one week, then the browser checks again (and may use the old copy while it does)
ASSET_CACHE = "public, max-age=604800, stale-while-revalidate=86400"


def fail(message):
    raise SystemExit(f"build_dist: {message}")


def hidden(rel):
    return any(part.startswith(".") for part in rel.parts)


def refuse_link(src):
    """Stop the build when src, or any folder between web/site and it, is a symbolic link.

    A committed link would make the build publish whatever it points to (a key in ~/.ssh, say), so no link is
    ever followed: the file must be a real file inside web/site.
    """
    rel = src.relative_to(SITE)
    path = SITE
    for part in rel.parts:
        path = path / part
        if path.is_symlink():
            fail(f"{path.relative_to(SITE)} is a symbolic link; the site holds only real files, so it is never published")
    root = SITE.resolve()
    if root not in src.resolve().parents:
        fail(f"{rel} resolves outside web/site")


def copy_file(src, out):
    rel = src.relative_to(SITE)
    if hidden(rel):
        return
    refuse_link(src)
    dst = out / rel
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst, follow_symlinks=False)


def copy_site(out):
    for name in TOP_FILES + GUIDE_FILES + DOCS_FILES:
        src = SITE / name
        refuse_link(src)
        if not src.is_file():
            fail(f"{name} is missing from web/site")
        copy_file(src, out)
    for name in TOP_DIRS:
        refuse_link(SITE / name)
        for src in sorted((SITE / name).rglob("*")):
            if hidden(src.relative_to(SITE)):
                continue
            refuse_link(src)  # a linked folder too: rglob would list it without walking into it
            if src.is_file():
                copy_file(src, out)
    pages = sorted(p for p in (SITE / "guide").glob("*/index.html") if p.parent.name != "src")
    if not pages:
        fail("no guide pages found: run web/site/guide/build.py first")
    for src in pages:
        copy_file(src, out)
    docs = sorted(p for p in (SITE / "docs").glob("*/index.html") if p.parent.name != "src")
    if not docs:
        fail("no docs pages found: run scripts/docsgen first")
    for src in docs:
        copy_file(src, out)


class PageScan(HTMLParser):
    """Collects the code of every inline <script> and every on* attribute (CSP would block those)."""

    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.scripts = []
        self.handlers = []
        self._code = None

    def handle_starttag(self, tag, attrs):
        for name, _ in attrs:
            if name.lower().startswith("on"):
                self.handlers.append(f"<{tag} {name}=...>")
        if tag == "script":
            a = dict(attrs)
            kind = (a.get("type") or "").strip().lower()
            self._code = None if "src" in a or kind in DATA_TYPES else []

    def handle_endtag(self, tag):
        if tag == "script" and self._code is not None:
            self.scripts.append("".join(self._code))
            self._code = None

    def handle_data(self, data):
        if self._code is not None:
            self._code.append(data)


def script_hashes(out):
    hashes = []
    for page in sorted(out.rglob("*.html")):
        if page.relative_to(out).parts[0] == "assets":
            continue  # fragments under assets/ are pasted into a page as HTML; their scripts never run
        scan = PageScan()
        scan.feed(page.read_text(encoding="utf-8"))
        scan.close()
        if scan.handlers:
            fail(f"{page.relative_to(out)} has inline event handlers, which the CSP blocks: {scan.handlers}")
        for code in scan.scripts:
            digest = base64.b64encode(hashlib.sha256(code.encode("utf-8")).digest()).decode()
            h = f"'sha256-{digest}'"
            if h not in hashes:
                hashes.append(h)
    return hashes


def check_output(out):
    """Stop the build when anything that must never be served is in the output."""
    bad = []
    for path in sorted(out.rglob("*")):
        rel = path.relative_to(out)
        if rel.name == "_headers":
            continue
        name = rel.name.lower()
        if path.is_symlink():
            bad.append(f"{rel} (a symbolic link)")
        elif hidden(rel):
            bad.append(f"{rel} (hidden file)")
        elif rel.parts[0] == "shots" or rel.parts[:2] in (("guide", "src"), ("docs", "src")):
            bad.append(f"{rel} (source or screenshots)")
        elif path.is_file() and name.endswith((".md", ".py", ".pyc", ".sh", ".map")):
            bad.append(f"{rel} (notes or source)")
        elif path.is_file() and rel.parts[0] == "assets" and name.endswith(".html"):
            head = path.read_text(encoding="utf-8", errors="replace")[:400].lower()
            if "<!doctype" in head or "<html" in head:
                bad.append(f"{rel} (a full demo page under assets/)")
    if bad:
        fail("these must never be served:\n  " + "\n  ".join(bad))


def write_headers(out, hashes):
    policy = []
    for directive, sources in CSP:
        if directive == "script-src":
            sources = sources + hashes
        policy.append(" ".join([directive] + sources))
    lines = ["/*", f"  Content-Security-Policy: {'; '.join(policy)}"]
    lines += [f"  {name}: {value}" for name, value in OTHER_HEADERS]
    lines += ["", "/assets/*", f"  Cache-Control: {ASSET_CACHE}", ""]
    (out / "_headers").write_text("\n".join(lines), encoding="utf-8")


def main():
    if len(sys.argv) > 2:
        fail("usage: python3 -I web/deploy/build_dist.py [OUT_DIR]")
    out = Path(sys.argv[1]).resolve() if len(sys.argv) == 2 else DEFAULT_OUT
    # the output is deleted and made again: never let it be the site, the repository or a folder above them
    if out == SITE or SITE in out.parents or out in SITE.parents or out == REPO or out in REPO.parents:
        fail(f"{out} overlaps the site sources; pick a folder outside web/site, such as web/dist")
    # only an earlier output (it holds _headers) or an empty folder is deleted: a wrong path such as
    # ~/Documents stops here instead of being emptied
    if out.exists():
        if not out.is_dir() or (any(out.iterdir()) and not (out / "_headers").is_file()):
            fail(f"{out} exists and is not an earlier output of this script (no _headers in it); "
                 "pick a new folder, or delete that one yourself")
        shutil.rmtree(out)
    out.mkdir(parents=True)
    copy_site(out)
    check_output(out)
    hashes = script_hashes(out)
    write_headers(out, hashes)
    files = [p for p in out.rglob("*") if p.is_file()]
    print(f"build_dist: {len(files)} files in {out}, {len(hashes)} inline script hashes in _headers")


if __name__ == "__main__":
    main()
