"""Tests for check_release.py: the release the home page names must be the newest komando release.

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


if __name__ == "__main__":
    unittest.main()
