// Command docsgen builds the komando command line docs on the website: web/site/docs/<slug>/index.html.
//
//	go run scripts/docsgen/main.go -src KOMANDO/docs/features -out web/site/docs
//	go run scripts/docsgen/main.go -out web/site/docs -check
//
// Run it from the repository root. Standard library only. The built pages are committed, as the guide's are,
// so the site keeps needing no build step to serve. Edit the sources, never the built index.html files.
//
// Two kinds of source, one renderer:
//   - -src: the feature pages of the komando repository (docs/features/*.md), read only. Its README.md gives
//     the order and the one-line summaries of the docs home (its "Every feature" table).
//   - <out>/src: this site's own pages (getting-started.md, switch-from-termius.md), listed in sitePages.
//
// Two languages. Every page is built in English into <out>/<slug>/. A page with an Indonesian twin,
// <out>/src/<slug>.id.md, is also built into web/site/id/docs/<slug>/ (the folder beside <out>'s parent), with its words
// (groups and interface text) from web/site/i18n/docs.id.json. An Indonesian page keeps its English page's heading
// anchors, heading by heading, so the two share their #links; the build stops if their headings differ. A page without a
// twin is not built in Indonesian: a link to it from an Indonesian page goes to the English page, and its language
// switch goes to the Indonesian docs home.
//
// Each page's title is its "# " heading and its lead is its first paragraph. The Markdown is the subset the
// sources use: ## to #### headings, paragraphs, "-" and "1." lists (nested by indent), fenced code, tables,
// "> " notes, `code`, **bold**, *italic* and [text](target) links. A link to NAME.md becomes that page here,
// "site:PATH" a page of this site, and any other relative link the file on GitHub. -check only checks links.
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"html"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
)

// The komando repository's docs on GitHub, for links to files that are not built here.
const repoBlob = "https://github.com/sgnd/komando/blob/main/docs/features/"

// sitePages lists this site's own pages (in <out>/src), first on the docs home, in this order.
var sitePages = []string{"getting-started", "switch-from-termius"}

type page struct {
	slug, group, title, lead string
	md                       string
	site                     bool // one of this site's own pages
}

type heading struct {
	level    int
	id, html string
}

func main() {
	src := flag.String("src", "", "the komando repository's docs/features folder (read only)")
	out := flag.String("out", "web/site/docs", "where the built pages go; its src/ holds this site's own pages")
	checkOnly := flag.Bool("check", false, "only check the links of the built pages")
	flag.Parse()
	outDir = *out
	if !*checkOnly {
		if *src == "" {
			fail("-src is required: the docs/features folder of a komando checkout")
		}
		build(*src, *out)
	}
	ok := check(*out)
	if !check(filepath.Join(*out, "..", "id", "docs")) {
		ok = false
	}
	if !ok {
		os.Exit(1)
	}
}

func fail(format string, a ...any) {
	fmt.Fprintf(os.Stderr, "docsgen: "+format+"\n", a...)
	os.Exit(1)
}

func read(path string) string {
	b, err := os.ReadFile(path)
	if err != nil {
		fail("%v", err)
	}
	return strings.ReplaceAll(string(b), "\r\n", "\n")
}

// ---------------------------------------------------------------- the pages

var rowRe = regexp.MustCompile(`^\|\s*\[([^\]]+)\]\(([a-z0-9-]+)\.md\)\s*\|\s*([^|]+?)\s*\|`)

// words is the Indonesian text of the interface (web/site/i18n/docs.id.json).
type words struct {
	Groups map[string]string `json:"groups"`
	UI     map[string]string `json:"ui"`
}

// lang is one language of the docs. English words are the strings in this file; Indonesian words are in words.
type lang struct {
	code  string // "en" or "id"
	base  string // the folder the language lives in under web/site/: "" or "id/"
	words *words
}

// lookup returns the text for an interface string. English is the string itself; Indonesian is looked up, and a
// string the file lacks is not found, so the build stops instead of showing English on an Indonesian page.
func (l *lang) lookup(text string) (string, bool) {
	if l.words == nil {
		return text, true
	}
	t, ok := l.words.UI[text]
	return t, ok
}

func (l *lang) ui(text string) string {
	t, ok := l.lookup(text)
	if !ok {
		fail("i18n/docs.id.json has no Indonesian text for %q", text)
	}
	return t
}

func (l *lang) group(name string) string {
	if l.words == nil {
		return name
	}
	t, ok := l.words.Groups[name]
	if !ok {
		fail("i18n/docs.id.json has no Indonesian group %q", name)
	}
	return t
}

