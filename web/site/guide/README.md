# Komando user guide

How to use the Komando apps (Mac, iPhone and iPad), one page per task, written for beginners. The pages are
static HTML in this folder, built from short Markdown files by `build.py`. The site still needs no build step to
serve: the built pages are committed.

## Help links

Every page has a stable path. The app's Help menu and per-screen help can link to them. The site's domain is not
decided yet, so the pages link to each other with relative links; prefix these paths with the domain once it is.

| Path | Page | Source |
|---|---|---|
| `/guide/` | The guide's index | made by `build.py` |
| `/guide/first-ten-minutes/` | Your first ten minutes | `src/first-ten-minutes.md` |
| `/guide/add-a-host/` | Add a server | `src/add-a-host.md` |
| `/guide/log-in/` | Log in with a key or a password | `src/log-in.md` |
| `/guide/add-a-connection/` | Add a database, cache or anything else | `src/add-a-connection.md` |
| `/guide/home-and-findings/` | Home and findings | `src/home-and-findings.md` |
| `/guide/the-window/` | Find your way around the window | `src/the-window.md` |
| `/guide/open-a-terminal/` | Open a terminal | `src/open-a-terminal.md` |
| `/guide/files/` | Files and copying between servers | `src/files.md` |
| `/guide/services/` | Services | `src/services.md` |
| `/guide/logs/` | Logs | `src/logs.md` |
| `/guide/updates/` | Updates | `src/updates.md` |
| `/guide/containers/` | Containers | `src/containers.md` |
| `/guide/jobs/` | Jobs | `src/jobs.md` |
| `/guide/databases/` | Databases | `src/databases.md` |
| `/guide/caches/` | Caches | `src/caches.md` |
| `/guide/port-forwarding/` | Port forwarding | `src/port-forwarding.md` |
| `/guide/vpn/` | VPNs | `src/vpn.md` |
| `/guide/keychain/` | Keychain | `src/keychain.md` |
| `/guide/recipes/` | Recipes | `src/recipes.md` |
| `/guide/agent/` | The agent | `src/agent.md` |
| `/guide/touch-id-and-safety/` | Touch ID and safety | `src/touch-id-and-safety.md` |
| `/guide/edit-or-remove/` | Edit, protect or remove | `src/edit-or-remove.md` |
| `/guide/iphone-and-ipad/` | Komando on iPhone and iPad | `src/iphone-and-ipad.md` |
| `/guide/coming/` | What is coming | made from `COMING` in `build.py` |

A section inside a page has an anchor made from its heading, for example `/guide/log-in/#make-or-import-a-key`.
Renaming a heading changes its anchor, so keep the headings the app links to.

Suggested links from the Mac app (not wired yet; the Help menu opens komando's README today, see
`ProductConfig.helpURL` in the apps repo):

| In the app | Link |
|---|---|
| Help › Komando Help | `/guide/` |
| Welcome, Install komando | `/guide/first-ten-minutes/` |
| New Host, Edit Host… | `/guide/add-a-host/`, `/guide/log-in/` |
| What do you want to add? | `/guide/add-a-connection/` |
| Home, Findings | `/guide/home-and-findings/` |
| A server's Terminal, Services, Logs, Updates, Containers tabs | `/guide/open-a-terminal/`, `/guide/services/`, `/guide/logs/`, `/guide/updates/`, `/guide/containers/` |
| Files | `/guide/files/` |
| Jobs, Keychain, Recipes, Port Forwarding | `/guide/jobs/`, `/guide/keychain/`, `/guide/recipes/`, `/guide/port-forwarding/` |
| A database's Query tab, a cache's Keys tab | `/guide/databases/`, `/guide/caches/` |
| Connections › VPNs | `/guide/vpn/` |
| The agent | `/guide/agent/` |
| Audit Log, Settings › Touch ID | `/guide/touch-id-and-safety/` |
| iPhone and iPad Settings | `/guide/iphone-and-ipad/` |

## Build and check

```bash
python3 web/site/guide/build.py
```

It builds every page, then checks every internal link and anchor in the site's `index.html` and the guide (a link
that starts with `/` counts as broken, because the domain is not decided). `--check` only checks. Standard library
only. Edit `src/*.md` and `build.py`, never the built `index.html` files.

## What is coming: one list

`COMING` in `build.py` is the only list of parts the guide describes that are not built yet. A page marks one with
`{coming:ID}`, which draws a "Coming" pill that links to its entry on `/guide/coming/`. Read the entries
there, in `COMING`; this file does not copy them.

When a part ships: delete its entry, take its `{coming:ID}` out of the pages (the build fails on an ID that no
longer exists, so none is missed), write the real steps, and build.

## Screenshots

None yet. A page leaves out every screenshot whose file does not exist, so visitors never see a placeholder; the
`{shot:NAME|caption}` line stays in the source and marks the spot. Put a PNG at that path (a 2x render of the app,
light appearance, about 1600 px wide) and build again: the figure appears, with the caption as its alt text. The
build prints the files still missing. The files the pages ask for:

- `guide/shots/first-ten-minutes/install.png` (first-ten-minutes)
- `guide/shots/first-ten-minutes/welcome.png` (first-ten-minutes)
- `guide/shots/add-a-host/new-host.png` (add-a-host)
- `guide/shots/add-a-host/import.png` (add-a-host)
- `guide/shots/log-in/log-in-with.png` (log-in)
- `guide/shots/log-in/trust-new-key.png` (log-in)
- `guide/shots/add-a-connection/new-connection.png` (add-a-connection)
- `guide/shots/home-and-findings/home.png` (home-and-findings)
- `guide/shots/open-a-terminal/terminal.png` (open-a-terminal)
- `guide/shots/files/files.png` (files)
- `guide/shots/services/services.png` (services)
- `guide/shots/logs/logs.png` (logs)
- `guide/shots/updates/updates.png` (updates)
- `guide/shots/containers/containers.png` (containers)
- `guide/shots/jobs/jobs.png` (jobs)
- `guide/shots/databases/query.png` (databases)
- `guide/shots/caches/keys.png` (caches)
- `guide/shots/port-forwarding/new-forward.png` (port-forwarding)
- `guide/shots/vpn/new-vpn.png` (vpn)
- `guide/shots/keychain/keychain.png` (keychain)
- `guide/shots/recipes/run-results.png` (recipes)
- `guide/shots/agent/drawer.png` (agent)
- `guide/shots/agent/not-run.png` (agent)
- `guide/shots/touch-id-and-safety/audit-log.png` (touch-id-and-safety)
- `guide/shots/touch-id-and-safety/locked.png` (touch-id-and-safety)
- `guide/shots/edit-or-remove/edit-host.png` (edit-or-remove)
- `guide/shots/iphone-and-ipad/pair.png` (iphone-and-ipad)

## Where the words come from

- The steps follow `design/journeys.md` in `efolusi/komando-apps`, checked against what the Mac and iPhone apps on
  `main` really show (their button and label strings, 2026-11-14; the pages for apps #72 and #74 to #78 on 2026-11-16). Where the journeys describe something the app on
  `main` does not have yet, the page says what to do today and marks the rest "Coming".
- Button names are the app's own, in bold. Commands are checked against `komando --help` (v0.14.0).
- Owner rule: function, UI/UX and docs land together. A change to a screen updates its guide page in the same
  pull request (or, until the repos share one, the next one here).
