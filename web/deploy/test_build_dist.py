"""Tests for build_dist.py and wrangler.jsonc: a symbolic link in the site is never followed or published,
and the Worker serves only the build output, on komando.efolusi.com only.

Run from the repository root:

    python3 -I web/deploy/test_build_dist.py

Each test builds a small stand-in site in a temporary folder, so the real web/site is never touched.
"""

import importlib.util
import os
import re
import subprocess
import sys
import tempfile
import unittest
from html.parser import HTMLParser
from pathlib import Path

sys.dont_write_bytecode = True  # leave no __pycache__ beside the deploy scripts
HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("build_dist", HERE / "build_dist.py")
build_dist = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build_dist)


SHA = "0123456789abcdef0123456789abcdef01234567"
PAGE = "<!doctype html>\n<html lang=\"{lang}\">\n<head>\n<meta charset=\"utf-8\">\n<title>{title}</title>\n</head>\n<body></body>\n</html>\n"


def page(title, lang="en"):
    return PAGE.format(title=title, lang=lang)


class SymlinkTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        base = Path(self.tmp.name)
        self.repo = base / "repo"
        self.site = self.repo / "web" / "site"
        self.out = self.repo / "web" / "dist"
        # a file outside the site, standing in for a private key the link would publish
        self.secret = base / "outside" / "id_ed25519"
        self.secret.parent.mkdir(parents=True)
        self.secret.write_text("PRIVATE KEY STAND-IN\n")
        for rel, text in {
            "index.html": page("t").replace("</head>", "<script>1</script>\n</head>"),
            "favicon.svg": "<svg/>",
            "share.jpg": "jpg",
            "glyphs/a.svg": "<svg/>",  # a build input, never published
            "assets/site.css": "body{}",
            "guide/index.html": page("g"),
            "guide/guide.css": "p{}",
            "guide/start/index.html": page("s"),
            "docs/index.html": page("d"),
            "docs/docs.css": "pre{}",
            "docs/install/index.html": page("i"),
            "id/index.html": page("t", "id"),
            "id/guide/index.html": page("g", "id"),
            "id/guide/start/index.html": page("s", "id"),
            "id/docs/index.html": page("d", "id"),
            "id/docs/start/index.html": page("m", "id"),
        }.items():
            p = self.site / rel
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(text)
        self.saved = (build_dist.REPO, build_dist.SITE, build_dist.DEFAULT_OUT, sys.argv, os.environ.get("GITHUB_SHA"))
        build_dist.REPO, build_dist.SITE, build_dist.DEFAULT_OUT = self.repo, self.site, self.out
        sys.argv = ["build_dist.py"]
        os.environ["GITHUB_SHA"] = SHA

    def tearDown(self):
        build_dist.REPO, build_dist.SITE, build_dist.DEFAULT_OUT, sys.argv, sha = self.saved
        if sha is None:
            os.environ.pop("GITHUB_SHA", None)
        else:
            os.environ["GITHUB_SHA"] = sha
        self.tmp.cleanup()

    def published(self):
        return [p for p in self.out.rglob("*") if p.is_file()] if self.out.exists() else []

    def assert_refused(self, link_name):
        with self.assertRaises(SystemExit) as stop:
            build_dist.main()
        self.assertIn("symbolic link", str(stop.exception))
        self.assertIn(link_name, str(stop.exception))
        for p in self.published():
            self.assertNotIn("PRIVATE KEY", p.read_text(errors="replace"), f"{p} holds the linked file")

    def test_plain_site_builds(self):
        build_dist.main()
        self.assertTrue((self.out / "assets" / "site.css").is_file())
        self.assertTrue((self.out / "_headers").is_file())
        self.assertTrue((self.out / "docs" / "install" / "index.html").is_file())
        self.assertFalse(any(p.is_symlink() for p in self.out.rglob("*")))

    def test_indonesian_pages_are_published(self):
        build_dist.main()
        served = {p.relative_to(self.out).as_posix() for p in self.published()}
        for rel in ("id/index.html", "id/guide/index.html", "id/guide/start/index.html", "id/docs/index.html", "id/docs/start/index.html"):
            self.assertIn(rel, served)

    def test_a_missing_indonesian_home_stops_the_build(self):
        (self.site / "id" / "index.html").unlink()
        with self.assertRaises(SystemExit) as stop:
            build_dist.main()
        self.assertIn("id/index.html", str(stop.exception))

    def test_node_build_files_stay_behind(self):
        # build.mjs, its content, the shell partials and node_modules are sources of the pages, never served
        for rel in ("build.mjs", "package.json", "pnpm-lock.yaml", "content/home.en.mjs", "_shell/en/header.html",
                    "node_modules/react/index.js", "test/build.test.mjs"):
            p = self.site / rel
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text("x")
        build_dist.main()
        served = {p.relative_to(self.out).as_posix() for p in self.published()}
        for rel in ("build.mjs", "package.json", "pnpm-lock.yaml", "content/home.en.mjs", "_shell/en/header.html",
                    "node_modules/react/index.js", "test/build.test.mjs"):
            self.assertNotIn(rel, served)

    def test_meridian_css_is_served(self):
        p = self.site / "assets" / "meridian" / "styles.css"
        p.parent.mkdir(parents=True)
        p.write_text("@import './components.css';")
        build_dist.main()
        self.assertTrue((self.out / "assets" / "meridian" / "styles.css").is_file())

    def test_headers_hold_the_safety_headers(self):
        build_dist.main()
        headers = (self.out / "_headers").read_text()
        for want in ("Content-Security-Policy:", "frame-ancestors 'none'", "Strict-Transport-Security: max-age=",
                     "X-Content-Type-Options: nosniff", "Referrer-Policy: strict-origin-when-cross-origin"):
            self.assertIn(want, headers)

    def test_csp_allows_the_cloudflare_beacon(self):
        # Cloudflare Web Analytics runs on the zone; a CSP without these blocks its script and its reports.
        build_dist.main()
        headers = (self.out / "_headers").read_text()
        self.assertRegex(headers, r"script-src 'self' https://static\.cloudflareinsights\.com( 'sha256-[^']+')*;")
        self.assertIn("connect-src 'self' https://cloudflareinsights.com;", headers)

    def test_csp_is_exactly_the_policy_with_style_src_self_only(self):
        # W34: no 'unsafe-inline' anywhere; every other directive stays as it was
        build_dist.main()
        headers = (self.out / "_headers").read_text()
        csp = re.search(r"^  Content-Security-Policy: (.*)$", headers, re.M).group(1)
        csp = re.sub(r"'sha256-[A-Za-z0-9+/=]+'", "'sha256-HASH'", csp)  # the one <script>1</script> of index.html
        self.assertEqual(csp, "default-src 'self'; "
                              "script-src 'self' https://static.cloudflareinsights.com 'sha256-HASH'; "
                              "style-src 'self'; font-src 'self'; img-src 'self' data:; "
                              "connect-src 'self' https://cloudflareinsights.com; frame-ancestors 'none'; base-uri 'self'; "
                              "form-action 'self'; object-src 'none'")
        self.assertNotIn("unsafe-inline", headers)

    def assert_inline_style_refused(self, rel, text):
        p = self.site / rel
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(text)
        with self.assertRaises(SystemExit) as stop:
            build_dist.main()
        self.assertIn(rel, str(stop.exception))
        self.assertIn("inline style", str(stop.exception))

    def test_a_style_attribute_stops_the_build(self):
        # style-src 'self' makes the browser ignore it, so the page would look wrong in production only
        for rel in ("index.html", "id/index.html", "guide/start/index.html", "id/guide/start/index.html",
                    "docs/install/index.html", "id/docs/start/index.html"):
            with self.subTest(rel=rel):
                original = (self.site / rel).read_text()
                self.assert_inline_style_refused(rel, page("x").replace("<body></body>", '<body><p style="color:red">x</p></body>'))
                (self.site / rel).write_text(original)
                __import__("shutil").rmtree(self.out)  # the stopped build left a half-written output behind

    def test_a_style_attribute_on_an_inline_svg_or_a_self_closing_tag_stops_the_build(self):
        self.assert_inline_style_refused("docs/install/index.html", page("x").replace(
            "<body></body>", '<body><svg><path d="M0 0" style="fill:red"/></svg></body>'))

    def test_a_style_element_stops_the_build(self):
        self.assert_inline_style_refused("guide/start/index.html", page("x").replace("</head>", "<style>p{}</style>\n</head>"))

    def test_a_fragment_under_assets_with_inline_style_stops_the_build(self):
        # fragments under assets/ are pasted into a page, so their style attributes would land in it
        self.assert_inline_style_refused("assets/part.html", '<div style="--c: red">x</div>')

    def test_the_brand_folder_is_not_published(self):
        # brand/share-card.html draws the share picture with a <style> block; it is a source, never served
        p = self.site / "brand" / "share-card.html"
        p.parent.mkdir(parents=True)
        p.write_text(page("card").replace("</head>", "<style>body{}</style>\n</head>"))
        build_dist.main()
        self.assertFalse((self.out / "brand").exists())
        self.assertFalse(any(q.name == "share-card.html" for q in self.published()))

    def pages_out(self):
        return [p for p in sorted(self.out.rglob("*.html")) if p.relative_to(self.out).parts[0] != "assets"]

    def test_every_page_carries_one_release_meta_with_the_full_sha(self):
        build_dist.main()
        pages = self.pages_out()
        self.assertGreaterEqual(len(pages), 8)
        for p in pages:
            text = p.read_text(encoding="utf-8")
            metas = re.findall(r'<meta name="release" content="([^"]*)">', text)
            self.assertEqual(len(metas), 1, f"{p.relative_to(self.out)} has {len(metas)} release metas")
            self.assertRegex(metas[0], r"^[0-9a-f]{40}$")
            self.assertEqual(metas[0], SHA)
            self.assertLess(text.index('name="release"'), text.index("</head>"), "the meta sits in the head")

    def test_the_release_comes_from_the_checkout_when_there_is_no_github_sha(self):
        del os.environ["GITHUB_SHA"]
        env = {**os.environ, "GIT_AUTHOR_NAME": "t", "GIT_AUTHOR_EMAIL": "t@t", "GIT_COMMITTER_NAME": "t", "GIT_COMMITTER_EMAIL": "t@t"}
        subprocess.run(["git", "init", "-q", str(self.repo)], check=True, env=env)
        subprocess.run(["git", "-C", str(self.repo), "add", "-A"], check=True, env=env)
        subprocess.run(["git", "-C", str(self.repo), "commit", "-qm", "x"], check=True, env=env)
        head = subprocess.run(["git", "-C", str(self.repo), "rev-parse", "HEAD"], check=True, env=env, capture_output=True, text=True).stdout.strip()
        build_dist.main()
        self.assertIn(f'<meta name="release" content="{head}">', (self.out / "index.html").read_text(encoding="utf-8"))

    def test_no_release_stops_the_build(self):
        del os.environ["GITHUB_SHA"]  # the stand-in repo is not a git checkout
        with self.assertRaises(SystemExit) as stop:
            build_dist.main()
        self.assertIn("release", str(stop.exception))

    def test_a_release_that_is_not_a_full_sha_is_refused(self):
        for bad in ("abc1234", SHA.upper() + "0", "v0.15.0", "g" * 40):
            os.environ["GITHUB_SHA"] = bad
            with self.assertRaises(SystemExit, msg=bad) as stop:
                build_dist.main()
            self.assertIn("40", str(stop.exception))

    def test_a_committed_page_must_not_carry_its_own_release_meta(self):
        p = self.site / "guide" / "start" / "index.html"
        p.write_text(page("s").replace("</head>", '<meta name="release" content="old">\n</head>'))
        with self.assertRaises(SystemExit) as stop:
            build_dist.main()
        self.assertIn("guide/start/index.html", str(stop.exception))

    def test_a_page_without_a_head_is_refused(self):
        (self.site / "guide" / "start" / "index.html").write_text("<!doctype html><title>s</title>")
        with self.assertRaises(SystemExit) as stop:
            build_dist.main()
        self.assertIn("guide/start/index.html", str(stop.exception))

    def test_the_release_meta_adds_no_inline_script_hash(self):
        build_dist.main()
        headers = (self.out / "_headers").read_text()
        self.assertEqual(len(re.findall(r"'sha256-", headers)), 1)  # the one <script>1</script> of index.html

    def test_a_script_file_needs_no_hash_and_a_data_script_neither(self):
        # script-src 'self' covers a same-origin <script src>; JSON data blocks are never run
        for rel in ("assets/meridian/browser/theme-init.js", "assets/site.js"):
            (self.site / rel).parent.mkdir(parents=True, exist_ok=True)
            (self.site / rel).write_text("x")
        for rel in ("guide/start/index.html", "docs/install/index.html"):
            p = self.site / rel
            p.write_text(page("x").replace("</head>", '<script src="../../assets/meridian/browser/theme-init.js"></script>\n'
                                           '<script type="module" src="../../assets/site.js"></script>\n'
                                           '<script type="application/json">{}</script>\n</head>'))
        build_dist.main()
        headers = (self.out / "_headers").read_text()
        self.assertEqual(len(re.findall(r"'sha256-", headers)), 1)  # still only the <script>1</script> of index.html

    def test_assets_are_revalidated_on_every_use(self):
        # a cached old script or stylesheet must never sit beside a new page, so /assets/* is never served from cache blind
        build_dist.main()
        headers = (self.out / "_headers").read_text()
        block = headers.split("/assets/*", 1)[1].split("\n\n", 1)[0]
        self.assertIn("Cache-Control: no-cache", block)
        self.assertNotIn("max-age", block)
        self.assertNotIn("immutable", block)

    def test_local_scripts_and_styles_carry_a_version_from_their_content(self):
        # assets are cached for a week under one name; the link changes when the file does
        (self.site / "assets" / "site.js").write_text("one")
        (self.site / "assets" / "site.css").write_text("css")
        page_text = page("x").replace("</head>", '<link rel="stylesheet" href="../../assets/site.css">\n'
                                      '<script type="module" src="../../assets/site.js"></script>\n'
                                      '<script src="https://static.cloudflareinsights.com/beacon.min.js"></script>\n</head>')
        (self.site / "docs" / "install" / "index.html").write_text(page_text)
        build_dist.main()
        first = (self.out / "docs" / "install" / "index.html").read_text()
        want = __import__("hashlib").sha256(b"one").hexdigest()[:10]
        self.assertIn(f'src="../../assets/site.js?v={want}"', first)
        self.assertRegex(first, r'href="\.\./\.\./assets/site\.css\?v=[0-9a-f]{10}"')
        self.assertIn('src="https://static.cloudflareinsights.com/beacon.min.js"', first)  # outside links stay as they are
        (self.site / "assets" / "site.js").write_text("two")
        build_dist.main()
        second = (self.out / "docs" / "install" / "index.html").read_text()
        self.assertNotIn(f"site.js?v={want}", second)

    def test_a_link_to_a_missing_script_stops_the_build(self):
        (self.site / "docs" / "install" / "index.html").write_text(
            page("x").replace("</head>", '<script src="../../assets/gone.js"></script>\n</head>'))
        with self.assertRaises(SystemExit) as stop:
            build_dist.main()
        self.assertIn("gone.js", str(stop.exception))

    def test_sitemap_lists_every_page_with_its_other_language(self):
        build_dist.main()
        xml = (self.out / "sitemap.xml").read_text(encoding="utf-8")
        self.assertIn('xmlns:xhtml="http://www.w3.org/1999/xhtml"', xml)
        for loc in ("https://komando.efolusi.com/", "https://komando.efolusi.com/id/", "https://komando.efolusi.com/guide/start/",
                    "https://komando.efolusi.com/id/guide/start/", "https://komando.efolusi.com/docs/install/",
                    "https://komando.efolusi.com/id/docs/"):
            self.assertIn(f"<loc>{loc}</loc>", xml)
        entry = re.search(r"<url><loc>https://komando\.efolusi\.com/guide/start/</loc>(.*?)</url>", xml, re.S).group(1)
        self.assertIn('hreflang="id" href="https://komando.efolusi.com/id/guide/start/"', entry)
        self.assertIn('hreflang="x-default" href="https://komando.efolusi.com/guide/start/"', entry)
        # an English page without a twin names no Indonesian alternate
        alone = re.search(r"<url><loc>https://komando\.efolusi\.com/docs/install/</loc>(.*?)</url>", xml, re.S).group(1)
        self.assertNotIn('hreflang="id"', alone)
        self.assertNotIn("index.html", xml)

    def test_robots_allows_all_and_names_the_sitemap(self):
        build_dist.main()
        robots = (self.out / "robots.txt").read_text(encoding="utf-8")
        self.assertIn("User-agent: *\nAllow: /\n", robots)
        self.assertIn("Sitemap: https://komando.efolusi.com/sitemap.xml", robots)

    def test_glyphs_are_a_build_input_and_not_published(self):
        build_dist.main()
        self.assertFalse((self.out / "glyphs").exists())

    def test_linked_file_in_assets_is_refused(self):
        os.symlink(self.secret, self.site / "assets" / "key.css")
        self.assert_refused("assets/key.css")

    def test_linked_top_file_is_refused(self):
        (self.site / "favicon.svg").unlink()
        os.symlink(self.secret, self.site / "favicon.svg")
        self.assert_refused("favicon.svg")

    def test_linked_indonesian_page_is_refused(self):
        (self.site / "id" / "guide" / "start" / "index.html").unlink()
        os.symlink(self.secret, self.site / "id" / "guide" / "start" / "index.html")
        self.assert_refused("id/guide/start/index.html")

    def test_linked_guide_page_is_refused(self):
        (self.site / "guide" / "start" / "index.html").unlink()
        os.symlink(self.secret, self.site / "guide" / "start" / "index.html")
        self.assert_refused("guide/start/index.html")

    def test_linked_docs_page_is_refused(self):
        (self.site / "docs" / "install" / "index.html").unlink()
        os.symlink(self.secret, self.site / "docs" / "install" / "index.html")
        self.assert_refused("docs/install/index.html")

    def test_linked_assets_folder_is_refused(self):
        real = self.repo / "elsewhere"
        (self.site / "assets").rename(real)
        os.symlink(real, self.site / "assets")
        self.assert_refused("assets")


