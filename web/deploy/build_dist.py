"""Copy the servable website into one output folder, and write its _headers file.

Run it from the repository root:

    python3 -I web/deploy/build_dist.py            # writes web/dist/
    python3 -I web/deploy/build_dist.py OUT_DIR    # writes OUT_DIR/

Only these parts of web/site are copied (an allowlist):

    index.html, favicon.svg, share.jpg, assets/,
    guide/index.html, guide/<page>/index.html, guide/guide.css,
    docs/index.html, docs/<page>/index.html, docs/docs.css,
    id/index.html, id/guide/index.html, id/guide/<page>/index.html, id/docs/index.html, id/docs/<page>/index.html
    (the Indonesian pages; they share guide.css, docs.css and assets/ with the English ones)

Hidden files (.DS_Store, .taste-skill/ ...) are never copied. A symbolic link anywhere in what is copied stops the
build: a committed link would otherwise publish whatever it points to (test: web/deploy/test_build_dist.py).
Everything else stays behind: README.md, build.mjs, content/, _shell/, test/, node_modules/, package.json,
guide/README.md, guide/build.py, guide/src/, docs/README.md, docs/src/, i18n/, shots/. After the copy, the script checks the output again
and stops with an error if a file that must never be served is in it (notes, Python, Markdown sources,
checker state, a demo page under assets/).

Three things are written at build time, never committed, so they cannot drift from the pages:

- The release marker: every page gets <meta name="release" content="<full git sha>"> in its head, so anyone can
  check from outside which commit is live (as GET /healthz does for the APIs). The sha is GITHUB_SHA (in CI, on a v*
  tag it is the tag's commit) or `git rev-parse HEAD` of the checkout. It must be 40 hex digits. A committed page that
  already has one is refused, and the build checks the result: exactly one marker on every page.
- sitemap.xml: every page, with the hreflang alternates of the pages that exist in both languages.
- robots.txt: everything allowed, and the sitemap's address.

The _headers file (Cloudflare Workers static assets read it; wrangler.jsonc serves this folder) sets the Content-Security-Policy and a few other
safety headers. script-src lists the sha256 hash of every inline <script> in the copied pages, worked out
now, so a later page edit gets the right hash at the next build. The site has no inline script (Meridian's
theme-init.js and marketing.js are same-origin files, covered by 'self'), so today the list is empty.
style-src is 'self' only: no page carries a style="..." attribute or a <style> element, and the build stops
when one does (the browser would ignore it under this policy, so the page would look wrong in production only).
Scripts may still set styles through the CSSOM (element.style.setProperty), which the policy allows.
"""

import base64
import hashlib
import html
import os
import re
import shutil
import subprocess
import sys
from html.parser import HTMLParser
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
SITE = REPO / "web" / "site"
DEFAULT_OUT = REPO / "web" / "dist"

SITE_URL = "https://komando.efolusi.com/"

TOP_FILES = ["index.html", "favicon.svg", "share.jpg"]
TOP_DIRS = ["assets"]
GUIDE_FILES = ["guide/index.html", "guide/guide.css"]
DOCS_FILES = ["docs/index.html", "docs/docs.css"]
# the Indonesian tree: the homes of the three parts; its pages are found like the English ones
ID_FILES = ["id/index.html", "id/guide/index.html", "id/docs/index.html"]

SHA = re.compile(r"[0-9a-f]{40}")
RELEASE_META = '<meta name="release" content="{sha}">'

# a <script> with one of these types holds data, not code: the browser never runs it, so it needs no hash
DATA_TYPES = {"application/json", "application/ld+json", "importmap"}

