The **Updates** tab shows the updates a server is waiting for, the security ones first, and installs them when you say so. It also tells you when a server needs a reboot to finish an update.

## See what is waiting

Open the server and click the **Updates** tab. Komando asks the server which updates are waiting; this changes nothing.

**Waiting updates** lists each package: its name, the version installed, the new version, and its kind. Security updates are marked **Security** and come first. The line under the title says how many, such as "12 updates, 3 of them for security."

**About these updates**, on the right, says which tool installs packages on the server (apt, dnf and the like), how old its package list is, whether it needs a reboot, and which services need a restart after an update.

If nothing is waiting, the tab says "web-1 is up to date".

{shot:updates/updates|The Updates tab: Waiting updates with three security updates, and About these updates.}

## Get the newest list

A server only knows about updates in its package list. If the list is old, click **Refresh** under About these updates. It downloads the newest list and checks again; it installs nothing. On a protected server it asks first.

## Install updates

1. Tick ☐ **Allow changes**. Until you do, the buttons are dimmed and the tab says "Allow changes is off: nothing is installed or restarted."
2. Click **Install Security Updates** to install only those, or **Install All**. Each button's tooltip shows the exact command.
3. While it installs, the button says "Installing…". It can take minutes; komando runs it on the server, so closing the tab does not stop it.
4. A banner says what was installed, such as "Installed 3 security updates on web-1.", and which services need a restart.

On a protected server, komando asks "This target is protected" first. If an update would remove a package the server needs, such as `openssh-server` or `sudo`, komando stops and asks before going on.

## Reboot when an update needs it

When an update needs a reboot, a card at the top says "web-1 needs a reboot to finish an update." and why, such as a new Linux kernel.

1. Tick ☐ **Allow changes**.
2. Click **Reboot…**. Komando asks "Reboot web-1?" and shows the exact command.
3. While it runs the button says "Rebooting…". komando waits until the server answers again, then a banner says it is back.

komando never reboots a server on its own.

Security updates will also show on Home. {coming:home-updates}

## When it can't

- Some package tools (apk, zypper, pacman) cannot install only the security updates through komando; **Install Security Updates** is then dimmed and says why.
- A Windows server: "komando can't update Windows servers yet."

## The System row

With komando 0.15.0 and newer, the **System** row here is read with `komando facts web-1 --only system`, and the server's Overview reads **Right now**, **System** and **Up for** the same way, also on a protected server. When the server gives no name or uptime, the row says "Unknown".

If komando cannot read it, the row says "Not read", with one line under the card that says why. Your updates are not affected, and you can still install them. With an older komando, the Mac uses a small read-only script, and a protected server may refuse it: the row then says "Not read" with komando's reason.

## On the command line

`komando pkg security web-1`, `komando pkg upgradable web-1`, `komando pkg upgrade web-1 --security` and `komando reboot web-1` do the same.
