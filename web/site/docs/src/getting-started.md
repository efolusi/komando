# Getting started

komando is one program you run in a terminal. In this page you install it, add one server, check that komando can log in, look around on it, and connect your AI agent.

## 1. Install komando

Copy the install line from [Install komando](site:index.html#install) on the home page and paste it into a terminal (on macOS the **Terminal** app). On Windows, and for other ways to install, read [Install, update, remove](install.md).

Then check that it works:

```bash
komando version
```

It says `command not found`? The installer put komando in a folder your terminal does not look in yet. Run the `export PATH=...` line it printed, and add that line to `~/.zshrc` (macOS) or `~/.bashrc` (Linux) so it stays.

## 2. Add a server

Type `komando host add` and answer one question per line: a name, the address, the user, the port, how komando logs in, and whether it is production. komando then shows the full command, so next time you can type it yourself:

```bash
komando host add web1 ubuntu@203.0.113.10
```

If `ssh` already works on this computer, komando usually works too: it uses the same keys and the same ssh-agent. More about logins in [Servers](servers.md).

Already have a list of servers in `~/.ssh/config`? Bring them all in at once. The dry run shows what would be added first:

```bash
komando import ssh-config --dry-run
komando import ssh-config
```

Other sources, such as a `.env` file, `~/.pgpass` or PuTTY, are in [Moving in and moving computers](import.md).

## 3. Check it and look around

```bash
komando test web1      # can komando log in?
komando facts web1     # what is this server, and what needs attention?
```

`facts` reports the OS, CPU, memory, disk, load, the package manager and the tools that are installed. It also says what needs attention, such as an OS that no longer gets security updates. More in [Health and network checks](health.md).

Run one command, or open a shell on the server:

```bash
komando exec web1 -- uptime
komando shell web1
```

Everything after `--` is the command that runs on the server. [Running commands](commands.md) shows long tasks and saved commands too.

## 4. Protect production

Mark a production server as protected. Every change on it then asks you first, at your terminal:

```bash
komando host edit web1 --protected
```

[Safety](safety.md) explains what komando stops, and what to do when it stops you.

## 5. Connect your AI agent

```bash
komando guide install
```

This connects your agent (Claude Code, Codex, Cursor or Gemini CLI) to komando. Passwords stay in komando's vault, and the agent never sees them. Run it again after each `komando update`. [Agent skill](agent-skill.md) says what it sets up and what still asks you first.

## Where to go next

- [Targets](targets.md): work on one server, a group, a tag or everything at once.
- [Files](files.md): read, edit and copy files safely.
- [Databases](databases.md) and [Caches](caches.md): query them from the same command line.
- [Glossary](glossary.md): the words komando uses, in plain language.
