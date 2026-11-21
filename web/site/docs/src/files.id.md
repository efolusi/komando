# File

Baca, edit, dan salin file di server Anda dengan aman.

## Membaca file

```bash
komando fs cat web1 /etc/nginx/nginx.conf --tail 50
```

Jika diketik tanpa argumen di terminal Anda, `komando fs cat` menanyakan server (dari daftar Anda), lalu filenya.

```bash
komando fs cat web1 /var/log/syslog --head 20 --line-numbers
komando fs cat web1 /var/log/auth.log --sudo          # file yang hanya bisa dibaca root
komando fs cat web1 '~/app/.env'
```

`~` di sebuah path adalah folder home user yang dipakai login, seperti pada `scp`. Beri tanda kutip (`'~/app/.env'`) agar shell Anda sendiri tidak meng-expand-nya.

`fs cat` menampilkan teks. Di `-o text`, file biner ditolak, sehingga `fs cat ... > file` tidak pernah menulis salinan yang rusak; simpan dengan `komando download` sebagai gantinya. File yang lebih panjang dari `--max-bytes` (1 MiB) dipotong: output menyatakannya, dan hash-nya adalah `sha256_read` (dari bagian yang dibaca), bukan `sha256`. `--tail` saja membaca akhir file, jadi baris terakhir adalah baris terakhir file yang sebenarnya; untuk file sepanjang itu `--line-numbers` tidak bisa mengetahui nomornya dan menghilangkannya (`note` menyatakannya).

Untuk agen AI, `fs cat` menyamarkan seluruh file lebih dulu lalu mengambil `--head`/`--tail`, sehingga pemotongan tidak pernah membuka sebagian secret. Private key yang disembunyikan tampil sebagai satu baris, dan `lines` serta nomor baris lalu menghitung file seperti yang ditampilkan (output punya `note`). Saat ada yang disembunyikan, hash dihilangkan: hash akan membiarkan nilai yang lemah ditebak dari sisa file.

## Mencantumkan folder

```bash
komando fs list web1 /var/www
```

```text
MODE        SIZE    MODIFIED          NAME
drwxr-xr-x  -       2026-11-12 09:14  assets/
-rw-r--r--  4.2 KB  2026-11-12 09:14  index.html
```

```bash
komando fs list web1 -a                       # tanpa PATH: folder home Anda; -a menampilkan dotfile
komando fs list web1 /srv -r --limit 200      # telusuri folder (sampai 1000 entri secara default)
komando fs stat web1 /etc/hosts --sha256      # exists:false sebagai ganti error bila tidak ada
```

## Mengedit file

`fs replace` adalah cara paling aman untuk mengubah file konfigurasi. Perintah ini mengubah file hanya bila teks lama ditemukan tepat satu kali, dan `--backup` menyimpan versi sebelumnya sebagai `PATH.bak`:

```bash
komando fs replace web1 /etc/nginx/nginx.conf \
  --old 'worker_connections 768;' --new 'worker_connections 4096;' --sudo --backup
```

```text
replaced 1 match(es) in /etc/nginx/nginx.conf
backup: /etc/nginx/nginx.conf.bak
Changed /etc/nginx/nginx.conf on web1. To undo: komando fs restore web1 /etc/nginx/nginx.conf --sudo
```

Jika diketik tanpa argumen, `komando fs replace` menanyakan server, file, teks yang diubah, dan menjadi apa.

```bash
komando fs replace web1 /etc/ssh/sshd_config --regex \
  --old '(?m)^#?PasswordAuthentication .*$' --new 'PasswordAuthentication no' --sudo
```

`--all` mengganti setiap kecocokan. `--regex` memperlakukan `--old` sebagai regular expression Go; `$1` di `--new` menyisipkan sebuah group.

Pada sebuah grup, `fs replace` membuat edit yang sama di setiap server (`komando fs replace @web ... --dry-run` lebih dulu menampilkan diff tiap server), dan `fs restore @web PATH` mengembalikan backup terbaru milik tiap server. Setiap server punya hasilnya sendiri; server yang `--old`-nya tidak ditemukan gagal sendiri (`NO_MATCH`) sementara yang lain diubah. `fs write` mengubah file satu server; untuk menaruh satu file di banyak server pakai `komando upload`.

### Menulis seluruh file

`fs write` menulis seluruh file. File baru ditulis di samping yang lama lalu dipindahkan ke tempatnya, sehingga server tidak pernah melihat setengah file:

