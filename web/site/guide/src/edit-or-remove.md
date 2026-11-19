Change a server's or connection's details, protect it, or take it out of the inventory, without the command line.

## Edit a server or connection

1. Right-click its row on **Hosts** or **Connections**, or use the row's ⋯, and choose **Edit Host…** for a server or **Edit…** for anything else.
2. The sheet "Edit web-2" shows its details, filled in, in the same order as New Host:
   - **Name**: a new name is changed everywhere komando uses it.
   - **Address**: `user@address`, with `:port` when SSH does not listen on 22. Take the user or the port out to clear it.
   - **Log in with**: how the server logs in today is chosen. See [Change how a server logs in](guide:log-in#change-how-a-server-logs-in).
   - **Reach through a server or VPN**, **Groups** and **Protected**.
   - **More**: the sudo password. A saved one shows as "Sudo password saved"; leave the field empty to keep it.
3. Click **Save**. It stays dimmed until something changed, and only what changed is sent. A banner says "Saved web-2." An open tab of a renamed target follows the new name.

If the save fails, komando's message shows above the buttons and what you typed stays in the sheet, so you can try again.

A connection's **Edit…** changes its name, groups, route and Protected. Changing its password there is coming. {coming:edit-login}

## A new password for a server

Type it under **Log in with**, on the **Password** tab, in **Set a new password**. It works like this:

- The saved password is never shown. The sheet says "Password saved (secret:web-2-pass)" over an empty field. Leave the field empty to keep the password you have.
- A new password never overwrites a saved one. Komando stores it under a name no secret has yet, such as `secret:web-2-pass-2`, and web-2 logs in with it from then on.
- The old password stays in the keychain. When nothing uses it any more, remove it on the [Keychain](guide:keychain#more-for-a-secret) page. When other servers share it, the sheet names them, and their password does not change.
- Before it stores anything, **Save** reads komando's own list of secrets again. If komando cannot list its secrets, nothing is stored, and the sheet says so.
- If the save fails, komando's message shows in the sheet and the password you typed stays in its field, so you can try again. If a new secret was already stored, Komando asks "Remove secret:web-2-pass-2 again?" before it removes it.

{shot:edit-or-remove/edit-host|The Edit Host sheet for web-2.}

## Everything in a row's menu

Every server and connection has the same menu in four places: its row's ⋯, a right-click on the row, its tab, and the ⋯ on its page. The menu has five groups, always in this order:

1. Its own actions, by kind: **Open Terminal** and **Files** for a server, **Query** for a database, **Keys** for a cache, **Files** for storage, **Peek Messages** for a queue, **Images** for a registry, **Workloads** and **Events** for a cluster.
2. **Test Connection**.
3. **Run Recipe** › and **New Forward…**. See [Recipes](guide:recipes) and [Port forwarding](guide:port-forwarding).
4. **Copy Name**, **Copy Address** and **Show SSH Command**. A copy is always [one clean line](guide:touch-id-and-safety#copy-gives-one-clean-line).
5. **Edit Host…** (or **Edit…**) and **Remove Host…** (or **Remove…**).

Each page also has one main button for its kind, such as **Open Terminal**, **Browse Files**, **Peek Messages**, **Show Images** or **Show Workloads**.

## Protect a target

Turn on **Protected** in the Edit sheet, or click **Protect** on a Home finding. From then on, every change on it asks first. See [Touch ID and safety](guide:touch-id-and-safety#protected-targets).

Saving any change to a protected target, turning Protected off included, asks "This target is protected" first, before anything is stored. The question names the one flag your yes adds (`--yes`) and shows the exact command. Your yes covers that one command only: the next change asks again. **Cancel** saves nothing.

## Remove a target

1. Click **Remove…** at the left of the Edit sheet, or **Remove Host…** (**Remove…** for a connection) in the row's menu.
2. It asks "Remove web-2 from the inventory?". komando forgets it; its passwords stay in the keychain, and the server or database itself is not touched.
3. A banner says it is no longer in the inventory, and its open tab closes.

There is no undo. To bring it back, add it again; its password is still in the keychain.

## On the command line

`komando host edit`, `komando conn edit`, `komando vpn edit` and `komando host rename` do the same, and `komando host rm` removes a server.
