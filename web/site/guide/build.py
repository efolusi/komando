#!/usr/bin/env python3
"""Build the Komando user guide: web/site/guide/<slug>/index.html from web/site/guide/src/<slug>.md.

    python3 web/site/guide/build.py           build every page, then check every link
    python3 web/site/guide/build.py --check   only check the links (the home pages and the guide, English and Indonesian)

Standard library only. The built pages are committed, so the site keeps needing no build step to serve. Each page's head, header and
footer come from the shell partials in web/site/_shell/<lang>/, which web/site/build.mjs renders with Meridian.

Two languages. English pages come from src/<slug>.md into guide/<slug>/. An Indonesian page comes from src/<slug>.id.md into
id/guide/<slug>/ and takes its words (page titles and summaries, groups, the interface text this file writes, and the
"coming" list) from i18n/guide.id.json. The Indonesian page keeps the English page's heading anchors, heading by heading,
so /guide/log-in/#make-or-import-a-key and /id/guide/log-in/#make-or-import-a-key are the same place; the build stops if
the two sources do not have the same headings. A page without an .id.md twin is not built in Indonesian.

Two lists live in this file and nowhere else:
  PAGES   every page: its path, title and one-line summary, in the order of the guide's index.
  COMING  every part of the app the guide describes that is not built yet. A page marks it with
          {coming:ID}; the "What is coming" page lists them all. When a part ships, delete its entry,
          take its {coming:ID} out of the pages, write the steps, and build.

The page text is a small Markdown: ## and ### headings, paragraphs, "1." and "-" lists (one level),
**bold** for the app's own button names, `mono` for commands, addresses and paths, [text](target) links,
and "> " for a note box. Link targets: "guide:SLUG" or "guide:SLUG#anchor" for a guide page,
"site:#anchor" for the home page, "#anchor" on the same page, or a full https:// address. Directives, each on its own:
  {coming:ID}            an inline "Coming" pill that links to the item on the What is coming page
  {shot:NAME|caption}    on its own line: a screenshot. Until guide/shots/NAME.png exists the page leaves
                         it out (visitors never see a placeholder); the build prints the missing files, and
                         guide/README.md lists them. Drop the PNG in and build again.
"""
import html
import json
import os
import re
import sys
from html.parser import HTMLParser

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
SRC = os.path.join(HERE, "src")
SHOTS = os.path.join(HERE, "shots")
ID_JSON = os.path.join(SITE, "i18n", "guide.id.json")