func readWords(path string) *words {
	var w words
	if err := json.Unmarshal([]byte(read(path)), &w); err != nil {
		fail("%s: %v", path, err)
	}
	return &w
}

func build(src, out string) {
	readme := read(filepath.Join(src, "README.md"))
	var pages []*page
	for _, slug := range sitePages {
		pages = append(pages, load(filepath.Join(out, "src", slug+".md"), slug, "Start here", true))
	}
	summary := map[string]string{}
	seen := map[string]bool{}
	for _, line := range strings.Split(readme, "\n") {
		m := rowRe.FindStringSubmatch(line)
		if m == nil || seen[m[2]] {
			continue
		}
		seen[m[2]] = true
		summary[m[2]] = m[3]
		pages = append(pages, load(filepath.Join(src, m[2]+".md"), m[2], "Features", false))
	}
	// a feature page the table does not list yet still gets built, under "More"
	files, _ := filepath.Glob(filepath.Join(src, "*.md"))
	sort.Strings(files)
	for _, f := range files {
		slug := strings.TrimSuffix(filepath.Base(f), ".md")
		if slug != "README" && !seen[slug] {
			pages = append(pages, load(f, slug, "More", false))
		}
	}
	slugs := map[string]bool{}
	for _, p := range pages {
		if slugs[p.slug] || p.slug == "src" {
			fail("two pages are named %q, or a page is named src", p.slug)
		}
		slugs[p.slug] = true
	}

	ref := gitRef(src)
	// the pages that have an Indonesian twin, in the same order
	var twins []*page
	idSlugs := map[string]bool{}
	for _, p := range pages {
		path := filepath.Join(out, "src", p.slug+".id.md")
		if _, err := os.Stat(path); err != nil {
			continue
		}
		twins = append(twins, load(path, p.slug, p.group, p.site))
		idSlugs[p.slug] = true
	}
	en := &lang{code: "en"}
	headIDs := writeLang(en, pages, slugs, idSlugs, summary, ref, out, nil)

	id := &lang{code: "id", base: "id/", words: readWords(filepath.Join(out, "..", "i18n", "docs.id.json"))}
	writeLang(id, twins, slugs, idSlugs, nil, ref, filepath.Join(out, "..", "id", "docs"), headIDs)
	fmt.Printf("built %d pages in English and %d in Indonesian from %s and %s\n", len(pages)+1, len(twins)+1, src, filepath.Join(out, "src"))
}

