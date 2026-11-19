A VPN is a private network you join to reach servers that are not on the internet. Usually you do nothing: when a target needs a VPN, komando brings it up by itself.

## Add a VPN

1. Click **Add** (⌘N), then **VPN**.
2. Pick the **Kind**: **WireGuard**, **OpenVPN** or **Tailscale**, or another kind komando knows.
3. Give it a **Name**, then what that kind needs:
   - **WireGuard**: click **Choose…** and pick its `.conf` file.
   - **OpenVPN**: click **Choose…** and pick its `.ovpn` file, then the user and password if it asks for them.
   - **Tailscale**: paste an **Auth key** (`tskey-auth-…`) from the Tailscale admin console.
4. Optional: a **Check address**, a `host:port` that only answers through the VPN, so komando knows the VPN is up.
5. Click **Save VPN**.

komando keeps the file encrypted in its keychain, so you can delete your copy afterwards. A password the VPN asks for can be saved with **Save in keychain**, or typed each time with **Ask each time**.

To reach a server through the VPN, turn on **Reach through a server or VPN** on the server and pick the VPN.

{shot:vpn/new-vpn|The VPN form for WireGuard: Name, the .conf file and the Check address.}

## Bring it up or down by hand

1. Open **Connections** and click the **VPNs** chip.
2. A VPN that is down reads "Down" with **Connect**. Click it.
3. A VPN that asks for a login, such as a one-time code, opens a tab of its own where komando asks for it. What you type does not show. When it is up, close the tab.

An up VPN reads "Up since 2 hours ago" with a green dot, and shows on Home under Running now and in the menu bar. **Disconnect** is in its row's ⋯, on its tab, and in the menu bar.

## When it drops

When a VPN drops while the window is not in front, a notification says "VPN disconnected". komando brings it up again when a target needs it.

## Change a VPN

Click **Edit…** in its row's ⋯. WireGuard and OpenVPN keep their file: to use another file, remove the VPN and add it again.

## On the command line

`komando vpn up office` and `komando vpn down office` do the same.