# (group, slug, title, summary). The guide's index lists them in this order, under each group.
PAGES = [
    ("Start here", "first-ten-minutes", "Your first ten minutes",
     "Install komando, open Komando, add one server and open a terminal on it."),
    ("Start here", "add-a-host", "Add a server",
     "Put a server in the inventory, test it, and import the ones you already have."),
    ("Start here", "log-in", "Log in with a key or a password",
     "Choose how Komando logs in to a server, trust its identity, and change it later."),
    ("Start here", "add-a-connection", "Add a database, cache or anything else",
     "Add a database, cache, storage, cluster, registry or message queue, and check it."),
    ("Start here", "home-and-findings", "Home and findings",
     "See what needs attention and fix it with one button."),
    ("Start here", "the-window", "Find your way around the window",
     "The six places, their shortcuts, making room, reloading, tabs and the menu bar icon."),
    ("Servers", "open-a-terminal", "Open a terminal",
     "Get a command prompt on a server, split it, and reconnect."),
    ("Servers", "files", "Files and copying between servers",
     "Copy files between this Mac and a server."),
    ("Servers", "services", "Services",
     "See a server's services and restart, stop or start one."),
    ("Servers", "logs", "Logs",
     "Read a server's system log, one service's log or a log file, and follow it live."),
    ("Servers", "updates", "Updates",
     "See which updates a server is waiting for, install them, and reboot when one needs it."),
    ("Servers", "containers", "Containers",
     "See a server's Docker containers, their logs, and restart or stop one."),
    ("Servers", "jobs", "Jobs",
     "Start a long command that keeps running after you disconnect, and follow its log."),
    ("Data and networks", "databases", "Databases",
     "Query a database safely, and change data only when you mean to."),
    ("Data and networks", "caches", "Caches",
     "Find a key in a cache such as Redis, read it, and change it on purpose."),
    ("Data and networks", "port-forwarding", "Port forwarding",
     "Reach a database or a web page on a server from this Mac through a tunnel."),
    ("Data and networks", "vpn", "VPNs",
     "Add a VPN, bring it up and down, and know when it drops."),
    ("Tools", "keychain", "Keychain",
     "Give komando the passwords and keys it needs, and put a key on a server."),
    ("Tools", "recipes", "Recipes",
     "Run a saved command on one server or a whole group, and save your own."),
    ("Tools", "agent", "The agent",
     "Describe a problem in words and let the agent find it and fix it, asking first."),
    ("Safety", "touch-id-and-safety", "Touch ID and safety",
     "Allow changes, protected targets, the audit log and the Touch ID lock."),
    ("Safety", "edit-or-remove", "Edit, protect or remove",
     "Change a server or connection, protect it, or take it out of the inventory."),
    ("iPhone and iPad", "iphone-and-ipad", "Komando on iPhone and iPad",
     "Pair the phone with komando, see findings and fix them with Face ID."),
    ("About this guide", "coming", "What is coming",
     "The parts of Komando this guide describes that are not built yet."),
]

# id: (title, what it will do, what it waits on). One place: the pages only point here.
COMING = {
    "app-download": (
        "A download link for the apps",
        "This site will link to Komando for Mac and to the App Store for iPhone and iPad.",
        "Where the Mac app is published, and the App Store listing."),
    "ask-each-time": (
        "Ask each time, for a server or connection",
        "A fourth choice under Log in with on New Host and Edit Host, and on a connection's password: nothing "
        "is saved, and the password is asked for in a tab each time Komando connects.",
        "komando 0.15.0, which adds a mode that asks at connect. Until then the forms offer SSH Agent, Saved Key "
        "and Password, and a connection's password is saved. VPN forms already have their own Ask each time."),
    "edit-login": (
        "Change a connection's password in its Edit sheet",
        "Edit… on a database or cache gets a new-password field, as Edit Host… has: the saved one shows as a line, "
        "and an empty field keeps it.",
        "The Edit Connection sheet. Until then, replace the value on the Keychain page."),
    "group-tools": (
        "Group tools on Hosts",
        "Add Hosts to Group… (tick several servers), Change Login for Group… (one login for every server in a "
        "group, with a practice run first), and Add to group when you import.",
        "Designed, not built yet. Today you set a server's groups under Groups when you add or edit it."),
    "files-place": (
        "The new Files place",
        "Files becomes its own place in the sidebar (⌘4). Each side picks This Mac, a server or a storage "
        "bucket; Swap trades them. Copy to web-1 (⌥⌘→) and Copy to This Mac (⌥⌘←), whole folders, "
        "drag in from Finder, right-click for Rename…, Move…, Permissions… and Delete…, Retry on a failed "
        "transfer, Only copy changed files, and Copy to a Group….",
        "The apps' Files P1 branch, which makes Files a place. Today Files is a tab for one server."),
    "server-to-server": (
        "Copy from one server to another",
        "Pick a server on each side of Files and copy across. komando cannot copy straight between two "
        "servers yet, so Komando downloads to this Mac, uploads, then deletes the copy here, and says so first.",
        "The new Files place."),
    "phone-files": (
        "Files on iPhone and iPad",
        "A Browse Files button on each server and storage bucket in the phone app.",
        "komando: download to the phone and upload from it through the phone's limited key."),
    "phone-recipes": (
        "Recipes on iPhone and iPad",
        "Pick a saved recipe and run it on a server from the phone. One that changes something goes "
        "through the agent's approval card.",
        "Designed, not built yet."),
    "home-updates": (
        "Security updates on Home",
        "A card on Home such as \"3 servers have security updates.\" with Review, and one for a server "
        "that needs a reboot.",
        "Designed, not built yet. Today you see updates on each server's Updates tab."),
    "db-backups": (
        "A database's Backups tab",
        "The database's backups, Back Up Now, and Restore, which always asks first.",
        "Not drawn yet."),
    "connection-changes": (
        "Changing storage, a cluster, a registry or a queue",
        "Buttons to upload to a bucket, restart a deployment or send a message to a queue.",
        "Not designed yet. Today: ⌘K, then Run a Command…."),
    "upgrade": (
        "The upgrade",
        "Sync between devices, teams, built-in AI without your own key, and approving from your phone.",
        "Not built and not for sale. Komando and komando are free, and everything on your own devices works now."),
}