// writeLang builds the pages of one language and the docs home. all is every English slug (a link to one that has no
// page in this language goes to the English page); twin is the slugs that have an Indonesian page. fixed holds the English heading ids by slug while building
// Indonesian; it returns the heading ids of what it built.
func writeLang(l *lang, pages []*page, all, twin map[string]bool, summary map[string]string, ref, out string, fixed map[string][]string) map[string][]string {
	own := map[string]bool{}
	for _, p := range pages {
		own[p.slug] = true
	}
	ids := map[string][]string{}
	for i, p := range pages {
		path := "docs/" + p.slug + "/"
		r := &renderer{slug: p.slug, slugs: own, all: all, lang: l, ids: map[string]int{}}
		if fixed != nil {
			r.fixed = fixed[p.slug]
			if r.fixed == nil {
				fail("%s: no English page to take its anchors from", p.slug)
			}
		}
		body, heads, err := r.run(p.md)
		if err != nil {
			fail("%s (%s): %v", p.slug, l.code, err)
		}
		for _, h := range heads {
			ids[p.slug] = append(ids[p.slug], h.id)
		}
		var b strings.Builder
		b.WriteString(head(p.title+" · "+l.ui("komando docs"), p.lead, path, l, l.code == "id" || twin[p.slug]))
		fmt.Fprintf(&b, `<main id="top" class="g-main" tabindex="-1"><div class="g-wrap g-grid">%s`, sidebar(l, pages, p.slug))
		fmt.Fprintf(&b, `<article class="g-article"><p class="g-crumb g-small g-muted"><a href="../">%s</a> · %s</p>`, esc(l.ui("Docs")), esc(l.group(p.group)))
		fmt.Fprintf(&b, `<h1>%s</h1><p class="g-lead">%s</p>%s`, inline(p.title, p.slug, own, l), inline(p.lead, p.slug, own, l), toc(l, heads))
		fmt.Fprintf(&b, `<div class="g-body">%s</div>%s`, body, pager(l, pages, i))
		fmt.Fprintf(&b, `<p class="g-path g-small g-muted">%s</p></article></div></main>`+"\n", source(l, p, ref))
		b.WriteString(foot(l, path, l.code == "id" || twin[p.slug]))
		dir := filepath.Join(out, p.slug)
		if err := os.MkdirAll(dir, 0o755); err != nil {
			fail("%v", err)
		}
		write(filepath.Join(dir, "index.html"), b.String())
	}

	// the docs home: one card per page, under its group
	var b strings.Builder
	b.WriteString(head(l.ui("komando docs"), l.ui("How to use the komando command line, one page per feature."), "docs/", l, true))
	fmt.Fprintf(&b, `<main id="top" class="g-main" tabindex="-1"><div class="g-wrap g-grid">%s`, sidebar(l, pages, ""))
	fmt.Fprintf(&b, `<article class="g-article g-article--index"><h1>%s</h1><div class="g-body g-intro">`, esc(l.ui("komando docs")))
	start := "Getting started"
	for _, p := range pages {
		if p.slug == sitePages[0] {
			start = p.title
		}
	}
	fmt.Fprintf(&b, `<p>%s %s %s <a href="getting-started/">%s</a>.</p>`, esc(l.ui("How to use komando, the free command line for your servers, databases, caches, queues and more, for people and AI agents.")),
		esc(l.ui("One page per feature.")), esc(l.ui("New to komando? Start with")), esc(start))
	fmt.Fprintf(&b, `<p>%s %s <code>komando &lt;command&gt; --help</code>. %s <a href="../guide/">%s</a>.</p>`,
		strings.Replace(esc(l.ui("Commands, flags and file paths are in {mono}.")), "{mono}", "<code>mono</code>", 1),
		esc(l.ui("Help for any command:")), esc(l.ui("Looking for the Mac, iPhone and iPad apps? Read the")), esc(l.ui("user guide")))
	if l.code == "id" {
		fmt.Fprintf(&b, `<p>%s <a href="../../docs/">%s</a>.</p>`, esc(l.ui("Only some docs pages are translated so far; the rest are in English:")), esc(l.ui("all docs pages in English")))
	}
	b.WriteString(`</div>`)
	group := ""
	for _, p := range pages {
		if p.group != group {
			if group != "" {
				b.WriteString("</div></section>")
			}
			fmt.Fprintf(&b, `<section class="g-group" id="%s"><h2>%s</h2><div class="g-cards">`, anchor(p.group), esc(l.group(p.group)))
			group = p.group
		}
		sum := p.lead
		if s, ok := summary[p.slug]; ok {
			sum = upper(s) + "."
		}
		fmt.Fprintf(&b, `<a class="g-card" href="%s/"><span class="g-card__title">%s</span><span class="g-small g-muted">%s</span></a>`,
			esc(p.slug), esc(p.title), plain(sum, l))
	}
	b.WriteString("</div></section>")
	if l.code == "en" {
		fmt.Fprintf(&b, `<p class="g-path g-small g-muted">Built from <a href="https://github.com/sgnd/komando/tree/main/docs/features">docs/features</a> in sgnd/komando%s.</p>`, refText(ref))
	}
	b.WriteString("</article></div></main>\n")
	b.WriteString(foot(l, "docs/", true))
	write(filepath.Join(out, "index.html"), b.String())
	return ids
}

// load reads a page and splits off its title (the "# " line) and its lead (the first paragraph).
func load(path, slug, group string, site bool) *page {
	lines := strings.Split(read(path), "\n")
	p := &page{slug: slug, group: group, site: site}
	i := 0
	for i < len(lines) && strings.TrimSpace(lines[i]) == "" {
		i++
	}
	if i == len(lines) || !strings.HasPrefix(lines[i], "# ") {
		fail("%s: the first line must be a \"# \" title", path)
	}
	p.title = strings.TrimSpace(lines[i][2:])
	i++
	for i < len(lines) && strings.TrimSpace(lines[i]) == "" {
		i++
	}
	var lead []string
	for i < len(lines) && strings.TrimSpace(lines[i]) != "" && !strings.HasPrefix(lines[i], "#") {
		lead = append(lead, strings.TrimSpace(lines[i]))
		i++
	}
	// the feature pages end their first paragraph with a link back to their README; the sidebar does that here
	p.lead = strings.TrimSpace(strings.ReplaceAll(strings.Join(lead, " "), "[All docs](README.md)", ""))
	if p.lead == "" {
		fail("%s: no first paragraph under the title", path)
	}
	p.md = strings.Join(lines[i:], "\n")
	return p
}

