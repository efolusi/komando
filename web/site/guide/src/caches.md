A cache is a fast store of keys and values, such as Redis or Valkey. Komando lets you find a key, read it, and change it only on purpose.

## Find a key

1. Open **Connections**, click the **Caches** chip, then the cache, such as `sessions`. It opens on its **Overview**, with the **Info** quick check.
2. Click the **Keys** tab.
3. Type a pattern, such as `session:*` (`*` matches anything), and press Return.

The keys appear with their type and their TTL, the time to live before the cache forgets the key ("none" when it never expires). The status bar says how many keys the cache holds and how many were scanned. **Scan More** reads further.

{shot:caches/keys|The Keys tab on sessions: keys matching session:*, and one hash key's fields.}

## Read a key

Click a key. A hash shows its fields as a table; a JSON value shows in color below.

- Right-click a key, or use its ⋯, for **Copy Key Name** and **Copy Value**. The status bar says "Copied …" for a moment. For a very big value komando reads only the first part, and the status bar says so.
- The key list's ⋯ holds **Refresh**, **Copy Pattern** and **Show One Type**.
- Click a column's header in a hash's table to sort by it, and drag a column's edge to resize it. See [Sort and size the results](guide:databases#sort-and-size-the-results).
- Drag the line between the keys and the value to give one more room. Komando remembers it.

## Change a key on purpose

☐ **Allow changes** is off: "Allow changes is off: the cache stays as it is." The change buttons are dimmed, with "Tick Allow changes first".

1. Tick ☐ **Allow changes**.
2. Then:
   - **Delete Key…** (also in a key's right-click menu) asks first, "Delete session:7f3a9c21?", with **Delete Key**. A deleted key does not come back.
   - **Change Expiry…** asks for a time, like `30m`, `24h` or `7d`; empty means it never expires.
   - **Set Value…** replaces a string key's value.
   - **Add Field…** adds a field to a hash.
   - **New String Key…** makes a new key.
3. Each change shows komando's exact command before it runs. A banner then confirms it, such as "Deleted session:7f3a9c21."

On a protected cache, the one question before the change is all komando asks.

## On the command line

`komando cache keys sessions 'session:*'` and `komando cache get sessions KEY` do the same.