SLUGS = [p[1] for p in PAGES]
START = ["first-ten-minutes", "updates", "iphone-and-ipad", "coming"]   # what the Apps landing points to first
BUTTON_NAMES = "The app's own button names are in {bold}."


class Lang:
    """English words are the ones in this file; Indonesian words come from i18n/guide.id.json."""

    def __init__(self, code):
        self.code = code
        self.base = "id/" if code == "id" else ""   # the folder the language lives in, under web/site/
        self.out = os.path.join(SITE, "id", "guide") if code == "id" else HERE
        if code == "id":
            with open(ID_JSON, encoding="utf-8") as f:
                self.words = json.load(f)
        else:
            self.words = None

    def ui(self, text):
        """An interface string: the English text itself, or its Indonesian twin."""
        if self.words is None:
            return text
        if text not in self.words["ui"]:
            raise SystemExit(f"{ID_JSON}: no Indonesian text for {text!r}")
        return self.words["ui"][text]

    def group(self, name):
        return name if self.words is None else self.words["groups"][name]

    def title(self, slug):
        return TITLE[slug] if self.words is None else self.words["pages"][slug]["title"]

    def summary(self, slug):
        return SUMMARY[slug] if self.words is None else self.words["pages"][slug]["summary"]

    def coming(self, cid):
        """(title, what it will do, what it waits on) of a COMING entry."""
        if self.words is None:
            return COMING[cid]
        t = self.words["coming"][cid]
        return t["title"], t["what"], t["waits"]


TITLE = {p[1]: p[2] for p in PAGES}
SUMMARY = {p[1]: p[3] for p in PAGES}


def slugify(text):
    text = re.sub(r"<[^>]+>", "", text)
    text = html.unescape(text).lower()
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    return text or "section"


def rel_root(slug, lang):
    """The way from a page's folder up to web/site/."""
    return ("../" if slug is None else "../../") + ("../" if lang.code == "id" else "")


def guide_href(slug, target):
    """A link to a guide page (target "SLUG" or "SLUG#anchor"), relative to the page `slug` (None: the index)."""
    page, _, anchor = target.partition("#")
    if page and page not in TITLE:
        raise SystemExit(f"{slug or 'index'}: no guide page named {page!r}")
    up = "" if slug is None else "../"
    href = f"{up}{page}/" if page else ""
    return href + (f"#{anchor}" if anchor else "")


class Page:
    def __init__(self, slug, lang):
        self.slug = slug
        self.lang = lang
        self.coming = []      # COMING ids this page names
        self.shots = []       # screenshot names this page asks for
        self.ids = None       # heading ids to use, in order (an Indonesian page takes its English page's)


