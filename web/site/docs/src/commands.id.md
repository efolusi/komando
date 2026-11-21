# Menjalankan perintah

Jalankan perintah dan script di satu atau banyak server, mulai tugas panjang, dan simpan perintah yang sering Anda pakai.

## Menjalankan perintah

```bash
komando exec web1 -- uptime
```

```text
 10:42:01 up 34 days,  2:11,  1 user,  load average: 0.12, 0.08, 0.05
```

Jika diketik tanpa argumen di terminal Anda, `komando exec` menanyakan server (dari daftar Anda), lalu perintahnya.

Semua yang ada setelah `--` adalah perintahnya. Perintah berjalan lewat login shell server, di semua server terpilih secara paralel. Flag komando sendiri ditulis sebelum `--`: `exec web1 -- uptime --dry-run` ditolak, karena `--dry-run` di sana akan menjadi bagian dari perintah dan perintahnya benar-benar berjalan. Bila perintah di server menerima flag seperti itu sendiri (`apt-get upgrade --dry-run`), berikan sebagai satu string dengan `-c`.

`--` wajib ada: `komando exec web1 apt-get install -y nginx` adalah error penggunaan (exit 2) dan tidak menjalankan apa pun, karena komando akan membaca `-y` sebagai `--yes` miliknya sendiri. Hal yang sama berlaku untuk setiap perintah yang menyerahkan kata-kata ke program lain: `job start`, `docker exec`, `docker compose`, `docker raw`, `cluster exec`, `cluster shell`, `cluster run`, dan `cache run`.

```bash
komando exec @web -P 20 -- 'df -h / | tail -1'           # sampai 20 server sekaligus
komando exec tag:prod --sudo -- systemctl is-active nginx
komando exec db1 --read-only -- 'df -h /var/lib/postgresql'   # SQL sendiri: komando db query
```

| Flag | Fungsinya |
|------|-----------|
| `-c`, `--cmd 'COMMAND'` | Berikan perintah sebagai satu string, bukan setelah `--`. |
| `-s`, `--sudo` / `--sudo-user NAME` | Jalankan sebagai root, atau sebagai user lain (memakai kata sandi `--sudo-ref` server bila diatur). |
| `-C`, `--dir PATH` | Jalankan di folder ini di server. |
| `-e`, `--env KEY=VALUE` | Ekspor sebuah variabel lebih dulu (bisa diulang; koma tetap menjadi bagian nilai). |
| `--timeout 10m` | Batas waktu per server (default 5m). |
| `-P`, `--parallel 20` | Berapa server sekaligus (default 10). |
| `--fail-fast` | Jangan mulai server lagi setelah kegagalan pertama. |
| `--stream` | Cetak output secara langsung, saat datang, satu baris utuh sekali waktu (di JSON: satu event per baris). |
| `--stdin-file FILE` | Kirim file lokal sebagai input perintah (`-` = input komando sendiri). |
| `--pty` | Beri perintah sebuah terminal (sebagian tool membutuhkannya). |
| `--read-only` | Nyatakan perintah hanya melihat (lihat di bawah). |

### Hasil dan exit code

Setiap server mendapat output, error, exit code, dan waktu jalannya sendiri. Bila perintah gagal di server mana pun, komando keluar dengan 5. Bila komando tidak bisa tersambung atau login, komando keluar dengan 4, kecuali saat server tidak menjawab dalam `--connect-timeout` (`CONNECT_TIMEOUT`): itu keluar dengan 7, seperti timeout lainnya.

Dengan `-o text`, satu server dicetak seperti `ssh`: outputnya, errornya, dan penutup `Error: server web1 failed (exit 3)` saat gagal. Beberapa server mendapat satu blok masing-masing:

```text
=== web1 [ok, exit 0]
active
=== web2 [failed: exit 3]
[stderr] inactive
Error: 1 of 2 failed: web2 (exit 3)
```

Dengan `--fail-fast`, server yang tidak pernah dimulai dilaporkan sebagai skipped, bukan gagal. Dengan `--parallel 1`, server berjalan satu per satu, menurut urutan nama. Output yang lebih panjang dari `--max-output` (256 KiB per stream) dipotong, dan komando menyatakannya.

### Saat koneksi putus

