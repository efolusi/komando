# Service, log, Docker, package, user

Administrasi server sehari-hari, dengan hasil terstruktur sebagai ganti output terminal mentah.

## Memeriksa dan me-restart service

Kebanyakan server Linux memulai dan mengawasi service-nya dengan systemd. systemd menyebut setiap service sebuah unit (`nginx`, `php8.2-fpm`).

```bash
komando svc status @web nginx                 # status, PID utama, jumlah restart, memori
komando svc restart @web nginx --wait 10s     # gagal kecuali nginx aktif dalam 10 detik
```

Jika diketik tanpa argumen di terminal Anda, `komando svc restart` menanyakan server (dari daftar Anda), lalu service-nya, lalu berapa lama menunggu.

```bash
komando svc list web1 --failed                # atau --state running
komando svc enable web1 nginx --now           # aktifkan dan mulai
komando svc stop web1 old-worker
komando svc start web1 worker
komando svc disable web1 old-worker --now     # jangan mulai saat boot, dan hentikan sekarang
komando svc logs web1 nginx                   # journal unit itu (lihat Log)
```

`start`, `stop`, `restart`, `reload`, `enable`, dan `disable` memakai sudo dan melaporkan statusnya sesudahnya (lihat [Sudo](#sudo)).

- `--wait` menerima waktu dengan satuan (`10s`, `2m`); angka tanpa satuan ditolak, kecuali `0` (tanpa menunggu).
- Menghentikan, menonaktifkan, atau me-mask server SSH (`ssh`, `sshd`, `ssh.socket`) butuh `--allow-dangerous`: Anda akan terkunci di luar.

Setelah Anda menulis atau mengubah file unit, muat ulang systemd agar membacanya:

```bash
komando svc daemon-reload web1                # menyebut unit apa pun yang masih butuh dimuat ulang
```

## Log

`logs` membaca satu sumber: journal systemd (`--unit`), sebuah file (`--file`), atau container Docker (`--container`).

```bash
komando logs web1 --unit nginx --since 30m --grep 'error|crit'
```

Jika diketik tanpa argumen, `komando logs` menanyakan server, lalu log mana dan dari berapa lama yang lalu.

```bash
komando logs web1 --unit nginx --follow                 # terus pantau; Ctrl-C untuk berhenti
komando logs web1 --unit nginx -p err --since today     # error dan yang lebih buruk
komando logs @web --file /var/log/nginx/error.log -n 50 --sudo
komando logs web1 --container api --since 10m --timestamps
```

`komando svc logs TARGET UNIT` dan `komando docker logs TARGET CONTAINER` membaca hal yang sama dengan `logs --unit` dan `logs --container`. Flag-nya ada di [Referensi](#reference).

Tanpa `--sudo`, journal hanya menampilkan entri milik Anda sendiri, dan komando memperingatkan Anda. File log yang tidak ada keluar dengan 3.

## Docker

```bash
komando docker ps web1                         # container yang berjalan (--all untuk yang berhenti juga)
komando docker logs web1 api -n 100
komando docker restart web1 api
```

```bash
komando docker stats web1                      # pemakaian CPU, memori, jaringan, dan disk
komando docker images web1
komando docker inspect web1 api                # sebuah container, image, atau objek lain secara lengkap
komando docker pull web1 nginx:1.27            # ambil sebuah image
komando docker stop web1 api                   # juga: start
komando docker rm web1 old-api --dry-run       # hapus sebuah container
komando docker exec web1 api -- php artisan migrate:status
komando docker compose web1 --dir /srv/shop -- up -d --pull always
```

- Membaca (`ps`, `stats`, `images`, `inspect`, `logs`) tidak butuh tambahan apa pun.
- `start`, `stop`, `restart`, `pull`, `compose up`, dan `docker run` lewat `docker raw` mengubah sesuatu, jadi server yang dilindungi bertanya dulu.
- `rm`, `prune`, `compose down -v`, dan penghapusan lainnya menghapus untuk selamanya: di terminal Anda komando meminta Anda mengetik nama server; agen AI atau script menambahkan `--allow-dangerous` setelah seseorang setuju ([Keamanan](safety.md)).
- `docker exec` meneruskan kata-kata perintah apa adanya, tanpa shell, jadi image tidak butuh `sh`. Untuk pipe atau `&&`, tulis shell-nya sendiri: `-- sh -c 'ls /data | wc -l'`. Tambahkan `--read-only` bila hanya melihat; perintah diperiksa seperti untuk `exec`: hanya perintah yang diketahui komando hanya membaca yang berjalan.
- `docker raw TARGET -- ARGS...` menjalankan sub-perintah docker lainnya, dengan aturan yang sama.
- `--sudo` menjalankan docker lewat sudo, bila user Anda tidak ada di grup `docker`.

### Membebaskan ruang disk (docker prune)

```bash
komando docker prune web1 --dry-run                          # apa yang akan hilang, dengan ukuran dan total
komando docker prune web1 --older-than 30d --all --dry-run   # juga image bertag yang tidak terpakai, lebih tua dari 30 hari
komando docker prune web1 --older-than 30d                   # jalankan (meminta Anda mengetik web1)
```

`docker prune` menjalankan `docker system prune`: menghapus container yang berhenti, image dangling, jaringan yang tidak terpakai, dan build cache.

- `--dry-run` tidak mengubah apa pun. Perintah ini bertanya ke docker di server (hanya perintah yang mendaftar) dan menampilkan setiap container, image, dan volume yang akan hilang, build cache yang bisa dibebaskan docker, dan total. Ukuran image menghitung layer bersama di setiap image, jadi ruang yang benar-benar dibebaskan bisa lebih kecil.
- `--older-than 30d` mempertahankan semua yang dibuat dalam 30 hari terakhir (filter `until` milik docker).
- `--all` menghapus setiap image yang tidak dipakai container, bukan hanya yang dangling; deploy berikutnya menariknya lagi.
- `--volumes` juga menghapus volume anonim yang tidak terpakai. Itu data: lihat dry run dulu. Tidak bisa digabung dengan `--older-than` (docker tidak punya filter usia untuk volume).
- Eksekusi sungguhan menghapus, jadi dikonfirmasi seperti `docker rm`.

## Package

`pkg` bekerja dengan apt, dnf, yum, apk, zypper, dan pacman; komando mencari tahu mana yang dipakai setiap server.

```bash
komando pkg upgradable all --refresh            # segarkan indeks package dulu
komando pkg install @web htop
```

Jika diketik tanpa argumen, `komando pkg install` menanyakan server, lalu package-nya.

```bash
komando pkg rm web1 htop
komando pkg installed web1 nginx openssl        # versi yang terinstal (semuanya tanpa nama)
komando pkg upgrade web1 --dry-run              # apa yang akan di-upgrade
komando pkg upgrade web1                        # semuanya, atau sebut package-nya
komando pkg update web1                         # hanya segarkan indeks package
```

- `install` dan `rm` melaporkan apa yang berubah (`changed: false` bila tidak ada yang perlu dikerjakan). Package yang tidak dikenal keluar dengan 3 (`PACKAGE_NOT_FOUND`).
- `upgradable` menyatakan seberapa lama indeks package, dan menyarankan `--refresh` bila lebih dari sehari. `--refresh` menulis ulang indeks package server sebagai root, jadi itu perubahan: di server yang dilindungi `pkg upgradable --refresh` dan `pkg security --refresh` butuh jawaban ya, dan dry run tidak pernah menyegarkan.
- Menghapus package yang dibutuhkan server (openssh-server, sudo, systemd, libc, dan sejenisnya) butuh `--allow-dangerous`, bagaimanapun nama ditulis (`openssh-server:amd64`, `sudo.x86_64`, `openssh.server`). Di server apt, menghapus package yang akan membawa salah satunya ikut (`libssl3` membawa openssh-server) berhenti dengan `POLICY_BLOCKED` sebelum apa pun dihapus.
- Nama package adalah nama yang persis: tanpa opsi, pola, atau `-` di akhir. Untuk `.deb` atau `.rpm` lokal, pakai `komando upload` dan `komando exec`.

### Update keamanan

`pkg security` dan `pkg upgrade --security` menangani satu putaran patch: hanya update keamanan, satu server sekali waktu, dengan melihat setiap server sebelum dan sesudahnya.

```bash
komando pkg security @web --refresh              # apa yang menunggu, dan keadaan tiap server
komando pkg upgrade @web --security --dry-run    # rencananya, dan penghentian apa pun yang akan ditemui
komando pkg upgrade @web --security              # patch, satu server sekali waktu
komando pkg upgrade @web --security --keep-going # jangan berhenti di server yang berubah
```

- `pkg security` hanya melihat. Perintah ini mencantumkan update keamanan (apt: package dari pocket `-security`; dnf dan yum: update dengan pemberitahuan keamanan) dan keadaan server: container yang berjalan, unit yang gagal, update yang menunggu, apakah reboot dibutuhkan, dan service yang masih menjalankan kode lama (dari `needrestart` atau `needs-restarting`). Semuanya berasal dari pemeriksaan yang sama dengan `komando facts`, jadi keduanya menyatakan hal yang sama.
- Perintah ini juga menilai OS (`os_support`, seperti di `komando facts`). Pada OS yang sudah lewat end of life, daftar bisa kosong sementara server tidak aman: repository tidak menerbitkan perbaikan baru untuknya. komando lalu menyatakannya di `warnings`.
- `pkg upgrade --security` hanya menginstal update itu. Di server apt komando memakai `unattended-upgrade` bila terinstal (memilih origin keamanan dan mengikuti pengaturan server sendiri), kalau tidak `apt-get install --only-upgrade` untuk package yang tercantum; file konfigurasi yang berubah dipertahankan. Bila unattended-upgrades server diatur untuk reboot sendiri, komando memakai apt-get sebagai gantinya. dnf dan yum menjalankan `upgrade --security`.
- needrestart tidak me-restart service selama eksekusi. Hasilnya mencantumkan service yang perlu di-restart (`services_need_restart`): restart dengan `komando svc restart` saat waktunya cocok.
- Setelah setiap server, komando membandingkan keadaannya dengan sebelumnya. Container yang berjalan berkurang, unit yang baru gagal, atau package esensial yang dihapus menghentikan putaran dengan `UNEXPECTED_CHANGE` (exit 8); server lain tetap seperti semula dan dicantumkan di `not_run`. komando menunggu sampai semenit agar container kembali lebih dulu. `--keep-going` melanjutkan setelah kegagalan atau perubahan.
- komando tidak pernah mereboot. `reboot_required` menyatakan kapan server butuh reboot; pakai `komando reboot` ([Reboot](#reboot)).
- Upgrade berjalan terlepas di server, jadi koneksi yang putus tidak merusaknya di tengah jalan. `--security` menunggu sampai 30 menit per server; `--timeout` mengubahnya. Setelah `TIMEOUT` upgrade tetap berjalan: jalankan `pkg security` lagi nanti untuk melihat apa yang tersisa.
- Ini perubahan seperti `pkg upgrade`: server yang dilindungi bertanya dulu. Update yang akan menghapus package esensial berhenti dengan `POLICY_BLOCKED` sebelum apa pun berubah (server apt).
- Indeks package yang usang menyembunyikan perbaikan baru: komando memperingatkan bila lebih dari sehari; tambahkan `--refresh`.

## Reboot

```bash
komando reboot web1 --dry-run                 # apa yang akan berjalan, dan apakah akan diblokir
komando reboot @web                           # satu server sekali waktu; meminta Anda mengetik jumlahnya
komando reboot @web --wait 10m
```

`komando reboot` me-restart satu server sekali waktu. Untuk setiap server, komando meminta reboot (`systemctl reboot`, lewat sudo), menunggu sampai SSH menjawab lagi, dan memeriksa bahwa server benar-benar mulai baru (boot ID baru). Baru setelah itu komando melanjutkan ke server berikutnya.

- `--wait` adalah berapa lama tiap server boleh kembali (default 5m).
- Server yang tidak kembali tepat waktu menghentikan sisanya dengan `REBOOT_TIMEOUT` (exit 7). Kegagalan lain juga menghentikan sisanya. Server setelahnya dicantumkan di `not_rebooted`.
- Reboot bersifat merusak: di terminal Anda komando meminta Anda mengetik nama server (beberapa: jumlahnya); agen AI atau script menambahkan `--allow-dangerous` setelah seseorang setuju.

## User

```bash
komando user list web1                       # NAME UID HOME SHELL ADMIN GROUP LOCKED
komando user add web1 alice --key alice --admin
```

Jika diketik tanpa argumen, `komando user add` menanyakan server, lalu nama user.

```bash
komando user list web1 --all                 # termasuk akun sistem
komando user add @web app --pubkey 'ssh-ed25519 AAAA... app@example.com' --shell /bin/sh
komando user lock web1 alice                 # SSH key juga berhenti berfungsi
komando user unlock web1 alice
komando user rm web1 alice --remove-home --dry-run
```

- `user add` aman dijalankan lagi: user yang sudah ada tidak dibuat dua kali, tetapi shell, key, dan grup admin-nya disesuaikan. `--key` mengotorisasi key dari daftar key komando, `--pubkey` sebaris key, dan `--admin` menambahkan user ke grup `sudo` (Debian) atau `wheel` (RHEL, Alpine). Berikan `--key` atau `--pubkey`, tidak keduanya.
- `user lock` mengunci kata sandi dan membuat akun kedaluwarsa, sehingga SSH key juga berhenti berfungsi, tanpa menghapus apa pun. Mengunci atau menghapus `root` atau user yang dipakai komando untuk login butuh `--allow-dangerous`: komando tidak bisa login sesudahnya untuk membatalkannya, dan root adalah akun yang memperbaiki server. Hal yang sama berlaku untuk `user add --shell` dengan shell yang tidak bisa dipakai login siapa pun (`/usr/sbin/nologin`, `/bin/false`) untuk kedua akun itu.
- `user list` membaca status kunci lewat sudo (`--no-sudo` menghilangkannya). `admin_group` berarti "ada di grup sudo, wheel, atau admin"; aturan di `sudoers.d` tidak dibaca.
- `user rm` menghapus untuk selamanya: di terminal Anda komando meminta Anda mengetik nama server; agen AI atau script menambahkan `--allow-dangerous` setelah seseorang setuju. Coba `--dry-run` dulu.

## Pekerjaan terjadwal (cron)

komando mengelola entri crontab dengan ID yang Anda pilih. `cron set` dengan ID yang sama menggantikan entri, bukan menambah entri kedua, dan baris lain di crontab dipertahankan apa adanya.

```bash
komando cron set db1 nightly-backup '/usr/local/bin/backup.sh >> /var/log/backup.log 2>&1' --schedule '0 2 * * *'
komando cron list db1
```

Jika diketik tanpa argumen, `komando cron set` menanyakan server, ID, perintah, dan jadwalnya.

```bash
komando cron set @web clean-tmp 'find /tmp -mtime +7 -delete' --schedule @daily
komando cron rm db1 nightly-backup           # data: {"removed": 1}
komando cron list db1 --user www-data        # crontab user lain (memakai sudo)
komando cron list db1 --user root            # crontab root
```

- ID memakai huruf, angka, `-`, dan `_`.
- `--schedule` menerima lima field (`'*/5 * * * *'`) atau `@hourly`, `@daily`, `@weekly`, `@monthly`, `@yearly`, `@reboot`. Diperiksa sebelum apa pun ditulis.
- `%` di dalam perintah di-escape untuk Anda.

## Sudo

Perintah yang mengubah sesuatu memakai sudo kecuali Anda menambahkan `--no-sudo` (`svc`, `pkg`, `user`, `reboot`, `recipe run`): tambahkan saat Anda login sebagai root. Perintah yang membaca memakai sudo hanya bila Anda memintanya: `--sudo` untuk `logs`, `docker`, dan `net ports`, `--user` untuk crontab user lain.

Bila sudo meminta kata sandi yang tidak dimiliki komando, atau user yang dipakai login tidak boleh memakai sudo, perintah berhenti dengan `PERMISSION_DENIED` dan hint yang menyebut perbaikannya (`komando host edit web1 --sudo-ref secret:web1-sudo`, lihat [Kata sandi sudo](servers.md#sudo-passwords-and-the-vault)). Server tanpa sudo sama sekali memberi `TOOL_MISSING` (tambahkan `--no-sudo` sebagai root). Hal yang sama berlaku untuk `pkg`, `user`, `cron --user`, setiap perintah `docker` dengan `--sudo` (sebagai root, hilangkan `--sudo`), dan recipe yang memakai sudo.

## Pekerjaan utuh, langkah demi langkah

Setiap langkah adalah sebuah perintah; orang dan agen AI mengetik perintah yang sama.

```bash
# sebuah service bermasalah
komando svc list web1 --failed                       # apa yang rusak?
komando logs web1 --unit nginx --since 30m --grep error
komando fs replace web1 /etc/nginx/nginx.conf --old A --new B --backup --dry-run
komando svc restart web1 nginx --wait 10s --dry-run
komando svc restart web1 nginx --wait 10s            # gagal kecuali aktif dalam 10 detik

# satu putaran patch
komando pkg security @web --refresh                  # apa yang menunggu, dan keadaan tiap server
komando pkg upgrade @web --security --dry-run
komando pkg upgrade @web --security                  # satu server sekali waktu
komando reboot web1 --dry-run                        # saat reboot_required menyatakannya

# seseorang bergabung, lalu pergi
komando user add web1 alice --key alice --admin
komando user lock web1 alice                         # menghentikan login, menyimpan file
komando user rm web1 alice --remove-home --dry-run

# pekerjaan malam hari
komando cron set db1 nightly-backup '/usr/local/bin/backup.sh' --schedule '0 2 * * *'
komando cron list db1
komando cron rm db1 nightly-backup

# disk penuh di server Docker
komando recipe run disk web1
komando docker prune web1 --older-than 30d --dry-run # apa yang akan hilang, dan seberapa banyak
```

## Batasan

- `svc` hanya bekerja pada service sistem: komando tidak mengelola unit milik user sendiri (`systemctl --user`); pakai `komando exec` untuk itu.
- `svc` dan `logs --unit` butuh systemd; server tanpanya (kebanyakan container) berhenti dengan `NO_SYSTEMD`.
- Hanya di server apt, `pkg rm` dan `pkg upgrade --security` memeriksa apakah package esensial akan ikut hilang bersama package lain; package manager lain tidak diperiksa dengan cara ini.
- `pkg security` tidak mencantumkan apa pun di dnf/yum untuk repository tanpa pemberitahuan keamanan (misalnya CentOS). Server apk, zypper, dan pacman dicantumkan di `meta.skipped`: pakai `pkg upgrade` di sana.
- `pkg` hanya menerima nama package yang persis; untuk `.deb` atau `.rpm` lokal, pakai `upload` dan `exec`.
- `docker prune --volumes` tidak bisa digabung dengan `--older-than`.
- komando tidak pernah mereboot sebagai bagian dari putaran patch.
- Di Alpine, `user add`, `lock`, `unlock`, dan `rm` butuh package `shadow` (`useradd`, `usermod`, `userdel`).
- `user list` tidak membaca aturan di `sudoers.d`.
- `svc logs` tidak menerima `--file` atau `--container`; pakai `logs`.

## Pemecahan masalah

| Kode error | Artinya | Yang perlu dilakukan |
|------------|---------|----------------------|
| `UNIT_NOT_FOUND` | tidak ada service dengan nama itu (exit 3) | periksa nama dengan `komando svc list TARGET` |
| `NO_SYSTEMD` | server berjalan tanpa systemd (exit 3) | baca lognya dengan `--file` atau `komando docker logs` |
| `PERMISSION_DENIED` | sudo meminta kata sandi yang tidak dimiliki komando, atau user tidak boleh memakai sudo | simpan kata sandi sudo: `komando host edit SERVER --sudo-ref secret:NAME` |
| `TOOL_MISSING` | sudo, atau tool yang dibutuhkan perintah, tidak terinstal (exit 3) | sebagai root tambahkan `--no-sudo`; di Alpine, `komando pkg install TARGET shadow` untuk `user` |
| `PACKAGE_NOT_FOUND` | tidak ada package seperti itu di indeks package server | periksa nama; `komando pkg update TARGET` bila package-nya baru |
| `UNEXPECTED_CHANGE` | server berubah setelah di-patch (exit 8); sisanya belum di-patch | periksa dengan `komando docker ps` dan `komando svc list --failed`, lalu jalankan lagi atau tambahkan `--keep-going` |
| `REBOOT_TIMEOUT` | server tidak kembali dalam `--wait` (exit 7) | periksa konsol server; server setelahnya belum direboot |
| `TIMEOUT` | upgrade `--security` berjalan lebih lama dari `--timeout`; upgrade berlanjut | jalankan `komando pkg security` nanti untuk melihat apa yang tersisa |
| `POLICY_BLOCKED` | penghapusan, reboot, atau penghapusan package esensial tanpa `--allow-dangerous` | periksa dengan `--dry-run`, tanyakan kepada seseorang, lalu tambahkan `--allow-dangerous` |

## Referensi

Flag `logs` (juga untuk `svc logs` dan `docker logs`, di tempat yang cocok):

| Flag | Fungsinya |
|------|-----------|
| `-u`, `--unit UNIT` | Membaca journal systemd service ini. |
| `--file PATH` | Membaca file log ini. |
| `-c`, `--container NAME` | Membaca log container Docker ini. |
| `-n`, `--limit N` | N baris terakhir (default 200). |
| `--grep REGEX` | Hanya baris yang cocok (extended regex, huruf besar atau kecil). |
| `--since` / `--until` | Rentang waktu: waktu mundur dari sekarang (`30m`, `2h`, `7d`), `today`, `yesterday`, atau tanggal (`'2026-01-02 10:00'`). Untuk container, `today` dan `yesterday` adalah tengah malam server sendiri. |
| `-p`, `--priority` | Prioritas journal dan yang lebih buruk: `emerg` sampai `debug`, atau 0-7. |
| `-f`, `--follow` | Terus mencetak baris baru sampai Ctrl-C. |
| `-s`, `--sudo` | Membaca seluruh journal atau file yang dilindungi. Sebagai root, komando tidak membaca file lewat link yang dibuat user server lain (`IS_A_SYMLINK`), dan `--follow` terus membaca file yang dibukanya. |
| `--timestamps` | Menampilkan kapan setiap baris log container ditulis (hanya dengan `--container`; baris journal sudah punya waktunya). |