func gitRef(dir string) string {
	b, err := exec.Command("git", "-C", dir, "rev-parse", "--short=7", "HEAD").Output()
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(b))
}

func refText(ref string) string {
	if ref == "" {
		return ""
	}
	return fmt.Sprintf(" at commit <code>%s</code>", esc(ref))
}

func source(l *lang, p *page, ref string) string {
	if p.site {
		suffix := ""
		if l.code == "id" {
			suffix = ".id"
		}
		return fmt.Sprintf("%s <code>web/site/docs/src/%s%s.md</code>, %s", esc(l.ui("Source:")), p.slug, suffix, esc(l.ui("written from komando's own docs.")))
	}
	return fmt.Sprintf(`Source: <a href="%s%s.md">docs/features/%s.md</a> in sgnd/komando%s.`, repoBlob, p.slug, p.slug, refText(ref))
}

func write(path, text string) {
	if err := os.WriteFile(path, []byte(text), 0o644); err != nil {
		fail("%v", err)
	}
}

func upper(s string) string {
	if s == "" {
		return s
	}
	return strings.ToUpper(s[:1]) + s[1:]
}

func esc(s string) string { return html.EscapeString(s) }

var tagRe = regexp.MustCompile(`<[^>]+>`)

// plain is the inline HTML of text with the links taken out (for a card, which is itself a link).
func plain(text string, l *lang) string {
	h := inline(text, "", nil, l)
	h = regexp.MustCompile(`</?a[^>]*>`).ReplaceAllString(h, "")
	return h
}

// ---------------------------------------------------------------- Markdown

var (
	headRe   = regexp.MustCompile(`^(#{2,4}) (.+)$`)
	ulRe     = regexp.MustCompile(`^( *)[-*] (.*)$`)
	olRe     = regexp.MustCompile(`^( *)(\d+)\. (.*)$`)
	fenceRe  = regexp.MustCompile("^( *)```")
	anchorRe = regexp.MustCompile(`[^a-z0-9 _-]`)
)

// anchor makes a heading's id the way GitHub does, so the sources' own #links keep working.
func anchor(text string) string {
	text = strings.ToLower(html.UnescapeString(tagRe.ReplaceAllString(text, "")))
	return strings.ReplaceAll(anchorRe.ReplaceAllString(text, ""), " ", "-")
}

type renderer struct {
	slug  string
	slugs map[string]bool // the pages that exist in this language
	all   map[string]bool // every English page: a link to one that is not in slugs goes to the English page
	lang  *lang
	heads []heading
	ids   map[string]int
	fixed []string // heading ids to use, in order (an Indonesian page takes its English page's); nil: make them
	err   error
}

// run renders the Markdown of a page. With fixed ids, the page must have exactly those headings.
func (r *renderer) run(md string) (string, []heading, error) {
	out := r.blocks(strings.Split(md, "\n"))
	if r.err == nil && r.fixed != nil && len(r.heads) != len(r.fixed) {
		r.err = fmt.Errorf("the Indonesian source has %d headings, the English one %d; keep them heading for heading", len(r.heads), len(r.fixed))
	}
	return out, r.heads, r.err
}

func indent(s string) int { return len(s) - len(strings.TrimLeft(s, " ")) }

// dedent takes n spaces (or fewer, on a short line) off the front of each line.
func dedent(lines []string, n int) []string {
	out := make([]string, len(lines))
	for i, l := range lines {
		k := min(indent(l), n)
		out[i] = l[k:]
	}
	return out
}

func startsBlock(line string) bool {
	t := strings.TrimSpace(line)
	return t == "" || headRe.MatchString(line) || fenceRe.MatchString(line) || strings.HasPrefix(t, "|") ||
		strings.HasPrefix(t, ">") || ulRe.MatchString(line) || olRe.MatchString(line)
}