Kadang tautan ke server putus saat perintah berjalan: VPN terputus, Wi-Fi berganti, firewall memutus koneksi. komando lalu tidak bisa tahu bagaimana perintah berakhir. Hasil server itu menyatakannya:

- kode error `CONNECTION_LOST`, exit code 4 (server lain mempertahankan hasilnya sendiri; exit code terburuk yang menang, seperti biasa);
- output yang tiba sebelum putus, dengan `exit_code` -1 (tidak diketahui);
- di mode teks: `=== web2 [failed: connection lost, outcome unknown]`.

Perintah mungkin masih berjalan di server, atau mungkin sudah selesai. Jangan jalankan lagi dulu (upgrade atau migrasi dua kali bisa merugikan). Lihat dulu, dengan perintah read-only: file lognya, `ps`, atau perubahan yang seharusnya dibuatnya:

```bash
komando exec web2 --read-only -- 'tail -20 /var/log/unattended-upgrades/unattended-upgrades.log'
komando exec web2 --read-only -- 'ps -ef | grep -v grep | grep apt'
```

Bila server berhenti menjawab (VPN yang hilang tanpa kabar), komando mengetahuinya dalam sekitar semenit alih-alih menunggu `--timeout`.

Ini berbeda dari:

| Apa yang terjadi | Kode error | Exit |
|------------------|-----------|------|
| tidak bisa tersambung sama sekali (perintah tidak pernah dimulai) | `CONN_UNREACHABLE`, `CONNECTION_REFUSED`, `AUTH_FAILED`, ... | 4 |
| tautan putus sebelum perintah dimulai (tidak berjalan) | `CONNECTION_LOST`, pesan menyatakan "it did not run" | 4 |
| tautan putus saat perintah berjalan (hasil tidak diketahui) | `CONNECTION_LOST` | 4 |
| perintah berjalan dan gagal | `COMMAND_FAILED` (per server: `exit_code`-nya) | 5 |
| perintah berjalan lebih lama dari `--timeout` (komando menghentikannya) | `TIMEOUT` | 7 |

