The **Logs** tab reads what a server writes down as it runs: its system journal, one service's log, or a log file. You can read the last lines, or follow new ones as they arrive.

## Read the logs

1. Open the server and click the **Logs** tab.
2. Under **Read from**, pick:
   - **System journal**: everything systemd records on the server. This is the default.
   - **Service…**: one service's log. Type its name, such as `nginx`, and press Return.
   - **Log file…**: a file. Type its full path, such as `/var/log/nginx/error.log`, and press Return.
3. Under **How much**, pick **Last 100 lines**, **Last 200 lines** (the default), **Last 1,000 lines**, or a time: **Last 15 minutes**, **Last hour** or **Last 24 hours**. A log file has no times, so pick a number of lines for it.

Each line shows the time, the program that wrote it, and its text. Warnings show in yellow and errors in red. The newest line is at the bottom.

{shot:logs/logs|The Logs tab on web-1: the system journal, the last 200 lines.}

## Follow new lines

Turn on **Follow**. Komando reads what you asked for, then keeps adding new lines at the bottom as the server writes them. The status bar says "Following" and how many lines it holds. The app keeps the last 5,000 lines.

Turning **Follow** off, leaving the tab or picking another source stops it. **Reload** (⌘R) reads again.

## "Cut short"

When the server had more lines than you asked for, the status bar says so, for example "Cut short: only the last 200 lines. Pick more lines to see further back." Pick a bigger number under **How much** to read further.

## If something goes wrong

- Reading needs root: some logs can only be read by the server's administrator. The banner then has **Read With sudo**, which reads that source again through `sudo` on the server.
- Only your own entries show: a yellow banner says so, with the same **Read With sudo**.
- komando failed: a red banner with its message and hint, and **Try Again**.

## On the command line

`komando logs web-1` reads the same, with `--unit nginx` for a service, `--file PATH` for a file, and `-f` to follow.