func (r *renderer) blocks(lines []string) string {
	var out []string
	for i := 0; i < len(lines); {
		line := lines[i]
		t := strings.TrimSpace(line)
		switch {
		case t == "":
			i++
		case fenceRe.MatchString(line):
			n := indent(line)
			var code []string
			i++
			for i < len(lines) && !strings.HasPrefix(strings.TrimSpace(lines[i]), "```") {
				code = append(code, lines[i])
				i++
			}
			i++
			out = append(out, `<pre class="d-code" tabindex="0" role="region" aria-label="`+esc(r.lang.ui("Code"))+`"><code>`+esc(strings.Join(dedent(code, n), "\n"))+`</code></pre>`)
		case headRe.MatchString(line):
			m := headRe.FindStringSubmatch(line)
			level := len(m[1])
			text := r.inline(m[2])
			var id string
			if r.fixed != nil {
				if len(r.heads) >= len(r.fixed) {
					r.err = fmt.Errorf("the Indonesian source has more headings than the English one")
					id = fmt.Sprintf("extra-%d", len(r.heads))
				} else {
					id = r.fixed[len(r.heads)]
				}
			} else {
				id = anchor(text)
				if k := r.ids[id]; k > 0 {
					r.ids[id] = k + 1
					id = fmt.Sprintf("%s-%d", id, k)
				} else {
					r.ids[id] = 1
				}
			}
			r.heads = append(r.heads, heading{level, id, text})
			out = append(out, fmt.Sprintf(`<h%d id="%s">%s</h%d>`, level, id, text, level))
			i++
		case strings.HasPrefix(t, "|"):
			var rows []string
			for i < len(lines) && strings.HasPrefix(strings.TrimSpace(lines[i]), "|") {
				rows = append(rows, strings.TrimSpace(lines[i]))
				i++
			}
			out = append(out, r.table(rows))
		case strings.HasPrefix(t, ">"):
			var note []string
			for i < len(lines) && strings.HasPrefix(strings.TrimSpace(lines[i]), ">") {
				note = append(note, strings.TrimPrefix(strings.TrimPrefix(strings.TrimSpace(lines[i]), ">"), " "))
				i++
			}
			out = append(out, `<aside class="g-note">`+r.blocks(note)+`</aside>`)
		case ulRe.MatchString(line) || olRe.MatchString(line):
			var h string
			h, i = r.list(lines, i)
			out = append(out, h)
		default:
			para := []string{t}
			i++
			for i < len(lines) && !startsBlock(lines[i]) {
				para = append(para, strings.TrimSpace(lines[i]))
				i++
			}
			out = append(out, "<p>"+r.inline(strings.Join(para, " "))+"</p>")
		}
	}
	return strings.Join(out, "\n")
}

// list reads one list from lines[i]: every item and the lines indented under it, each rendered as blocks.
func (r *renderer) list(lines []string, i int) (string, int) {
	ordered := !ulRe.MatchString(lines[i])
	base := indent(lines[i])
	var items []string
	for i < len(lines) {
		line := lines[i]
		var text string
		var width int
		if m := ulRe.FindStringSubmatch(line); m != nil && !ordered && len(m[1]) == base {
			text, width = m[2], base+2
		} else if m := olRe.FindStringSubmatch(line); m != nil && ordered && len(m[1]) == base {
			text, width = m[3], base+len(m[2])+2
		} else {
			break
		}
		body := []string{text}
		i++
		for i < len(lines) {
			l := lines[i]
			if strings.TrimSpace(l) == "" {
				// a blank line stays in the item only when the next text is indented under it
				j := i
				for j < len(lines) && strings.TrimSpace(lines[j]) == "" {
					j++
				}
				if j < len(lines) && indent(lines[j]) >= width {
					body = append(body, "")
					i++
					continue
				}
				break
			}
			if indent(l) <= base {
				break
			}
			body = append(body, l)
			i++
		}
		inner := dedent(body[1:], width)
		// lines that only carry on the first one belong to its sentence
		first := []string{strings.TrimSpace(body[0])}
		for len(inner) > 0 && !startsBlock(inner[0]) {
			first = append(first, strings.TrimSpace(inner[0]))
			inner = inner[1:]
		}
		items = append(items, "<li>"+r.inline(strings.Join(first, " "))+r.blocks(inner)+"</li>")
		// a blank line between two items of the same list keeps the list going
		j := i
		for j < len(lines) && strings.TrimSpace(lines[j]) == "" {
			j++
		}
		if j > i && j < len(lines) && indent(lines[j]) == base && (ulRe.MatchString(lines[j]) || olRe.MatchString(lines[j])) {
			i = j
		}
	}
	tag := "ul"
	if ordered {
		tag = "ol"
	}
	return fmt.Sprintf(`<%s class="g-list g-list--%s">%s</%s>`, tag, tag, strings.Join(items, ""), tag), i
}