Untuk tugas panjang, atau tugas apa pun lewat tautan yang tidak stabil, pakai [job](#long-tasks-jobs): job terus berjalan di server, menyimpan output dan exit code-nya di sana, dan `job wait` tersambung lagi dengan sendirinya setelah putus.

### Server yang dilindungi dan `--read-only`

Di server yang dilindungi, perintah bertanya dulu (di terminal Anda komando bertanya kepada Anda; agen AI atau script menambahkan `--yes` setelah seseorang setuju; lihat [Keamanan](safety.md)), kecuali Anda menambahkan `--read-only` untuk menyatakan perintah hanya melihat.

`--read-only` adalah allowlist yang ketat, di setiap server: perintah berjalan hanya bila komando mengetahui setiap bagiannya hanya membaca. Yang lain ditolak dengan `READ_ONLY_VIOLATION`; hilangkan `--read-only` dan konfirmasikan perubahannya. Yang lolos:

- Tool baca biasa: `cat`, `tail`, `head`, `ls`, `stat`, `df`, `du`, `free`, `uptime`, `ps`, `grep`, `wc`, `id`, `jq`, dan sejenisnya, juga dalam pipe, loop `for`, atau setelah `sh -c`.
- Tool yang ditentukan opsinya, dengan opsi yang diketahui komando membaca: `find` tanpa `-delete`/`-exec`, `sed -n`, `sort`, `awk` yang hanya mencetak, `journalctl`, `dmesg`, `ss`, `tar -t`, `openssl x509`. Opsi panjang ditulis lengkap (`--quiet`, bukan `--qui`): tool membaca nama yang dipersingkat sebagai opsi apa pun yang diawali itu, `sed --in` sebagai `--in-place`.
- Perintah dengan sub-perintah, dalam bentuk yang membaca: `systemctl status`, `is-active`, `list-units`, `show`; `docker ps`, `logs`, `inspect`, `stats`; `kubectl get`, `describe`, `logs`, `top`; `ip addr`, `ip route`; `iptables -L`/`-S`; `apt list`, `dpkg -l`, `rpm -q`; `nginx -t`, `sshd -T`. Sub-perintah yang tidak dikenal komando ditolak, tidak diloloskan.
- `sudo -n`, `sudo -u USER`, `timeout 10`, `nice`, `env NAME=VALUE`, `time`, dan `xargs` (dengan tool baca biasa) di depan perintah seperti itu, serta `set -e`, `-u`, dan `-o pipefail`.

Yang tidak lolos, selain perubahan yang jelas (`rm`, `tee`, `> file`, `sed -i`, `systemctl restart`, `apt install`): program yang tidak dikenal komando (tool Anda sendiri, `curl`, `wget`, `nc`), `git` (konfigurasi repository sendiri bisa menjalankan program pada `git status` atau `git diff`), opsi atau sub-perintah yang belum dikenalnya, `kubectl --kubeconfig` dan pengaturan klien lainnya, `sudo -E`, kurung kurawal tanpa kutip (`{a,b}`), `${x@P}` dan expansion lain yang dievaluasi bash, `let`, `printf -v`, `test -v`, `set -x`, `psql` dan `mysql` (tidak ada yang menahannya pada transaksi read-only; pakai `komando db query`, yang menahannya), dan mengatur variabel dengan nama huruf besar (`PATH`, `PS4`, `TAR_OPTIONS`, `KUBECONFIG` ...: program membaca nama seperti itu sebagai pengaturan atau kode) dengan `NAME=`, `export`, `read`, `for`, atau `-e`. Pakai nama dengan huruf kecil (`-e dir=/var/log -- 'du -sh $dir'`); `LANG`, `LC_*`, `TZ`, `TERM`, dan `COLUMNS` tidak masalah. Perintah yang memakai nilai `-e` tidak punya tanda kutip ganda: di `"$dir"` nilainya satu kata yang tidak bisa diperiksa komando. Nilai dengan `*`, `?`, `[`, `{`, `~`, atau backslash ditolak: bash akan meng-expand-nya menjadi nama yang tidak terlihat komando. `kubectl config view --raw` juga ditolak: perintah itu mencetak kredensial kubeconfig. Untuk keadaan server, pembacaan komando sendiri tidak butuh perintah shell sama sekali: `komando facts`, `logs`, `svc status`, `fs read`, `docker ps`, `cert check`. `docker exec` dan `cluster exec` memeriksa `--read-only` mereka dengan cara yang sama.

Perintah yang tidak bisa diikuti komando ditolak dengan cara yang sama: `eval`, `source`, nama perintah di dalam variabel (`$X file`), shell atau python yang membaca script yang tidak terlihat (`... | sh`, `python3 -c`). Teks setelah `sh -c` atau `bash -lc` diperiksa seperti perintahnya. Dengan `--stdin-file`, inputnya juga diperiksa, jadi `--read-only --stdin-file check.sh -- 'bash -s'` berfungsi bila script hanya melihat. `exec --script --read-only` membutuhkan shell sebagai interpreter (`sh`, `bash -eu`). Argumen script (`--arg`, atau kata setelah `bash -s --`) ditolak di bawah `--read-only`: taruh nilainya di dalam script. Argumen yang tidak terlihat pemeriksaan (`find /data $X`) ditolak untuk perintah yang argumennya menentukan apa yang dilakukannya (`find`, `sed`, `sort`, `kubectl` ...); nilai `-e` diisi lebih dulu. Input lain (CSV untuk `wc`) adalah data dan tidak dibaca sebagai perintah.

komando memblokir perintah yang merusak (`rm -rf /`, `mkfs`, `reboot`, `DROP DATABASE`, ...) di mana pun kecuali seseorang mengizinkannya. Lihat [Keamanan](safety.md).

### Meneruskan kata sandi ke perintah

Kata sandi untuk perintah jarak jauh bisa datang dari vault, sehingga tidak pernah diketik atau ditampilkan: `-e DB_PASS=secret:prod-db`. komando mengisi nilainya dalam perjalanan ke server. Nilai itu menuju perintah lewat inputnya, bukan command line-nya, jadi user lain di server tidak melihatnya di `ps` dan tidak ditulis ke log sudo. Nilai yang bukan dari vault ada di command line seperti biasa.

### Waktu, ukuran, dan flag KEY=VALUE

Setiap flag yang menerima waktu membacanya dengan cara yang sama: angka dan satuan, seperti `30s`, `10m`, `2h`, `1h30m`, atau `7d`. Angka tanpa satuan ditolak (`--older-than 30` bisa berarti detik atau hari), kecuali `0`.

Setiap flag ukuran (`--max-bytes`, `--max-output`) menerima byte (`1048576`) atau ukuran dengan satuan: `256KiB`, `10MB`, `1GB`. KB dan KiB sama-sama berarti 1024 byte, MB dan MiB sama-sama 1024 KiB.

Flag KEY=VALUE (`--env`, `--label`, `--option`) menerima satu pasangan setiap kali; ulangi untuk lebih banyak: `--label team=ops --label env=prod`. Nilai mempertahankan komanya (`--option hosts=a,b`), dan `KEY=` kedua setelah koma ditolak, jadi `--option a=on,b=x` tidak pernah dibaca sebagai satu nilai.

### Berapa banyak: `--limit`

Setiap perintah daftar menerima `-n/--limit N`, jumlah item paling banyak yang ditampilkan (di perintah `cluster` hanya `--limit`, karena `-n` di sana adalah namespace). Pembaca log menampilkan N baris terakhir. Perintah yang berjalan di beberapa server menghitung per server. Tanpa `--limit`, daftar menampilkan seperti biasanya: semuanya, atau default yang disebut help-nya (`fs list` 1000, `logs` 200). `--limit 0` menampilkan semuanya di tempat help menyatakannya. Saat daftar berhenti di batasnya, JSON punya `meta.truncated: true` dan `-o text` mencetak di stderr `Note: showing the first N; --limit 0 shows all` (sebagian perintah menaruh catatan potongnya sendiri di outputnya).

### Nama lain

Help menampilkan satu nama per perintah. Bentuk jamak dan kata yang sering diketik orang (`servers`, `databases`, `ls` untuk `list`) menemukan perintah yang sama, dan `komando schema NAME` menyatakan perintah mana yang dijalankan sebuah nama.

## Menjalankan script lokal

`komando exec TARGET --script FILE` mengirim file script dari komputer ini ke server dan menjalankannya. Tidak ada yang tertinggal di disk server.

```bash
komando exec @web --script ./deploy.sh --arg v1.2.3 --sudo
komando exec db1 --script ./backup.py --interpreter python3
```

Interpreter berasal dari baris `#!` script, atau dari `--interpreter` (kalau tidak, `sh`). Nilai `--arg` sampai ke script sebagai `$1`, `sys.argv[1]`, `$ARGV[0]`, dan seterusnya, untuk sh, bash, python, perl, ruby, dan node sama saja. Script dikirim sebagai input interpreter, jadi `--stdin-file` dan `--pty` tidak cocok dengan `--script`. Lewat `env` (`#!/usr/bin/env -S bash -e`), program setelah opsi env sendiri adalah interpreter, dengan argumennya. Script yang memuat nilai yang disembunyikan komando (`[hidden]`) ditolak (`HIDDEN_VALUE`), begitu juga file seperti itu yang diberikan ke `exec --stdin-file`.

## Tugas panjang (job)

Apa pun yang lambat (backup, upgrade, build) sebaiknya dijalankan sebagai *job*. Job terus berjalan di server bahkan bila Anda memutus koneksi, dan `job start` kembali seketika dengan satu ID job per server.

```bash
komando job start web1 -- 'tar czf /backup/www.tgz /var/www'
```

```text
ID                     HOST  PID    STATE
j1108-193010-9f8e7d6c  web1  48213  started
```

Jika diketik tanpa argumen, `komando job start` menanyakan server, lalu perintahnya.

```bash
komando job start @web --sudo -- 'apt-get update && apt-get -y upgrade'
komando job start @web --script ./migrate.sh --arg v2   # script dari komputer ini
komando job start db1 --sudo-user postgres --stdin-file ./fix.sql -- 'psql app'   # sebagai user lain, dengan input
komando job start web1 --timeout 2h -- ./reindex.sh   # dihentikan bila berjalan lebih dari 2 jam
komando job status JOB               # running, exited, atau lost; exit code; baris terakhir
komando job logs JOB                 # output sejauh ini
komando job wait JOB --timeout 30m   # tunggu sampai selesai
komando job wait JOB1 JOB2        # tunggu beberapa (satu per server)
komando job kill JOB                 # hentikan (TERM; --signal KILL untuk penghentian paksa)
komando job list                        # setiap job; --refresh bertanya ke server
komando job rm JOB                   # lupakan dan hapus log jarak jauhnya
```

Baik diketahui:

- `job logs --offset N` hanya membaca yang baru: teruskan `next_offset` dari panggilan sebelumnya. `-n/--limit N` memberi baris terakhir sebagai gantinya.
- `job wait` menunggu sampai `--timeout` (default 10m). Saat waktu habis, job tetap berjalan dan komando keluar dengan 7 (`WAIT_TIMEOUT`). Kalau tidak, exit code mengikuti milik job. Bila koneksi putus saat menunggu, komando tersambung lagi dan terus menunggu.
- `job wait` dengan beberapa ID menunggu semuanya dan memberi satu hasil per job (`data.jobs`) dan ringkasan; exit code adalah yang terburuk.
- `job start --script FILE` menjalankan script dari komputer ini sebagai job, dengan `--arg` dan `--interpreter` seperti di `exec --script`. Salinannya menunggu di folder privat job dan dihapus saat dikirim ke interpreter.
- `job start --stdin-file FILE` memberi perintah FILE sebagai inputnya (`-` untuk stdin komando sendiri), dan `--sudo-user USER` menjalankannya sebagai USER dengan `sudo -u`, seperti di `exec`. Nilai `--env` job dan inputnya menuju perintah lewat pipe, jadi perintah yang dijalankan sebagai user lain mendapatkannya juga.
- `job start --timeout 2h` menghentikan job setelah 2 jam, seperti `job kill`; `job status` lalu menyatakan `killed` dengan `timed_out: true`, dan `job wait` menyebut timeout-nya. Tanpa `--timeout`, job tidak punya batas waktu. (`job start` tidak punya `--pty`: job berjalan tanpa terminal.)
- Saat `exec` timeout atau kehilangan koneksi, hint-nya adalah baris `komando job start ...` yang menjalankan hal yang sama sebagai job.
- `job start --sudo` memakai kata sandi `--sudo-ref` server bila ada. Kata sandi dikirim sebagai input (tidak pernah di command line) dan menunggu di file privat yang hanya bisa dibaca user job. Job lebih dulu menanyakan ke sudo apakah butuh kata sandi: bila tidak, file dihapus tanpa dibaca; bila ya, sudo membacanya sebelum perintah dimulai. Bagaimanapun perintah tidak pernah bisa membacanya.
- `job kill` pada job yang sudah berakhir tidak melakukan apa pun. Job yang dimulai dengan `--sudo` butuh `job kill --sudo`.
- `job rm` menolak job yang berjalan: hentikan dulu, atau tambahkan `--kill`. `--keep-remote` menyimpan folder log di server.
- `job list --target @web` hanya menampilkan job di server itu.

## Recipe (perintah siap pakai dan tersimpan)

Recipe adalah perintah tersimpan. komando datang dengan yang siap pakai (`health`, `disk`, `memory`, dan lainnya; lihat [Kesehatan](health.md)), dan Anda bisa menyimpan milik Anda sendiri di sampingnya.

```bash
komando recipe list                                   # bawaan dan tersimpan
komando recipe list --category saved                  # hanya milik Anda sendiri
komando recipe add restart-app 'systemctl restart {{app}}' --needs-sudo
komando recipe add disk-of 'df -h {{path=/}}' --read-only --desc 'Disk use of a path'
komando recipe run restart-app @web --var app=shop
komando recipe run disk-of web1 --var path=/srv
komando recipe rm disk-of
```

- `{{app}}` adalah isian yang Anda isi dengan `--var app=...`. `{{path=/}}` punya nilai default.
- komando memperlakukan recipe sebagai perubahan, jadi server yang dilindungi bertanya dulu, kecuali Anda menyimpannya dengan `--read-only` karena hanya melihat. Recipe read-only diperiksa seperti `exec --read-only` saat Anda menyimpannya. Bila, dengan isiannya terisi, recipe tidak lagi lolos pemeriksaan itu, recipe berjalan sebagai perubahan.
- Nilai `--var` tidak boleh diawali `-`, karena program akan membacanya sebagai opsi (`OPTION_LIKE_VAR`). Tulis path seperti itu sebagai `./-name`. Angka atau waktu relatif (`-5`, `-2h`) tidak masalah.
- Nama bawaan (`disk`, `health`, ...) tidak bisa dipakai ulang. Ganti milik Anda sendiri dengan `--overwrite`.
- `--var` yang tidak punya isian di recipe ditolak (`UNKNOWN_VAR`), jadi salah ketik tidak pernah menjalankan recipe dengan nilai default-nya.
- `recipe run --no-sudo` melewati sudo bahkan saat recipe memintanya.

## Di terminal Anda: komando menanyakan apa yang kurang

Hanya ada satu cara memakai komando: `komando NOUN VERB [TARGET] [FLAGS]`. Di terminal Anda sendiri, hilangkan sesuatu dan komando menanyakannya, satu baris sekali waktu, di layar biasa (scrollback Anda menyimpannya):

```text
$ komando logs
   1  web1  ubuntu@10.0.0.5
   2  web2  ubuntu@10.0.0.6
TARGET: 1
$ komando logs web1
...
Next time: komando logs web1
```

- Komando hanya menanyakan apa yang dibutuhkan perintah: argumen yang kurang, flag yang wajib, dan beberapa nilai yang membuat perintah tidak berguna tanpanya (SQL dari `db query`, perintah dari `exec`). Labelnya adalah nama sebenarnya: `CONN (database):`, `TARGET:`, `--old:`. `?` menjelaskan pertanyaannya; Enter mengambil default di dalam kurung siku.
- Daftar berasal dari apa yang diketahui komando: nomor memilih satu baris, sebagian nama mempersempit daftar, dan selector (`@web`, `tag:db`) atau nama baru diambil seperti diketik. Dengan satu item yang tidak dilindungi, komando memakainya dan menyatakannya (`Using prod-db (the only one of your databases)`); yang dilindungi tidak pernah dipilihkan untuk Anda. Dengan nol, komando menyatakan cara menambahkannya.
- Komando lalu menampilkan seluruh baris (`$ komando ...`). Pembacaan langsung berjalan. Perubahan bertanya `Run it? [y/N, d = --dry-run first]` (Enter berarti Tidak; `d` menampilkan apa yang akan dilakukannya dan bertanya lagi). Yang menghapus untuk selamanya meminta Anda mengetik nama apa yang hilang (atau jumlahnya). Target yang dilindungi menanyakan pertanyaan lazimnya `web1 (protected): this command changes it. Continue? [y/N]` sebagai gantinya.
- `komando host add` (atau `conn add`, `vpn add`, `db add`, `cache add`, `queue add`, `storage add`, `cluster add`, `registry add`) yang diketik tanpa argumen menanyakan pertanyaan khas jenis itu: jenis apa, nama, alamat atau bagian URL, user, port, cara Anda login, dan apakah ini production. Kata sandi tidak pernah ditanyakan di sini: perintahnya menanyakannya sendiri, disembunyikan (`--ask-password`). Kata sandi yang ditempel bersama alamat (`root:secret@10.0.0.5`) dikeluarkan sebelum digambar. Setelah penambahan, `komando test` menunjukkan bahwa server menjawab; bila tidak, komando menyebut perintah untuk mengubah, menguji lagi, atau menghapusnya.
- Ctrl-C pada sebuah pertanyaan menghentikannya dan tidak ada yang berjalan. komando tidak pernah menambahkan `--yes`, `--allow-dangerous`, `--reveal`, atau `--write` untuk Anda.
- Setelah perintah yang Anda jalankan berakhir dengan baik, komando bisa menyebut apa yang biasanya berikutnya, dalam satu baris di stderr dengan paling banyak tiga perintah (`Next: komando db info prod-db`). Setiap add, edit, rename, dan rm punya satu. Tidak ada "berikutnya" yang dicetak di stdout; script dan agen membaca `data.next`. `komando host show web1` (`conn show`, `vpn show`, `group list GROUP`, `key show`, `job status`, `secret show`, `config get`) berakhir dengan perintah untuk item itu.

`komando` saja menampilkan perintah menurut kelompok, START lebih dulu. Perintah yang diketik lengkap berjalan seperti biasanya. Tidak ada yang pernah ditanyakan kepada agen AI, script, pipe, job CI (`CI` diatur), terminal dumb (`TERM=dumb`), atau output JSON: mereka mendapat error `USAGE` biasa yang menyebut apa yang kurang.

## Shell interaktif (untuk manusia)

```bash
komando shell web1             # login, dengan status line lebih dulu
komando shell web1 --dry-run   # menampilkan server, alamat, user, dan jalur --via; tidak menyambung apa pun
```

`shell` membawa Anda login ke server, lewat jalur `--via`-nya (VPN dan bastion) bila punya. Di dalam shell Anda bisa mengetik apa pun, jadi di server yang dilindungi komando bertanya `[y/N]` dulu, seperti `db shell` pada conn yang dilindungi. Shell butuh orang di terminal: agen dan script mendapat `NEEDS_TERMINAL` dan memakai `exec` atau `job` sebagai gantinya.

### Di mana saya? (status line)

Saat Anda mengetik perintah sendiri, komando mencetak satu baris yang menyatakan di mana Anda bekerja, sebelum tersambung. Ini dilakukan untuk perintah yang Anda tetap di dalamnya: `shell`, `db shell`, `cluster shell`, `cluster forward`, `logs --follow`, dan `cluster logs -f`.

```text
komando: shell on web1 (deploy@10.0.1.5) via vpn office → bastion
komando: shell on db1 (root@10.0.0.5) · PROTECTED
komando: psql on prod-db (read-only) via bastion
komando: forwarding 127.0.0.1:8080 → svc/api:80 on prod-k8s (Ctrl-C stops)
komando: following logs on web1, web2 (Ctrl-C stops)
```

- `via` adalah jalan ke sana: VPN lebih dulu, lalu bastion.
- Server atau database yang dilindungi menyatakan `PROTECTED`, dengan warna merah kecuali `NO_COLOR` diatur.
- Di terminal yang tidak bisa menampilkannya (`TERM=dumb`, atau locale seperti `LANG=C` yang bukan UTF-8), komando menulis tanda di baris miliknya sendiri (error, hint, peringatan) dalam ASCII: `+` untuk ✓, `x` untuk ✗, `*` untuk ●, `->` untuk →, `-` untuk ·. Hasil (file, baris, baris log) selalu ditampilkan apa adanya.
- Saat `shell` atau `db shell` berakhir, satu baris lagi menyatakan bagaimana: `komando: left web1 (exit 0, 12m)` atau `komando: connection to web1 lost after 3m`.
- Saat perintah menyambungkan VPN dengan sendirinya, komando menyatakan bahwa VPN tetap aktif dan cara menghentikannya.

Baris-baris ini menuju stderr, dan hanya untuk orang di terminal. Agen, script, dan pipe tidak pernah mendapatkannya, dan output JSON tidak berubah.

## Melihat apa yang masih berjalan

Sebagian hal terus berjalan setelah perintah yang memulainya: VPN (dari `vpn up`, atau disambungkan oleh sebuah perintah), login server yang disimpan `komando login`, tunnel, atau job di server. `komando status` mencantumkan semuanya:

```bash
komando status
```

```text
KIND    NAME                   DETAIL                                             SINCE
vpn     office                 used 3m ago, closes in 26m if unused               42m
login   web1                   kept for 7h more (`komando logout web1` ends it)   1h
aws     dev,ops                SSO login, kept for 3h more (`komando logout aws --profile dev` ends it)   1h
tunnel  t1108-195255-ab12cd34  127.0.0.1:5433 → prod-db                            2h
job     j1108-193010-9f8e7d6c  web1: tar czf /backup/www.tgz /var/www             15m
jobs run on their servers: `komando job list --refresh` shows which still run
```

Bila tidak ada yang berjalan, komando menyatakan `nothing running: no VPN sessions, server logins, tunnels or jobs`.

- Perintah ini tidak menghubungi apa pun, jadi cepat dan berfungsi offline.
- Job tetap ada di daftar sampai `komando job rm`. Apakah masih berjalan hanya diketahui di servernya, yang ditanyakan `komando job list --refresh`.
- Agen mendapat hal yang sama sebagai JSON (`vpns`, `logins`, `tunnels`, `jobs`).
- VPN yang menganggur menutup setelah `vpn_idle` (lihat [Pengaturan](settings.md)).

### Menampilkannya di prompt shell Anda

`komando status --short` mencetak catatan singkat seperti `vpn:2 tun:1` (berapa VPN dan tunnel yang aktif), atau tidak ada bila tidak ada yang berjalan, sehingga prompt Anda bisa menampilkannya terus-menerus. Tambahkan sendiri; komando tidak pernah mengubah file shell Anda.

zsh (juga dengan oh-my-zsh), di `~/.zshrc`:

```zsh
setopt PROMPT_SUBST
RPROMPT='$(komando status --short)'
```

bash, di `~/.bashrc`:

```bash
PS1='$(p=$(komando status --short); [ -n "$p" ] && echo "[$p] ")'"$PS1"
```

starship, di `~/.config/starship.toml`:

```toml
[custom.komando]
command = "komando status --short"
when = true
```

Perintah ini hanya membaca nomor proses yang disimpan komando di samping store-nya (tanpa nama, tanpa key, tanpa jaringan, tanpa menulis apa pun), tidak mencetak JSON dan tidak pernah gagal, jadi aman dijalankan pada setiap prompt. Ini petunjuk cepat: VPN yang baru saja crash bisa tetap tampil sampai perintah komando berikutnya. `komando status` adalah pemeriksaan penuhnya.

## Batasan

- `--` sebelum kata-kata perintah wajib ada untuk setiap perintah yang menyerahkan kata-kata ke program lain; flag komando sendiri ditulis sebelumnya.
- Output yang lebih panjang dari `--max-output` (256 KiB per stream) dipotong.
- `--timeout` berlaku per server (default 5m); job adalah jalan untuk melewatinya.
- `--read-only` hanya menjalankan perintah yang diketahui komando hanya membaca, di setiap target; argumen script (`--arg`, kata setelah `bash -s --`) ditolak di bawahnya.
- `exec --script` tidak bisa digabung dengan `--stdin-file` atau `--pty`.
- Nilai `--var` recipe tidak boleh diawali `-` (kecuali angka atau waktu mundur dari sekarang).
- Nama recipe bawaan tidak bisa dipakai ulang untuk milik Anda sendiri.
- `shell` dan pertanyaan untuk argumen yang kurang butuh orang di terminal: tidak ada yang ditanyakan kepada agen AI, script, pipe, job CI (`CI` diatur), terminal dumb (`TERM=dumb`), atau output JSON.
- `komando status` mencantumkan job dari catatan komando sendiri; hanya `job list --refresh` yang bertanya ke server.

## Pemecahan masalah

| Kode error | Artinya | Yang perlu dilakukan |
|------------|---------|----------------------|
| `USAGE` | argumen hilang, atau kata-kata perintah tidak ada setelah `--` (exit 2) | baca contoh di error; taruh perintah setelah `--` |
| `COMMAND_FAILED` | perintah berjalan dan gagal di sebuah server (exit 5) | baca output dan `exit_code` server itu |
| `CONNECTION_LOST` | tautan putus; perintah mungkin masih berjalan, atau sudah selesai (exit 4) | lihat dulu dengan perintah read-only; pakai job lewat tautan yang tidak stabil |
| `CONNECT_TIMEOUT` | server tidak menjawab dalam `--connect-timeout` (exit 7) | periksa alamat dan jalur `--via` |
| `TIMEOUT` | perintah berjalan lebih lama dari `--timeout`; komando menghentikannya (exit 7) | naikkan `--timeout`, atau jalankan sebagai job |
| `READ_ONLY_VIOLATION` | `--read-only`, tetapi perintah mengubah sesuatu atau komando tidak bisa mengikutinya (exit 6) | hilangkan `--read-only`; server yang dilindungi lalu bertanya dulu |
| `HIDDEN_VALUE` | script atau `--stdin-file` memuat nilai yang disembunyikan komando (`[hidden]`) | taruh `secret:NAME` di `-e` sebagai gantinya |
| `WAIT_TIMEOUT` | `job wait` kehabisan waktu; job masih berjalan (exit 7) | `komando job wait JOB` lagi, atau `komando job logs JOB --limit 50` |
| `JOB_RUNNING` | `job rm` pada job yang berjalan | `komando job kill JOB` dulu, atau tambahkan `--kill` |
| `JOB_NOT_FOUND` | tidak ada job dengan ID itu | lihat dengan `komando job list` |
| `OPTION_LIKE_VAR` | nilai `--var` recipe diawali `-` | tulis path seperti itu sebagai `./-name` |
| `UNKNOWN_VAR` | recipe tidak punya isian dengan nama itu | periksa isiannya dengan `komando recipe list` |
| `NEEDS_TERMINAL` | `shell` tanpa orang di terminal | pakai `komando exec` atau `komando job start` |
