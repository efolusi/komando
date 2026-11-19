Komando for iPhone and iPad is for when you are away from your desk: see what needs attention, fix it with Face ID, run quick checks, follow jobs and ask the agent. It is free, like the Mac app.

The phone does not run komando itself. It talks to the machine where komando lives, over SSH: a server, or your Mac with Remote Login turned on.

## Pair the phone

1. Open the app. It says "Komando on call".
2. The phone makes two keys, kept in its secure chip: one that "Reads, without Face ID" and one for "Changes, after Face ID". Leave **Network checks** off unless you need it (see [The read key and Network checks](#the-read-key-and-network-checks)). Tap **Copy Both Lines**.
3. Add the two lines to `~/.ssh/authorized_keys` on the machine that runs komando. Each line lets komando decide what that key may run.
4. Under "2. Where komando lives", type its `user@address` and tap **Connect**.
5. The first time, the phone shows the machine's identity. Run the command it shows on that machine, compare, and tap **It Matches, Trust This Host**.

The phone needs a passcode. Without one it says "Set a passcode first: Settings → Face ID & Passcode." komando on that machine must be version 0.13.0 or newer; the phone says so plainly when it is older. The read key's network rule below needs komando 0.15.0.

To look around first, tap **Try the Demo**. It shows sample servers and findings, nothing real.

{shot:iphone-and-ipad/pair|Pairing on iPhone: the two key lines and Where komando lives.}

## The read key and Network checks

The phone uses two keys, both in its secure chip:

- The **read key** works without Face ID. It can only read.
- The **change key** works only after Face ID. It is used when you change something.

With komando 0.15.0 and newer, the read key also stays off the network. It can read how your servers are doing, but it cannot make a server or the komando computer reach out to another address. So a stolen or tricked read key cannot send your data somewhere else.

### What works without Network checks

- Home, Targets, Activity and Jobs.
- **Right now** on a server: CPU, memory and disk.
- The **Health** and **Disk** quick checks, in plain sentences. Health read this way does not list failed services: tap **Services** for those.
- **Services** and **Test Connection**.

### What needs Network checks

- **Certificates** (`komando cert check`) and network checks (`komando net`), which reach the network from the server.
- Running a recipe other than health and disk from Shortcuts.

Without Network checks, such a check stops and says so, with komando's own message. Nothing runs.

### Turn Network checks on

Network checks is a switch on Welcome, above **Copy Both Lines**. It is off at first.

1. In Settings, tap **Forget This Computer** (**Forget This Mac** when komando runs on your Mac), or start on Welcome.
2. Turn **Network checks** on.
3. Tap **Copy Both Lines**.
4. On the komando computer, open `~/.ssh/authorized_keys`. Delete the phone's old read line, then paste the new lines.
5. On the phone, type the address and tap **Connect**.

Settings then says what the read key may do: "Reads only, no network" or "Reads, with network checks".

### When the line and the switch differ

Pairing checks that the read key's line on the komando computer matches the switch. When they differ it pairs nothing and says, for example, "The read key's line on mac-mini does not allow network checks, but Network checks is on here." This happens when an older line for the same key is still in `authorized_keys` (the first line wins), or when you changed the switch after copying the lines.

Delete the old line and paste the lines again, or turn the switch to match the line you want to keep.

### After you update komando

Pull down to refresh on the phone. It reads komando's version again on every refresh, so you do not need to pair again.

With a komando older than 0.15.0 nothing changes: the read key reads as before, the switch has no effect, and Settings says "Reads only".

## Home

Home lists **Needs attention**, **Running now** and **Recent activity**, like the Mac.

- A fix that acts on a server asks first. The dialog says "This runs:" and shows the exact komando command, each word as it will run, with any hidden character spelled out. Then Face ID.
- A fix that needs komando's extra yes (`--yes` or `--allow-dangerous`), such as one on a protected target, has no **Fix** button on the phone. Do it in Komando on the Mac.
- A fix that changes komando's own settings, such as Protect or Add Password, says to do it in Komando on the Mac.
- **Running now** links to background jobs, with their state and log. **Stop Job** and **Remove Job** ask first, then Face ID.
- When Face ID is cancelled, or a change fails, the reason shows right under the button you tapped.
- **All Activity**, and the **Activity** tab, open the audit log, with the **Changes**, **Failed** and **Agent** filters and **Check the Record**.

## Targets

The **Targets** tab lists every target by family; **Find a target** searches. Touch and hold a target, or swipe its row, for **Test Connection** and Copy; a copy says "Copied". A server has quick checks such as **Disk** and **Services**, which only read. Queues have their own read-only checks.

A very large answer, over 16 MB, is cut off so it does not fill the phone's memory. The screen says it was cut. Ask for less, such as fewer log lines, or read it on your Mac.

## Agent

The **Agent** tab works as on the Mac (see [The agent](guide:agent)), with ☐ **Allow changes**. **Allow Once** asks for Face ID first. **Stop** ends the agent's turn, and the newest message stays in view. Until you save a key in Settings it says "Add your Anthropic API key in Settings first."

Some reads can reach other addresses on the internet: `komando net`, `komando cert check`, and a server command that uses a network tool such as `curl`. The agent asks before it runs one of them, with the same card as a change. With ☐ **Allow changes** off, it does not run them.

## Settings

Settings has the komando machine's address and version, **Forget This Computer** (**Forget This Mac** when komando runs on your Mac; **Leave the Demo** in the demo), **Import from a Computer…**, **Remove Imported Inventory** once you have imported something, **Upgrade**, and the agent's Anthropic API key (**Save Key**).

**Forget This Computer** takes you back to Welcome. It also deletes the keys this phone made for that machine. Use it too when that machine was rebuilt and its identity changed.

### Notifications

Turn on **Notify Me** in Settings to hear when a background job finishes or a forward stops, while the app is open. A notification names the server and what happened, such as "A job on backup-1 finished.". It never shows the command. When the lock screen hides previews (**Show Previews** in the iPhone's Settings › Notifications), it says only "Open Komando to see what changed."

### Bring your inventory over

**Import from a Computer…** brings in what komando knows on a computer, sealed so only this phone can open it.

1. Tap **Make a New Key**, then **Copy Key** or **Share Key File…**.
2. On the computer, run `komando export --for-phone --to phone.kmdseal`. It asks for the key and prints six words.
3. On the phone, tap **Choose File…** and pick the file. Compare the six words with the ones the computer printed. If they match, tap **Words Match, Import**. If they differ, it is not the file you made: do not import it.

To take it off the phone again, tap **Remove Imported Inventory** in Settings. It asks "Remove the imported inventory?" first. The servers, connections, passwords and keys you imported leave the phone, with the key that sealed them. komando on the computer keeps its own copy, and you can import again any time.

## iPad

On iPad, the tabs become a sidebar, with **Jobs** in it, and Targets shows the list beside the chosen target. Drag the edge of the Targets list to make it wider or narrower; the iPad remembers the width. With a keyboard: ⌘1 to ⌘4 open the places, ⌘R refreshes, ⌘F finds a target, and ⌘N starts a new conversation with the agent.

## What stays on the Mac

The terminal, the SQL editor, Files, Protect, and anything past komando's own safety stop stay on the Mac. A change to a protected server says "change it from Komando on your Mac".

Files on the phone {coming:phone-files} and recipes on the phone {coming:phone-recipes} are coming.

## If something goes wrong

- The machine does not accept the phone's key: add the lines again, exactly as copied.