// cells splits a table row on "|", but not on "\|" or a "|" inside `code`.
func cells(row string) []string {
	row = strings.TrimSuffix(strings.TrimPrefix(row, "|"), "|")
	var out []string
	var cur strings.Builder
	inCode := false
	for i := 0; i < len(row); i++ {
		c := row[i]
		switch {
		case c == '\\' && i+1 < len(row) && row[i+1] == '|':
			cur.WriteByte('|')
			i++
		case c == '`':
			inCode = !inCode
			cur.WriteByte(c)
		case c == '|' && !inCode:
			out = append(out, strings.TrimSpace(cur.String()))
			cur.Reset()
		default:
			cur.WriteByte(c)
		}
	}
	return append(out, strings.TrimSpace(cur.String()))
}

var sepRe = regexp.MustCompile(`^\|?[\s:|-]+$`)

func (r *renderer) table(rows []string) string {
	var b strings.Builder
	b.WriteString(`<div class="d-table" role="region" aria-label="` + esc(r.lang.ui("Table")) + `" tabindex="0"><table>`)
	body := rows[1:]
	if len(body) > 0 && sepRe.MatchString(body[0]) {
		body = body[1:]
	}
	b.WriteString("<thead><tr>")
	for _, c := range cells(rows[0]) {
		fmt.Fprintf(&b, `<th scope="col">%s</th>`, r.inline(c))
	}
	b.WriteString("</tr></thead><tbody>")
	for _, row := range body {
		b.WriteString("<tr>")
		for _, c := range cells(row) {
			fmt.Fprintf(&b, "<td>%s</td>", r.inline(c))
		}
		b.WriteString("</tr>")
	}
	b.WriteString("</tbody></table></div>")
	return b.String()
}

var (
	codeRe   = regexp.MustCompile("`([^`]+)`")
	linkRe   = regexp.MustCompile(`\[([^\]]+)\]\(([^)\s]+)\)`)
	boldRe   = regexp.MustCompile(`\*\*(.+?)\*\*`)
	italicRe = regexp.MustCompile(`(^|[\s(])\*([^*\s](?:[^*]*[^*\s])?)\*($|[\s.,;:)])`)
	keepRe   = regexp.MustCompile("\x00(\\d+)\x00")
)

func inline(text, slug string, slugs map[string]bool, l *lang) string {
	return (&renderer{slug: slug, slugs: slugs, lang: l}).inline(text)
}

// inline escapes the text, then turns `code`, links, **bold** and *italic* into HTML.
func (r *renderer) inline(text string) string {
	var codes []string
	text = codeRe.ReplaceAllStringFunc(text, func(m string) string {
		codes = append(codes, m[1:len(m)-1])
		return fmt.Sprintf("\x00%d\x00", len(codes)-1)
	})
	text = esc(text)
	text = linkRe.ReplaceAllStringFunc(text, func(m string) string {
		s := linkRe.FindStringSubmatch(m)
		return fmt.Sprintf(`<a href="%s">%s</a>`, esc(r.href(html.UnescapeString(s[2]))), s[1])
	})
	text = boldRe.ReplaceAllString(text, "<b>$1</b>")
	text = italicRe.ReplaceAllString(text, "$1<i>$2</i>$3")
	return keepRe.ReplaceAllStringFunc(text, func(m string) string {
		var n int
		fmt.Sscanf(strings.Trim(m, "\x00"), "%d", &n)
		return "<code>" + esc(codes[n]) + "</code>"
	})
}

// href maps a link in the sources to its place on this site. slug "" is the docs home.
func (r *renderer) href(target string) string {
	for _, p := range []string{"https://", "http://", "#", "mailto:"} {
		if strings.HasPrefix(target, p) {
			return target
		}
	}
	file, frag, _ := strings.Cut(target, "#")
	if frag != "" {
		frag = "#" + frag
	}
	up := "../"
	if r.slug == "" {
		up = ""
	}
	switch {
	case file == "README.md":
		if up == "" {
			return "./" + frag
		}
		return up + frag
	case strings.HasPrefix(file, "site:"): // a page of this site: site:guide/ or site:index.html#install
		return up + "../" + strings.TrimPrefix(file, "site:") + frag
	case !strings.Contains(file, "/") && strings.HasSuffix(file, ".md") && r.slugs[strings.TrimSuffix(file, ".md")]:
		return up + strings.TrimSuffix(file, ".md") + "/" + frag
	case !strings.Contains(file, "/") && strings.HasSuffix(file, ".md") && r.all[strings.TrimSuffix(file, ".md")]:
		// a page this language does not have yet: the English page, up to the site's root and down again
		return up + "../../docs/" + strings.TrimSuffix(file, ".md") + "/" + frag
	case file == "":
		return frag
	}
	// any other relative file lives in the komando repository: link to it on GitHub
	return repoBlob + filepath.ToSlash(filepath.Clean(file)) + frag
}

