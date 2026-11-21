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
            "glyphs/a.svg": "<svg/>",
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
        for rel in ("guide/start/index.html", "docs/install/index.html"):
            p = self.site / rel
            p.write_text(page("x").replace("</head>", '<script src="../../assets/meridian/browser/theme-init.js"></script>\n'
                                           '<script type="module" src="../../assets/site.js"></script>\n'
                                           '<script type="application/json">{}</script>\n</head>'))
        build_dist.main()
        headers = (self.out / "_headers").read_text()
        self.assertEqual(len(re.findall(r"'sha256-", headers)), 1)  # still only the <script>1</script> of index.html

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

    def test_linked_file_in_assets_is_refused(self):
        os.symlink(self.secret, self.site / "assets" / "key.css")
        self.assert_refused("assets/key.css")

    def test_linked_folder_in_glyphs_is_refused(self):
        os.symlink(self.secret.parent, self.site / "glyphs" / "more")
        self.assert_refused("glyphs/more")

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
