Komando is a free app for Mac, iPhone and iPad. It does its work by running komando, a free command line, on your Mac. So you install komando first, then Komando uses it. In ten minutes you will have one server in Komando and a command prompt on it.

## Words you will see

- **komando** (small k) is the command line that does the work. **Komando** (capital K) is the app that runs it for you.
- A **server**, also called a **host**, is a computer you log in to over SSH. SSH is the secure way to log in to a server.
- A **target** is anything komando can reach: a server, a database, a cache, a storage bucket, a cluster, a registry, a message queue or a VPN. The **inventory** is the list of all of them.
- A **key** is a file that proves who you are to a server, instead of a password.
- **Protected** marks a target where every change asks you first, such as production.

## 1. Get Komando

Komando for Mac needs macOS. The iPhone and iPad app is described in [Komando on iPhone and iPad](guide:iphone-and-ipad). {coming:app-download}

## 2. Install komando

Open Komando. If komando is not on this Mac yet, the window says "Install the komando command line".

1. Open the Terminal app, paste this line and press Return. It downloads komando's install script for release v0.15.0, and the script installs that release:
   `curl --proto '=https' --tlsv1.2 -fsSL https://raw.githubusercontent.com/sgnd/komando/v0.15.0/install.sh | KOMANDO_VERSION=v0.15.0 sh`
2. Back in Komando, click **Check Again**.

> Check it first, if you like: download the script, read it, then run it. In Terminal, run `curl --proto '=https' --tlsv1.2 -fsSLO https://raw.githubusercontent.com/sgnd/komando/v0.15.0/install.sh`, then `shasum -a 256 install.sh`. The result should be `9089ae0c0fbe7689aaf327237c02267b6b7f39dd8060187f91b22f24b46fc4af`. Read the script with `less install.sh`, then run it with `KOMANDO_VERSION=v0.15.0 sh install.sh`. The installer checks that the release is signed with the komando project's key (the check `komando update` makes) and installs nothing otherwise.

If komando is installed in a folder Komando does not look in, click **Choose komando…** and pick the komando program.

{shot:first-ten-minutes/install|The window Komando shows when komando is not installed: the install command, Copy Command, Choose komando… and Check Again.}

## 3. Welcome

When komando answers and you have no servers yet, Home says "Welcome to Komando" with three cards:

- **Add a Host**: add one server by hand. You do this next.
- **Add something else**: add a database, cache, storage, cluster, registry, queue or VPN. See [Add a database, cache or anything else](guide:add-a-connection).
- **Import from ~/.ssh/config**: bring in the servers you already have in your SSH settings. See [Add a server](guide:add-a-host#import-what-you-already-have).

{shot:first-ten-minutes/welcome|Welcome to Komando, with its three cards.}

## 4. Add your first server

1. Click **Add a Host**. A **New Host** tab opens.
2. **Name**: a short name with no spaces, such as `web-1`.
3. **Address**: the user you log in as, `@`, then the server's address, such as `deploy@10.0.0.4`. Add `:2222` at the end only when SSH does not use port 22.
4. **Log in with**: pick **SSH Agent** if you already log in to this server from the Terminal app with a key. Pick **Password** to type the server's password; it is stored encrypted. [Log in with a key or a password](guide:log-in) explains each choice.
5. Click **Save Host** (⌘↩).

Komando says "web-1 is in the inventory." and tests the connection at once: "Testing the connection…", then "Connected". If the test fails, the server is saved anyway and Komando says why. [Add a server](guide:add-a-host#if-the-test-fails) shows what to do.

## 5. Open a terminal

1. Click **Open web-1**. The server opens as a tab, on its Overview.
2. Click **Open Terminal**.
3. The first time, the server's identity is new to this Mac. Type `yes` and press Return.

You now have a command prompt on web-1, `deploy@web-1`, in green. Type `exit` or close the tab when you are done. [Open a terminal](guide:open-a-terminal) has the rest.

## 6. Look at Home

Click **Home** in the sidebar (⌘1). It now shows three sections:

- **Needs attention**: what komando's health check found wrong, one sentence each, with a button that fixes it. See [Home and findings](guide:home-and-findings).
- **Running now**: VPNs, forwards and background jobs.
- **Recent activity**: what happened lately, with a link to the audit log.

## Where to go next

- Add the rest of your servers: [Add a server](guide:add-a-host).
- Add a database and query it safely: [Databases](guide:databases).
- Ask the agent for help in plain words: [The agent](guide:agent).
- Learn how Komando keeps you from changing things by accident: [Touch ID and safety](guide:touch-id-and-safety).
