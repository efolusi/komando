Komando lets you read a database with no chance of changing it by accident, and change data only when you mean to. First add the database: see [Add a database, cache or anything else](guide:add-a-connection).

## Open a database

1. Open **Connections** in the sidebar, click the **Databases** chip, then the database, such as `prod-db`. It opens as a tab on its **Overview**.
2. Overview has quick checks that read and change nothing: **Info**, **Sizes**, **Activity** and **Locks**. **About this connection** has **Test** (⇧⌘T).
3. Click the **Query** tab.

{shot:databases/query|The Query tab on prod-db: tables at the side, the query editor, and the results.}

## Run a query

The Query tab has the tables at the side (**Filter tables** finds one), the query editor, and the results below.

At the side, tables are grouped under their schema. The first schema is open; click a schema, or press → and ←, to open or close it. **Filter tables** keeps only the schemas with a match. Komando remembers which schemas are open and the table you chose, for each database. Click a table to see its columns; a view shows none.

1. Write a query, such as `select * from orders limit 20`.
2. Click **Run** (⌘↩). While it runs, **Run** becomes **Stop**.
3. The rows appear, and the status bar says how many rows and columns, and how long it took.

### Sort and size the results

- Click a column's header to sort the rows by it. Numbers sort by value, and empty (NULL) values go last. Click again to turn the order around. The rows you selected stay selected.
- Drag a column's edge to make it wider or narrower. Double-click the edge to fit the column again. Komando remembers the widths for each kind of result.
- Drag the lines between the tables, the editor and the results to give one more room. Komando remembers them too.
- The round arrow under the tables list reads the tables again.

### Changes are off

☐ **Allow changes** is off, so the database refuses any change: "Allow changes is off: the database refuses any change." A query that only reads always works.

## More in the ⋯

- **Dry Run**: runs a change, shows what it would do, then undoes it. The status bar says "Rolled back" and nothing is kept.
- **History**: the queries you ran here. Picking one puts it back in the editor without running it. **Clear History** forgets them.
- **Export Results as CSV…**: saves the rows as a file. A value that a spreadsheet would run as a formula (one that starts with `=`, `+`, `-` or `@`) gets a `'` in front, so data from a server can never run in Excel or Numbers. Plain numbers such as `-5` stay as they are.
- **Open SQL Shell**: a SQL prompt in a tab of its own.
- **Open in Terminal**: the same SQL prompt in the Mac's Terminal app.

## Change data on purpose

1. Tick ☐ **Allow changes**. The line under it says "Allow changes is on: the next query may change data."
2. Write the change, such as `update orders set status = 'paid' where id = 48213`, and click **Run**.
3. The results say how many rows changed, and the status bar says **Committed**.
4. Untick ☐ **Allow changes** when you are done.

If you run a change with the box off, komando stops it and asks "This changes data", with **Allow Writes**. Allow Writes runs that one query again with `--write`. The box stays off, so the next change asks again. On a protected database, a change asks "This target is protected" with the exact command and **Run Anyway**. **Cancel** on either question runs nothing.

> Try a change with Dry Run first. You see what it would do, and nothing is kept.

## MongoDB

A MongoDB database speaks documents, not SQL. Its Query tab lists the collections and takes a JSON command; it has no SQL shell.

## If something goes wrong

- An error shows in a red banner above the results, in komando's words with a hint.
- The password is missing: the database's row says "Password missing", with **Add Password**. See [Keychain](guide:keychain#a-missing-password).
- A **Backups** tab, with Back Up Now and Restore, is coming. {coming:db-backups}

## On the command line

`komando db query prod-db 'select …'` runs the same query, read-only unless you add `--write`.
