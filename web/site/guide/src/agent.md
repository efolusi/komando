The agent is an AI assistant that runs komando for you. Describe a problem in plain words, such as "Which services failed on web-1 today?", and it runs the commands to find out, shows each one, and explains what it found. It changes nothing unless you allow it, and each change asks first.

## Set it up once

The agent runs on your own Anthropic account, and that account is billed for it. The app itself is free.

1. Press ⌘J. The agent opens on the right and says "Add your Anthropic API key to start."
2. Click **Settings…**. Settings opens on its **Agent** tab.
3. Paste your key under **Anthropic API key** and click **Save**. It stays in this Mac's keychain.

The **Model** is Claude Opus 5.5. **Remove Key** takes the key away again.

## Ask

1. Press ⌘J, click the chat bubble in a page's header, or choose **Go** › **Ask the Agent**.
2. Click one of the questions under "Try asking", or type your own and press Return. Shift-Return adds a line. Type `@` to add a server, database or group to the question. **Attach a File** adds a log or output file.
3. What you are looking at comes along: over a terminal, its command; over a target's tab, that target.

The agent works in visible commands. Each one is a row with the exact command, how it ended, and its output. Then it explains in plain words. **Stop** (⌘.) ends its turn, and **New conversation** starts over.

{shot:agent/drawer|The agent beside a terminal: a command it ran, its answer, and an approval card.}

## Let it change things

1. Tick ☐ **Allow changes** under the question box. It then says "Each change asks first".
2. Each change komando would stop for safety becomes a card: the risk ("prod-db is protected"), why, the exact command, **Don't Run** and **Allow Once**.
3. **Allow Once** runs that one command. On a protected target, komando asks you once more in its own window.

**Don't Run** skips it; the agent goes on without it.

Some reads can reach other addresses on the internet: `komando net`, `komando cert check`, and a server command that uses a network tool such as `curl`. The agent asks before it runs one of them, with the same card as a change. With ☐ **Allow changes** off, it does not run them.

The card scrolls into view when it arrives. If you have scrolled up to read, a chip at the bottom says "1 approval waiting"; click it to go to the card. For its first moment the card ignores clicks, so a click you meant for something else cannot allow a change.

## What it never does

- It never claims a result a command did not show.
- It cannot read your passwords: komando hides their values from it. It can see their names, such as `secret:prod-db-pass`, and which server or database uses each one.
- With a komando older than 0.14.1, approving a change to a connection, such as a new address, can send that connection's saved password to the new address. Read the address on the card before you click **Allow Once**. komando 0.14.1 and newer refuse that step for the agent (see below).
- It never changes or removes a saved password past komando's safety stop. When it is asked to, it says why it will not. Change a password yourself on the [Keychain](guide:keychain#add-or-replace-a-secret) page, or in a terminal.
- Every change it makes, and every command komando blocks, goes to the [audit log](guide:touch-id-and-safety#the-audit-log), marked with the agent's name. Plain reads, such as listing services, are not recorded there.
- It does not get past komando's own refusals. When komando refuses a step for an AI agent, the agent stops there.

### When a row says "Not run"

Some steps komando does not do for an AI agent, whatever the agent asks:

- sending a saved password or key to a new place, for example by changing a connection's host;
- reading or writing a file or folder that can hold passwords or keys, such as `~/.ssh`.

The command's row then says **Not run** and opens with one plain sentence, for example "komando did not let the agent use this file or folder, because it can hold passwords or keys; do this step yourself if you need it." Under it, "komando said:" shows komando's own words.

There is no **Allow Once** card for these, and the agent does not try again or look for another way. If you want the step done, do it yourself: right-click the connection, choose **Edit…** and change it there, or run the command in a terminal.

This needs komando 0.14.1 or newer. The iPhone and iPad show the same row.

{shot:agent/not-run|A command's row that says Not run: a plain sentence, then komando's own words.}

Built-in AI, without a key of your own, is part of the upgrade. {coming:upgrade}