```bash
komando fs write web1 /etc/app/.env --from ./app.env --sudo --mode 0640 --if-changed
komando fs write web1 /etc/app/env --content 'PORT=8080' --sudo --backup
komando fs write web1 '~/notes.txt' --content 'checked' --append
```

Isinya datang dari `--content`, `--from FILE`, atau stdin (`--from -`). `--if-changed` melewati penulisan bila isinya sudah sama. Flag yang dipakai bersama kedua perintah ada di [Referensi](#reference).

Secara default, path yang berupa symbolic link (misalnya `sites-enabled/app` yang menunjuk ke `sites-available/app`) diikuti: file yang ditunjuknya yang ditulis, mode dan pemiliknya dipertahankan, dan link tetap menjadi link. Hasilnya menampilkan `followed:`. `--no-follow` menolak menulis lewat link.

### Memeriksa sebelum berlaku

`--dry-run` menampilkan perubahan sebagai diff. `--validate` memeriksa file baru sebelum dipasang; `%s` adalah path-nya. Bila pemeriksaan gagal, file lama tetap seperti semula (`VALIDATION_FAILED`), sehingga salah ketik tidak bisa mengunci Anda di luar:

```bash
komando fs write web1 /etc/sudoers.d/deploy --from ./deploy.sudoers --sudo --validate 'visudo -cf %s'
komando fs replace web1 /etc/ssh/sshd_config --old 'PermitRootLogin yes' --new 'PermitRootLogin no' --sudo --validate 'sshd -t -f %s'
```

### Secret di dalam file

Untuk agen AI, `fs replace` bekerja pada file seperti yang dilihat agen, dengan `[hidden]` sebagai ganti setiap secret. `--old 'DB_PASSWORD=[hidden]'` cocok dengan barisnya apa pun nilainya. Kecocokan yang memotong ke dalam nilai tersembunyi, atau `$1` yang akan menyalin satu nilai, ditolak (`HIDDEN_VALUE`), dan apakah `--old` cocok tidak pernah bergantung pada nilai tersembunyi. Edit yang akan membuka nilai tersembunyi juga ditolak (`HIDDEN_VALUE`): mengganti `DB_PASSWORD=` menjadi nama yang tidak tampak rahasia, atau memotong `postgres://` atau `Bearer `, sementara nilainya tetap. Apakah `--new` kebetulan sama dengan nilai tersembunyi tidak pernah terlihat: edit seperti itu dihitung sebagai perubahan (file ditulis lagi), dan tidak ada hash file yang dilaporkan. `fs write --if-changed` dan `would_change`-nya melakukan hal yang sama untuk file dengan nilai tersembunyi. Penyamaran tetap upaya terbaik.

`{{secret:NAME}}` di `--new` atau di teks yang ditulis `fs write` menjadi nilai vault di server. Saat agen AI memintanya, komando berhenti dengan `SECRET_DESTINATION` sampai seseorang mengizinkan: agen menambahkan `--yes` dan jendela menyebut secret serta server dan file tujuannya. `--dry-run` agen tidak membaca secret apa pun dan menampilkan `{{secret:NAME}}` apa adanya.

## Membatalkan perubahan

`fs replace` dan `fs write` dengan `--backup` menyimpan versi sebelumnya di samping file dan menyebutnya di hasil (`backup`). Di terminal keduanya juga mencetak perintah pembatalan (lihat contoh di atas).

`fs restore` mengembalikan backup terbaru. Tambahkan `--dry-run` dulu untuk melihat perubahannya. File yang sekarang menjadi backup baru, sehingga restore juga bisa dibatalkan. `--copy PATH` memilih backup yang lebih lama.

```bash
komando fs restore web1 /etc/nginx/nginx.conf --sudo --dry-run
komando fs restore web1 /etc/nginx/nginx.conf --sudo
komando svc reload web1 nginx                 # bila sebuah service membaca file itu
```

Di server Windows `fs restore` belum berfungsi: salin backup kembali dengan `komando exec win1 -- Copy-Item ...` ([Server Windows](windows.md)).

Tanpa `--backup` tidak ada salinan: `komando audit` menyatakan apa yang berubah, kapan, dan di mana (`komando audit --target web1 --since 2h`), sehingga Anda bisa mengembalikannya secara manual. Untuk perubahan database, pulihkan dari dump (`db dump` sebelum perubahan, `db restore` untuk kembali); untuk deployment Kubernetes, `cluster rollback`.

## Memindahkan, menghapus, dan mengubah file

```bash
komando fs mkdir web1 /srv/app/releases                 # selalu membuat induk, seperti mkdir -p
komando fs mv web1 /srv/app/new.conf /srv/app/app.conf
komando fs chmod web1 0640 /etc/app/.env
komando fs rm web1 /tmp/old.tar.gz --dry-run
komando fs rm web1 /tmp/old.tar.gz
```

Perintah-perintah ini berperilaku seperti perintah yang Anda kenal, dengan perbedaan keamanan berikut:

- `fs mv` tidak pernah menggantikan file yang sudah ada (`FILE_EXISTS`, exit 8) kecuali Anda menambahkan `--overwrite`. Memindahkan ke folder yang sudah ada menaruh file di dalamnya.
- `fs rm` menghapus untuk selamanya. Di terminal Anda komando meminta Anda mengetik path (beberapa path: jumlahnya); agen AI atau script menambahkan `--allow-dangerous` setelah seseorang setuju (kalau tidak, `POLICY_BLOCKED`; `--dry-run` menampilkan apa yang akan hilang). Lihat [Keamanan](safety.md). Pada path yang tidak ada, perintah menyatakan `not found` dan tetap berhasil, seperti `rm -f`.
- Folder butuh `--recursive` juga, dengan pertanyaan yang sama (dan `--allow-dangerous` yang sama untuk agen atau script).
- Path diambil secara harfiah: `'/tmp/*.log'` bukan pola. Pakai `komando exec` untuk itu.
- Semuanya menerima `--sudo`; `fs chmod -r` mengubah seluruh folder. `fs chmod --sudo` tidak mengikuti link yang dibuat user server lain (`IS_A_SYMLINK`).

## Menyalin file

`upload` mengirim file ke server (banyak sekaligus). `download` membawanya ke komputer ini. Keduanya juga berfungsi dengan conn [storage](storage.md).

```bash
komando upload @web ./release.tar.gz /tmp/release.tar.gz      # ke banyak server sekaligus
komando download web1 /var/log/nginx/error.log --to ./logs/
```

Jika diketik tanpa argumen, `komando upload` menanyakan ke mana (server atau storage file), file atau folder mana di komputer ini, dan ke mana tujuannya.

```bash
komando upload web1 ./nginx.conf /etc/nginx/nginx.conf --sudo  # file milik root
komando upload web1 ./run.sh /opt/app/bin/run.sh --mode 0755 -p
komando upload web1 ./site /var/www/site -r                    # sebuah folder
komando download web1 /var/log/secure --sudo --to ./logs/      # file yang hanya bisa dibaca root
komando download @web /etc/nginx/nginx.conf --to ./configs/    # → ./configs/<server>/nginx.conf
```

Tanpa tujuan, `upload` menaruh file di folder home user yang dipakai login dengan namanya sendiri, dan `download` menyimpan ke folder saat ini.

Unggahan menimpa file yang ada mempertahankan mode file itu (`.env` 0600 tetap 0600); file baru mendapat mode file lokal. `--mode` mengaturnya.

`komando cp` adalah `upload` atau `download` yang ditulis `SRC DST`, seperti `scp`: kode, flag, dan hasil yang sama. Path jarak jauh ditulis `TARGET:PATH`; `TARGET:` saja, atau `TARGET:~/x`, adalah folder home user yang dipakai login. Conn storage juga berfungsi (`backups:2026/db.sql.gz`):

```bash
komando cp ./app.tar.gz @web:/tmp/app.tar.gz
komando cp -r ./site web1:/var/www/site
komando cp web1:/var/log/nginx/error.log ./logs/
```

TARGET bisa berupa [target](targets.md) apa pun (`tag:edge:/srv/site`, `label:env=prod:/tmp/x`), server yang belum Anda tambahkan beserta portnya (`root@10.0.0.5:2222:/tmp/x`), atau alamat IPv6 dalam kurung siku (`[2001:db8::1]:/tmp/x`).

File lokal yang namanya punya titik dua (`a:b.txt`) dibaca sebagai lokal bila ada; kalau tidak tulis `./a:b.txt`. Penyalinan satu file melaporkan `sha256` sehingga Anda bisa memeriksanya.

### Mengalirkan file lewat stdout atau stdin

`--to -` mengalirkan satu file ke stdout, dan `-` sebagai file yang diunggah membacanya dari stdin. Tidak ada yang disimpan di komputer ini sepanjang jalan, sehingga aplikasi (atau ponsel lewat [ssh-gate](safety.md)) bisa membaca dan menulis file dengannya. SSH key ssh-gate dihitung sebagai agen AI, jadi alirannya mempertahankan aturan di bawah untuk agen: file di atas 16 MiB ditolak, dan file teks tiba dengan nilai secret sebagai `[hidden]` (salinan seperti itu tidak bisa diunggah kembali). `--progress` tidak cocok dengan `--to -`.

```bash
komando download web1 /etc/nginx/nginx.conf --to - > nginx.conf
komando download backups reports/q3.pdf --to - | open -f
komando cp web1:/var/log/app.log - | grep ERROR
komando upload web1 - /etc/app/motd < motd.txt
komando upload backups - photos/2026/a.jpg --size 2483117 < a.jpg
pg_dump app | komando storage upload backups - dumps/app.sql
```

- **stdout milik file.** Dengan `--to -`, stdout membawa byte file apa adanya, biner juga, dan tidak ada yang lain, apa pun kata `-o`. Jawaban komando sendiri menuju stderr: dengan `-o json` satu envelope di akhir, hasil atau error, dan exit code menyatakan yang mana. Hasilnya adalah `{"host": "web1", "path": "/etc/nginx/nginx.conf", "to": "stdout", "bytes": 1234, "sha256": "…"}` (`conn` dan `key` untuk storage). Di mode teks tidak ada yang dinyatakan bila berhasil.
- Bila aliran terputus, byte yang sudah ada di stdout tetap di sana: exit code bukan 0 dan envelope di stderr menyatakan alasannya. Bandingkan `bytes` dan `sha256` bila Anda perlu yakin.
- **Unggahan dari stdin** menuju satu server atau conn, ke DEST, yang harus menyebut file-nya (stdin tidak punya nama). Di server, isinya menuju file sementara yang dipindahkan ke tempatnya hanya di akhir; object store menyelesaikan unggahan hanya di akhir aliran. Hasilnya punya `"file": "-"`, `bytes`, dan `sha256`.
- `--size N` menyatakan berapa byte yang dikirim stdin. Aliran yang berakhir lebih awal, atau mengirim lebih banyak, berhenti dengan `SIZE_CONFLICT` (exit 8) dan tidak mengganti apa pun. Tanpanya, apa pun yang tiba sampai stdin menutup adalah filenya: berikan `--size` setiap kali pengirim bisa terputus.
- Isi yang memuat nilai yang disembunyikan komando (`[hidden]`, `[secret:NAME]`) ditolak (`HIDDEN_VALUE`): salinan yang disamarkan akan merusak nilai sebenarnya.
- `--continue`, `-r`, dan beberapa server tidak cocok dengan `-` (`USAGE`). Aliran dari server dibaca sebagai user SSH; baca file yang hanya bisa dibaca root dengan `fs cat --sudo`. Unggahan dari stdin menerima `--sudo`, `-p`, dan `--mode` seperti unggahan mana pun.
- `--dry-run` menyatakan apa yang akan terjadi dan tidak membaca apa pun, dari stdin atau dari server; ia menjawab di stdout, seperti setiap dry run.
- Untuk agen AI, aliran mempertahankan apa yang dipertahankan unduhan ke file, sebelum satu byte pun ditulis: teks dengan nilai secret sebagai `[hidden]` (hasilnya menyatakan `masked`, tanpa `sha256`), file biner yang memuat nilai vault, secret, atau data pribadi yang disembunyikan komando ditolak (`SENSITIVE_FILE`), dan apa pun di atas 16 MiB ditolak (`FILE_TOO_LARGE`), karena byte di stdout tidak bisa ditarik kembali.

### Menyalin antara dua server atau conn

Dengan `TARGET:PATH` di kedua sisi, `cp` menyalin dari satu server atau conn [storage](storage.md) ke yang lain: server ke server, storage ke storage, atau satu masing-masing.

```bash
komando cp web1:/var/backups/db.sql.gz web2:/var/backups/
komando cp -r web1:/var/www/site backups:sites/
komando cp backups:2026/db.sql.gz dr-backups:2026/
```

- Data mengalir lewat komputer Anda, dari sumber langsung ke tujuan, dan tidak pernah disimpan di disknya. Server tidak perlu saling menjangkau.
- Setiap sisi adalah satu server atau satu conn (tanpa `@group`).
- File di tujuan digantikan, seperti unggahan menggantikannya (`replaced: true`); file baru di server mendapat mode sumber. `-p` dan `--mode` berfungsi seperti untuk unggahan ke server.
- Satu file melaporkan `sha256`-nya; hasilnya juga menyebut `source`. Folder (`-r`) mengikuti aturan di bawah.
- Tujuan yang dilindungi bertanya sekali, seperti unggahan ke sana. Audit log punya satu record untuk seluruh salinan: sumber, tujuan, ukuran, dan `sha256`.
- Agen AI menyalin file yang merupakan secret menurut namanya (`.env`, private key) hanya setelah pengguna mengizinkan (`--reveal`), seperti untuk unduhan.
- `--progress` menulis baris yang sama dengan unggahan.

### Melanjutkan salinan yang terputus (--continue)

`--continue` pada `upload`, `download`, atau `cp` (juga antara dua tempat jarak jauh) melanjutkan satu file besar dari tempat salinan sebelumnya berhenti:

```bash
komando download web1 /var/backups/db.sql.gz --continue
komando upload web1 ./db.sql.gz /var/backups/db.sql.gz --continue
komando cp web1:/var/backups/db.sql.gz web2:/var/backups/ --continue
```

- Saat tujuan memiliki sebagian file, komando memeriksa bagian itu terhadap bagian yang sama dari sumber (sha256), hanya mengirim sisanya, lalu memeriksa seluruh file terhadap sumber. Hasilnya menyatakan berapa banyak yang sudah ada (`continued_from_bytes`) dan `sha256` file.
- Dengan `--continue`, file ditulis di tempat, bukan dengan nama sementara, sehingga salinan yang berhenti lagi bisa dilanjutkan lagi. Perintah tidak pernah menulis lewat symbolic link (`USAGE`): sebut file-nya sendiri.
- Tujuan yang lebih panjang dari sumber, atau berbeda darinya, berhenti dengan `RESUME_CONFLICT` (exit 8) dan tidak disentuh. Salin lagi tanpa `--continue` (unduhan butuh `--overwrite` untuk menggantikannya).
- File utuh hanya diperiksa; tidak ada yang dikirim.
- Server menghitung jumlahnya sendiri (`sha256sum` atau `shasum`), jadi bagian yang sudah disalin tidak berjalan lagi. Pada akun yang hanya SFTP, atau dari storage, komando membaca bagian itu sekali lagi untuk memeriksanya.
- S3, Google Cloud Storage, Azure Blob, dan WebDAV menyimpan file secara utuh dan tidak bisa menambah ke satu file: `RESUME_UNSUPPORTED` (exit 2). Conn storage SFTP, FTP, FTPS, dan SMB bisa.
- `--continue` menerima satu file, tidak pernah `-r` (pakai `sync`, yang hanya mengirim apa yang kurang), `--sudo`, atau `--overwrite`, dan butuh server Linux atau Unix lain.
- Agen AI mendapat file teks sampai 16 MiB dengan nilai secret ditampilkan sebagai `[hidden]`, yang tidak bisa dilanjutkan (`RESUME_UNSUPPORTED`). File yang lebih besar yang memuat nilai dari vault komando berhenti dengan `SENSITIVE_FILE`, dan bagian yang ditambahkan eksekusi itu dihapus lagi.

### Menyalin folder

Folder (`-r`) mengikuti satu aturan, sehingga menjalankan salinan yang sama dua kali memberi hasil yang sama:

| Perintah | Hasil |
|---|---|
| `cp -r site web1:/var/www/site` | `/var/www/site` adalah salinannya; jalankan lagi dan diperbarui di tempat (tidak pernah `site/site`) |
| `cp -r site/ web1:/var/www/html` | *isi* `site` masuk ke `html` |
| `cp -r site web1:/var/www/html` (html sudah ada) | `/var/www/html/site` |

`upload` ke conn [storage](storage.md) mengikuti aturan yang sama: tanpa tujuan, `upload backups ./site -r` menaruh folder di bawah `site/`, dan tujuan yang diakhiri `/` dihitung sebagai folder yang sudah ada.

Folder yang diberikan sebagai symbolic link (`./current -> releases/42`) disalin sebagai folder yang disebutnya, seperti `scp -r`. Symbolic link di dalam folder tidak disalin; dicantumkan sebagai `skipped`. Bila sebagian file di dalam folder tidak bisa dibaca, sisanya tetap disalin; hasilnya mencantumkan kegagalan di `errors` dan komando keluar dengan 5.

### Apa yang digantikan sebuah salinan

- Unduhan tidak pernah menggantikan file yang sudah ada di komputer Anda. Satu file berhenti dengan `FILE_EXISTS` (exit 8); folder (`-r`), dari server atau dari storage, mempertahankan file itu, menyalin sisanya, dan menyatakan berapa banyak yang dipertahankan (`kept`). Tambahkan `--overwrite` bila Anda memang bermaksud menggantikannya.
- Unggahan menggantikan file di server dan menyatakannya (`replaced: true`).
- Setiap file, kedua arah, ditulis dengan nama sementara dulu dan dipindahkan ke tempatnya saat lengkap, sehingga koneksi yang putus tidak pernah meninggalkan setengah file (kecuali dengan `--continue`, di atas, yang sengaja menulis di tempat). (Memindahkan file baru ke tempatnya di server menjadikan user SSH sebagai pemiliknya; pakai `--sudo` untuk satu file yang pemiliknya harus tetap.)

### File besar dan Ctrl-C

- Di terminal, file 8 MiB atau lebih yang menuju atau dari satu server menampilkan progresnya di stderr (`app.tar.gz: 120.0 of 512.0 MB`). Tidak ada yang ditampilkan bila stderr bukan terminal, atau untuk agen AI; stdout tidak pernah mendapatkannya.
- Program yang menggambar progress bar sendiri (aplikasi, script, agen AI) menambahkan `--progress` ke `upload`, `download`, `cp`, `sync`, atau `storage upload/download` dengan `-o json`. Output error (stderr) lalu mendapat satu objek JSON per baris, paling banyak sekitar empat per detik, dan satu terakhir saat perintah berakhir; hasil di stdout tetap seperti semula. Totalnya `null` selama komando belum bisa mengetahuinya (folder dari server dibaca saat disalin). Baris di stderr yang bukan JSON (peringatan) bukan progress: lewati. Tanpa `-o json`, `--progress` tidak mengubah apa pun.

  ```
  {"event":"progress","file":"site/index.html","bytes_done":1048576,"bytes_total":4194304,"files_done":3,"files_total":12}
  {"event":"done","file":"site/app.js","bytes_done":4194304,"bytes_total":4194304,"files_done":12,"files_total":12,"ok":true}
  ```

  `file` adalah file yang sedang disalin (di dalam folder, path-nya di folder itu); hitungan mencakup setiap server dalam eksekusi. Baris hanya memuat nama dan hitungan, tidak pernah isi file.
- Ctrl-C menghentikan salinan, atau sync, dalam sekejap. File yang sedang disalin tidak ditinggalkan, file yang sudah disalin tetap, dan komando keluar dengan 1 dan `CANCELLED`. Jalankan perintah yang sama lagi untuk menyelesaikan: `sync` hanya mengirim apa yang masih kurang. Menutup terminal menghentikannya dengan cara yang sama. Ctrl-C kedua mengakhiri komando seketika, dan tetap menghapus file yang setengah tersalin (dan file sementara lain atau profil browser login yang dibuat eksekusi ini).
- Untuk salinan yang mungkin memakan waktu lebih dari beberapa menit, atau lewat tautan yang tidak stabil, jalankan di server sebagai job: `komando job start`.

## Menjaga folder tetap sinkron (sync)

`sync` menyalin folder satu arah dan hanya mengirim apa yang baru atau berubah, jadi eksekusi kedua cepat. Satu sisi adalah folder di komputer ini. Sisi lain adalah server (banyak sekaligus) atau conn [storage](storage.md):

```bash
komando sync ./site @web:/var/www/site --exclude .git --dry-run   # setiap file yang akan disentuh
komando sync ./site @web:/var/www/site --exclude .git
komando sync ./site web1:/var/www/site --delete --dry-run          # juga hapus apa yang tidak lagi dimiliki ./site
komando sync web1:/var/log/app ./logs/web1                         # dari server ke sini
komando sync ./backups backups:2026/ --exclude '*.tmp'             # ke conn storage
komando sync backups:2026/ ./restore                               # dari storage ke sini
```

- File dihitung berubah bila ukuran atau modenya berbeda, atau bila lebih baru di sumber. Mode dan waktu modifikasi juga disalin.
- Setiap file ditulis dengan nama sementara dan dipindahkan ke tempatnya.
- Folder tujuan yang belum ada dibuat (`--dry-run` menyatakannya).
- `--exclude` melewati nama atau path (shell glob, bisa diulang).
- `--delete` menghapus file untuk selamanya: di terminal Anda komando meminta Anda mengetik tujuannya (`web1:/var/www/site`); agen AI atau script menambahkan `--allow-dangerous` setelah seseorang setuju.
- Sumber yang tidak ada adalah error (`PATH_NOT_FOUND`, exit 3), dan `--delete` tidak pernah berjalan dari sumber kosong, jadi salah ketik tidak bisa mengosongkan tujuan.
- `--delete` juga berhenti sebelum mengosongkan folder yang dicantumkan sumber sebagai kosong sementara tujuan masih punya file di dalamnya (`EMPTY_FOLDER_CONFIRM_REQUIRED`, exit 6): daftar yang terpotong, misalnya oleh koneksi FTP yang putus, tampak persis seperti itu. Error mencantumkan setiap folder dan berapa banyak file yang akan hilang (`error.details.folders` di JSON).
  - Di terminal Anda, komando meminta Anda mengetik folder itu.
  - Agen AI menambahkan `--allow-dangerous` setelah seseorang setuju; komando lalu menyebut folder itu di jendelanya.
  - Script menyebut setiap folder yang dikosongkannya dengan sengaja: `--emptied old-assets` (bisa diulang). `--allow-dangerous` saja tidak cukup di sini: eksekusi tanpa pengawas adalah yang akan kehilangan file tanpa ada yang melihat. Nama folder yang tidak cocok dengan apa pun adalah error.
  - Cara lain: hapus folder di tujuan lebih dulu (`komando fs rm web1 /var/www/site/old-assets --recursive`, atau `komando storage rm CONN --prefix old-assets/`), lalu sync.
- Symbolic link di dalam folder tidak disalin; dicantumkan sebagai `skipped`. Folder sumber yang diberikan sebagai link di-sync sebagai folder yang disebutnya.
- Ctrl-C menghentikannya dalam sekejap; file yang sudah disalin tetap, dan eksekusi berikutnya mengirim sisanya.
- `--sudo` menulis di server sebagai root, untuk folder yang tidak bisa ditulis user SSH (`komando sync ./conf.d web1:/etc/nginx/conf.d --sudo`): setiap file masuk seperti `upload --sudo` menaruhnya, ditahan di `/tmp` milik user SSH (hanya mereka yang bisa membacanya), diperiksa oleh root dan dipasang dengan mode file sumber, mempertahankan pemilik file yang sudah ada. Folder yang bisa diubah user lain menghentikannya (`SHARED_FOLDER_CONFLICT`). Folder harus bisa dibaca user SSH, dan `--sudo` untuk folder yang menuju server (untuk membaca file yang hanya bisa dibaca root, pakai `download --sudo`).

Untuk satu file, pakai `komando upload` atau `komando download`.

## Batasan

- `fs write` bekerja pada satu server per eksekusi; target yang memilih beberapa berhenti dengan error (pakai `komando upload` untuk banyak).
- `fs cat` membaca paling banyak `--max-bytes` (1 MiB secara default) dan menolak file biner di `-o text`.
- `fs list` menampilkan sampai 1000 entri kecuali `--limit` menyatakan lain.
- `fs rm` dan `fs chmod` menerima path secara harfiah: tanpa pola.
- `--sudo` pada salinan hanya berfungsi untuk satu file (unduhan sampai 512 MiB). Untuk folder milik root, unggah ke tempat yang Anda miliki dan pindahkan dengan `komando exec web1 --sudo -- cp -r /tmp/site/. /var/www/site/`.
- `sync` tidak punya `--sudo`: hanya menulis di tempat user yang dipakai login boleh menulis.
- Symbolic link di dalam folder tidak disalin oleh `cp -r`, `upload -r`, `download -r`, atau `sync`.
- Penulisan `--sudo` ditolak ke folder yang bisa diubah user server lain (menurut pemilik, grup, mode, atau access list: `SHARED_FOLDER_CONFLICT`); tulis file seperti itu sebagai user tersebut.
- Backup tetap di samping file dan bertambah, satu per edit.
- Di server Windows, `fs restore`, `fs replace`, `fs rm`, `mkdir`, `mv`, `chmod`, `sync`, dan salinan folder belum berfungsi ([Server Windows](windows.md)).
- Penyamaran secret untuk agen AI adalah upaya terbaik.

## Pemecahan masalah

| Kode error | Artinya | Yang perlu dilakukan |
|------------|---------|----------------------|
| `NO_MATCH` | `fs replace` tidak menemukan teks `--old` | baca file dengan `komando fs cat` dan salin teks persisnya (spasi berpengaruh) |
| `VALIDATION_FAILED` | `--validate` menolak file baru; file tidak diubah | perbaiki isinya dan jalankan lagi |
| `HIDDEN_VALUE` | edit akan memotong ke dalam, menyalin, atau membuka nilai yang disembunyikan komando dari agen AI | cocokkan seluruh `NAME=[hidden]`, atau tulis `{{secret:NAME}}` |
| `SECRET_DESTINATION` | agen AI meminta menulis nilai vault ke sebuah file | seseorang mengizinkannya di jendela komando |
| `FOLDER_NOT_FOUND` | folder untuk file baru tidak ada | tambahkan `-p` (`--parents`) |
| `FILE_EXISTS` | `fs mv` atau unduhan akan menggantikan file | tambahkan `--overwrite` bila Anda memang bermaksud begitu |
| `PATH_NOT_FOUND` | sumber salinan atau sync tidak ada | periksa path-nya |
| `PERMISSION_DENIED` | user yang dipakai login tidak boleh membaca atau menulis file | tambahkan `--sudo` |
| `SHARED_FOLDER_CONFLICT` | `--sudo` ke folder yang bisa diubah user server lain | tulis file sebagai user itu, tanpa `--sudo` |
| `CHMOD_FAILED` | server SFTP tidak mengizinkan pengaturan mode, dan file barunya lebih terbuka daripada yang diminta | tulis tanpa `--mode`, atau di server yang mengizinkannya |
| `POLICY_BLOCKED` | `fs rm`, `rm -r`, atau `sync --delete` dari agen AI atau script tanpa `--allow-dangerous` | periksa dengan `--dry-run`, tanyakan kepada seseorang, lalu tambahkan `--allow-dangerous` |
| `EMPTY_FOLDER_CONFIRM_REQUIRED` | `sync --delete` akan mengosongkan folder yang dicantumkan sumber sebagai kosong | periksa sumbernya; script menambahkan `--emptied FOLDER`, agen AI bertanya kepada seseorang dan menambahkan `--allow-dangerous` |
| `CANCELLED` | Ctrl-C menghentikan salinan atau sync | jalankan perintah yang sama lagi untuk menyelesaikan |
| `SIZE_CONFLICT` | unggahan dari stdin mengirim jumlah byte yang lain dari `--size` | kirim seluruh file lagi; tidak ada yang diganti |
| `RESUME_CONFLICT` | `--continue` menemukan tujuan yang lebih panjang dari sumber, atau yang berbeda darinya, sebelum salinan atau lewat jumlahnya sesudahnya | salin lagi tanpa `--continue` |
| `FILE_CHANGED` | file berubah saat `--continue` menyalinnya | jalankan perintah yang sama lagi |
| `RESUME_UNSUPPORTED` | `--continue` ke S3, Google Cloud Storage, Azure Blob, atau WebDAV, yang tidak bisa menambah ke file | salin lagi tanpa `--continue` |

## Referensi

Flag yang dipakai bersama `fs write` dan `fs replace`:

| Flag | Fungsinya |
|------|-----------|
| `-s`, `--sudo` | Menulis file milik root (menulis file sementara, lalu `sudo install`). Tidak ke folder yang bisa diubah user server lain (menurut pemilik, grup, mode, atau access list): itu berhenti dengan `SHARED_FOLDER_CONFLICT`; tulis file seperti itu sebagai user tersebut. |
| `--backup` | Menyimpan versi sebelumnya sebagai `PATH.bak`. Backup tidak pernah ditimpa: bila `PATH.bak` sudah ada, yang baru adalah `PATH.bak.<waktu UTC>` (misalnya `nginx.conf.bak.20261105T031500Z`). `backup` di hasil menyebut filenya. Dengan `--sudo`, backup milik root, mode 0600. Backup tetap di samping file dan bertambah, satu per edit: hapus yang lama dengan `fs rm`, dan jauhkan dari folder yang setiap file-nya dimuat (`sites-enabled/`, `conf.d/*.conf`). |
| `--mode 0640` | Mode file (default: pertahankan mode lama, atau 0644 untuk file baru). Server SFTP yang tidak mengizinkan pengaturan mode (storage box, akun yang hanya SFTP) tidak masalah bila file barunya tidak lebih terbuka dari yang diminta: `mode` di hasil adalah yang didapat file. Kalau tidak, penulisan gagal dengan `CHMOD_FAILED`. |
| `--owner USER:GROUP` | Pemilik file (butuh `--sudo`; grup opsional). |
| `-p`, `--parents` | Membuat folder induk yang hilang; tanpanya, folder yang hilang adalah `FOLDER_NOT_FOUND`. |
| `--no-follow` | Menolak menulis lewat symbolic link. |
| `--validate 'CMD %s'` | Memeriksa file baru sebelum dipasang. |