// ---------------------------------------------------------------- the page frame (as guide/build.py draws it)

// siteURL is where the site is served (owner, 2026-11-18: a Cloudflare Worker on a subdomain of efolusi.com)
const siteURL = "https://komando.efolusi.com/"

// shellDir holds the page shell partials web/site/build.mjs renders with Meridian, relative to -out; one folder per language
const shellDir = "../_shell"

var outDir string

// shell reads one partial; {{root}} becomes the way up to web/site/, {{switch}} the address of the page in the other
// language, and the nav link named current is marked
func shell(l *lang, name, root, switchTo, current string) string {
	text := read(filepath.Join(outDir, shellDir, l.code, name+".html"))
	text = strings.ReplaceAll(strings.ReplaceAll(text, "{{root}}", root), "{{switch}}", switchTo)
	if current != "" {
		text = strings.ReplaceAll(text, `data-nav="`+current+`"`, `data-nav="`+current+`" aria-current="page"`)
	}
	return strings.TrimRight(text, "\n")
}

// rootOf is the way from the page at path (such as "docs/" or "docs/install/") up to web/site/.
func rootOf(path string, l *lang) string {
	root := "../../"
	if path == "docs/" {
		root = "../"
	}
	if l.code == "id" {
		root += "../"
	}
	return root
}

// switchHref is where the language switch of the page at path goes. An English page goes to its Indonesian twin, or to
// the Indonesian docs home when it has none; an Indonesian page goes to its English page.
func switchHref(path string, l *lang, hasTwin bool) string {
	root := rootOf(path, l)
	if l.code == "id" {
		return root + path
	}
	if !hasTwin {
		path = "docs/"
	}
	return root + "id/" + path
}

// alternates are the hreflang links of the page at path: en and x-default (the English page), and id when it has a twin.
func alternates(path string, hasTwin bool) string {
	line := func(code, base string) string {
		return fmt.Sprintf(`<link rel="alternate" hreflang="%s" href="%s%s%s">`, code, siteURL, base, path)
	}
	lines := []string{line("en", "")}
	if hasTwin {
		lines = append(lines, line("id", "id/"))
	}
	return strings.Join(append(lines, line("x-default", "")), "\n")
}

// head starts a docs page; path is the page's own path under the site, such as "docs/" or "docs/install/"; hasTwin says
// whether the page exists in both languages (the docs home always does)
func head(title, description, path string, l *lang, hasTwin bool) string {
	root, current := rootOf(path, l), ""
	if path == "docs/" {
		current = "docs"
	}
	description = html.UnescapeString(tagRe.ReplaceAllString(inline(description, "", nil, l), ""))
	switchTo := switchHref(path, l, hasTwin)
	return fmt.Sprintf(`<!doctype html>
<html lang="%s">
<head>
<meta charset="utf-8">
<title>%s</title>
<meta name="description" content="%s">
<link rel="canonical" href="%s%s%s">
%s
%s
<link rel="stylesheet" href="%[9]sguide/guide.css">
<link rel="stylesheet" href="%[9]sdocs/docs.css">
<!-- built by scripts/docsgen from komando's docs/features and docs/src/; edit the source, not this file -->
</head>
<body>
%s
`, l.code, esc(title), esc(description), siteURL, l.base, path, alternates(path, hasTwin), shell(l, "head", root, switchTo, ""), root, shell(l, "header", root, switchTo, current))
}

func foot(l *lang, path string, hasTwin bool) string {
	return shell(l, "footer", rootOf(path, l), switchHref(path, l, hasTwin), "") + "\n</body>\n</html>\n"
}

func sidebar(l *lang, pages []*page, current string) string {
	up := "../"
	if current == "" {
		up = ""
	}
	var b strings.Builder
	group := ""
	for _, p := range pages {
		if p.group != group {
			if group != "" {
				b.WriteString("</ul>")
			}
			fmt.Fprintf(&b, `<p class="g-label g-side__group">%s</p><ul>`, esc(l.group(p.group)))
			group = p.group
		}
		cur := ""
		if p.slug == current {
			cur = ` aria-current="page"`
		}
		fmt.Fprintf(&b, `<li><a href="%s%s/"%s>%s</a></li>`, up, p.slug, cur, esc(p.title))
	}
	b.WriteString("</ul>")
	if l.code == "id" {
		// the pages that are not translated yet are the English docs
		fmt.Fprintf(&b, `<p class="g-side__home"><a href="%s../../docs/" hreflang="en" lang="en">%s</a></p>`, up, esc(l.ui("all docs pages in English")))
	}
	home, homeCur := up, ""
	if current == "" {
		home, homeCur = "./", ` aria-current="page"`
	}
	return fmt.Sprintf(`<nav class="g-side" aria-label="%s"><details class="g-side__fold" open><summary>%s</summary>`+
		`<p class="g-side__home"><a href="%s"%s>%s</a></p>%s</details></nav>`, esc(l.ui("Docs")), esc(l.ui("All docs pages")), home, homeCur, esc(l.ui("Docs home")), b.String())
}

