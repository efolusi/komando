# Secret

Simpan kata sandi, passphrase key, atau token sekali, lalu rujuk sebagai `secret:NAME` alih-alih mengetiknya. komando menampilkan nilai yang tersimpan hanya kepada orang yang memintanya dengan `--reveal` (`secret show`, `key show`), di terminal atau setelah "Allow once" di jendela komando, dan tidak pernah kepada agen AI.

## Menyimpan kata sandi dan memakainya

```bash
komando secret set web1-pass                          # ketik atau tempel setelah prompt, tidak ada yang ditampilkan
komando host edit web1 --password-ref secret:web1-pass
komando test web1
komando secret list                                   # nama, kapan berubah, apa yang memakainya
```

Jika diketik tanpa argumen, `komando secret set` menanyakan nama, lalu nilainya (disembunyikan).

## Menyimpan satu secret

Di terminal, `komando secret set NAME` menanyakan nilainya dan menyembunyikannya saat Anda mengetik atau menempel:

```text
Paste or type the value for web1-pass, then press Enter (it stays hidden):
```

Tempel *setelah* prompt muncul. Teks yang diketik sebelum prompt muncul sudah tampil di layar, jadi komando tidak memakainya, dan mengatakannya: `Note: what was typed before this question showed was not used.` Jika teks itu adalah secret-nya, bersihkan layar dan ketik lagi. Nilai berisi beberapa baris (key, sertifikat) dimasukkan lewat stdin:

```bash
komando secret set web1-pass                   # bertanya, disembunyikan
komando secret set db-pass --from-env DB_PASS  # dari variabel lingkungan
pbpaste | komando secret set vpn-pass          # dari clipboard (xclip -o di Linux)
komando secret set tls-key < server.key        # nilai berisi beberapa baris
```

- Nilai di command line (`komando secret set NAME VALUE`) ditolak dengan `SECRET_IN_ARGS`: nilai itu akan tertinggal di riwayat shell.
- Tempelan lebih dari satu baris di prompt berhenti dengan `USAGE` dan tidak menyimpan apa pun: kalau tidak, shell akan menjalankan baris lainnya.
- Nilai kosong (pipe kosong, variabel kosong, Enter di prompt) berhenti dengan `USAGE` dan tidak menyimpan apa pun.
- Dari pipe, pindah baris di akhir bukan bagian dari nilai. Spasi dipertahankan; komando memperingatkan bila nilai diawali atau diakhiri spasi.
- `secret set` pada nama yang sudah ada menggantikan nilainya. Bila server atau conn yang dilindungi memakainya, komando bertanya dulu kepada Anda; agen AI atau script menambahkan `--yes` setelah seseorang setuju.
- `secret set NAME --new` hanya menyimpan secret baru: bila NAMA sudah ada di vault, perintah berhenti dengan `SECRET_EXISTS` (exit 8) dan nilai yang tersimpan tetap. Nilainya masuk seperti tanpa `--new`. Bila beberapa perintah komando menyimpan nama yang sama dengan `--new` bersamaan, tepat satu yang menyimpannya dan yang lain berhenti dengan `SECRET_EXISTS`. Dengan `--dry-run` jawabannya sama: `SECRET_EXISTS` untuk nama yang sudah dipakai, `"action": "would_store"` untuk nama yang masih bebas.

```bash
komando secret set api-token --new --from-env TOKEN   # tidak pernah menggantikan yang ada
```

## Memakai secret

Setiap flag `--password-ref`, `--sudo-ref`, `--passphrase-ref`, dan flag key VPN menerima sebuah rujukan:

```bash
komando host edit web1 --sudo-ref secret:web1-sudo
komando conn add prod-db postgres://app@10.0.0.5/shop --password-ref secret:prod-db-pass
komando key add work ~/.ssh/id_work --passphrase-ref secret:work-pass
komando exec web1 --env DB_PASS=secret:prod-db-pass -- ./migrate.sh
komando fs replace web1 /srv/app/.env --old 'DB_PASSWORD=[hidden]' --new 'DB_PASSWORD={{secret:prod-db-pass}}' --backup
```