class InlineStyleScan(HTMLParser):
    """The test's own scan (not build_dist's): style attributes, <style> elements, and how each SVG file is used."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.styles = []
        self.svg_uses = []  # (tag, attribute, value) for every attribute that names an .svg file

    def handle_starttag(self, tag, attrs):
        if tag == "style":
            self.styles.append("<style>")
        for name, value in attrs:
            if name == "style":
                self.styles.append(f"<{tag} style=...>")
            if value and re.search(r"\.svg(?:[?#]|$)", value):
                self.svg_uses.append((tag, name, value))


class RealSiteTests(unittest.TestCase):
    """Builds the real web/site and proves that nothing in it needs inline style (style-src 'self', W34)."""

    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        cls.out = Path(cls.tmp.name) / "dist"
        saved = (sys.argv, os.environ.get("GITHUB_SHA"))
        sys.argv = ["build_dist.py", str(cls.out)]
        os.environ["GITHUB_SHA"] = SHA
        try:
            build_dist.main()
        except SystemExit as stop:  # a stopped build is a test error, not the end of the whole run
            raise AssertionError(f"the real site does not build: {stop}") from None
        finally:
            sys.argv = saved[0]
            if saved[1] is None:
                os.environ.pop("GITHUB_SHA", None)
            else:
                os.environ["GITHUB_SHA"] = saved[1]
        cls.html = {p.relative_to(cls.out).as_posix(): p.read_text(encoding="utf-8") for p in sorted(cls.out.rglob("*.html"))}

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    def scan(self, text):
        s = InlineStyleScan()
        s.feed(text)
        s.close()
        return s

    def test_every_page_is_scanned_home_guide_and_docs_in_both_languages(self):
        names = set(self.html)
        for want in ("index.html", "id/index.html", "guide/index.html", "id/guide/index.html", "docs/index.html", "id/docs/index.html"):
            self.assertIn(want, names)
        for prefix in ("guide/", "id/guide/", "docs/", "id/docs/"):
            inner = [n for n in names if n.startswith(prefix) and n.count("/") == prefix.count("/") + 1]
            self.assertTrue(inner, f"no {prefix}<page>/index.html in the build")

    def test_no_page_has_a_style_attribute_or_a_style_element(self):
        found = {name: s.styles for name, text in self.html.items() if (s := self.scan(text)).styles}
        self.assertEqual(found, {})

    def test_the_csp_has_style_src_self_only(self):
        headers = (self.out / "_headers").read_text()
        self.assertIn("; style-src 'self'; ", headers)
        self.assertNotIn("unsafe-inline", headers)

    def test_the_share_card_source_is_not_served(self):
        # web/site/brand/share-card.html has a <style> block; the build's allowlist leaves brand/ behind
        self.assertTrue((build_dist.SITE / "brand" / "share-card.html").is_file())
        self.assertFalse((self.out / "brand").exists())
        self.assertFalse(any(p.name == "share-card.html" for p in self.out.rglob("*")))

    def test_an_svg_with_inline_style_is_only_ever_an_image(self):
        # assets/icons/gemini.svg carries style attributes (the vendor's own drawing). Loaded with <img src> the
        # SVG is an image: the page's CSP does not apply inside it and it runs no script. Inlined, or put in
        # <object>, <embed> or <iframe>, it would be a document under the CSP and its styles would be dropped.
        styled = set()
        for svg in self.out.rglob("*.svg"):
            text = svg.read_text(encoding="utf-8")
            if re.search(r"<style|\sstyle=", text):
                styled.add(svg.name)
        self.assertIn("gemini.svg", styled)  # the known one; the check below covers any other
        for name, text in self.html.items():
            for tag, attr, value in self.scan(text).svg_uses:
                if Path(value.split("?")[0].split("#")[0]).name in styled:
                    self.assertEqual((tag, attr), ("img", "src"), f"{name} uses {value} as <{tag} {attr}>, not as an image")

    def test_no_script_writes_a_style_attribute(self):
        # CSSOM writes (el.style.setProperty, el.style.x = ...) are allowed under style-src 'self';
        # a style attribute, a cssText string or a new <style> element is not
        bad = re.compile(r"setAttribute\(\s*['\"`]style['\"`]|\.cssText\b|createElement\(\s*['\"`]style['\"`]"
                         r"|\.style\s*=[^=]|insertAdjacentHTML|\.innerHTML\s*=|\.outerHTML\s*=")
        scripts = sorted(self.out.rglob("*.js"))
        self.assertTrue(scripts)
        for js in scripts:
            hits = bad.findall(js.read_text(encoding="utf-8"))
            self.assertEqual(hits, [], f"{js.relative_to(self.out)} writes inline style")

    def test_pages_load_only_their_own_scripts(self):
        # the Cloudflare beacon is injected at the edge, not written in a page; every script a page names is ours
        for name, text in self.html.items():
            for src in re.findall(r'<script[^>]*\ssrc="([^"]+)"', text):
                self.assertNotIn("//", src, f"{name} loads {src}")


class WorkerConfigTests(unittest.TestCase):
    """wrangler.jsonc deploys web/dist as static assets on komando.efolusi.com, with no Worker script."""

    def setUp(self):
        import json
        import re
        text = (HERE.parents[1] / "wrangler.jsonc").read_text(encoding="utf-8")
        text = re.sub(r"^\s*//.*$", "", text, flags=re.M)  # comments are whole lines only
        self.config = json.loads(text)

    def test_serves_the_build_output(self):
        self.assertEqual(self.config["assets"]["directory"], "./web/dist")
        self.assertEqual(Path(self.config["assets"]["directory"]).resolve(strict=False).name,
                         build_dist.DEFAULT_OUT.name)

    def test_assets_only(self):
        self.assertNotIn("main", self.config)  # no script: _headers is honoured and nothing runs code

    def test_serves_the_custom_domain(self):
        self.assertEqual(self.config["name"], "komando")  # the Worker has the repo's name
        self.assertEqual(self.config["routes"], [{"pattern": "komando.efolusi.com", "custom_domain": True}])
        self.assertFalse(self.config["workers_dev"])
        self.assertFalse(self.config["preview_urls"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