# the origins the pages load from, besides their own (checked against index.html and the guide pages)
CSP = [
    ("default-src", ["'self'"]),
    # Cloudflare injects its Web Analytics beacon on the zone; it loads from static.cloudflareinsights.com
    # and reports to cloudflareinsights.com. The inline script hashes are added here as well.
    ("script-src", ["'self'", "https://static.cloudflareinsights.com"]),
    # no 'unsafe-inline': the drawn app screens take colour from classes (W34) and Meridian 2.2.0 writes no style
    # attribute; refuse_inline_style() stops the build when a page brings one back
    ("style-src", ["'self'"]),
    ("font-src", ["'self'"]),  # Meridian's fonts are served from assets/meridian/assets/fonts/
    ("img-src", ["'self'", "data:"]),
    # the release number is written in at release time (set_release.py); the beacon reports to Cloudflare
    ("connect-src", ["'self'", "https://cloudflareinsights.com"]),
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

# the asset file names carry no version, so a long cache ("immutable", or a week) would keep an old script after
# a change: /assets/* is sent no-cache, so the browser asks again on every use.
# Files under /assets/ keep their names across releases, and pages import other files (a script imports
# theme.js, a stylesheet @imports its tokens) without any version in the link. A week-long cache therefore kept
# an old file beside a new page (the old theme.js reset the theme to dark). no-cache makes the browser ask each
# time; Workers static assets answer with an ETag, so an unchanged file costs a 304, not a download.
# version_assets() adds ?v=<hash> to the links in the pages as well, so a browser that already holds an old
# copy (cached under the old header for a week) asks for the new URL at once.
ASSET_CACHE = "no-cache"


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
    for name in TOP_FILES + GUIDE_FILES + DOCS_FILES + ID_FILES:
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
    for prefix in ("", "id/"):
        pages = sorted(p for p in (SITE / f"{prefix}guide").glob("*/index.html") if p.parent.name != "src")
        if not pages:
            fail(f"no {prefix}guide pages found: run web/site/guide/build.py first")
        for src in pages:
            copy_file(src, out)
        docs = sorted(p for p in (SITE / f"{prefix}docs").glob("*/index.html") if p.parent.name != "src")
        if not docs:
            fail(f"no {prefix}docs pages found: run scripts/docsgen first")
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


class StyleScan(HTMLParser):
    """Collects every style="..." attribute and every <style> element (style-src 'self' blocks both)."""

    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.found = []

    def handle_starttag(self, tag, attrs):
        if tag == "style":
            self.found.append("<style>")
        if any(name.lower() == "style" for name, _ in attrs):
            self.found.append(f"<{tag} style=...>")


def refuse_inline_style(out):
    """Stop the build when a page, or a fragment under assets/ that is pasted into one, has inline style."""
    for page in sorted(out.rglob("*.html")):
        scan = StyleScan()
        scan.feed(page.read_text(encoding="utf-8"))
        scan.close()
        if scan.found:
            fail(f"{page.relative_to(out).as_posix()} has inline style, which the CSP (style-src 'self') blocks; "
                 f"use a class in a stylesheet instead: {sorted(set(scan.found))}")


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


def release_sha():
    """The commit being published: GITHUB_SHA in CI, otherwise the checkout's HEAD. Always 40 hex digits."""
    sha = os.environ.get("GITHUB_SHA", "").strip()
    if not sha:
        try:
            sha = subprocess.run(["git", "-C", str(REPO), "rev-parse", "HEAD"], check=True, capture_output=True, text=True).stdout.strip()
        except (OSError, subprocess.CalledProcessError):
            fail("no release to write into the pages: set GITHUB_SHA, or run this inside the git checkout")
    if not SHA.fullmatch(sha):
        fail(f"the release must be a full commit sha of 40 lowercase hex digits, not {sha!r}")
    return sha


def pages_of(out):
    """Every HTML page of the output, as paths relative to it (the fragments under assets/ are not pages)."""
    return [p.relative_to(out) for p in sorted(out.rglob("*.html")) if p.relative_to(out).parts[0] != "assets"]


def mark_release(out, sha):
    """Put the release marker in the head of every page, then check that each page has exactly one."""
    meta = RELEASE_META.format(sha=sha)
    for rel in pages_of(out):
        page = out / rel
        text = page.read_text(encoding="utf-8")
        if 'name="release"' in text:
            fail(f"{rel.as_posix()} already has a release meta; the build adds it, a page never carries its own")
        if text.count("</head>") != 1:
            fail(f"{rel.as_posix()} has no single </head> to put the release meta in")
        page.write_text(text.replace("</head>", meta + "\n</head>", 1), encoding="utf-8")
    for rel in pages_of(out):
        found = re.findall(r'<meta name="release" content="([^"]*)">', (out / rel).read_text(encoding="utf-8"))
        if found != [sha]:
            fail(f"{rel.as_posix()} must carry exactly one release meta with {sha}, found {found}")


ASSET_REF = re.compile(r'((?:src|href)=")([^"#?:]+\.(?:js|css))(")')


def version_assets(out):
    """Add ?v=<first 10 hex of the file's sha256> to every local script and stylesheet link.

    /assets/* is served no-cache, which only governs copies fetched after it was set. A browser that cached a
    file earlier (under the old week-long header) keeps it fresh and would run it beside a new page (an old
    site.js reset the theme to dark on a dark OS). The versioned link is a new URL for it, so the page and its
    files match at once. A changed file gets a new link; what scripts and stylesheets import is covered by no-cache."""
    root = out.resolve()
    for rel in pages_of(out):
        page = out / rel
        text = page.read_text(encoding="utf-8")

        def stamp(match):
            target = (page.parent / match.group(2)).resolve()
            if root not in target.parents or not target.is_file():
                fail(f"{rel.as_posix()} links {match.group(2)}, which is not a file of the output (use a link relative to the page)")
            digest = hashlib.sha256(target.read_bytes()).hexdigest()[:10]
            return f"{match.group(1)}{match.group(2)}?v={digest}{match.group(3)}"

        page.write_text(ASSET_REF.sub(stamp, text), encoding="utf-8")


def page_url(rel):
    return SITE_URL + rel.as_posix().removesuffix("index.html")


def write_sitemap(out):
    """sitemap.xml: every page, and for a page that exists in both languages its hreflang alternates."""
    rels = pages_of(out)
    known = {r.as_posix() for r in rels}
    entries = []
    for rel in rels:
        name = rel.as_posix()
        english = name[3:] if name.startswith("id/") else name
        lines = [f"<loc>{html.escape(page_url(rel))}</loc>"]
        if english in known and "id/" + english in known:
            for code, target in (("en", english), ("id", "id/" + english), ("x-default", english)):
                lines.append(f'<xhtml:link rel="alternate" hreflang="{code}" href="{html.escape(page_url(Path(target)))}"/>')
        entries.append("<url>" + "".join(lines) + "</url>")
    xml = ('<?xml version="1.0" encoding="UTF-8"?>\n'
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
           + "\n".join(entries) + "\n</urlset>\n")
    (out / "sitemap.xml").write_text(xml, encoding="utf-8")


def write_robots(out):
    (out / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {SITE_URL}sitemap.xml\n", encoding="utf-8")


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
    sha = release_sha()  # first: a bad release must not leave a half-written output behind
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
    mark_release(out, sha)
    version_assets(out)
    refuse_inline_style(out)
    hashes = script_hashes(out)
    write_headers(out, hashes)
    write_sitemap(out)
    write_robots(out)
    files = [p for p in out.rglob("*") if p.is_file()]
    print(f"build_dist: {len(files)} files in {out}, {len(hashes)} inline script hashes in _headers")


if __name__ == "__main__":
    main()
