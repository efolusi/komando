Komando is built so that you cannot change a server by accident. Reading is always safe; changing needs a tick, a question, or both. This page explains the safety controls, the audit log, and the Touch ID lock.

## Allow changes

Pages that can change something (Services, Updates, Containers, the database Query tab, the cache Keys tab, and the agent) have one box: ☐ **Allow changes**.

- While it is off, the buttons that change things are dimmed, with "Tick Allow changes first". A database refuses any change, even one you type by hand.
- Ticked, the page says what happens next, such as "Allow changes is on: every change asks before it runs."
- It starts off again each time you open the page.

## Protected targets

Turn on **Protected** for production servers and databases, when you add them or in **Edit Host…** / **Edit…**. On a protected target, every change asks "This target is protected" first, with the exact command and **Run Anyway**. **Cancel** runs nothing.

## The questions komando asks

komando stops a risky command and Komando asks you, in plain words, once:

- "This changes data", with **Allow Writes**, when a query would change a database while ☐ Allow changes is off.
- "This target is protected", with **Run Anyway**.
- "This command looks destructive", for a command that could do damage, such as removing a package the server needs.

Each question shows the exact command and names the one flag your yes adds (`--write`, `--yes` or `--allow-dangerous`). Your yes covers that one command only; the next one asks again. **Cancel** always runs nothing.

## The audit log

The audit log is komando's record of every change it made and every attempt it blocked.

1. Open **Audit Log** under **More**, or click **Audit Log** under Recent activity on Home.
2. Newest first: when, who (you or the agent), the command, the targets, and the result (Done, Failed, or Blocked when komando stopped it).
3. Chips filter it: **All**, **Changes**, **Failed**, **Agent**. The **Last 200** menu shows more.
4. Click a row for the exact command and who allowed it. A row the agent ran has **Open Conversation**. Drag the line beside the details to make them wider or narrower.
5. Right-click a row for **Copy Command** (a line komando takes, with what ran), **Show Target** (opens that server or connection) and **Show Only This Target** (lists only its entries).

To check that nobody edited the record, click ⋯ › **Verify the Record…**. If something was changed outside komando, Home shows a finding.

{shot:touch-id-and-safety/audit-log|The Audit Log: changes by you and the agent, one Blocked.}

## Copy gives one clean line

A name or an address can come from a server, and a server could hide a line break or a control code in it. Pasted into a terminal, that could run a second command you never saw.

So on the Mac, **Copy Name**, **Copy ID**, **Copy Address**, **Copy Key Name**, **Copy Local Address** and **Copy Command** always copy one line, with the hidden codes taken out. ⌘C in a table copies each cell on one line, so a cell cannot add a row.

When a copy worked, Komando says "Copied" for a moment above the page.

## The Touch ID lock

Lock Komando so that the next person at your Mac cannot open your servers in the app.

> The lock covers the Komando app only. It does not stop someone at your Mac from running `komando` in the Terminal app, which reaches the same servers. Lock your Mac itself (Control-Command-Q) when you walk away.

1. Open **Settings** (⌘,), **General** tab.
2. Turn on **Lock Komando with Touch ID**. macOS asks for Touch ID, or your Mac's password, to turn it on.

From then on:

- When Komando opens, it says "Komando is locked". Click **Unlock** and use Touch ID or your Mac's password.
- The Keychain page asks again on each visit, unless you unlocked in the last few minutes.
- Komando locks again when your Mac locks or sleeps. While it is locked nothing shows and nothing runs; terminal sessions keep running in the background.
- The menu bar shows only "Komando is locked", **Open Komando** and **Quit Komando**.

Turning the lock off asks for Touch ID too. Without Touch ID, your Mac's password works, so nobody is locked out.

{shot:touch-id-and-safety/locked|Komando is locked, with the Unlock button.}

## On iPhone and iPad

On the phone, every change asks for Face ID first. See [Komando on iPhone and iPad](guide:iphone-and-ipad).

## On the command line

komando asks the same questions in the Terminal app, and names the flag that allows the command (`--yes`, `--write`, `--allow-dangerous`). `komando audit` and `komando audit verify` show and check the log.
