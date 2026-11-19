Copy files between this Mac and a server, and see each copy finish. Today Files opens for one server at a time. A bigger Files place, with copying between two servers, is coming. {coming:files-place}

## Open Files

- On **Hosts**, click a server's ⋯ (or right-click its row) and choose **Files**.
- In a terminal, click the toolbar's ⋯ and choose **Files**.
- For a storage bucket (SFTP, S3 and the like), choose **Browse Files** in its row's ⋯ on **Connections**.

A tab opens with this Mac on the left and the server on the right, each with its folder at the top. Double-click a folder, or select it and press Return, to open it. The arrow at the top of a side goes up one folder.

{shot:files/files|Files for web-1: this Mac on the left, the server on the right, and the Transfers list below.}

## Copy a file

1. Select a file on one side.
2. Click **Upload to web-1** (⌘↑) to send it from this Mac to the server, or **Download to This Mac** (⌘↓) to bring it from the server. You can also drag it across.
3. The copy shows under **Transfers**: which way, the file, a progress bar, and how much is left. A finished copy says **Done**.

**Clear Finished** empties the list.

Whole folders cannot be copied from Files yet; the app says "Folders: use komando upload -r". {coming:files-place}

## Edit a file on the server

Select a text file on the server's side, click the toolbar's ⋯ and choose **Edit…**. Komando opens it in place. Text files under 1 MiB can be edited.

- Click **Review Changes** to see what you changed, then **Save with Backup**. The old version is kept beside the file, as `NAME.bak` with the time added.
- For a file that root owns, tick **Write with sudo (for a file root owns)**.
- If the file holds a secret, Komando shows `[hidden]` there and does not save, so the mark never overwrites the real value.

## More

The same ⋯ holds **New Folder…** (on the server), **Show web-1 Only** and **Reload**.

## If something goes wrong

- A protected server: an upload that adds or replaces a file asks "This target is protected" first. **Cancel** leaves the row "Not uploaded". **New Folder…** asks the same way, with komando's exact command and **Run Anyway**.
- A download onto a file that is already on this Mac asks "Replace app.log on this Mac?" with **Replace**.
- A failed copy says why, in red, in its own row.

## Copy between two servers

Copying from one server to another, through this Mac, is coming with the new Files place. {coming:server-to-server} Today, download the file to this Mac, then open the other server's Files and upload it.

## On the command line

`komando cp`, `komando upload` (with `-r` for a folder), `komando download` and `komando sync` do the same, and `komando fs` lists, reads and edits files on a server.
