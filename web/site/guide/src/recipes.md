A recipe is a saved command with blanks, such as "restart a service". Run it on one server or a whole group, and see each server's answer. Komando comes with ready-made recipes, and you can save your own.

## Run a recipe

1. Open **Recipes** in the sidebar. Chips filter the list: **All**, **Saved** and **Ready-made**. Drag the line beside the list to make it wider or narrower; a double-click puts it back.
2. Click a recipe. It shows its name, a pill that says whether it **Changes the server** or is **Read-only** (and "sudo" when it uses sudo), and its command with blanks, such as `{{service}}`.
3. Fill in each blank.
4. Under **Run on**, pick a server or a group, such as `@production`.
5. Click **Run on @production** (⌘↩).

The results open as a tab: how many servers succeeded and failed, then each server with **Done** or **Failed** and its output. **Run Again** runs it again.

Other ways in:

- Right-click a recipe and choose **Run On**, then a server.
- On **Hosts**, a server's ⋯ has **Run Recipe** › **Choose a Recipe…**, and a group's ⋯ has **Run Recipe on @production…**. Recipes opens with that server or group already picked under **Run on**.
- In a terminal, the ⋯ › **Run a Recipe** runs one on that server.

{shot:recipes/run-results|The results of restart-nginx on @production: three servers Done, one Failed with its error.}

## Protected servers

If a server in the group is protected and the recipe changes the server, komando asks first, "This target is protected", with the exact command and **Run Anyway**. It asks before it starts, so the recipe runs on every server or on none. **Cancel** stops the whole run. A recipe marked **Only reads** does not ask.

> One yes covers the whole run: every command in the recipe, with its blanks filled in, on every server in the group. The question may not list each of them. So read the whole recipe before you click **Run Anyway**: open it with **Edit…** (or **Duplicate…** for a ready-made one), or run `komando recipe show restart-nginx` in Terminal. `komando recipe run restart-nginx @production --dry-run` shows what would run, changing nothing.

## Save your own

1. Click **New Recipe** in the header.
2. Fill in **Name**, **What it does**, and **Command**. Write `{{name}}` for a blank and `{{name=default}}` for a blank with a default.
3. **Only reads** starts off, so a new recipe counts as changing the server until you turn it on. Turn on **Runs with sudo** if the command needs it; it uses the server's sudo password.
4. Click **Save Recipe**.

## Change or remove a recipe

The ⋯ beside a recipe's name, and a right-click on its row, hold **Copy Command**, **Duplicate…** for any recipe (ready-made ones are copied, never changed), and for your own **Edit…** and **Remove Recipe…**. Removing asks first; nothing on your servers changes.

## On the command line

`komando recipe run restart-nginx @production` does the same.
