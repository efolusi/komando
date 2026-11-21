# Keamanan

Sabuk pengaman yang dipasang komando pada setiap perintah, siapa yang ditanya sebelum perintah berisiko berjalan, dan apa yang dilakukan saat sebuah sabuk menghentikan Anda. · [Standar keamanan](security-standards.md)

## Melindungi production

Tandai server atau conn sebagai dilindungi, dan komando bertanya sebelum setiap perubahan di sana:

```bash
komando host edit web1 --protected        # komando bertanya sebelum setiap perubahan di web1
komando conn edit prod-db --protected     # sama untuk sebuah database
komando policy check 'rm -rf /'           # apakah ini akan diblokir? (exit 6 bila ya)
komando audit -o text                     # apa yang dilakukan, dan oleh siapa
```

Jika diketik tanpa argumen, `komando host edit` menanyakan server, lalu apa yang diubah.

Saat Anda mengubah web1 nanti, komando bertanya dulu:

```text
web1 (protected): this command changes it. Continue? [y/N]
```

Agen AI atau script tidak ditanya: mereka menambahkan `--yes` setelah seseorang setuju (lihat [Saat Anda di terminal](#when-you-are-at-the-terminal)).

## Sabuk pengaman

| Sabuk pengaman | Fungsinya |
|----------------|-----------|
| **Filter perintah berbahaya** | Memblokir perintah seperti `rm -rf /`, `mkfs`, `reboot`, `DROP DATABASE`, `curl … \| sh`, mengosongkan firewall, dan menghentikan SSH, di server Anda, di pod, dan di database. Lihat semuanya dengan `komando policy list`. |
| **Server dan conn yang dilindungi** | Perubahan apa pun padanya butuh jawaban ya. Untuk entrinya sendiri itu berarti mengarahkan ulang (alamat, port, user, key, kata sandi, `--via`), mengganti secret yang dipakainya (key, pre-shared key, atau profil VPN yang dilindungi juga), mengganti namanya, menghapusnya, dan mematikan perlindungan; tag, grup, label, dan catatannya berubah tanpa itu. Perintah yang hanya melihat bisa menyatakannya dengan `--read-only` dan berjalan tanpa jawaban ya. Apa pun di alamat dan port yang sama (target `user@address`, nama kedua, nama yang di-resolve ke IP yang sama, conn kedua ke server database yang sama, server SSH di balik conn `sftp://` yang dilindungi) juga dilindungi, VPN atau bastion mana pun yang dilaluinya. Dengan banyak target, komando memeriksa semuanya sebelum menjalankan apa pun: satu target yang dilindungi menghentikan seluruh perintah sebelum yang pertama berjalan (di terminal, komando bertanya sekali), dan error menyebut setiap target yang dilindungi. Perintah tidak pernah berhenti di tengah jalan karena perlindungan. |
| **Read-only secara default** | `db query`, `cache run`, dan `cluster run` hanya membaca kecuali Anda menambahkan `--write`. Di PostgreSQL, MySQL, Oracle, dan ClickHouse, database sendiri yang memberlakukannya (transaksi read-only, atau readonly=1 milik ClickHouse); SQL Server selalu me-rollback SQL-nya. Di Snowflake, BigQuery, dan MongoDB, pemeriksaan komando sendiri atas setiap pernyataan menjaganya tetap pembacaan: untuk jaminan yang keras, sambungkan dengan user yang hanya boleh membaca. Lihat [database](databases.md). |
| **Dry run** | `--dry-run` menampilkan apa yang akan berjalan dan apakah akan diblokir (`meta.would_be_blocked`). Dry run sendiri tidak pernah diblokir, dengan satu pengecualian: perintah agen AI dengan `KOMANDO_HOME` yang diatur ke folder lain berhenti, dry run atau bukan (lihat folder data yang lazim, di bawah). Dry run tidak pernah membuka jendela persetujuan, jadi untuk agen AI `--reveal` tidak dihitung di dry run (output tetap disamarkan), dan pratinjau agen tersambung dengan `--host-key-policy off` diabaikan. |
| **Pengaturan keamanan** | Mematikan audit log atau pemeriksaan identitas server, memindahkan key vault keluar dari keychain, menghapus aturan deny, atau agen AI mengatur `--proxy-command` (program di komputer ini) butuh jawaban ya. |
| **Identitas server** | Bila fingerprint server berubah, komando menolak tersambung (`HOSTKEY_MISMATCH`). |
| **Edit yang aman** | Edit file menggantikan persis teks yang Anda sebut, menulis seluruh file sekaligus (tidak pernah setengah tertulis), dan bisa menyimpan backup `.bak`. Sebagai root (`--sudo`), komando tidak mengikuti link yang dibuat user server lain, dan tidak menulis ke folder yang bisa diubah user lain, karena user itu bisa menukar file dengan link saat root menulis (`SHARED_FOLDER_CONFLICT`). |
| **Vault tersegel** | Kata sandi disegel dengan AES-256-GCM, dengan key di keychain OS (atau, bila tidak ada, di file di samping store; `komando doctor` memperingatkan). Hanya nama yang pernah ditampilkan. Hanya orang yang bisa melihat nilai: di terminal, atau dari aplikasi Komando untuk Mac setelah **Allow once** di jendela komando (`secret show --reveal`, `key show --reveal`); agen AI tidak pernah bisa, dan setiap nilai yang ditampilkan ada di audit log ([Melihat nilai lagi](secrets.md#see-a-value-again)). `secret rename` dan `secret cp` mengganti nama dan menyalin di dalam vault, jadi nilai tidak perlu ditampilkan atau diketik lagi. `secret check` membiarkan orang membandingkan nilai tanpa menampilkannya. Key kode persetujuan hanya bisa diubah dengan `komando config approval-code` (`RESERVED_SECRET`). Lihat [Secret](secrets.md). |
| **Secret disembunyikan di output** | Bila secret vault muncul di apa yang dikirim balik server (file `.env`, baris log, `env`), komando mencetak `[secret:NAME]` sebagai gantinya, juga saat di-encode base64 atau URL. Nilai yang lebih pendek dari 6 karakter tidak disembunyikan. Agar penyembunyian ini tidak bisa memberi tahu agen AI tebakan mana yang merupakan secret, nilai vault di argumen, script, atau input milik agen sendiri tidak disembunyikan di output perintah itu, dan perintah menjawab seperti untuk nilai lain mana pun; hal itu ditulis ke audit log, tempat Anda melihat tebakannya. |
| **Riwayat** | Setiap tindakan ada di `komando audit` (lihat [di bawah](#history)). |

## Saat Anda di terminal

Siapa yang ditanya bergantung pada siapa yang menjalankan perintah:

- **Anda, di terminal:** komando bertanya kepada Anda dulu, dan menjalankan perintah hanya setelah jawaban Anda.
- **Agen AI atau script:** komando tidak pernah bertanya. Perintah berhenti dengan exit 6 dan sebuah kode (`PROTECTED_TARGET`, `POLICY_BLOCKED` ...), dan hint menyebut flag yang dibutuhkan eksekusi sungguhan: `--yes`, atau `--allow-dangerous` untuk langkah yang tidak bisa dibatalkan. Agen atau script menambahkan flag itu setelah seseorang setuju.
- **Agen AI yang menambahkan flag:** komando membuka jendela "Allow once" di layar Anda, dan perintah berjalan hanya saat Anda mengkliknya (lihat [Sabuk pengaman untuk agen AI](#seatbelts-for-ai-agents)). Flag milik script dihitung apa adanya.
- **Job CI** (`CI` diatur) tidak pernah dianggap orang, bahkan di terminal: tidak ada yang ditanyakan di sana.

Di terminal komando bertanya dengan salah satu dari tiga cara:

- Perubahan pada server, conn, atau VPN yang dilindungi: `web1 (protected): this command changes it. Continue? [y/N]`.
- Langkah yang tidak bisa dibatalkan: `This <what it does>.`, dan Anda mengetik nama apa yang akan hilang: key, file, secret, topic, atau image bila satu yang hilang (`Type the name session:42 to continue`), jumlahnya bila beberapa yang hilang (`Type 37 (objects under daily/ in backups) to continue`), atau nama server atau conn untuk langkah pada seluruh target (reboot, restore, perintah yang diblokir filter). Tidak pernah kata yes. Pada target yang dilindungi, pertanyaan yang sama menyatakannya, dan jawaban Anda mencakup perlindungan juga: komando bertanya sekali.
- Perubahan yang mematikan salah satu pemeriksaan komando sendiri (`config set audit off`, `host_key_policy off`, menghapus aturan deny, kembali ke komando yang lebih lama): `This turns off a komando safety check: <what>. Continue? [y/N]`.

Lebih lanjut tentang pertanyaannya:

- `--proxy-command` atau program login cluster yang cocok dengan sebuah aturan menyatakan `Blocked by policy: ...` dan meminta Anda mengetik nama server atau conn untuk tetap menjalankannya, sekali ini saja.
- Saat komando menanyakan argumen yang kurang kepada Anda, komando bertanya `Run it? [y/N, d = --dry-run first]` sebelum perintah berjalan. Perintah yang tidak bisa dibatalkan (menghapus data atau file, reboot, menghentikan sshd, `sync --delete`) lalu meminta Anda mengetik nama apa yang akan hilang, sekali. `cron rm`, `pkg rm`, dan `db kill` tidak butuh apa-apa lagi dari agen AI, tetapi Anda mengetik nama apa yang akan hilang sebagai ganti menjawab `Run it?`. Satu tabel aturan menentukan yang mana: setiap perintah yang menghentikan agen AI sebagai berbahaya meminta nama kepada Anda.
- Tidak adalah default; Enter atau Ctrl-D berarti tidak, dan tidak ada yang berjalan. Jawaban tidak keluar dengan 6, seperti penghentian: `Cancelled. Nothing was changed.` (`DECLINED` saat komando bertanya sebelum perintah berjalan, kalau tidak kode penghentian itu sendiri). Ctrl-C menghentikan komando di sana: `Stopped.`, exit 1 (`CANCELLED`).
- Jawaban ya hanya berlaku untuk satu perintah itu, seperti `--yes` atau `--allow-dangerous`, dan `komando audit` mencatatnya dengan `confirm: tty` dan apa yang Anda jawab ya.
- Sebagian penghentian tidak punya flag dan tidak pernah ditanyakan: `HOSTKEY_MISMATCH`, `NEEDS_PERSON`, `SSH_GATE_NETWORK_REQUIRED`, `SSH_GATE_READ_ONLY`, `SSH_GATE_REFUSED`, `STORE_OLD_COPY`, dan `REVEAL_NEEDS_TERMINAL`. Hanya orang yang menjalankan perintah itu, di terminalnya sendiri.

Setiap penghentian yang bisa diangkat sebuah flag punya hint yang sama, menyebut setiap flag yang dibutuhkan eksekusi sungguhan: agen AI membaca `check with --dry-run, ask the user; once they agree, run it again with --yes`, script mendapat baris perintahnya sendiri dengan flag yang sudah terisi.

## Apa yang butuh jawaban ya

Setiap perintah punya tier risiko. Tier menyatakan apa yang harus ditambahkan agen AI atau script, dan apa yang ditanyakan komando kepada Anda di terminal. Perintah yang tidak ada di tabel di bawah hanya membaca, atau membuat perubahan yang bisa Anda batalkan.

<!-- tiers: made by TestTiersDoc from risk.go; KOMANDO_UPDATE_TIERS=1 writes it -->

| Tier | Apa | Agen AI atau script butuh | Orang di terminal |
|---|---|---|---|
| read | hanya melihat | tidak ada | tidak ada |
| change | bisa dibatalkan, atau hanya daftar milik komando sendiri | tidak ada | diketik lengkap: berjalan; diisi: `Run it?` |
| protected | perubahan pada server, conn, atau VPN yang dilindungi | `--yes` (PROTECTED_TARGET) | `NAME (protected): ... Continue? [y/N]` |
| dangerous | tidak bisa dibatalkan, atau menyebabkan gangguan | `--allow-dangerous` (POLICY_BLOCKED) | mengetik nama apa yang hilang, jumlahnya, atau targetnya |
| safety | melemahkan pemeriksaan komando sendiri | `--yes` (SAFETY_SETTING, OPEN_BIND, SECRET_DESTINATION) | `This turns off a komando safety check: ... Continue? [y/N]` |
| person | hanya orang di terminal | tanpa flag: NEEDS_PERSON dan sejenisnya | perintahnya sendiri |

Setiap baris tabel aturan (`risk.go`). Perintah tanpa baris memakai tier jenisnya: read, atau change. Baris "when the ..." ditentukan saat berjalan.

| Perintah | Kapan | Tier | Flag |
|---|---|---|---|
| `queue purge` | selalu | dangerous | `--allow-dangerous` |
| `queue rm` | selalu | dangerous | `--allow-dangerous` |
| `cache rm` | selalu | dangerous | `--allow-dangerous` |
| `storage rm` | selalu | dangerous | `--allow-dangerous` |
| `cluster rm` | selalu | dangerous | `--allow-dangerous` |
| `cluster scale` | REPLICAS adalah 0 | dangerous | `--allow-dangerous` |
| `registry rm` | selalu | dangerous | `--allow-dangerous` |
| `registry prune` | selalu | dangerous | `--allow-dangerous` |
| `db restore` | selalu | dangerous | `--allow-dangerous` |
| `db user rm` | selalu | dangerous | `--allow-dangerous` |
| `db kill` | orang mengetik nama apa yang hilang | change |  |
| `fs rm` | selalu | dangerous | `--allow-dangerous` |
| `docker rm` | selalu | dangerous | `--allow-dangerous` |
| `docker prune` | selalu | dangerous | `--allow-dangerous` |
| `user rm` | dengan --remove-home | dangerous | `--allow-dangerous` |
| `user rm` | selalu | dangerous | `--allow-dangerous` |
| `secret rm` | selalu | dangerous | `--allow-dangerous` |
| `key rm` | dengan --delete-file, untuk key yang dibuat komando | dangerous | `--allow-dangerous` |
| `pkg rm` | package yang dibutuhkan server (openssh-server, sudo, systemd, ...) | dangerous | `--allow-dangerous` |
| `pkg rm` | orang mengetik nama apa yang hilang | change |  |
| `cron rm` | orang mengetik nama apa yang hilang | change |  |
| `reboot` | selalu | dangerous | `--allow-dangerous` |
| `svc stop` | unit-nya ssh atau sshd | dangerous | `--allow-dangerous` |
| `svc disable` | unit-nya ssh atau sshd | dangerous | `--allow-dangerous` |
| `sync` | dengan --delete | dangerous | `--allow-dangerous` |
| `exec` | saat perintah cocok dengan aturan yang merusak | dangerous | `--allow-dangerous` |
| `job start` | saat perintah cocok dengan aturan yang merusak | dangerous | `--allow-dangerous` |
| `recipe run` | saat perintah recipe cocok dengan aturan yang merusak | dangerous | `--allow-dangerous` |
| `docker exec` | saat perintah cocok dengan aturan yang merusak | dangerous | `--allow-dangerous` |
| `docker raw` | saat perintah docker menghapus atau menghentikan sesuatu | dangerous | `--allow-dangerous` |
| `docker compose` | saat perintah compose menghapus atau menghentikan sesuatu | dangerous | `--allow-dangerous` |
| `cluster exec` | saat perintah cocok dengan aturan yang merusak | dangerous | `--allow-dangerous` |
| `cluster run` | saat perintah kubectl menghapus sesuatu | dangerous | `--allow-dangerous` |
| `cache run` | saat perintah cache menghapus data (FLUSHALL, ...) | dangerous | `--allow-dangerous` |
| `db query` | saat SQL menghapus data (DROP, DELETE tanpa WHERE, ...) | dangerous | `--allow-dangerous` |
| `db explain` | dengan --analyze, saat SQL menghapus data | dangerous | `--allow-dangerous` |
| `pkg upgrade` | dengan --security, saat update akan menghapus package yang dibutuhkan server | dangerous | `--allow-dangerous` |
| `key revoke` | saat itu adalah key yang dipakai komando untuk login | dangerous | `--allow-dangerous` |
| `host edit` | saat --proxy-command cocok dengan aturan yang merusak | dangerous | `--allow-dangerous` |
| `host add` | saat --proxy-command cocok dengan aturan yang merusak | dangerous | `--allow-dangerous` |
| `import` | saat ProxyCommand yang diimpor cocok dengan aturan yang merusak | dangerous | `--allow-dangerous` |
| `policy rm` | selalu | safety | `--yes` |
| `config set` | saat pengaturan mematikan sebuah pemeriksaan (audit, keychain, host key policy, ...) | safety | `--yes` |
| `host edit` | dengan --protected=false | safety | `--yes` |
| `conn edit` | dengan --protected=false | safety | `--yes` |
| `vpn edit` | dengan --protected=false | safety | `--yes` |
| `vpn edit` | dengan --mfa=false | safety | `--yes` |
| `update` | saat menginstal versi yang lebih lama | safety | `--yes` |
| `tunnel start` | saat mendengarkan di alamat terbuka (OPEN_BIND) | safety | `--yes` |
| `secret keychain` | saat mematikan keychain | safety | `--yes` |
| `host add` | dengan --proxy-command, saat agen AI menjalankannya (proxy command berjalan di komputer ini) | safety | `--yes` |
| `host edit` | dengan --proxy-command, saat agen AI menjalankannya (proxy command berjalan di komputer ini) | safety | `--yes` |
| `import` | saat agen AI mengimpor server dengan proxy command (berjalan di komputer ini; tanpa --yes server dikeluarkan) | safety | `--yes` |
| `import` | SOURCE kubeconfig, saat agen AI mengimpor context yang loginnya menjalankan program atau mengirim file komputer ini | safety | `--yes` |
| `recipe add` | dengan --overwrite --read-only, saat membuat recipe yang sudah ada menjadi read-only | safety | `--yes` |
| `host trust` | saat agen AI mem-pin host key pertama selagi host key ketat | safety | `--yes` |
| `guide uninstall` | saat menghapus guard komando dari pengaturan agen AI | safety | `--yes` |
| `config approval-code` | selalu | person |  |
| `secret passphrase` | selalu | person |  |
| `secret check` | selalu | person |  |
| `shell` | selalu | person |  |
| `db shell` | selalu | person |  |
| `cluster shell` | selalu | person |  |
| `login` | selalu | person |  |
| `login aws` | selalu | person |  |
| `ssh-gate` | selalu | person |  |
| `host ssh-command` | selalu | person |  |
| `secret keychain` | tanpa --off (memindahkan key ke keychain) | person |  |
| `host trust` | dengan --reset, saat sebuah key di-pin | person |  |
| `export` | dengan --sealed atau --for-phone | person |  |
| `import` | SOURCE komando, saat file tersegel (export --sealed): orang mengetik passphrase-nya | person |  |
| `group rm` | GROUP saja: menghapus grup dengan lebih dari 3 anggota (CONFIRM_REQUIRED) | change | `--yes` |

<!-- end of tiers -->

## Sabuk pengaman untuk agen AI

komando mengenali Claude Code, Codex, Gemini CLI, dan Cursor dari variabel lingkungan yang mereka atur (variabel yang ada dihitung, apa pun nilainya, juga `0` atau kosong), dan menambahkan aturan ini untuk mereka. Untuk agen lain, atur `KOMANDO_AGENT=1` (atau `AI_AGENT=1`) di lingkungan tempat agen menjalankan perintah, supaya aturan ini berlaku juga untuknya. Script dan Anda di terminal tidak terpengaruh olehnya.

| Sabuk pengaman | Fungsinya |
|----------------|-----------|
| **Seseorang mengizinkan flag berisiko** | Saat agen menambahkan `--yes`, `--allow-dangerous`, atau `--reveal`, komando membuka jendela di layar Anda dengan seluruh perintah, alasan komando menghentikannya (aturan yang cocok, server yang dilindungi), server tempat perintah berjalan dan, bila baris perintah tidak menunjukkannya, program di komputer ini yang diizinkannya berjalan. Untuk `exec --script FILE`, `job start --script FILE`, dan `exec --stdin-file FILE`, jendela juga menampilkan SHA-256 file dan setiap barisnya, tidak pernah sebagian: file yang lebih panjang dari 40 baris (baris panjang dibungkus di 100 karakter) atau 16 KB, yang bukan teks valid atau memuat karakter bidi atau zero-width, dan yang tampak memuat kata sandi, key, atau token tidak mendapat jendela, dan agen meminta Anda menjalankan perintahnya sendiri. SQL dari `db query --file` ditampilkan dengan cara yang sama, begitu juga perintah yang diisi recipe (`recipe run`), dengan catatan bila berjalan dengan sudo: recipe tersimpan bisa diganti di antara dua eksekusi, jadi Anda mengizinkan apa yang berjalan, bukan sebuah nama. Isi yang disimpan atau dikirim perintah dari file atau dari stdin (`fs write --from`, `cluster apply --file`, `queue send --from`, unggahan dengan `cp`, `upload`, atau `storage upload`, file `-f` dan `--from-file` milik `cluster run`, arsip pg_dump untuk `db restore`) ditampilkan utuh bila muat. File bernama yang hanya terlalu panjang, atau bukan teks (arsip, gambar), disebut dengan ukuran dan SHA-256-nya, dengan catatan bahwa isinya tidak ditampilkan, sehingga Anda bisa memeriksa file itu lebih dulu; isi di stdin yang terlalu panjang, dan isi yang memuat karakter tak terlihat atau tampak memuat kata sandi, tidak mendapat jendela. Folder (`cp -r`, `sync`) ditampilkan sebagai daftar file-nya, masing-masing dengan ukuran dan SHA-256; daftar yang lebih panjang dari 40 baris tidak mendapat jendela. SQL polos dari `db restore` adalah kode, seperti `db query --file`: ditampilkan utuh (`.gz` dibuka) atau tanpa jendela. Indentasi lebih dari 16 spasi disebut sebagai `(+N)`, sehingga YAML yang dalam mempertahankan struktur bersarangnya. `import` memeriksa secret yang akan digantikannya dengan cara yang sama seperti `secret set`. Jawaban ya Anda mencakup apa yang ditampilkan jendela itu: bila pemeriksaan berikutnya atas perintah yang sama membawa script, aturan, atau target yang dilindungi yang tidak ada di jendela, komando bertanya lagi, dengan itu di jendela. Jawaban ya untuk `--reveal` dan jawaban ya untuk `--yes` atau `--allow-dangerous` tidak pernah menjawab untuk satu sama lain. Perubahan yang merusak pada target yang dilindungi bertanya sekali, di jendela yang menyebut kedua flag. Perintah berjalan hanya saat Anda mengklik **Allow once**. Pindah baris, tab, karakter kontrol, deretan spasi yang panjang, dan karakter yang tidak menggambar apa pun tampil sebagai escape (`$'a:\n  b: 1'`, `\u3164`), yang dibaca shell Anda kembali sebagai teks yang sama. Perintah yang tidak bisa ditampilkan utuh (lebih panjang dari 500 karakter, teks tidak valid, atau dengan karakter bidi atau zero-width) tidak mendapat jendela: agen diberi tahu untuk memperpendeknya atau meminta Anda menjalankannya. Agen tidak bisa mengkliknya. Dengan `komando config approval-code`, jendela juga meminta kode 6 digit dari aplikasi authenticator Anda, jadi satu klik saja tidak cukup (lihat [Pengaturan](settings.md#ask-for-a-code-before-an-agents-risky-command)). Di desktop Linux atau BSD (X11 atau Wayland), tempat program Anda yang lain bisa menekan tombol jendela, kodenya wajib: tanpanya komando tidak membuka jendela, dan agen meminta Anda menyalakan kode atau menjalankan perintahnya sendiri (macOS dan Windows mempertahankan jendela biasa). Tanpa layar (sesi SSH, server, `KOMANDO_NO_DIALOG` diatur), agen ditolak dan meminta Anda menjalankan perintah di terminal Anda sendiri. Jendela yang tidak dijawab siapa pun menutup setelah 2 menit; agen diberi tahu tidak ada yang menjawab (bukan bahwa Anda mengklik Deny) dan bertanya kepada Anda apakah mau mencoba lagi. |
| **Secret disembunyikan dari agen** | Kata sandi, key, dan token di output apa pun (file `.env`, `env`, baris log, baris database, Kubernetes Secret, `requirepass` di `redis.conf`, private key, hash kata sandi) tampil sebagai `[hidden]`. Anda dan script Anda melihat nilai sebenarnya. |
| **Data pribadi disembunyikan dari agen** | Di server dan conn yang dilindungi, alamat email, nomor telepon, nomor kartu, dan IBAN di apa yang dibaca agen (baris database, nilai cache, baris log, file) tampil sebagai `[hidden: email]`, `[hidden: phone]`, `[hidden: card]`, dan `[hidden: iban]`. Lihat [Data pribadi](#personal-data). |
| **Agen tetap bisa mengatur secret** | `fs replace --old 'DB_PASSWORD=[hidden]' --new 'DB_PASSWORD={{secret:db}}' --yes` menaruh nilai vault di server tanpa dilihat agen, setelah Anda mengizinkannya di jendela. Teks yang masih memuat `[hidden]` tidak pernah ditulis menimpa file asli (`HIDDEN_VALUE`). Agen bisa mengganti nama secret dengan `secret rename` (setiap rujukan ikut) tanpa melihatnya. |
| **Seseorang menentukan ke mana secret pergi** | Begitu sebuah nilai ada di server yang dikendalikan agen, nilai itu bisa kembali dalam bentuk yang tidak dikenali komando (dibalik, dalam heksadesimal, dipotong-potong). Jadi saat agen mengirim secret ke suatu tempat, agen butuh `--yes`, dan jendela menyebut secret dan tempatnya (`SECRET_DESTINATION`): `{{secret:NAME}}` di `fs write` dan `fs replace`, `exec --env K=secret:NAME` dan `job start --env`, `db user add` dan `db user passwd`, dan rujukan kata sandi atau pre-shared key (`secret:`, `env:`, `file:`, ...) yang dipasang `host add`, `host edit`, `conn add`, `conn edit`, `vpn add`, `vpn edit`, atau impor pada server, conn, atau VPN, atau server, conn, atau VPN dengan rujukan yang pindah ke alamat, port, server VPN, jalur `--via`, atau proxy command lain. Memindahkan jump server dihitung untuk semua yang ada di belakangnya: agen yang memberi server alamat, port, `--via`, atau proxy command baru ditanya tentang setiap kata sandi yang dikirim server dan conn lain melaluinya. Memindahkan VPN dihitung dengan cara yang sama: `vpn edit` agen pada alamat, portal, server, atau profilnya, `vpn add --overwrite`, impor yang menggantikannya, atau profil baru di vault, ditanyakan untuk setiap kata sandi tersimpan yang dikirim server dan conn lewat VPN itu (jalur `--via` mereka lewat VPN, termasuk jump server); server yang hanya memakai key tidak mengirim apa pun. Begitu juga secret yang menentukan siapa yang dipercaya komando: agen yang mengganti profil VPN OpenVPN di vault (`secret set`, `secret cp --overwrite`, `secret rename --overwrite`) ditanya seperti untuk `vpn edit` (jendela menyebut server barunya), dan yang mengganti, atau membuat, sertifikat CA tempat server WinRM atau conn diperiksa (`?ca=secret:NAME`), atau mengarahkan server WinRM ke server lain, juga butuh jawaban ya dari Anda (`SAFETY_SETTING`). Edit yang mempertahankan tempatnya (tag, nama user) tidak menanyakan apa pun. Nilai env milik server sendiri dari vault (`host edit --env KEY=secret:NAME`) dikeluarkan dari perintah agen, dengan peringatan pada `exec` dan `job start`, kecuali agen menambahkan `--yes` dan Anda mengizinkannya. Dry run tidak pernah bertanya: dry run mempertahankan `{{secret:NAME}}` apa adanya dan menyatakan apa yang dibutuhkan eksekusi sungguhan. |
| **Seseorang menentukan soal koneksi yang lebih lemah** | Agen yang menambah conn yang URL-nya menurunkan perlindungan jaringan, atau mengeditnya sehingga demikian, butuh `--yes` dan jawaban ya Anda di jendela (`SAFETY_SETTING`): `sslmode=disable`, `allow`, atau `prefer` (PostgreSQL), `tls=false`, `preferred`, atau `skip-verify` (MySQL), `encrypt=false`, `encrypt=disable`, atau `tls=skip-verify` (SQL Server), `tls=false` atau `tls=skip-verify` (Oracle, ClickHouse, registry, FTPS), `tls=skip-verify` atau `insecure=1` (Kafka, RabbitMQ, NATS, SQS, Pub/Sub), `insecure=1` (FTP, Redis, memcached), endpoint `http://` (BigQuery), dan berpindah dari `rediss://`, `memcacheds://`, atau endpoint `https` ke yang tanpa TLS. |
| **Folder data yang lazim** | `KOMANDO_HOME` memindahkan data komando. Di folder baru komando tidak mengenal satu pun server yang Anda lindungi, aturan deny, atau host key yang di-pin, dan akan menulis audit log di sana. Jadi perintah agen dengan `KOMANDO_HOME` selain `~/.komando` berhenti (`NEEDS_PERSON`), dry run juga: pratinjau di folder lain tetap akan tersambung, tanpa host key Anda yang di-pin, dan tidak memperlihatkan apa pun yang nyata. Tidak ada flag atau jendela yang meloloskannya, karena kode persetujuan yang mungkin Anda nyalakan disimpan di folder lazim Anda, bukan di folder itu. komando tidak membuat dan tidak menulis apa pun di folder lain itu, jadi penghentian ini tidak ada di audit log mana pun. Agen diberi tahu untuk menghapus `KOMANDO_HOME` dan menjalankan perintah lagi, yang lalu memakai folder Anda sendiri. `komando guide uninstall`, yang mencabut guard agen, berhenti dengan cara yang sama. Bila Anda menyimpan data komando di tempat lain, jadikan `~/.komando` sebuah link ke folder itu: link ke folder yang sama dihitung sebagai `~/.komando`. `HOME` tidak memindahkannya untuk agen: komando mengambil folder home agen dari database user komputer, jadi `HOME=/tmp/x komando ...` tetap memakai `~/.komando` Anda (dan guard menolak baris itu). Mengatur keduanya, `HOME=/tmp/x KOMANDO_HOME=/tmp/x/.komando`, adalah folder lain seperti `KOMANDO_HOME` mana pun: berhenti. Anda, di terminal Anda sendiri, boleh mengatur `HOME`, dan komando mengikutinya. Akun yang tidak dikenal database user (di Linux komando juga bertanya ke `getent`, jadi akun LDAP dan sssd dihitung) tidak memberi komando apa pun untuk memeriksa `HOME`: perintah agen lalu butuh jawaban ya Anda di jendela (`SAFETY_SETTING`). |
| **Tanpa menebak secret** | `secret check`, yang menyatakan apakah sebuah nilai adalah yang tersimpan, hanya untuk orang (`NEEDS_PERSON`): untuk agen, perintah itu akan menjawab ya atau tidak atas tebakan. `secret show` hanya memberi tahu agen apakah nilai diawali atau diakhiri spasi, tidak pernah panjang atau hash-nya (hash kata sandi pendek bisa ditebak secara offline). |
| **File secret tetap di server** | Agen tidak bisa menyalin file yang merupakan secret menurut namanya (`.env`, private key, `credentials`, `shadow`, ...) ke komputer ini (`SENSITIVE_FILE`); salinan folder mengeluarkannya. Agen bisa membacanya dengan `fs cat`, disamarkan. Aliran ke stdout (`--to -`) mempertahankan aturan yang sama sebelum satu byte pun ditulis: teks dengan nilai secret sebagai `[hidden]`, file biner ditolak bila memuat nilai vault, secret, atau data pribadi yang disembunyikan komando, dan apa pun di atas 16 MB ditolak, karena byte di stdout tidak bisa ditarik kembali. File teks lain yang diunduh agen (`download`, `sync`, `storage download`) disimpan seperti yang ditampilkan `fs cat`, dengan nilai secret sebagai `[hidden]`, dan hasilnya menyatakan `masked`; salinan seperti itu tidak pernah diunggah kembali (`HIDDEN_VALUE`). File biner dan file di atas 16 MB disalin apa adanya, kecuali memuat nilai vault, atau target menyembunyikan data pribadi dari agen (lihat [Data pribadi](#personal-data)). |
| **File secret tetap di komputer ini** | Untuk agen, komando tidak membaca `~/.komando`, private key, credential store, atau file yang merupakan secret menurut namanya saat perintah menerima file lokal (`--stdin-file`, `script FILE`, unggahan, `sync`, `fs write --from`, `db --file`, `cluster -f`) (`SENSITIVE_FILE`); unggahan folder dan `sync` memeriksa setiap file dan mengeluarkan yang itu. Itu berlaku untuk file yang sama dengan nama lain: link, hard link, atau huruf besar dan kecil yang berbeda di macOS. Anda mengizinkan secret proyek seperti `.env` dengan `--reveal`; data komando sendiri dan `/proc/PID/environ` tidak pernah ikut. Impor (`komando import kubeconfig`, `pgpass`, `docker`, ...) boleh membaca file kredensial, karena memasukkan secret ke vault komando, yang tidak pernah dilihat agen. Rujukan kata sandi `file:` atau `env:` juga tidak bisa menunjuk ke data komando, private key, credential store, atau kata sandi secret store. Tidak ada rujukan, untuk siapa pun, yang membaca key kode persetujuan (`RESERVED_SECRET`). Perintah agen juga tidak menulis ke sana: `download`, `cp`, `sync` (dan `--delete`-nya), `storage download`, `db dump --to`, `export --to`, dan `cluster cp` tidak pernah menyimpan file ke folder komando, `~/.ssh`, `~/.aws`, `~/.config/gcloud`, `~/.azure`, `~/.kube`, `~/.docker`, `~/.gnupg`, `~/.password-store`, atau keychain, juga lewat link (`SENSITIVE_FILE`, tanpa flag: Anda menjalankan perintah seperti itu di terminal Anda sendiri). |
| **Guard di komputer ini** | `komando guide install` menambahkan guard ke Claude Code, dan ke Cursor, Gemini CLI, dan Codex di tempat Anda memakainya. Sebelum agen membaca file atau menjalankan perintah shell, komando memeriksanya dan menghentikan pembacaan `~/.komando`, private key, file `.env`, dan credential store (`~/.kube`, `~/.aws`, keychain), mendaftar semua variabel lingkungan, mengubah atau mengosongkan variabel yang dipakai komando untuk mengenali agen (`CLAUDECODE=0`, `unset`, `env -u`, `env -i`, `read`, `sudo komando`) atau `KOMANDO_HOME`, mengatur `HOME` di depan komando, mencari atau mengarsipkan folder yang memuatnya (`grep -r ~`, `tar -C ~ ...`), dan menjalankan `ssh`/`scp` di sekitar komando. Guard membaca path relatif dari folder kerja agen, mengikuti `cd`, dan menghitung glob seperti `~/.komand?/*` sebagai path yang mungkin dicocokkannya; pola yang dikutip (`grep '.*' f`) bukan glob. Lewati dengan `--no-guard`. |

## Menambah aturan Anda sendiri

```bash
komando policy deny 'terraform\s+destroy'           # regular expression Go; mencetak id-nya
komando policy list                                  # aturan bawaan dan aturan deny Anda, dengan id
komando policy rm 'terraform\s+destroy'              # hapus lagi
komando policy rm custom-1a2b3c4d                    # atau hapus menurut id-nya
komando policy check 'terraform destroy'             # exit 6 bila akan diblokir
komando policy check --conn-kind postgres 'delete from users'   # nilai SQL, Redis, atau MongoDB sebagai gantinya
```

Aturan mencocokkan perintah seperti shell membacanya, jadi tanda kutip dan backslash di dalam sebuah kata (`r\m`, `/e""tc`) tidak menyembunyikannya. Pola kustom yang bukan regular expression valid memblokir setiap perintah sampai Anda memperbaiki atau menghapusnya; `komando doctor` dan `policy list` menyebutnya.

Aturan bawaan tidak bisa dihapus. Id aturan kustom (`custom-` dan delapan huruf dan angka) dibuat dari polanya, jadi tetap sama saat aturan lain dihapus. Pola yang cocok dengan teks kosong (`.*`) ditolak: pola itu akan memblokir setiap perintah. Menghapus aturan mematikan sebuah pemeriksaan, jadi komando bertanya dulu (script menambahkan `--yes`).

`policy check` keluar dengan 6 bila perintah akan diblokir, jadi bisa dipakai di `if`. `--conn-kind` menilai sebuah pernyataan untuk jenis conn sebagai gantinya: `postgres`, `mysql`, `sqlserver`, `oracle`, `clickhouse`, `snowflake`, `bigquery`, `sqlite`, `redis`, `memcached`, atau `mongodb` (dokumen perintah sebagai JSON). Perintah ini juga keluar dengan 6 bila pernyataan bersifat merusak, yang ditolak `db query` dan `cache run` tanpa `--allow-dangerous`.

## Data pribadi

Data pelanggan di production tidak boleh sampai ke model AI. Di server dan conn yang dilindungi, agen AI melihat data pribadi disembunyikan di apa yang dibacanya dari sana: baris `db query` (juga dengan `-o csv`), `cache get` dan `cache run`, `storage cat`, `fs cat`, `exec`, `logs`, dan perintah lain yang menampilkan data dari server atau resource. Inventaris komando sendiri (alamat server, URL conn) tidak pernah disembunyikan.

| Tampil sebagai | Yang dicari komando |
|----------------|---------------------|
| `[hidden: email]` | alamat email (bukan `git@...` atau `noreply@...`) |
| `[hidden: phone]` | nomor telepon dalam bentuk internasional: `+`, kode negara, 8 sampai 15 digit |
| `[hidden: card]` | nomor kartu pembayaran: digit awal jaringan kartu, panjangnya, dan check digit yang valid |
| `[hidden: iban]` | IBAN dengan check digit yang valid |
| `[hidden: column]` | nilai apa pun di kolom database yang Anda sebut (di bawah) |

```bash
komando config set mask_personal all             # di setiap server dan conn
komando conn edit staging-db --option mask_personal=on   # di conn ini, apa pun pengaturannya
komando conn edit prod-db --option 'mask_columns=name address birth_date'
komando config set mask_personal protected       # kembali ke default (komando bertanya dulu)
```

- Pengaturan `mask_personal` adalah `protected` (default), `all`, atau `off`. Menampilkan lebih banyak kepada agen (`all` ke `protected`, atau `off`) mematikan sebuah pemeriksaan, jadi komando bertanya dulu; script menambahkan `--yes`.
- Nama dan alamat jalan tidak punya bentuk yang bisa ditemukan komando, jadi sebut kolom yang memuatnya di `mask_columns`, dipisah spasi. Mengaturnya juga menyalakan penyembunyian data pribadi untuk conn itu.
- Query yang menyebut kolom tersembunyi bisa mengganti namanya (`name AS customer`), menghitung darinya (`upper(name)`), atau menanyakannya (`WHERE name LIKE 'A%'`), dan komando tidak bisa membedakan hasil mana yang berasal darinya. Jadi `db query` agen AI yang menyebutnya di mana pun berhenti dengan `REVEAL_NEEDS_PERSON` (exit 6): seseorang mengizinkannya dengan `--reveal`. `SELECT *` menampilkan kolom itu sebagai `[hidden: column]` di samping yang lain. Di MongoDB namanya adalah field, disembunyikan di kedalaman berapa pun, dan perintah yang menyebut salah satunya berhenti dengan cara yang sama.
- Ini menghentikan query biasa, bukan database yang menyusun nama saat berjalan (nilai seluruh baris, SQL dinamis, view yang mengganti nama kolom). Untuk kolom yang tidak boleh dibaca agen, jangan beri user database conn itu hak untuk membacanya.
- Data yang sama tidak diserahkan lewat jalan lain. Untuk agen AI, di tempat data pribadi disembunyikan: `cp`, `sync`, dan `download` menyimpan file dengan data itu disembunyikan; `fs replace`, `fs write --dry-run`, `fs restore`, dan `docker compose` menampilkannya tersembunyi; `db dump` berhenti dengan `SENSITIVE_FILE` (dump tidak bisa disamarkan). Nilai yang bukan teks ditampilkan sebagai base64; bila memuat secret atau data pribadi, seluruh nilai terbaca `[hidden]`.
- File yang tidak bisa ditampilkan komando dengan data pribadi disembunyikan menghentikan `cp`, `sync`, `download`, atau `cluster cp` milik agen AI dengan `SENSITIVE_FILE`: file biner yang teksnya memuat secret atau data pribadi, file biner di atas 256 KiB (terlalu besar untuk diperiksa), dan file apa pun di atas 16 MiB. Seseorang mengizinkannya dengan `--reveal`.
- Penyembunyian mengikuti database, bukan nama conn: conn kedua ke database yang sama (alamat server dan nama database yang sama) menyembunyikan sama banyaknya. Conn ke server yang sama dengan alamat lain (nama host sebagai ganti IP, port `localhost` milik tunnel) tidak dikenali sebagai yang sama, begitu juga file SQLite dengan path lain (`~/app.db` dan path lengkapnya, link, huruf besar dan kecil lain di macOS). Di PostgreSQL penyembunyian berlaku per database; di MySQL, SQL Server, ClickHouse, MongoDB, dan yang lain, yang conn-nya membaca setiap database di server, penyembunyian mencakup seluruh server.
- Mengeluarkan kolom dari `mask_columns`, mematikan `mask_personal`, atau menggantikan (`conn add --overwrite`, `import --overwrite`) atau menghapus conn seperti itu menampilkan lebih banyak kepada agen: agen AI butuh jawaban ya dari seseorang untuk itu (`SAFETY_SETTING`), seperti untuk pengaturannya. `mask_columns` menerima nama kolom tanpa tabel, dan opsinya ditulis dalam huruf kecil.
- Seseorang menentukan kapan agen melihat nilai sebenarnya: dengan `--reveal`, yang diizinkan seseorang di jendela persetujuan, agen melihatnya untuk satu perintah itu.
- Nilai yang disamarkan tidak pernah ditulis kembali: `db query --write`, `cache set` atau `cache run --write`, dan penulisan file, yang masih memuat `[hidden: ...]` berhenti dengan `HIDDEN_VALUE`.

## Riwayat

Setiap tindakan ada di audit log: waktu, siapa yang menjalankan, agen AI mana yang meminta, apakah seseorang mengizinkan, target, dan perintahnya. Setiap perubahan pada inventaris dan pengaturan keamanan juga ada di sana: server, conn, grup, key, secret (hanya nama), `config set` (nilai lama dan baru), serta `policy deny` dan `policy rm`.

```bash
komando audit -o text                 # satu baris per entri, 50 terbaru
komando audit -n 0                    # semua entri
komando audit --failed                # hanya tindakan yang gagal atau diblokir
komando audit --target @web           # hanya server atau conn ini
komando audit --command exec          # hanya satu keluarga perintah
komando audit --since 2h              # semua dalam dua jam terakhir
komando audit --since yesterday --until today   # semua kemarin
komando audit verify                  # periksa rantainya
```

Setiap record membawa hash record sebelumnya, jadi `komando audit verify` (dan `komando doctor`) mengetahui record yang diedit, ditambahkan, atau dihapus di luar komando. Bila audit log tidak bisa ditulis, komando menolak berjalan (`AUDIT_UNAVAILABLE`). Atur `KOMANDO_ACTOR` untuk memilih nama yang dicatat untuk Anda atau agen Anda. Lingkungan agen bisa mengatur nama itu menjadi apa pun, jadi record-nya menyimpan agen itu sendiri (`agent`) dan akun komputer Anda, dibaca dari sistem (`os_user`), dan menandai nama itu sebagai yang diklaimnya (`actor_claimed`); `komando audit -o text` menampilkannya sebagai `Claude Code (as claude)`. Untuk menjauhkan teks SQL dari riwayat, lihat `audit_sql` di [Pengaturan](settings.md#settings).

## Key yang hanya menjalankan komando

Untuk menjangkau komando di komputer ini dari perangkat lain (aplikasi Komando di ponsel Anda, komputer lain), beri SSH key perangkat itu hanya komando: `komando ssh-gate line` mencetak baris untuk `~/.ssh/authorized_keys`.

```bash
komando ssh-gate line --name phone ~/phone.pub                  # boleh membaca dan mengubah
komando ssh-gate line --name phone-read --read-only ~/phone.pub  # hanya membaca, tanpa jaringan
komando ssh-gate line --name phone-net --read-only --network ~/phone.pub  # membaca, pemeriksaan jaringan juga
```

Key menanyakan `komando ssh-gate status` yang mana ia: ssh-gate menjawabnya sendiri, dengan nama key, `read_only`, dan `network`.

Baris diawali `restrict,command="/full/path/komando ssh-gate --name phone"`. Tambahkan ke `~/.ssh/authorized_keys` milik akun tempat komando berjalan, sebagai ganti baris biasa key itu. `restrict` mematikan port, agent, dan X11 forwarding serta terminal (OpenSSH 7.2 atau lebih baru). Untuk key itu, sshd lalu menjalankan `komando ssh-gate` apa pun yang diminta key, dan:

| Sabuk pengaman | Fungsinya |
|----------------|-----------|
| **Hanya komando** | Perintah key harus satu perintah komando (`ssh HOST komando list -o json`), dengan paling banyak `KOMANDO_AGENT=NAME` sebelumnya. ssh-gate memecahnya menjadi kata seperti shell, tetapi tidak menjalankan shell dan tidak meng-expand apa pun: `;`, `\|`, `&`, `>`, `<`, `$`, backquote, atau pindah baris tanpa tanda kutip ditolak, begitu juga `$` atau backquote di dalam tanda kutip ganda (`SSH_GATE_SYNTAX`); taruh argumen seperti itu di dalam tanda kutip tunggal. Program lain, login shell, `scp`, atau `sftp` juga ditolak (`SSH_GATE_REFUSED`). |
| **komando memperlakukannya sebagai agen AI** | Nilai secret tetap `[hidden]`. `--reveal` dan `--allow-dangerous` ditolak, begitu juga perintah untuk orang di terminal (`shell`, `db shell`, `cluster shell`, `secret passphrase`, `secret check`, `login aws`, `config approval-code`). `--yes` pada target yang dilindungi butuh orang di komputer ini, yang bukan key itu: ubah server yang dilindungi di sini. Tidak ada jendela persetujuan yang terbuka untuk sebuah key. |
| **Tidak ada yang ditulis di sini** | Setiap key, read-only atau bukan, menjalankan perintah di server, tidak pernah yang menulis di komputer ini: file yang disimpannya di sini bisa jadi `~/.ssh/authorized_keys` atau file startup shell. Jadi `download` dan `storage download` (kecuali `--to -`, yang mengalir ke output key sendiri dan adalah pembacaan, diizinkan untuk key read-only juga), `db dump`, `export --to`, dan `cp` atau `sync` ke folder di sini (kecuali `cp TARGET:PATH -`) ditolak, begitu juga perubahan apa pun pada pengaturan komando sendiri: server, conn, VPN, grup, pengaturan, aturan policy, secret, key, recipe, `guide install`, `import`, `host trust`, `tunnel start` dan `stop`, serta `update` (`SSH_GATE_REFUSED`). Ubah itu di sini, sebagai orang. Setiap key, read-only juga, ditolak untuk setiap perintah, pembacaan juga, pada target yang adalah komputer ini: conn sqlite, yang berupa file di sini (`VACUUM INTO`, `ATTACH`, dan `db restore` menulis file apa pun), dan server, conn, atau cluster di `localhost`, alamat `127.x` atau `::1`, interface loopback (`fe80::1%lo0`) atau nama komputer ini. Lewat target seperti itu `exec` akan menjadi shell di sini (`--read-only` adalah filter, bukan sandbox), `logs --file`, `fs cat`, dan `fs list` akan membaca file apa pun di sini, private key juga, dan Postgres `COPY TO PROGRAM` atau `pg_read_file`, Redis `CONFIG SET dir`, dan volume `hostPath` Kubernetes menjalankan program atau membaca dan menulis file di sini. Untuk sebuah conn setiap host di URL-nya dihitung, daftar (`a,b`), Postgres `?host=` dan `?hostaddr=`, dan path socket. `cluster run -- cp POD:PATH DST` dan `key deploy --set-default` juga ditolak. Perubahan pada target yang tidak bisa ditemukan gate ditolak; pembacaan berjalan, kecuali namanya `localhost`, alamat loopback, atau alamat komputer ini sendiri, seperti ditulis atau seperti nama di-resolve (`cert check https://localhost`, `https://ip6-localhost`, nama publik yang menunjuk ke 127.0.0.1). Apa yang dihubungi pembacaan seperti itu diperiksa lagi saat tersambung, jadi nama yang jawabannya berubah di antaranya juga tidak bisa menjangkau komputer ini. Perubahan yang ditambahkan komando nanti ditolak sampai diketahui hanya bekerja pada server. Tidak ada key yang membuat komando membaca file di sini juga: `exec` dan `job start` dengan `--script FILE` atau `--stdin-file FILE`, `db query --file`, `db restore --from`, `cluster apply --file`, `fs write --from`, `upload`, `storage upload`, `cp`, dan `sync` dari path di sini, serta `cluster run -- apply -f`, `--from-file`, atau `cp` ke pod ditolak (`SSH_GATE_REFUSED`): file itu bisa berupa private key, dan jawaban server akan menyerahkannya kembali. Kirim isinya lewat input key sendiri sebagai gantinya (`--script -`). |
| **Key read-only** | Dengan `--read-only`, key hanya menjalankan perintah yang dihitung komando sebagai pembacaan (`kind` di `komando schema`): `exec` (juga dengan `--script`), `job start`, `docker exec`, dan `cluster exec` butuh `--read-only`, `db query`, `cache run`, dan `cluster run` tanpa `--write`, `db explain` tanpa `--analyze`, `pkg upgradable` tanpa `--refresh`, `pkg security` tanpa `--refresh`, dan recipe harus ditandai read-only. `storage link` dan `cluster forward` adalah perubahan (`kind: change`), karena memberikan akses atau membuka port di sini: key read-only ditolak untuk keduanya (`SSH_GATE_READ_ONLY`), key penuh menjalankannya. |
| **Key baca tidak menjangkau jaringan** | Menjangkau jaringan bukan penulisan, tetapi itu jalan keluar: apa yang dibaca key bisa keluar dalam URL atau nama DNS. Jadi key `--read-only` hanya menjalankan pembacaan komando sendiri atas server dan conn di daftar Anda (`fs`, `logs`, `facts`, `status`, `svc`, `docker ps`, `db query`, `cache run`, `cluster run`, `cert check SERVER`, ...). Key itu ditolak untuk setiap perintah `net`, `cert check` pada situs web (`https://HOST`, `HOST:PORT`, yang dihubungi komando dari komputer ini), dan `exec`, `job start`, `docker exec`, `cluster exec`, dan `recipe run`, yang programnya (`curl`, `nslookup`, ...) bisa tersambung ke mana saja (`SSH_GATE_NETWORK_REQUIRED`). Pembacaan yang ditambahkan komando nanti ditolak sampai diketahui tetap pada target yang terdaftar. Perintah SQL dan cache yang menjangkau server lain atau program adalah penulisan, jadi `db query` dan `cache run` menolaknya tanpa `--write`: Postgres `COPY ... TO PROGRAM` dan `dblink`, MySQL `INTO OUTFILE`, `LOAD DATA`, dan `LOAD_FILE`, SQL Server `OPENROWSET`, `OPENQUERY`, nama linked-server (`lnk.db.dbo.t`) dan fungsi yang membaca path file (`\\HOST\share`), ClickHouse `url()`, `remote()`, dan `s3()`, Oracle `UTL_HTTP` dan XML yang disusun query (DTD bisa menyebut URL), BigQuery `EXTERNAL_QUERY`, MongoDB `$out` dan `$merge`, Redis `MIGRATE` dan `REPLICAOF`. Tambahkan `--network` ke baris untuk key baca yang boleh menjalankannya. |
| **Setiap perintah ada di riwayat** | Setiap perintah yang dijalankan atau ditolak untuk sebuah key ada di `komando audit`: nama key (`ssh_gate`), apa yang dikirimnya (`ssh_command`, nilai yang tampak seperti secret disembunyikan), alamat asalnya (`client`) dan, bila ditolak, alasannya. Apa yang lalu diubah perintah itu dicatat sebagai dari `ssh-gate key NAME`. Catatan ini ditulis bahkan saat pengaturan `audit` mati; bila tidak bisa ditulis, tidak ada yang berjalan. Di teks `komando audit`, pindah baris dan escape terminal di apa yang dikirim key tampil sebagai `\n` dan `\x1b`, jadi key tidak bisa menambah atau menyembunyikan baris. |

Beri setiap perangkat key dan nama tersendiri, sehingga `komando audit` membedakannya dan Anda bisa menghapus satu baris untuk mengunci satu perangkat. Key menjangkau komando sebagai akun yang dipakainya login: pakai akun itu untuk komando saja, atau yang hanya punya izin yang dibutuhkan komando.

## Batasan

Agen AI berjalan sebagai user Anda sendiri di komputer Anda. Jendela persetujuan, penyamaran, dan guard menghentikan kesalahan dan prompt injection (halaman web atau file yang menyuruh agen membocorkan sesuatu). Semuanya tidak menghentikan program yang sengaja menyembunyikan jati dirinya atau mengedit guard hingga hilang: tidak ada yang berjalan sebagai Anda yang bisa. Guard membaca baris shell sebagai teks; script yang menyusun path dari potongan, atau memulai komando tanpa variabel agen dari bahasa lain, lolos darinya. Jadi:

- beri komando, dan dengan begitu agen Anda, user SSH yang hanya punya izin yang dibutuhkannya;
- tandai production dengan `komando host edit NAME --protected`;
- simpan key vault di keychain OS (pindahkan key dari `store.key` ke sana dengan `komando secret keychain`), sehingga orang lain atau backup yang menjangkau `~/.komando` tidak bisa membuka vault;
- beri SSH key perangkat lain hanya komando, dengan `komando ssh-gate line`.

Batasan lain:

- Filter perintah berbahaya menangkap kecelakaan yang umum; ini bukan batas keamanan yang lengkap.
- Penyamaran adalah upaya terbaik: secret dengan nama yang tidak lazim, atau lebih pendek dari teks di sekitarnya, tetap bisa lolos. Nilai yang lebih pendek dari 6 karakter tidak disembunyikan.
- Penyembunyian data pribadi juga upaya terbaik: nomor telepon yang ditulis tanpa `+`, atau data pribadi di gambar atau file biner, tidak ditemukan. Sembunyikan seluruh kolom di tempat yang penting.
- ssh-gate hanya melihat alamat yang disimpan komando untuk sebuah target (dan, untuk conn Kubernetes, URL conn, bukan server di kubeconfig tersimpannya). Key tidak bisa menyebut target sendiri: `u@HOST` atau IP yang tidak ada di daftar Anda ditolak (`SSH_GATE_REFUSED`), karena bisa jadi alamat komputer ini sendiri. Server terdaftar di salah satu alamat jaringan komputer ini (IP LAN-nya), atau yang host key-nya yang di-pin adalah host key SSH komputer ini sendiri (`/etc/ssh/ssh_host_*_key.pub`: nama DNS, IP publik, atau port forward yang mengarah kembali ke sini), ditolak seperti `localhost`. Apa yang tetap tidak bisa dibedakan komando: conn atau cluster yang mengarah kembali ke sini dengan nama lain, dan server di sini yang belum punya key yang di-pin atau menjalankan server SSH sendiri dengan key lain. Lewat target seperti itu key mana pun, read-only juga, akan membaca file atau mendapat shell di sini (`exec THAT-HOST --read-only -- 'nc -e /bin/sh ...'`). Jangan daftarkan komputer ini di komando dengan cara itu: `--read-only` tidak membuatnya aman.
- Key baca tanpa `--network` tetap menjangkau apa yang dijangkau server dan database Anda dengan pengaturannya sendiri: foreign table Postgres, tabel FEDERATED MySQL, `cluster()` atau dictionary ClickHouse, external function atau stage Snowflake, remote function BigQuery di project conn sendiri, webhook API server Kubernetes. Semuanya menuju tempat yang diatur seseorang, bukan tempat yang disebut key, tetapi key yang bisa membaca lewat semuanya itu mengirim query-nya ke sana juga. Dan komando membaca SQL sebagai teks: path jaringan SQL Server yang disusun dari potongan (`CHAR(92)+CHAR(92)+...`) dan diteruskan ke fungsi yang tidak didaftarkan komando tidak dikenali.
- Secret tidak pernah diterima sebagai argumen perintah, karena akan masuk ke riwayat shell Anda (`SECRET_IN_ARGS`). `komando secret set NAME` menanyakan nilai setelah prompt muncul; lihat [Secret](secrets.md#save-one).

## Pemecahan masalah

Di terminal Anda komando bertanya dulu; agen AI atau script menambahkan `--yes` (atau `--allow-dangerous`) setelah seseorang setuju. Kode di bawah adalah yang diterima agen atau script.

| Error | Exit | Artinya | Yang perlu dilakukan |
|-------|------|---------|----------------------|
| `POLICY_BLOCKED` | 6 | Perintah tampak merusak. | Periksa perintahnya. Di terminal komando meminta Anda mengetik nama apa yang akan hilang; script menambahkan `--allow-dangerous` setelah seseorang setuju. |
| `PROTECTED_TARGET`, `PROTECTED_TARGET` | 6 | Perubahan pada sesuatu yang dilindungi. | Di terminal komando bertanya `[y/N]`; script menambahkan `--yes` (`--yes` milik agen AI membuka jendela persetujuan). Perintah yang hanya melihat bisa menambahkan `--read-only`. |
| `SAFETY_SETTING` | 6 | Perubahan yang mematikan sebuah sabuk pengaman. | Di terminal komando bertanya `[y/N]`; script menambahkan `--yes` (`--yes` milik agen AI membuka jendela persetujuan). |
| `SECRET_DESTINATION` | 6 | Agen meminta mengirim secret ke tempat baru (lihat [di atas](#seatbelts-for-ai-agents)). | Beri tahu pengguna secret mana yang pergi ke mana; setelah mereka setuju, tambahkan `--yes`. |
| `OPEN_BIND` | 6 | Tunnel akan mendengarkan di alamat yang bisa dijangkau mesin lain. | Pertahankan default 127.0.0.1, atau tambahkan `--yes` setelah seseorang setuju. |
| `CONFIRM_REQUIRED` | 6 | Perubahan yang menyentuh banyak entri (menghapus grup). | Periksa dulu, lalu tambahkan `--yes` setelah seseorang setuju. |
| `WRITE_REQUIRES_FLAG` | 6 | Query atau perintah mengubah data. | Coba `--write --dry-run`, lalu `--write`. |
| `READ_ONLY_VIOLATION` | 6 | `--read-only` diberikan, tetapi komando tidak mengetahui bahwa perintah hanya membaca: perintah mengubah sesuatu, atau berupa program, opsi, atau sub-perintah yang belum dikenal komando. | Pakai pembacaan komando sendiri (`facts`, `logs`, `svc status`, `fs read`), atau hilangkan `--read-only`; seseorang boleh mengonfirmasi dengan `--yes`. |
| `DB_BYTES_LIMIT` | 6 | Query BigQuery akan membaca lebih banyak byte daripada yang diizinkan `--max-bytes`, jadi tidak dijalankan. | Pilih lebih sedikit kolom atau filter lebih banyak; naikkan `--max-bytes` hanya bila orangnya menyetujui biayanya. |
| `SQL_SAFE_SETTINGS_REQUIRED` | 6 | User ClickHouse membaca query dalam dialek lain, jadi komando tidak bisa memeriksanya. | Pakai user yang settings-nya mempertahankan `dialect = 'clickhouse'`. |
| `UNSAFE_BACKUP` | 6 | File backup memuat perintah klien, bukan SQL, yang bisa menjalankan program di tempat restore berjalan. | Hapus baris itu bila dump tidak tepercaya. |
| `SENSITIVE_FILE` | 6 | Agen mencoba menyalin file secret ke sini, atau meminta komando membaca satu di sini. | Baca dengan `fs cat` (nilai disembunyikan); seseorang boleh mengizinkan `--reveal` untuk file proyek. |
| `REVEAL_NEEDS_TERMINAL` | 6 | Hanya orang yang bisa melihat nilai secret. | Minta orangnya menjalankan perintah di terminalnya sendiri. |
| `REVEAL_NEEDS_PERSON` | 6 | Agen AI meminta `--reveal`, atau query-nya menyebut kolom yang disembunyikan darinya (`mask_columns`). | Jalankan tanpa `--dry-run`: komando bertanya kepada orangnya di jendela di layar mereka. |
| `NEEDS_PERSON` | 6 | Hanya orang yang bisa melakukan ini: `secret set` dan `secret check` untuk agen, `secret keychain`, `secret passphrase`, `doctor --accept-old-copy`, `login aws`, `host ssh-command` untuk agen, menyiapkan `config approval-code`, mengganti host key yang di-pin dengan `host trust --reset`. | Minta mereka menjalankannya di terminal mereka sendiri. `--dry-run` tetap menampilkan rencananya. |
| `STORE_OLD_COPY` | 6 | Salinan `store.db` yang lebih lama dikembalikan. | Tidak ada flag yang menghapusnya. Bila Anda memulihkannya dengan sengaja, jalankan `komando doctor --accept-old-copy` di terminal Anda sendiri (lihat [Pengaturan](settings.md#where-komando-keeps-its-data)). |
| `DECLINED` | 6 | Anda menjawab tidak pada pertanyaan komando. | Tidak ada yang diubah; jalankan lagi untuk ditanya lagi. |
| `SSH_GATE_REFUSED`, `SSH_GATE_READ_ONLY`, `SSH_GATE_NETWORK_REQUIRED` | 6 | SSH key yang dibatasi `komando ssh-gate` meminta sesuatu yang tidak boleh dijalankannya (lihat [di atas](#a-key-that-runs-komando-and-nothing-else)). | Tidak ada flag yang mengizinkannya: seseorang menjalankannya di komputer komando. |
| `SSH_GATE_SYNTAX` | 2 | Perintah key bukan satu perintah komando. | Taruh argumen dengan `;`, `\|`, `$`, backquote, dan sejenisnya di dalam tanda kutip tunggal: `$` dan backquote ditolak bahkan di dalam tanda kutip ganda. |
| `SSH_GATE_PATH` | 1 | `komando ssh-gate line` tidak bisa mengetahui path lengkap komando, yang dibutuhkan baris itu. | Jalankan dengan path lengkapnya, seperti `/usr/local/bin/komando ssh-gate line ...`. |
| `SHARED_FOLDER_CONFLICT` | 8 | Penulisan sebagai root (`--sudo`) ke folder yang bisa diubah user server lain. | Tulis file sebagai user itu sebagai gantinya; hint memberikan perintah `exec --sudo-user`. |
| `HIDDEN_VALUE` | 2 | Teks memuat `[hidden]` atau `[secret:NAME]`. | Ubah satu baris dengan `fs replace`, memakai `{{secret:NAME}}`. |
| `SECRET_IN_ARGS` | 2 | Nilai secret diberikan di command line. | Jalankan `komando secret set NAME` dan ketik setelah prompt, atau pakai `--from-env VAR` atau pipe. |
| `HOSTKEY_MISMATCH` | 4 | Identitas server berubah. | Jangan pernah "memperbaikinya" secara asal; lihat [Hasil dan error](output.md#troubleshooting). |
| `AUDIT_UNAVAILABLE` | 1 | Audit log tidak bisa ditulis, jadi tidak ada yang berjalan. | `komando doctor` menunjukkan alasannya. |
