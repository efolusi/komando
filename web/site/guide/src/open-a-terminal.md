A terminal gives you a command prompt on a server, as if you sat at it. Komando opens it inside its own window, in a tab beside the server.

## Open a terminal

1. Press ⌘K, type the server's name and press Return. Or open **Hosts** in the sidebar and click the server's row. The server opens as a tab, on its **Overview**.
2. Click **Open Terminal**.
3. The terminal says "Connecting to web-1…" (with "through bastion" when the server is reached through another one). **Cancel** stops it.
4. The first time, `ssh` asks whether to trust the server's identity. Type `yes` and press Return. If it asks for a password, type it; it does not show as you type.

The prompt shows, such as `deploy@web-1`, and the dot in the terminal's toolbar turns green.

Shortcuts: double-click a server's row on Hosts to go straight to its terminal. To reach a server that is not in the inventory, press ⌘K, type `deploy@10.0.0.4`, and choose **Connect to deploy@10.0.0.4**.

{shot:open-a-terminal/terminal|A terminal on web-1, with the toolbar's ⋯ menu open.}

## Panes, sessions and more

The ⋯ in the terminal's toolbar, and the **Terminal** menu, hold the rest:

- **Split Right** (⌘D) puts a second pane on the same server beside this one. **Split Down** (⇧⌘D) puts it below. Up to four panes.
- **Broadcast Input** (⌥⌘I, with two panes or more) types into every pane at once. The status bar says "Typing into 2 panes" until you choose **Stop Broadcasting**.
- **New Session** (⌘T) opens another session on the same server.
- **Run a Recipe** runs one of your saved commands here. See [Recipes](guide:recipes).
- **Files** opens the server's files. See [Files](guide:files).
- **Restart Session** starts the session again.
- **Open in Terminal App** opens the same session in the Mac's Terminal app.
- **Bigger Text** (⌘+), **Smaller Text** (⌘−) and **Actual Size** (⌘0), in the **Terminal** menu, change the text size in every pane, from 11 to 28 points. Komando keeps the size.

With two panes or more:

- Drag the line between two panes to give one more room. Komando remembers the sizes for the next tab and the next time it opens. A pane keeps its size when another pane opens or closes.
- The × on a pane's head closes only that pane. While its session runs, it asks first: "Close this pane?" The other panes stay open.

> Broadcast Input types the same keys everywhere, without komando's safety checks. To run one command on many servers with the checks, use a recipe instead.

## When the session ends

When you type `exit`, or the server closes the session, the pane says "Session ended", or "Session ended with an error", and offers **Reconnect** and **Close Pane**. With only one pane, **Close Terminal** ends the session and takes you back to the server's Overview; the tab stays open.

## If it cannot connect

The pane's head says it could not connect, beside a red dot. komando's error and hint stay on screen above a bar that says "Could not connect to web-1", with **Reconnect** and **Close Pane**.

- Wrong password or key: see [Log in with a key or a password](guide:log-in#change-how-a-server-logs-in).
- The server is behind a VPN that is down: bring it up (see [VPNs](guide:vpn)), then click **Reconnect**.
- The server did not answer in time: check that it is running and that its address is right (**Edit Host…** on Hosts).
- "Identity changed": the server's host key is different from last time. See [When a server's identity changes](guide:log-in#when-a-server-s-identity-changes).

## What a server cannot do to your terminal

A terminal shows what the server sends. Komando leaves out the few things a server could use to crash the app or to fool you. Everything else shows as before.

- Pictures sent as terminal output (Sixel, Kitty and iTerm2 images) do not show.
- A server cannot resize your terminal. The xterm resize command (`resize -s`) does nothing, and a server cannot switch a pane between 80 and 132 columns or set left and right margins.
- A control sequence that never ends is cut, so it cannot freeze the pane.
- A server's output cannot pretend that a host key changed. That warning only ever comes from Komando itself.

You do not have to turn any of this on.

## Save a set of tabs

If you open the same terminals every day, save them as a workspace. Press ⌘K and choose **Save Workspace…**: it keeps the open tabs and splits under a name, such as `deploy`. Later, ⌘K → **Open Workspace deploy** brings them back.

## On the command line

`komando shell web-1` in the Terminal app opens the same login shell.
