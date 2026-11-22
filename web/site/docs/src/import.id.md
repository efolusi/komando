# Pindah ke komando dan pindah komputer

Bawa masuk server dan database yang sudah ada, dan pindahkan semuanya ke komputer lain.

## Mengimpor server

```bash
komando import ssh-config --dry-run              # lihat dulu apa yang akan ditambahkan
komando import ssh-config                        # server dari ~/.ssh/config
komando import env ./shop/.env --group shop      # DATABASE_URL, REDIS_URL, ... dari file .env
komando export --to komando-backup.json          # simpan semuanya (tanpa kata sandi)
komando import komando komando-backup.json       # di komputer lain
```

Jika diketik tanpa argumen, `komando import` menanyakan sumbernya, lalu filenya.

Impor ditutup dengan perintah yang memeriksa apa yang masuk:

```text
Next: komando test @shop
```

## Mengimpor apa yang sudah ada

Tulis `komando import SOURCE [FILE]`. Tanpa file, komando membaca tempat yang lazim untuk sumber itu.

| Sumber | Yang dibaca (file default) | Yang ditambahkan |
|--------|----------------------------|------------------|
| `ssh-config` | `~/.ssh/config` (termasuk `ProxyJump`) | server |
| `pgpass` | `~/.pgpass` | conn PostgreSQL |
| `mycnf` | bagian `[client]` di `~/.my.cnf` | conn MySQL/MariaDB |
| `env` | file `.env` (default `.env`) | satu conn untuk setiap nilai yang berupa URL database, cache, atau storage |
| `kubeconfig` | `~/.kube/config` | satu conn Kubernetes per context |
| `docker` | `~/.docker/config.json` (dan credential helper) | conn registry |
| `filezilla` | `sitemanager.xml` milik FileZilla | server (situs SFTP; situs FTP dicantumkan, tidak ditambahkan) |
| `rclone` | `rclone.conf` | server (remote SFTP) |
| `mobaxterm` | sesi MobaXterm yang diekspor (`.mxtsessions`; tanpa default: berikan file-nya) | server (sesi SSH; folder sebuah sesi menjadi grup; jenis sesi lain dicantumkan) |
| `putty` | sesi PuTTY yang diekspor dari registry Windows (tanpa default: berikan file-nya, lihat di bawah) | server (sesi SSH; key `.ppk`, proxy, dan sesi telnet atau serial dicantumkan beserta apa yang dilakukan) |
| `aws` | `~/.aws/config` (dan `credentials`) | satu conn storage S3 per bucket dari setiap profil; conn memakai profilnya, jadi tidak ada key yang disalin ([Login cloud](cloud.md#add-a-conn-for-every-s3-bucket)) |
| `aws-ec2` | `~/.aws/config` (dan `credentials`) | satu server per instance EC2 yang berjalan dari setiap profil, di region profil itu, dibaca dengan login profil (tidak ada yang diubah di AWS): dinamai menurut tag `Name`, dalam grup bernama region, berlabel `aws-instance`. Instance tanpa alamat publik, yang Windows, dan key pair-nya dicantumkan beserta apa yang dilakukan |
| `dbeaver` | `data-sources.json` milik DBeaver | conn database (atur kata sandinya sesudahnya) |
| `komando` | file dari `komando export` | server, conn, VPN, dan recipe |
| `csv` | spreadsheet yang disimpan sebagai CSV (tanpa default: berikan file-nya) | server, satu per baris; lihat [Menambah banyak server dari spreadsheet](servers.md#add-many-servers-from-a-spreadsheet) |

```bash
komando import pgpass                     # database PostgreSQL dari ~/.pgpass
komando import mycnf                      # MySQL/MariaDB dari ~/.my.cnf
komando import kubeconfig                 # satu conn per context Kubernetes
komando import ssh-config ~/work/ssh_config --group work
```

Flag: `-g`/`--group` menambahkan semua yang diimpor ke sebuah grup, dan `--overwrite` menggantikan entri yang sudah punya nama sama (pada entri yang dilindungi komando bertanya dulu kepada Anda; agen AI atau script menambahkan `--yes` setelah seseorang setuju). Tanpa `--overwrite`, komando melewati nama yang sudah dimilikinya.

### Apa yang terjadi pada kata sandi

Kata sandi yang ditemukan di file-file ini masuk ke vault sebagai `<name>-pass`. Kata sandi tidak pernah muncul di daftar, output, atau riwayat komando.

### Apa yang diperiksa komando

- Mengimpor file yang sama lagi tidak mengubah apa pun. Database lain yang kebetulan bernama sama mendapat nama kosong berikutnya (`shop-2`).
- Conn mendapat default TLS yang sama dengan `conn add`: URL database yang tidak menyebut TLS mendapat TLS yang memeriksa sertifikat (misalnya `sslmode=verify-full`, disebutkan dalam sebuah catatan), dan URL `redis://`, `amqp://`, atau URL teks polos lainnya ke komputer lain dilewati kecuali berakhir dengan `?insecure=1`.
- Dengan `--overwrite`, hasilnya mencantumkan apa yang diganti. Tanpa jawaban ya, server, conn, atau VPN yang dilindungi dilewati, di dry run juga.
- File tidak bisa menyalakan apa yang diminta `host edit` dan `vpn edit` dari seseorang: `forward_agent` pada server yang sebelumnya tidak meminjamkan ssh-agent, `legacy_crypto` atau `allow_pap` pada VPN, dan, untuk VPN yang digantikannya, CA yang tidak lagi dipakai untuk memeriksa server atau `mfa` atau perlindungan yang dimatikan. Masing-masing berhenti dengan `SAFETY_SETTING` (exit 6) sampai Anda menjawab ya: di terminal, komando bertanya, script menambahkan `--yes`, dan jawaban ya dari agen AI datang dari Anda di jendela komando. Pengaturan di dalam file tidak pernah diterapkan; hasilnya mencantumkannya di `settings_differ` beserta perintah yang dijalankan.
- Hasilnya menyebut perintah yang memeriksa apa yang masuk di `data.next`, dan seseorang melihatnya di stderr: `Next: komando test @shop`.
- Server diperiksa seperti `host add` (port, user, `--via`). Yang buruk dilewati, dengan alasannya. Impor `csv` lebih ketat: satu baris yang buruk menghentikan seluruh impor, dan tidak ada yang ditambahkan.
- Apa pun yang tidak bisa diimpor komando dicantumkan, dengan alasannya. Misalnya: baris `.pgpass` dengan `*`, jenis URL yang tidak dikenal komando, pola `Host *` (pengaturannya menjadi default untuk server lain), atau file `Include` yang hilang. `HostName %h.example.com` dipahami.
- `ProxyCommand` berjalan di komputer ini, jadi agen AI butuh jawaban ya dari seseorang (`--yes` dan jendela persetujuan) untuk mengimpornya. Tanpa itu, server tersebut dikeluarkan beserta alasannya, server lain tetap masuk, dan impor berakhir dengan `IMPORT_INCOMPLETE` (exit 1).

### Datang dari PuTTY

PuTTY menyimpan sesinya di registry Windows. Ekspor ke sebuah file, lalu impor file itu (dry run lebih dulu mencantumkan apa yang masuk):

```bash
reg export HKCU\Software\SimonTatham\PuTTY\Sessions putty.reg
komando import putty putty.reg --dry-run
komando import putty putty.reg
```

PuTTY tidak menyimpan kata sandi, jadi atur dengan `komando secret set` atau pakai key. Key dalam format PuTTY sendiri (`.ppk`) dicantumkan: konversikan dengan `puttygen KEY.ppk -O private-openssh -o KEY`, lalu `komando key add NAME KEY`. Sesi yang menjangkau servernya lewat proxy juga dicantumkan: atur jalan ke sana dengan `komando host edit NAME --via JUMP`.

### Datang dari MobaXterm

Di MobaXterm, klik kanan **User sessions** dan pilih **Export all sessions to file**, lalu impor file itu:

```bash
komando import mobaxterm sessions.mxtsessions --dry-run
komando import mobaxterm sessions.mxtsessions
```

Sesi SSH masuk beserta host, port, dan user-nya, dan folder tempat sebuah sesi berada menjadi grup. MobaXterm menyimpan kata sandi secara terpisah, jadi atur dengan `komando secret set` atau pakai key.

### Datang dari SecureCRT

Di SecureCRT, pilih **File > Export Settings** (versi lama: **Tools > Export Settings**) dan impor file `.xml` itu. Atau berikan folder `Sessions` di dalam folder konfigurasi SecureCRT (Options > Global Options > Configuration Paths menunjukkan letaknya):

```bash
komando import securecrt securecrt.xml --dry-run
komando import securecrt securecrt.xml
komando import securecrt ~/Library/Application\ Support/VanDyke/SecureCRT/Config/Sessions --dry-run
```

Sesi SSH2 masuk beserta host, port, user, dan file key-nya, dan folder tempat sebuah sesi berada menjadi grup. Sesi Telnet, serial, dan RDP dicantumkan. Key dalam format PuTTY (`.ppk`) dan firewall atau jump host dicantumkan beserta apa yang perlu dilakukan. komando tidak pernah membaca kata sandi dan passphrase key yang disimpan SecureCRT: atur dengan `komando secret set` atau pakai key.

### Datang dari Termius atau TablePlus

Termius dan TablePlus tidak punya format ekspor terbuka. Dari Termius, ekspor host sebagai SSH config dan jalankan `komando import ssh-config FILE`. Untuk database, taruh URL-nya di file `.env` dan jalankan `komando import env FILE`.

## Pindah ke komputer lain

Ada tiga cara. Ekspor memindahkan server, conn, VPN, recipe, aturan deny sendiri, dan pengaturan, tetapi tanpa kata sandi dan tanpa file key: Anda mengaturnya lagi. [Ekspor tersegel](#a-sealed-export-everything-with-passwords) memindahkan hal yang sama dengan kata sandi dalam satu file yang hanya terbuka dengan passphrase pilihan sendiri. Menyalin folder memindahkan semuanya, termasuk kata sandi, setelah vault punya passphrase.

### Ekspor dan impor (tanpa kata sandi)

`export` menyimpan server, conn, dan VPN, dan saat mengekspor semuanya juga recipe tersimpan, aturan deny sendiri (`policy deny`), dan pengaturan:

```bash
komando export --to komando-backup.json       # semuanya; tanpa kata sandi
komando export @prod --to prod.json           # hanya yang dipilih sebuah target (tanpa recipe)
komando export                                # cetak, bukan tulis ke file
```

`export` menulis file dengan mode 0600, dan menolak menggantikan file yang sudah ada kecuali ditambahkan `--overwrite`.

Di komputer lain:

```bash
komando import komando komando-backup.json
komando secret set prod-db-pass               # impor mencantumkan kata sandi yang perlu diatur lagi
```

File ekspor tidak berisi kata sandi, hanya namanya, jadi atur lagi dengan `komando secret set`. Impor menambahkan aturan deny (aturan itu hanya menghentikan lebih banyak), tetapi tidak mengubah pengaturan apa pun: impor mencantumkan pengaturan yang berbeda, masing-masing dengan perintah `komando config set` yang mengaturnya, karena file dari orang lain tidak boleh mematikan sebuah pemeriksaan. Bila komando menolak sesuatu di dalam file, sisanya tetap masuk dan impor berakhir dengan `IMPORT_INCOMPLETE` (exit 1): perbaiki entri itu dan impor lagi (yang sudah masuk dilewati).

Private key juga tidak pernah ada di file ekspor. Saat server login dengan key dari `komando key`, `export` menyebut key itu (`keys_needed`) dan file-nya (`key_files`): salin file itu sendiri ke komputer lain. Key yang dibuat komando (`key gen`) disegel di dalam komando dan tidak punya file (`keys_sealed`): buat yang baru di komputer lain dengan `komando key gen NAME` dan pasang di server dengan `komando key deploy`. Impor tetap menambahkan server, menyebut key mana yang dibutuhkan, dan membiarkan key itu kosong sampai key itu dibawa (ssh-agent atau key default mungkin bisa login sementara itu):

```bash
komando key add deploy ~/Downloads/deploy     # file key yang disalin
komando host edit db1 --key deploy
```

File ekspor bisa berasal dari orang lain, jadi komando mengimpornya dengan batasan ini:

- `ProxyCommand` dibuang, karena akan berjalan di komputer ini. Atur sendiri dengan `komando host edit NAME --proxy-command ...`.
- Rujukan kata sandi dipertahankan hanya bila menyebut `secret:` yang belum ada di sini. Yang lain dibuang, sehingga file tidak bisa mengarahkan kata sandi yang sudah ada ke server miliknya.
- Recipe yang ditandai read-only diimpor sebagai perubahan. Tandai lagi sebagai read-only sendiri dengan `komando recipe add NAME ... --read-only --overwrite`.

Setiap pengaturan yang dibuang dicantumkan di hasilnya.

### Ekspor tersegel (semuanya, dengan kata sandi)

`--sealed` menulis ekspor dan kata sandi yang dipakai server, conn, dan VPN-nya ke dalam satu file tersegel. Hanya orang di terminal yang bisa membuatnya (agen AI mendapat `NEEDS_PERSON`), dan komando meminta passphrase untuk file itu, dua kali, disembunyikan:

```bash
komando export --sealed --to move.kmdseal                # menanyakan passphrase (15+ karakter)
komando export --sealed --with-keys --to move.kmdseal    # dan private key yang dipakai server
komando export @prod --sealed --to prod.kmdseal          # hanya yang dipilih sebuah target
komando export --sealed --to move.kmdseal --dry-run      # apa yang akan disegel; tidak menanyakan apa pun
```

```text
Choose a passphrase for the file: 15 or more characters (random words work).
Passphrase (hidden):
Type it again (hidden):
sealed 2 servers, 1 conn, 2 secrets, 1 key into move.kmdseal (it opens with its passphrase)
check phrase: kangaroo maximum crush write exit shock
Next: komando import komando move.kmdseal (on the other computer; it asks for the passphrase)
```

File ditulis dengan mode 0600; tidak ada isinya yang bisa dibaca tanpa passphrase, dan mengubah satu byte menghentikannya terbuka. Secret yang disebut server tetapi tidak ada di vault dicantumkan, dan tidak ikut. Security key (FIDO2) tetap berada di perangkatnya.

Di komputer lain, impor yang sama membacanya dan menanyakan passphrase sekali:

```bash
komando import komando move.kmdseal
komando import komando move.kmdseal --overwrite   # juga menggantikan secret yang ada di sini dengan nilai lain (bertanya dulu)
```

Impor mempertahankan batasan file ekspor mana pun (di bawah). Kata sandi dari file masuk ke vault bila nama itu belum ada di sini. Bila vault punya nama itu dengan nilai lain, vault mempertahankan miliknya, dan server dari file tidak mendapatkannya, kecuali ditambahkan `--overwrite` dan menjawab ya. Key dari file disimpan di store komando, seperti yang dibuat `key gen`; key dengan nama yang sudah ada di sini dikeluarkan.

Passphrase yang salah, atau file yang diubah setelah disegel, berhenti dengan `WRONG_PASSPHRASE`; file yang rusak dengan `SEALED_FILE_INVALID`. Tidak ada yang diimpor saat itu.

### Mengirim semuanya ke aplikasi iPhone

Dari Linux atau Windows, dengan hanya sebuah iPhone, `--for-phone` menyegel file ke key yang dibuat aplikasi iPhone untuk ekspor ini. Hanya ponsel itu yang membukanya; terminal tidak bisa:

```bash
komando export --for-phone --to phone.kmdseal
```

komando meminta file key yang dibagikan ponsel (atau key itu sendiri, seperti yang ditampilkan ponsel) dan key check yang ditampilkan ponsel (64 huruf dan angka, spasi dan tanda hubung tidak berpengaruh). Key yang tidak cocok dengan key check ditolak (`PHONE_KEY_INVALID`), sehingga file key yang ditukar di jalan ketahuan. Lalu komando mencetak check phrase berisi enam kata: pindahkan file ke ponsel dengan cara apa pun, dan periksa bahwa ponsel menampilkan enam kata yang sama. Bila berbeda, jangan pakai file itu. Ponsel membaca server, conn, VPN, kata sandinya dan, dengan `--with-keys`, key-nya.

File disegel dengan enkripsi pasca-kuantum (X-Wing: ML-KEM-768 dengan X25519), sehingga salinan yang tertinggal di email atau backup cloud tetap tertutup bahkan bagi komputer kuantum di masa depan. Butuh aplikasi iPhone untuk iOS 26 atau yang lebih baru. File buatan komando 0.14.0 (hanya X25519) tidak lagi terbuka di ponsel, dan key dari aplikasi yang lebih lama ditolak: perbarui aplikasinya dan buat file lagi.

Formatnya ada di [desain sealed file](../design/sealed-file.md).

### Menyalin folder (semuanya, dengan kata sandi)

Key vault wajib ikut berpindah, jadi beri vault passphrase dulu. Key di `store.key` atau di keychain sistem tidak ikut berpindah: folder yang disalin yang key-nya tertinggal di keychain komputer lama tidak bisa membuka secret-nya.

```bash
komando secret passphrase                     # di komputer lama: ketik passphrase (15+ karakter)
# salin ~/.komando ke komputer baru (flash disk, scp), lalu di sana:
export KOMANDO_VAULT_PASS='the passphrase'    # atau ketik saat komando bertanya
komando doctor                                # vault terbuka, server ada di sana
```

Di komputer baru, bisa kembali ke file key dan memindahkannya ke keychain: `komando secret passphrase --off --yes`, lalu `komando secret keychain`. Salin juga file SSH key yang disimpan di luar `~/.komando` (di `~/.ssh`).

### Memulihkan dari backup (Time Machine, komputer baru)

Backup `~/.komando` (Time Machine, disk image, salinan) berisi store, tetapi tidak selalu key-nya. `komando doctor` menyatakan di mana key berada; periksa sebelum backup itu dibutuhkan:

| Key berada di | Backup di komputer ini | Backup di komputer baru |
|---|---|---|
| passphrase | terbuka dengan passphrase | terbuka dengan passphrase |
| `store.key` (di dalam folder) | terbuka | terbuka, jadi perlakukan backup seperti kata sandi itu sendiri |
| keychain OS (default) | terbuka: keychain masih punya key-nya | secret-nya tidak terbuka: key tertinggal di keychain komputer lama |

Jadi untuk backup yang bisa dibawa ke komputer baru, beri vault passphrase dulu (`komando secret passphrase`), atau simpan [ekspor](#export-and-import-no-passwords) di sampingnya dan atur lagi kata sandinya dari password manager.

Kembalikan folder saat komando tidak menjalankan apa pun (tanpa VPN, tunnel, atau job yang dimulai darinya; `komando status` menampilkannya), lalu:

```bash
komando doctor                                # vault terbuka, server ada di sana
```

Bila key ada di keychain, keychain juga mengingat berapa banyak perubahan yang dialami store. Salinan yang dipulihkan lebih lama, jadi setiap perintah lalu berhenti dengan `STORE_OLD_COPY` (exit 6): server, aturan, secret, atau host key yang di-pin mungkin sudah usang, dan salinan lama yang dikembalikan orang lain tampak sama. `komando doctor` dan dry run tetap berfungsi. Bila Anda sendiri yang mengembalikannya, terima di terminal Anda sendiri (agen AI tidak bisa):

```bash
komando doctor --accept-old-copy
```

Lalu periksa apa yang berubah sejak backup: server atau aturan yang ditambahkan kemudian, dan host key yang di-pin sejak itu (`komando host trust` bertanya lagi untuk server yang tidak lagi dikenalnya).

## Batasan

- Kata sandi, file private key, dan key yang dibuat komando tidak pernah ikut dalam file ekspor biasa; atur atau salin di komputer lain, atau pakai [ekspor tersegel](#a-sealed-export-everything-with-passwords).
- Hanya orang di terminal yang membuat atau membuka sealed file. File untuk ponsel hanya terbuka di ponsel itu.
- Impor tidak mengubah pengaturan apa pun: impor mencantumkan yang berbeda.
- Folder yang disalin membuka secret-nya di komputer lain hanya bila vault punya passphrase (atau key-nya ada di `store.key`, di dalam folder).
- Backup yang dikembalikan di komputer yang sama berhenti dengan `STORE_OLD_COPY` sampai seseorang menjalankan `komando doctor --accept-old-copy`, bila key ada di keychain.
- Termius dan TablePlus tidak punya format ekspor terbuka (lihat [di atas](#coming-from-termius-or-tableplus)).

## Pemecahan masalah

| Kesalahan | Artinya | Yang perlu dilakukan |
|-------|---------|----------------------|
| `IMPORT_INCOMPLETE` (exit 1) | sebagian besar masuk, beberapa ditolak (lihat `skipped`) | perbaiki entri itu di file dan impor lagi; yang sudah masuk dilewati |
| `USAGE` (exit 2) | sumber yang tidak dikenal, atau `komando` atau `csv` tanpa file | petunjuk mencantumkan sumber dan sebuah contoh |
| `FILE_EXISTS` (exit 8) | `export --to` ke file yang sudah ada | tambahkan `--overwrite`, atau pilih file lain |
| `PROTECTED_TARGET`, `PROTECTED_TARGET` (exit 6) | `--overwrite` pada entri yang dilindungi | di terminal, komando bertanya; script menambahkan `--yes` |
| `SAFETY_SETTING` (exit 6) | file menyalakan agent forwarding, cipher VPN lama, atau PAP, atau melemahkan VPN yang digantikannya | periksa file; di terminal, komando bertanya, script menambahkan `--yes` |
| `STORE_OLD_COPY` (exit 6) | backup folder dikembalikan; keychain mengingat store yang lebih baru | bila dipulihkan dengan sengaja, jalankan `komando doctor --accept-old-copy` di terminal Anda sendiri; kalau tidak, cari tahu siapa yang mengembalikannya |
| `VAULT_LOCKED` (exit 1) | folder yang disalin yang vault-nya punya passphrase, tanpa `KOMANDO_VAULT_PASS` | atur `KOMANDO_VAULT_PASS`; lihat [Secret](secrets.md#troubleshooting) |