def inline(text, page):
    """Escape, then **bold**, `mono`, links and {coming:ID}."""
    codes = []
    lang = page.lang

    def keep_code(m):
        codes.append(m.group(1))
        return f"\x00{len(codes) - 1}\x00"

    text = re.sub(r"`([^`]+)`", keep_code, text)
    text = html.escape(text, quote=False)

    def link(m):
        label, target = m.group(1), m.group(2)
        if target.startswith("guide:"):
            href = guide_href(page.slug, target[len("guide:"):])
        elif target.startswith("site:"):
            href = rel_root(page.slug, lang) + lang.base + "index.html" + target[len("site:"):]
        elif target.startswith("https://"):
            href = target
        elif target.startswith("#"):
            href = target
        else:
            raise SystemExit(f"{page.slug}: link target {target!r} must start with guide:, site:, # or https://")
        return f'<a href="{html.escape(href)}">{label}</a>'

    text = re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", link, text)
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)

    def coming(m):
        cid = m.group(1)
        if cid not in COMING:
            raise SystemExit(f"{page.slug}: no COMING entry {cid!r}")
        if cid not in page.coming:
            page.coming.append(cid)
        href = guide_href(page.slug, f"coming#{cid}")
        title = html.escape(f"{lang.coming(cid)[0]}: {lang.ui('not built yet')}")
        return f'<a class="g-pill" href="{href}" title="{title}">{lang.ui("Coming")}</a>'

    text = re.sub(r"\{coming:([a-z0-9-]+)\}", coming, text)
    text = re.sub(r"\x00(\d+)\x00", lambda m: f"<code>{html.escape(codes[int(m.group(1))])}</code>", text)
    return text


def shot(name, caption, page):
    page.shots.append(name)
    png = os.path.join(SHOTS, name + ".png")
    cap = inline(caption, page)
    if os.path.exists(png):
        src = rel_root(page.slug, page.lang) + f"guide/shots/{name}.png"
        alt = html.escape(re.sub(r"<[^>]+>", "", cap), quote=True)
        return f'<figure class="g-shot"><img src="{src}" alt="{alt}" loading="lazy"><figcaption>{cap}</figcaption></figure>'
    # no PNG yet: the figure is left out of the page; README.md lists every file still to make
    return ""


def render(md, page):
    out, para, items, kind, note = [], [], [], None, []
    headings = []

    def flush():
        nonlocal para, items, kind, note
        if para:
            out.append(f"<p>{inline(' '.join(para), page)}</p>")
        if items:
            tag = "ol" if kind == "ol" else "ul"
            lis = "".join(
                f"<li>{inline(text, page)}"
                + (f'<ul class="g-list g-list--ul">{"".join(f"<li>{inline(x, page)}</li>" for x in sub)}</ul>' if sub else "")
                + "</li>" for text, sub in items)
            out.append(f'<{tag} class="g-list g-list--{tag}">{lis}</{tag}>')
        if note:
            out.append(f'<aside class="g-note"><p>{inline(" ".join(note), page)}</p></aside>')
        para, items, kind, note = [], [], None, []

    for raw in md.splitlines():
        line = raw.rstrip()
        if not line.strip():
            flush()
            continue
        m = re.match(r"^(#{2,3}) (.+)$", line)
        if m:
            flush()
            level = len(m.group(1))
            text = inline(m.group(2), page)
            if page.ids is None:
                hid = slugify(m.group(2))
                if hid in [h[1] for h in headings]:
                    raise SystemExit(f"{page.slug}: two headings make the anchor #{hid}")
            elif len(headings) < len(page.ids):
                hid = page.ids[len(headings)]
            else:
                raise SystemExit(f"{page.slug}: the Indonesian source has more headings than the English one")
            headings.append((level, hid, text))
            out.append(f'<h{level} id="{hid}">{text}</h{level}>')
            continue
        m = re.match(r"^\{shot:([a-z0-9/-]+)\|(.+)\}$", line)
        if m:
            flush()
            out.append(shot(m.group(1), m.group(2), page))
            continue
        if line.startswith("> "):
            if para or items:
                flush()
            note.append(line[2:])
            continue
        m = re.match(r"^(\d+)\. (.+)$", line)
        if m:
            if para or note or (items and kind != "ol"):
                flush()
            kind = "ol"
            items.append([m.group(2), []])
            continue
        m = re.match(r"^- (.+)$", line)
        if m:
            if para or note or (items and kind != "ul"):
                flush()
            kind = "ul"
            items.append([m.group(1), []])
            continue
        m = re.match(r"^ {2,}- (.+)$", line)
        if m and items:
            items[-1][1].append(m.group(1))
            continue
        if line.startswith("   ") and items:
            if items[-1][1]:
                items[-1][1][-1] += " " + line.strip()
            else:
                items[-1][0] += " " + line.strip()
            continue
        if note:
            note.append(line.strip())
            continue
        if items:
            flush()
        para.append(line.strip())
    flush()
    if page.ids is not None and len(headings) != len(page.ids):
        raise SystemExit(f"{page.slug}: the Indonesian source has {len(headings)} headings, the English one {len(page.ids)}; "
                         "keep them heading for heading")
    return "\n".join(out), headings


