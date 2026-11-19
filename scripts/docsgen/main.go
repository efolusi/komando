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
// Each page's title is its "# " heading and its lead is its first paragraph. The Markdown is the subset the
// sources use: ## to #### headings, paragraphs, "-" and "1." lists (nested by indent), fenced code, tables,
// "> " notes, `code`, **bold**, *italic* and [text](target) links. A link to NAME.md becomes that page here,
// "site:PATH" a page of this site, and any other relative link the file on GitHub. -check only checks links.
package main

import (
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
	if !*checkOnly {
		if *src == "" {
			fail("-src is required: the docs/features folder of a komando checkout")
		}
		build(*src, *out)
	}
	if !check(*out) {
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
	for i, p := range pages {
		body, heads := render(p.md, p.slug, slugs)
		var b strings.Builder
		b.WriteString(head(p.title+" · komando docs", p.lead, "docs/"+p.slug+"/"))
		fmt.Fprintf(&b, `<main id="top" class="g-main"><div class="wrap g-grid">%s`, sidebar(pages, p.slug))
		fmt.Fprintf(&b, `<article class="g-article"><p class="g-crumb t-small muted"><a href="../">Docs</a> · %s</p>`, esc(p.group))
		fmt.Fprintf(&b, `<h1>%s</h1><p class="g-lead t-lead">%s</p>%s`, inline(p.title, p.slug, slugs), inline(p.lead, p.slug, slugs), toc(heads))
		fmt.Fprintf(&b, `<div class="g-body">%s</div>%s`, body, pager(pages, i))
		fmt.Fprintf(&b, `<p class="g-path t-small muted">%s</p></article></div></main>`+"\n", source(p, ref))
		b.WriteString(foot(false))
		dir := filepath.Join(out, p.slug)
		if err := os.MkdirAll(dir, 0o755); err != nil {
			fail("%v", err)
		}
		write(filepath.Join(dir, "index.html"), b.String())
	}

	// the docs home: one card per page, under its group
	var b strings.Builder
	b.WriteString(head("komando docs", "How to use the komando command line, one page per feature.", "docs/"))
	fmt.Fprintf(&b, `<main id="top" class="g-main"><div class="wrap g-grid">%s`, sidebar(pages, ""))
	b.WriteString(`<article class="g-article g-article--index"><h1>komando docs</h1><div class="g-body g-intro">`)
	b.WriteString(`<p>How to use komando, the free command line for your servers, databases, caches, queues and more, ` +
		`for people and AI agents. One page per feature. New to komando? Start with <a href="getting-started/">Getting started</a>.</p>`)
	b.WriteString(`<p>Commands, flags and file paths are in <code>mono</code>. Help for any command: <code>komando &lt;command&gt; --help</code>. ` +
		`Looking for the Mac, iPhone and iPad apps? Read the <a href="../guide/">user guide</a>.</p></div>`)
	group := ""
	for _, p := range pages {
		if p.group != group {
			if group != "" {
				b.WriteString("</div></section>")
			}
			fmt.Fprintf(&b, `<section class="g-group" id="%s"><h2>%s</h2><div class="g-cards">`, anchor(p.group), esc(p.group))
			group = p.group
		}
		sum := p.lead
		if s, ok := summary[p.slug]; ok {
			sum = upper(s) + "."
		}
		fmt.Fprintf(&b, `<a class="g-card" href="%s/"><span class="t-card">%s</span><span class="t-small muted">%s</span></a>`,
			esc(p.slug), esc(p.title), plain(sum))
	}
	b.WriteString("</div></section>")
	fmt.Fprintf(&b, `<p class="g-path t-small muted">Built from <a href="https://github.com/sgnd/komando/tree/main/docs/features">docs/features</a> in sgnd/komando%s.</p></article></div></main>`+"\n", refText(ref))
	b.WriteString(foot(true))
	write(filepath.Join(out, "index.html"), b.String())
	fmt.Printf("built %d pages from %s and %s\n", len(pages)+1, src, filepath.Join(out, "src"))
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

func source(p *page, ref string) string {
	if p.site {
		return fmt.Sprintf("Source: <code>web/site/docs/src/%s.md</code>, written from komando&#39;s own docs.", p.slug)
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
func plain(text string) string {
	h := inline(text, "", nil)
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
	slugs map[string]bool
	heads []heading
	ids   map[string]int
}

func render(md, slug string, slugs map[string]bool) (string, []heading) {
	r := &renderer{slug: slug, slugs: slugs, ids: map[string]int{}}
	return r.blocks(strings.Split(md, "\n")), r.heads
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
			out = append(out, `<pre class="d-code" tabindex="0" role="region" aria-label="Code"><code>`+esc(strings.Join(dedent(code, n), "\n"))+`</code></pre>`)
		case headRe.MatchString(line):
			m := headRe.FindStringSubmatch(line)
			level := len(m[1])
			text := r.inline(m[2])
			id := anchor(text)
			if k := r.ids[id]; k > 0 {
				r.ids[id] = k + 1
				id = fmt.Sprintf("%s-%d", id, k)
			} else {
				r.ids[id] = 1
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
	b.WriteString(`<div class="d-table" role="region" aria-label="Table" tabindex="0"><table>`)
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

func inline(text, slug string, slugs map[string]bool) string {
	return (&renderer{slug: slug, slugs: slugs}).inline(text)
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
	case file == "":
		return frag
	}
	// any other relative file lives in the komando repository: link to it on GitHub
	return repoBlob + filepath.ToSlash(filepath.Clean(file)) + frag
}

// ---------------------------------------------------------------- the page frame (as guide/build.py draws it)

const logo = `<svg class="kc" viewBox="0 0 100 100" aria-hidden="true"><rect x=".5" y=".5" width="99" height="99" rx="25" ` +
	`fill="#ffffff" stroke="#e4e4e1"/><rect x="25" y="24.5" width="14" height="51" rx="7" fill="#1659ff"/>` +
	`<path d="M70.5 31 51.5 50 70.5 69" fill="none" stroke="#1c1c1e" stroke-width="12" stroke-linecap="round" ` +
	`stroke-linejoin="round"/></svg>`

// siteURL is where the site is served (owner, 2026-11-18: Cloudflare Pages on a subdomain of efolusi.com)
const siteURL = "https://komando.efolusi.com/"

// head starts a docs page; path is the page's own path under the site, such as "docs/" or "docs/install/"
func head(title, description, path string) string {
	root, current := "../../", ""
	if path == "docs/" {
		root, current = "../", ` aria-current="page"`
	}
	description = html.UnescapeString(tagRe.ReplaceAllString(inline(description, "", nil), ""))
	return fmt.Sprintf(`<!doctype html>
<html lang="en" data-type="software" data-radius="soft" data-ground="sage" data-buttons="arrow">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>%s</title>
<meta name="description" content="%s">
<link rel="canonical" href="%[6]s%[7]s">
<meta property="og:image" content="%[6]sshare.jpg">
<link rel="icon" href="%[3]sfavicon.svg" type="image/svg+xml">
<meta name="theme-color" content="#f3f3f1" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#1c1c1e" media="(prefers-color-scheme: dark)">
<meta name="color-scheme" content="light dark">
<!-- built by scripts/docsgen from komando's docs/features and docs/src/; edit the source, not this file -->
<link rel="preload" href="%[3]sassets/fonts/InstrumentSans-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="%[3]sassets/fonts/fonts.css">
<link rel="stylesheet" href="%[3]sassets/system.css">
<style>
:root {
  --p-bg: #f3f3f1; --p-surface: #ffffff; --p-ink: #1c1c1e; --p-muted: #505056;
  --p-accent: #1c1c1e; --p-accent-ink: #f3f3f1; --p-action: #1c1c1e; --p-action-ink: #f3f3f1;
  --p-inv-bg: #1c1c1e; --p-inv-surface: #28282a; --p-inv-ink: #f3f3f1; --p-inv-muted: #999999;
  --p-inv-accent: #f3f3f1; --p-inv-accent-ink: #1c1c1e; --p-inv-action: #f3f3f1; --p-inv-action-ink: #1c1c1e;
  --font-display: "Instrument Sans", system-ui, sans-serif;
  --font-text: "Instrument Sans", system-ui, sans-serif;
  --font-mono: "DM Mono", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
  --display-weight: 500; --display-tracking: -0.028em; --display-tracking-xl: -0.036em; --display-stretch: 96%%;
}
/* dark mode follows the reader's system setting: the site's own inverse tokens (--p-inv-*) become the page's */
@media (prefers-color-scheme: dark) {
  :root { color-scheme: dark;
    --p-bg: #1c1c1e; --p-surface: #28282a; --p-ink: #f3f3f1; --p-muted: #a1a1a6;
    --p-accent: #f3f3f1; --p-accent-ink: #1c1c1e; --p-action: #f3f3f1; --p-action-ink: #1c1c1e; }
}
.nav__logo .kc { width: 28px; height: 28px; flex: none; }
.nav__logo { gap: var(--s-2); }
</style>
<link rel="stylesheet" href="%[3]sguide/guide.css">
<link rel="stylesheet" href="%[3]sdocs/docs.css">
</head>
<body>
<header class="nav">
  <div class="wrap nav__bar">
    <a class="skip-link" href="#top">Skip to content</a>
    <a class="nav__logo" href="%[3]sindex.html">%[4]sKomando</a>
    <nav class="nav__links" aria-label="Main">
      <div class="nav__item"><a class="nav__link" href="%[3]sguide/">Guide</a></div>
      <div class="nav__item"><a class="nav__link" href="%[3]sdocs/"%[5]s>Docs</a></div>
      <div class="nav__item"><a class="nav__link" href="%[3]sindex.html#safety">Safety</a></div>
      <div class="nav__item"><a class="nav__link" href="%[3]sindex.html#agent">Agent</a></div>
      <div class="nav__item"><a class="nav__link" href="%[3]sindex.html#editions">Editions</a></div>
    </nav>
    <div class="nav__actions">
      <a class="btn btn--primary" href="%[3]sindex.html#install">Install komando</a>
    </div>
    <button class="nav__toggle" type="button" aria-expanded="false" aria-label="Menu">
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M2 5h14M2 13h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
    </button>
  </div>
</header>
`, esc(title), esc(description), root, logo, current, siteURL, path)
}

func foot(home bool) string {
	root := "../../"
	if home {
		root = "../"
	}
	return fmt.Sprintf(`<footer class="footer g-footer">
  <div class="wrap">
    <div class="footer__legal">
      <span>&copy; 2026 Komando</span>
      <span><a href="%[1]sdocs/">komando docs</a> · <a href="%[1]sguide/">User guide</a> · <a href="%[1]sindex.html#install">Install komando</a> · <a href="https://github.com/sgnd/komando">komando on GitHub</a></span>
    </div>
  </div>
</footer>
<!-- on a narrow screen the list of guide pages starts folded, so the page's own text comes first -->
<script>if (matchMedia('(max-width: 1023px)').matches) document.querySelector('.g-side__fold')?.removeAttribute('open');</script>
<script type="module" src="%[1]sassets/system.js"></script>
</body>
</html>
`, root)
}

func sidebar(pages []*page, current string) string {
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
			fmt.Fprintf(&b, `<p class="t-label g-side__group">%s</p><ul>`, esc(p.group))
			group = p.group
		}
		cur := ""
		if p.slug == current {
			cur = ` aria-current="page"`
		}
		fmt.Fprintf(&b, `<li><a href="%s%s/"%s>%s</a></li>`, up, p.slug, cur, esc(p.title))
	}
	b.WriteString("</ul>")
	home, homeCur := up, ""
	if current == "" {
		home, homeCur = "./", ` aria-current="page"`
	}
	return fmt.Sprintf(`<nav class="g-side" aria-label="Docs"><details class="g-side__fold" open><summary>All docs pages</summary>`+
		`<p class="g-side__home"><a href="%s"%s>Docs home</a></p>%s</details></nav>`, home, homeCur, b.String())
}

func toc(heads []heading) string {
	var links []string
	for _, h := range heads {
		if h.level == 2 {
			links = append(links, fmt.Sprintf(`<li><a href="#%s">%s</a></li>`, h.id, h.html))
		}
	}
	if len(links) < 3 {
		return ""
	}
	return `<nav class="g-toc" aria-label="On this page"><p class="t-label muted">On this page</p><ul>` + strings.Join(links, "") + `</ul></nav>`
}

func pager(pages []*page, i int) string {
	prev := `<a class="g-pn g-pn--prev" href="../"><span class="t-label muted">Previous</span>Docs home</a>`
	if i > 0 {
		prev = fmt.Sprintf(`<a class="g-pn g-pn--prev" href="../%s/"><span class="t-label muted">Previous</span>%s</a>`, esc(pages[i-1].slug), esc(pages[i-1].title))
	}
	next := ""
	if i+1 < len(pages) {
		next = fmt.Sprintf(`<a class="g-pn g-pn--next" href="../%s/"><span class="t-label muted">Next</span>%s</a>`, esc(pages[i+1].slug), esc(pages[i+1].title))
	}
	return `<nav class="g-pager" aria-label="Previous and next page">` + prev + next + `</nav>`
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
