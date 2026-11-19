# Switch from Termius

Termius and komando both keep a list of your servers and log in to them over SSH. This page shows how to bring your hosts into komando, and where each everyday task lives once they are there.

## Bring your hosts over

komando does not read Termius's data. It reads an SSH config file, the plain list of hosts that `ssh` itself uses:

1. Put your hosts in `~/.ssh/config`, one `Host` block each, if they are not there already. Copy the address, user, port and key path from each host in Termius.
2. See what komando would add, without adding anything:
   `komando import ssh-config --dry-run`
3. Import them, for example into a group:
   `komando import ssh-config --group work`
4. Check that komando can log in to all of them:
   `komando test @work`

To read another file, add its path: `komando import ssh-config FILE`. `ProxyJump` lines come in too, so a server behind a jump host keeps its way there.

Importing the same file again changes nothing, and komando lists whatever it could not import, with the reason.

## Passwords and keys

An SSH config file holds no passwords. At your terminal, komando asks for a password when a server wants one, as `ssh` does. To save it once in komando's vault, so that scripts and AI agents can log in too:

```bash
komando host edit web1 --ask-password      # stored as secret:web1-pass
```

Or move to a key. komando makes one and puts it on your servers, logging in with their current login to do it:

```bash
komando key gen deploy
komando key deploy deploy @work --set-default
```

Keys that already work with `ssh` on this computer work with komando too. More in [Servers](servers.md#log-in-with-a-key).

## Where everyday tasks live

| Task | In komando |
|------|------------|
| Open a terminal on a server | `komando shell web1` |
| Run one command on many servers | `komando exec @web -- uptime` |
| Save a command and run it again | `komando recipe add` and `komando recipe run` ([Running commands](commands.md#recipes-ready-made-and-saved-commands)) |
| Copy files to and from a server | `komando upload`, `komando download` or `komando cp` ([Files](files.md#copy-files)) |
| Copy from one server to another | `komando cp web1:/var/backups/db.sql.gz web2:/var/backups/` |
| Forward a port | `komando tunnel start db1 -L 15432:localhost:5432` ([Private servers and tunnels](tunnels.md#forward-any-port)) |
| Reach a server through a jump host | `komando host add db1 admin@10.0.0.5 --via bastion` |
| Keep passwords and keys | `komando secret` and `komando key` ([Secrets](secrets.md)) |

Typed alone at your terminal, most of these ask for what is missing, one line at a time.

## What works differently

- **It is a command line.** Every task is a command you can type, put in a script, or hand to an AI agent. Free Komando apps for Mac, iPhone and iPad that run these same commands come next; the [user guide](site:guide/) describes them.
- **AI agents use it safely.** Passwords stay in komando's vault, and an agent never sees them. Connect yours with `komando guide install` ([Getting started](getting-started.md#5-connect-your-ai-agent)).
- **Production asks first.** Mark a server with `komando host edit web1 --protected`, and every change on it needs a yes ([Safety](safety.md)).
- **More than servers.** The same list holds databases, caches, queues, storage, clusters and VPNs.
- **A record of everything.** `komando audit` shows what was done, and by whom.

## Moving to another computer

`komando export --to komando-backup.json` saves your servers, connections, VPNs and saved commands, with no passwords. On the other computer, `komando import komando komando-backup.json` brings them back. The details are in [Moving in and moving computers](import.md#move-to-another-computer).