# where the site is served (owner, 2026-11-18: a Cloudflare Worker on a subdomain of efolusi.com)
SITE_URL = "https://komando.efolusi.com/"


def shell(name, root, lang, switch, current=None):
    """A page shell partial that web/site/build.mjs renders with Meridian; {{root}} becomes the way up to web/site/ and
    {{switch}} the address of the page in the other language."""
    with open(os.path.join(SITE, "_shell", lang.code, name + ".html"), encoding="utf-8") as f:
        text = f.read().replace("{{root}}", root).replace("{{switch}}", switch).rstrip("\n")
    if current:
        text = text.replace(f'data-nav="{current}"', f'data-nav="{current}" aria-current="page"')
    return text


def guide_path(slug):
    return "guide/" if slug is None else f"guide/{slug}/"


def head(title, description, slug, lang):
    root = rel_root(slug, lang)
    path = guide_path(slug)
    switch = root + ("" if lang.code == "id" else "id/") + path
    return f"""<!doctype html>
<html lang="{lang.code}">
<head>
<meta charset="utf-8">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(description, quote=True)}">
<link rel="canonical" href="{SITE_URL}{lang.base}{path}">
<link rel="alternate" hreflang="en" href="{SITE_URL}{path}">
<link rel="alternate" hreflang="id" href="{SITE_URL}id/{path}">
<link rel="alternate" hreflang="x-default" href="{SITE_URL}{path}">
{shell("head", root, lang, switch)}
<link rel="stylesheet" href="{root}guide/guide.css">
<!-- built by guide/build.py from guide/src/; edit the source, not this file -->
</head>
<body>
{shell("header", root, lang, switch, "guide" if slug is None else None)}
"""


def foot(slug, lang):
    root = rel_root(slug, lang)
    switch = root + ("" if lang.code == "id" else "id/") + guide_path(slug)
    return shell("footer", root, lang, switch) + "\n</body>\n</html>\n"


def breadcrumb(trail, lang):
    """Docs > Apps > Page as a labelled nav with an ordered list; the step with no address is the page itself."""
    items = "".join(
        f'<li aria-current="page">{html.escape(text)}</li>' if href is None
        else f'<li><a href="{html.escape(href)}">{html.escape(text)}</a></li>'
        for text, href in trail)
    return f'<nav class="g-crumbs" aria-label="{lang.ui("Breadcrumb")}"><ol>{items}</ol></nav>'


def trail_head(slug, lang):
    """The first two steps of every guide trail: the docs home, then the Apps landing (this guide's home)."""
    docs_home = rel_root(slug, lang) + lang.base + "docs/"
    return [(lang.ui("Docs"), docs_home), (lang.ui("Apps"), "../" if slug else None)]


