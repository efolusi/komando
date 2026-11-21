# Cluster (Kubernetes dan Docker Swarm)

Lihat dan ubah apa yang berjalan di Kubernetes dan Docker Swarm dengan satu set perintah. Anda tidak butuh `kubectl` atau `docker` di komputer Anda: komando berbicara ke cluster sendiri.

## Memeriksa kesehatan cluster

```bash
komando import kubeconfig                  # satu conn per context kubeconfig (lihat Menambah cluster)
komando conn rename my-ctx-name prod-k8s   # beri nama pendek (impor menamainya menurut context)
komando cluster status prod-k8s            # versi, node, dan setiap masalah
```

Jika diketik tanpa argumen di terminal, `komando cluster status` menanyakan cluster mana, dengan daftar milik Anda untuk dipilih.

```text
prod-k8s: version v1.30.4, 3 of 3 nodes ready
not healthy: 2 problems
OBJECT                 PROBLEM
pod/shop/api-7d9f-x2   api: CrashLoopBackOff
deployment/shop/api    1 of 3 replicas ready
```

`cluster status` mencantumkan setiap masalah menurut namanya: pod yang crash atau tidak bisa mulai, deployment, StatefulSet, dan DaemonSet yang kekurangan replika, dan node yang berada di bawah tekanan (`MemoryPressure`). Bila tidak ada, komando menyatakan `healthy: no problems found` (`healthy: true` di JSON). Di Swarm, komando mencantumkan node yang mati atau di-drain dan service yang kekurangan replika, dengan error setiap task yang tidak berjalan.

Perintah yang sama berfungsi di Kubernetes dan di Docker Swarm.

## Menambah cluster

### Kubernetes

komando membaca kubeconfig Anda (file login yang dipakai `kubectl`, biasanya `~/.kube/config`) dan menambahkan satu conn per context (satu cluster dan user di file itu):

```bash
komando import kubeconfig --dry-run           # lihat apa yang akan ditambahkan
komando import kubeconfig                     # membaca $KUBECONFIG, kalau tidak ~/.kube/config
komando conn edit prod-k8s --via bastion      # API server di jaringan privat? jangkau seperti yang lain
```

Jika diketik tanpa argumen di terminal, `komando cluster add` menanyakan apakah ini Kubernetes (lalu file kubeconfig Anda) atau Docker Swarm (lalu alamat sebuah manager).

Cara login bekerja:

- komando menyimpan kubeconfig setiap context di vault.
- komando membuat sendiri login EKS dan GKE (`aws eks get-token`, `aws-iam-authenticator`, `gke-gcloud-auth-plugin`), jadi Anda tidak butuh program itu. Login tersebut dibuat dari login AWS atau Google Cloud komputer ini dan dikirim ke server milik kubeconfig, jadi agen AI butuh jawaban ya dari seseorang (`--yes`) untuk mengimpor kubeconfig seperti itu. Login hanya dikirim lewat https dengan sertifikat server yang diperiksa: server di `http://`, atau `insecure-skip-tls-verify` tanpa CA, berhenti dengan error penggunaan.
- Program login lain yang disebut kubeconfig berjalan di komputer ini, jadi agen AI butuh jawaban ya dari seseorang (`--yes`) untuk mengimpornya, seperti `--proxy-command` milik server.
- Impor Anda sendiri mencatat file mana program itu (path lengkapnya) dan `PATH` saat impor. Perintah agen AI menjalankan file itu dengan `PATH` tersebut, folder home Anda yang sebenarnya, dan hanya beberapa variabel biasa (user, bahasa, layar, folder temp) dari lingkungannya sendiri: apa yang dibutuhkan program di luar itu masuk ke `env` kubeconfig. Bila file itu bisa diganti oleh program milik user Anda (`bin` milik Homebrew, `~/.local/bin`, atau di Windows folder di bawah Program Files yang oleh installer dibuat bisa ditulis semua user) dan isinya berubah, misalnya setelah update, agen ditanya lagi sampai Anda mengimpor kubeconfig lagi.
- Impor yang dibuat agen AI dengan jawaban ya Anda tidak mempercayai apa pun untuk selanjutnya: perintah cluster-nya bertanya kepada Anda setiap kali, dan setelah jawaban ya Anda program berjalan dengan `PATH` sistem. Impor kubeconfig sendiri untuk mempercayainya.
- Bila program itu hilang, perintah cluster berhenti dengan `TOOL_MISSING` (exit 3) dan `installHint` milik kubeconfig. Bila program berjalan tetapi tidak bisa login (mungkin ia ingin seseorang login dulu), perintah berhenti dengan `LOGIN_FAILED` (exit 4).
- Setelah seseorang mengimpor (atau mengizinkan) sebuah kubeconfig, agen memakai conn tanpa bertanya. Bila kubeconfig di vault berubah ke program lain atau apa pun di blok cluster-nya (server, CA-nya, `tls-server-name`, `proxy-url`, `insecure-skip-tls-verify`; `secret set`), atau membaca token dari file lokal (`tokenFile`), setiap perintah agen bertanya lagi, pembacaan juga, sampai seseorang mengimpornya lagi. Ini berlaku untuk login EKS dan GKE juga.

