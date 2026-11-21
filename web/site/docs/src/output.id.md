# Hasil dan kesalahan

Cara komando menjawab, arti exit code, cara memperbaiki kesalahan yang umum, dan cara melihat apa yang masih berjalan.

## Membaca hasil

```bash
komando exec web1 -- uptime              # teks yang mudah dibaca di terminal
komando exec web1 -o json -- uptime      # satu objek JSON (yang diterima agen)
komando status                           # VPN, login, tunnel, dan job yang masih berjalan
komando doctor                           # periksa pengaturan lokal
```

Di terminal, hasilnya berupa teks yang mudah dibaca. Saat program lain (seperti agen AI atau script) menjalankan komando lewat pipe, hasilnya satu objek JSON. Paksa salah satunya dengan `-o text` atau `-o json`, atau atur `KOMANDO_OUTPUT`. `--pretty` memberi indentasi pada JSON.

Agen atau script yang hanya ingin membaca apa yang berjalan di server juga bisa meminta teks: `komando exec web1 --read-only -o text -- cat /etc/hosts` mencetak output server apa adanya. Exit code komando tetap miliknya sendiri (5 bila perintah keluar dengan kode bukan nol), bukan milik perintah itu. Dengan beberapa server, tiap server mendapat satu blok berjudul `=== web1 [ok, exit 0]` (atau `[failed: exit 1]`, `[skipped]` ...). Pakai JSON bila butuh exit code atau kesalahan tiap server sebagai data.

Teks dari server, database, dan pod lebih dulu dibuat aman untuk terminal: warna tetap ada, tetapi escape sequence yang memindahkan kursor, mengatur judul jendela, atau menulis ke clipboard, teks tersembunyi (`ESC[8m`), karakter kontrol lain, dan bidi override (`U+202E`, yang menampilkan teks dalam urutan berbeda dari urutan sebenarnya) dicetak sebagai `\e`, `\xNN`, dan `\u202e`. Carriage return tetap ada, sehingga progress bar bekerja, kecuali pada baris yang diawali nama server atau pod (`[web1] ...`): di sana ia tampil sebagai `\r`, sehingga server tidak bisa mencetak menimpa nama itu. Di JSON, `data` menyimpan byte apa adanya, di-escape dengan cara JSON: isinya adalah file, baris, atau output itu sendiri. Kata-kata yang ditulis komando tentang sebuah hasil juga dibuat aman di sana, karena siapa pun yang membaca JSON itu menampilkannya kepada seseorang: `error.message`, `error.hint`, dan `error.suggestion` (juga di objek kesalahan pada sebuah hasil, satu per server), `meta.warnings`, `meta.skipped`, `meta.would_be_blocked`, serta `name` dan `detail` dari pemeriksaan `doctor`. Karakter format yang tak terlihat (zero-width space, word joiner, tag character) juga tampil sebagai `\uNNNN` di sana. Ini untuk tampilan: teksnya berubah, jadi bandingkan kode, bukan pesan.

```json
{
  "ok": false,
  "command": "exec",
  "data": {
    "command": "uptime",
    "results": [ { "host": "web1", "ok": false, "exit_code": 3, "stdout": "", "stderr": "…" } ],
    "summary": { "total": 1, "ok": 0, "failed": 1, "failed_hosts": ["web1"] }
  },
  "error": { "code": "FAILED", "message": "server web1 failed", "hint": "…" },
  "meta": { "contract": 2, "version": "…", "duration_ms": 211 }
}
```

