# Queue

Lihat dan kerjakan message queue dengan aman: Apache Kafka, dan yang berbicara dengan protokolnya (Redpanda, Amazon MSK, Confluent Cloud, Aiven), RabbitMQ, NATS dengan JetStream, Amazon SQS, dan Google Cloud Pub/Sub.

Perintah yang sama berfungsi untuk kelimanya. Kafka menyimpan pesan di **topic**; RabbitMQ dan SQS menyimpannya di **queue**; NATS menyimpannya di **stream**; Pub/Sub menyimpannya di **subscription** milik sebuah topic. Bila halaman ini menyebut "topic", baca "queue" untuk RabbitMQ dan SQS dan "stream" untuk NATS. Apa yang berbeda untuk masing-masing ada di [RabbitMQ](#rabbitmq), [NATS JetStream](#nats-jetstream), [Amazon SQS](#amazon-sqs), dan [Google Cloud Pub/Sub](#google-cloud-pubsub) di bawah.

Di Kafka, pesan disimpan berurutan di **partition** milik sebuah topic, dan **consumer group** adalah aplikasi yang membacanya dan mengingat sejauh mana ia membaca (committed offset-nya). **Lag** adalah berapa banyak pesan yang masih harus dibaca sebuah group.

## Menambah cluster Kafka

```bash
komando queue add prod-kafka 'kafka://app@b1.example.com:9093,b2.example.com:9093?tls=true&sasl=scram-sha-512' --ask-password
komando test prod-kafka                       # login dan menampilkan versi Kafka
```

Jika diketik tanpa argumen, `komando queue add` menanyakan setiap bagian selangkah demi selangkah.

URL mencantumkan satu broker atau lebih (`HOST:PORT`, dipisah koma; port default-nya 9092). Satu sudah cukup: komando menanyakan broker lainnya kepadanya. User untuk login SASL dan kata sandinya masuk ke vault, tidak pernah ke URL:

```bash
komando secret set kafka-pass
komando queue add prod-kafka 'kafka://app@b1.example.com:9093?tls=true&sasl=scram-sha-512' --password-ref secret:kafka-pass
komando queue add audit-kafka 'kafka://app@kafka.internal:9093?tls=true&ca=secret:kafka-ca&sasl=plain' --ask-password
komando queue add staging-kafka kafka://broker1.internal:9092 --via web1          # tanpa TLS, lewat server SSH
```

| Opsi | Fungsinya |
|---|---|
| `tls=true` | TLS; sertifikat broker diperiksa terhadap CA komputer Anda |
| `ca=secret:NAME` | juga percayai CA Anda sendiri (CA perusahaan, milik cloud); simpan dengan `komando secret set NAME < ca.pem` |
| `tls=skip-verify` | TLS tanpa memeriksa sertifikat (`komando doctor` memperingatkan; pilih `ca=`) |
| `sasl=plain`, `sasl=scram-sha-256`, `sasl=scram-sha-512` | cara login; butuh user di URL |
| `insecure=1` | terima koneksi tanpa TLS yang melewati jaringan |

- `kafka://` tanpa `tls=true`, langsung lewat jaringan (tanpa `--via`, bukan komputer ini), akan mengirim login dan pesan tanpa enkripsi, jadi `queue add` menolaknya dengan `INSECURE_PROTOCOL`: tambahkan `tls=true`, atau `--via`, atau `?insecure=1` untuk menerimanya (untuk agen AI itu butuh jawaban ya dari seseorang).
- User tanpa `sasl=`, atau `sasl=` tanpa user, ditolak: komando tidak menebak bagaimana broker ingin Anda login.

Di terminal, perintah yang tidak menyebut conn atau topic akan menanyakannya, dengan daftar queue Anda. Jika diketik tanpa argumen, `komando queue peek` menanyakan queue mana, lalu topic mana. Agen AI atau script mendapat `USAGE` (exit 2) dengan contoh di hint.

### Lewat bastion atau VPN

Klien Kafka lebih dulu menanyakan broker lain milik cluster ke sebuah broker, lalu tersambung ke alamat yang diiklankan broker. Dengan `--via`, komando menjangkau setiap broker itu lewat bastion atau VPN, sehingga nama yang hanya berfungsi di dalam jaringan tetap berfungsi. Bila `komando test` berhenti dengan `QUEUE_CONNECT`, periksa bahwa alamat yang diiklankan bisa dijangkau dari server `--via` (`komando queue info` mencantumkannya).

## Melihat topic dan group

```bash
komando queue list prod-kafka                 # setiap topic, dengan partition, replika, pesan
```

```text
TOPIC         PARTITIONS  REPLICAS  MESSAGES
orders        6           3         1824410
orders-retry  3           3         212
```

Perintah ini hanya membaca:

```bash
komando queue info prod-kafka                 # broker (id, alamat, rack), controller, versi
komando queue list prod-kafka 'orders-*'      # topic yang cocok dengan sebuah pola
komando queue list prod-kafka --internal      # juga __consumer_offsets dan sejenisnya
komando queue list prod-kafka -n 50           # hanya 50 pertama menurut nama
komando queue describe prod-kafka orders      # partition, offset, pengaturan, group yang membacanya
komando queue groups prod-kafka               # consumer group: status, anggota, topic, lag
komando queue lag prod-kafka billing          # satu group, per topic dan partition
```

```text
group: billing (Stable, 2 members), lag 37

TOPIC   PARTITION  COMMITTED  END     LAG  CLIENT
orders  0          304112     304140  28   billing-1
orders  1          303980     303989  9    billing-2
```

- `queue list` menampilkan paling banyak 1000 topic (atau queue, atau stream), yang pertama menurut nama; `-n` mengubahnya. Daftar yang lebih panjang menyatakannya (`"truncated": true`, dan satu baris di teks) sehingga Anda bisa mempersempitnya dengan pola.
- Jumlah pesan adalah end offset dikurangi start offset setiap partition. Pada topic yang di-compact (`cleanup.policy=compact`) mungkin tersisa lebih sedikit pesan.
- `describe` hanya menampilkan pengaturan yang berbeda dari default broker (misalnya `retention.ms`).

## Membaca pesan

```bash
komando queue peek prod-kafka orders          # 10 pesan terbaru dari semua partition
komando queue peek prod-kafka orders -n 50 --partition 2
komando queue peek prod-kafka orders --oldest -n 5   # yang pertama yang masih disimpan
```

```text
# partition 2, offset 304139, 2026-11-13T09:14:02Z, key 42
{"id": 42, "status": "paid"}
```

`peek` membaca langsung dari partition. Perintah ini tidak pernah bergabung ke consumer group dan tidak pernah meng-commit offset, jadi posisi aplikasi mana pun tidak bergeser dan tidak ada pesan yang dihapus. Perintah berhenti setelah mendapat pesan yang ada saat dimulai; bila tidak ada yang datang selama `--idle` (5 detik), perintah berhenti dan menyatakan mungkin ada yang kurang.

- Nilai yang berupa teks UTF-8 ditampilkan apa adanya; yang lain datang sebagai base64 (`"encoding": "base64"`). Nilai yang lebih panjang dari `max_output` dipotong (`value_truncated`, dengan `size` sebenarnya).
- Untuk agen AI, secret di dalam pesan tampil sebagai `[hidden]`, dan data pribadi di conn yang dilindungi sebagai `[hidden: email]` dan sejenisnya.

## Mengirim pesan

```bash
komando queue send prod-kafka orders --value '{"id": 42, "status": "paid"}' --key 42
komando queue send prod-kafka orders --from ./order.json --header source=support
komando queue send prod-kafka orders --value test --dry-run   # memeriksa topic, tidak mengirim apa pun
```

```text
sent 28 B to orders, partition 2, offset 304140
```

- Topic harus sudah ada (`TOPIC_NOT_FOUND`): komando tidak pernah membiarkan broker membuatnya secara spontan. Buat dengan `queue create`.
- `--key` memilih partition dengan cara lazim: key yang sama selalu menuju partition yang sama. `--partition N` memilih sendiri.
- Nilai datang dari `--value`, dari `--from FILE` (`-` untuk stdin), atau dari data yang dialirkan lewat stdin. Kafka menerima sekitar 1 MiB per pesan secara default.
- Conn yang dilindungi bertanya dulu kepada orang di terminal; agen AI atau script menambahkan `--yes` setelah seseorang setuju.
- Audit log mencatat topic dan ukurannya, tidak pernah pesannya.

## Membuat, menghapus, dan mengosongkan topic

```bash
komando queue create prod-kafka orders --partitions 6 --replicas 3 --dry-run
komando queue create prod-kafka orders --partitions 6 --replicas 3 --config retention.ms=604800000
komando queue purge prod-kafka orders-retry --dry-run   # berapa pesan yang akan hilang
komando queue purge prod-kafka orders-retry             # hapus setiap pesan, pertahankan topic
komando queue rm prod-kafka old-orders --dry-run
komando queue rm prod-kafka old-orders                  # hapus topic dan pesannya
```

```text
would delete 212 messages from orders-retry (3 partitions); the topic stays
```

- `create --dry-run` meminta broker memeriksa topic tanpa membuatnya, jadi pengaturan yang buruk atau replika yang lebih banyak daripada broker terlihat sekarang.
- Tanpa `--partitions` dan `--replicas`, default broker berlaku.
- `purge` dan `rm` tidak bisa dibatalkan (aturan `queue-purge` dan `queue-delete` di `komando policy list`). `--dry-run` keduanya mencantumkan apa yang akan hilang. Di terminal Anda komando bertanya dulu: komando menyatakan apa yang akan dihapus dan meminta nama topic atau queue (jumlahnya, bila beberapa sekaligus).

  ```
  $ komando queue purge prod-kafka orders-retry
  This deletes every message in orders-retry (it stays).
  Type the name orders-retry to continue: orders-retry
  ```

  Jawaban lain menghentikannya dan tidak mengubah apa pun. Agen AI atau script mendapat `POLICY_BLOCKED` (exit 6) dengan alasan yang sama, dan menambahkan `--allow-dangerous` hanya setelah seseorang setuju. Lihat [Keamanan](safety.md#what-needs-a-yes).

## RabbitMQ

### Menambah server RabbitMQ

```bash
komando secret set rabbit-pass
komando queue add prod-rabbit 'amqps://app@rabbit.example.com:5671/%2F?management=15671' --password-ref secret:rabbit-pass
komando queue add staging-rabbit 'amqp://app@rabbit.internal:5672/prod?management=15672' --via web1 --password-ref secret:rabbit-pass
komando queue info prod-rabbit                       # versi, cluster, node, total
komando queue list prod-rabbit                         # queue: pesan, ready, unacked, consumer
komando queue peek prod-rabbit emails                # 10 pesan pertama; semuanya dikembalikan
```

- `amqps://` adalah AMQP dengan TLS (port 5671 secara default); `amqp://` tanpa TLS (port 5672). Seperti `redis://`, `amqp://` langsung lewat jaringan (tanpa `--via`, bukan komputer ini) ditolak dengan `INSECURE_PROTOCOL` kecuali Anda menambahkan `?insecure=1`.
- Path adalah **virtual host** (vhost). Vhost default adalah `/`, ditulis `%2F` atau dihilangkan (`amqp://app@rabbit.internal/`).
- Kata sandi user masuk ke vault (`--password-ref`), tidak pernah ke URL. URL tanpa user login sebagai `guest` (kata sandi `guest`, atau yang diberikan `--password-ref`). RabbitMQ hanya mengizinkan `guest` masuk dari server itu sendiri, jadi itu berfungsi `--via` SSH server itu.

| Opsi | Fungsinya |
|---|---|
| `management=PORT` | juga pakai HTTP API management di port ini pada host yang sama (HTTPS untuk `amqps://`), untuk `queue list`, node dan total di `info`, dan detail di `describe` |
| `ca=secret:NAME` | `amqps://`: juga percayai CA Anda sendiri (`komando secret set NAME < ca.pem`) |
| `tls=skip-verify` | `amqps://` tanpa memeriksa sertifikat (`komando doctor` memperingatkan; pilih `ca=`) |
| `insecure=1` | terima `amqp://` lewat jaringan tanpa TLS |

API management adalah plugin `rabbitmq_management`. API ini menerima user dengan tag `management`, `monitoring`, atau `administrator`; komando hanya membaca darinya. Tanpa `?management=`, komando memakai AMQP saja: `info` menampilkan versi server dan `describe` menampilkan berapa pesan yang menunggu dan berapa consumer yang dimiliki sebuah queue, tetapi `queue list` tidak bisa mencantumkan queue (`NOT_SUPPORTED`).

### Apa yang dilakukan setiap perintah di RabbitMQ

```bash
komando queue describe prod-rabbit emails            # tipe, status, pesan, argumen, consumer
komando queue peek prod-rabbit emails -n 5           # 5 pesan pertama; tidak ada yang dihapus
komando queue send prod-rabbit emails --value '{"to": "a@example.com"}' --header source=support
komando queue create prod-rabbit emails --type quorum --config x-max-length=10000 --dry-run
komando queue purge prod-rabbit emails --dry-run     # berapa pesan yang menunggu
komando queue rm prod-rabbit emails
```

- **`peek` mengambil pesan dari depan queue dan mengembalikan setiap pesan.** Perintah ini membaca dengan `basic.get` dan tidak mengakui (acknowledge), lalu mengembalikan semuanya (`nack` dengan requeue), jadi tidak ada yang dihapus. Perlu diketahui:
  - RabbitMQ menandai pesan yang dikembalikan sebagai redelivered. Consumer yang memperlakukan pesan redelivered secara berbeda akan melihat flag itu.
  - Selama peek memegangnya, tidak ada consumer yang mendapatkannya, dan queue yang sibuk mungkin membagikannya dalam urutan yang sedikit berbeda sesudahnya.
  - Bila koneksi putus, RabbitMQ mengembalikan pesan itu sendiri.
  - **Quorum queue** menghitung setiap peek sebagai satu pengiriman (`x-delivery-count`). Setelah batas pengirimannya (20 secara default sejak RabbitMQ 4.0, atau `x-delivery-limit` milik queue sendiri atau policy) ia membuang pesan atau mengirimnya ke dead-letter queue. Jadi peek menampilkan hitungannya (`deliveries`) dan berhenti dengan `DELIVERY_LIMIT_NEAR` begitu sebuah pesan punya kurang dari 3 pengiriman tersisa: jangan peek queue itu lagi. Perintah tidak mengambil pesan setelah itu, jadi pesan di belakangnya tidak ikut dihitung mundur. Hanya API management yang menyebut tipe queue dan batasnya sendiri, jadi peek butuh `?management=` di URL conn: tanpanya (atau bila API management gagal) peek berhenti sebelum mengambil pesan (`NOT_SUPPORTED`, atau error dari API management).
  - Queue bertipe stream tidak bisa di-peek dengan cara ini (`NOT_SUPPORTED`).
  - peek selalu membaca dari depan (`"from": "front"`), yang sudah paling lama; `--partition` dan `--idle` untuk Kafka.
- `send` menaruh pesan langsung ke queue (lewat default exchange), sebagai pesan persisten, dan menunggu sampai server mengonfirmasinya. `--header KEY=VALUE` mengatur header-nya; tidak ada `--key` atau `--partition`.
- `create` membuat durable queue. `--type` memilih `classic`, `quorum`, atau `stream` (bila dihilangkan: default vhost). `--config KEY=VALUE` mengatur argumen queue, seperti `x-max-length=10000` atau `x-overflow=reject-publish`. RabbitMQ tidak bisa memeriksa queue tanpa membuatnya, jadi `create --dry-run` hanya memeriksa bahwa namanya bebas. Queue yang sudah ada adalah `QUEUE_EXISTS`.
- `purge` menghapus pesan yang menunggu (ready). Pesan yang dipegang consumer dan belum diakui tetap ada. `rm` menghapus queue dan pesannya, dan membatalkan consumer-nya; `--dry-run` menampilkan berapa banyak dari masing-masing. Keduanya tidak bisa dibatalkan, jadi bertanya dulu, seperti untuk [Kafka](#create-delete-and-empty-topics).
- `groups` dan `lag` menjawab `NOT_SUPPORTED`: RabbitMQ tidak punya consumer group. `describe` menampilkan consumer sebuah queue, pesan yang menunggu mereka (ready) dan yang belum diakui (unacked).

## NATS JetStream

### Menambah server NATS

```bash
komando secret set nats-pass
komando queue add prod-nats 'tls://app@nats1.example.com:4222,nats2.example.com:4222' --password-ref secret:nats-pass
komando queue add staging-nats nats://nats.internal:4222 --via web1 --password-ref secret:nats-pass
komando secret set ngs-creds < user.creds
komando queue add ngs-nats 'tls://connect.ngs.global?creds=secret:ngs-creds'
komando queue info prod-nats                     # versi, server, stream dan batas account
komando queue list prod-nats                       # stream: subject, pesan, ukuran, consumer
komando queue peek prod-nats ORDERS              # 10 pesan terbaru; tidak ada yang diambil
```

- `tls://` adalah NATS dengan TLS; `nats://` tanpa TLS. Port default-nya 4222. Seperti `redis://`, `nats://` langsung lewat jaringan (tanpa `--via`, bukan komputer ini) ditolak dengan `INSECURE_PROTOCOL` kecuali Anda menambahkan `?insecure=1`.
- Cantumkan beberapa server milik sebuah cluster dengan koma. komando mencobanya dalam urutan itu dan hanya berbicara dengan server di URL (dengan `--via`, semuanya dijangkau lewat bastion atau VPN). komando mencoba setiap server sekali dan tidak menyambung ulang atau mengikuti server yang diiklankan cluster.
- Cara komando login:
  - user di URL dan `--password-ref`: user dan kata sandi;
  - `--password-ref` tanpa user: kata sandi dikirim sebagai token;
  - `?creds=secret:NAME`: file `.creds` (dari `nsc`, NGS, atau Synadia Cloud) yang Anda simpan di vault dengan `komando secret set NAME < user.creds`;
  - tidak satu pun dari itu: tanpa login.
- `komando test prod-nats` login dan menampilkan versi server.

| Opsi | Fungsinya |
|---|---|
| `creds=secret:NAME` | login dengan file `.creds` yang disimpan di vault |
| `domain=NAME` | domain JetStream, untuk leaf node dengan JetStream sendiri |
| `ca=secret:NAME` | `tls://`: juga percayai CA Anda sendiri (`komando secret set NAME < ca.pem`) |
| `tls=skip-verify` | `tls://` tanpa memeriksa sertifikat (`komando doctor` memperingatkan; pilih `ca=`) |
| `insecure=1` | terima `nats://` lewat jaringan tanpa TLS |

### Stream, subject, dan consumer

NATS biasa melupakan pesan setelah terkirim. **JetStream** menyimpan pesan di **stream**: sebuah stream menyimpan setiap pesan yang dikirim ke **subject**-nya (misalnya `orders.>`, setiap subject yang diawali `orders.`), diberi nomor dengan **sequence**. **Consumer** adalah tempat sebuah aplikasi di dalam stream: apa yang sudah diberikan kepadanya dan apa yang sudah diakuinya.

```bash
komando queue describe prod-nats ORDERS          # pengaturan, batas, sequence, cluster, consumer
komando queue groups prod-nats                   # setiap consumer: pending, ack pending, waiting
komando queue lag prod-nats ORDERS/billing       # satu consumer (nama saja berfungsi bila hanya satu stream yang memilikinya)
komando queue peek prod-nats ORDERS -n 5         # 5 pesan terbaru
komando queue peek prod-nats ORDERS --oldest     # yang pertama yang masih disimpan
komando queue send prod-nats orders.new --value '{"id": 42}' --header source=support
komando queue create prod-nats ORDERS --config subjects='orders.>' --config max_age=7d --dry-run
komando queue purge prod-nats ORDERS --dry-run   # berapa pesan yang akan hilang
komando queue rm prod-nats ORDERS
```

- **`peek` membaca pesan menurut nomor sequence-nya.** Perintah ini tidak membuat consumer dan tidak mengakui apa pun, jadi tidak ada aplikasi yang menyadarinya dan tidak ada yang dihapus, juga dari stream work-queue (tempat pengakuan menghapus pesan). Secara default menampilkan `-n` pesan terbaru; `--oldest` menampilkan yang pertama. Pesan yang dihapus di antaranya dilewati. Di stream dengan lebih dari 100000 pesan yang dihapus, yang terbaru mungkin keluar tidak lengkap, dan peek menyatakannya; `--oldest` selalu berfungsi.
- `send` menerima sebuah subject, bukan nama stream: `orders.new`, bukan `ORDERS`. komando lebih dulu memeriksa stream mana yang menyimpan subject itu; bila tidak ada, perintah berhenti dengan `STREAM_NOT_FOUND` (NATS biasa akan membuang pesan tanpa sepatah kata). Lalu perintah menunggu pengakuan stream dan menyatakan sequence pesan. Header `Nats-Msg-Id` (`--header Nats-Msg-Id=order-42`) membiarkan stream membuang duplikat. Tidak ada `--key` atau `--partition`.
- `create` membuat stream di disk (`storage=file`) yang menyimpan pesan sampai ada batas (`retention=limits`). Subject-nya adalah nama stream kecuali Anda memberikan `--config subjects=a.>,b.*`. Pengaturan lain: `storage=memory`, `retention=interest|workqueue`, `discard=old|new`, `max_msgs`, `max_bytes`, `max_age` (`24h`, `7d`), `max_msg_size`, `max_msgs_per_subject`, `max_consumers`, `duplicate_window`, `description`. `--replicas 3` menyimpan 3 salinan di cluster. JetStream tidak bisa memeriksa stream tanpa membuatnya, jadi `create --dry-run` hanya memeriksa nama dan pengaturannya. Stream yang sudah ada adalah `STREAM_EXISTS`.
- `purge` menghapus setiap pesan sebuah stream; stream dan consumer-nya tetap ada. `rm` menghapus stream, pesannya, dan consumer-nya. Keduanya tidak bisa dibatalkan, jadi bertanya dulu, seperti untuk [Kafka](#create-delete-and-empty-topics).
- `groups` mencantumkan consumer. **Pending** adalah apa yang belum diberikan kepada consumer (ditampilkan sebagai lag-nya); **ack pending** adalah apa yang sudah diberikan dan belum diakuinya. `state` adalah `active` (push consumer dengan subscriber, atau pull consumer dengan permintaan yang menunggu), `idle`, atau `paused`.
- Bucket key-value (`KV_NAME`) dan object store (`OBJ_NAME`) juga stream, dan `queue list` mencantumkannya.
- Server atau account tanpa JetStream: `info` menyatakan `jetstream: false`, dan perintah lain menjawab `NOT_SUPPORTED`.

## Amazon SQS

### Menambah region SQS

Conn SQS adalah satu region AWS dari satu account. Anda memberikan nama queue ke setiap perintah, bukan di URL. komando login dengan login AWS Anda, dengan cara yang sama seperti untuk bucket S3 dan registry ECR, dan tidak butuh aws CLI:

```bash
komando queue add prod-sqs sqs://eu-west-1 --option aws_profile=prod   # profil di ~/.aws (SSO, role, key)
komando login aws --profile prod              # seseorang memperbarui login SSO saat habis
komando queue add staging-sqs sqs://eu-west-1          # tanpa profil: variabel AWS_*, default ~/.aws, atau role server
komando secret set sqs-secret                  # atau: key milik user IAM
komando queue add ops-sqs sqs://AKIAIOSFODNN7EXAMPLE@eu-west-1 --password-ref secret:sqs-secret
komando queue info prod-sqs                         # region, account, berapa queue
komando queue list prod-sqs                           # queue: menunggu, in flight, delayed, dead-letter queue
komando queue peek prod-sqs orders                  # sampai 10 pesan; tidak ada yang disembunyikan atau dihapus
```

- Cara komando login, dalam urutan ini: opsi `aws_profile` milik conn (dari `~/.aws/config` dan `~/.aws/credentials`, SSO termasuk); access key ID di URL dengan secret key dari `--password-ref`; atau, bila tidak ada keduanya, rantai AWS yang lazim (variabel `AWS_ACCESS_KEY_ID` dan `AWS_PROFILE`, profil default, role EC2 atau ECS).
- Login SSO yang kedaluwarsa berhenti dengan `AWS_LOGIN_REQUIRED`: seseorang menjalankan `komando login aws --profile NAME` sekali.
- `komando test prod-sqs` login dan mencantumkan satu queue.

| Opsi | Fungsinya |
|---|---|
| `endpoint=URL` | server SQS lain: VPC endpoint, atau emulator seperti LocalStack atau moto (`http://localhost:4566`; di localhost tanpa key atau profil, komando login dengan key `test`) |
| `account=ID` | account AWS 12 digit yang memiliki queue, untuk memakai queue yang dibagikan account lain kepada Anda |
| `insecure=1` | terima endpoint `http://` lewat jaringan (tanpa `--via`, bukan komputer ini) |

Endpoint `http://` langsung lewat jaringan ditolak dengan `INSECURE_PROTOCOL` kecuali Anda menambahkan `?insecure=1`: pesan dan session token login sementara akan berjalan tanpa enkripsi.

### Apa yang dilakukan setiap perintah di SQS

```bash
komando queue describe prod-sqs orders             # hitungan, pengaturan, dead-letter queue, tag
komando queue send prod-sqs orders --value '{"id": 42}' --header source=support
komando queue send prod-sqs orders.fifo --key customer-7 --value '{"id": 42}'
komando queue create prod-sqs orders.fifo --config ContentBasedDeduplication=true --dry-run
komando queue create prod-sqs jobs --config VisibilityTimeout=120 --config MessageRetentionPeriod=86400
komando queue purge prod-sqs orders --dry-run      # kira-kira berapa pesan yang akan hilang
komando queue rm prod-sqs old-jobs
```

- **`peek` menerima pesan dengan visibility timeout 0 dan tidak pernah menghapusnya.** Biasanya pesan yang diterima disembunyikan dari consumer lain untuk sementara lalu dihapus oleh consumer yang mendapatkannya. Dengan visibility timeout 0, tidak ada yang disembunyikan, dan komando tidak pernah menghapus, jadi setiap pesan tetap ada dan consumer bisa langsung menerimanya.
- SQS membagikan pesan tanpa urutan tertentu (queue FIFO: berurutan di dalam message group), jadi `peek` menampilkan contoh dari apa yang menunggu, bukan yang terbaru. Tidak ada `--oldest` atau `--partition`.
- **Setiap penerimaan dihitung.** SQS menaikkan receive count setiap pesan, juga untuk peek. Queue dengan dead-letter queue memindahkan pesan ke sana setelah `maxReceiveCount` penerimaan (`RedrivePolicy`-nya). Jadi peek menolak queue yang batasnya 3 atau kurang, dan berhenti dengan `DELIVERY_LIMIT_NEAR` begitu pesan yang ditampilkannya punya kurang dari 3 penerimaan tersisa. Peek dead-letter queue sebagai gantinya, atau biarkan consumer mengambil pesan itu.
- Hitungan yang diberikan SQS bersifat perkiraan. **Messages** menunggu untuk diterima; **in flight** sudah diterima dan belum dihapus; **delayed** dikirim dengan penundaan yang belum lewat.
- `send` hanya menerima teks; nilai `--header` menjadi message attribute. Queue FIFO (namanya diakhiri `.fifo`) butuh `--key`, yaitu message group: pesan dalam satu group diterima berurutan. komando memberi setiap pesan FIFO deduplication ID baru, kecuali queue melakukan deduplikasi menurut isi.
- `create` membuat queue standar, atau queue FIFO bila namanya diakhiri `.fifo`. `--config` menerima nama pengaturan SQS sendiri (`VisibilityTimeout`, `MessageRetentionPeriod`, `DelaySeconds`, `MaximumMessageSize`, `ReceiveMessageWaitTimeSeconds`, `RedrivePolicy`, `KmsMasterKeyId`, `ContentBasedDeduplication`, ...). SQS tidak bisa memeriksa queue tanpa membuatnya, jadi `create --dry-run` hanya memeriksa nama dan nama pengaturannya. Queue yang sudah ada adalah `QUEUE_EXISTS`.
- `purge` menghapus setiap pesan, juga yang in flight, dan mempertahankan queue; SQS mengizinkan satu purge per queue setiap 60 detik. `rm` menghapus queue; SQS butuh 60 detik sebelum queue dengan nama yang sama bisa dibuat lagi. Keduanya tidak bisa dibatalkan, jadi bertanya dulu, seperti untuk [Kafka](#create-delete-and-empty-topics).
- `groups` dan `lag` menjawab `NOT_SUPPORTED`: SQS tidak punya consumer group. `describe` menampilkan berapa pesan yang in flight.

## Google Cloud Pub/Sub

### Menambah project Pub/Sub

Conn Pub/Sub adalah satu project Google Cloud. Anda memberikan nama topic atau subscription ke setiap perintah, bukan di URL. komando login dengan cara yang sama seperti untuk bucket gs:// dan tidak butuh gcloud atau Google SDK:

```bash
komando queue add prod-pubsub pubsub://my-project      # login gcloud (application default credentials)
komando secret set pubsub-key < key.json      # atau: key service account
komando queue add staging-pubsub pubsub://my-project --password-ref secret:pubsub-key
komando queue add local-pubsub 'pubsub://test-project?endpoint=http://localhost:8085'   # emulator: tanpa login
komando queue info prod-pubsub                         # berapa topic dan subscription
komando queue list prod-pubsub                           # topic dan berapa subscription yang dimiliki masing-masing
komando queue groups prod-pubsub                       # subscription: topic, pengiriman, ack deadline
komando queue peek prod-pubsub billing                 # sampai 10 pesan dari subscription billing; semuanya dikembalikan
```

- Cara komando login: key service account di `--password-ref`, atau kalau tidak, di endpoint Google sendiri (`*.googleapis.com`), application default credentials Anda (file `GOOGLE_APPLICATION_CREDENTIALS`, yang dibuat `gcloud auth application-default login`, atau akun milik server sendiri di Google Cloud). Beri login role yang dibutuhkannya: `roles/pubsub.viewer` untuk melihat, `roles/pubsub.subscriber` untuk peek, `roles/pubsub.publisher` untuk mengirim, `roles/pubsub.editor` untuk membuat dan menghapus.
- `endpoint=` yang bukan milik Google tidak pernah mendapat login gcloud Anda: token itu berlaku untuk seluruh account Google Cloud Anda. Beri endpoint seperti itu key tersendiri dengan `--password-ref`, atau tanpa key.
- Login hanya lewat HTTPS. Emulator (`http://`) tidak memakainya, jadi komando tidak mengirim apa pun ke sana: key di `--password-ref` pada endpoint `http://` ditolak (`USAGE`).
- `komando test prod-pubsub` login dan mencantumkan satu topic.

| Opsi | Fungsinya |
|---|---|
| `endpoint=URL` | server Pub/Sub lain: endpoint regional (`https://europe-west1-pubsub.googleapis.com`), yang privat, atau emulator (`http://localhost:8085`) |
| `insecure=1` | terima endpoint `http://` lewat jaringan (tanpa `--via`, bukan komputer ini) |

Endpoint `http://` langsung lewat jaringan ditolak dengan `INSECURE_PROTOCOL` kecuali Anda menambahkan `?insecure=1`: pesan akan berjalan tanpa enkripsi.

### Topic dan subscription

Di Pub/Sub Anda mengirim ke sebuah topic, dan topic membagikan setiap pesan ke setiap subscription-nya. Pesan menunggu di sebuah subscription sampai program yang menariknya mengakuinya. Jadi subscription adalah tempat pesan berada, dan juga yang disebut sistem lain sebagai consumer group.

Nama yang Anda berikan adalah topic atau subscription:

- `peek` dan `purge` menerima subscription (`billing`).
- `describe`, `send`, `create`, dan `rm` menerima topic (`orders`); `describe` juga menemukan subscription bila tidak ada topic dengan nama itu.
- Tulis `subscriptions/NAME` (atau `topics/NAME`) untuk menyatakan yang mana, misalnya untuk menghapus subscription: topic dan subscription sering berbagi nama.

Pub/Sub tidak menghitung pesan yang menunggu (Cloud Monitoring yang melakukannya), jadi `messages` bernilai `-1` di JSON dan teks menyatakan "does not count". `lag` menjawab `NOT_SUPPORTED`.

### Apa yang dilakukan setiap perintah di Pub/Sub

```bash
komando queue describe prod-pubsub orders              # sebuah topic dan subscription-nya
komando queue describe prod-pubsub subscriptions/billing
komando queue send prod-pubsub orders --value '{"id": 42}' --header source=support --key customer-7
komando queue create prod-pubsub orders --config messageRetentionDuration=7d --dry-run
komando queue create prod-pubsub subscriptions/billing --config topic=orders --config ackDeadlineSeconds=60
komando queue purge prod-pubsub billing --dry-run      # mengosongkan subscription billing
komando queue rm prod-pubsub subscriptions/billing old-orders --dry-run
```

- **`peek` menarik pesan dan mengembalikan setiap pesan tanpa diakui.** Perintah ini tidak pernah mengakui, jadi tidak ada yang dihapus: saat selesai, perintah mengatur ack deadline setiap pesan ke 0 dan Pub/Sub mengirimnya lagi seketika. Selama satu atau dua detik peek berjalan, pesan yang dipegangnya tidak diberikan ke program lain; bila komando dihentikan di tengah jalan, Pub/Sub membagikannya lagi setelah ack deadline subscription. Pub/Sub tidak memberi urutan tertentu, jadi tidak ada `--oldest` atau `--partition`.
- **Dengan dead-letter topic, setiap pengiriman dihitung.** Setelah `maxDeliveryAttempts` pengiriman, Pub/Sub memindahkan pesan ke dead-letter topic, dan peek adalah satu pengiriman. Jadi peek berhenti dengan `DELIVERY_LIMIT_NEAR` begitu pesan yang ditampilkannya punya kurang dari 3 tersisa. Subscription yang batasnya 3 atau kurang ditolak sebelum peek menarik apa pun. Biarkan subscriber mengambil pesan itu, atau peek subscription dari dead-letter topic.
- Subscription push, BigQuery, dan Cloud Storage dikirim oleh Pub/Sub sendiri: peek subscription pull dari topic yang sama sebagai gantinya.
- `send` menerbitkan ke sebuah topic. Nilai `--header` menjadi attribute dan `--key` adalah ordering key (subscription dengan ordering mendapat pesan dari satu key secara berurutan).
- `create NAME` membuat topic; `create subscriptions/NAME --config topic=TOPIC` membuat subscription. `--config` menerima nama pengaturan Pub/Sub sendiri: `messageRetentionDuration` (`7d`, `36h`), `kmsKeyName`; untuk subscription juga `ackDeadlineSeconds`, `retainAckedMessages`, `enableMessageOrdering`, `enableExactlyOnceDelivery`, `filter`, `deadLetterTopic`, `maxDeliveryAttempts`, dan `pushEndpoint`; `labels.KEY=VALUE` pada keduanya. Pub/Sub tidak bisa memeriksa topic tanpa membuatnya, jadi `create --dry-run` hanya memeriksa nama dan pengaturannya.
- `purge` mengosongkan subscription dan mempertahankannya: setiap pesan yang diterbitkan sampai sekarang dihitung sebagai sudah diakui (sebuah "seek" ke sekarang), juga yang ditarik program dan belum diakuinya. Subscription lain milik topic itu tetap memiliki pesannya.
- `rm` menghapus topic, atau subscription yang ditulis `subscriptions/NAME`. Menghapus topic tidak menghapus subscription-nya: subscription itu tetap memiliki pesannya, terputus dari topic. Menghapus subscription menghapus pesan yang menunggu di dalamnya. `purge` dan `rm` tidak bisa dibatalkan, jadi bertanya dulu, seperti untuk [Kafka](#create-delete-and-empty-topics).

## Memeriksa, mengubah, mengganti nama, atau menghapus conn queue

Queue adalah sebuah conn, jadi perintah conn berfungsi padanya:

```bash
komando test prod-kafka                       # bisakah komando menjangkaunya dan login?
komando conn show prod-kafka                  # URL, jalan masuk, dan rujukan kata sandinya
komando conn edit prod-kafka --protected      # setiap perubahan lalu butuh jawaban ya dari seseorang
komando conn rename prod-kafka orders-kafka
komando conn rm prod-kafka                    # komando melupakannya; topic-nya tetap ada
```

## Batasan

- RabbitMQ: vhost yang namanya memuat `/` ditulis ter-encode URL (`%2F`); path dengan `/` kedua ditolak.
- RabbitMQ dan NATS: `ca=` dan `tls=skip-verify` tidak bisa dipakai bersamaan.
- NATS: user di URL dan `creds=` bersamaan ditolak: pilih satu.
- SQS: komando tidak membaca `AWS_ENDPOINT_URL` atau `AWS_ENDPOINT_URL_SQS`: URL conn menyatakan ke mana perintah pergi. Pakai `?endpoint=` untuk server lain.
- Pub/Sub: URL tidak punya user. Login Google tidak punya, dan user ditolak. Topic milik project lain butuh conn tersendiri.
- Pub/Sub: pesan kosong tanpa `--header` ditolak.
- Pub/Sub: `pushEndpoint` harus berupa alamat `https://`.
- komando tidak punya perintah untuk mengganti nama, menyalin, atau mem-backup topic.

## Pemecahan masalah

| Error | Artinya dan yang perlu dilakukan |
|---|---|
| `QUEUE_CONNECT` | broker tidak bisa dijangkau, atau menginginkan TLS (`?tls=true`) atau login (`?sasl=`); dengan `--via`, alamat yang diiklankan harus bisa dijangkau dari sana |
| `QUEUE_AUTH` | periksa user, mekanisme `sasl=`, dan kata sandi (`komando conn show NAME`); SQS: profil atau key AWS; Pub/Sub: key service account, atau `gcloud auth application-default login` |
| `AWS_LOGIN_REQUIRED`, `AWS_PROFILE_NOT_FOUND` | SQS: seseorang menjalankan `komando login aws --profile NAME`, atau perbaiki opsi `aws_profile` milik conn |
| `QUEUE_DENIED` | user tidak punya Kafka ACL untuk topic, group, atau cluster, izin RabbitMQ pada vhost atau queue, izin NATS pada subject atau JetStream API, izin IAM untuk SQS (`sqs:ReceiveMessage`, ...), atau role Pub/Sub (`roles/pubsub.subscriber`, ...; atau API Pub/Sub belum diaktifkan): tanyakan kepada admin |
| `TOPIC_NOT_FOUND`, `CONSUMER_GROUP_NOT_FOUND`, `PARTITION_NOT_FOUND` | periksa nama dengan `queue list`, `queue groups`, atau `queue describe` |
| `TOPIC_EXISTS` | `queue create` pada topic yang sudah ada |
| `QUEUE_NOT_FOUND`, `QUEUE_EXISTS` | RabbitMQ: tidak ada queue seperti itu di vhost conn, atau sudah ada; periksa vhost di path URL. SQS: periksa region (host URL) dan, untuk queue milik account lain, `?account=` |
| `SUBSCRIPTION_NOT_FOUND`, `SUBSCRIPTION_EXISTS` | Pub/Sub: tidak ada subscription seperti itu (`queue groups` mencantumkannya; peek menerima subscription, bukan topic), atau sudah ada |
| `DELIVERY_LIMIT_NEAR` | pesan di quorum queue RabbitMQ mendekati batas pengirimannya, pesan SQS mendekati `maxReceiveCount` queue-nya, atau pesan Pub/Sub mendekati `maxDeliveryAttempts` subscription-nya: berhenti melakukan peek dan biarkan consumer-nya mengambil pesan itu |
| `STREAM_NOT_FOUND`, `STREAM_EXISTS`, `CONSUMER_NOT_FOUND` | NATS: tidak ada stream seperti itu (untuk `send`: tidak ada stream yang menyimpan subject itu), sudah ada, atau tidak ada consumer seperti itu; `queue list` dan `queue groups` menampilkan namanya |
| `NOT_SUPPORTED` | engine tidak bisa melakukan ini (RabbitMQ: `groups`, `lag`, `queue list` dan `peek` tanpa `?management=`, `peek` pada stream queue; NATS tanpa JetStream; SQS: `groups`, `lag`, `peek --oldest`; Pub/Sub: `lag`, `peek --oldest`, peek pada subscription push; `peek --idle` selain di Kafka; flag yang tidak dimiliki sebuah jenis: `--partition`, `--key`, `--type`, `--internal`, `--partitions`, `--replicas`); hint menyatakan apa yang berfungsi sebagai gantinya |