def sidebar(current, lang):
    up = "" if current is None else "../"
    parts, group = [], None
    for g, slug, title, _ in PAGES:
        if g != group:
            if group is not None:
                parts.append("</ul>")
            parts.append(f'<p class="g-label g-side__group">{html.escape(lang.group(g))}</p><ul>')
            group = g
        cur = ' aria-current="page"' if slug == current else ""
        parts.append(f'<li><a href="{up}{slug}/"{cur}>{html.escape(lang.title(slug))}</a></li>')
    parts.append("</ul>")
    index_cur = ' aria-current="page"' if current is None else ""
    return (f'<nav class="g-side" aria-label="{lang.ui("Guide")}"><details class="g-side__fold" open><summary>{lang.ui("All guide pages")}</summary>'
            f'<p class="g-side__home"><a href="{up or "./"}"{index_cur}>{lang.ui("Guide home")}</a></p>{"".join(parts)}</details></nav>')


def toc(headings, lang):
    h2 = [h for h in headings if h[0] == 2]
    if len(h2) < 3:
        return ""
    links = "".join(f'<li><a href="#{hid}">{text}</a></li>' for _, hid, text in h2)
    on_page = lang.ui("On this page")
    return f'<nav class="g-toc" aria-label="{on_page}"><p class="g-label g-muted">{on_page}</p><ul>{links}</ul></nav>'


def prev_next(slug, lang):
    i = SLUGS.index(slug)
    prev_l, next_l = lang.ui("Previous"), lang.ui("Next")
    cells = []
    if i > 0:
        p = SLUGS[i - 1]
        cells.append(f'<a class="g-pn g-pn--prev" href="../{p}/"><span class="g-label g-muted">{prev_l}</span>{html.escape(lang.title(p))}</a>')
    else:
        cells.append(f'<a class="g-pn g-pn--prev" href="../"><span class="g-label g-muted">{prev_l}</span>{lang.ui("Guide home")}</a>')
    if i + 1 < len(SLUGS):
        n = SLUGS[i + 1]
        cells.append(f'<a class="g-pn g-pn--next" href="../{n}/"><span class="g-label g-muted">{next_l}</span>{html.escape(lang.title(n))}</a>')
    return f'<nav class="g-pager" aria-label="{lang.ui("Previous and next page")}">{"".join(cells)}</nav>'


def pill(lang):
    return f'<span class="g-pill g-pill--static">{lang.ui("Coming")}</span>'


def app_status(root, lang):
    return (f'<p class="g-status"><span class="g-pill g-pill--static">{lang.ui("In testing")}</span> '
            f'{lang.ui("The Komando apps are built and in testing. They have no download link and no date yet. This guide describes them.")} '
            f'{lang.ui("The command line works today: see")} '
            f'<a href="{root}{lang.base}docs/getting-started/">{lang.ui("Getting started")}</a>.</p>')


def coming_body(pages_by_id, page):
    lang = page.lang
    out = [f"<p>{lang.ui('The apps are built and in testing. These parts of Komando are not built yet.')} "
           f"{lang.ui('The guide marks each one with a {pill} pill where it would be.').replace('{pill}', pill(lang))} "
           f"{lang.ui('Until then, each page says what to do today.')}</p>"]
    for cid in COMING:
        title, what, waits = lang.coming(cid)
        used = pages_by_id.get(cid, [])
        where = ", ".join(f'<a href="../{s}/">{html.escape(lang.title(s))}</a>' for s in used) or lang.ui("no page yet")
        out.append(f'<section class="g-coming" id="{cid}"><h2>{html.escape(title)}</h2>'
                   f'<p>{inline(what, page)}</p>'
                   f'<p class="g-muted"><b>{lang.ui("Waits on:")}</b> {inline(waits, page)}</p>'
                   f'<p class="g-small g-muted">{lang.ui("In the guide:")} {where}</p></section>')
    return "\n".join(out)


