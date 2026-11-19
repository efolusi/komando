Anything that is not a server is a connection: a database, a cache, a storage bucket, a cluster, a container registry or a message queue. A VPN is added the same way; see [VPNs](guide:vpn).

## Add a connection

1. Click **Add** (⌘N). On the Connections page the button is in the header. On an empty Home, click **Add something else**.
2. "What do you want to add?" shows eight cards: **Server**, **Database**, **Cache**, **Storage**, **Cluster**, **Registry**, **Queue** and **VPN**. Click one other than Server.
3. The form opens with that family chosen, such as "Add PostgreSQL". The **Kind** menu lists that family's kinds first, so a wrong pick is one menu away.
4. **Connection name**: a short name with no spaces, such as `staging-db`.
5. Under **Connection String**, paste the address, such as `postgres://app@db.internal:5432/app`, without the password. Or switch to **Individual Fields** and fill in host, port, user and database one by one.
6. **Password**: it has its own field and is stored encrypted as `secret:staging-db-pass`. It never overwrites a secret you already have: if that name is taken, Komando picks the next free one (`secret:staging-db-pass-2`). A kind with no password, such as SQLite or Memcached, shows none. S3 and SQS ask for a **Secret access key**.
7. Optional: **Groups**, **Reach through a server or VPN** (for a database you can only reach through a server), and **Protected** (for production).
8. Click **Save Connection** (⌘↩).

Komando says "staging-db is in the inventory.", then "Testing the connection…", then "Connected". Click **Open staging-db** to open it as a tab, or **Close**.

**Save Connection** stays dimmed until the name has no spaces and the address has `://`.

{shot:add-a-connection/new-connection|The New Connection form for PostgreSQL: Kind, Connection name, Connection String and Password.}

### Kinds with a form of their own

Some kinds have no ready-made form. Komando then builds one from what komando says that kind needs: the required fields first, then **More options**, folded. A kind whose login opens your browser says so before you save.

### If the test fails

The connection is saved anyway, and a red banner shows komando's message and a hint.

- A wrong password: open **Keychain**, right-click `secret:staging-db-pass`, choose **Replace Value…** and save the right one. Changing it inside **Edit…** is coming. {coming:edit-login}
- A wrong host, port, user or database: right-click the connection on **Connections**, choose **Edit…**, and fix it there.

Then open the connection and click **Test** (⇧⌘T).

## Import connections you already have

Click **Add** (⌘N) and, under "Or import what you already have", pick a source: **.pgpass…** (PostgreSQL databases and their passwords), **my.cnf…** (MySQL and MariaDB), **.env…** (database, cache and storage addresses from a .env file; click **Choose a .env File…** first), **kubeconfig…** (one connection per cluster context), **Docker…** (registries you are logged in to), **DBeaver…**, **AWS…** (an S3 connection for each bucket), **rclone…** or **FileZilla…**.

komando lists what it would add first and adds nothing until you click **Import**. Databases from DBeaver arrive without passwords: add them on [Keychain](guide:keychain#a-missing-password).

## Look at storage, a cluster, a registry or a queue

On **Connections**, click the chip for the family (Storage, Clusters, Registries or Queues), then the row. It opens as a tab with its kind and address in the header and **Quick checks** that read and change nothing. Click one and its answer appears in place.

- **Storage**: **Files** lists what is in the bucket.
- **Cluster** (Kubernetes or Docker Swarm): **Status**, **Pods**, **Deployments** and **Events**. Click a pod or deployment name to open it in its own tab with its status, conditions, labels and recent events. A pod's **Logs** tab shows its log lines.
- **Registry**: **Repositories**.
- **Queue** (Kafka, RabbitMQ, NATS JetStream, Amazon SQS, Google Pub/Sub): list the topics or queues, pick one, and click **Peek** to read the newest messages without removing them. On RabbitMQ, SQS and Pub/Sub a look can count as a delivery; the sentence beside Peek says how.

Uploading to a bucket, restarting a deployment or sending a message has no button yet. {coming:connection-changes} Use ⌘K, then **Run a Command…**, for example `storage list assets`.

Databases and caches have their own tabs: see [Databases](guide:databases) and [Caches](guide:caches).

## On the command line

`komando conn add NAME URL` adds a connection, and `komando test NAME` checks it.