komando memeriksa sertifikat API server terhadap CA milik kubeconfig. Context dengan `insecure-skip-tls-verify` dan tanpa CA melewati pemeriksaan itu, seperti kubectl; impor menyebutkannya di catatannya, karena loginnya menuju siapa pun yang menjawab di alamat itu. Dengan CA, sertifikat selalu diperiksa, bahkan bila `insecure-skip-tls-verify` juga diatur.

Untuk menambah satu cluster secara manual, simpan dulu kubeconfig-nya di vault, lalu sebut dengan `cluster add` (sama dengan `conn add`, tetapi menolak URL yang bukan cluster):

```bash
komando secret set prod-kubeconfig < prod.kubeconfig
komando cluster add prod-k8s k8s://api.cluster.example:6443 --password-ref secret:prod-kubeconfig
```

### Docker Swarm

Swarm dijangkau lewat server manager: tambahkan manager sebagai server dan beri tag `swarm`, sehingga grup atau `all` memilihnya sebagai cluster juga (lihat [Banyak cluster sekaligus](#many-clusters-at-once)):

```bash
komando host add swarm1 admin@10.0.0.10 --tag swarm
komando host edit swarm1 --add-tag swarm     # manager yang sudah ada di daftar Anda
```

`komando cluster add` yang diketik tanpa argumen di terminal menambahkan tag untuk Anda saat Anda menjawab Docker Swarm.

### Menghapus cluster dari komando

```bash
komando conn rm prod-k8s                 # komando melupakannya; cluster-nya tidak disentuh
komando secret rm prod-kubeconfig        # kubeconfig-nya, setelah tidak ada yang memakainya
```

`conn rm` mencantumkan secret vault yang tidak lagi dipakai apa pun (`secrets_unused`). `cluster rm` berbeda: perintah itu menghapus sebuah objek di dalam cluster.

## Menyebut objek

Setiap perintah menyebut objek seperti kubectl: `TYPE NAME` atau `TYPE/NAME` (`deployment api`, `deploy/api`, `deployment.apps/api`). Bila Anda salah mengetik jenisnya, error menyarankan yang mungkin Anda maksud.

- Sebut namespace (lihat [Glosarium](glossary.md)) dengan `--namespace`, atau `-n` seperti di kubectl. Tanpanya, komando memakai namespace lazim cluster: yang disebut context kubeconfig-nya, kalau tidak `default`. Ubah secara permanen dengan `komando conn edit prod-k8s --option namespace=shop`.
- Berapa banyak baris atau objek yang ditampilkan adalah `--limit` (tidak punya bentuk pendek di perintah cluster). Angka setelah `-n` (`-n 50`) ditolak, dengan hint: tulis `--limit 50`, atau `--namespace=50` untuk namespace bernama 50.
- `-A` (`--all-namespaces`) berfungsi di `list`, `events`, dan `helm list`. Tidak bisa bersama `--namespace`.
- Jenis Swarm adalah `service` (`svc`), `task`, `node`, dan `stack`. Swarm tidak punya namespace, jadi `--namespace` ditolak di sana.

## Melihat-lihat

```bash
komando cluster status prod-k8s --namespace shop                # hanya masalah di satu namespace
komando cluster list prod-k8s pods --namespace shop
komando cluster list prod-k8s deploy -A                         # setiap namespace
komando cluster list prod-k8s pods -l app=api                   # hanya objek dengan label ini
komando cluster describe prod-k8s deployment/api --namespace shop   # image, strategi, pod, event
komando cluster events prod-k8s --namespace shop --warnings     # apa yang salah, yang terlama dulu
komando cluster events prod-k8s --for deployment/api --namespace shop
komando cluster get prod-k8s deploy/api --namespace shop        # seluruh objek (nilai Secret disembunyikan)

komando cluster status swarm1                                   # manager Swarm
komando cluster list swarm1 services                            # juga: tasks, nodes, stacks
komando cluster describe swarm1 service/web                     # image, replika, status update, error task
```

Jika diketik tanpa argumen di terminal, `komando cluster list` menanyakan cluster, lalu apa yang dicantumkan (pod secara default).

```text
$ komando cluster list prod-k8s deploy --namespace shop
NAME   READY   UP-TO-DATE   AVAILABLE   AGE
api    3/3     3            3           12d
web    2/2     2            2           40d
```

`cluster list` menampilkan kolom yang berguna untuk setiap jenis: replika yang siap, restart, host ingress, volume claim, penyelesaian job, jadwal cron, dan target autoscaler. Dalam mode teks, tabelnya tampak seperti milik kubectl (`NAME READY STATUS RESTARTS AGE NODE` untuk pod). Di JSON, baris yang sama ada di `data.items[]`, untuk Kubernetes dan Swarm sama saja.

Di JSON, `cluster describe` pada objek Kubernetes juga memberi `data.detail`, dibuat untuk dibaca program: `kind`, `name`, `namespace`, `status` (fase pod, `ready 2/3` untuk workload), `created_at`, `labels`, `conditions[]` (`type`, `status`, `reason`, `message`), dan `events[]` (`type`, `reason`, `message`, `count`, `last_seen_at`). Isinya tidak pernah memuat nilai Secret.

### Banyak cluster sekaligus

`cluster status`, `cluster list`, `cluster events`, dan `cluster helm list` menerima selector yang memilih beberapa cluster: grup, `kind:k8s`, tag, atau `all`. komando membacanya bersamaan dan menampilkan satu blok per cluster. Server dihitung sebagai manager Swarm di sana hanya bila punya tag `swarm` atau disebut di selector; server lain dicantumkan di `meta.skipped`:

```bash
komando cluster status kind:k8s                  # kesehatan setiap cluster Kubernetes
komando cluster events tag:prod --warnings -A    # apa yang salah di mana pun di production
komando cluster list all nodes
```

Di JSON, setiap cluster adalah satu baris di `data.results[]` (`cluster`, `engine`, `ok`, dan `data` atau `error`-nya), dengan `data.summary`. Cluster yang tidak bisa dibaca gagal sendirian: yang lain tetap tampil, dan perintah berakhir dengan `PARTIAL_FAILURE`. Satu cluster memberi output yang sama seperti biasa. Perintah yang mengubah cluster (`apply`, `deploy`, `restart`, `scale`, `rm`, `rollback`) dan `status` sebuah rollout tetap pada satu cluster.

### Release Helm (read-only)

komando membaca release Helm yang tersimpan di cluster, tanpa program `helm`. komando hanya membaca: install, upgrade, dan rollback tetap di `helm`. Untuk mengubah apa yang berjalan dari komando, `cluster deploy` menetapkan image baru dengan rollout yang bisa Anda tunggu, dan `cluster apply` menerapkan manifest, misalnya output `helm template` (dry run di server memeriksanya lebih dulu).

```bash
komando cluster helm list prod-k8s -A                                   # nama, revisi, status, chart, versi aplikasi
komando cluster helm status prod-k8s shop-api --namespace shop          # kapan di-deploy, deskripsi, catatan
komando cluster helm history prod-k8s shop-api --namespace shop
komando cluster helm values prod-k8s shop-api --namespace shop          # nilai saat diinstal
komando cluster helm values prod-k8s shop-api --namespace shop --all    # dengan default chart
```

`--revision N` menampilkan revisi yang lebih lama di `status` dan `values`. Helm menyimpan release sebagai Secret, jadi user kubeconfig harus bisa mendaftar Secret di namespace itu (kalau tidak, `K8S_FORBIDDEN`). Untuk agen AI, kata sandi dan token di dalam values tampil sebagai `[hidden]`, seperti di mana pun.

## Membaca log

```bash
komando cluster logs prod-k8s api-7d9f-x2 --namespace shop --since 10m --limit 100   # satu pod
komando cluster logs prod-k8s deploy/api --namespace shop -f                         # setiap pod sebuah workload, mengikuti
komando cluster logs prod-k8s -l app=api --namespace shop --limit 50                 # setiap pod dengan sebuah label
komando cluster logs prod-k8s api-7d9f-x2 --namespace shop --previous                # eksekusi sebelum restart terakhir
komando cluster logs swarm1 service/web -f --timeout 1m                              # sebuah service Swarm
```

Jika diketik tanpa argumen di terminal, `komando cluster logs` menanyakan cluster, lalu pod atau workload.

```text
[api-7d9f-x2] GET /health 200 1ms
[api-7d9f-k4] GET /orders 500 32ms
```

- Saat beberapa pod menjawab, setiap baris diawali `[pod]`. JSON menyebut `object` dan `pods`-nya.
- `-f` terus membaca baris baru. Ctrl-C atau `--timeout` mengakhirinya dengan normal.
- `--since` menerima durasi (`10m`, `2h`) atau waktu (`2026-01-02T10:00:00Z`).
- `--timestamps` mengawali setiap baris dengan waktunya; `-c` memilih container.
- Di JSON, `data.lines[]` berisi setiap baris sendiri-sendiri: `logged_at` (waktunya), `pod`, `container`, dan `text`. `data.truncated` (dan `meta.truncated`) bernilai true bila pod mengirim `--limit` baris, sehingga mungkin masih punya yang lebih lama. `--limit 0` membaca setiap baris.

## Men-deploy versi baru, dan rollback

```bash
komando cluster deploy prod-k8s deployment/api --image ghcr.io/acme/api:1.4.3 --namespace shop --wait
komando cluster status prod-k8s deployment/api --namespace shop --wait    # sudah ter-rollout?
komando cluster history prod-k8s deployment/api --namespace shop          # revisi dan image-nya
komando cluster rollback prod-k8s deployment/api --namespace shop --wait  # kembali ke yang sebelumnya
komando cluster rollback prod-k8s deployment/api --revision 3 --namespace shop  # kembali ke revisi 3

komando cluster deploy swarm1 service/web --image nginx:1.27 --wait
komando cluster rollback swarm1 service/web --wait
```

Jika diketik tanpa argumen di terminal, `komando cluster deploy` menanyakan cluster, workload, dan image baru.

Dengan beberapa container di satu pod, sebut container yang mendapat image dengan `--container` (atau `--image CONTAINER=IMAGE`).

`--wait` bertahan sampai setiap replika menjalankan versi baru. Perintah berhenti dengan:

| Kode | Kapan |
|------|-------|
| `ROLLOUT_FAILED` (exit 5) | cluster menyerah, atau pod berada di `ImagePullBackOff`, `CrashLoopBackOff`, dan sejenisnya selama 3 menit |
| `ROLLOUT_TIMEOUT` (exit 7) | `--timeout` terlewati (default 5 menit) |

Keduanya menyebut pod (atau task Swarm) yang macet, mengapa macet, dan image-nya. Jalankan `cluster rollback` untuk kembali.

`rollback` tanpa `--revision` menuju revisi terbaru sebelumnya dengan image yang berbeda. Revisi yang digantikannya (yang rusak) lalu dilewati, jadi rollback dua kali tidak membawanya kembali. `--revision` memilih revisi mana pun: yang tidak ada mencantumkan yang ada, dan yang sedang berjalan tidak mengubah apa pun (`unchanged`). Di Swarm, rollback yang Anda mulai diikuti sampai selesai, tidak dilaporkan sebagai update yang gagal.

## Mengubah cluster

```bash
komando cluster apply prod-k8s --file app.yaml --dry-run       # server memeriksanya; tidak ada yang berubah
komando cluster apply prod-k8s --file app.yaml                 # created / configured / unchanged per objek
komando cluster restart prod-k8s deployment/api --namespace shop --wait
komando cluster scale prod-k8s deployment/api 3 --namespace shop --wait
komando cluster rm prod-k8s pod/api-7d9f-x2 --namespace shop

komando cluster apply swarm1 --file compose.yml --stack shop --dry-run   # diperiksa seperti docker stack config
komando cluster apply swarm1 --file compose.yml --stack shop
komando cluster scale swarm1 service/web 4
```

- `apply` lebih dulu mengirim seluruh file ke server sebagai dry run. Bila cluster menolak satu objek (salah ketik, field atau jenis yang tidak dikenal), proses berhenti di sana dan tidak ada isi file yang diterapkan (`K8S_INVALID`, "nothing was applied: configmap/bad: ...").
- `apply` memakai server-side apply sebagai `komando`. Field yang dimiliki tool lain (replika autoscaler, `kubectl edit`) menghentikannya dengan `K8S_CONFLICT`, yang menyebut tool itu dan field-nya, dan tidak ada yang diterapkan. Hilangkan field itu dari file, atau tambahkan `--force-conflicts` untuk mengambil alih (seperti `kubectl apply --server-side --force-conflicts`). Itu tetap sebuah perubahan: cluster yang dilindungi butuh jawaban ya dari seseorang, seperti tanpanya.
- `apply --dry-run` menampilkan untuk setiap objek apakah akan dibuat, diubah, atau tetap sama, dengan diff. Nilai Secret tidak pernah tampil: nilai yang berubah terbaca `[hidden, changed]`. Objek di namespace yang dibuat file yang sama dilaporkan sebagai dibuat juga. `--file -` membaca dari stdin.
- Objek yang namespace-nya di file berbeda dari `--namespace` ditolak, seperti kubectl.
- `scale` melaporkan `previous_replicas` (atau `unchanged`).
- Cluster yang dilindungi butuh jawaban ya dari seseorang sebelum perubahan apa pun.
- Scale ke 0 dan `rm` menghentikan sesuatu. Di terminal Anda komando bertanya dulu: ketik nama objek (`Type the name api-7d9f-x2 to continue`); jawaban lain, termasuk nama cluster, tidak mengubah apa pun. Agen AI atau script menambahkan `--allow-dangerous` setelah seseorang setuju. Lihat [Keamanan](safety.md#what-needs-a-yes).

## Bekerja di dalam pod

```bash
komando cluster exec prod-k8s deploy/api --namespace shop --read-only -- cat /app/config.yml
komando cluster exec prod-k8s api-7d9f-x2 -c api --namespace shop -- php artisan cache:clear
komando cluster forward prod-k8s svc/api 8080:80 --namespace shop   # 127.0.0.1:8080 sampai Ctrl-C
komando cluster shell prod-k8s deploy/api --namespace shop          # interaktif, untuk manusia
```

- `cluster exec` menjalankan satu perintah (tidak interaktif). Filter perintah berbahaya memeriksanya, seperti `exec` di server. `--read-only` menyatakan perintah hanya melihat, diperiksa seperti untuk `exec`: hanya perintah yang diketahui komando hanya membaca yang berjalan (`cat`, `ls`, `printenv` ...); yang lain ditolak (`READ_ONLY_VIOLATION`; lihat [Menjalankan perintah](commands.md#protected-servers-and---read-only)).
- `cluster forward` membuat port pod atau service bisa dijangkau di komputer ini saja (127.0.0.1). Untuk service, port service diteruskan ke port pod di baliknya. Ctrl-C atau `--timeout` mengakhirinya dengan normal. Apa yang lewat di sana melewati pemeriksaan komando, jadi cluster yang dilindungi bertanya dulu (`--yes`), dan audit log mencatat forward itu.
- `cluster shell` membuka terminal di dalam pod (bash, kalau tidak sh) untuk manusia, dan bertanya dulu di cluster yang dilindungi. Agen mendapat `NEEDS_TERMINAL` dan memakai `cluster exec`.
- komando berbicara protokol exec dan port-forward Kubernetes sendiri: WebSocket, dan SPDY pada cluster yang lebih lama dari Kubernetes 1.30, seperti kubectl. Pod atau service yang tidak ada adalah "not found" (exit 3).

## Apa pun lainnya yang bisa dilakukan kubectl atau docker

```bash
komando cluster run prod-k8s -- get pods -A -o wide
komando cluster run prod-k8s --write -- rollout undo deployment/api -n shop
komando cluster run swarm1 -- service ps web
```

Di Kubernetes, `cluster run` adalah kubectl milik komando sendiri. Perintah ini memahami perintah kubectl dan mencetak apa yang dicetak kubectl, lewat jalur `--via` milik conn, tanpa kubectl terinstal. Di Swarm perintah dikirim ke docker di manager. Kata-kata setelah `--` adalah milik kubectl (atau docker), jadi `-n` di sana adalah flag namespace milik kubectl.

- Perintah ini hanya membaca kecuali Anda menambahkan `--write`. Delete, drain, scale ke 0, dan sejenisnya juga butuh `--allow-dangerous`.
- `--dry-run` mengirim perubahan ke server sebagai dry run server-side (`apply`, `create`, `delete`, `scale`, `patch`, ...). Perintah yang tidak bisa di-dry-run oleh server (`exec`, `cp`, `create token`, `config view`, `get` nilai Secret untuk seseorang) hanya ditampilkan, tidak dijalankan.
- Untuk agen AI, nilai Secret dan nilai env yang namanya seperti secret (`DB_PASSWORD`) tampil tersembunyi di output `get`, seperti di `cluster get`, jadi `get secret -o yaml` adalah pembacaan untuk mereka. `apply`, `create`, dan `replace` menolak file yang masih memuat nilai tersembunyi (`HIDDEN_VALUE`): ubah satu field dengan `set image` atau `patch` sebagai gantinya.
- Untuk agen AI, file di komputer ini yang akan menuju cluster (`-f`, `--from-file`, `cp` ke pod) tidak boleh berupa secret menurut namanya (`.env`, key) kecuali orangnya mengizinkan `--reveal`, dan tidak pernah folder komando sendiri (`SENSITIVE_FILE`).
- `delete -f FILE` menghapus setiap objek di namespace yang disebut file-nya, dan menolak `-n` yang menyatakan lain. Nama kosong ditolak.
- `cp POD:SRC DST` menulis hanya di dalam DST, tidak pernah ke folder `.git`, dan melewati link dan device, seperti kubectl cp. Perintah ini membawa paling banyak 512 MiB (`FILE_TOO_LARGE`): komando memeriksa setiap nama sebelum menulis apa pun, jadi menyimpan salinan di memori. Untuk agen AI, perintah menyalin seperti `download`: file yang merupakan secret menurut namanya (`.env`, private key) ditolak (`SENSITIVE_FILE`; bila SRC sendiri bernama begitu, sebelum komando membaca pod), file teks ditulis dengan nilai secret-nya `[hidden]`, dan file biner atau yang lebih besar yang memuat nilai vault ditolak; tidak ada yang ditulis bila ada file yang ditolak.
- Di Swarm, `docker run`, `create`, dan `service create|update` yang memberi container akses ke server (`--privileged`, `--cap-add`, device, jaringan atau proses host, `--volumes-from`, bind `/`, socket docker, folder sistem atau kredensial) juga butuh `--allow-dangerous`, begitu juga `plugin install|create|enable|set` dan `volume create` yang berupa folder host.
- Berhenti di `--timeout` (default 5 menit). Watch (`get -w`) atau follow (`logs -f`) yang berakhir di sana berakhir dengan normal. `logs -f` mencetak baris saat datang dan mengikuti semua pod terpilih sekaligus (`--max-log-requests`, 5 secara default).
- Sesi punya perintah sendiri: `cluster forward` (port-forward) dan `cluster shell` (`exec -it`).
- Perintah yang tidak dikenalnya mendapat "did you mean". Perintah yang dikenalnya ada di [Referensi](#reference).

## Batasan

- `cluster status` pada cluster dengan lebih dari 20000 objek dari satu jenis hanya membaca sejumlah itu, menyatakan `truncated: true`, dan `healthy` bernilai `null` kecuali menemukan masalah. Persempit dengan `--namespace`.
- `cluster run` mengenal perintah kubectl sendiri, bukan plugin kubectl (krew). `edit` ditolak (ambil YAML, ubah, lalu `apply -f`), dan dari `config` hanya `current-context` dan `get-contexts` yang berfungsi.
- Di Swarm, komando tidak bisa melihat isi file compose atau stack di server, jadi `cluster run swarm1 -- stack deploy -c FILE` dan `compose up` dinilai hanya dari flag-nya.
- Helm: komando hanya membaca release; install, upgrade, dan rollback tetap di `helm` (`cluster deploy` dan `cluster apply` mengubah apa yang berjalan).

## Pemecahan masalah

| Kode | Artinya | Yang perlu dilakukan |
|------|---------|----------------------|
| `TOOL_MISSING` (exit 3) | program login yang disebut kubeconfig tidak terinstal | instal; error menampilkan `installHint` milik kubeconfig |
| `LOGIN_FAILED` (exit 4) | program login berjalan tetapi tidak bisa login | seseorang login dengan program itu, lalu jalankan lagi |
| `CONN_UNREACHABLE` (exit 4) | API server tidak menjawab | `komando test prod-k8s`, dan periksa jalur `--via` atau VPN-nya |
| `K8S_FORBIDDEN` (exit 4) | user kubeconfig tidak boleh melakukan ini (Helm: mendaftar Secret) | beri user itu haknya, atau sebut satu namespace dengan `--namespace` |
| `K8S_INVALID` (exit 2) | cluster menolak permintaan atau file sebagaimana ditulis | baca kata-kata cluster di pesan; perbaiki YAML atau selector `-l` |
| `K8S_POD_NOT_FOUND` (exit 3) | workload tidak punya pod yang berjalan untuk dibaca atau dijalankan di dalamnya | `komando cluster list prod-k8s pods --namespace shop` |
| `NOT_SWARM_MANAGER` (exit 3) | server bukan manager Swarm | sebut sebuah manager; `komando exec swarm1 --read-only -- docker node ls` menunjukkan apakah server itu manager |
| `ROLLOUT_FAILED` (exit 5), `ROLLOUT_TIMEOUT` (exit 7) | versi baru tidak naik | `komando cluster describe prod-k8s deployment/api --namespace shop`, lalu `cluster rollback` |
| `HIDDEN_VALUE` (exit 2) | file memuat nilai yang disembunyikan komando dari agen AI | hilangkan entri tersembunyi, atau ubah satu field dengan `cluster run ... --write -- set image` atau `patch` |
| `NEEDS_TERMINAL` (exit 2) | `cluster shell` butuh seseorang | agen dan script memakai `cluster exec` |
| `PARTIAL_FAILURE` (exit 1) | sebagian cluster dari sebuah selector gagal | baca error tiap cluster di output |

## Referensi

Perintah kubectl yang dikenal `cluster run`:

| Kelompok | Perintah |
|----------|----------|
| Baca | `get` (tabel server, `-o wide\|name\|json\|yaml\|jsonpath=...\|custom-columns=...`, `-w`, `-l`, `-A`), `describe`, `logs`, `events`, `top`, `explain`, `version`, `api-resources`, `api-versions`, `cluster-info`, `auth can-i`, `auth whoami`, `wait` |
| Rollout | `rollout status\|history\|undo\|restart\|pause\|resume`, `set image`, `scale` |
| Ubah | `apply`, `diff`, `create` (`-f`, namespace, configmap, secret, deployment, job, cronjob, service, role, rolebinding, token), `replace`, `delete`, `patch`, `label`, `annotate` |
| Node | `cordon`, `uncordon`, `drain`, `taint` |
| Pod | `run`, `exec`, `cp`, `debug` |
| Lainnya | `certificate approve\|deny`, `config` |