def build_language(lang, english_ids):
    """Build one language. english_ids: slug -> heading ids of the English page (None while building English)."""
    pages, bodies, ids = {}, {}, {}
    for _, slug, _, _ in PAGES:
        if slug == "coming":
            continue
        path = os.path.join(SRC, slug + (".id" if lang.code == "id" else "") + ".md")
        if not os.path.exists(path):
            raise SystemExit(f"missing {path}")
        page = Page(slug, lang)
        if english_ids is not None:
            page.ids = english_ids[slug]
        with open(path, encoding="utf-8") as f:
            bodies[slug] = render(f.read(), page)
        pages[slug] = page
        ids[slug] = [h[1] for h in bodies[slug][1]]

    pages_by_id = {}
    for slug in SLUGS:
        if slug in pages:
            for cid in pages[slug].coming:
                pages_by_id.setdefault(cid, []).append(slug)
    cp = Page("coming", lang)
    bodies["coming"] = (coming_body(pages_by_id, cp), [])
    pages["coming"] = cp

    guide_title = lang.ui("Komando guide")
    for _, slug, _, _ in PAGES:
        body, headings = bodies[slug]
        page = pages[slug]
        title, summary = lang.title(slug), lang.summary(slug)
        root = rel_root(slug, lang)
        badge = ""
        if page.coming and slug != "coming":
            badge = (f'<p class="g-status">{pill(lang)} {lang.ui("Parts of this page are not built yet; they are marked.")} '
                     f'<a href="../coming/">{lang.ui("What is coming")}</a></p>')
        doc = (head(f"{title} · {guide_title}", summary, slug, lang)
               + f'<main id="top" class="g-main" tabindex="-1"><div class="g-wrap g-grid">{sidebar(slug, lang)}'
               + f'<article class="g-article">{breadcrumb(trail_head(slug, lang) + [(title, None)], lang)}'
               + f'<h1>{html.escape(title)}</h1><p class="g-lead">{html.escape(summary)}</p>{app_status("../../" + ("../" if lang.code == "id" else ""), lang)}{badge}{toc(headings, lang)}'
               + f'<div class="g-body">{body}</div>{prev_next(slug, lang)}'
               + f'<p class="g-path g-small g-muted">{lang.ui("Help link for this page")}: <code>/{lang.base}guide/{slug}/</code></p>'
               + '</article></div></main>\n' + foot(slug, lang))
        os.makedirs(os.path.join(lang.out, slug), exist_ok=True)
        with open(os.path.join(lang.out, slug, "index.html"), "w", encoding="utf-8") as f:
            f.write(doc)

    # the guide's own index
    cards, group = [], None
    for g, slug, title, summary in PAGES:
        if g != group:
            if group is not None:
                cards.append("</div></section>")
            cards.append(f'<section class="g-group" id="{slugify(g)}"><h2>{html.escape(lang.group(g))}</h2><div class="g-cards">')
            group = g
        parts = f' <span class="g-pill g-pill--static">{lang.ui("Parts coming")}</span>' if pages[slug].coming and slug != "coming" else ""
        cards.append(f'<a class="g-card" href="{slug}/"><span class="g-card__title">{html.escape(lang.title(slug))}</span>{parts}'
                     f'<span class="g-small g-muted">{html.escape(lang.summary(slug))}</span></a>')
    cards.append("</div></section>")
    bold = f"<b>{lang.ui('bold')}</b>"
    begin = "".join(f'<li><a href="{slug}/">{html.escape(lang.title(slug))}</a>. {html.escape(lang.summary(slug))}</li>'
                    for slug in START)
    intro = (f"<p>{lang.ui('Komando runs the komando command line for you, as a free app: Komando for Mac, and Komando for iPhone and iPad.')}</p>"
             + app_status("../" + ("../" if lang.code == "id" else ""), lang)
             + f'<p>{lang.ui("Where to begin:")}</p><ul class="g-list g-list--ul">{begin}</ul>'
             f"<p>{lang.ui(BUTTON_NAMES).replace('{bold}', bold)} "
             f"{lang.ui('Commands, addresses and file paths are in {mono}.').replace('{mono}', '<code>mono</code>')} "
             f"{lang.ui('A {pill} pill marks a part that is not built yet;').replace('{pill}', pill(lang))} "
             f'<a href="coming/">{lang.ui("What is coming")}</a> {lang.ui("lists them all.")}</p>')
    index_title = lang.ui("Komando apps")
    doc = (head(index_title, lang.ui("Komando for Mac, iPhone and iPad runs the komando command line for you. The apps are built and in testing, with no download link yet. This guide describes them."), None, lang)
           + f'<main id="top" class="g-main" tabindex="-1"><div class="g-wrap g-grid">{sidebar(None, lang)}'
           + f'<article class="g-article g-article--index">{breadcrumb(trail_head(None, lang), lang)}<h1>{index_title}</h1><div class="g-body g-intro">{intro}</div>'
           + "".join(cards)
           + f'<p class="g-path g-small g-muted">{lang.ui("Help link for this page")}: <code>/{lang.base}guide/</code></p></article></div></main>\n'
           + foot(None, lang))
    with open(os.path.join(lang.out, "index.html"), "w", encoding="utf-8") as f:
        f.write(doc)
    return pages, ids


