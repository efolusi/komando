"""Tests for check_download.py: the W28 draft pages stay off, and a switched-on page names a real download.

Run from the repository root:

    python3 -I web/deploy/test_check_download.py
"""

import importlib.util
import json
import shutil
import sys
import tempfile
import unittest
import urllib.error
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("check_download", HERE / "check_download.py")
check_download = importlib.util.module_from_spec(spec)
spec.loader.exec_module(check_download)

SHA = "a" * 64


def drafts(**changes):
    folder = Path(tempfile.mkdtemp())
    config = {"switchedOn": False, "downloadHost": "download.invalid", "archivePath": "/updates/mac/{channel}/Komando-{version}.zip",
              "macApp": {"released": False, "version": None, "sha256": None, "releaseNotesUrl": None}}
    app = changes.pop("macApp", {})
    config.update(changes)
    config["macApp"].update(app)
    (folder / "config.json").write_text(json.dumps(config))
    (folder / "copy.en.mjs").write_text("export const x = 'done';\n")
    for lang in check_download.LANGS:
        (folder / "out" / lang).mkdir(parents=True)
        for page in check_download.PAGES:
            (folder / "out" / lang / f"{page}.html").write_text('<meta name="robots" content="noindex, nofollow">')
    return folder


def never(url):
    raise AssertionError("no lookup while off")


LIVE = dict(switchedOn=True, downloadHost="download.example.org",
            macApp={"released": True, "version": "v1.0.0", "sha256": SHA, "releaseNotesUrl": "https://example.org/n"})


class CheckDownload(unittest.TestCase):
    def test_off_and_unreferenced_passes(self):
        code, messages = check_download.check(drafts(), [], never)
        self.assertEqual(code, 0, messages)

    def test_a_fake_version_while_unreleased_fails(self):
        code, messages = check_download.check(drafts(macApp={"version": "v1.0.0"}), [], never)
        self.assertEqual(code, 1)
        self.assertIn("not released", messages[0])

    def test_a_link_to_the_drafts_while_off_fails(self):
        nav = Path(tempfile.mkdtemp()) / "header.html"
        nav.write_text('<a href="content/drafts/out/en/download.html">Download</a>')
        code, messages = check_download.check(drafts(), [nav], never)
        self.assertEqual(code, 1)
        self.assertIn("header.html", messages[0])

    def test_a_draft_without_noindex_fails(self):
        folder = drafts()
        (folder / "out" / "en" / "download.html").write_text("<html></html>")
        code, messages = check_download.check(folder, [], never)
        self.assertEqual(code, 1)
        self.assertIn("noindex", messages[0])

    def test_an_empty_out_folder_fails(self):
        folder = drafts()
        for page in (folder / "out").glob("*/*.html"):
            page.unlink()
        code, messages = check_download.check(folder, [], never)
        self.assertEqual(code, 1)
        self.assertEqual(len(messages), 8, messages)
        self.assertIn("missing", messages[0])

    def test_no_out_folder_fails(self):
        folder = drafts()
        shutil.rmtree(folder / "out")
        code, messages = check_download.check(folder, [], never)
        self.assertEqual(code, 1)
        self.assertIn("missing", messages[0])

    def test_one_missing_page_is_named(self):
        folder = drafts()
        (folder / "out" / "id" / "pricing.html").unlink()
        code, messages = check_download.check(folder, [], never)
        self.assertEqual(code, 1)
        self.assertEqual(len(messages), 1, messages)
        self.assertIn("id/pricing.html", messages[0])

    def test_a_missing_shipping_file_fails(self):
        gone = Path(tempfile.mkdtemp()) / "header.html"
        code, messages = check_download.check(drafts(), [gone], never)
        self.assertEqual(code, 1)
        self.assertIn("header.html", messages[0])
        self.assertIn("does not exist", messages[0])

    def test_switched_on_with_a_missing_page_fails(self):
        folder = drafts(**LIVE)
        (folder / "out" / "en" / "support.html").unlink()
        code, messages = check_download.check(folder, [], lambda url: SHA)
        self.assertEqual(code, 1)
        self.assertIn("en/support.html", messages[0])

    def test_switched_on_with_a_matching_download_passes(self):
        code, messages = check_download.check(drafts(**LIVE), [], lambda url: SHA)
        self.assertEqual(code, 0, messages)

    def test_switched_on_with_a_missing_download_fails(self):
        def missing(url):
            raise urllib.error.HTTPError(url, 404, "Not Found", {}, None)
        code, messages = check_download.check(drafts(**LIVE), [], missing)
        self.assertEqual(code, 1)
        self.assertIn("404", messages[0])
        self.assertIn("does not exist", messages[0])

    def test_switched_on_with_another_checksum_fails(self):
        code, messages = check_download.check(drafts(**LIVE), [], lambda url: "b" * 64)
        self.assertEqual(code, 1)
        self.assertIn("sha256", messages[0])

    def test_switched_on_with_the_placeholder_host_fails(self):
        code, messages = check_download.check(drafts(**{**LIVE, "downloadHost": "download.invalid"}), [], lambda url: SHA)
        self.assertEqual(code, 1)
        self.assertIn("placeholder", messages[0])

    def test_switched_on_with_an_open_todo_fails(self):
        folder = drafts(**LIVE)
        (folder / "copy.en.mjs").write_text("export const x = [{ todo: ' set the host' }];\n")
        code, messages = check_download.check(folder, [], lambda url: SHA)
        self.assertEqual(code, 1)
        self.assertIn("todo", messages[0])

    def test_switched_on_with_an_unreachable_host_only_warns(self):
        def down(url):
            raise OSError("no network")
        code, messages = check_download.check(drafts(**LIVE), [], down)
        self.assertEqual(code, 0)
        self.assertIn("WARNING", messages[0])

    def test_the_real_repository_is_off_and_clean(self):
        code, messages = check_download.check(check_download.DRAFTS, check_download.SHIPPING, never)
        self.assertEqual(code, 0, messages)


if __name__ == "__main__":
    unittest.main()
