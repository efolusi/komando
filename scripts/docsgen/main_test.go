package main

import (
	"strings"
	"testing"
)

var testWords = &words{
	Groups: map[string]string{"Start here": "Mulai di sini"},
	UI:     map[string]string{"Docs": "Dokumentasi"},
}

func TestEnglishWordsAreTheKeys(t *testing.T) {
	en := &lang{code: "en"}
	if got, ok := en.lookup("Docs home"); !ok || got != "Docs home" {
		t.Fatalf("English lookup = %q, %v; want the key itself", got, ok)
	}
	if got := en.group("Start here"); got != "Start here" {
		t.Fatalf("English group = %q", got)
	}
}

func TestIndonesianWordsComeFromTheFile(t *testing.T) {
	id := &lang{code: "id", base: "id/", words: testWords}
	if got, ok := id.lookup("Docs"); !ok || got != "Dokumentasi" {
		t.Fatalf("lookup = %q, %v", got, ok)
	}
	if _, ok := id.lookup("Docs home"); ok {
		t.Fatal("a string the file does not have must not be found: the build stops on it, it never falls back to English")
	}
	if got := id.group("Start here"); got != "Mulai di sini" {
		t.Fatalf("group = %q", got)
	}
}

func idRenderer() *renderer {
	return &renderer{
		slug:  "getting-started",
		slugs: map[string]bool{"getting-started": true},
		all:   map[string]bool{"getting-started": true, "install": true},
		lang:  &lang{code: "id", base: "id/", words: testWords},
		ids:   map[string]int{},
	}
}

func TestIndonesianLinksStayInIndonesianOrGoToTheEnglishPage(t *testing.T) {
	r := idRenderer()
	cases := map[string]string{
		"getting-started.md#2-add":  "../getting-started/#2-add",
		"install.md":                "../../../docs/install/",
		"install.md#windows":        "../../../docs/install/#windows",
		"README.md":                 "../",
		"site:guide/":               "../../guide/",
		"site:index.html#install":   "../../index.html#install",
		"https://example.com/a":     "https://example.com/a",
		"#top":                      "#top",
		"../design/sync.md#section": repoBlob + "../design/sync.md#section",
	}
	for in, want := range cases {
		if got := r.href(in); got != want {
			t.Errorf("href(%q) = %q, want %q", in, got, want)
		}
	}
}

func TestEnglishLinksAreUnchanged(t *testing.T) {
	r := &renderer{slug: "getting-started", slugs: map[string]bool{"getting-started": true, "install": true}, lang: &lang{code: "en"}}
	if got := r.href("install.md"); got != "../install/" {
		t.Errorf("href = %q", got)
	}
	if got := r.href("site:guide/"); got != "../../guide/" {
		t.Errorf("href = %q", got)
	}
}

func TestIndonesianHeadingsTakeTheEnglishAnchors(t *testing.T) {
	r := idRenderer()
	r.fixed = []string{"1-install-komando", "2-add-a-server"}
	out, heads, err := r.run("## 1. Instal komando\n\nTeks.\n\n## 2. Tambah server\n")
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(out, `<h2 id="1-install-komando">1. Instal komando</h2>`) || !strings.Contains(out, `<h2 id="2-add-a-server">`) {
		t.Fatalf("anchors not taken from English:\n%s", out)
	}
	if len(heads) != 2 || heads[1].id != "2-add-a-server" {
		t.Fatalf("heads = %+v", heads)
	}
}

func TestIndonesianSourceMustHaveTheEnglishHeadings(t *testing.T) {
	for name, md := range map[string]string{
		"fewer": "## Satu\n",
		"more":  "## Satu\n\n## Dua\n\n## Tiga\n",
	} {
		r := idRenderer()
		r.fixed = []string{"one", "two"}
		if _, _, err := r.run(md); err == nil {
			t.Errorf("%s headings: want an error, got none", name)
		}
	}
}

func TestPageWithoutHeadingsStillHasItsAnchorList(t *testing.T) {
	ids := headingIDs(nil)
	if ids == nil {
		t.Fatal("an English page with no headings must still give an empty, non-nil anchor list: the Indonesian twin looks it up by slug")
	}
	r := idRenderer()
	r.fixed = ids
	if _, _, err := r.run("Teks tanpa judul.\n"); err != nil {
		t.Fatalf("a twin with no headings against a page with none: %v", err)
	}
}

func TestSwitchAndAlternates(t *testing.T) {
	en := &lang{code: "en"}
	id := &lang{code: "id", base: "id/", words: testWords}

	// an English page with a twin goes to it; one without goes to the Indonesian docs home
	if got := switchHref("docs/getting-started/", en, true); got != "../../id/docs/getting-started/" {
		t.Errorf("twin: %q", got)
	}
	if got := switchHref("docs/install/", en, false); got != "../../id/docs/" {
		t.Errorf("no twin: %q", got)
	}
	if got := switchHref("docs/", en, true); got != "../id/docs/" {
		t.Errorf("home: %q", got)
	}
	// an Indonesian page goes to its English page
	if got := switchHref("docs/getting-started/", id, true); got != "../../../docs/getting-started/" {
		t.Errorf("id page: %q", got)
	}
	if got := switchHref("docs/", id, true); got != "../../docs/" {
		t.Errorf("id home: %q", got)
	}

	with := alternates("docs/getting-started/", true)
	if !strings.Contains(with, `hreflang="id" href="https://komando.efolusi.com/id/docs/getting-started/"`) || !strings.Contains(with, `hreflang="x-default" href="https://komando.efolusi.com/docs/getting-started/"`) {
		t.Errorf("with twin:\n%s", with)
	}
	without := alternates("docs/install/", false)
	if strings.Contains(without, `hreflang="id"`) || !strings.Contains(without, `hreflang="en"`) || !strings.Contains(without, `hreflang="x-default"`) {
		t.Errorf("without twin:\n%s", without)
	}
}

func TestEverySlugOfSectionsIsListedOnce(t *testing.T) {
	seen := map[string]string{}
	for _, s := range sections {
		if len(s.slugs) == 0 {
			t.Fatalf("section %q is empty", s.name)
		}
		for _, slug := range s.slugs {
			if other, dup := seen[slug]; dup {
				t.Fatalf("%q is in both %q and %q", slug, other, s.name)
			}
			seen[slug] = s.name
		}
	}
}

func TestPlaceOrdersPagesBySectionAndNamesTheirGroup(t *testing.T) {
	var pages []*page
	for i := len(sections) - 1; i >= 0; i-- { // reversed on purpose
		for j := len(sections[i].slugs) - 1; j >= 0; j-- {
			pages = append(pages, &page{slug: sections[i].slugs[j]})
		}
	}
	placed := place(pages)
	if len(placed) != len(pages) {
		t.Fatalf("placed %d pages, want %d", len(placed), len(pages))
	}
	if placed[0].slug != sections[0].slugs[0] || placed[0].group != sections[0].name {
		t.Fatalf("first page = %s in %q, want %s in %q", placed[0].slug, placed[0].group, sections[0].slugs[0], sections[0].name)
	}
	last := sections[len(sections)-1]
	if got := placed[len(placed)-1]; got.slug != last.slugs[len(last.slugs)-1] || got.group != last.name {
		t.Fatalf("last page = %s in %q", got.slug, got.group)
	}
}
