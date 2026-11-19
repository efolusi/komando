Home is the first place in the sidebar (⌘1). It tells you what needs attention, what is running, and what happened lately, so you do not have to read komando's output.

## The three sections

- **Needs attention**: up to two findings, each one sentence ("web-1 allows root to log in with a password."), what the button does, and the button. A finding is something komando's health check, its doctor, found wrong.
- **Running now**: VPNs and forwards that are up, and a line such as "3 background jobs" with **View**.
- **Recent activity**: what happened lately, with a link to the **Audit Log**.

When nothing needs attention, the section says "Everything looks fine." with **Refresh**.

{shot:home-and-findings/home|Home: Needs attention with two findings, Running now and Recent activity.}

## Fix a finding

Each finding has one button. What it does:

- **Fix**: komando changes the setting for you. It asks first, "Run the fix?", and shows what changes and the exact command, each word as it will run, with any hidden character spelled out. Click **Run the Fix**.
- **Protect Host** or **Protect Connection**: marks the target protected, so every change on it asks first. It asks "Protect staging-db?" first.
- **Remove Connection**, **Remove Host** or **Remove Group**: takes out what the finding names, such as a connection that copies another one. It asks first.
- **Add Password**: opens a sheet to save the missing password. See [Keychain](guide:keychain#a-missing-password).
- **View**: opens the target's tab.
- **How to Fix**: for something komando cannot change for you, because it needs a file, a value or a decision only you have. It shows komando's own words and the command to run, with **Copy Command**, which copies one line and says "Copied". It changes nothing. Click **Close** when you are done.

A finding gets a one-click button only when its command changes komando's own setup on this Mac and needs no safety flag. A command that runs on a server, such as restarting a service, always shows under **How to Fix**, for you to run yourself.

After a fix, a banner says "Done. web-1 is fixed; the finding clears on the next check."

**Cancel** on any question changes nothing. On a protected target the question also says komando will run it with `--yes`.

## Every finding

Click **View all** in Needs attention, or choose **Go** › **All Findings**. The Findings tab lists every finding, then **Passed** with the checks that are fine. **Refresh** runs the checks now.

## Security updates

A card for servers with security updates waiting is coming to Home. {coming:home-updates} Today, open a server's [Updates](guide:updates) tab.

## After komando updates to 0.15.0

komando 0.15.0 checks forwards, VPN connections and server logins more strictly. The ones an older komando started count as ended after the update.

Once, after the update, Home shows a note at the top: "komando was updated. Forwards, VPN connections and server logins started before the update have ended. Start them again where you need them." Close it with ✕. On iPhone and iPad the note names the komando computer.

### Before you update

End them yourself first, so nothing is left running in the background:

```bash
komando vpn down --all
```

```bash
komando tunnel stop --all
```

```bash
komando logout SERVER
```

Run the last line once for each server you logged in to with `komando login`. Then update:

```bash
komando update
```

After the update, start your forwards and VPN connections again where you need them.

### If you already updated

The old connections may still run in the background. A new VPN connection to the same network can then fail. Restart your Mac, or quit the old `komando` and `openconnect` processes in Activity Monitor, then connect again.

This happens only once, for the update to 0.15.0. Later updates keep running connections.

## On the command line

`komando doctor` runs the same checks.
