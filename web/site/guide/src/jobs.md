A job is a long command, such as a backup, that keeps running on its server after you disconnect or close Komando. The **Jobs** page lists them and follows their logs.

## See your jobs

Open **Jobs** under **More** in the sidebar, or click **View** beside "3 background jobs" on Home.

Each job says what it runs and where, and its state: **Running**, **Done**, **Failed** or **Unknown**. Chips filter them. **Refresh** asks each server again whether its jobs are still running.

{shot:jobs/jobs|Jobs: a running backup on backup-1, with its log beside the list.}

## Start a job

1. On **Jobs**, click **Start a Job…**.
2. Pick the **Server** and type the **Command**, such as `./backup.sh --full`. It runs through the server's login shell, like a line typed there.
3. Check the exact line it will run, under "komando runs:". Hidden characters are spelled out there, so the line reads as what will run. Then click **Start Job**.

The new job is selected, with its log beside it. On a protected server it asks first. The [agent](guide:agent) can also start a job for you.

## Follow, stop or remove a job

A job's ⋯, and a right-click on its row, hold:

- **Show Log**: its log, beside the list, following new lines. Drag the line between the list and the log to make the log wider or narrower; a double-click puts it back.
- **Run Again…**: opens Start a Job with the same server and command filled in. Nothing runs until you click **Start Job**.
- **Stop Job**, while it runs. It asks first: "Stop this job?"
- **Remove Job…**, once it ended. It asks first: "Remove this job?" It leaves this list; its log on the server stays.
- **Copy Command**: one line that runs the same thing, even when the command had a line break.

## If something goes wrong

- **Unknown**: komando could not ask the server, because it did not answer or left the inventory. Click **Refresh** to try again.
- With no jobs, the page says "No background jobs".

## On the command line

`komando job start backup-1 -- ./backup.sh --full` starts the same job, and `komando job` follows, waits for and stops jobs.
