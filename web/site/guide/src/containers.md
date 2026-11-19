A server that runs Docker has a **Containers** tab. It lists the containers, shows each one's state and logs, and lets you restart, stop or start one. A server without Docker has no Containers tab.

## See the containers

1. Open the server and click the **Containers** tab.
2. Click a container. On the right: its state, ports, CPU and memory, and its last 200 log lines, newest at the bottom.

Chips filter the list by state. The container's ⋯ holds **Copy Name** and **Copy ID**.

{shot:containers/containers|The Containers tab on web-1, with shop-api selected and its log lines.}

## Restart, stop or start a container

1. Tick ☐ **Allow changes**. Until you do, the buttons are dimmed and the tab says "Allow changes is off: the containers stay as they are."
2. Pick the container and click **Restart**, **Stop** or **Start**.
3. Restart and Stop ask first. A banner then says, for example, "Restarted shop-api on web-1."

## Images and free space

Click **Images** to see the images stored on the server, their size, and which container uses each one.

To free up space, click the ⋯ and choose **Free Up Space…**. Komando first shows what would go (stopped containers, images without a name, build cache) and how much it frees, before anything is removed. You can also tick "Also remove images no container uses". Volumes and the data in them always stay.

## Docker Compose

The same ⋯ holds **Docker Compose…**. Type the project folder on the server, the one that holds `compose.yaml`, pick what to do, and click **Run**.

## If something goes wrong

- "Docker would not let deploy in": the login user is not allowed to use Docker. Click **Read with sudo** to read through `sudo`, or add the user to the server's `docker` group.
- komando failed: a red banner with its message and **Try Again**.

## On the command line

`komando docker` checks containers, reads their logs, runs compose and cleans up.