Rujukan juga bisa membaca kata sandi yang disimpan tim di tempat lain: `env:VAR`, `file:PATH`, HashiCorp Vault atau OpenBao (`vault:PATH#FIELD`), secret manager AWS, Google, dan Azure (`aws-sm:`, `gcp-sm:`, `azure-kv:`), 1Password Connect (`op://`), Bitwarden atau Vaultwarden (`bw://`), dan file KeePass (`kdbx:`). Lihat [Kata sandi dari password manager](servers.md#passwords-from-your-password-manager) untuk masing-masing dan login yang dipakainya. komando membaca nilai seperti itu hanya saat membutuhkannya dan tidak pernah menyimpannya.

## Menjalankan program di komputer ini dengan secret

```bash
komando secret run --env PGPASSWORD=secret:prod-db-pass -- psql -h 10.0.0.5 -U app shop
komando secret run -e AWS_SECRET_ACCESS_KEY=secret:aws-ci -e AWS_REGION=eu-west-1 -- terraform plan
```

`komando secret run` memulai program setelah `--` di komputer ini, dengan nilai `--env` di lingkungannya. komando membaca `secret:NAME` dari vault tepat sebelum program dimulai, jadi nilainya tidak pernah ada di baris perintah atau riwayat shell Anda. Program dimulai tanpa shell, dan mendapat lingkungan Anda tanpa variabel `KOMANDO_*` milik komando sendiri dan nilai yang membuka vault.

- Nilai vault yang dicetak program tampil sebagai `[secret:NAME]`.
- komando keluar dengan kode keluar program. Di Linux dan macOS, program yang dihentikan sinyal N membuat komando keluar dengan 128+N (143 untuk `SIGTERM`), seperti shell.
- `SIGTERM` atau `SIGHUP` ke komando diteruskan ke program, jadi program tidak terus berjalan dengan secret. Ctrl-C di terminal sampai ke program dengan sendirinya, satu kali. Ctrl-C kedua langsung mengakhiri komando dan mengakhiri program lebih dulu. Di Windows komando mengakhiri program.
- Di Linux program mendapat `SIGTERM` saat komando mati, juga karena `SIGKILL`. Di macOS dan Windows, komando yang dimatikan dengan cara itu meninggalkan program tetap berjalan dengan secret.
- komando menunggu 3 detik setelah program keluar sampai outputnya berakhir. Proses latar belakang peninggalan program yang masih memegang output diputus saat itu, dan komando keluar.
- Baris output yang lebih panjang dari 256 KiB dipotong, tetapi tidak pernah di dalam nilai tersembunyi sampai 1 MiB atau pola yang disamarkan seperti `password=...`. Private key yang terbuka di titik potong disembunyikan dari baris `BEGIN` sampai baris `END` (paling banyak 16 KiB lagi).
- Audit log mencatat path program, nama variabel, dan nama secret, tidak pernah nilainya.
- `--dry-run` menampilkan path program dan secret mana yang masuk ke variabel mana, dan tidak membaca nilai apa pun. Dry run tidak bertanya kepada siapa pun: persetujuan yang dibutuhkan eksekusi sungguhan ada di `meta.would_need` dan `meta.would_be_blocked`.
- Rujukan dalam bentuk apa pun (`secret:`, `env:`, `file:`, `vault:`, `op://`, ...) di argumen program ditolak: taruh di `--env`. URL `file://` bukan rujukan dan lolos. Ini penjaga terhadap kesalahan, bukan batas keamanan: komando tidak pernah menguraikan rujukan di argumen. komando menemukan `secret:` di mana saja, tetapi bentuk lain hanya di awal argumen atau setelah `=`, jadi `-penv:PW` diteruskan apa adanya.
- Agen AI butuh jawaban ya dari seseorang untuk setiap secret (`SECRET_DESTINATION`): program bisa mencetak nilai dalam bentuk yang tidak dikenali penyamaran. Jendela menyebut secret-nya, path lengkap program, variabel `--env` lainnya, dan menyatakan bila program Anda mana pun bisa menggantikan program itu.
- Dalam eksekusi agen AI dengan secret, program mendapat `HOME`, `USER`, dan `LOGNAME` dari akun Anda (`USERPROFILE` di Windows), bukan dari lingkungan agen, ditambah `LANG`, `LC_*`, `TERM`, `TMPDIR`, `TZ`, folder sistem Windows, `PATH` sistem, dan nilai `--env`-nya. Pager, editor, helper askpass, atau proxy yang diatur agen bisa meneruskan nilainya.
- Dalam eksekusi itu, nilai `--env` biasa dari agen boleh menambah variabel tetapi tidak pernah menggantikan variabel yang diatur komando (`HOME`, `PATH`, `USER`, `LANG`, `LC_*`, ..., dalam huruf besar atau kecil), dan tidak boleh mengatur apa yang menentukan kode atau pengaturan mana yang dimuat program (`USAGE`): `LD_PRELOAD`, `DYLD_*`, `NODE_OPTIONS`, `PYTHON*`, `BASH_ENV`, pager (`*PAGER`), `EDITOR`, `VISUAL`, helper askpass, file rc (`PSQLRC`, `*RC`), proxy (`*_proxy`), `GIT_*`, `SSH_*`, `XDG_*`, file konfigurasi sebuah tool (`KUBECONFIG`, `DOCKER_CONFIG`, `*_CONFIG_FILE`, `AWS_*_FILE`, `NPM_CONFIG_*`), toolchain yang memilih binary (`CC`, `CXX`, `GOFLAGS`, `GOTOOLCHAIN`, `CARGO_*`, `RUSTC_WRAPPER`, `JAVA_HOME`, `MAVEN_OPTS`, `GRADLE_OPTS`), dan sejenisnya. Variabel seperti `PGHOST`, `AWS_REGION`, atau `TF_VAR_*` lolos. Jendela menampilkan nilai `--env` biasa.
- Di Linux, bila akun Anda tidak ada di `/etc/passwd` (hanya LDAP atau sssd yang mengenalnya), komando tidak bisa membaca `HOME` akun Anda. Program lalu mendapat `HOME` sementara yang kosong, yang dihapus komando sesudahnya, dan komando menyatakannya di stderr.
- Bila file program berubah antara pemeriksaan dan awal eksekusi, komando berhenti (`TOOL_MISSING`) dan program tidak berjalan. Di Linux komando memulai file yang diperiksanya, lewat file yang terbuka.
- Risiko yang diterima: program di folder yang bisa ditulis program Anda mana pun (milik Homebrew, npm, `~/.local/bin`) tidak ditolak, karena di sanalah tool seperti `wrangler` berada. Untuk agen AI, jendela menyebut path lengkapnya dan memperingatkan bahwa program itu bisa digantikan, dan seseorang yang memutuskan.
- Secret yang dipakai server, conn, atau VPN yang dilindungi juga bertanya kepada orang di terminal, seperti perubahan pada server yang dilindungi.

## Memeriksa secret

```bash
komando secret show web1-pass      # apakah ada, apa yang memakainya, peringatan soal spasi (tanpa nilai)
komando secret check web1-pass     # ketik nilai yang Anda kira benar: cocok atau bagaimana bedanya
```

`secret check` tidak pernah menampilkan kedua nilai: perintah ini menyatakan apakah keduanya cocok, atau apakah keduanya hanya berbeda pada spasi di ujung, hanya pada huruf besar dan kecil, atau pada panjangnya. Hanya orang yang bisa menjalankannya.

## Melihat nilai lagi

```bash
komando secret show web1-pass --reveal            # cetak (seseorang, di terminal)
komando secret show web1-pass --reveal | pbcopy   # atau salin
komando key show deploy --reveal > deploy.key     # private key dari key yang dibuat komando
```

- **Di terminal**, komando mencetak nilainya: Anda sendiri yang mengetik perintahnya.
- **Dari program tanpa terminal**, seperti aplikasi Komando untuk Mac, komando lebih dulu bertanya kepada Anda di jendelanya sendiri, menyebut secret, perintah, dan program yang memulainya ("Started from: Komando"). Nilai ditampilkan hanya setelah **Allow once**; dengan `komando config approval-code` menyala, jendela juga meminta kode 6 digit. Desktop Linux atau BSD hanya mendapat jendela itu bersama kode persetujuan, dan tanpa layar perintah berhenti dengan `REVEAL_NEEDS_TERMINAL`: jalankan di terminal.
- **Agen AI tidak pernah mendapat nilai atau private key**, bahkan dengan jawaban ya dari Anda: komando menolak dengan `REVEAL_NEEDS_TERMINAL` dan tidak membuka jendela. Agen memakai `secret:NAME` dalam sebuah perintah. Key lewat `ssh-gate` (aplikasi iPhone dan iPad) juga ditolak.
- Dry run tidak menampilkan nilai dan tidak bertanya kepada siapa pun.
- Setiap nilai yang ditampilkan masuk ke audit log, sebagai `secret.reveal` atau `key.reveal`, dengan cara Anda mengizinkannya (`via`: `terminal` atau `window`) dan program yang memulai komando (`started_from`); setiap penolakan juga masuk ke sana, dengan nama secret atau key-nya. Nilainya tidak pernah.
- `key show --reveal` hanya mencetak key yang dibuat komando (`key gen`), yang disimpannya di store tersegel; untuk key yang ditambahkan dari file, komando menyebut file itu.

## Mengganti nama, menyalin, dan menghapus

```bash
komando secret rename vpn-password office-vpn-pass --dry-run   # apa yang akan berubah
komando secret rename vpn-password office-vpn-pass             # setiap server, conn, key, dan VPN ikut
komando secret cp db-pass db-pass-old                          # sebuah salinan; tidak ada yang lain berubah
komando secret rm old-pass other-old-pass                      # semuanya, atau tidak sama sekali
```

- `secret rename` mengarahkan setiap server, conn, key, dan VPN yang memakai `secret:OLD` ke `secret:NEW` dalam satu langkah (juga opsi URL conn seperti `?ca=secret:OLD`). Script dan file milik sendiri tidak diubah.
- Bila BARU sudah ada, tambahkan `--overwrite`; apa yang memakai BARU lalu mendapat nilai LAMA. Bila server atau conn yang dilindungi memakai BARU, komando bertanya dulu kepada Anda (`--yes` untuk agen AI atau script).
- `secret rm` ditolak selama ada yang memakai sebuah nama (`SECRET_IN_USE` mencantumkan apa yang memakainya); arahkan pemakainya ke secret lain dulu, atau ganti namanya.
- Secret yang dihapus tidak punya salinan, jadi di terminal Anda mengetik nama secret-nya dulu (beberapa sekaligus: jumlahnya). Agen AI atau script menambahkan `--allow-dangerous` setelah seseorang setuju (kalau tidak, `POLICY_BLOCKED`).

## Tempat penyimpanan, dan key-nya

Secret disegel dengan AES-256-GCM di `~/.komando/store.db`. Key yang membukanya ada di keychain OS (keychain macOS, Secret Service Linux, Credential Manager Windows), atau di `~/.komando/store.key` bila tidak ada keychain, atau berasal dari passphrase di `KOMANDO_VAULT_PASS`.

```bash
komando doctor                       # mana dari ketiganya yang dipakai, dan peringatan apa pun
komando secret keychain              # pindahkan key dari store.key ke keychain
komando secret keychain --off        # pindahkan kembali ke store.key (komando bertanya dulu)
komando secret passphrase            # beri store sebuah passphrase, atau ubah
komando secret passphrase --off      # kembali ke key acak di store.key (komando bertanya dulu)
komando secret passphrase --dry-run
```

komando memakai keychain dengan sendirinya hanya saat store baru membuat key-nya, dan untuk menyimpan hitungan perubahan store di samping key yang ada di sana. komando membiarkan keychain dengan `KOMANDO_KEYCHAIN=off` (CI, container, test), di tempat yang tidak punya tool keychain, dan di Mac yang user-nya tidak punya keychain default (`HOME` yang diubah): key lalu masuk ke `store.key`, dan `komando doctor` menyatakannya. komando tidak pernah membuat macOS menanyakan di mana menyimpannya. `KOMANDO_KEYCHAIN=off` milik agen AI tetap membiarkan komando membaca dan menaikkan hitungan perubahan: agen tidak bisa mematikan pemeriksaan salinan lama dengan cara itu. Agen juga tidak bisa mengarahkan komando ke keychain lain: path `KOMANDO_KEYCHAIN` miliknya (file keychain di Mac) tidak dipakai, jadi panggilannya menyimpan key dan hitungan di keychain login. Store yang key-nya ada di file keychain sendiri hanya dibuka oleh perintah Anda.

Perintah-perintah ini mengubah tempat key berada, jadi hanya orang di terminal yang menjalankannya (`NEEDS_PERSON` untuk agen AI atau script); `--dry-run` menampilkan pratinjaunya untuk siapa pun. `--off` mematikan sebuah pemeriksaan, jadi komando bertanya dulu; script menambahkan `--yes`. Detail: [Pengaturan dan file](settings.md#where-the-vaults-key-lives).

komando mengeluarkan `KOMANDO_VAULT_PASS` dan variabel unlock password manager dari lingkungannya saat dimulai, sehingga tidak ada program yang dijalankannya mewarisinya (lihat [Variabel lingkungan](settings.md#environment-variables)).

## Untuk agen AI

Agen tidak pernah melihat nilai: output menampilkan `[secret:NAME]` atau `[hidden]`.

| Agen ingin | Agen menjalankan | Atau mendapat |
|---|---|---|
| menyimpan kata sandi yang diketahui pengguna | meminta pengguna menjalankan `komando secret set NAME` | `NEEDS_PERSON` |
| menyimpan token yang dibuat sebuah program | `echo "$TOKEN" \| komando secret set NAME` atau `--from-env VAR` | |
| melihat pratinjau perubahan | perintah yang sama dengan `--dry-run` | `meta.would_be_blocked` menyebut apa yang dibutuhkan eksekusi sungguhan |
| memakai secret | `secret:NAME` di sebuah flag | `SECRET_DESTINATION`: seseorang mengizinkan ke mana secret itu pergi |
| mengganti nama, menyalin, menghapus | `secret rename`, `secret cp`, `secret rm` | |
| membaca atau membandingkan nilai | bertanya kepada pengguna (`secret show --reveal`, `key show --reveal`, `secret check`) | `REVEAL_NEEDS_TERMINAL`, `NEEDS_PERSON` |

Agen tidak pernah meminta kata sandi di chat: hint menyebut perintah yang dijalankan pengguna di terminalnya sendiri.

## Batasan

- Menyembunyikan nilai di output server adalah upaya terbaik (lihat [Keamanan](safety.md#limits)).
- Secret dari password manager (`vault:`, `op://` ...) dibaca saat dibutuhkan dan tidak pernah disimpan, jadi manager itu wajib bisa dijangkau setiap kali.
- Vault yang key-nya ada di keychain hanya terbuka di tempat keychain itu tidak terkunci. Folder yang disalin hanya membuka secret-nya dengan passphrase (lihat [Pindah ke komputer lain](import.md#copy-the-folder-everything-with-passwords)).
- Apa pun yang berjalan sebagai user Anda sendiri bisa menjangkau key-nya; lihat [Pengaturan dan file](settings.md#limits).

## Pemecahan masalah

| Kesalahan | Artinya | Yang perlu dilakukan |
|-------|---------|----------------------|
| `SECRET_IN_ARGS` (exit 2) | nilai ada di command line | `komando secret set NAME`, lalu ketik setelah prompt |
| `USAGE` (exit 2) | nilai kosong, atau tempelan beberapa baris | ketik lagi, atau berikan beberapa baris lewat stdin: `komando secret set NAME < FILE` |
| `SECRET_NOT_FOUND`, `SECRET_UNRESOLVED` (exit 3) | tidak ada secret dengan nama itu, atau rujukan yang tidak bisa dibaca | `komando secret list` |
| `SECRET_EXISTS` (exit 8) | `secret rename` atau `secret cp` ke nama yang sudah dipakai, atau `secret set --new` pada nama yang sudah tersimpan | pilih nama lain; untuk menggantikannya, tambahkan `--overwrite` (rename, cp) atau jalankan `komando secret set NAME` tanpa `--new` |
| `SECRET_IN_USE` (exit 8) | `secret rm` pada secret yang masih dipakai sesuatu | arahkan pemakainya ke secret lain, atau `secret rename` |
| `SECRET_MISMATCH` (exit 1) | `secret check`: nilai yang diketik bukan yang tersimpan | `data.difference` menjelaskan perbedaannya; `komando secret set NAME` menyimpan yang benar |
| `NEEDS_PERSON` (exit 6) | hanya orang yang bisa melakukan ini (`secret set` untuk agen, `secret check`, `secret keychain`, `secret passphrase`) | orangnya menjalankannya di terminalnya sendiri |
| `VAULT_LOCKED` (exit 1) | vault punya passphrase dan `KOMANDO_VAULT_PASS` belum diatur | atur `KOMANDO_VAULT_PASS` di shell yang menjalankan komando (agen AI bertanya kepada pengguna) |
| `VAULT_DECRYPT` (exit 1) | `KOMANDO_VAULT_PASS` bukan passphrase vault ini | atur yang benar; tidak ada yang hilang. `komando doctor` menyebut mode mana yang dipakai |
| `VAULT_KEY` (exit 1) | key hilang: `store.key` tidak ada, atau item keychain ada di komputer lain | pulihkan `~/.komando/store.key` dari backup, atau jalankan `komando secret keychain` di komputer yang keychain-nya menyimpan key itu |
| `KEYCHAIN_SLOW` (exit 1) | keychain tidak menjawab tepat waktu, jadi tidak ada yang diubah | jalankan lagi sebentar lagi; `komando doctor` bila terus terjadi |
| `KEYCHAIN_FAILED` (exit 5) | keychain tidak bisa dibaca, jadi komando tidak bisa memeriksa apakah store adalah salinan terbaru; tidak ada yang diubah | seseorang membuka kunci keychain (agen AI bertanya kepada pengguna), lalu jalankan lagi; di komputer tanpa keychain yang berfungsi, seseorang mengatur `KOMANDO_KEYCHAIN=off` |
