komando keeps the passwords and keys it needs in its own keychain, encrypted. You give it a value once, and you never have to see it again. The **Keychain** page, under **More** in the sidebar, lists them.

## What is on the page

**Secrets** are passwords and tokens, one line each, named like `secret:prod-db-pass`, with what uses them. **SSH keys** are the keys komando logs in to servers with.

Values are never shown on the page. With the [Touch ID lock](guide:touch-id-and-safety#the-touch-id-lock) on, the page asks for Touch ID before it opens.

{shot:keychain/keychain|The Keychain page: Secrets with what uses each one, and SSH keys.}

## A missing password

When komando cannot connect to a target because its password is missing, every place that says so has **Add Password**: Home, the Findings tab, the target's row ("Password missing") and the top of the Keychain.

1. Click **Add Password**. The sheet opens with the name filled in, such as `secret:prod-db-pass`.
2. Type the password under **Value**.
3. Click **Save Secret**. A banner says the secret is in the keychain. The finding on Home clears on the next check.

## Add or replace a secret

- **New Secret** in the header adds one. Type a **Name** and the **Value**, then **Save Secret**.
- Right-click a secret and choose **Replace Value…** to change it, for example after you changed a database's password.
- Komando never replaces a value without asking. When the name already has a value, **Save Secret** asks "Replace secret:prod-db-pass?" and says who logs in with it, such as "prod-db logs in with the new value from then on." The old value cannot be brought back. **Replace Value** saves it; **Cancel** stores nothing.
- Before it stores anything, **Save Secret** reads komando's own list of secrets again, not the list on the screen. If komando cannot list its secrets, nothing is stored.
- When a protected target uses the secret, komando asks "This target is protected" as well.
- **Copy Reference** copies `secret:NAME`, to paste where a form asks for a password reference.

## More for a secret

A secret's ⋯ also holds:

- **Check Value…**: type a value to learn whether it matches the saved one, without showing either.
- **Show Value**: komando asks first in its own window; the value hides again after a few seconds.
- **Rename…** and **Copy to New Name…**.
- **Remove…**: type the name to confirm. komando refuses while a target still uses the secret, and the sheet says which one.

A server's old password stays here after you give it a new one (the new one gets its own name, such as `secret:web-2-pass-2`). Remove the old one when nothing uses it.

If your keychain opens with a passphrase, **Change Passphrase…** beside the Secrets title changes it. A Terminal tab opens where komando asks for the new passphrase twice; Komando never sees it.

## Keys

- **New Key…** makes a new key or imports a key file. See [Make or import a key](guide:log-in#make-or-import-a-key).
- Right-click a key for **Copy Public Key** (the line to add to `~/.ssh/authorized_keys` on a server) and **Copy Fingerprint** (to compare with what a server shows).
- **Put on a Host…** adds the key to a server, so it logs in with it from now on.
- **Revoke from a Host…** takes it off a server. komando counts the lines that hold it first. If that is the key komando itself logs in with, you would lock yourself out, so the sheet says so and asks you to type the key's name.
- **Rename…** and **Remove…**. Remove refuses while a server still uses the key.

## On the command line

`komando secret set prod-db-pass` saves a secret, and `komando key` makes, lists, deploys and revokes keys.
