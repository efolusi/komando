A server, or host, is a computer you log in to over SSH. Add each one to komando's inventory once, and Komando can open a terminal, read its logs and services, and keep it updated.

## Add a server

1. Open **Hosts** in the sidebar and click **Add** (⌘N). On an empty Home, click **Add a Host**. Elsewhere, **Add** (⌘N) opens "What do you want to add?": click **Host**.
2. A **New Host** tab opens. Fill in:
   - **Name**: a short name with no spaces, such as `web-1`.
   - **Address**: `user@address`, such as `deploy@10.0.0.4`. Add `:port` only when SSH does not listen on port 22, such as `deploy@10.0.0.4:2222`.
3. Under **Log in with**, pick how Komando logs in: **SSH Agent**, **Saved Key** or **Password**. [Log in with a key or a password](guide:log-in) explains each one. {coming:ask-each-time}
   A password is stored as a new secret, such as `secret:web-1-pass`. It never overwrites a secret you already have: if that name is taken, Komando picks the next free one (`secret:web-1-pass-2`).
4. Optional:
   - **Groups**: names separated by commas, such as `production`. You can then run a recipe on the whole group as `@production`.
   - **Reach through a server or VPN**: turn it on for a server you can only reach through another server (often called a bastion) or a VPN, then pick which.
   - **Protected**: turn it on for production. Every change on a protected server asks you first.
5. Click **Save Host** (⌘↩).

**Save Host** stays dimmed until the name has no spaces, the address has an `@`, and the login you chose is complete.

{shot:add-a-host/new-host|The New Host tab: Name, Address, Log in with, Groups, Reach through a server or VPN, and Protected.}

## The connection test

After you save, Komando says "web-1 is in the inventory." and tests the connection: "Testing the connection…", then "Connected" with how long the server took to answer.

Then click **Open web-1** to open the server as a tab, or **Close**.

### Check the host key

A host key is how a server proves it is the same server each time. After the test, the form shows "Host key komando saved for web-1": the key's type (such as ED25519) and its whole fingerprint, with a button to copy it.

Compare it with the fingerprint the server's owner gave you.

- It matches: you are done.
- It differs: someone may be between you and the server. Do not use web-1, and tell its owner. If you logged in with a password, the test already sent it to that server, so change that password.

Removing web-1 keeps the saved key. Once the owner gives you the right one, replace it in a terminal with the command the form shows: `komando host trust web-1 --reset`.

### If the test fails

The test says "Saved, but the test failed:" with komando's message and a hint. The server is in the inventory anyway, so you can fix it in place:

- A wrong password: open **Edit Host…** and type the right one under **Set a new password**. See [Change how a server logs in](guide:log-in#change-how-a-server-logs-in).
- A wrong user or address: right-click the server on **Hosts**, choose **Edit Host…** and change **Address**.
- The server is behind a VPN or another server: turn on **Reach through a server or VPN** in the same sheet.

Then open the server and click **Test** (⇧⌘T) on its Overview to try again.

## Import what you already have

If you already keep servers in other tools, import them instead of typing each one.

1. Click **Add** (⌘N). Under "Or import what you already have", click the source, such as **SSH Config…**. On an empty Home, **Import from ~/.ssh/config** does the same, and so does **File** › **Import from SSH Config…**.
2. komando does a practice run that adds nothing, and lists what it would add.
3. Click **Import 3 Targets** (the button counts them). Komando says "Added 3 targets." and lists them.

The other sources are .pgpass, my.cnf, .env, kubeconfig, Docker, DBeaver, AWS, rclone and FileZilla. Entries from DBeaver arrive without their passwords: their rows say "Password missing", with **Add Password**. See [Keychain](guide:keychain).

If everything is already in the inventory, the sheet says "Nothing new to add."

{shot:add-a-host/import|Import from SSH Config: the list of servers komando would add, and the Import button.}

## Groups

A group is a name you give several servers, such as `web` or `production`. It shows as a chip on **Hosts**, so you can filter the list, and you can run a recipe on all of them at once.

- To put a server in a group, type the group's name under **Groups** when you add it.
- To rename a group, click the group's ⋯ on **Hosts** and choose **Rename Group…**. The servers stay; only the name changes. **Remove Group…** in the same menu takes the group away and leaves the servers.
- Putting several servers in a group at once, putting every imported server in a group, and changing how a whole group logs in are not in the app yet. {coming:group-tools}

## On the command line

`komando host add` does the same as New Host, and `komando import ssh-config` (and the other sources) does the same as the import sheet.
