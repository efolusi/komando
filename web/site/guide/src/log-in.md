Every server in Komando logs in one way: with your SSH agent, with a key komando keeps, or with a password komando keeps. You choose it under **Log in with** when you add the server.

## The three ways to log in

**SSH Agent.** komando uses your SSH agent and the keys in `~/.ssh`, like the `ssh` command does. Pick this if you already log in to the server from the Terminal app without typing a password. Nothing is saved in Komando.

**Saved Key.** komando logs in with a key kept in its own keychain. Pick the key under **Choose a key…**. The public half of the key must be on the server; [put it there](#put-a-key-on-a-server) first if it is not.

**Password.** Type the server's password. It is stored encrypted in komando's keychain as `secret:web-1-pass`, and you never see it again. komando uses it each time it connects.

**Ask each time** {coming:ask-each-time}: nothing is saved, and you type the password each time Komando connects. It is not offered for servers yet.

> A key is safer than a password: nobody can guess it, and you can take it off a server at any time. If you are not sure, use a key.

{shot:log-in/log-in-with|Log in with on New Host: SSH Agent, Saved Key and Password.}

## Make or import a key

If **Saved Key** says "No keys yet", komando has no keys of its own yet.

1. Open **Keychain** under **More** in the sidebar.
2. Click **New Key…**. The sheet "New SSH Key" opens.
3. Choose **Make a New Key** and give it a **Name**, such as `deploy`. **Ed25519 (recommended)** is short and strong; pick RSA only for an old server that asks for it. Or choose **Import a Key File** and click **Choose…** to pick a key you already have; the file stays where it is.
4. Click **Make Key** or **Import Key**.

New Host now offers the key by this name under **Saved Key**.

## Put a key on a server

A server lets a key in once the key's public half is in `~/.ssh/authorized_keys` on the server.

1. On **Keychain**, click the key's ⋯ and choose **Put on a Host…**.
2. Pick the server, and under **Whose keys** choose the login user or every user on the server. Click **Put on Host**. komando adds the public key there. A server that has the key already is left as it is.

To do it by hand, right-click the key and choose **Copy Public Key**, then paste the line into `~/.ssh/authorized_keys` on the server.

To take a key off a server, use **Revoke from a Server…** in the same menu. See [Keychain](guide:keychain#keys).

## The first time: trust the server's identity

Every server has an identity, its host key, with a fingerprint that proves it is the same server next time. The first time komando connects to a server (when you add it, test it or open a terminal on it), it saves that fingerprint without asking you. From then on, it checks that the server shows the same one.

That first time, nothing proves the key really is your server's. To be sure, compare the fingerprint komando saved with the server's own:

1. In the Terminal app, run `komando audit --command host.key-pinned --target web-1 -o json`. The record has the `fingerprint` komando saved, such as `SHA256:pVt2…`.
2. On the server's own console (or your cloud provider's console, which often shows it in the first boot log), run `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub`.
3. If the two fingerprints match, you are done. If they differ, stop using the server and ask whoever runs it: someone may be in between.

> To check every new server before komando trusts it, run `komando config set host_key_policy strict`. komando then refuses a server it has not seen until you run `komando host trust web-1` and check the fingerprint it shows.

### When a server's identity changes

If the fingerprint is different from last time, komando refuses to connect. The terminal says "Identity changed" beside a red dot, and shows the old and the new fingerprint. This happens when a server was rebuilt. It can also mean that someone else's server is answering in its place.

1. Check the new fingerprint on the server's own console, or ask whoever runs the server. On the server, `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub` prints it.
2. Click **Trust New Key…**. The sheet warns that it may be someone else's server and shows **Before** and **Now**. The fingerprint you checked must match **Now** exactly.
3. Tick "I checked that web-1 shows this new key", then click **Trust New Key…**. A terminal tab opens and runs the command the sheet showed. komando asks you once more.
4. Click **Reconnect**.

If you did not expect the change, do not trust it. Ask whoever runs the server first.

{shot:log-in/trust-new-key|The Trust New Key sheet: the warning, Before and Now, the box to tick, and the command with the Now key.}

#### komando trusts the key you checked, or nothing

The command in the sheet ends with `--fingerprint` and the **Now** key. komando trusts the new key only if the server still shows that exact key when the command runs.

If the server shows another key at that moment, komando stops and trusts nothing. The terminal tab says "The server shows a different key than the one you checked; nothing was trusted." There is no Trust button there, on purpose: a key that changes between your check and the command is a warning sign.

1. Do not try again right away.
2. Check the key on the server's console once more, or ask whoever runs the server. The server may offer another kind of key than the one you compared.
3. Open the terminal again. If it still says "Identity changed", start from step 1 above with the key it shows now.

#### With a komando older than 0.15.0

An older komando cannot be held to the key you checked. The sheet says so under the command, for example "komando v0.14.1 is older than 0.15.0, so Komando can't make sure it trusts the key you checked."

You can still trust the key. In the terminal tab, komando prints the old and the new key again: compare the new one with the key you checked before you answer. Better: update komando first (see [Install komando](guide:first-ten-minutes#2-install-komando)).

#### A server komando has not met

When host keys are set to strict, komando also refuses a server it has never connected to. The terminal says "Identity not checked". **Trust Key…** opens the same sheet with one key, **It shows**. Check it the same way, tick the box, and click **Trust Key…**.

On iPhone and iPad there is no Trust Key. Trust the key on your Mac, or in a terminal with `komando host trust NAME --fingerprint SHA256:…`.

## Change how a server logs in

1. Right-click the server on **Hosts**, or use its ⋯, and choose **Edit Host…**.
2. Under **Log in with**, the way it logs in today is chosen: **SSH Agent**, **Saved Key** or **Password**. A key file set in the terminal shows as "Key file: … (set in the terminal)" with no tab chosen; choose a tab only to change it.
3. Choose another tab to switch, or type a new password:
   - **Password** shows "Password saved (secret:web-1-pass)" and an empty **Set a new password** field. Leave it empty to keep the saved password.
   - A new password never overwrites the saved one. It is saved under a new name, for example `secret:web-1-pass-2`, and the old one stays in the keychain. When other servers share the old one, the help names them. Remove an old one on **Keychain** when nothing uses it.
   - Switching away from **Password** also leaves the saved password in the keychain.
4. Click **Save**. A protected server asks "This target is protected" first, with the exact command, before anything is stored; **Cancel** leaves everything as it was. The new password goes to the keychain and never on the command line.

If the save fails after the password was stored, Komando removes it again. It asks first: "Remove secret:web-1-pass-2 again?" Click **Remove Secret**, or **Cancel** to keep it.

Also:

- **A missing password.** When the server's password is not in the keychain, its row and Home say so, with **Add Password**. See [Keychain](guide:keychain#a-missing-password).
- **A password several servers share.** To change it for all of them at once, open **Keychain**, right-click `secret:web-pass` and choose **Replace Value…**. Type the new password and click **Save Secret**. Komando asks "Replace secret:web-pass?" first. Click **Replace Value**.

After any change, open the server and click **Test** (⇧⌘T) on its Overview. **About this server** says how it logs in ("Works without a password" or "Asks for a password") and "Connected" when it works.

## On the command line

`komando host add NAME USER@ADDRESS` adds a server, `komando host edit` changes how it logs in, and `komando host trust NAME --fingerprint SHA256:…` trusts its identity only if the server shows that key (komando 0.15.0 and newer).