def build():
    en, id_ = Lang("en"), Lang("id")
    pages, ids = build_language(en, None)
    build_language(id_, ids)
    count = len(PAGES) + 1
    shots = sum(len(p.shots) for p in pages.values())
    done = sum(1 for p in pages.values() for s in p.shots if os.path.exists(os.path.join(SHOTS, s + ".png")))
    print(f"built {count} pages in English and {count} in Indonesian; screenshots: {done} of {shots} in place, the rest left out of the pages")
    for slug, p in pages.items():
        for s in p.shots:
            if not os.path.exists(os.path.join(SHOTS, s + ".png")):
                print(f"  to make: guide/shots/{s}.png ({slug})")


# ---------------------------------------------------------------- link check

class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs, self.ids = [], set()

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "id" in a:
            self.ids.add(a["id"])
        for key in ("href", "src"):
            if key in a and a[key] is not None:
                self.refs.append(a[key])


def parse(path):
    p = Links()
    with open(path, encoding="utf-8") as f:
        p.feed(f.read())
    return p


def check():
    files = [os.path.join(SITE, "index.html"), os.path.join(SITE, "id", "index.html")]
    for top in (HERE, os.path.join(SITE, "id", "guide")):
        for dirpath, _, names in os.walk(top):
            files += [os.path.join(dirpath, n) for n in names if n.endswith(".html")]
    cache, bad, count = {}, [], 0
    for path in files:
        for ref in parse(path).refs:
            if re.match(r"^(https?:|mailto:|data:|javascript:)", ref) or ref.startswith("//"):
                continue
            count += 1
            target, _, anchor = ref.partition("#")
            if target.startswith("/"):
                bad.append((path, ref, "starts with /: the site's domain is not decided, use a relative link"))
                continue
            dest = os.path.normpath(os.path.join(os.path.dirname(path), target)) if target else path
            if os.path.isdir(dest):
                dest = os.path.join(dest, "index.html")
            if not os.path.exists(dest):
                bad.append((path, ref, "no such file"))
                continue
            if anchor and dest.endswith(".html"):
                ids = cache.setdefault(dest, parse(dest).ids)
                if anchor not in ids:
                    bad.append((path, ref, f"no id {anchor!r} in {os.path.relpath(dest, SITE)}"))
    for path, ref, why in bad:
        print(f"BROKEN {os.path.relpath(path, SITE)}: {ref} ({why})")
    print(f"checked {count} internal links in {len(files)} pages: {len(bad)} broken")
    return not bad


if __name__ == "__main__":
    if "--check" not in sys.argv:
        build()
    sys.exit(0 if check() else 1)
