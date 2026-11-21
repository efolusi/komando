# Pemeriksaan kesehatan dan jaringan

Cari tahu server apa ini, apakah sehat, dan apa yang bisa dijangkaunya.

## Mengenali sebuah server

```bash
komando facts web1
```

Jalankan `facts` lebih dulu pada server yang belum dikenal. Perintah ini melaporkan OS, CPU, memori, disk, beban, alamat IP, package manager, init system, dan tool yang terinstal, sehingga orang atau agen tahu perintah mana yang cocok. Perintah ini juga menyebut apa yang perlu diperhatikan. Jika diketik tanpa argumen di terminal, `komando facts` menanyakan servernya (dari daftar); `komando facts @web` memeriksa banyak server sekaligus.

```text
● web1  Ubuntu 20.04.6 LTS · x86_64 · 4 cpu · 7.8 GB RAM · disk / 63% · load 0.12 · up 34d
  support:   UNSUPPORTED: no security updates
  updates:   12 pending, security unknown · index 11d old · REBOOT REQUIRED · restart needed: nginx.service
  access:    user deploy · sudo without password · 1 failed units
  docker:    docker 24.0.7 · swarm manager · 14 running
  pm2:       (deploy) api online, worker online
  ports:     22 sshd, 80 nginx, 443 nginx, 3000 node (local only)
  units:     pm2-deploy.service (active), backup.timer (active)
  warning: Ubuntu 20.04.6 LTS: standard support ended 2025-05-31 and Ubuntu Pro (ESM) is not enabled, so it gets no security updates; ...
```

| Baris | Yang diberitahukannya |
|-------|-----------------------|
| support | Apakah OS masih mendapat update keamanan: `supported`, `extended` (Ubuntu Pro ESM menyala, atau Debian LTS), `unsupported`, atau `unknown`. |
| updates | Update yang menunggu dan berapa banyak di antaranya update keamanan, dibaca dari indeks package server apa adanya (komando tidak menyegarkannya; `komando pkg update` yang melakukannya). Reboot yang dibutuhkan, dan service yang masih memakai library lama (bila `needrestart` terinstal dan komando boleh memakai sudo). |
| access | User yang dipakai login, dan apakah sudo bekerja tanpa kata sandi. |
| docker | Versi Docker, peran Swarm (manager, worker, none), dan berapa container yang berjalan. |
| pm2 | Aplikasi Node.js yang dijalankan PM2, di luar container. |
| ports | Port yang mendengarkan dan program di balik masing-masing. Tanpa root atau sudo tanpa kata sandi, hanya program milik user sendiri yang punya nama. |
| units | Service dan timer yang ditambahkan manual di `/etc/systemd/system` (bukan dari package). |

Di JSON, `disks` mencantumkan setiap file system sungguhan: `mount`, `device`, `size_mb`, `used_mb`, `avail_mb`, dan `used_pct`.

### Hanya angkanya, cepat

```bash
komando facts web1 --only load,mem,disks -o json
```

`--only` hanya menjalankan probe untuk bagian yang disebut, dalam sekitar satu detik, untuk aplikasi atau script yang melakukan polling: `load` (`load` 1, 5, dan 15 menit, `cpus`), `mem` (`mem_total_mb`, `mem_available_mb`, `swap_total_mb`, `swap_free_mb`), `disks` (`disks`, `disk_root_total_gb`, `disk_root_used_pct`), dan `system` (`os`, `os_version`, `os_pretty`, `uptime_sec`). Tanpa indeks package, Docker, port, unit, atau sudo; key dari bagian lain dihilangkan. Key ssh-gate yang read-only bisa menjalankannya. Nilai yang tidak dimiliki server adalah null; server tanpa `/etc/os-release` (macOS, BSD) memberi `os` dan `os_version` dari `uname`.

`facts` hanya membaca. Perintah ini tidak pernah menyegarkan indeks package atau memulai apa pun, dan memakai sudo hanya bila sudo sudah bekerja tanpa kata sandi (tidak pernah memintanya).

### Arti "unknown"

Bila komando tidak bisa membaca sesuatu, JSON menyatakan `null` (dan teks menyatakan "unknown"), tidak pernah `0` atau `false`. Ini paling penting untuk update keamanan: server yang OS-nya sudah lewat masa dukungan tidak mendapat update keamanan baru, jadi indeks package-nya tidak menunjukkan yang menunggu. komando melaporkannya sebagai unknown, dengan peringatan, bukan `0` yang menenangkan. Agen sebaiknya membaca `warnings` lebih dulu.