| Field | Artinya |
|-------|---------|
| `ok` | `true` hanya bila semuanya berhasil |
| `command` | ID perintah: kata-katanya digabung dengan titik (`exec`, `db.query`, `fs.list`, `secret.show`). `komando audit --command` menerima ID yang sama |
| `data` | hasilnya. Perintah yang berjalan di banyak server memakai `data.results[]` (satu per server) dan `data.summary`. Setiap hasil menyebut servernya di `host` (`exec`, `facts`, `test`, `cp` ...) |
| `error` | `{code, message, hint}` bila `ok` bernilai false. `data` masih bisa ada saat server gagal (`PARTIAL_FAILURE`) |
| `error.suggestion` | untuk salah ketik: nama yang menurut komando dimaksudkan (perintah, server, flag). Hint-nya lalu berisi seluruh baris perintah dengan nama itu di tempatnya. Kata dari tool lain (`ps`, `kubectl`, `psql`) mendapat perintah komando yang mengerjakan tugas itu. Tidak ada bila tidak relevan |
| `error.hint` | selalu menyebut apa yang dicoba berikutnya. Kebanyakan kode punya hint sendiri; bila ada yang tidak punya, komando memasukkan hint umum untuk exit code-nya (misalnya, exit 7 menyarankan `--timeout` atau `komando job start`) |
| `null` | komando tidak bisa mencari tahu (misalnya `facts` tanpa hak untuk membaca sesuatu). Tidak pernah menggantikan `0` atau `false` |
| `meta` | `contract`, `version`, `duration_ms`; `dry_run` dan `would_be_blocked` pada dry run, `would_need` (setiap flag persetujuan yang dibutuhkan eksekusi sungguhan) dan `not_simulated` (langkah yang tidak bisa dicoba dry run tanpa benar-benar menjalankannya, seperti pernyataan DDL MySQL atau VACUUM milik sqlite); `skipped` bila target memilih hal yang tidak bisa dipakai perintah ini, dengan alasannya (juga saat perintah itu lalu gagal); `host_keys_pinned` bila perintah mempercayai host key SSH sebuah server untuk pertama kalinya (`host`, `address`, `key_type`, `fingerprint`), untuk dibandingkan oleh seseorang dengan milik server itu sendiri; `truncated` bila daftar berhenti di `--limit` dan masih ada lagi (`--limit 0` menampilkan semua) |

## Exit code

| Kode | Artinya | Contoh |
|------|---------|--------|
| 0 | berhasil | |
| 1 | kesalahan umum | `AUDIT_UNAVAILABLE` |
| 2 | perintah, flag, atau nilai salah | `USAGE`, `HIDDEN_VALUE`, `NEEDS_TERMINAL` |
| 3 | tidak ditemukan | `TARGET_NOT_FOUND`, `FILE_NOT_FOUND`, `TOOL_MISSING`, `SECRET_NOT_FOUND`, `SECRET_UNRESOLVED` |
| 4 | tidak bisa terhubung atau login, atau koneksi terputus | `AUTH_FAILED`, `NO_AUTH`, `HOSTKEY_MISMATCH`, `VPN_LOGIN_REQUIRED`, `CONNECTION_LOST` |
| 5 | perintah gagal di server | `FAILED`, `ROLLOUT_FAILED` |
| 6 | diblokir demi keamanan | `POLICY_BLOCKED`, `PROTECTED_TARGET`, `WRITE_REQUIRES_FLAG`, `DECLINED` |
| 7 | waktu habis | `TIMEOUT`, `CONNECT_TIMEOUT` (server tidak menjawab dalam `--connect-timeout`), `ROLLOUT_TIMEOUT` |
| 8 | prasyarat gagal atau ada yang menghalangi | `NO_MATCH` dan `AMBIGUOUS_MATCH` (teks `fs replace` tidak ditemukan atau tidak unik), `PORT_IN_USE`, `FILE_TOO_LARGE`, `KEY_EXISTS` |

Saat beberapa server gagal, exit code-nya adalah yang terburuk. Referensi lengkap yang bisa dibaca mesin adalah `komando schema`; `komando help exit-codes` dan `komando help output` mencetak versi singkatnya di terminal.

## Apa yang masih berjalan, dan di mana saya?

