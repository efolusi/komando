"""Tests for build_dist.py and wrangler.jsonc: a symbolic link in the site is never followed or published,
and the Worker serves only the build output, on komando.efolusi.com only.

Run from the repository root:

    python3 -I web/deploy/test_build_dist.py

Each test builds a small stand-in site in a temporary folder, so the real web/site is never touched.
"""

import importlib.util
import os
import sys
import tempfile
import unittest
from pathlib import Path

sys.dont_write_bytecode = True  # leave no __pycache__ beside the deploy scripts
HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("build_dist", HERE / "build_dist.py")
build_dist = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build_dist)


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
            "index.html": "<!doctype html><title>t</title><script>1</script>",
            "favicon.svg": "<svg/>",
            "share.jpg": "jpg",
            "glyphs/a.svg": "<svg/>",
            "assets/site.css": "body{}",
            "guide/index.html": "<!doctype html><title>g</title>",
            "guide/guide.css": "p{}",
            "guide/start/index.html": "<!doctype html><title>s</title>",
            "docs/index.html": "<!doctype html><title>d</title>",
            "docs/docs.css": "pre{}",
            "docs/install/index.html": "<!doctype html><title>i</title>",
        }.items():
            p = self.site / rel
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(text)
        self.saved = (build_dist.REPO, build_dist.SITE, build_dist.DEFAULT_OUT, sys.argv)
        build_dist.REPO, build_dist.SITE, build_dist.DEFAULT_OUT = self.repo, self.site, self.out
        sys.argv = ["build_dist.py"]

    def tearDown(self):
        build_dist.REPO, build_dist.SITE, build_dist.DEFAULT_OUT, sys.argv = self.saved
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
