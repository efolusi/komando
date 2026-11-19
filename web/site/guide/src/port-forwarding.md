Port forwarding makes something on a server reachable on this Mac. For example, a database that only listens inside your network shows up at `localhost:15432`, so your own database tool can connect to it. komando keeps the forward open in the background until you stop it.

## Start a forward

1. Open **Port Forwarding** in the sidebar. With nothing open it says "No forwards open".
2. Click **New Forward** in the header.
3. Under **Through**, pick a server, a database or a cache.
4. For a database or a cache, it asks only for a **Local port**. Leave it empty and komando picks a free one.
5. For a server, pick one of three tabs and type the **Rule**:
   - **Local**: a port on this Mac reaches a port on or behind the server, written `LOCAL_PORT:HOST:PORT` as the server sees it, such as `8080:localhost:80`.
   - **Remote**: a port on the server reaches a port on this Mac, written `SERVER_PORT:HOST:PORT` as this Mac sees it.
   - **SOCKS Proxy**: a local port, such as `1080`, for a proxy whose traffic leaves through the server.
6. A line says what **Start** will do, such as "Opens a port on this Mac (localhost:9090), connected to port 9090 on web-1." Click **Start**.

The sheet says "Forward started". The forward is now a row on the page, it shows on Home under Running now, and the menu bar icon fills in.

{shot:port-forwarding/new-forward|The New Forward sheet: Through prod-db, an empty Local port, and Start.}

## Use it

Click the row's ⋯, or right-click the row, and choose:

- **Copy Address**: copies one clean line, and the page says "Copied localhost:15432". Paste it into your database tool.
- **Open in Browser**: for a forward to a web page, opens it in your browser.
- **Restart**: stops the forward and starts it again with the same rule.
- **Save as Forward…**: keeps this forward's rule as a saved forward (see below). Save starts nothing; the open forward keeps running.

## Keep a forward you use often

Tick "Keep it as a saved forward, with a switch on this page" in the New Forward sheet, or choose **Save as Forward…** on an open one. Saved forwards are kept on this Mac, under **Saved forwards**: turn one on to start it, off to stop it.

A saved forward's ⋯ and right-click menu hold:

- **Start** or **Stop**, and **Copy Address**.
- **Edit…**: changes the saved rule. Save starts nothing. If the forward is open, it keeps its old rule until you restart it.
- **Remove Saved Forward…**: asks first, and names the forward by its address. Only the saved rule goes; an open forward keeps running.

## Stop a forward

Click the row's ⋯ and choose **Stop…**. It asks first ("Stop the forward to prod-db?"), because the local port closes for every app that uses it. The menu bar has it too: click the forward, then **Stop Forward**.

## If something goes wrong

- **Start** fails: a red banner says why, in words ("The forward did not start."), with komando's message.
- "komando did not run": unlock Komando, or check komando in **Settings**, then try again.
- A forward that dies shows **Stopped** in red. When the window is not in front, a notification says "Forward stopped". While your Mac or Komando is locked, it does not name the forward. Turn these off in **Settings** with "Notify me when a forward or VPN stops".

## On the command line

`komando tunnel start prod-db` opens the same forward. On the command line the word is still `tunnel`.
