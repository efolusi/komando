# Server

Tambahkan server Anda, pilih cara komando login ke sana, dan jaga daftarnya tetap rapi.

## Menambah server

Beri setiap server nama pendek, lalu user dan alamatnya:

```bash
komando host add web1 ubuntu@203.0.113.10
komando test web1                                # bisakah komando login?
```

```text
added web1
  address: 203.0.113.10
  user: ubuntu
Next: komando test web1
```

```text
NAME  KIND  RESULT  LATENCY  USER    SUDO  NOTE
web1  host  ok      48ms     ubuntu  yes   -
```

Jika diketik tanpa argumen di terminal Anda, `komando host add` menanyakan setiap bagian, satu baris sekali waktu: nama, alamat, user, port, cara komando login, dan apakah ini production. Perintah apa pun yang diketik dengan argumen yang kurang menanyakannya dengan cara yang sama (lihat [Menjalankan perintah](commands.md#at-your-terminal-komando-asks-for-what-is-missing)); script dan agen AI mendapat error penggunaan dengan contoh.

Cara penulisan lainnya:

```bash
komando host add web2 ubuntu@203.0.113.11 --group web --tag prod
komando host add web2 ubuntu@203.0.113.11:2222               # port SSH lain
komando host add db1 admin@10.0.0.5 --via bastion            # dijangkau lewat bastion
komando host add web2 --address 203.0.113.11 --user deploy --key deploy
```

Flag yang paling sering Anda pakai:

| Flag | Fungsinya |
|------|-----------|
| `-g`, `--group` / `-t`, `--tag` / `--label KEY=VALUE` | Mengelompokkan server agar satu [target](targets.md) bisa memilih banyak. |
| `--key NAME` / `--identity PATH` | Login dengan key dari daftar key komando (`komando key`), atau dengan file key. |
| `--password-ref` / `--sudo-ref` | Tempat kata sandi login atau sudo disimpan (lihat [Memakai kata sandi](#use-a-password)). |
| `--login ask\|password\|key\|agent` | Cara komando login, dengan kata yang sama dengan yang dicetak `host show`: `ask` (Anda mengetik kata sandi di setiap koneksi, tidak pernah disimpan: lihat [Mengetik kata sandi setiap kali](#type-the-password-each-time---login-ask)), `password` (yang tersimpan, dengan `--ask-password` atau `--password-ref`), `key` (dengan `--key` atau `--identity`), `agent` (hanya ssh-agent dan `~/.ssh`). |
| `--via bastion` | Jangkau server lewat server lain atau VPN lebih dulu ([tunnel](tunnels.md)). |
| `--protected` | Tandai server production (lihat [Melindungi server production](#protect-a-production-server)). |
| `-e`, `--env KEY=VALUE` | Ekspor variabel sebelum setiap perintah di server ini. Nilai dari vault (`KEY=secret:NAME`) dikeluarkan dari perintah agen AI: agen bisa membacanya kembali tanpa disamarkan (`printenv KEY \| rev`). Nilai itu menuju `exec` atau `job start` milik agen hanya bila agen menambahkan `--yes` dan Anda mengizinkannya di jendela komando. |
| `--notes TEXT` | Catatan bebas; agen melihatnya di `host show`. |
| `--port N` | Port SSH (default 22); sama dengan `:N` setelah alamat. |
| `--overwrite` | Menggantikan server yang sudah punya nama ini. |

komando memeriksa apa yang Anda simpan: port (1-65535), nama user, bahwa alamat tidak diawali `-` (ssh akan membacanya sebagai opsi), bahwa setiap langkah `--via` ada dan tidak berputar kembali, dan bahwa file `--identity` ada. Jalur yang menyebut satu langkah dua kali (`--via a,b,a`) berhenti dengan `VIA_CYCLE`. Server di alamat dan port yang sama dengan yang dilindungi (dengan huruf besar atau kecil lain, dengan `.` di akhir, atau nama yang di-resolve ke IP yang sama) juga dilindungi, dengan peringatan. `komando doctor` memeriksa seluruh daftar dengan cara yang sama.

`komando test` memberi tahu Anda, per server, user yang dipakai login dan apakah sudo bekerja tanpa kata sandi (`SUDO`). `komando facts` melaporkan pemeriksaan sudo yang sama, ditambah jauh lebih banyak ([Kesehatan](health.md)).

Server di belakang host `--via` yang sama berbagi satu koneksi ke host itu dalam satu perintah: `komando exec @db -P 10` login ke bastion sekali dan menjangkau sepuluh server lewatnya, seperti ControlMaster milik OpenSSH. Batas koneksi bastion (`MaxStartups`) dan log loginnya melihat satu klien.

Sudah punya server di `~/.ssh/config`, atau di komputer lain? Impor saja ([Pindah ke komando](import.md)):

```bash
komando import ssh-config
```

### Server Windows

Tambahkan `--os windows` untuk server dengan OpenSSH, atau berikan alamat `winrm://` untuk server dengan WinRM. komando lalu menjalankan PowerShell di sana. Lihat [Server Windows](windows.md) untuk penyiapan dan apa yang berfungsi.

```bash
komando host add win1 Administrator@10.0.0.9 --os windows --ask-password
komando host add win2 winrm://Administrator@10.0.0.9 --ask-password
```

### Server baru yang masih dimulai

Tepat setelah Anda membuat atau membangun ulang server cloud, SSH mungkin belum menjawab. `--wait` menguji lagi setiap beberapa detik sampai setiap server lolos:

```bash
komando test @new --wait 5m                                  # sampai SSH menjawab dan login berfungsi
komando exec @new --read-only -- cloud-init status --wait    # lalu: sampai start-up miliknya selesai
```

Perintah ini tidak menunggu host key yang berubah (`HOSTKEY_MISMATCH`) atau login yang ditolak (`AUTH_FAILED`: mencoba lagi bisa membuat alamat Anda diblokir): keduanya gagal seketika. `data.waited_ms` (di `-o json`) menyatakan berapa lama menunggu.

## Menambah banyak server dari spreadsheet

Menyiapkan sepuluh atau dua puluh server? Tulis di spreadsheet, simpan sebagai CSV, dan impor sekaligus. Baris pertama menamai kolomnya:

```csv
name,address,user,port,groups,tags,sudo-ref,via,protected,notes
bastion,203.0.113.10,ubuntu,,edge,prod,secret:ubuntu-sudo,,no,
web1,10.0.0.11,ubuntu,2222,"web,ubuntu",prod,secret:ubuntu-sudo,bastion,yes,front end
web2,10.0.0.12,ubuntu,,"web,ubuntu",prod,secret:ubuntu-sudo,bastion,yes,
```

```bash
komando import csv servers.csv --dry-run      # periksa setiap baris, tidak mengubah apa pun
komando import csv servers.csv --group fleet  # tambahkan semuanya (dan ke grup fleet)
```

Hanya `name` dan `address` yang dibutuhkan. Kolomnya adalah `name`, `address` (atau `ip`), `user`, `port`, `key`, `identity`, `password-ref`, `sudo-ref`, `via`, `groups` (atau `role`), `tags`, `protected` (yes atau no), dan `notes`; sel dengan beberapa grup atau tag memisahkannya dengan koma, `;`, atau spasi. Setiap baris diperiksa seperti `host add`, dan baris boleh saling memakai di `via`. komando memeriksa setiap baris sebelum menulis apa pun: satu baris yang buruk (kolom yang tidak dikenal, port yang buruk, `via` ke server yang tidak ada) menghentikan seluruh impor dan mencantumkan setiap masalah. Server yang sudah ada dilewati; `--overwrite` menggantikannya (yang dilindungi bertanya dulu). Baris yang diawali `#` adalah komentar.

Kata sandi tidak pernah masuk ke file: arahkan `password-ref` dan `sudo-ref` ke vault (`komando secret set ubuntu-sudo` dulu).

## Mengubah server

`host edit` hanya mengubah opsi yang Anda berikan:

```bash
komando host edit web1 --add-tag canary --port 2222
komando host edit web1 --rm-group old --label dc=jkt         # nilai kosong menghapus label
komando host edit web1 --unset via,sudo-ref                   # kosongkan pengaturan (lihat `--help` untuk daftarnya)
```

```text
changed: web1
```

Untuk mengubah banyak server sekaligus, berikan beberapa nama atau sebuah [target](targets.md). Setiap server mendapat perubahan yang sama, dan perintah mengubah semuanya atau tidak sama sekali:

```bash
komando host edit @web --sudo-ref secret:ubuntu-sudo --dry-run   # server mana yang akan berubah
komando host edit @web --sudo-ref secret:ubuntu-sudo
komando host edit web1 web2 db1 --add-tag canary
```

Satu jawaban ya mencakup seluruh perintah. Saat agen AI meminta, jendela komando mencantumkan setiap server yang diubah perintah dan mana di antaranya yang dilindungi, sehingga orangnya menjawab ya sekali, dengan mengetahui semuanya. `--address` hanya berfungsi pada satu server (dua server tidak pernah berbagi satu).

## Melindungi server production

```bash
komando host edit web1 --protected
```

Di server yang dilindungi, setiap perubahan pada server butuh jawaban ya. Untuk entrinya sendiri, begitu juga: mengubah cara komando login (alamat, port, user, key, kata sandi, `--via`), mengganti secret yang dipakainya, mematikan perlindungan, mengganti namanya, dan menghapusnya. Tag, grup, label, dan catatan berubah tanpa itu.

Di terminal Anda komando bertanya dulu (`web1 (protected): this command changes it. Continue? [y/N]`); agen AI atau script menambahkan `--yes` setelah seseorang setuju, dan `--yes` milik agen membuka jendela persetujuan komando. Lihat [Keamanan](safety.md) untuk detailnya.

## Mengganti nama server

`host rename` memberi server nama baru dan mempertahankan yang lainnya:

```bash
komando host rename web1 web-01 --dry-run   # apa yang akan berubah
komando host rename web1 web-01
```

Alamat, login, rujukan, tanda dilindungi, grup, tag, dan label tetap. Server, conn, dan tunnel yang lewat dengannya (`--via`), serta job dan tunnel-nya, mengikuti nama baru dalam langkah yang sama. Host key yang di-pin milik alamat, jadi `host trust` tidak dibutuhkan lagi. Mengganti nama server yang dilindungi bertanya dulu. `conn rename` dan `vpn rename` melakukan hal yang sama untuk conn dan VPN, `key rename` untuk key, dan `group rename` untuk grup.

`komando rename OLD NEW` mencari jenisnya untuk Anda: perintah ini mengganti nama satu server, conn, VPN, secret, key, atau grup bernama OLD dengan rename milik jenis itu sendiri. Bila dua jenis berbagi nama, perintah menyebut dua perintah untuk dipilih.

`key rename OLD NEW` mengganti nama satu key: server yang memakainya ikut. Key yang dibuat komando berada di store tersegel, jadi tidak ada file yang berpindah; key yang Anda tambahkan dengan `key add` tetap di tempatnya. Public key yang sudah terpasang di server mempertahankan komentarnya; key itu tetap berfungsi, karena key-nya sendiri tidak berubah.

`group rename OLD NEW` mengganti nama grup pada setiap anggota (bertanya dulu bila ada server atau conn yang dilindungi di dalamnya). Untuk menggabungkan dua grup, pakai `group add NEW @OLD` lalu `group rm OLD`.

### Mengganti nama seluruh proyek sekaligus

Saat sebuah proyek atau pelanggan mendapat nama baru, `rename --starts-with` mengganti nama setiap server, conn, VPN, secret, key, dan grup yang namanya diawali prefix lama, dalam satu langkah:

```bash
komando rename --starts-with shop- acme-shop- --dry-run   # daftar lama -> baru per jenis, dan setiap rujukan
komando rename --starts-with shop- acme-shop-
komando rename --starts-with shop- acme-shop- --in-notes --in-labels --dry-run   # catatan dan label juga: apa yang berubah, apa yang dipertahankan
```

- Perintah ini mengganti setiap nama yang diawali `shop-`. Bila prefix lama berakhir dengan `-`, nama tanpanya juga diganti: grup `shop` menjadi `acme-shop`. `--kind host,conn` hanya mengganti sebagian jenis.
- Setiap rujukan ikut: jalur `--via` (juga server di tengahnya, seperti `shop-vpn,shop-bastion`), rujukan kata sandi, sudo, key, preshared key, dan passphrase, opsi `secret:NAME` di URL conn, key yang dipakai server, keanggotaan grup, job, dan tunnel. Key yang dibuat komando (`key gen`) berada di store tersegel, jadi tidak ada file yang berpindah; file key yang Anda tambahkan tetap di tempatnya.
- Tanda dilindungi, label, catatan, dan waktu pembuatan tetap. Nama di dalam URL milik resource, bukan milik komando, jadi pada `s3://shop-admin@shop-prod` user dan bucket tetap.
- `--in-notes` juga mengganti nama lama di catatan, dan `--in-labels` di nilai label (nama label tetap). Hanya yang jelas berarti sebuah entri yang ikut: nama server, conn, VPN, dan secret sebagai kata utuh, grup yang ditulis `@shop`, dan pola seperti `shop-db-*` bila cocok dengan server, conn, dan VPN yang sama setelah penggantian nama. Ini tetap, karena sering berarti hal lain: prefix lama tanpa `-`-nya (`db shop` biasanya database, bukan grup), nama grup tanpa `@`, nama key (`bucket shop-dev`), dan nama yang juga adalah user, host, bucket, atau database di URL conn. Hasilnya mencantumkan masing-masing di `kept`, dengan alasannya, sehingga Anda bisa memperbaikinya secara manual.
- Tanpa `--in-labels`, setiap nilai label yang menyebut entri lama tetap dan dicantumkan di `kept` dengan apa yang akan menjadi nilainya. Label `host=` milik conn penting: `komando doctor` membacanya untuk memperingatkan bila conn dari server yang dilindungi tidak dilindungi sendiri. Tanpa `--in-notes`, satu peringatan menghitung catatan yang masih menyebut entri lama.
- Perintah ini mengganti semuanya atau tidak sama sekali. Daftar Anda dan vault masing-masing ditulis sekali. Bila nama baru sudah dipakai, atau dua nama lama akan mendapat satu nama baru, tidak ada yang berubah (`NAME_TAKEN`, dengan setiap bentrokan dicantumkan). VPN yang tersambung harus diputus dulu (`VPN_IN_USE`).
- Server dan conn yang dilindungi di antaranya butuh satu jawaban ya untuk seluruh perintah. `--yes` milik agen AI membuka satu jendela untuk seseorang, yang menyatakan berapa banyak entri yang dilindungi yang dicakupnya. Mengarahkan rujukan ke nama baru dari secret, key, atau VPN yang sama tidak butuh jawaban ya: nilai yang sama menuju tempat yang sama.
- Aman untuk diulang. Bila prefix baru diawali prefix lama (`team-` menjadi `team-ops-`), nama yang sudah punya prefix baru dibiarkan, jadi eksekusi kedua tidak mengubah apa pun.

## Menghapus server

`host rm` menghapus server dari daftar komando. Perintah ini tidak menyentuh server itu sendiri. Perintah ini menerima nama atau [target](targets.md):

```bash
komando host rm @old --dry-run         # daftarkan apa yang akan dihapus
komando host rm web2
komando host rm 'tmp-*'
```

Server yang dilindungi bertanya dulu. Server yang masih dijangkau server lain lewat `--via` dipertahankan (`HOST_IN_USE`, yang mencantumkan semuanya). `conn rm` bekerja dengan cara yang sama untuk database, cache, dan storage.

`host rm` tidak melupakan host key server yang di-pin (lihat [Key server](#server-keys-host-keys)).

## Login dengan key

Bila `ssh` sudah berfungsi di komputer ini, komando biasanya berfungsi juga: komando memakai key yang sama (file seperti `~/.ssh/id_ed25519`, dan ssh-agent yang menyimpan key yang terbuka).

Key dengan passphrase berfungsi selama ssh-agent menyimpannya (setelah `ssh-add`, atau dari Keychain macOS), juga saat itu adalah `--key` atau `--identity` server (yang diatur `import ssh-config` dari `IdentityFile`): komando menemukan salinan agent menurut public key-nya, seperti `ssh`. Bila agent tidak menyimpannya, server gagal dengan `KEY_PASSPHRASE_REQUIRED`, dan hint menyatakan cara memuatnya atau menyimpan passphrase-nya di vault.

Untuk memakai key baru, buat dan pasang di server Anda. komando login dengan login server saat ini (misalnya kata sandi) untuk memasangnya:

```bash
komando key gen deploy                           # ed25519; --type rsa|ecdsa, -b BITS, -C COMMENT
komando key deploy deploy @web --set-default     # pasang, lalu login dengannya
komando key deploy ~/.ssh/id_ed25519.pub web1    # file .pub juga berfungsi
komando key list                                 # NAME TYPE FINGERPRINT USED BY
komando key show deploy                          # bagian publiknya
komando key show deploy --reveal                 # seseorang: private key dari key yang dibuat komando
```

Key yang dibuat dengan `key gen` disegel di store komando (`store.db`); tidak pernah ditulis ke file. `host ssh-command` menyerahkannya ke ssh-agent yang sedang berjalan saat program lain membutuhkannya. Key RSA butuh paling sedikit 3072 bit.

Untuk memakai file key yang sudah Anda punya, tambahkan ke daftar key komando. File tetap di tempatnya. Bila punya passphrase, simpan passphrase-nya di vault dulu:

```bash
komando secret set work-pass
komando key add work ~/.ssh/id_work --passphrase-ref secret:work-pass
komando key edit work --passphrase-ref secret:new-pass      # ubah nanti (--unset passphrase-ref mengosongkannya)
```

`komando key rm NAME` mengeluarkan key dari daftar key komando; perintah menolak selama server masih memakainya (`KEY_IN_USE`). `--delete-file` juga menghapus key itu sendiri, tetapi hanya untuk key yang dibuat komando (menghapus record tersegel; key yang ditambahkan dengan `key add` tetap di disk). Key seperti itu tidak punya salinan, jadi di terminal Anda mengetik nama key; agen AI atau script menambahkan `--allow-dangerous` setelah seseorang setuju.

Untuk mengganti key di mana-mana, berurutan, lihat [Rotasi key dan kata sandi](rotate.md).

### Key dengan sertifikat

Di tempat server mempercayai certificate authority (SSH CA, `TrustedUserCAKeys`) sebagai ganti setiap key, komando login dengan sertifikat user OpenSSH milik key itu, seperti `ssh`: `KEY-cert.pub` di samping file key (`key add`, `--identity`, `~/.ssh/id_*`) ditawarkan lebih dulu, lalu key saja. Untuk sertifikat yang disimpan di tempat lain, atau untuk key yang dibuat komando, sebut namanya:

```bash
komando key add corp ~/.ssh/id_corp --cert ~/certs/id_corp-cert.pub
komando key edit deploy --cert ~/Downloads/deploy-cert.pub   # --unset cert kembali ke KEY-cert.pub
```

komando membaca sertifikat pada setiap login, jadi file yang diperbarui langsung dipakai. Sertifikat untuk key lain ditolak (`KEY_INVALID`); yang tidak valid sekarang dikeluarkan (`key add` memperingatkan), dan key saja yang ditawarkan. ssh-agent yang menyimpan sertifikat juga menawarkannya.

### Meminjamkan ssh-agent Anda ke jump host

Sebagian pekerjaan butuh key Anda di server itu sendiri, misalnya `git pull` di sana lewat SSH, atau hop yang tidak dibuat komando. `--forward-agent` meminjamkan key di ssh-agent Anda ke server selama komando tersambung, seperti `ssh -A`:

```bash
komando host edit bastion --forward-agent        # bertanya dulu
komando host edit bastion --unset forward-agent  # berhenti meminjamkan
```

Siapa pun yang menjadi root di server itu bisa memakai key Anda selama komando tersambung ke sana, jadi ini mati secara default, diatur per server, dan menyalakannya bertanya dulu kepada Anda (`SAFETY_SETTING`; agen AI butuh jawaban ya Anda di jendela). `host ssh-command` menambahkan `-o ForwardAgent=yes` untuk server seperti itu. Agent Anda hanya menyimpan key yang Anda tambahkan (`ssh-add`); key yang disimpan tersegel oleh komando tidak pernah ada di dalamnya kecuali `host ssh-command` menaruhnya di sana.

### Security key (FIDO2)

Key pada security key (YubiKey, SoloKey, dibuat dengan `ssh-keygen -t ed25519-sk` atau `-t ecdsa-sk`) ditandatangani oleh perangkat, jadi komando memakainya lewat ssh-agent, seperti `ssh`:

```bash
ssh-add ~/.ssh/id_ed25519_sk                     # sentuh key saat berkedip
komando key add yubikey ~/.ssh/id_ed25519_sk     # membaca public key dari id_ed25519_sk.pub
komando host edit web1 --key yubikey
```

Pada setiap login key meminta sentuhan. Tanpa ssh-agent yang menyimpannya, server gagal dengan `KEY_PASSPHRASE_REQUIRED` dan hint menyuruh `ssh-add`. Simpan `id_ed25519_sk.pub` di samping file key: komando menemukan key di agent dengannya.

## Mencabut key dari server

Saat seseorang pergi, atau key diganti, cabut di mana-mana sekaligus. `key revoke` menerima key dari daftar key komando, file `.pub`, atau barisnya sendiri:

```bash
komando key revoke ~/keys/alice.pub @web --dry-run   # berapa baris per server
komando key revoke ~/keys/alice.pub @web
komando key revoke old-deploy @web --user deploy     # file user lain (memakai sudo)
komando key revoke ~/keys/alice.pub @web --all-users --dry-run   # file setiap user: siapa yang memilikinya
```

`--all-users` (dengan sudo) mencari di `authorized_keys` setiap user di server: orang yang pergi mungkin menaruh key itu di akun lain juga. Hasilnya mencantumkan setiap user yang filenya memuatnya (`users`). File `authorized_keys` mempertahankan pemilik dan modenya, dan dibaca serta ditulis sebagai user pemiliknya sendiri. Mencabut key yang dipakai komando sendiri untuk login butuh `--allow-dangerous`, karena Anda akan mengunci diri sendiri.

## Memakai kata sandi

Di terminal Anda, komando menanyakan kata sandi saat server menginginkannya, seperti `ssh` (`web1: Password:`, disembunyikan saat Anda mengetik). Simpan sekali untuk melewati pertanyaan itu, dan agar agen AI dan script bisa login: mereka tidak punya siapa pun untuk ditanya. Anda mengetiknya, tidak ada yang ditampilkan, dan disimpan terenkripsi di vault komando (lihat [Secret](secrets.md)). Dalam satu langkah, saat menambah server atau nanti:

```bash
komando host add web2 root@203.0.113.20 --ask-password   # disimpan sebagai secret:web2-pass
komando host edit web1 --ask-password                     # kata sandi baru (disimpan sebagai secret:web1-pass)
```

`--ask-password` untuk orang di terminal (agen AI meminta Anda menjalankannya). Perintah ini tidak pernah menggantikan secret yang dipakai server atau conn lain. Hal yang sama dalam dua langkah, dengan nama pilihan Anda:

```bash
komando secret set web1-pass
komando host edit web1 --password-ref secret:web1-pass
```

`--password-ref secret:NAME` yang secret-nya belum ada di vault langsung mendapat peringatan, beserta perintah `secret set` yang menyimpannya.

Kata sandi menuju alamat server pada setiap login. Jadi saat agen AI memberi server atau conn sebuah rujukan kata sandi, atau memindahkan yang punya satu ke alamat, port, atau jalur `--via` lain, seseorang mengizinkannya di jendela komando (`SECRET_DESTINATION`); lihat [Keamanan](safety.md#seatbelts-for-ai-agents).

komando mengirim kata sandi tersimpan paling banyak sekali per login, dan hanya saat server meminta kata sandi (disembunyikan saat Anda mengetik); yang ditolak tidak dikirim lagi, jadi kata sandi yang salah di vault tidak bisa mengunci akun.

### Mengetik kata sandi setiap kali (`--login ask`)

Sebagian kata sandi tidak boleh disimpan di laptop. Dengan `--login ask`, komando tidak menyimpan apa pun: seseorang mengetik kata sandi setiap kali komando tersambung, dan dipakai hanya untuk satu perintah itu.

```bash
komando host add web2 root@203.0.113.21 --login ask   # tidak pernah disimpan
komando host edit web1 --login ask                    # berhenti memakai kata sandi tersimpan
komando host edit web1 --login agent                  # kembali ke ssh-agent dan ~/.ssh
komando host edit web1 --login password --ask-password   # kembali ke kata sandi tersimpan
```

`--login` menerima kata yang dicetak `host show` dan `host list` di field `login`-nya, dan masing-masing terbaca kembali seperti ditulis:

| `--login` | Cara komando login | Butuh |
|---|---|---|
| `ask` | seseorang mengetik kata sandi di setiap koneksi; tidak pernah disimpan | tanpa `--password-ref` atau `--ask-password` |
| `password` | kata sandi tersimpan, tanpa key | `--ask-password` atau `--password-ref` (atau yang sudah tersimpan) |
| `key` | key yang disebut komando, lalu kata sandi tersimpan bila ada | `--key NAME` atau `--identity PATH` (atau yang sudah diatur) |
| `agent` | ssh-agent dan key di `~/.ssh` | tanpa key, identity, atau kata sandi tersimpan |

Pengaturannya juga menyatakannya sendiri: `--key` memberi `key`, `--password-ref` memberi `password`. `--login` mengosongkan apa yang bertentangan dengannya (`password` membuang key, `agent` membuang key dan kata sandi tersimpan). Server WinRM login dengan kata sandi: `password` atau `ask`.

Siapa yang mengetiknya, dan di mana:

- **Anda, di terminal**: komando menanyakan `web1: Password:` (disembunyikan) saat server menginginkannya, setelah key mana pun, seperti `ssh`.
- **Perintah agen AI**: komando membuka jendelanya sendiri di layar Anda. Jendela menyebut agen, server sebagai `user@address:port`, jalan yang ditempuh komando ke sana (VPN, setiap jump host dengan alamatnya, proxy command) dan perintahnya (atau menyatakan perintah itu disembunyikan), dan Anda mengetik kata sandi di sana. Agen tidak pernah melihatnya. Setiap perintah yang tersambung bertanya, bahkan yang hanya melihat (`komando test`, `fs ls`). Bila Anda menekan Cancel, perintah berhenti dengan `DECLINED`, dan jendela tetap tertutup untuk server itu selama semenit (mengganti nama tidak membukanya lagi) (perintah berikutnya langsung mendapat `DECLINED`), sehingga agen tidak bisa bertanya lagi dan lagi. Tanpa layar (sesi SSH, `KOMANDO_NO_DIALOG=1`, `ssh-gate`) perintah berhenti dengan `NEEDS_PERSON`.
- **Script** (tanpa terminal): `NEEDS_PERSON`. Tidak ada yang bisa mengetiknya.
- **Aplikasi** yang menjalankan komando mendapat pertanyaan yang sama di jendelanya sendiri.

Kata sandi menuju apa pun yang menjawab di ujung jalan ke sana. Bila agen AI bisa memilih jalan itu, agen bisa mengarahkan Anda ke server yang dikendalikannya dan menangkap apa yang Anda ketik, sementara jendela tetap menyebut server yang benar. Jadi komando menjaga jalannya di tangan Anda:

- **Hanya Anda yang menentukan ke mana kata sandi menuju.** Agen AI yang menambah server `--login ask`, mengubah satu menjadi `--login ask`, mengubah alamat, port, user, jalur `--via`, proxy command, transport WinRM, atau `tls=`, `ca=`, atau `auth=`-nya, mengubah `default_user` selama server tidak punya user, atau mengubah server atau VPN di jalannya (alamat jump host, server VPN; juga lewat `vpn add --overwrite`, impor, atau mengganti secret yang memuat profil OpenVPN) berhenti dengan `NEEDS_PERSON`. Tidak ada flag yang mengangkatnya: jalankan perintah itu di terminal Anda sendiri bila Anda menginginkannya. Dry run tidak pernah diblokir dan menyebut penghentian itu di `meta.would_be_blocked`. Edit lain (tag, catatan, grup) berlanjut.
- **Key yang belum pernah Anda pakai login butuh Anda.** Koneksi pertama ke server `--login ask`, yang host key-nya belum pernah dilihat komando, butuh orang di terminal: perintah agen AI berhenti dengan `NEEDS_PERSON`, tidak membuka jendela, dan tidak mem-pin apa pun. Jalankan `komando login web1` (atau perintah apa pun) di terminal Anda sekali: komando mencetak key baru untuk dibandingkan, lalu menanyakan kata sandi. Key yang di-pin saja tidak cukup: komando mem-pin key menurut alamat, dan agen bisa mem-pin apa pun yang menjawab di sebuah alamat lewat server mana pun yang ditambahkannya di sana. Jadi kata sandi yang diketik hanya menuju key yang pernah Anda pakai login ke server ini; key yang di-pin dengan cara lain dihitung sebagai koneksi pertama (`nobody has logged in to web1 ... with a typed password yet`). Mengganti nama mempertahankan apa yang pernah Anda temui; `host trust --reset` melupakannya. Jendela aplikasi memperingatkan pada koneksi atau login pertama. Hal yang sama berlaku selama `host_key_policy` adalah `off`, dan untuk server WinRM dengan `tls=off` atau `tls=skip-verify`: tidak ada yang memeriksa siapa yang menjawab di sana.
- **Proses latar belakang login milik Anda.** Agen AI tidak bisa menjalankan `komando login`, maupun memulai proses latar belakangnya sendiri (keduanya `NEEDS_PERSON`), yang pertanyaannya akan dijawabnya seolah-olah ia adalah Anda.

Satu perintah bertanya sekali per server: `komando exec @web -P 10` menanyakan setiap server login-ask sekali, dan jump host sekali untuk setiap server di belakangnya. Kata sandi yang ditolak server tidak dikirim lagi: perintah melupakannya, dan koneksi berikutnya (dalam perintah yang sama atau berikutnya) bertanya lagi. Kata sandi yang diketik disembunyikan di semua output (`[hidden]`), tidak pernah ditulis ke disk, audit log, atau lingkungan program. komando menolkan salinannya sendiri saat perintah berakhir; salinan yang dibuat library SSH tidak bisa dinolkan dan hilang saat proses perintah berakhir.

Untuk mengetik sekali selama beberapa waktu, login dengan `komando login web1` (di bawah): setiap perintah, milik agen AI juga, memakai login itu sampai berakhir, dan tidak ada yang ditanya. Server yang mencetak kembali kata sandi tidak bisa disamarkan saat itu: perintah yang memakai login tidak pernah memilikinya. Tunnel berjalan di latar belakang, jadi `komando tunnel start` bertanya sekarang dan menyerahkan kata sandi ke proses tunnel lewat inputnya; proses itu menyimpannya di memori selama seluruh hidup tunnel (sambung ulangnya), sampai tunnel berhenti. `tunnel start` hanya bertanya untuk server yang sudah Anda pakai login dengan key yang di-pin untuknya: proses latar belakang tidak bisa menampilkan key baru kepada siapa pun.

Mengubah server ke `--login ask` atau `--login agent` melepas kata sandi tersimpannya. komando tidak pernah menghapus secret itu sendiri: bila tidak ada server atau conn lain yang memakainya, hasilnya menyebutnya di `secrets_unused` beserta `komando secret rm` yang menghapusnya. Mengatur kata sandi tersimpan nanti (`--password-ref`, `--ask-password`) mengakhiri `--login ask`. Mengubah login server yang dilindungi butuh jawaban ya yang sama dengan perubahan apa pun padanya.

### Login dua faktor

Saat server juga meminta kode sekali pakai (atau pertanyaan lain), komando menampilkan pertanyaan server beserta namanya (`web1: Verification code:`) dan mengirim apa yang Anda ketik, disembunyikan kecuali server membiarkannya tampil. Server yang login sekaligus (`komando exec @web`) bertanya satu per satu. Ctrl-C menghentikan login (`CANCELLED`). Hanya orang di terminal yang ditanya: untuk agen AI atau script, login berhenti dengan `AUTH_FAILED`, pesan mengutip pertanyaan server, dan tidak ada kode salah yang dihitung terhadap akun. Agen meminta Anda login sekali untuknya:

```bash
komando login web1        # ketik kata sandi dan kode sekali
komando logout web1       # akhiri lebih awal
```

`komando login` menanyakan apa yang ditanyakan server lalu menjaga login itu tetap terbuka di latar belakang selama 8 jam (pengaturan `login_for`). Setiap perintah ke web1 memakainya, milik agen AI Anda juga, sehingga tidak ada yang mengetik kode lagi sampai berakhir; aturan, persetujuan, dan audit komando tetap berlaku untuk setiap perintah. Login ke jump host dipakai untuk setiap server di belakangnya. `komando status` mencantumkan login yang disimpan, dan login berakhir lebih awal saat server menutupnya atau alamatnya berubah.

Hanya orang di terminal yang bisa menjalankan `komando login`; `komando login web1 --dry-run` milik agen AI menampilkan rencananya (`would_log_in: false`, dan `meta.would_be_blocked` menyebut `NEEDS_PERSON`).

### Kata sandi sudo dan vault

Bila `sudo` meminta kata sandi di server, simpan itu juga:

```bash
komando secret set web1-sudo
komando host edit web1 --sudo-ref secret:web1-sudo
```

Semua hal lain tentang vault (mencantumkan, memeriksa, mengganti nama, dan menghapus secret, dan tempat key-nya disimpan) ada di satu halaman: [Secret](secrets.md).

## Kata sandi dari password manager Anda

Setiap `--password-ref` dan `--sudo-ref` (untuk server, conn, dan VPN) juga bisa menunjuk ke variabel lingkungan, file, atau password manager yang sudah dipakai tim Anda:

| Rujukan | Dibaca dari | Login yang dipakainya |
|---------|-------------|-----------------------|
| `secret:NAME` | vault komando (`komando secret set NAME`) | tidak dibutuhkan |
| `env:VAR` | variabel lingkungan | tidak dibutuhkan |
| `file:PATH` | sebuah file | tidak dibutuhkan |
| `vault:secret/shop#db_password` | HashiCorp Vault atau OpenBao, KV v1 atau v2 | `VAULT_ADDR` dan `VAULT_TOKEN` (atau `~/.vault-token`; `BAO_ADDR`, `BAO_TOKEN`, `~/.bao-token` milik OpenBao juga berfungsi), `VAULT_NAMESPACE`, `VAULT_CACERT` |
| `aws-sm:shop/db#password` | AWS Secrets Manager; `#key` memilih field JSON | login AWS Anda (`AWS_PROFILE`, `~/.aws`, SSO lewat `komando login aws`) |
| `gcp-sm:db-pass@my-project` | Google Secret Manager, versi terbaru | Google application-default credentials (`GOOGLE_APPLICATION_CREDENTIALS`, atau di Google Cloud) |
| `azure-kv:shop-vault/db-password#password` | Azure Key Vault, versi saat ini (`/VERSION` setelah nama memilih yang lain); `#key` memilih field JSON | service principal (`AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`), workload identity di AKS (`AZURE_FEDERATED_TOKEN_FILE`), token tersimpan Azure CLI, atau managed identity di Azure |
| `bw://shop-db/password` | Bitwarden atau Vaultwarden; field-nya `password`, `username`, `notes`, `uri`, `totp`, atau field kustom | `KOMANDO_BW_EMAIL`, `KOMANDO_BW_PASSWORD` (mendekripsi vault di sini), `KOMANDO_BW_SERVER` untuk Vaultwarden atau bitwarden.eu, API key opsional `KOMANDO_BW_CLIENT_ID`/`KOMANDO_BW_CLIENT_SECRET` |
| `kdbx:~/team.kdbx#Servers/web1` | file KeePass atau KeePassXC (KDBX 3.1 dan 4); `#UserName` atau field lain setelah entri | `KOMANDO_KDBX_PASSWORD` dan/atau `KOMANDO_KDBX_KEYFILE` |
| `op://Vault/Item/field` | 1Password, lewat server 1Password Connect | `OP_CONNECT_HOST`, `OP_CONNECT_TOKEN` |

```bash
komando conn add prod-db postgres://app@10.0.0.5/shop --password-ref vault:secret/shop#db_password
```

komando berbicara ke Vault, AWS, Google, Azure, Bitwarden, file KeePass, dan 1Password Connect sendiri: Anda tidak butuh program `vault`, `aws`, `gcloud`, `az`, `bw`, atau `op`. komando membaca nilainya hanya saat membutuhkannya dan tidak pernah menyimpannya. Login (dan MFA apa pun) tetap bersama Anda.

**Azure Key Vault.** Tulis `azure-kv:VAULT/NAME`, dengan `VAULT` adalah nama vault (`shop-vault` untuk `shop-vault.vault.azure.net`) atau, di cloud Azure lain, seluruh nama host-nya (`shop-vault.vault.azure.cn`). komando mencoba login ini berurutan:

1. service principal: `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, dan `AZURE_CLIENT_SECRET`;
2. workload identity di AKS: `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, dan `AZURE_FEDERATED_TOKEN_FILE`;
3. token yang disimpan Azure CLI di komputer ini (Linux dan macOS), selama masih berlaku: setelah `az login`, jalankan `az account get-access-token --resource https://vault.azure.net` dan komando bisa memakai token itu sekitar satu jam. komando tidak menjalankan `az` dan tidak bisa memperbarui token;
4. managed identity mesin Azure tempat komando berjalan (`AZURE_CLIENT_ID` memilih yang user-assigned).

`AZURE_AUTHORITY_HOST` memilih host login cloud Azure lain (`https://login.microsoftonline.us`, `https://login.chinacloudapi.cn`); host lain ditolak, karena login menuju ke sana.

Login butuh role "Key Vault Secrets User" pada vault, atau access policy yang mengizinkan Get pada secret.

## Server tanpa port SSH terbuka (AWS SSM, GCP IAP, Cloudflare)

Sebagian server dijangkau lewat tool cloud sebagai ganti port SSH biasa. Berikan perintah tool itu ke komando, seperti `ProxyCommand` milik OpenSSH (`%h` adalah alamat, `%p` port, `%r` user):

```bash
komando host add web1 ec2-user@i-0abc123 --ssm     # AWS Systems Manager: alamatnya adalah instance ID
komando host add web2 me@web2 --proxy-command 'gcloud compute start-iap-tunnel %h %p --listen-on-stdin --zone europe-west1-b'
komando host add db1 me@ssh.example.com --proxy-command 'cloudflared access ssh --hostname %h'
komando conn add prod-db postgres://app@mydb.xyz.rds.amazonaws.com/app --via web1   # database di belakangnya
```

Tool `--proxy-command` harus terinstal dan login di komputer ini. Di Windows perintah berjalan di cmd.exe, jadi tulis untuk cmd.exe. Proxy command berjalan di komputer ini, jadi agen AI butuh jawaban ya dari seseorang untuk menambah atau mengimpornya.

Untuk `--ssm`, komando berbicara AWS Session Manager sendiri bila aws CLI atau session-manager-plugin-nya tidak terinstal. komando memakai login AWS Anda yang lazim (`komando login aws` untuk SSO). Atur `KOMANDO_EXPERIMENTAL=ssm` untuk memakai klien bawaan bahkan saat keduanya terinstal. Sesi yang dienkripsi account Anda dengan KMS juga berfungsi: komando meminta key sesi ke KMS dengan login Anda, jadi login itu butuh `kms:GenerateDataKey` pada key tersebut, seperti plugin.

## Key server (host key)

Saat pertama kali komando tersambung ke server, komando mengingat key server (fingerprint-nya) di `known_hosts` miliknya sendiri. Bila key berubah kemudian, komando menolak tersambung (`HOSTKEY_MISMATCH`), karena mungkin ada yang berpura-pura menjadi server Anda.

Pada saat pertama itu, tidak ada yang membuktikan bahwa key itu benar milik server Anda. komando menyatakan di stderr key mana yang dipercayainya:

```text
komando: first connection to web1 (203.0.113.10:22): trusted its ssh-ed25519 host key SHA256:pVt2...
```

Audit log juga menyimpannya (`host.key-pinned` di `komando audit`), dan jawaban JSON mencantumkannya di `meta.host_keys_pinned`, sehingga agen AI bisa menunjukkannya kepada Anda. Bandingkan fingerprint itu dengan milik server sendiri: jalankan `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub` di konsol server, atau lihat di konsol cloud Anda (banyak yang menampilkan fingerprint host key di log boot pertama). Bila berbeda, berhenti memakai server itu dan tanyakan kepada yang menjalankannya: mungkin ada yang berada di tengah.

### Mengganti key setelah dibangun ulang

Setelah pembangunan ulang yang sebenarnya, periksa fingerprint baru dengan cara lain (konsol cloud Anda atau konsol server sendiri), lalu ganti key lama:

```bash
komando host trust web1 --reset --dry-run   # berapa key yang di-pin akan hilang
komando host trust web1 --reset             # menampilkan key lama dan baru, bertanya sekali
```

Hanya orang di terminal yang mengganti key yang di-pin: komando menampilkan fingerprint lama dan baru dan bertanya sekali. Agen AI atau script mendapat `NEEDS_PERSON` (exit 6) flag apa pun yang ditambahkannya, karena agen yang mem-pin ulang key bisa sedang berbicara dengan penipu; hint-nya menyebut perintah untuk Anda jalankan. Tanpa `--reset`, `host trust` tidak pernah menambah key kedua: key yang berbeda berhenti dengan `HOSTKEY_MISMATCH`, dan server yang tidak bisa dijangkau mempertahankan key lamanya.

Setelah Anda membangun ulang seluruh grup (alamat sama, key baru), berikan grup itu ke `host trust` sebagai ganti satu nama. Perintah ini menerima setiap jenis target, seperti `exec`: `@group`, `tag:`, `'web*'`, atau `a,b`.

```bash
komando host trust @web                 # server baru di-pin; key yang berubah ditolak
komando host trust @web --reset         # setelah pembangunan ulang: satu jawaban ya untuk semuanya
```

`data.results` (di `-o json`) mencantumkan setiap server dengan `fingerprint` barunya dan, bila key berubah, `old_fingerprints`-nya. Dengan `--reset` Anda menjawab sekali: pertanyaan menyebut setiap server yang key-nya berubah, dengan awal fingerprint barunya. Bandingkan dengan konsol cloud Anda dulu.

`komando host rm` tidak melupakan key server. Bila Anda menghapus server dan menambahkannya lagi di alamat yang sama, ia tetap harus menunjukkan key yang sama, jadi `rm` ditambah `add` bukan jalan untuk menghindari `HOSTKEY_MISMATCH`. `host rm` menyatakan key mana yang dipertahankannya (`host_keys_kept`); setelah pembangunan ulang, ganti dengan `host trust --reset`.

### Mem-pin key sebelum koneksi pertama

`komando host trust web1` (tanpa `--reset`) mem-pin key sebelum koneksi pertama; key yang sama lagi tidak mengubah apa pun. Key diambil dengan cara komando menjangkau server: langsung, atau lewat jalur `--via`, VPN, atau proxy command-nya.

Untuk memeriksa setiap server baru sebelum dipakai komando, tolak key yang tidak dikenal dan pin satu per satu, dengan lebih dulu membandingkan `fingerprint` di setiap jawaban dengan milik server sendiri:

```bash
komando config set host_key_policy strict   # key yang tidak dikenal berhenti dengan HOSTKEY_UNKNOWN
komando host trust web1                     # data.results[0] punya key_type dan fingerprint
```

Bila Anda sudah punya fingerprint-nya (dari konsol server atau penyedia cloud Anda), biarkan komando membandingkannya untuk Anda: `--fingerprint` mem-pin key hanya bila server menunjukkan yang itu.

```bash
komando host trust web1 --fingerprint SHA256:pVt2...   # di-pin hanya bila cocok
```

Key lain berhenti dengan `HOSTKEY_MISMATCH` (exit 4) dan tidak ada yang di-pin; pesan menampilkan kedua fingerprint. Berikan fingerprint dari jenis key yang ditawarkan server (`key_type` di jawaban; `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub` di server mencetaknya). Perintah ini menerima satu server, dan jawabannya punya `expected_fingerprint` di samping `fingerprint`. Aturan lain tetap: dengan `strict`, pin pertama agen AI tetap butuh jawaban ya Anda, dan mengganti key yang di-pin tetap butuh `--reset` di terminal Anda.

`HOSTKEY_UNKNOWN` menyatakan fingerprint mana yang ditunjukkan server. Dengan `strict`, agen AI tidak bisa mem-pin key pertama sendiri: `host trust` butuh jawaban ya Anda di jendela komando, yang menampilkan fingerprint untuk dibandingkan (dengan `accept-new` yang default, login pertama mem-pin-nya juga).

## Memakai OpenSSH dengan pengaturan yang sama

`host ssh-command` mencetak perintah `ssh` yang menjangkau server dengan alamat, user, key, file `known_hosts`, dan jalur `--via` yang sama dengan yang dipakai komando:

```bash
komando host ssh-command web1
$(komando host ssh-command web1 -o text)      # buka shell dengan OpenSSH
```

Server di belakang `--via` mendapat satu `ProxyCommand` per hop, sehingga setiap hop memakai key-nya sendiri. VPN SOCKS menjadi `nc -X 5`. VPN yang berjalan di dalam komando tidak bisa dipakai OpenSSH; pakai `komando shell SERVER` untuk itu.

Key yang dibuat dengan `komando key gen` disegel di store komando dan tidak pernah ditulis ke file. Untuk OpenSSH, `host ssh-command` menyerahkannya ke ssh-agent yang sudah dijalankan shell Anda (`SSH_AUTH_SOCK`), yang menyimpannya selama satu jam, dan baris yang dicetak memilihnya dengan public key-nya. Tanpa ssh-agent, perintah berhenti dengan `SSH_AGENT_NEEDED`: jalankan satu dengan `eval "$(ssh-agent)"`, atau pakai `komando shell SERVER`.

Hanya orang di terminal yang bisa menjalankan `host ssh-command`: perintah ini menulis salinan host key yang di-pin untuk OpenSSH, di folder sementara privat (`komando-ssh-*`). Baris yang dicetak lebih dari sehari lalu mungkin berhenti berfungsi: `host ssh-command` berikutnya menghapus salinan yang sudah selama itu. Agen AI mendapat `NEEDS_PERSON` dan diberi tahu untuk memakai `komando exec` atau `komando shell`.

## Batasan

- Nama server memakai huruf, angka, `.`, `_`, dan `-` (lihat [Target](targets.md#limits)). Server tidak boleh bernama `aws`, `gcp`, atau `azure`: `komando login aws` adalah login AWS.
- `--address` di `host edit` hanya berfungsi pada satu server.
- File key yang ditambahkan dengan `key add` tidak pernah dipindahkan atau dihapus komando.
- Sertifikat host (`@cert-authority` di known_hosts) belum dibaca: komando mem-pin host key setiap server sendiri.
- `--ask-password`, `komando login`, `host ssh-command`, dan mengganti host key yang di-pin (`host trust --reset`) butuh orang di terminal.
- Kata sandi server `--login ask` diketik oleh seseorang: script, cron, atau job CI menjangkaunya hanya lewat `komando login` yang dimulai seseorang, dan koneksi pertamanya butuh orang di terminal. Server WinRM tidak punya `komando login`. Hanya orang yang mengubah ke mana kata sandi menuju, atau server atau VPN di jalannya, atau `default_user` selama server login-ask tidak punya user sendiri.
- Apa yang tidak bisa dihentikan `--login ask`. komando mengenal agen AI hanya dari lingkungannya (`CLAUDECODE`, `KOMANDO_AGENT`, dan sejenisnya); program yang menyembunyikannya diperlakukan sebagai orang. Program apa pun milik user Anda bisa menggambar jendela yang tampak seperti milik komando, mengganti binary komando, atau membaca memori komando yang sedang berjalan. Ketik kata sandi hanya ke jendela yang dibuka oleh perintah yang Anda harapkan, dan jauhkan agen dari file akun Anda bila itu penting. Di Windows, jendela kata sandi komando adalah jendela persetujuannya, jadi tombolnya bertuliskan Deny dan "Allow once", dan spasi di sekitar kata sandi dibuang.
- `op://` membaca 1Password hanya lewat server 1Password Connect: CLI 1Password bersifat closed source, dan komando hanya memakai bagian yang open source.
- Token tersimpan Azure CLI berfungsi sekitar satu jam; komando tidak menjalankan `az` dan tidak bisa memperbaruinya.
- Server yang dijangkau server lain lewat `--via` tidak bisa dihapus sampai server-server itu berubah.

## Pemecahan masalah

| Kode error | Artinya | Yang perlu dilakukan |
|------------|---------|----------------------|
| `AUTH_FAILED` | server menolak login, atau mengajukan pertanyaan (kode dua faktor) tanpa orang di terminal | periksa user dan kata sandi; untuk kode, jalankan `komando login SERVER` sekali |
| `KEY_PASSPHRASE_REQUIRED` | key terenkripsi dan tidak ada ssh-agent yang menyimpannya | `ssh-add PATH`, atau simpan passphrase-nya dan pakai `--passphrase-ref` |
| `HOSTKEY_MISMATCH` | server menunjukkan host key lain dari yang di-pin: dibangun ulang, atau ada yang di tengah | periksa fingerprint dengan cara lain; setelah pembangunan ulang yang sebenarnya, `komando host trust SERVER --reset` di terminal Anda sendiri |
| `HOSTKEY_UNKNOWN` | `host_key_policy` adalah `strict` dan key ini belum di-pin | bandingkan fingerprint, lalu `komando host trust SERVER` |
| `HOST_IN_USE` | server lain menjangkau server ini lewat `--via` | ubah `--via` mereka dulu, atau hapus mereka dalam perintah yang sama |
| `VIA_CYCLE` | jalur `--via` mengarah kembali ke dirinya sendiri, atau menyebut satu langkah dua kali | sebut setiap server atau VPN sekali, dan bukan server itu sendiri |
| `NAME_TAKEN` | penggantian nama akan memberi dua entri satu nama | pilih nama lain, atau ganti nama atau hapus yang menghalangi |
| `VPN_IN_USE` | penggantian nama butuh VPN yang tersambung diputus | `komando vpn down NAME` dulu |
| `KEY_IN_USE` | `key rm` pada key yang masih dipakai server | beri server key lain: `komando host edit SERVER --key OTHER` |
| `KEY_EXISTS` | `key gen`, `key add`, atau `key rename` ke nama yang sudah dipakai | pilih nama lain, atau `komando key rm NAME` dulu |
| `SECRET_DESTINATION` | agen AI meminta mengirim kata sandi ke sebuah server | seseorang mengizinkannya di jendela komando |
| `SECRET_UNRESOLVED` | komando tidak bisa membaca sebuah rujukan (tanpa login untuk password manager, atau tidak ada secret seperti itu) | ikuti hint: hint menyebut login yang berfungsi |
| `SSH_AGENT_NEEDED` | `host ssh-command` untuk key yang dibuat komando, tanpa ssh-agent yang berjalan | `eval "$(ssh-agent)"`, atau pakai `komando shell SERVER` |
| `NEEDS_PERSON` | hanya orang di terminal yang bisa melakukan ini (`host trust --reset`, `host ssh-command`), atau kata sandi server `--login ask` dan tidak ada yang bisa mengetiknya, atau koneksi pertamanya (host key yang belum pernah dipakai login siapa pun), atau agen AI mengubah ke mana kata sandinya menuju (alamat, port, user, `--via`, proxy command, server atau VPN di jalannya) | jalankan perintah di terminal Anda sendiri, atau `komando login SERVER` sekali |
| `DECLINED` | orangnya membatalkan jendela kata sandi server `--login ask` (atau melakukannya kurang dari semenit lalu) | seseorang menjalankan `komando login SERVER` |
| `NEEDS_PERSON` | `komando login` tanpa orang di terminal (agen AI atau script) | seseorang menjalankan `komando login SERVER` |
| `IMPORT_INCOMPLETE` | sebagian server tidak diimpor (dicantumkan di `skipped`) | perbaiki di sumbernya dan impor lagi |
