# Pengaturan dan file

Ubah pengaturan komando, dan lihat di mana komando menyimpan datanya serta key yang membukanya.

## Mengubah pengaturan

```bash
komando config show                          # setiap pengaturan: KEY VALUE DEFAULT ALLOWED, dan di mana file berada
komando config get parallel
komando config set parallel 20
komando config set default_timeout 10m
komando doctor                               # periksa pengaturan, inventaris, dan keamanannya
```

Jika diketik tanpa argumen, `komando config set` menanyakan pengaturannya, lalu nilainya.

`config set` menyatakan apa yang berubah:

```text
parallel: 10 → 20
```

Di JSON, `config show` memberi setiap pengaturan di `data.keys`.

## Daftar pengaturan

| Key | Yang dikendalikannya | Nilai | Default |
|-----|----------------------|-------|---------|
| `host_key_policy` | apa yang terjadi pada server yang belum pernah dilihat komando | `accept-new` (ingat dan tampilkan fingerprint-nya), `strict` (tolak sampai Anda menjalankan `komando host trust`), `off` (mematikan sebuah pemeriksaan) | `accept-new` |
| `default_user` | nama login saat server tidak punya | sebuah nama login; kosong = nama user lokal | (kosong) |
| `default_timeout` | berapa lama perintah boleh berjalan di setiap server | durasi di atas 0 (`30s`, `5m`, `1h`) | `5m` |
| `connect_timeout` | berapa lama menunggu server menjawab | durasi di atas 0 | `15s` |
| `parallel` | berapa server yang dikerjakan sekaligus | 1 atau lebih | `10` |
| `max_output_bytes` | output yang disimpan per stream per server | 1024 atau lebih | `262144` (256 KiB) |
| `audit` | menyimpan audit log | `on`, `off` (mematikan sebuah pemeriksaan) | `on` |
| `audit_sql` | cara teks SQL disimpan di audit log | `full`, `hash` (SHA-256, sehingga query yang berulang bisa dicocokkan), `off` (mematikan sebuah pemeriksaan) | `full` |
| `audit_syslog` | juga mengirim setiap record audit ke server log pusat (SIEM) | `udp://HOST:514`, `tcp://HOST:514`, `tls://HOST:6514`, `off` (perubahan apa pun mematikan sebuah pemeriksaan) | `off` |
| `mask_personal` | di mana agen AI melihat alamat email, nomor telepon, nomor kartu, dan IBAN disembunyikan (lihat [Data pribadi](safety.md#personal-data)) | `protected`, `all`, `off` (menampilkan lebih banyak mematikan sebuah pemeriksaan) | `protected` |
| `login_for` | berapa lama `komando login SERVER` menyimpan login server untuk perintah berikutnya, termasuk milik agen AI | durasi, seperti `2h`; agen AI butuh jawaban ya dari seseorang untuk memperpanjangnya | `8h` |
| `vpn_idle` | tutup VPN yang dimulai komando setelah selama ini tanpa perintah dan tanpa koneksi terbuka melaluinya | durasi; `0` = tidak pernah menutup. Memperpanjang, atau `0`, bertanya dulu (agen AI butuh jawaban ya dari seseorang) | `30m` |

Perubahan yang mematikan sebuah pemeriksaan bertanya dulu kepada Anda di terminal (`This turns off a komando safety check: ... Continue? [y/N]`); agen AI atau script menambahkan `--yes` setelah seseorang setuju. Lihat [Apa yang butuh jawaban ya](safety.md#what-needs-a-yes).

```bash
komando config set host_key_policy strict    # tolak server yang belum Anda percayai
komando config set audit_sql hash            # jauhkan teks SQL dari riwayat
komando config set vpn_idle 0                # jangan pernah menutup VPN karena tidak terpakai
komando config set audit_syslog tls://siem.example:6514   # juga kirim audit ke server log (komando bertanya dulu)
```

Dengan `audit_syslog` diatur, setiap record audit juga dikirim ke server log saat ditulis: syslog (RFC 5424, facility authpriv, program `komando`, message id `audit`, JSON record sebagai pesan) lewat UDP, TCP, atau TLS. Log lokal tetap menjadi catatannya: bila server log tidak menjawab, komando menyatakannya sekali di stderr dan perintah dilanjutkan. Salinan di mesin lain menjaga riwayat bahkan bila seseorang dengan akun user yang sama menulis ulang file lokal.

Nilai negatif ditolak. Setiap perubahan dicatat di `komando audit` dengan nilai lama dan barunya.

Sebagian besar pengaturan juga punya flag untuk sekali jalan: `--timeout`, `--connect-timeout`, `--parallel` (`-P`), `--max-output`, dan `--host-key-policy`. Bila tidak disebut, flag mengambil dari pengaturan: `komando schema` menampilkan flag seperti itu dengan `"default": "0"` (tidak diberikan) dan `"default_from": "setting:default_timeout"` (pengaturan yang dibacanya).

`--host-key-policy` menerima `accept-new`, `strict`, atau `off` (huruf besar atau kecil); selain itu adalah kesalahan `USAGE`, tidak pernah pemeriksaan yang lebih longgar. Flag yang lebih longgar daripada pengaturan `host_key_policy` (`accept-new` saat pengaturannya `strict`, atau `off`) butuh jawaban ya yang sama dengan melonggarkan pengaturan lewat `config set`: `SAFETY_SETTING` untuk agen AI atau script tanpa `--yes`. `--dry-run` milik agen tersambung dengan pengaturannya.

## Meminta kode sebelum perintah berisiko dari agen

Saat agen AI menambahkan `--yes`, `--allow-dangerous`, atau `--reveal`, komando membuka jendela "Allow once" di layar (lihat [Keamanan](safety.md#when-you-are-at-the-terminal)). Agar butuh lebih dari satu klik, nyalakan kode persetujuan: jendela lalu juga meminta kode 6 digit dari aplikasi authenticator di ponsel.

```bash
komando config approval-code             # menampilkan secret untuk ditambahkan ke aplikasi authenticator Anda
komando config approval-code --off       # matikan lagi (komando bertanya dulu)
```

Di desktop Linux atau BSD, kodenya wajib: program lain bisa menekan tombol jendela di sana, jadi tanpa kode komando tidak membuka jendela dan agen meminta Anda menjalankan perintahnya sendiri.

Setiap kode hanya berlaku sekali. komando mengingat, di store tersegelnya, kode terakhir yang diterimanya; kode yang sama, atau yang lebih lama, tidak mengizinkan jendela kedua, bahkan dalam 30 detik yang sama. Tunggu kode berikutnya yang ditampilkan aplikasi. Kode yang diketik saat menyalakannya juga dihitung terpakai.

Hanya orang di terminal yang bisa menyalakannya: secret ditampilkan sekali, di sana. Mematikannya adalah jawaban ya seperti perubahan keamanan lainnya, jadi untuk agen AI butuh jendela dan kodenya juga. `komando config show` menyatakan apakah kode itu menyala.

Di Windows, jendela hanya menghitung klik atau penekanan tombol dari mouse atau keyboard sungguhan: program lain tidak bisa menekan "Allow once" untuk Anda. Ini juga berarti screen reader atau tool lain yang menekan tombol untuk Anda tidak bisa menekannya. Di macOS, program yang punya izin Accessibility (System Settings, Privacy & Security) bisa mengklik tombol di jendela mana pun, termasuk yang ini. Jangan berikan izin itu kepada terminal tempat agen bekerja, atau nyalakan kode persetujuan.

## Variabel lingkungan

| Variabel | Fungsinya |
|----------|-----------|
| `KOMANDO_HOME` | tempat komando menyimpan datanya (default `~/.komando`, di Windows `%USERPROFILE%\.komando`). Untuk agen AI, setiap perintah dengan folder lain berhenti, dry run juga (lihat [Keamanan](safety.md#seatbelts-for-ai-agents)); bila data disimpan di tempat lain, jadikan `~/.komando` sebuah link ke sana |
| `KOMANDO_VAULT_PASS` | opsional: passphrase vault, sebagai ganti key di keychain atau di `store.key`. Vault baru memakainya saat secret pertama; `komando secret passphrase` menambah atau mengubahnya nanti (lihat [di bawah](#a-passphrase-instead-of-the-keychain)) |
| `KOMANDO_KEYCHAIN` | `off`: komando tidak memakai keychain, dan vault baru menyimpan key-nya di `store.key` (runner CI, container, test). Di Mac, path ke file keychain yang dipakai sebagai ganti keychain login, untuk key store dan hitungan perubahannya. Agen AI tidak bisa memindahkan keychain: `off` miliknya tidak memindahkan hitungan perubahan (pemeriksaan salinan lama), dan path-nya tidak dipakai sama sekali, jadi panggilan agen menyimpan key dan hitungan di keychain login. Store yang key-nya ada di file keychain sendiri hanya dibuka oleh perintah Anda, bukan agen. Sebaliknya, store yang dibuat agen menyimpan key-nya di keychain login, jadi perintah Anda dengan `KOMANDO_KEYCHAIN` yang diatur ke sebuah file tidak menemukannya di sana |
| `KOMANDO_ACTOR` | nama yang dicatat di `komando audit` (misalnya `claude`) |
| `KOMANDO_OUTPUT` | output default: `json` atau `text` |
| `KOMANDO_AGENT`, `AI_AGENT` | menandai pemanggil sebagai agen AI, untuk agen yang tidak dikenal komando lewat variabelnya sendiri: output menyembunyikan secret dan `--yes`, `--allow-dangerous`, serta `--reveal` butuh seseorang yang mengizinkan (lihat [Keamanan](safety.md#seatbelts-for-ai-agents)). Nilai apa pun dihitung, juga `0` atau kosong |
| `KOMANDO_NO_DIALOG` | nilai apa pun: jangan pernah menampilkan jendela persetujuan, seperti lewat SSH. `--yes`, `--allow-dangerous`, atau `--reveal` dari agen AI lalu ditolak, dan agen meminta Anda menjalankan perintah di terminal Anda sendiri |
| `CI` | job CI (nilai apa pun kecuali `false` atau `0`): komando tidak pernah bertanya apa pun, bahkan di terminal |
| `KOMANDO_EXPERIMENTAL` | nyalakan fitur yang masih diuji, menurut namanya (`ssm`: klien AWS Session Manager milik komando sendiri, lihat [Server](servers.md)) |
| `KOMANDO_EXPERIMENTAL_VPN` | nyalakan jenis VPN yang masih diuji (`fortinet,pulse`, atau `all`; lihat [VPN](vpn.md)) |
| `KOMANDO_IPSEC_DEBUG` | `1` menulis pertukaran IPsec ke log VPN, untuk mencari tahu mengapa server tidak menjawab |
| `NO_COLOR` | matikan warna di status line |

Variabel untuk password manager dan login cloud dicantumkan di [Server](servers.md).

komando mengeluarkan `KOMANDO_VAULT_PASS` dan variabel unlock password manager (`KOMANDO_KDBX_PASSWORD`, `KOMANDO_KDBX_KEYFILE`, `KOMANDO_BW_PASSWORD`, `KOMANDO_BW_CLIENT_SECRET`, `OP_CONNECT_TOKEN`, `VAULT_TOKEN`, `BAO_TOKEN`) dari lingkungannya saat dimulai: program yang dijalankannya tidak mewarisinya, dan tunnel, sesi VPN, serta login latar belakangnya mendapatkannya lewat inputnya.

## Tempat komando menyimpan datanya

Semuanya ada di `~/.komando/` (di Windows `%USERPROFILE%\.komando`; ubah dengan `KOMANDO_HOME`). Hanya Anda yang bisa membacanya:

- **macOS dan Linux:** foldernya bermode 0700 dan file-nya 0600.
- **Windows:** mode file tidak berfungsi di sana, jadi komando memberi folder itu daftar akses tersendiri: hanya user itu dan sistem, diteruskan ke setiap file di dalamnya. `komando doctor` memperingatkan file apa pun yang bisa dibuka orang lain, dan mencetak perintah `icacls` yang memperbaikinya.

komando menyimpan data tersegel dalam satu file:

| File | Isinya |
|------|--------|
| `store.db` | server, conn, VPN, key, recipe, pengaturan, secret, fingerprint server yang diingat, dan riwayat setiap tindakan, tiap record tersegel (AES-256-GCM). Hanya ID acak, jenis, versi, dan waktu perubahan yang bisa dibaca tanpa key |
| `store.key` | key store, hanya bila tidak ada keychain (tidak ada bila key ada di keychain atau `KOMANDO_VAULT_PASS` dipakai) |
| `store.made` | catatan bahwa folder ini pernah punya store. komando menulisnya bersama store dan menyimpannya, sehingga `store.db` yang hilang diketahui (di bawah). Tidak berisi secret |
| `runtime.json` | job, tunnel, login server, dan sesi VPN yang dimulai komando (disegel dengan key store; hanya terbuka dengan tanda yang disimpan store.db untuknya, sehingga salinan lama yang dikembalikan terbaca kosong) |
| `runtime.pids` | hanya process ID pekerjaan latar belakang komando sendiri, sehingga komando bisa tahu apakah masih berjalan tanpa membuka store |
| `vpn/`, `tunnels/`, `login/` | log VPN, tunnel, dan login server (yang tidak dipakai apa pun yang berjalan dihapus setelah seminggu), dan status klien VPN bawaan |

Salin `store.db` hanya saat komando tidak menjalankan apa pun, kalau tidak salinan yang diambil saat ada perubahan bisa rusak. Backup folder ini dan jaga tetap privat.

komando hanya membaca `store.db`. Folder yang pernah punya store tetapi kehilangan `store.db` berhenti dengan `STATE_CORRUPT` sampai `store.db` dikembalikan dari backup. Hal-hal ini menunjukkan folder itu pernah punya store: `store.made`, `store.key` atau `store.key.new`, `store.db-journal`, `runtime.pids`, `runtime.json` yang tersegel, atau hitungan perubahan yang disimpan keychain untuk folder itu. Setiap store meninggalkan `store.made`, juga yang key-nya ada di keychain (tanpa `store.key`); store buatan komando yang lebih lama mendapatkannya saat komando membukanya berikutnya. File lock tidak dihitung: perintah yang ditolak juga meninggalkannya.

Saat key store ada di keychain OS, keychain juga mengingat berapa banyak perubahan yang dialami store. Salinan `store.db` yang lebih lama yang dikembalikan (dari backup, atau oleh seseorang) menghentikan setiap perintah dengan `STORE_OLD_COPY`, karena server, aturan, secret, atau host key yang di-pin mungkin sudah lama. `komando doctor` dan dry run tetap berfungsi, dan hanya melihat: tidak menulis apa pun ke salinan lama, dan tidak pernah memulai store baru bila `store.db` hilang. Bila folder dipulihkan dengan sengaja, jalankan `komando doctor --accept-old-copy` di terminal Anda sendiri.

Dengan key di `store.key` atau passphrase, store dibandingkan hanya bila keychain menyimpan hitungan untuk folder ini: berarti itu backup dari sebelum `komando secret keychain`. Bila keychain tidak bisa menyatakan apakah ia menyimpannya (terkunci, atau tidak menjawab), komando membaca store seperti itu tetapi tidak mengubah apa pun (`KEYCHAIN_FAILED`, atau `KEYCHAIN_SLOW`): mungkin itu backup tersebut. Buka kunci keychain dan jalankan lagi. Di komputer tanpa keychain yang berfungsi, seseorang mengatur `KOMANDO_KEYCHAIN=off` (`off` milik agen AI tetap bertanya ke keychain). Bila keychain menjawab bahwa ia tidak menyimpan hitungan, tidak ada yang bisa dibandingkan, dan `komando doctor` menyatakannya.

### Tempat key vault berada

Key store disimpan dengan salah satu dari tiga cara: di keychain OS, di `store.key`, atau dibuat dari passphrase. `komando doctor` menyatakan mana yang dipakai, dan `komando secret keychain` serta `komando secret passphrase` memindahkan dan mengubahnya (lihat [Secret](secrets.md#where-they-are-kept-and-the-key)).

Vault baru menyimpan key-nya di keychain OS, sehingga salinan folder ini tidak membuka vault:

- **macOS:** keychain, lewat `/usr/bin/security`.
- **Linux:** Secret Service, lewat `secret-tool` di `/usr/bin`, `/bin`, atau `/usr/local/bin`.
- **Windows:** Credential Manager, sebagai kredensial untuk user itu di komputer ini saja (tidak berpindah ke komputer lain).

komando tidak pernah mencari tool ini di `PATH`. komando membuat key saat secret pertama, membacanya kembali, dan baru setelah itu mengandalkannya. Key yang sudah dipegang keychain untuk folder ini (dari vault yang dipindahkan) dipakai, tidak pernah digantikan.

komando menyimpan key baru hanya bila keychain menyatakan tidak menyimpan apa pun untuk folder ini. Di Linux, collection yang terkunci menyembunyikan key-nya dari pencarian (dan KeePassXC juga menyembunyikannya dari pencarian), sementara `secret-tool store` meminta membuka kunci collection default lalu menimpa item di sana. Jadi komando lebih dulu menanyakan ke Secret Service, lewat `gdbus` atau `busctl` dari folder sistem yang sama, apakah collection default terbuka, dan baru kemudian memeriksa bahwa `secret-tool search --all` tidak mencantumkan item apa pun.

Bila keychain tidak bisa menyimpan key atau tidak bisa menyatakannya, key masuk ke `store.key` dan `komando doctor` memperingatkan. Itu terjadi pada:

- server Linux tanpa `secret-tool` atau sesi desktop, collection default yang terkunci, atau tanpa `gdbus` atau `busctl`;
- Mac yang dijangkau lewat SSH dengan keychain terkunci, atau user Mac tanpa keychain default (`HOME` yang diubah, seperti di bawah `sudo -E`, sandbox, atau CI: komando menanyakan `security default-keychain` dulu, sehingga macOS tidak menampilkan dialog "Keychain Not Found");
- komputer Windows tanpa Credential Manager;
- item untuk folder ini yang tetap terkunci, container, atau keychain yang tidak menjawab dalam beberapa detik.

Sebelum komando membuat store baru, komando menanyakan ke keychain apakah masih mengingat hitungan perubahan untuk folder ini: berarti folder itu pernah punya store yang dihapus, dan komando tidak memulai store kosong sebagai gantinya (`STORE_OLD_COPY`, seperti untuk salinan lama di atas). Bila keychain menyatakan tidak punya hitungan, atau sama sekali tidak ada keychain (tanpa `secret-tool`, tanpa Credential Manager, `KOMANDO_KEYCHAIN=off`), store baru dimulai seperti di atas.

Bila keychain tidak bisa menyatakan (keychain terkunci lewat SSH, tanpa keychain default untuk `HOME` ini, tanpa sesi desktop untuk `secret-tool`, atau tidak menjawab dalam satu detik):

- Orang atau script di folder yang belum pernah punya store (tidak ada file yang tercantum di [Tempat komando menyimpan datanya](#where-komando-keeps-its-data), termasuk `store.made`) tetap mendapat store baru. Key-nya masuk ke `store.key`, tidak pernah keychain, dan komando mencetak satu catatan di stderr: store dijaga hanya oleh file key-nya. Perintah yang membuatnya dilanjutkan. Perintah berikutnya hanya membaca selama keychain tidak bisa dibaca; di komputer tanpa keychain yang berfungsi, atur `KOMANDO_KEYCHAIN=off`.
- Perintah agen AI tidak membuat store: `STORE_OLD_COPY`, atau `KEYCHAIN_SLOW` bila keychain tidak menjawab tepat waktu. Minta seseorang menjalankan perintah itu sekali di terminalnya sendiri.
- Di folder yang pernah punya store (`store.made`, `store.key`, atau file lain tadi), tidak ada perintah siapa pun yang membuatnya, siapa pun yang menjalankan. Kembalikan `store.db` dari backup. Untuk sengaja memulai store kosong setelah keychain menjawab, seseorang menjalankan `komando doctor --accept-old-copy` (bila keychain mengingat hitungan store), atau memindahkan folder itu.

Vault yang key-nya ada di `store.key` menyimpannya di sana sampai dipindahkan: jalankan `komando secret keychain`. Ini berfungsi sebelum atau sesudah secret pertama: vault mendapat key baru saat berpindah, disimpan hanya di keychain, sehingga salinan `store.key` yang dibuat sebelumnya (di backup atau riwayat folder yang disinkronkan) tidak membuka apa pun, bahkan secret yang ada saat itu (`--off` memindahkan key kembali ke `store.key`, dan komando bertanya dulu). Hanya orang di terminal yang bisa menjalankannya: agen AI atau script mendapat `NEEDS_PERSON`, karena keychain mungkin meminta dibuka kuncinya. Di Linux, perintah berhenti, dan meminta Anda membuka kunci keychain, selama collection default terkunci. Perintah menolak bila keychain sudah memegang key lain untuk folder ini (kemungkinan besar satu-satunya key dari vault yang dipindahkan): kembalikan vault itu, atau hapus item dari keychain sendiri setelah tidak ada vault yang membutuhkannya. Vault yang key-nya ada di keychain hanya terbuka di tempat keychain itu tidak terkunci: di Mac yang dijangkau lewat SSH, buka kuncinya dulu (`security unlock-keychain`), atau pakai passphrase.

Bila keychain tidak menjawab dalam beberapa detik, komando tetap membaca store tetapi tidak mengubah apa pun: perintah yang akan mengubah sesuatu berhenti dengan `KEYCHAIN_SLOW`. Coba lagi sebentar lagi.

### Passphrase sebagai ganti keychain

`KOMANDO_VAULT_PASS` adalah cara lain melindungi vault, terutama untuk komputer tanpa keychain (server Linux tanpa `secret-tool`). Vault baru menentukan modenya saat secret pertama: dengan variabel diatur sepanjang 15 karakter atau lebih, vault mendapat passphrase itu. Mengatur atau mengubah variabel saja tidak berpengaruh pada vault yang sudah ada; `komando secret passphrase` yang melakukannya. Vault dengan passphrase butuh passphrase yang sama di setiap shell dan proses latar belakang.

Untuk mengubah passphrase, atau memberi passphrase pada vault yang key-nya ada di `store.key` atau keychain, jalankan `komando secret passphrase` di terminal. Perintah menanyakan passphrase baru dua kali (disembunyikan, 15 karakter atau lebih) dan mengenkripsi ulang setiap secret dengannya; bila ada yang tidak bisa didekripsi, tidak ada yang berubah. Bila `KOMANDO_VAULT_PASS` sudah berisi nilai yang baru, perintah menanyakan yang sekarang. `store.key` atau item keychain yang lama dihapus hanya setelah vault baru disimpan dan dibaca kembali. Lalu taruh passphrase baru di `KOMANDO_VAULT_PASS` di setiap tempat yang mengaturnya, dan mulai ulang tunnel dan sesi VPN latar belakang: keduanya masih memegang key lama. `--off` kembali ke key acak baru di `store.key` (komando bertanya dulu). Hanya orang di terminal yang bisa menjalankannya, tidak pernah agen AI. `KOMANDO_VAULT_PASS` yang diubah tanpanya tidak membuka secret apa pun (tidak ada yang hilang: atur lagi nilai yang lama); `komando doctor` menyatakannya.

Untuk pindah ke komputer lain, lihat [Pindah ke komputer lain](import.md#move-to-another-computer): `komando export` (tanpa kata sandi), atau seluruh folder setelah vault punya passphrase.

## Update komando

Untuk memperbarui komando itu sendiri, lihat [Instal, update, hapus](install.md#update).

## Batasan

- Keychain menjauhkan key dari orang yang menyalin folder ini. Keychain tidak menjauhkannya dari program lain yang Anda jalankan sendiri, dan itu termasuk agen AI dengan shell:
  - **macOS:** komando membaca item lewat `/usr/bin/security`, jadi program apa pun dari user yang sama bisa membacanya dengan cara yang sama, tanpa prompt. Program itu juga bisa menurunkan hitungan perubahan yang disimpan komando di sana, lalu mengembalikan salinan lama `store.db` tanpa `STORE_OLD_COPY`. Hanya komando bertanda tangan yang menyimpan item untuk dirinya sendiri yang bisa menutup celah ini.
  - **Windows:** Credential Manager memberikan item ke program apa pun dari user yang sama.
  - **Linux:** selama keychain tidak terkunci, `secret-tool` memberikan item ke program apa pun dari user yang sama.
- Aturan komando (secret yang disamarkan, jendela persetujuan, server yang dilindungi) berlaku untuk agen AI yang memakai komando. Program yang berjalan sebagai user Anda sendiri dan mengabaikan aturan itu bisa membuka vault sendiri, bagaimanapun key disimpan: ia membaca `store.key`, meminta item ke keychain seperti komando, atau membaca `KOMANDO_VAULT_PASS` dari shell yang memulainya. Hanya dua hal yang menghentikan program seperti itu: menjalankannya sebagai user OS lain (atau di container atau mesin virtual tanpa folder home dan keychain Anda), atau aplikasi Komando untuk Mac yang bertanda tangan, yang menyimpan key untuk dirinya sendiri.
- Satu kasus yang tidak bisa dilihat komando saat menyimpan key baru: item di database KeePassXC selain yang default, selama database itu terkunci.

## Pemecahan masalah

| Kesalahan | Artinya | Yang perlu dilakukan |
|-------|---------|----------------------|
| `SAFETY_SETTING` (exit 6) | perubahan mematikan salah satu pemeriksaan komando | di terminal, komando bertanya dulu; agen AI atau script menambahkan `--yes` setelah seseorang setuju |
| `STORE_OLD_COPY` (exit 6) | salinan `store.db` yang lebih lama dikembalikan, `store.db` hilang sementara keychain mengingat hitungan perubahannya, atau keychain tidak bisa menyatakan apakah ia mengingatnya | bila dipulihkan dengan sengaja, jalankan `komando doctor --accept-old-copy` di terminal Anda sendiri; kalau tidak, cari tahu siapa yang mengembalikannya |
| `STATE_CORRUPT` (exit 1) | `store.db` hilang di folder yang pernah punya store, atau tidak terbuka dengan key; atau `runtime.json` tidak terbuka | untuk `store.db`: kembalikan folder dari backup, lalu `komando doctor --accept-old-copy` di terminal Anda sendiri; untuk `runtime.json`: pindahkan dan sambungkan lagi (isinya hanya VPN, login, job, dan tunnel yang berjalan) |
| `KEYCHAIN_SLOW` (exit 1) | keychain tidak menjawab tepat waktu, jadi tidak ada yang diubah | jalankan lagi sebentar lagi; `komando doctor` bila terus terjadi |
| `VAULT_LOCKED`, `VAULT_DECRYPT`, `VAULT_KEY` (exit 1) | vault tidak terbuka | lihat [Secret](secrets.md#troubleshooting) |
| `AUDIT_UNAVAILABLE` (exit 1) | audit log tidak bisa ditulis, jadi tidak ada yang berjalan | `komando doctor` menunjukkan alasannya |