`komando status` mencantumkan VPN, login, tunnel, dan job yang masih berjalan (lihat [Melihat apa yang masih berjalan](commands.md#see-what-is-still-running)), dan baris yang dicetak komando sebelum `shell` dan perintah serupa ada di [Di mana saya?](commands.md#where-am-i-status-lines).

## Apakah script saya tetap berfungsi?

Setiap jawaban JSON punya `meta.contract`. Di dalam satu contract, komando hanya menambah field, kode kesalahan, dan exit code ke envelope JSON; komando tidak pernah mengganti nama atau menghapusnya. Nama perintah dan flag bukan bagian dari contract: komando sementara ini dipakai secara internal, jadi perintah atau flag yang diganti namanya tidak menyimpan nama lama, dan changelog mencantumkan setiap perubahan. Jika envelope suatu hari perlu berubah, `meta.contract` naik dan [changelog](../../CHANGELOG.md) menjelaskan apa yang berubah.

## Referensi: `komando schema`

```bash
komando schema exec                      # setiap flag exec, bisa dibaca mesin
komando schema secret.show               # sebuah perintah menurut ID-nya, seperti nama di JSON
komando schema                           # juga setiap exit code dan kode error
```

Setiap perintah di `komando schema` punya `kind` (`read`, `change`, atau `depends`) dan daftar `confirm` dari tabel aturan komando: lebih dulu tingkat yang selalu dimilikinya, lalu setiap tingkat yang hanya kadang dicapainya, dengan flag yang ditambahkan agen atau script dan kapan, misalnya `[{"tier":"change"},{"tier":"dangerous","flag":"--allow-dangerous","when":"with --remove-home"}]`. Tingkatnya adalah `read`, `change`, `dangerous` (`--allow-dangerous`), `safety` (`--yes`), dan `person` (tanpa flag: seseorang di terminal yang menjalankannya). Perubahan di server atau conn yang dilindungi juga butuh jawaban ya; targetnya yang menentukan, jadi tidak dicantumkan. Lihat [Apa yang butuh jawaban ya](safety.md#what-needs-a-yes).

Perintah add juga mencantumkan jenis yang diterimanya, di `add_kinds`, sehingga program bisa menyusun formulir add dari sana. `komando schema vpn add` memberi setiap jenis VPN `id`, `display_name`, `family` (`portal`, `config_file`, `server_psk`, `auth_key`, `system`, atau `proxy`), `aliases`, flag yang dibutuhkan (`required`, dan `one_of`: kelompok yang cukup satu flag-nya), flag yang boleh dipakai (`optional`), `flag_notes`, dan `opens_browser`: apakah `vpn up` membuka browser untuk login (`browser_note` menyebut kapan). `komando schema conn add` (dan `db add`, `cache add`, `queue add`, `storage add`, `cluster add`, `registry add` untuk jenisnya masing-masing) memberi setiap jenis conn `id`, `display_name`, `family`, `url_schemes`, `url_example`, `default_port`, dan daftar flag yang sama. Semuanya berasal dari tabel yang sama dengan `komando vpn add --help` dan `komando conn kinds`.

## Pemecahan masalah

Tabel di bawah berisi kesalahan yang paling sering ditemui. Setiap kode yang diberikan komando, dengan exit code-nya, contoh pesan, dan langkah berikutnya yang lazim, ada di [Kode kesalahan](error-codes.md), dan di `komando schema` pada `error_codes`:

```bash
komando schema -o json | python3 -c 'import json,sys; [print(c["code"], c["exit"], c.get("example","")) for c in json.load(sys.stdin)["data"]["error_codes"]]'
```

Untuk penghentian demi keamanan (exit 6): di terminal, komando bertanya dulu; agen AI atau script menambahkan `--yes` (atau `--allow-dangerous`) setelah seseorang setuju. Lihat [Keamanan](safety.md#when-you-are-at-the-terminal).

| Kesalahan | Biasanya berarti | Coba |
|-------|------------------|------|
| `AUTH_FAILED` | user, key, atau kata sandi salah; atau server meminta kode dua faktor dan tidak ada orang di terminal untuk menjawabnya (pesan mengutip pertanyaannya) | `komando host show NAME`; kata sandi yang berubah: `komando secret set NAME`; login dua faktor: `komando login NAME` sekali di terminal (komando menanyakan kodenya dan menyimpan login, 8 jam; agen AI meminta pengguna menjalankannya) |
| `NO_AUTH` | server tidak punya key, identity, atau kata sandi, ssh-agent tidak menyimpan key, dan tidak ada orang di terminal untuk mengetik kata sandi (pesan menyebut bila `~/.ssh/id_ed25519` terenkripsi dan belum dimuat) | `ssh-add` (atau `ssh-add ~/.ssh/id_ed25519`), atau simpan kata sandi: `komando secret set NAME`, lalu `komando host edit NAME --password-ref secret:NAME` (atau `--key KEY`); jalankan ssh-agent dulu bila `SSH_AUTH_SOCK` belum diatur |
| `KEY_PASSPHRASE_REQUIRED` | key server (`--key` atau `--identity`) terenkripsi, tidak punya passphrase di vault, dan ssh-agent tidak menyimpannya (komando memakai salinan milik agent, seperti `ssh`) | `ssh-add PATH`, atau simpan passphrase-nya: `komando secret set NAME`, `komando key add NAME PATH --passphrase-ref secret:NAME`, lalu `komando host edit HOST --key NAME --unset identity` (untuk key `--key`: `komando key edit NAME --passphrase-ref secret:NAME`) |
| `KEY_EXISTS` | `key gen`, `key add`, atau `key rename` ke nama key yang sudah dipakai | pilih nama lain, atau jalankan `komando key rm NAME` dulu |
| `CONNECTION_REFUSED`, `CONNECT_TIMEOUT`, `DNS_ERROR` | server mati, alamat atau port salah, firewall memutus koneksi, atau tidak ada yang mendengarkan di port itu | `komando host show NAME` untuk memeriksa alamat dan port; koneksi lambat: `--connect-timeout 30s`; server privat: tambahkan `--via BASTION` atau VPN |
| `HOSTKEY_MISMATCH` | server dibangun ulang, atau ada yang menyadap; pesan menampilkan fingerprint yang di-pin dan yang ditunjukkan server sekarang | bandingkan fingerprint baru dengan konsol server atau penyedia dulu, lalu `komando host trust NAME --reset` di terminal, atau `@group` untuk banyak sekaligus (hanya orang yang mengganti key; agen melaporkannya dan mendapat `NEEDS_PERSON`) |
| `HOSTKEY_UNKNOWN` | host key diberlakukan ketat dan key server ini belum di-pin; pesan menampilkan fingerprint-nya | bandingkan dengan yang dilihat pemilik server, lalu `komando host trust NAME` |
| `HOSTKEY_REVOKED` | server menunjukkan host key yang ada di daftar key yang dicabut milik komando | anggap server itu sudah disusupi dan beri tahu pemiliknya; tidak ada yang dikirim |
| `SECRET_UNRESOLVED` | kata sandi tersimpan atau variabel lingkungan tidak ada | `komando secret list` |
| `SECRET_IN_USE` | `secret rm` pada secret yang masih dipakai sesuatu | arahkan pemakainya ke tempat lain, atau ganti namanya dengan `komando secret rename OLD NEW` |
| `SECRET_EXISTS` | `secret rename` atau `secret cp` ke nama yang sudah dipakai; `vpn add` yang key-nya akan masuk ke secret yang sudah ada (`NAME-key`, `NAME-psk`, `NAME-config`) dan bukan milik VPN itu sendiri | pilih nama lain, atau tambahkan `--overwrite` (`secret rename`, `secret cp`); untuk `vpn add`, pilih nama VPN lain atau pindahkan secret-nya dengan `komando secret rename` |
| `SECRET_MISMATCH` | `secret check`: nilai yang dimasukkan bukan yang tersimpan | `data.difference` menjelaskan perbedaannya; `komando secret set NAME` menyimpan yang benar |
| `NAME_TAKEN` | nama baru (dari `host rename`, `rename --starts-with`, ...) sudah dipakai; untuk `rename`, pesan mencantumkan setiap bentrokan, dan tidak ada yang diganti namanya | pilih nama lain, atau ganti nama atau hapus yang menghalangi; `--dry-run` menampilkan seluruh daftar lebih dulu |
| `NOTHING_TO_RENAME` | `rename --starts-with`: tidak ada nama yang diawali LAMA | periksa ejaan dan huruf besar-kecil dengan `komando list` dan `komando secret list` |
| `GROUP_EXISTS` | `group rename` ke nama grup lain | pilih nama lain, atau gabungkan: `komando group add NEW @OLD`, lalu `komando group rm OLD` |
| `sudo: a password is required` | sudo butuh kata sandi | `komando secret set NAME`, lalu `komando host edit HOST --sudo-ref secret:NAME` |
| `VPN_LOGIN_REQUIRED` | VPN butuh login dari seseorang (MFA) | seseorang menjalankan `komando vpn up NAME` sekali |
| `AWS_LOGIN_REQUIRED` | login AWS SSO sudah kedaluwarsa | seseorang menjalankan `komando login aws --profile NAME` |
| `AZURE_LOGIN_REQUIRED` | tidak ada login Azure yang ditemukan (untuk Azure Container Registry) | atur service principal (`AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`), jalankan di Azure dengan managed identity, atau seseorang menjalankan `az login` |
| `GCP_LOGIN_REQUIRED` | login Google sudah habis (untuk Google Artifact Registry) | seseorang menjalankan `gcloud auth application-default login`, atau atur `GOOGLE_APPLICATION_CREDENTIALS` ke file key |
| `POLICY_BLOCKED` | perintah tampak merusak | periksa ulang; di terminal Anda mengetik nama apa yang akan hilang, script menambahkan `--allow-dangerous` |
| `PROTECTED_TARGET`, `PROTECTED_TARGET` | perubahan pada sesuatu yang ditandai dilindungi | di terminal, komando bertanya; script menambahkan `--yes` |
| `SAFETY_SETTING` | perubahan yang mematikan sebuah sabuk pengaman | di terminal, komando bertanya; script menambahkan `--yes` |
| `SECRET_DESTINATION` | agen AI meminta mengirim secret ke tempat baru (`{{secret:NAME}}`, `--env K=secret:NAME`, kata sandi di alamat baru) | beri tahu pengguna secret mana yang pergi ke mana; setelah mereka setuju, tambahkan `--yes` |
| `NEEDS_PERSON` | sesuatu yang hanya bisa dilakukan seseorang: mengetik kata sandi (`secret set`, `--ask-password`, server `--login ask`), login (`komando login`), membandingkan secret dengan `secret check`, mengatur kode persetujuan. Agen AI dan script mendapatkannya sama saja | minta pengguna menjalankan perintah di terminalnya sendiri; tidak ada flag yang membuat program bisa melakukannya |
| `DECLINED` | seseorang menjawab tidak pada pertanyaan komando | tidak ada yang diubah; jalankan lagi untuk ditanya lagi |
| `WRITE_REQUIRES_FLAG` | perintah database, cache, atau cluster yang mengubah data | `--write --dry-run`, lalu `--write` |
| `SENSITIVE_FILE` | agen AI mencoba menyalin file rahasia (`.env`, private key) ke sini | bacalah dengan `komando fs cat` (nilai disembunyikan); seseorang boleh mengizinkan `--reveal` |
| `HIDDEN_VALUE` | teks berisi `[hidden]` atau `[secret:NAME]` | ubah satu baris dengan `fs replace`; atur secret dengan `{{secret:NAME}}` |
| `NO_MATCHING_TARGETS` | target hanya memilih hal yang tidak bisa dipakai perintah ini | ikuti hint (misalnya, pakai `komando db` untuk database) |
| `TARGET_NOT_FOUND` | salah ketik pada nama server, conn, atau VPN, apa pun perintahnya | hint menyarankan yang paling mirip; `komando list` |
| `TARGET_EMPTY` | grup, tag, atau pola tidak memilih apa pun | `komando list GROUP` menunjukkan apa yang dipilihnya |
| `VAULT_LOCKED`, `VAULT_DECRYPT`, `VAULT_KEY` | vault tidak bisa dibuka: tidak ada passphrase, passphrase salah, atau key-nya hilang | lihat [Secret](secrets.md#troubleshooting); `komando doctor` menyebut yang mana |
| `IMPORT_INCOMPLETE` | impor membawa masuk sebagian besar tetapi menolak beberapa (lihat `skipped`) | perbaiki entri itu di file dan impor lagi |
| `PARTIAL_FAILURE` | perintah berjalan di beberapa server dan setidaknya satu gagal (dengan satu server, hasilnya kode server itu sendiri, seperti `CONNECTION_REFUSED`, atau `COMMAND_FAILED` bila perintahnya keluar dengan kode bukan nol) | baca `data.results` untuk exit code dan stderr tiap server |
| `USAGE` | perintah, flag, atau nilai salah; juga `komando` saja atau grup seperti `komando db` tanpa sub-perintahnya, saat lewat pipe | pesan menyebut apa yang salah, sering dengan "did you mean"; hint memberi contoh atau mencantumkan sub-perintahnya |
| `PORT_IN_USE` | port lokal sudah dipakai | pilih port lain, atau `0` untuk port yang bebas |
| `NEEDS_TERMINAL` | perintah interaktif (`shell`) dijalankan oleh program | agen memakai `exec`, `cluster exec`, atau `job` |
| `CONNECTION_LOST` | tautan putus saat perintah berjalan; perintah mungkin masih berjalan, atau sudah selesai | periksa dengan perintah read-only sebelum menjalankannya lagi; pakai `komando job start` di tautan yang tidak stabil ([detail](commands.md#when-the-connection-drops)) |
| `TIMEOUT` | perintah memakan waktu terlalu lama | `--timeout 30m`, atau `komando job start` untuk pekerjaan panjang |

`komando doctor` memeriksa pengaturan lokal, inventaris, dan keamanannya.

Dalam `-o json`, pemeriksaan doctor yang bisa diperbaiki oleh satu perintah komando punya `fix`: kata-kata yang dijalankan, sebagai daftar (`["komando", "conn", "edit", "db2", "--protected"]`). `detail` menyatakan hal yang sama dalam prosa. Program yang menawarkan perbaikan itu membaca `fix` dan tidak pernah mengambil perintah dari `detail`. Sebuah pemeriksaan punya `fix` hanya bila satu perintah memperbaikinya apa pun keadaan lainnya, dan perintah itu tidak menanyakan apa pun: pemeriksaan dengan beberapa jalan keluar, yang butuh nilai atau passphrase dari Anda, yang hanya bisa Anda nilai sendiri (dua conn yang tampak sama), atau nama yang bisa terbaca sebagai flag, tidak punya `fix`.
