"""Tests for check_release.py: the release the home page names must be the newest komando release, in the checkout
and on the live site.

Run from the repository root:

    python3 -I web/deploy/test_check_release.py
"""

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("check_release", HERE / "check_release.py")
check_release = importlib.util.module_from_spec(spec)
spec.loader.exec_module(check_release)


def home(release):
    path = Path(tempfile.mkdtemp()) / "home.en.mjs"
    path.write_text(f"export const release = '{release}';\nexport const installSha = 'x';\n")
    return path


class CheckRelease(unittest.TestCase):
    def test_passes_when_the_page_names_the_newest_release(self):
        code, message = check_release.check(home("v0.17.0"), lambda: "v0.17.0")
        self.assertEqual(code, 0, message)

    def test_fails_loudly_when_the_page_lags(self):
        code, message = check_release.check(home("v0.15.0"), lambda: "v0.17.0")
        self.assertEqual(code, 1)
        self.assertIn("v0.15.0", message)
        self.assertIn("v0.17.0", message)
        self.assertIn("set_release.py", message)

    def test_a_failed_lookup_warns_and_does_not_fail(self):
        def broken():
            raise OSError("network down")
        code, message = check_release.check(home("v0.15.0"), broken)
        self.assertEqual(code, 0)
        self.assertIn("WARNING", message)

    def test_an_answer_that_is_not_a_version_tag_is_a_failed_lookup(self):
        code, message = check_release.check(home("v0.17.0"), lambda: "latest")
        self.assertEqual(code, 0)
        self.assertIn("WARNING", message)

    def test_the_page_must_name_a_release_at_all(self):
        path = Path(tempfile.mkdtemp()) / "home.en.mjs"
        path.write_text("export const installSha = 'x';\n")
        code, message = check_release.check(path, lambda: "v0.17.0")
        self.assertEqual(code, 1)


SHA = "a" * 40
OLD_SHA = "b" * 40


def live_page(tag, sha=SHA, extra=""):
    # the shape the build serves: the release marker in the head, the tag in several data-release elements
    return (f'<html><head><meta name="release" content="{sha}"></head><body>'
            f'<span data-release="">{tag}</span>'
            f'<a href="https://github.com/sgnd/komando/releases/tag/{tag}" data-release>{tag}</a>{extra}</body></html>')


def live(tag, sha=SHA):
    return {"/": live_page(tag, sha), "/id/": live_page(tag, sha)}


class CheckLive(unittest.TestCase):
    def test_passes_when_the_live_page_names_the_checkout_and_the_newest_release(self):
        code, message = check_release.check_live(live("v0.18.0"), "v0.18.0", lambda: "v0.18.0")
        self.assertEqual(code, 0, message)
        self.assertIn("v0.18.0", message)

    def test_a_live_page_that_lags_says_to_run_set_release_then_tag(self):
        code, message = check_release.check_live(live("v0.17.0"), "v0.17.0", lambda: "v0.18.0")
        self.assertEqual(code, 1)
        self.assertIn("set_release.py v0.18.0", message)
        self.assertIn("tag", message)

    def test_a_merged_release_that_is_not_deployed_says_to_tag_main(self):
        code, message = check_release.check_live(live("v0.17.0"), "v0.18.0", lambda: "v0.18.0")
        self.assertEqual(code, 1)
        self.assertIn("v0.17.0", message)
        self.assertIn("v0.18.0", message)
        self.assertIn("tag main", message)

    def test_a_failed_lookup_warns_when_the_live_page_matches_the_checkout(self):
        def broken():
            raise OSError("rate limited")
        code, message = check_release.check_live(live("v0.18.0"), "v0.18.0", broken)
        self.assertEqual(code, 0)
        self.assertIn("WARNING", message)

    def test_a_failed_lookup_does_not_hide_a_live_page_behind_the_checkout(self):
        def broken():
            raise OSError("rate limited")
        code, _ = check_release.check_live(live("v0.17.0"), "v0.18.0", broken)
        self.assertEqual(code, 1)

    def test_a_live_page_without_a_release_fails(self):
        pages = {"/": "<html><head></head><body>komando</body></html>", "/id/": live_page("v0.18.0")}
        code, message = check_release.check_live(pages, "v0.18.0", lambda: "v0.18.0")
        self.assertEqual(code, 1)
        self.assertIn("/", message)

    def test_two_tags_on_one_page_fail(self):
        pages = {"/": live_page("v0.18.0", extra="<span data-release>v0.17.0</span>"), "/id/": live_page("v0.18.0")}
        code, message = check_release.check_live(pages, "v0.18.0", lambda: "v0.18.0")
        self.assertEqual(code, 1)
        self.assertIn("v0.17.0", message)

    def test_the_two_languages_must_name_the_same_tag(self):
        pages = {"/": live_page("v0.18.0"), "/id/": live_page("v0.17.0")}
        code, message = check_release.check_live(pages, "v0.18.0", lambda: "v0.18.0")
        self.assertEqual(code, 1)
        self.assertIn("/id/", message)

    def test_an_attribute_that_only_starts_with_data_release_is_not_a_release(self):
        pages = {p: live_page("v0.18.0", extra='<span data-release-line>v0.1.0</span>') for p in ("/", "/id/")}
        code, message = check_release.check_live(pages, "v0.18.0", lambda: "v0.18.0")
        self.assertEqual(code, 0, message)

    def test_after_a_deploy_the_live_page_must_serve_the_deployed_commit(self):
        code, message = check_release.check_live(live("v0.18.0", OLD_SHA), "v0.18.0", lambda: "v0.18.0", expect_sha=SHA)
        self.assertEqual(code, 1)
        self.assertIn(OLD_SHA, message)
        self.assertIn(SHA, message)

    def test_after_a_deploy_the_deployed_commit_passes(self):
        code, message = check_release.check_live(live("v0.18.0"), "v0.18.0", lambda: "v0.18.0", expect_sha=SHA)
        self.assertEqual(code, 0, message)


class FetchLive(unittest.TestCase):
    def test_reads_every_page_once_when_no_commit_is_expected(self):
        calls = []

        def fetch(path):
            calls.append(path)
            return live_page("v0.18.0", OLD_SHA)
        pages = check_release.fetch_live(fetch, None, tries=3, wait=0, sleep=lambda s: None)
        self.assertEqual(sorted(pages), ["/", "/id/"])
        self.assertEqual(len(calls), 2)

    def test_waits_until_the_deployed_commit_is_served(self):
        served = iter([OLD_SHA, OLD_SHA, SHA, SHA, SHA, SHA])
        sleeps = []
        pages = check_release.fetch_live(lambda path: live_page("v0.18.0", next(served)), SHA, tries=5, wait=7,
                                         sleep=sleeps.append)
        self.assertTrue(all(SHA in html for html in pages.values()))
        self.assertEqual(sleeps, [7])

    def test_gives_up_after_the_last_try_and_returns_what_is_served(self):
        sleeps = []
        pages = check_release.fetch_live(lambda path: live_page("v0.18.0", OLD_SHA), SHA, tries=3, wait=1,
                                         sleep=sleeps.append)
        self.assertEqual(len(sleeps), 2)
        self.assertTrue(all(OLD_SHA in html for html in pages.values()))

    def test_a_page_that_cannot_be_read_is_retried_then_raised(self):
        def down(path):
            raise OSError("connection refused")
        with self.assertRaises(OSError):
            check_release.fetch_live(down, SHA, tries=2, wait=0, sleep=lambda s: None)


if __name__ == "__main__":
    unittest.main()