### Field JSON

Di JSON (`-o json`), `data` tiap server punya field berikut selain yang dasar (`os`, `os_version`, `kernel`, `cpus`, `mem_total_mb`, `tools` ...):

| Field | Artinya |
|-------|---------|
| `os_support` | `status`, `standard_support_until`, `extended_support_until`, `extended_by` (`ubuntu-pro-esm`, `debian-lts`), `past_standard_support`, `esm_enabled` (Ubuntu), `dates_checked` |
| `updates` | `total`, `security`, `source`, `index_age_days` |
| `reboot_required`, `reboot_packages` | reboot dibutuhkan, dan untuk package mana (Debian dan Ubuntu; `kernel` bila needrestart melihat kernel yang lebih baru dari yang berjalan); di dnf/yum dari `needs-restarting -r` |
| `services_need_restart` | service yang menjalankan kode lama, dari `needrestart` (atau `needs-restarting -s` di dnf/yum); `null` tanpa keduanya, atau tanpa sudo |
| `sudo_nopasswd`, `login_user` | pemeriksaan yang sama dengan `komando test` |
| `docker` | `installed`, `version`, `daemon_reachable`, `server_version`, `swarm`, `containers_running` |
| `pm2` | `daemon_users` (setiap user yang menjalankan PM2), `apps` milik user login (`name`, `status`, `pid`, `restarts`, `cpu_pct`, `memory_mb`), `other_users` |
| `listening` | `source` (`ss`, `netstat`, atau `/proc`), `process_names` (`all`, `own`, atau `none`), `ports[]` (`proto`, `address`, `port`, `process`, `pid`) |
| `custom_units` | `unit`, `enabled`, `active` untuk setiap unit yang ditambahkan manual; `failed_units` menghitung yang gagal |
| `warnings` | hal yang tidak boleh terlewat oleh agen, dalam kata-kata biasa |

Hanya nama yang disimpan, tidak pernah command line atau lingkungan (keduanya bisa memuat kata sandi), dan teks yang tampak seperti secret disembunyikan.

### Asal tanggal dukungan

komando punya tabel kecil bawaan untuk Ubuntu LTS, Debian, RHEL dan turunannya (Rocky, AlmaLinux, Oracle Linux, CentOS), Alpine, dan Amazon Linux, diambil dari halaman rilis tiap vendor (sumbernya dicantumkan di `internal/cli/facts_support.go`). JSON menampilkan tanggal pemeriksaannya (`os_support.dates_checked`). Rilis yang tidak ada di tabel, seperti rilis Ubuntu yang berumur pendek, adalah `unknown`. Untuk Ubuntu, komando juga bertanya ke `pro status` apakah ESM menyala.

## Memeriksa kesehatan server

komando datang dengan pemeriksaan siap pakai (recipe bawaan). Jalankan salah satunya di target mana pun:

```bash
komando recipe run health @web                    # uptime, beban, memori, disk, service yang gagal
komando recipe list                               # semuanya, beserta apa yang dijalankannya
komando recipe list --category security           # satu kategori
komando recipe run top-mem web1
komando recipe run big-dirs web1 --var path=/srv
komando recipe run oom all --var since=-2h
```

Jika diketik tanpa argumen, `komando recipe run` menanyakan recipe, lalu targetnya.

| Kategori (`--category`) | Recipe |
|-------------------------|--------|
| system | `health`, `disk`, `inodes`, `memory`, `big-dirs`, `big-files`, `cron-all`, `time-sync` |
| process | `top-cpu`, `top-mem`, `process`, `oom` |
| network | `connections`, `firewall` |
| web | `nginx-test`, `nginx-sites`, `apache-test` |
| security | `auth-failures`, `last-logins`, `sshd-config`, `sudoers` |
| maintenance (ini mengubah sesuatu) | `apt-clean`, `drop-caches`, `journal-vacuum` |

Sebagian recipe punya isian dengan nilai default, misalnya `big-dirs` menerima `--var path=/srv --var depth=2`. `komando recipe list` menampilkan isian tiap recipe. Waktu mundur dari sekarang ditulis dengan minus (`since=-2h`), seperti yang dibaca journalctl.

Pemeriksaan yang punya perintah sendiri bukan recipe:

| Pemeriksaan | Perintah |
|-------------|----------|
| port yang mendengarkan | `komando net ports TARGET --sudo` |
| sebuah nama di DNS | `komando net dns TARGET NAME` |
| sebuah URL menjawab | `komando net http TARGET URL` |
| unit yang gagal | `komando svc list TARGET --failed` |
| kesalahan di journal | `komando logs TARGET -p err --since 1h --sudo` |
| update yang menunggu | `komando pkg upgradable TARGET` |
| update keamanan | `komando pkg security TARGET` |
| container | `komando docker ps TARGET --all` |
| cluster Kubernetes | `komando cluster status CLUSTER` |
| sesi database | `komando db activity CONN` |
| sebuah cache | `komando cache info CONN` |
| sertifikat | `komando cert check TARGET` |
| pembersihan Docker | `komando docker prune TARGET --dry-run` |

Untuk menyimpan pemeriksaan sendiri, lihat [Recipe](commands.md#recipes-ready-made-and-saved-commands).

## Memeriksa sertifikat TLS

`cert check` memberi tahu kapan sertifikat kedaluwarsa, sebelum pengunjung yang tahu. Perintah ini hanya membaca.

```bash
komando cert check web1                               # sertifikat yang dipakai web server di web1
```

Jika diketik tanpa argumen, `komando cert check` menanyakan server atau URL.

```bash
komando cert check @web --warn 14d                   # tandai yang kedaluwarsa dalam 14 hari
komando cert check https://shop.example.com           # sertifikat yang dikirim situs web itu
komando cert check api.example.com:8443 intranet.example.com:443 --via bastion
komando cert check web1 --path /etc/ssl/private/site.pem
```

- Di server, komando menemukan sertifikatnya sendiri: milik certbot (`/etc/letsencrypt/live/*/cert.pem`) dan file yang dipakai nginx (`ssl_certificate`), haproxy (`crt`), dan apache (`SSLCertificateFile`). Tambahkan lagi dengan `--path`. File yang butuh root dibaca dengan sudo hanya bila sudo bekerja tanpa kata sandi; komando tidak pernah memintanya. Hanya bagian sertifikat dari sebuah file yang dibaca: private key di file yang sama tidak pernah meninggalkan server. Bila certbot terinstal, hasilnya juga menampilkan timer pembaruannya dan apakah pembaruan terakhir gagal.
- Untuk situs web (`https://NAME`, `NAME:PORT`) atau conn yang memakai TLS, komando tersambung dari komputer ini, atau lewat `--via` (server atau VPN), membaca sertifikat yang dikirim situs itu, dan memeriksa bahwa sertifikat itu tepercaya dan cocok dengan namanya.
- Setiap sertifikat menampilkan namanya, penerbit, tanggal kedaluwarsa, sisa hari, asalnya, dan sebuah status: `ok`, `expiring`, `expired`, `not_yet_valid`, `not_trusted`, atau `unreadable` (tidak ada, atau butuh root).

| Hasil | Exit code |
|-------|-----------|
| setiap sertifikat baik-baik saja | 0 |
| satu kedaluwarsa dalam `--warn` (default 30d), sudah kedaluwarsa, tidak tepercaya, atau pembaruan terakhir certbot gagal (`CERT_PROBLEMS`) | 1 |
| server atau situs tidak bisa dijangkau | 4 (atau 7 bila waktu habis) |

File `unreadable` dicantumkan tetapi tidak membuat perintah gagal.

## Memeriksa jaringan dari server

Pemeriksaan ini berjalan *dari* server, jadi terlihat apa yang mereka lihat:

```bash
komando net check @web 10.0.0.5:5432 10.0.0.6:6379   # bisakah tiap server membuka koneksi TCP?
```

Jika diketik tanpa argumen, `komando net check` menanyakan servernya, lalu alamatnya.

```bash
komando net http web1 https://example.com --expect 2xx
komando net ports web1 --sudo                         # PROTO ADDRESS PORT PROCESS PID
komando net dns web1 api.example.com
komando net dns web1 example.com --type MX            # MX, TXT, CNAME, NS ... (dengan atau tanpa dig di server)
```

| Perintah | Gagal bila | Exit code |
|----------|-----------|-----------|
| `net check` | sebuah port tidak menjawab (`PORT_CLOSED`); hasilnya menyebut alasannya: `refused`, `timeout` (setelah 5 detik), `dns`, atau `unreachable` | 5 |
| `net http` | tidak ada yang menjawab (`NO_RESPONSE`, dalam 15 detik, atau `--timeout`) | 4 |
| `net http --expect 2xx` | statusnya lain (`UNEXPECTED_STATUS`); `--expect 200` menyebut satu status | 5 |
| `net dns` | nama tidak ter-resolve (`NXDOMAIN`) atau tidak punya record jenis itu (`NO_RECORDS`) | 3 |

- `net ports` memakai `ss`, atau `netstat` di sistem kecil seperti busybox. Tambahkan `--sudo` untuk melihat nama proses.
- `net dns` tanpa `--type` menampilkan alamat yang akan dituju server. `--type` menerima A, AAAA, CNAME, MX, NS, TXT, SOA, SRV, PTR, atau CAA. A dan AAAA bekerja di mana saja; yang lain memakai `dig` di server, atau, bila tidak ada, komando menanyakan resolver server itu sendiri lewat koneksi.
- `net http` hanya menerima URL `http://` dan `https://`. Perintah ini melaporkan status, waktu, IP yang dijangkau, dan redirect apa pun.

## Batasan

- `facts` memakai sudo hanya bila sudo bekerja tanpa kata sandi; tidak pernah memintanya. Tanpa root atau sudo tanpa kata sandi, hanya program milik user sendiri di `ports` yang punya nama.
- `facts` tidak pernah menyegarkan indeks package, jadi `updates` sesegar indeks milik server itu sendiri.
- Tanggal dukungan mencakup Ubuntu LTS, Debian, RHEL dan turunannya, Alpine, dan Amazon Linux; rilis lain adalah `unknown`.
- `facts` hanya menyimpan nama, tidak pernah command line atau lingkungan.
- `cert check` membaca file yang butuh root hanya bila sudo bekerja tanpa kata sandi; file seperti itu tampil sebagai `unreadable` dan tidak membuat perintah gagal.
- `net check` menyerah pada sebuah port setelah 5 detik; `net http` setelah 15 detik (atau `--timeout`).
- `net http` hanya menerima URL `http://` dan `https://`.
- `net dns --type` selain A dan AAAA memakai `dig` di server; bila tidak ada, komando menanyakan resolver server (`/etc/resolv.conf`) sendiri lewat TCP melalui koneksi SSH, yang butuh TCP forwarding di server (`AllowTcpForwarding`, menyala secara default).
- Recipe dengan isian menolak nilai `--var` yang diawali `-`, kecuali angka atau waktu mundur dari sekarang (lihat [Recipe](commands.md#recipes-ready-made-and-saved-commands)).

## Pemecahan masalah

| Kode kesalahan | Artinya | Yang perlu dilakukan |
|------------|---------|----------------------|
| `RECIPE_NOT_FOUND` | tidak ada recipe dengan nama itu (exit 3) | lihat daftarnya dengan `komando recipe list`; sebagian pemeriksaan adalah perintah (tabel di atas) |
| `UNKNOWN_VAR` | `--var` menyebut isian yang tidak dimiliki recipe | periksa isiannya dengan `komando recipe list` |
| `CERT_PROBLEMS` | sertifikat kedaluwarsa dalam `--warn`, sudah kedaluwarsa, tidak tepercaya, atau pembaruan terakhir certbot gagal (exit 1) | perbarui atau ganti sertifikat yang ditandai hasilnya |
| `PORT_CLOSED` | `net check`: sebuah port tidak menjawab (exit 5) | hasilnya menyebut alasannya (`refused`, `timeout`, `dns`, `unreachable`): periksa alamat, firewall, atau service |
| `NO_RESPONSE` | `net http`: tidak ada yang menjawab (exit 4) | periksa URL, dan bahwa server bisa menjangkaunya: `komando net check SERVER HOST:443` |
| `UNEXPECTED_STATUS` | `net http --expect`: status lain yang kembali (exit 5) | periksa URL dan service di baliknya |
| `NXDOMAIN` | `net dns`: nama tidak ter-resolve dari server ini (exit 3) | periksa nama dan DNS server (`/etc/resolv.conf`) |
| `NO_RECORDS` | `net dns`: tidak ada record jenis itu (exit 3) | periksa nama dan `--type` |
| `DIG_MISSING` | `net dns --type` tidak menemukan `dig` di server, dan komando tidak bisa menanyakan resolver-nya sendiri (tidak ada nameserver, atau tanpa TCP forwarding) | instal package yang disebut kesalahan |