func toc(l *lang, heads []heading) string {
	var links []string
	for _, h := range heads {
		if h.level == 2 {
			links = append(links, fmt.Sprintf(`<li><a href="#%s">%s</a></li>`, h.id, h.html))
		}
	}
	if len(links) < 3 {
		return ""
	}
	on := esc(l.ui("On this page"))
	return `<nav class="g-toc" aria-label="` + on + `"><p class="g-label g-muted">` + on + `</p><ul>` + strings.Join(links, "") + `</ul></nav>`
}

func pager(l *lang, pages []*page, i int) string {
	prevL, nextL := esc(l.ui("Previous")), esc(l.ui("Next"))
	prev := fmt.Sprintf(`<a class="g-pn g-pn--prev" href="../"><span class="g-label g-muted">%s</span>%s</a>`, prevL, esc(l.ui("Docs home")))
	if i > 0 {
		prev = fmt.Sprintf(`<a class="g-pn g-pn--prev" href="../%s/"><span class="g-label g-muted">%s</span>%s</a>`, esc(pages[i-1].slug), prevL, esc(pages[i-1].title))
	}
	next := ""
	if i+1 < len(pages) {
		next = fmt.Sprintf(`<a class="g-pn g-pn--next" href="../%s/"><span class="g-label g-muted">%s</span>%s</a>`, esc(pages[i+1].slug), nextL, esc(pages[i+1].title))
	}
	return `<nav class="g-pager" aria-label="` + esc(l.ui("Previous and next page")) + `">` + prev + next + `</nav>`
}

// ---------------------------------------------------------------- link check

var (
	refRe = regexp.MustCompile(`(?:href|src)="([^"]*)"`)
	idRe  = regexp.MustCompile(`\sid="([^"]*)"`)
	extRe = regexp.MustCompile(`^(https?:|mailto:|data:)`)
)

// check follows every relative link and anchor in the built pages, as guide/build.py does for the guide.
func check(out string) bool {
	var files []string
	filepath.WalkDir(out, func(path string, d os.DirEntry, err error) error {
		if err == nil && !d.IsDir() && strings.HasSuffix(path, ".html") {
			files = append(files, path)
		}
		return nil
	})
	if len(files) == 0 {
		fmt.Println("no built pages to check")
		return false
	}
	ids := map[string]map[string]bool{}
	idsOf := func(path string) map[string]bool {
		if m, ok := ids[path]; ok {
			return m
		}
		m := map[string]bool{}
		for _, x := range idRe.FindAllStringSubmatch(read(path), -1) {
			m[html.UnescapeString(x[1])] = true
		}
		ids[path] = m
		return m
	}
	bad, count := 0, 0
	for _, path := range files {
		for _, m := range refRe.FindAllStringSubmatch(read(path), -1) {
			ref := html.UnescapeString(m[1])
			if extRe.MatchString(ref) || strings.HasPrefix(ref, "//") {
				continue
			}
			count++
			target, frag, _ := strings.Cut(ref, "#")
			if strings.HasPrefix(target, "/") {
				fmt.Printf("BROKEN %s: %s (starts with /: the site's domain is not decided, use a relative link)\n", path, ref)
				bad++
				continue
			}
			dest := path
			if target != "" {
				dest = filepath.Join(filepath.Dir(path), target)
			}
			if st, err := os.Stat(dest); err == nil && st.IsDir() {
				dest = filepath.Join(dest, "index.html")
			}
			if _, err := os.Stat(dest); err != nil {
				fmt.Printf("BROKEN %s: %s (no such file)\n", path, ref)
				bad++
				continue
			}
			if frag != "" && strings.HasSuffix(dest, ".html") && !idsOf(dest)[frag] {
				fmt.Printf("BROKEN %s: %s (no id %q in %s)\n", path, ref, frag, dest)
				bad++
			}
		}
	}
	fmt.Printf("checked %d internal links in %d pages: %d broken\n", count, len(files), bad)
	return bad == 0
}
