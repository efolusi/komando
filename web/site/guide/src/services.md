A service is a program a server keeps running in the background, such as a web server (`nginx`) or a database. The **Services** tab lists them, says which are running, and lets you restart one.

## See the services

1. Open the server (⌘K and its name, or its row on **Hosts**).
2. Click the **Services** tab.

Each service has a dot and a word for its state. Chips filter the list: **All**, **Running**, **Stopped** and **Failed** (with a count when some failed). **Filter services** finds one by its name or description.

Click a service to see its status on the right: its state, how long it has been running, its main process, memory, restarts, and its last log lines. Reading changes nothing on the server.

{shot:services/services|The Services tab on web-1, with nginx selected and its status on the right.}

## Restart, stop or start a service

1. Tick ☐ **Allow changes**. Until you do, the buttons are dimmed with "Tick Allow changes first", and the tab says "Allow changes is off: the services stay as they are."
2. Pick the service and click **Restart**, **Stop** or **Start**.
3. Komando shows the exact command and asks first. Confirm to run it.

The ⋯ beside the buttons holds **Reload** (the service reads its settings again without stopping), **Start at Boot** or **Don't Start at Boot**, and **Copy Name**.

On a protected server, komando asks "This target is protected" before anything runs.

> Untick ☐ Allow changes when you are done. It starts off again each time you open the tab.

## If something goes wrong

- The server does not answer: a red banner with komando's message, and **Read Again**.
- A change fails: Komando shows the service's state and the lines it wrote to its log, so you can see why.

## On the command line

`komando svc` lists, checks, starts, stops and restarts services, and `komando svc logs` reads one service's log.
