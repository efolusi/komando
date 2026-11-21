# Database

Query, periksa, backup, dan pulihkan database PostgreSQL, MySQL/MariaDB, SQL Server, Oracle, ClickHouse, Snowflake, BigQuery, SQLite, dan MongoDB dengan aman.

## Menambah database

```bash
komando db add prod-db postgres://app@10.0.0.5:5432/app --via web1 --ask-password --protected
komando test prod-db                         # bisakah komando menjangkaunya dan login?
```

Jika diketik tanpa argumen, `komando db add` menanyakan setiap bagian selangkah demi selangkah.

komando menyebut database sebuah **conn** (lihat [glosarium](glossary.md)). Jenisnya berasal dari awal URL:

| Jenis | Contoh URL |
|-------|------------|
| PostgreSQL | `postgres://app@10.0.0.5:5432/app?sslmode=require` |
| MySQL / MariaDB | `mysql://shop@db.internal:3306/shop?tls=true` |
| SQL Server | `sqlserver://app@db.internal:1433/sales?encrypt=true` (juga `mssql://`). Lihat [SQL Server](#sql-server). |
| Oracle | `oracle://app@db.internal:1521/ORCLPDB1?tls=true` (path adalah nama service). Lihat [Oracle](#oracle). |
| ClickHouse | `clickhouse://app@ch.internal:8443/analytics?tls=true` (antarmuka HTTP). Lihat [ClickHouse](#clickhouse). |
| Snowflake | `snowflake://APP_RO@myorg-myaccount/ANALYTICS/PUBLIC?warehouse=REPORTING&role=ANALYST_RO` (account sebagai ganti host). Lihat [Snowflake](#snowflake). |
| BigQuery | `bigquery://my-project/analytics?location=EU` (project, dan dataset default). Lihat [BigQuery](#bigquery). |
| SQLite | `sqlite:///var/lib/app.db` (file di komputer ini; di Windows `sqlite://C:\data\app.db`) |
| MongoDB | `mongodb://app@db1.internal:27017,db2.internal/shop?replicaSet=rs0&authSource=admin` (Atlas: `mongodb+srv://app@cluster0.abcde.mongodb.net/shop`). Lihat [MongoDB](#mongodb). |

`komando conn kinds` mencantumkan setiap jenis, termasuk cache, queue, storage, cluster, dan registry.

Jangan pernah menaruh kata sandi di URL; komando menolaknya. `--ask-password` menanyakannya (disembunyikan) dan menyimpannya di vault sebagai `secret:prod-db-pass`. Atau simpan dulu, atau arahkan ke password manager (lihat [Secret](secrets.md)):

```bash
komando secret set prod-db-pass
komando db add prod-db postgres://app@10.0.0.5:5432/app --via web1 --password-ref secret:prod-db-pass --protected
```

URL menyatakan lebih dari alamatnya: Postgres membaca `host=`, `port=`, `hostaddr=`, dan `service=`, Redis `sentinels=`, MongoDB host seed tambahan, RabbitMQ `management=`, dan sebagian besar jenis sebuah CA atau mode TLS. Jadi untuk conn dengan kata sandi tersimpan, setiap pengaturan URL-nya dihitung sebagai bagian dari ke mana kata sandi menuju, kecuali beberapa yang tidak memindahkan apa pun (`connect_timeout`, `application_name`, dan timeout lainnya): perubahan agen AI pada yang lain butuh jawaban ya Anda (`SECRET_DESTINATION`). komando membaca conn Postgres dari URL-nya saja: tidak pernah dari variabel lingkungan `PG*`, dan tidak pernah dengan kata sandi dari `~/.pgpass` kecuali URL menyebut `passfile=`.

Conn SQLite tidak pernah membuka folder komando sendiri. Untuk agen AI, conn itu juga tidak pernah membuka file di folder tempat login disimpan (`~/.ssh`, `~/.aws`, `~/.config/gcloud`, `~/.azure`, `~/.kube`, `~/.docker`) atau file lain yang disembunyikan komando dari agen, link diikuti, dan `db dump --to` serta `db restore --from` menolak path yang sama (`SENSITIVE_FILE`).

Kata sandi yang tidak boleh disimpan di komputer ini bisa diketik setiap kali, dengan `--login ask`:

```bash
komando db add prod-db postgres://app@10.0.0.5:5432/app --via web1 --login ask
komando conn edit prod-db --login ask        # berhenti memakai kata sandi tersimpan
komando conn edit prod-db --login password --ask-password   # kembali ke yang tersimpan
```

`--login` menerima kata yang dicetak `conn show` dan `list` di field `login`-nya: `ask` (seseorang mengetik kata sandi di setiap koneksi; tidak pernah disimpan), `password` (yang tersimpan: `--ask-password` atau `--password-ref`), atau `none` (komando tidak mengirim kata sandi apa pun miliknya sendiri: login milik URL, login cloud, atau tidak ada). Conn login-ask bertanya seperti [server login-ask](servers.md#type-the-password-each-time---login-ask): di terminal (disembunyikan), di jendela aplikasi, atau, untuk perintah agen AI, di jendela komando sendiri, yang menyebut conn, user, alamat, jalan ke sana (`--via`), dan perintahnya; agen tidak pernah melihat kata sandinya. Pembatalan menghentikan perintah dengan `DECLINED`, dan jendela tetap tertutup untuk conn itu selama semenit. Script, atau agen tanpa layar, mendapat `NEEDS_PERSON`. Hanya Anda yang menentukan ke mana kata sandi menuju: agen AI yang menambah conn login-ask, mengubah URL atau `--via`-nya, mengubah satu menjadi `--login ask`, mengubah server atau VPN di jalannya, atau mengganti secret yang disebut URL-nya (`ca=secret:`) mendapat `NEEDS_PERSON`; seperti untuk kata sandi tersimpan (di atas), setiap pengaturan URL kecuali beberapa yang tidak memindahkan apa pun dihitung sebagai ke mana kata sandi menuju. `db dump` dan `db restore` milik agen pada conn seperti itu juga berhenti: tool dump akan mendapat kata sandi di lingkungannya, tempat program agen sendiri bisa membacanya; jalankan itu sendiri. File (SQLite) atau cluster tidak punya kata sandi untuk diketik: `--login ask` ditolak di sana. Conn tidak punya `komando login`, jadi setiap perintah bertanya; pakai TLS (`sslmode=verify-full`, `tls=true`) agar server diperiksa sebelum kata sandi keluar.

`--via web1` berarti "database hanya bisa dijangkau dari web1". komando tersambung lewat web1 melalui SSH dengan sendirinya: tidak ada tunnel yang dimulai dan tidak ada port yang terbuka di komputer ini. `--via` juga bisa berupa rantai atau VPN (lihat [Tunnel](tunnels.md) dan [VPN](vpn.md)). Conn yang langsung lewat jaringan sebaiknya memakai TLS: lihat [Enkripsi (TLS)](#encryption-tls).

Di terminal, perintah yang tidak menyebut database atau SQL akan menanyakannya, dengan daftar database, lalu mencetak perintah lengkapnya. Jika diketik tanpa argumen, `komando db query` menanyakan database mana, lalu SQL-nya. Agen AI atau script mendapat `USAGE` (exit 2) dengan contoh di hint. Setiap kesalahan berakhir dengan hint yang menyebut perintah berikutnya yang dijalankan, dengan conn itu di dalamnya.

### Memeriksa, mengubah, mengganti nama, atau menghapus conn database

```bash
komando list kind:db                         # database Anda
komando test kind:db                         # terjangkau? apakah kata sandi berfungsi?
komando conn show prod-db                    # pengaturannya (kata sandi tetap berupa rujukan)
komando conn edit prod-db --add-tag critical
komando conn edit prod-db --protected        # setiap perubahan lalu butuh jawaban ya dari seseorang
komando conn rename prod-db shop-db          # setiap rujukan ikut
komando conn rm staging-db                   # komando melupakannya; database-nya tidak disentuh
```

- Conn memakai target yang sama dengan server (`@group`, `tag:prod`, `*-db`, `all`). Lihat [Target](targets.md).
- Server dan conn berbagi satu set nama: server dan conn tidak bisa sama-sama bernama `db1`. Nama mengabaikan huruf besar dan kecil, jadi `DB1` adalah nama yang sama.
- Server yang dipakai conn di `--via` tidak bisa dihapus sampai conn itu diubah.

## Melihat tabel

```bash
komando db schema prod-db                    # daftar tabel
komando db schema prod-db users orders       # kolom, tipe, indeks, foreign key, check
```

Jika diketik tanpa argumen, `komando db schema` menanyakan database mana, lalu tabel mana.

```text
TABLE   TYPE   ROWS (EST.)
orders  table  18230
users   table  1204
```

- `db schema` menampilkan tabel dalam urutan yang disebut, dan menandai kolom `auto_increment` dan `generated always as identity`.
- Tabel di schema `public` tampil tanpanya; yang lain sebagai `schema.table`.

## Menjalankan query

```bash
komando db query prod-db "select id, email from users order by id desc limit 2"
```

```text
id    email
1204  ana@example.com
1203  budi@example.com
(2 rows)
```

Query hanya membaca kecuali ditambahkan `--write` (lihat [Mengubah data](#change-data)).

```bash
komando db explain prod-db "select * from orders where user_id = 42"
komando db query prod-db --file report.sql   # SQL dari file (--file - membaca stdin)
```

Pakai `--arg` untuk nilai, bukan menempelkannya ke SQL. Placeholder-nya `$1`, `$2` di PostgreSQL, `?` di MySQL dan SQLite, `@p1`, `@p2` di SQL Server, `:1`, `:2` di Oracle, `?` di Snowflake dan BigQuery (nilainya masuk sebagai `STRING`), dan `{p1:String}`, `{p2:UInt64}` di ClickHouse (bernama `p1`, `p2`, dengan tipe):

```bash
komando db query prod-db "select * from users where email = $1" --arg bob@example.com
```

Jumlah nilai `--arg` wajib cocok dengan placeholder (`USAGE`, exit 2). Di SQL Oracle setiap placeholder mengambil `--arg` sendiri, juga nama yang dipakai dua kali (`where a = :1 or b = :1` mengambil dua); di blok PL/SQL nama yang dipakai dua kali mengambil satu.

### Mengekspor baris ke CSV atau TSV

Untuk spreadsheet dan script, `-o csv` atau `-o tsv` mencetak baris sebagai ganti JSON atau tabel. NULL adalah field kosong, biner adalah heksadesimal `\x`:

```bash
komando db query prod-db -o csv "select id, email from users" > users.csv
```

Ekspor CSV atau TSV memuat setiap baris, kecuali diberi `--limit` (komando lalu menyatakan di stderr saat berhenti di sana). Bila barisnya lebih dari `--max-output` byte, komando tidak mencetak apa pun dan gagal dengan `OUTPUT_TRUNCATED` (exit 1), sehingga file tidak pernah terpotong tanpa diketahui: naikkan `--max-output`, atau untuk seluruh database pakai `komando db dump`. Kesalahan menuju stderr, jadi file hanya berisi baris.

### Berapa banyak yang kembali, dan berapa lama boleh berjalan

Kalau tidak, query mengembalikan paling banyak 500 baris (`--limit`, `0` untuk tanpa batas) dan `--max-output` byte. Hasil yang terpotong menyatakan batas mana yang tercapai: `"truncated": "rows"` (naikkan `--limit`) atau `"truncated": "bytes"` (naikkan `--max-output`). Query berhenti setelah 30 detik; pakai `--timeout 2m` untuk lebih lama, atau beri satu conn batasnya sendiri:

```bash
komando conn edit prod-db --option statement_timeout=10s
```

`--timeout` di command line selalu menang.

Di conn yang dilindungi, agen AI melihat alamat email, nomor telepon, nomor kartu, dan IBAN di baris sebagai `[hidden: email]` dan seterusnya. Sebut kolom yang memuat data pribadi lain (nama, alamat) untuk menyembunyikannya seluruhnya, bagi agen: lihat [Data pribadi](safety.md#personal-data).

```bash
komando conn edit prod-db --option 'mask_columns=full_name address birth_date'
```

Query agen AI yang menyebut kolom seperti itu (untuk mengganti namanya, menghitung darinya, atau memfilternya) berhenti dengan `REVEAL_NEEDS_PERSON`; `SELECT *` menampilkannya sebagai `[hidden: column]`. `db dump` agen dari database yang data pribadinya disembunyikan berhenti dengan `SENSITIVE_FILE`: seseorang mengizinkannya dengan `--reveal`.

SQL yang diawali `-- comment` tampak seperti flag bagi command line. Taruh `--` sebelumnya, atau pakai `--file -`.

Di output teks, tabel sejajar, juga dengan karakter CJK dan emoji. Bagaimana setiap tipe kolom tampil di JSON ada di [Referensi](#how-values-come-back-json).

## Mengubah data

`komando db query` tidak mengubah data kecuali ditambahkan `--write`. Tanpanya, query berjalan di transaksi read-only dan database sendiri menolak perubahan.

Mengubah data butuh dua langkah. Pertama dry run: SQL benar-benar berjalan, terlihat berapa baris yang disentuhnya, lalu semuanya di-rollback.

```bash
komando db query prod-db --write --dry-run "update users set plan = 'pro' where id = 42"
komando db query prod-db --write "update users set plan = 'pro' where id = 42"
```

```text
1 row affected
dry run: rolled back, nothing changed
```

Sabuk pengamannya:

- Conn yang dilindungi bertanya sebelum setiap `--write`, apa pun SQL-nya.
- SQL yang merusak dihentikan: `DROP`, `TRUNCATE`, `DELETE` atau `UPDATE` tanpa `WHERE`, perubahan hak akses, kode yang menjangkau sistem operasi server (`CREATE EXTENSION`, fungsi dalam C atau `plpython3u`, `LOAD`, MySQL `INSTALL PLUGIN` dan `SONAME`, SQL Server `CREATE ASSEMBLY`), dan beberapa lagi. `komando policy list` menampilkan semuanya; `komando policy check --conn-kind postgres "..."` menguji sebuah query.
- Di terminal, komando bertanya dulu (conn yang dilindungi: jawaban ya; SQL yang merusak: Anda mengetik nama conn); agen AI atau script menambahkan `--yes` (atau `--allow-dangerous`) setelah seseorang setuju. Tanpanya, mereka mendapat `PROTECTED_TARGET` atau `POLICY_BLOCKED` (exit 6). Lihat [Keamanan](safety.md#what-needs-a-yes).
- Beberapa fungsi admin yang tidak dihentikan transaksi read-only (mengakhiri sesi, membaca file server, `dblink`) diblokir oleh pemeriksaan komando sendiri.
- `BEGIN` dan `COMMIT` ditolak: komando menjalankan semuanya dalam satu transaksi. Setiap pernyataan dikirim ke server sendiri-sendiri, dan bila ada yang tetap mengakhiri transaksi itu, komando berhenti sebelum yang berikutnya.
- Tanpa `--write`, sesi juga read-only (di Postgres, kecuali pooler seperti PgBouncer menolak pengaturan itu; lalu hanya transaksinya).
- SQL yang tidak bisa dibaca komando seperti server membacanya ditolak (`SQL_HIDDEN_CODE`): komentar MySQL `/*! ... */`, nama Postgres `U&"..."`, angka yang ditulis tepat sebelum `$` (`1abc$$`), MySQL `--` yang diikuti byte non-ASCII. Mengubah character set klien (`SET NAMES`, `client_encoding`) ditolak, begitu juga koneksi yang character set-nya bisa menyembunyikan backslash (SJIS, GBK, BIG5, dan sejenisnya).
- Beberapa pernyataan tidak bisa di-rollback (`VACUUM`, `CREATE INDEX CONCURRENTLY`, `SET PASSWORD`, dan di MySQL setiap pernyataan selain `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `REPLACE`, `SHOW`, `SET`, dan beberapa pembacaan lain). Pernyataan itu wajib dikirim sendirian, dan dry run hanya melaporkannya.
- Dry run juga melewati apa yang tidak dibatalkan rollback: `setval()`, mengakhiri sesi, `COPY ... PROGRAM`, file server, `dblink`, dan kode yang tidak bisa dilihat komando (`DO`, `CALL`, `EXECUTE`). Bila eksekusi sungguhan akan diblokir (tanpa `--allow-dangerous`, atau conn yang dilindungi tanpa `--yes`), dry run tidak menjalankan apa pun dan hanya menampilkan rencananya. Fungsi yang dipanggil dengan nama (`SELECT reset_ids()`) berjalan, dan apa yang dilakukannya di luar transaksi (sequence, file) tetap.
- `db explain --analyze` benar-benar menjalankan query, jadi query yang mengubah data butuh `--write` di sana juga.

Pemeriksaan ini menangkap kesalahan. Untuk batas yang sungguhan, beri komando user database yang hanya punya hak yang dibutuhkannya.

## Backup dan restore

```bash
komando db dump prod-db --to backups/
```

```text
prod-db: backups/prod-db-2026-11-13.sql.gz (48.2 MiB)
```

Jika diketik tanpa argumen, `komando db dump` menanyakan database mana yang di-backup, lalu file mana tempat menyimpannya.

Jenis mana yang bisa di-backup komando sendiri:

| Jenis | `db dump` / `db restore` | Sebagai gantinya |
|-------|--------------------------|------------------|
| PostgreSQL | ya | |
| MySQL / MariaDB | ya | |
| SQLite | `dump` menyalin file database; tanpa `restore` | hentikan aplikasi, lalu salin file kembali |
| MongoDB | tidak | `mongodump` di server, dengan `komando exec` |
| SQL Server | tidak | `BACKUP DATABASE ... TO DISK` dengan `db query --write`, lalu `komando download` file `.bak` |
| Oracle | tidak | Data Pump (`expdp`, `impdp`) atau RMAN dengan `komando exec`, lalu `komando download` |
| ClickHouse | tidak | `BACKUP TABLE ... TO Disk('backups', 'name.zip')` (atau `S3(...)`) dengan `db query --write` |
| Snowflake | tidak | `COPY INTO @stage`, Time Travel, atau `CLONE` |
| BigQuery | tidak | `EXPORT DATA` ke Cloud Storage, atau snapshot tabel |

Jenis dengan "tidak" menjawab `NOT_SUPPORTED`, dengan hint ini. SQL backup di kolom "Sebagai gantinya" juga butuh `--allow-dangerous`. Untuk pekerjaan besar, pakai `komando job` sebagai ganti `komando exec`. Untuk beberapa baris, `komando db query CONN -o csv` adalah salinan di komputer ini.

```bash
komando db dump prod-db                                   # prod-db-<tanggal>.sql.gz di folder ini
komando db dump prod-db --to prod-2026-11-02.sql.gz       # SQL polos, dikompres (.gz)
komando db dump prod-db --to prod.dump --format custom    # arsip PostgreSQL, untuk pg_restore
komando db dump prod-db --to orders.sql --table public.orders   # satu tabel (bisa diulang)
komando db dump prod-db --to schema.sql --schema-only     # tanpa baris
komando db restore staging-db --from prod-2026-11-02.sql.gz --dry-run   # memeriksa file, tidak mengubah apa pun
komando db restore staging-db --from prod-2026-11-02.sql.gz
komando db restore staging-db --from prod.dump            # sebuah arsip: pg_restore di server --via milik conn
komando db dump prod-db --to prod.dump --format custom --run-on db1     # pg_dump berjalan di server db1
komando db restore staging-db --from prod.dump --run-on db1             # pg_restore berjalan di db1
```

Restore bisa menimpa data. Di terminal, komando bertanya dulu; agen AI atau script menambahkan `--allow-dangerous` (dan `--yes` di conn yang dilindungi) setelah seseorang setuju. Lihat [Restore dengan aman](#restore-safely).

### Ke mana backup pergi, dan siapa yang membuatnya

Backup selalu menuju file di komputer ini, hanya bisa dibaca Anda. File yang sudah ada tidak pernah ditimpa. Tanpa `--to`, namanya `CONN-<tanggal>.sql.gz` di folder ini (`--format custom`: `CONN-<tanggal>.dump`; SQLite: `CONN-<tanggal>.db`); `--to` sebuah folder menaruh nama itu di dalamnya.

`pg_dump` atau `mysqldump` berjalan di server yang memilikinya: yang disebut dengan `--run-on HOST`, kalau tidak server terakhir di jalur `--via` milik conn. Kalau tidak (conn langsung atau VPN, atau server `--via` tanpa tool itu) komando membuat dump sendiri, dan tidak ada yang perlu diinstal. `runs_on` di jawaban (dan di `komando audit`) menyebut di mana tool berjalan. Restore SQL polos selalu dijalankan komando sendiri, lewat jalur `--via` yang sama, tidak pernah oleh `psql` atau `mysql`: keduanya akan menuruti perintah klien yang tersembunyi di file di server itu. Hanya arsip PostgreSQL yang menuju `pg_restore` di server. `tool` di jawaban menyatakan mana yang dipakai.

Kata sandi menuju tool di server lewat lingkungannya, tidak pernah di command line-nya, jadi user lain di server itu tidak bisa melihatnya. Untuk conn MySQL dengan `?tls=...`, pengaturan TLS yang sama diteruskan ke tool di server (klien MySQL dan MariaDB sama-sama berfungsi). Untuk Postgres, `pg_dump` dan `pg_restore` membaca URL conn sendiri: dengan `sslmode=verify-full` (atau `verify-ca`) keduanya memeriksa sertifikat database terhadap `~/.postgresql/root.crt` di server tempat keduanya berjalan, bukan terhadap CA sistem seperti yang dilakukan komando. Dengan `pg_dump` 16 atau lebih baru, komando menambahkan `sslrootcert=system`, sehingga keduanya memakai CA sistem juga. Yang lebih lama butuh CA di file itu di sana; tanpanya dump berhenti dengan `DB_CONNECT` dan hint (instal `postgresql-client` 16 atau lebih baru, taruh CA di `~/.postgresql/root.crt`, atau jangkau database `--via` server itu tanpa TLS).

### CA privat (`?ca=secret:NAME`)

Tool di server juga memeriksa sertifikat database terhadap CA milik conn, dengan pemeriksaan penuh yang sama seperti yang dilakukan komando: ditandatangani CA itu dan menyebut nama server. komando mengirim CA setelah kata sandi, lewat input tool, tidak pernah di command line-nya. CA mendarat di folder baru di `/tmp` yang hanya bisa dibuka user login, dan dihapus setelah tool berakhir. `pg_dump` dan `pg_restore` versi apa pun mendapatkannya sebagai `sslrootcert=` dengan `sslmode=verify-full` (sebagai ganti `ca=`, yang tidak dikenal libpq), jadi `~/.postgresql/root.crt` tidak dibutuhkan. `mysqldump` mendapat `--ssl-ca` dan koneksi TLS yang diperiksa, juga saat URL tidak punya `tls=`.

### Menjalankan dump di server pilihan (`--run-on HOST`)

Ini membantu saat conn lewat VPN (komando lalu hanya bisa menulis SQL polos sendiri) tetapi server yang dikelola punya `pg_dump` dan bisa menjangkau database, sering server database itu sendiri:

```bash
komando db dump prod-db --to prod.dump --format custom --run-on db1 --dry-run
komando db dump prod-db --to prod.dump --format custom --run-on db1
```

- `HOST` adalah server dari daftar (nama atau selector yang memilih tepat satu); komando menjangkaunya dengan cara lazim, lewat `--via`-nya sendiri. Kata sandi conn menuju ke sana, jadi `user@address` yang tidak ada di daftar ditolak, dan untuk agen AI server selain server `--via` milik conn sendiri butuh jawaban ya Anda (`SECRET_DESTINATION`).
- Tool di sana tersambung ke alamat URL conn seperti yang dilihat server itu. Bila database hanya mendengarkan di `127.0.0.1` di server itu, tambahkan conn kedua untuk alamat itu yang dijangkau lewatnya (`komando db add prod-db-local postgres://app@127.0.0.1:5432/app --via db1 --password-ref secret:prod-db-pass`) dan dump yang itu; `CONN_UNREACHABLE` menyatakan hal ini saat terjadi.
- Dump berjalan dengan prioritas rendah (`nice -n 10`, ditambah `ionice -c3` di tempat server memilikinya), sehingga server tetap melayani penggunanya. `low_priority` di jawaban menyatakannya.
- Backup mengalir kembali lewat SSH ke `--to` di komputer ini (dikompres di sini bila berakhir `.gz`); tidak ada yang ditulis di server, kecuali sertifikat CA privat selama tool berjalan.
- `pg_dump` menolak server yang lebih baru darinya. komando melaporkannya sebagai `TOOL_TOO_OLD` dengan kedua versi dan package yang diinstal (`postgresql-client-NN`). Server yang disebut dengan `--run-on` tidak pernah dilewati: tool yang hilang atau lama di sana adalah kesalahan, sedangkan server `--via` tanpa tool yang bisa dipakai kembali ke dump SQL polos milik komando sendiri.
- `db restore --run-on HOST` menjalankan `pg_restore` di sana untuk sebuah arsip, mengalirkan file ke sana lewat SSH. Perintah ini bertanya sama seperti restore mana pun. SQL polos selalu di-restore komando sendiri, jadi `--run-on` dengan file SQL ditolak.
- Tool PostgreSQL 17 menulis `SET transaction_timeout`, yang tidak dikenal server sebelum 17. Restore SQL polos milik komando sendiri melewati baris itu di server seperti itu. `pg_restore` 17 tidak bisa memuat arsip ke sana, dan `pg_restore` yang lebih lama tidak bisa membaca arsip yang lebih baru: untuk server lama, dump dengan `--format custom` hanya dari `pg_dump` versi mayor yang sama, atau pakai SQL polos.

### Isi dump milik komando sendiri

SQL polos yang juga bisa dibaca psql dan mysql:

- PostgreSQL: extension, schema, tipe enum/domain/composite, fungsi, sequence, tabel (kolom identity dan generated, partisi), data, constraint, indeks, view, materialized view, trigger, row-level security, dan komentar.
- MySQL: tabel, data (kolom generated dihitung lagi saat restore), view (setelah routine, dengan stand-in lebih dulu, sehingga view bisa membaca view lain atau memanggil fungsi), trigger, dan routine.
- PostgreSQL `--table` mendump tabel itu dan sequence yang dimiliki atau dipakainya di `DEFAULT`, tetapi bukan schema, tipe, atau fungsi yang dibutuhkannya (seperti `pg_dump --table`). Nama dengan titik di dalamnya ditaruh dalam tanda kutip ganda: `--table 'public."app.events"'`.
- Pemilik dan hak akses dihilangkan (seperti `--no-owner --no-acl`).
- Objek yang tidak bisa ditulisnya (aggregate, operator, foreign table, ...) menghentikan dump dengan namanya (`DUMP_UNSUPPORTED`) alih-alih dihilangkan diam-diam.
- `--format custom` butuh `pg_dump` di sebuah server (`--run-on HOST`, atau server `--via` milik conn).
- Untuk SQLite, `dump` menyalin file database (`--to backup.db`); nama `.gz`, `--format`, `--schema-only`, `--table`, dan `--run-on` ditolak.

### Restore dengan aman

- Restore bisa menimpa data. Di terminal, komando lebih dulu menawarkan menyimpan database seperti sekarang (`Save a copy of staging-db as it is now first, so you can go back? [Y/n]`), lalu meminta Anda mengetik nama conn sebagai ganti `--allow-dangerous`. Script dan agen AI tidak mendapat pertanyaan: jalankan `komando db dump CONN` dulu sendiri, lalu tambahkan `--allow-dangerous` (dan `--yes` di conn yang dilindungi) setelah seseorang setuju.
- Restore PostgreSQL berjalan dalam satu transaksi: bila ada yang gagal, tidak ada yang berubah. MySQL menjalankan pernyataan berurutan dan berhenti pada kesalahan pertama; apa yang berjalan sebelumnya tetap (`RESTORE_FAILED`).
- komando membaca seluruh file sebelum mengirim apa pun, seperti psql dan mysql akan membacanya. File dengan perintah klien yang bisa menjalankan program atau membaca file (`\!`, `system`, `\i`) ditolak (`UNSAFE_BACKUP`), begitu juga file yang tidak bisa diikuti komando: yang berakhir di dalam kutipan atau komentar, atau `SET` atau `set_config` yang mengubah `standard_conforming_strings` atau menambah `NO_BACKSLASH_ESCAPES`. File yang berpindah database (`\connect`, dari `pg_dump --create` atau `pg_dumpall`) juga ditolak (`RESTORE_UNSUPPORTED`): dump satu database tanpa `--create`. Dump satu database yang sebenarnya lolos. `db restore --dry-run` menjalankan pemeriksaan ini juga dan menyatakan apa yang akan menghentikan eksekusi sungguhan.
- SQL di dalam file yang melakukan lebih dari menulis data disebut di samping `db-restore` dalam persetujuan dan di `POLICY_BLOCKED`, dengan baris tempat pertama kali muncul: `sql-program` (`COPY ... PROGRAM`, `CREATE EXTENSION`), `sql-server-file` (`INTO OUTFILE`, `pg_read_file`), `sql-server-config` (`ALTER SYSTEM`), `sql-privileges` (`GRANT`, `CREATE ROLE`), `sql-opaque` (`DO`, `PREPARE`), `sql-remote`, dan `sql-kill`. pg_dump dengan hak akses menyebut `sql-privileges`.
- `--table` hanya menerima nama tabel; nilai yang diawali `-` ditolak.
- `db restore` tidak menerima file SQLite: hentikan program yang memakai database, lalu salin backup menimpa file database.
- Database besar butuh waktu: `dump` dan `restore` tidak punya timeout kecuali diberikan `--timeout`.

## Memeriksa sebuah database

```bash
komando db info prod-db                   # versi, uptime, ukuran, koneksi, primary atau replica
komando db activity prod-db               # apa yang berjalan sekarang: pid, user, berapa lama, query-nya (--all menambah yang idle)
komando db locks prod-db                  # siapa yang menunggu, dan sesi yang memegang lock
komando db sizes prod-db -n 10            # database, tabel dan indeks terbesar
komando db explain prod-db --analyze "select ..."   # waktu sungguhan (MariaDB: ANALYZE)
```

```text
conn:    prod-db
kind:    postgres
uptime:  12d
size:    7.5 GiB
```

(Jawaban lengkapnya juga memuat versi, koneksi, dan apakah primary atau replica.)

Menghentikan query yang lambat:

```bash
komando db kill prod-db 4821 --dry-run    # query mana yang akan dihentikan
komando db kill prod-db 4821              # batalkan query; klien tetap tersambung
komando db kill prod-db 4821 --session    # akhiri seluruh koneksi
```

Mengakhiri seluruh koneksi bersifat merusak: di terminal, komando bertanya dulu; agen AI atau script menambahkan `--allow-dangerous` setelah seseorang setuju.

- Output teks menampilkan ukuran (`7.5 MiB`) dan durasi (`3h`). JSON menyimpan angka mentahnya (`size_bytes`, `running_seconds`).
- SQLite tidak punya sesi server, jadi `activity`, `locks`, dan `kill` tidak berlaku padanya.
- SQL Server hanya bisa mengakhiri seluruh sesi (`KILL`), jadi `db kill` butuh `--session` di sana.
- Di Oracle PID adalah SID sesi (`db activity` menampilkannya, dengan serial#-nya).
- Di ClickHouse PID adalah angka yang dibuat `db activity` dari `query_id` query; `db kill` menghentikan query itu, dan tidak ada `--session` atau `db locks`.
- Di Snowflake juga, PID adalah angka yang dibuat `db activity` dari ID query; `db kill` membatalkan query (`SYSTEM$CANCEL_QUERY`), dan `--session` mengakhiri sesinya. Tidak ada `db locks`.
- Di BigQuery PID adalah angka yang dibuat `db activity` dari ID job; `db kill` membatalkan job. Tidak ada `--session` atau `db locks`.

## User dan grant

```bash
komando secret set app-ro-pass                                  # kata sandi masuk ke vault dulu
komando db user add prod-db app_ro --password-ref secret:app-ro-pass
komando db grant prod-db app_ro --privileges SELECT --on all-tables:public
komando db user show prod-db app_ro                             # apa yang boleh dilakukannya sekarang
komando db user list prod-db                                    # semua user dan role
komando db user passwd prod-db app_ro --password-ref secret:app-ro-pass-2
komando db revoke prod-db app_ro --privileges SELECT --on all-tables:public
komando db user rm prod-db app_ro
komando db grant staging-db app --privileges SELECT,INSERT --on 'shop.*' --from-host '10.0.%'   # conn MySQL
```

Jika diketik tanpa argumen, `komando db user add` menanyakan database mana, user-nya, lalu tempat kata sandi disimpan. Untuk mengganti kata sandi user milik conn sendiri, lihat [Rotasi kata sandi](rotate.md).

- Kata sandi hanya datang dari rujukan secret. Kata sandi tidak pernah diketik di command line, ditampilkan, atau ditulis ke audit log (`--dry-run` dan jawabannya menampilkan `[hidden]`). PostgreSQL mendapat verifier SCRAM-SHA-256 yang dihitung komando, sehingga kata sandi tidak pernah sampai ke server atau lognya. Untuk agen AI, kata sandi butuh jawaban ya dari seseorang (`--yes`, lalu jendela, `SECRET_DESTINATION`): conn itu bisa jadi server yang disiapkan agen.
- `--on` menerima `database:NAME`, `schema:NAME`, `table:[SCHEMA.]TABLE`, atau `all-tables:SCHEMA` di PostgreSQL (`--role ROLE` memberikan role sebagai gantinya), dan `DB.*`, `DB.TABLE`, atau `*.*` di MySQL (`--from-host` mengatur host akun). Untuk SQL Server lihat [SQL Server](#sql-server), untuk Oracle [Oracle](#oracle), untuk ClickHouse [ClickHouse](#clickhouse). Di Snowflake, `db user list` dan `db user show` membaca; menambah, mengubah, dan memberikan grant tidak tersedia. Di BigQuery, user dan hak akses adalah IAM Google Cloud, jadi perintah ini tidak tersedia.
- Menambah user dan grant adalah perubahan: conn yang dilindungi bertanya dulu. Menghapus user bersifat merusak: di terminal Anda mengetik nama user; agen AI atau script menambahkan `--allow-dangerous` setelah seseorang setuju. User yang masih memiliki objek atau punya sesi tidak dihapus (`DB_USER_IN_USE`).

## Shell SQL interaktif (untuk manusia)

```bash
komando db shell staging-db           # shell SQL milik komando sendiri; dimulai read-only
komando db shell staging-db --write   # izinkan perubahan
komando db shell prod-db              # conn yang dilindungi bertanya dulu
```

`db shell` adalah shell SQL milik komando sendiri untuk PostgreSQL, MySQL/MariaDB, SQL Server, Oracle, ClickHouse, Snowflake, BigQuery, dan SQLite, sehingga tidak ada yang lain yang perlu diinstal. Shell tersambung lewat jalur `--via` milik conn, dan setiap pernyataan mendapat pemeriksaan yang sama dengan `db query`: read-only kecuali dimulai dengan `--write`, pernyataan yang merusak hanya setelah Anda mengetik nama conn, dan masing-masing ditulis ke audit log. Pernyataan berakhir dengan `;` (blok PL/SQL Oracle: baris yang hanya berisi `/`) dan berjalan dalam transaksinya sendiri.

```text
staging-db> select id, name
         -> from users limit 2;
 id | name
----+------
  1 | ana
  2 | budi
(2 rows)
staging-db> \q
```

| Perintah | Fungsinya |
|----------|-----------|
| `\q` | keluar |
| `\write` | izinkan perubahan selama sisa shell (bertanya dulu, juga di conn yang dilindungi); `\write` lagi kembali ke read-only |
| `\?` | daftar perintah |
| `\d [TABLE]` | daftar tabel, atau tampilkan satu tabel |
| `\l` / `\dn` / `\du` | database / schema / role |
| `\x` | baris yang diperluas (atau akhiri pernyataan dengan `\G`) |
| `\timing` | tampilkan berapa lama setiap pernyataan |
| `\i FILE` | jalankan SQL dari file |

Panah atas dan bawah memanggil kembali baris sebelumnya. Mode read-only adalah milik database sendiri (transaksi read-only): `\write` tersambung lagi dengan perubahan diizinkan. Pernyataan yang merusak (`DROP`, `TRUNCATE`, `DELETE` tanpa `WHERE`) meminta Anda mengetik nama conn dulu, seperti `db query` di command line; jawaban lain adalah `Not run.`. Shell untuk orang di terminal: agen dan script mendapat `NEEDS_TERMINAL` dan memakai `db query`, yang mengembalikan JSON. MongoDB tidak punya `db shell`.

## Enkripsi (TLS)

Conn yang langsung lewat jaringan (tanpa `--via`, bukan ke komputer ini) sebaiknya memakai TLS yang memeriksa sertifikat server. Kalau tidak, siapa pun di jalur jaringan bisa membaca data, dan bisa menipu login agar memberikan kata sandi kepadanya:

| Jenis | TLS yang diperiksa | Terenkripsi, sertifikat tidak diperiksa | Tanpa enkripsi |
|-------|--------------------|------------------------------------------|----------------|
| PostgreSQL | `?sslmode=verify-full` | `?sslmode=require` | `?sslmode=disable` |
| MySQL / MariaDB | `?tls=true` | `?tls=skip-verify` | `?tls=false` |
| SQL Server | `?encrypt=true` (atau `strict`) | `?encrypt=true&tls=skip-verify` | `?encrypt=disable` |
| Oracle | `?tls=true` (TCPS) | `?tls=skip-verify` | `?tls=false` |
| ClickHouse | `?tls=true` (HTTPS, port 8443) | `?tls=skip-verify` | `?tls=false` (port 8123) |
| Snowflake | selalu (HTTPS) | tidak ditawarkan | tidak ditawarkan |
| BigQuery | selalu (HTTPS) | tidak ditawarkan | endpoint `http://` (emulator) |

- Tanpa pengaturan, conn Postgres memakai TLS bila server menawarkannya, tetapi tidak memeriksa sertifikat dan melanjutkan tanpa TLS bila diminta. Conn MySQL tanpa `tls=` tidak terenkripsi, dan login MySQL 8 lalu mengenkripsi kata sandi dengan key yang dikirim server lewat koneksi polos yang sama, yang bisa ditukar orang di tengah. Conn SQL Server tanpa `encrypt=` (atau dengan `encrypt=false`) hanya mengenkripsi login, dan tanpa `encrypt=` juga tidak memeriksa sertifikat. Conn Oracle tanpa `tls=true` tidak memakai TLS; enkripsi jaringan milik Oracle sendiri, bila server menyalakannya, mengenkripsi tetapi tidak membuktikan siapa server itu. Conn ClickHouse tanpa `tls=true` adalah HTTP polos.
- komando memeriksa secara default. Saat `db add` (atau `conn edit --url`) menyimpan conn seperti itu dan URL-nya tidak menyatakan cara memakai TLS, komando menambahkan `sslmode=verify-full` (Postgres), `tls=true` (MySQL, Oracle, ClickHouse, yang port 8123-nya menjadi 8443) atau `encrypt=true` (SQL Server) dan menyatakannya di `warnings`. URL yang menyebut sebuah pengaturan mempertahankannya, dan conn lewat `--via` atau ke komputer ini dibiarkan seperti ditulis. Bila server tidak punya TLS atau sertifikat dari CA-nya sendiri, hint koneksi pertama menyatakan apa yang dilakukan (baris di bawah).
- Conn yang URL-nya mematikan pemeriksaan tetap berfungsi. `komando doctor` memperingatkan setiap conn tanpa TLS yang diperiksa dan mencetak baris `komando conn edit NAME --url ...` yang memperbaikinya.
- Server yang sertifikatnya berasal dari CA privat (milik perusahaan, atau milik cloud, seperti Amazon RDS atau Azure Database): simpan CA dan sebut dengan `?ca=`, untuk Postgres, MySQL, SQL Server, Oracle, ClickHouse, Snowflake, dan BigQuery (proxy yang memeriksa TLS). Sertifikat lalu diperiksa sepenuhnya: ditandatangani CA itu dan menyebut nama server, juga dengan `sslmode=require`, dan tidak pernah tanpa TLS:

  ```bash
  komando secret set rds-ca < global-bundle.pem
  komando db add prod-db 'postgres://app@orders.abc123.eu-west-1.rds.amazonaws.com/orders?ca=secret:rds-ca' --password-ref secret:prod-db-pass
  ```

  Untuk Postgres, file di komputer ini juga berfungsi: `?sslrootcert=/path/to/ca.pem`.
- Saat TLS menghentikan koneksi (sertifikat tidak lolos pemeriksaan, atau server tidak punya TLS), hint menyatakan apa yang dilakukan dan menyebut pengaturan yang lebih lemah beserta harganya.
- Lewat `--via`, lalu lintas berada di dalam SSH sampai server `--via`.

## MongoDB

Conn MongoDB menerima `db query` yang sama, dengan dokumen perintah dalam JSON sebagai ganti SQL: key pertamanya menyebut perintahnya, seperti di `runCommand`. `db schema`, `db info`, `db explain`, dan `db activity` juga berfungsi.

```bash
komando secret set shop-mongo-pass
komando db add shop-mongo 'mongodb://app@db1.internal,db2.internal/shop?replicaSet=rs0&authSource=admin' --via web1 --password-ref secret:shop-mongo-pass
komando db query shop-mongo '{"find": "orders", "filter": {"status": "open"}, "sort": {"_id": -1}, "limit": 10}'
komando db query shop-mongo '{"aggregate": "orders", "pipeline": [{"$group": {"_id": "$status", "n": {"$sum": 1}}}], "cursor": {}}'
komando db query shop-mongo --write '{"update": "orders", "updates": [{"q": {"_id": {"$oid": "5f1d7f1b2c3a4b5c6d7e8f90"}}, "u": {"$set": {"status": "paid"}}}]}'
komando db schema shop-mongo                      # collection, ukuran, indeks
komando db schema shop-mongo orders               # field dan tipenya, dari sampel
komando db info shop-mongo                        # versi, primary atau secondary, ukuran
komando db explain shop-mongo '{"find": "orders", "filter": {"status": "open"}}'   # rencananya (--analyze: jalankan, dengan angkanya)
komando db activity shop-mongo                    # apa yang berjalan sekarang (currentOp); --all untuk koneksi idle juga
```

- komando menilai setiap perintah sebelum mengirimnya, seperti SQL: `find`, `aggregate`, `count`, `distinct`, dan pembacaan lain berjalan apa adanya. Perintah yang mengubah data, atau yang tidak dikenal komando sebagai pembacaan, butuh `--write`; conn yang dilindungi juga bertanya dulu. `delete` atau `update` multi-dokumen dengan filter kosong, `drop`, `dropDatabase`, perubahan user dan role, dan `shutdown` bersifat merusak. `aggregate` dengan `$out` atau `$merge` menulis.
- MongoDB tidak punya transaksi read-only, jadi penilaian itulah yang menjaga pembacaan tetap pembacaan. Untuk jaminan yang keras, beri conn user dengan hanya role `read`.
- `--write --dry-run` tidak mengirim apa pun (MongoDB tidak bisa me-rollback penulisan) dan menyatakan bagaimana perintah dinilai.
- Nilai adalah MongoDB Extended JSON: `{"$oid": "..."}`, `{"$date": "2026-11-08T10:00:00Z"}`. `"$db": "other"` menjalankan satu perintah di database selain milik URL (tanpa satu pun di URL: `admin`).
- Hasil: `data.documents` untuk perintah yang mengembalikan cursor (paling banyak `--limit`, default 500, dan `--max-output` byte), `data.reply` untuk yang lain. `-o text` mencetak satu dokumen per baris.
- Setiap anggota replica set dijangkau lewat `--via`. CA privat berfungsi dengan `?tls=true&ca=secret:NAME`.
- `db explain` menerima pembacaan (`find`, `aggregate`, `count`, `distinct`): `queryPlanner`, atau dengan `--analyze` `executionStats`, yang menjalankan pembacaan itu. Perintah yang menulis ditolak.
- Hanya untuk database SQL: `dump`, `restore`, `locks`, `sizes`, `kill`, user dan grant, dan `db shell`. Di MongoDB perintah-perintah itu menyatakannya (`NOT_SUPPORTED`). Untuk backup, lihat [Backup dan restore](#back-up-and-restore).

## SQL Server

Conn SQL Server (dan Azure SQL Managed Instance) menerima perintah `db` yang sama dengan PostgreSQL dan MySQL, dalam T-SQL:

```bash
komando secret set sales-pass
komando db add sales 'sqlserver://app@db.internal:1433/sales?encrypt=true' --password-ref secret:sales-pass
komando db query sales "select top (10) id, email from dbo.users order by id desc"
komando db query sales "select * from dbo.users where email = @p1" --arg bob@example.com
komando db query sales --write --dry-run "update dbo.users set plan = 'pro' where id = 42"
komando db schema sales dbo.orders                  # kolom, identity, indeks, foreign key, check
komando db explain sales "select * from dbo.orders where user_id = 42"   # rencananya; tidak ada yang berjalan
komando db info sales
komando db kill sales 57 --session
```

- **URL-nya.** Path adalah database. Named instance (`db\SQLEXPRESS`) dijangkau lewat portnya, bukan namanya: `sqlserver://app@db:49172/sales`. Nama itu butuh SQL Server Browser, yang menjawab lewat UDP, dan `--via` hanya membawa TCP. Opsinya adalah `encrypt=` (`true`, `strict`, `false`, `disable`; lihat [Enkripsi](#encryption-tls)), `tls=skip-verify`, `ca=secret:NAME`, `applicationintent=readonly` (replica yang bisa dibaca dari sebuah availability group), dan `database=NAME` sebagai ganti path. Login adalah login SQL Server (user dan kata sandi); login Windows dan Entra ID tidak didukung.
- **Sertifikatnya sendiri.** Sertifikat yang dibuat SQL Server untuk dirinya sendiri bisa punya serial number negatif, yang diterima komando; rantai dan nama host tetap diperiksa, jadi `encrypt=true` butuh `ca=` atau `tls=skip-verify` untuknya seperti untuk sertifikat self-signed mana pun.
- **Tanpa `--write` tidak ada yang tertinggal.** SQL Server tidak punya transaksi read-only, jadi komando menjalankan SQL dalam transaksi yang selalu di-rollback-nya, dan memeriksa setelah setiap pernyataan bahwa transaksi ini masih terbuka. Pemeriksaan komando datang lebih dulu, lebih ketat daripada untuk database lain, karena T-SQL tidak butuh `;` di antara pernyataan:
  - perubahan di mana pun dalam teks dihitung, jadi `select 1 delete from t` adalah `DELETE` tanpa `WHERE`;
  - kata pertama yang bukan pernyataan T-SQL adalah nama procedure yang dijalankan SQL Server (`sp_who`), jadi butuh `--write` dan bersifat merusak, seperti `EXEC`;
  - `BEGIN`, `COMMIT`, `ROLLBACK`, `SAVE TRANSACTION`, dan `SET IMPLICIT_TRANSACTIONS` ditolak di mana pun, jadi blok `BEGIN ... END` dan `TRY ... CATCH` sebaiknya ada di stored procedure;
  - nama dan teks dengan huruf di luar ASCII wajib dikutip (`[naïve]`, `N'café'`).

  Procedure atau fungsi yang dipanggil tetap bisa bertindak di luar transaksi (`xp_cmdshell`, linked server, mail). Untuk batas yang keras, beri conn login dengan hanya `db_datareader`.
- **`CREATE PROCEDURE`, `FUNCTION`, dan `TRIGGER`** mengambil sisa teks sebagai body-nya, seperti SQL Server, juga setelah `;`. Membuatnya adalah perubahan; apa yang dilakukan body dihitung saat berjalan.
- `BACKUP`, `RESTORE`, `CREATE DATABASE`, dan `ALTER DATABASE` tidak bisa berjalan dalam transaksi: kirim sendirian, dengan `--write`; dry run hanya melaporkannya.
- `db explain` menampilkan rencana dengan `SET SHOWPLAN_TEXT`: tidak ada yang berjalan, jadi tidak butuh `--write` untuk perubahan juga. `--analyze` menjalankan query dengan `SET STATISTICS PROFILE` dan menampilkan jumlah baris sebenarnya. Menjelaskan panggilan stored procedure (`EXEC`) tetap butuh `--write` dan bersifat merusak. SQL tidak boleh menyalakan atau mematikan pengaturan `SHOWPLAN` sendiri.
- `db activity`, `locks`, dan sesi di `db info` butuh izin `VIEW SERVER STATE`; tanpanya login hanya melihat sesinya sendiri.
- **User.** `db user add` membuat login (dengan kata sandi) dan user untuknya di database conn; `db user rm` menghapus keduanya. `--no-login` membuat role database sebagai gantinya. `db grant` menerima `--on database` (milik conn), `schema:NAME`, `all-tables:SCHEMA` (sama), atau `table:[SCHEMA.]TABLE`, dan `--role db_datareader` (role database mana pun) menambahkan user ke sebuah role.
- **Backup:** lihat [Backup dan restore](#back-up-and-restore).

## Oracle

Conn Oracle Database (19c dan yang lebih baru, dan Oracle Database Free) menerima perintah `db` yang sama, dalam SQL Oracle:

```bash
komando secret set erp-pass
komando db add erp 'oracle://app@db.internal:1521/ERPPDB?tls=true' --password-ref secret:erp-pass
komando db query erp "select id, email from app.users order by id desc fetch first 10 rows only"
komando db query erp "select * from app.users where email = :1" --arg bob@example.com
komando db query erp --write --dry-run "update app.users set plan = 'pro' where id = 42"
komando db schema erp app.orders                   # kolom, identity, indeks, foreign key, check
komando db explain erp "select * from app.orders where user_id = 42"   # EXPLAIN PLAN; tidak ada yang berjalan
komando db info erp
komando db kill erp 371 --session                  # 371 adalah SID
```

- **URL-nya.** Path adalah nama service, sering pluggable database (`ORCLPDB1`, `FREEPDB1`); `lsnrctl status` di server mencantumkannya. Database lama tanpa service: `oracle://app@db:1521?sid=ORCL`. Opsinya adalah `tls=` (`true`, `skip-verify`, `false`; TCPS mendengarkan di port sendiri, sering 2484) dan `ca=secret:NAME` untuk CA privat (dengan `tls=true`). Login adalah user dan kata sandi; wallet Oracle, Kerberos, dan login sistem operasi tidak didukung.
- **Tanpa `--write` tidak ada yang berubah.** komando memulai setiap eksekusi dengan `SET TRANSACTION READ ONLY`, dan memeriksa setelah setiap pernyataan bahwa transaksi ini masih terbuka.
- **DDL di-commit sendiri** di Oracle (`CREATE`, `ALTER`, `DROP`, `GRANT`, `TRUNCATE`, `COMMENT`, ...). Jadi selalu butuh `--write`, wajib dikirim sendirian, dan dry run hanya melaporkannya. `ALTER SESSION` bukan DDL.
- **PL/SQL.** Blok (`BEGIN ... END;`, `DECLARE ...`) dan `WITH FUNCTION` menjalankan kode yang tidak bisa diikuti komando: butuh `--write`, bersifat merusak, dan dry run melewatinya. Blok berjalan sampai akhir teks atau sampai baris yang hanya berisi `/`, seperti di SQL*Plus:

  ```bash
  komando db query erp --write -f - <<'SQL'
  begin
    app.close_month(date '2026-10-31');
  end;
  /
  SQL
  ```

  `CREATE PROCEDURE`, `FUNCTION`, `PACKAGE`, `TRIGGER`, dan `TYPE` bekerja dengan cara yang sama; membuatnya adalah perubahan, dan apa yang dilakukan body dihitung saat berjalan.
- `COMMIT`, `ROLLBACK`, `SAVEPOINT`, `SET TRANSACTION`, dan `PRAGMA AUTONOMOUS_TRANSACTION` ditolak di mana pun, juga di dalam blok. Nama dan teks dengan huruf di luar ASCII wajib dikutip (`"Straße"`, `'café'`). Kutipan `q'[...]'` berfungsi. Komentar `--` yang memuat karakter kontrol atau pindah baris yang tidak lazim ditolak, karena komando tidak bisa yakin di mana Oracle mengakhirinya.
- Panggilan ke package yang menjangkau server atau file lain (`UTL_HTTP`, `UTL_FILE`, `DBMS_PIPE`, `DBMS_SCHEDULER`, ...) butuh `--write` dan bersifat merusak, begitu juga panggilan ke fungsi mana pun yang bukan milik Oracle sendiri (`app.close_month(1)`, `pkg.f(x)`): fungsi itu bisa melakukan commit sendiri (transaksi otonom), bahkan di dalam `SELECT`. Nama lewat database link (`orders@prodlink`) dan external table inline (`FROM EXTERNAL (...)`, yang membaca file di server database dan dengan `PREPROCESSOR` menjalankan program di sana) dihitung sama. Fungsi yang dipanggil tanpa `()` tampak seperti kolom, jadi komando tidak bisa melihatnya: untuk batas yang keras, beri conn user dengan hanya grant `SELECT` (atau `READ`).
- `db explain` memakai `EXPLAIN PLAN` dan `DBMS_XPLAN`: tidak ada yang berjalan, jadi tidak butuh `--write` untuk perubahan juga, dan tidak untuk DDL yang diterima `EXPLAIN PLAN` (`CREATE TABLE`, `CREATE INDEX`, `ALTER INDEX`). DDL lain tidak bisa direncanakan. `--analyze` tidak tersedia di Oracle (`NOT_SUPPORTED`); rencana menampilkan perkiraan baris milik Oracle.
- `db activity`, `locks`, `kill`, dan ukuran serta uptime di `db info`, membaca view `V$` dan `DBA_` milik Oracle: user conn butuh `SELECT_CATALOG_ROLE`. Tanpanya `db sizes` menampilkan tabel milik user sendiri dan yang lain menyatakan apa yang diberikan. Data `CLOB` dan `BLOB` sebuah tabel dihitung di `total_bytes`-nya (bukan di `table_bytes`, seperti TOAST PostgreSQL). `db kill` tanpa `--session` hanya menghentikan panggilan yang sedang berjalan (`ALTER SYSTEM CANCEL SQL`, Oracle 18c dan yang lebih baru).
- **User.** Di Oracle, user juga sebuah schema. `db user add` membuat user dan mengizinkannya login (`CREATE SESSION`); `--no-login` membuat role. `db user rm` menolak user yang masih memiliki tabel (`DB_USER_IN_USE`). Nama berhuruf besar, seperti yang disimpan Oracle. `db grant` menerima `--on table:[SCHEMA.]TABLE` (`SELECT`, `INSERT`, `UPDATE`, `DELETE`, `EXECUTE`, ...), `--on database` (hak sistem seperti `CREATE TABLE` atau `SELECT ANY TABLE`), `--on schema:NAME` (Oracle 23ai: `SELECT` menjadi `SELECT ANY TABLE ON SCHEMA`), dan `--role NAME`.
- **Backup:** lihat [Backup dan restore](#back-up-and-restore).

## ClickHouse

Conn ClickHouse (23.3 dan yang lebih baru) menerima perintah `db` yang sama, dalam SQL ClickHouse. komando berbicara antarmuka HTTP ClickHouse (port 8443 dengan TLS, 8123 tanpa) dengan klien miliknya sendiri, sehingga tidak ada yang lain yang perlu diinstal:

```bash
komando secret set events-pass
komando db add events 'clickhouse://app@ch.internal:8443/analytics?tls=true' --password-ref secret:events-pass
komando db query events "select event, count() from hits where day = today() group by event order by 2 desc limit 10"
komando db query events "select * from hits where user_id = {p1:UInt64} limit 10" --arg 42
komando db query events --write "insert into notes (id, text) values (1, 'hello')"
komando db schema events analytics.hits             # kolom, engine, ORDER BY, skipping index
komando db explain events "select count() from hits where user_id = 42"   # rencananya, dengan indeks yang dipakai
komando db sizes events                              # dari system.parts
komando db activity events                           # query yang berjalan
komando db kill events 8078617214407497              # pid yang ditampilkan db activity
```

- **URL-nya.** Path adalah database (default milik user bila dihilangkan). Opsinya adalah `tls=` (`true`, `skip-verify`, `false`) dan `ca=secret:NAME` untuk CA privat (dengan `tls=true`). Tanpa port, 8443 dengan TLS dan 8123 tanpa. Port 9000 dan 9440 adalah protokol native ClickHouse, yang tidak dipahami komando: komando menyatakannya. Server yang hanya membuka port native tetap bisa dijangkau: tambahkan `--via` server yang bisa menjangkau port 8123 atau 8443-nya.
- **Tanpa `--write` tidak ada yang berubah.** ClickHouse tidak punya transaksi, tetapi punya mode read-only sendiri: setiap permintaan yang dikirim komando tanpa `--write`, dan setiap query yang mengembalikan baris, membawa pengaturan `readonly=1`, dan server menolak penulisan, DDL, dan perubahan pengaturan. `SETTINGS` dan `SET` dalam pembacaan ditolak karena alasan yang sama. Setiap permintaan adalah sesi tersendiri, jadi `SET` tidak akan bertahan juga. Sesi ClickHouse dan transaksi eksperimentalnya tidak dipakai.
- **Penulisan tidak bisa di-rollback.** `INSERT`, `ALTER`, `CREATE`, `OPTIMIZE`, dan setiap pernyataan lain yang bukan pembacaan butuh `--write`, wajib dikirim sendirian, dan dry run hanya melaporkannya. Yang merusak, seperti biasa: `DROP`, `TRUNCATE`, `DETACH`, `ALTER ... DROP` atau `CLEAR`, `SYSTEM`, `KILL QUERY`, user, role, kuota, dan grant, `BACKUP`, dan `FREEZE`.
- **Membaca dari tempat lain.** `readonly=1` membiarkan pembacaan lewat, juga pembacaan yang menjangkau server lain atau file server. Jadi table function dan engine yang melakukannya (`url()`, `s3()`, `remote()`, `mysql()`, `postgresql()`, `file()`, `executable()`, `Kafka`, ...) butuh `--write` dan bersifat merusak, juga di dalam `DESCRIBE` atau `EXPLAIN`. Fungsi yang ditambahkan admin server sebagai program (executable user-defined function) berjalan di bawah `readonly=1` seperti fungsi mana pun: komando tidak bisa membedakannya dari fungsi bawaan ClickHouse menurut namanya.
- **User read-only.** User yang settings profile-nya punya `readonly = 1` tidak boleh mengirim pengaturan apa pun, jadi komando tidak mengirim satu pun (`--timeout`-nya lalu hanya menghentikan penantian, bukan query). Profile dengan `readonly = 2` mendapat timeout dan pengaturan lain, tetapi komando tidak mengirim `readonly` untuknya. Untuk batas yang keras, beri conn user seperti itu dengan hanya grant `SELECT`. User yang settings profile-nya membaca query sebagai bahasa lain (`dialect = 'kusto'` atau `'prql'`) ditolak (`SQL_SAFE_SETTINGS_REQUIRED`): komando hanya memeriksa SQL ClickHouse.
- Teks dalam `$$...$$` dan nama atau teks dengan huruf di luar ASCII di luar kutipan ditolak (`SQL_HIDDEN_CODE`): pakai `'...'` (dengan `\'` untuk kutipan) dan `` `...` ``. `FORMAT` dan `INTO OUTFILE` juga ditolak: komando membaca barisnya sendiri (`-o csv`, `-o tsv`).
- `db explain` adalah `EXPLAIN indexes = 1`; ClickHouse tidak punya `EXPLAIN ANALYZE` (`NOT_SUPPORTED`).
- **User.** `db user add` membuat user SQL dengan hash SHA-256 dari kata sandi dan salt acak yang dihitung komando, sehingga kata sandi tidak pernah sampai ke server atau query log-nya; `--no-login` membuat role. User conn butuh access management (atau `CREATE USER` dan `GRANT`). `db grant` menerima `--on DB.*`, `DB.TABLE`, `*.*`, `database:DB`, atau `table:DB.TABLE` (`SELECT`, `INSERT`, `ALTER`, `CREATE`, `DROP`, `TRUNCATE`, `OPTIMIZE`, `SHOW`, `KILL QUERY`, ...), dan `--role NAME`. User yang didefinisikan di `users.xml` server tidak bisa diubah dengan SQL.
- **Backup:** lihat [Backup dan restore](#back-up-and-restore).

## Snowflake

Conn Snowflake menerima perintah `db` yang sama, dalam SQL Snowflake. komando berbicara SQL API Snowflake (HTTPS) dengan klien miliknya sendiri, sehingga tidak ada yang lain yang perlu diinstal:

```bash
komando secret set analytics-key < rsa_key.p8      # private key user (login key-pair)
komando db add analytics 'snowflake://APP_RO@myorg-myaccount/ANALYTICS/PUBLIC?warehouse=REPORTING&role=ANALYST_RO' --password-ref secret:analytics-key
komando db query analytics "select region, sum(total) from orders where placed > ? group by 1" --arg 2026-01-01
komando db schema analytics public.orders          # kolom, primary key, clustering key
komando db explain analytics "select * from orders where id = 42"
komando db activity analytics                      # query yang berjalan dan mengantre
komando db kill analytics 4387013457812345         # pid yang ditampilkan db activity
komando db user show analytics APP_RO              # role-nya, dan apa yang boleh dilakukan tiap role
```

- **URL-nya.** Account ditaruh di tempat jenis lain punya host: account identifier yang ditampilkan Snowflake (`myorg-myaccount`, atau locator dengan region seperti `xy12345.eu-central-1`; `...snowflakecomputing.com` juga berfungsi). Path adalah `/DATABASE/SCHEMA`, keduanya opsional; opsinya adalah `warehouse=`, `role=`, dan `ca=secret:NAME` (proxy yang memeriksa TLS). Selalu HTTPS di port 443 dengan sertifikat diperiksa.
- **Login.** SQL API Snowflake tidak menerima kata sandi, jadi `--password-ref` berisi satu dari dua hal:
  - **Private key** (PEM, `-----BEGIN PRIVATE KEY-----`) untuk login key-pair. komando menandatangani token berumur pendek dengannya untuk setiap jam pemakaian. Snowflake perlu mengenal setengah publiknya: `ALTER USER APP_RO SET RSA_PUBLIC_KEY = '...'`. Simpan key tanpa passphrase (vault mengenkripsinya): `openssl pkcs8 -topk8 -nocrypt -in rsa_key.p8 | komando secret set analytics-key`. Key adalah key RSA, PKCS#8 (`BEGIN PRIVATE KEY`) atau PKCS#1 (`BEGIN RSA PRIVATE KEY`). Key dengan passphrase ditolak; kesalahan menampilkan baris `openssl` yang menghilangkannya. Saat Snowflake menolak key (`DB_AUTH`), hint menampilkan fingerprint key: bandingkan dengan `RSA_PUBLIC_KEY_FP` di `DESC USER APP_RO`.
  - **Programmatic access token** (`ALTER USER APP_RO ADD PROGRAMMATIC ACCESS TOKEN ...`), yang dibiarkan Snowflake menggantikan tempat kata sandi.

  Login browser (SSO) dan OAuth tidak didukung.
- **Read-only adalah pemeriksaan komando, bukan milik Snowflake.** Snowflake tidak punya mode read-only yang bisa dinyalakan komando, dan setiap pernyataan adalah sesi tersendiri, jadi tidak ada yang bisa di-rollback. Tanpa `--write`, komando hanya mengirim pernyataan yang dinilainya sebagai pembacaan, satu per permintaan, dan meminta Snowflake menjalankan tepat satu pernyataan. Pernyataan yang bukan pembacaan (`INSERT`, `CREATE`, `COPY`, `CALL`, ...) butuh `--write`, berjalan sendirian, dan dry run hanya melaporkannya. Fungsi yang memanggil ke luar Snowflake (external function) tertangkap saat dibuat, bukan saat dipanggil dengan nama. Beri conn role yang hanya boleh membaca, agar kesalahan pada pemeriksaan komando juga tidak bisa mengubah apa pun:

  ```sql
  CREATE ROLE ANALYST_RO;
  GRANT USAGE ON WAREHOUSE REPORTING TO ROLE ANALYST_RO;
  GRANT USAGE ON DATABASE ANALYTICS TO ROLE ANALYST_RO;
  GRANT USAGE ON ALL SCHEMAS IN DATABASE ANALYTICS TO ROLE ANALYST_RO;
  GRANT SELECT ON ALL TABLES IN DATABASE ANALYTICS TO ROLE ANALYST_RO;
  GRANT SELECT ON FUTURE TABLES IN DATABASE ANALYTICS TO ROLE ANALYST_RO;
  GRANT ROLE ANALYST_RO TO USER APP_RO;
  ALTER USER APP_RO SET DEFAULT_ROLE = ANALYST_RO;
  ```

  dan sebut di URL (`?role=ANALYST_RO`).
- **Merusak:** `DROP`, `TRUNCATE`, `CREATE OR REPLACE` (menghapus apa yang memiliki nama itu), user, role, grant, dan policy, warehouse, integration, share, dan `ALTER ACCOUNT`, file stage (`PUT`, `GET`, `REMOVE`, `COPY INTO @stage`), URL dan kredensial dalam pernyataan, `CALL` dan `EXECUTE IMMEDIATE`, dan fungsi `SYSTEM$` selain yang hanya membaca (`SYSTEM$CANCEL_QUERY` termasuk di antaranya).
- Blok Snowflake Scripting (`BEGIN ... END`, `DECLARE`) dikirim sebagai satu pernyataan: `EXECUTE IMMEDIATE $$ ... $$`. `BEGIN` dan `COMMIT` ditolak. `/*` di dalam komentar, `$$` tepat setelah nama, dan nama atau teks dengan huruf di luar ASCII di luar kutipan ditolak (`SQL_HIDDEN_CODE`).
- **Warehouse.** Sebagian besar query membutuhkannya: berikan dengan `?warehouse=`. `SELECT 1` dan `SHOW` tidak, jadi `komando test` berfungsi tanpanya.
- `db schema`, `db sizes`, dan `db activity` membaca database milik URL (`INFORMATION_SCHEMA`); activity menampilkan query yang boleh dilihat role conn. `db explain` adalah `EXPLAIN` (tidak dijalankan); `--analyze` tidak tersedia. Nama tanpa kutip berhuruf besar, jadi `db schema analytics orders` menemukan `ORDERS`.
- **Tidak tersedia** (`NOT_SUPPORTED`): `db dump` dan `db restore` (lihat [Backup dan restore](#back-up-and-restore)), `db user add`, `passwd`, dan `rm`, `db grant` dan `revoke` (kirim SQL-nya dengan `db query --write`), dan `db locks`.

## BigQuery

Conn BigQuery menerima perintah `db` yang sama, dalam GoogleSQL. komando berbicara REST API BigQuery dengan klien miliknya sendiri (bukan Google Cloud SDK), sehingga tidak ada yang lain yang perlu diinstal:

```bash
komando db add warehouse 'bigquery://my-project/analytics?location=EU'   # login gcloud
komando db query warehouse --dry-run "select * from orders where placed > '2026-01-01'"  # apa yang akan dibacanya
komando db query warehouse "select region, sum(total) from orders where placed > ? group by 1" --arg 2026-01-01
komando db query warehouse "select * from logs.events" --max-bytes 200GB   # izinkan pembacaan yang lebih besar
komando db schema warehouse analytics.orders        # kolom, primary key, partisi, clustering
komando db explain warehouse "select * from orders where id = 42"
komando db activity warehouse                       # job yang belum selesai
komando db kill warehouse 4387013457812345          # pid yang ditampilkan db activity
```

- **URL-nya.** `bigquery://PROJECT[/DATASET]?location=EU`: project tempat job berjalan (dan ditagih), dataset default untuk nama tanpa dataset, dan tempat job berjalan (`EU`, `US`, `europe-west1`, ...; tanpanya BigQuery memilih dari tabelnya, dan `db activity` dan `db sizes` memakai lokasi dataset, atau `US`). Opsi lain: `ca=secret:NAME` (proxy yang memeriksa TLS) dan `endpoint=URL` (emulator, atau alamat Private Service Connect seperti `https://bigquery-NAME.p.googleapis.com`). Ini HTTPS dengan sertifikat diperiksa; `tls=` ditolak. Endpoint `http://` (emulator) diizinkan; `komando doctor` memperingatkan saat melewati jaringan.
- **Login.** Sama seperti conn `gs://`: login gcloud (`gcloud auth application-default login`, `GOOGLE_APPLICATION_CREDENTIALS`, atau metadata server di Google Cloud), atau key service account (file JSON) di `--password-ref`:

  ```bash
  komando secret set warehouse-key < key.json
  komando db add warehouse 'bigquery://my-project/analytics' --password-ref secret:warehouse-key
  ```

  Login gcloud hanya dikirim ke host milik Google sendiri (`https://*.googleapis.com`); emulator mendapat key yang disebut conn, atau tanpa login sama sekali. Login butuh `roles/bigquery.jobUser` pada project dan `roles/bigquery.dataViewer` pada dataset yang dibacanya; beri conn yang hanya membaca tidak lebih dari itu.
- **Setiap pernyataan diperiksa BigQuery lebih dulu.** komando mengirim setiap pernyataan sebagai dry run (tidak menjalankan apa pun dan tidak berbiaya), yang menyatakan jenis pernyataan yang dilihat BigQuery dan berapa byte yang akan dibacanya. Tanpa `--write`, hanya apa yang disebut BigQuery `SELECT` yang berjalan, setelah pemeriksaan komando sendiri. Penulisan (`INSERT`, `CREATE`, `MERGE`, ...) butuh `--write` dan berjalan sendirian (setiap pernyataan adalah job tersendiri, jadi tidak ada yang bisa di-rollback).
- **Biaya.** BigQuery menagih menurut byte yang dibaca query. Query yang akan membaca lebih dari `--max-bytes` (default `10GB`; `0` berarti tanpa batas) tidak dijalankan (`DB_BYTES_LIMIT`), dan setiap job membawa batas itu (`maximumBytesBilled`), sehingga BigQuery menghentikannya juga. Setiap hasil menyatakan `bytes_processed` (teks: `(BigQuery read 1.2 GiB)`). `--dry-run` (dengan atau tanpa `--write`) adalah dry run milik BigQuery sendiri untuk setiap pernyataan, juga `SELECT`: menampilkan apa yang akan dibaca masing-masing dan tidak menjalankan apa pun. Eksekusi yang timeout membatalkan job-nya. Ukuran dihitung dalam pangkat 1024: `10GB` adalah 10 GiB, `200GB` adalah 200 GiB. Setiap job yang dimulai komando dinamai `komando_` ditambah ID acak dan punya label `komando=<siapa yang menjalankan>`, sehingga job komando dan biayanya bisa ditemukan di riwayat job BigQuery.
- **Placeholder** adalah `?`, dan nilai `--arg` masuk sebagai `STRING`: BigQuery tidak mengubah teks menjadi angka sendiri, jadi tulis `CAST(? AS INT64)`.
- **Merusak:** `DROP`, `TRUNCATE`, `CREATE OR REPLACE` (menghapus apa yang memiliki nama itu), `LOAD DATA OVERWRITE`, `GRANT` dan `REVOKE`, row access policy, reservation, capacity commitment, dan opsi project atau organisasi, `EXPORT DATA` (menulis di luar BigQuery), `EXTERNAL_QUERY` dan remote function (menjangkau layanan lain), `CALL` dan `EXECUTE IMMEDIATE`.
- **Script** (`DECLARE`, `SET`, `IF`, `BEGIN ... END`) ditolak: komando mengirim setiap pernyataan sebagai job tersendiri, jadi variabel tidak akan terbawa. `BEGIN` dan `COMMIT TRANSACTION` juga ditolak. `/*` di dalam komentar, raw string dengan backslash sebelum kutipan, dan nama atau teks dengan huruf di luar ASCII di luar kutipan ditolak (`SQL_HIDDEN_CODE`); komentar `#`, teks dengan tiga kutipan, dan `` `names` `` dibaca seperti BigQuery membacanya.
- `db schema` membaca API (tanpa query, tanpa biaya): dataset milik URL, atau setiap dataset di project, dan tabel yang diminta sebagai `TABLE`, `DATASET.TABLE`, atau `PROJECT.DATASET.TABLE`. `db explain` adalah dry run (jenis pernyataan, byte, tabel yang dibaca, kolom hasil); `--analyze` tidak tersedia. `db activity` membaca `region-LOCATION.INFORMATION_SCHEMA.JOBS` (melihat job orang lain butuh `bigquery.jobs.listAll`) dan `db sizes` membaca `INFORMATION_SCHEMA.TABLE_STORAGE`.
- **Tidak tersedia** (`NOT_SUPPORTED`): `db dump` dan `db restore` (lihat [Backup dan restore](#back-up-and-restore)), `db user`, `db grant` dan `revoke` (IAM Google Cloud), dan `db locks`.

## Batasan

- `--login ask` bergantung pada komando membedakan agen AI dari orang, hanya lewat lingkungan agen. Program apa pun milik user yang sama bisa memalsukan jendela komando, mengganti binary-nya, atau membaca memorinya; lihat [Server](servers.md#limits). File di bawah `~/.postgresql` (`root.crt` di sana) dibaca seperti yang dilakukan Postgres.

**SQL Server**

- Kolom Always Encrypted tidak didukung.
- komando menolak opsi URL yang tidak dikenalnya. `TrustServerCertificate` juga ditolak: tulis `tls=skip-verify` (dengan `encrypt=true`) sebagai gantinya.

**Oracle**

- komando menolak opsi URL yang tidak dikenalnya, dan nama service dengan karakter selain huruf, angka, dan `_ $ # . -`.
- `db user add` dan `db user passwd` menolak kata sandi yang memuat `"` atau pindah baris: Oracle tidak bisa mengutipnya.
- `EXPLAIN PLAN` yang diketik ke `db query` ditolak: pakai `db explain`.
- Trigger `ON DATABASE` (trigger logon bisa mengunci semua orang di luar) bersifat merusak.

**ClickHouse**

- `tls=true` di port 8123 ditolak: 8123 adalah HTTP polos, 8443 adalah HTTPS.
- Backslash di dalam nama yang dikutip (`` `\x75rl` ``) ditolak, karena ClickHouse mengubahnya menjadi huruf lain.
- `cluster()` dan tabel `Distributed` memakai cluster yang disiapkan admin, jadi dihitung sebagai pembacaan.
- komando tidak memakai proxy dari `HTTPS_PROXY` dan tidak mengikuti redirect. Untuk lewat server, pakai `--via`.

**Snowflake**

- Klien Snowflake milik komando dibangun dari dokumentasi Snowflake dan diuji terhadap server pengganti, bukan terhadap account Snowflake sungguhan. Laporkan apa pun yang tidak berfungsi.
- `PUT` dan `GET` (file stage dari dan ke komputer ini) tidak berjalan: SQL API Snowflake tidak menerimanya. Pakai `COPY INTO` dengan stage, atau tool milik Snowflake sendiri.
- `SET` dan `USE` dihitung sebagai pembacaan: keduanya hanya mengubah sesi permintaan itu, yang berakhir bersamanya.
- `db info` menampilkan ukuran database hanya bila conn menyebut warehouse.
- komando tidak memakai proxy dari `HTTPS_PROXY` dan tidak mengikuti redirect. Untuk proxy perusahaan yang memeriksa TLS, pakai `ca=secret:NAME` dan jangkau lewat `--via` atau VPN `proxy`.

**BigQuery**

- Klien BigQuery milik komando dibangun dari referensi REST Google dan diuji terhadap server pengganti, bukan terhadap project Google Cloud sungguhan. Laporkan apa pun yang tidak berfungsi.
- `db shell`, `db info`, `db activity`, dan `db sizes` selalu memakai batas `--max-bytes` default.
- `db schema` mencantumkan paling banyak 10.000 tabel.
- `db activity` menampilkan job yang belum selesai dari dua hari terakhir, tanpa milik komando sendiri.
- `MERGE` dengan `WHEN NOT MATCHED BY SOURCE` bisa mengubah setiap baris, jadi bersifat merusak. `MERGE ... WHEN MATCHED THEN UPDATE` biasa adalah perubahan normal.
- `db explain` pada perubahan tidak butuh `--write`, tetapi pernyataan yang menjangkau di luar BigQuery (`EXTERNAL_QUERY`) mempertahankan penilaiannya.

## Pemecahan masalah

| Kesalahan | Exit | Artinya | Yang perlu dilakukan |
|-------|------|---------|----------------------|
| `DB_AUTH` | 4 | nama user atau kata sandi salah | periksa dengan `komando conn show CONN`; perbaiki dengan `komando conn edit CONN --password-ref ...` |
| `DB_NOT_FOUND` | 3 | database tidak ada | periksa path di URL conn |
| `DB_PRIVILEGE` | 5 | user conn kekurangan hak (misalnya untuk melihat lock wait di `db locks`, atau untuk mengelola user) | minta hak itu kepada admin database |
| `DB_BYTES_LIMIT` | 6 | query BigQuery akan membaca lebih dari `--max-bytes` (default 10GB), jadi tidak dijalankan | persempit query, atau naikkan `--max-bytes` setelah seseorang setuju |
| `NOT_SUPPORTED` | 2 | perintah tidak berfungsi untuk jenis ini: `dump` dan `restore` di SQL Server, Oracle, ClickHouse, Snowflake, BigQuery, dan MongoDB; `--analyze` di Oracle, ClickHouse, Snowflake, dan BigQuery; perintah SQL di MongoDB | hint menyatakan apa yang dipakai sebagai gantinya |
| `OUTPUT_TRUNCATED` | 1 | ekspor CSV atau TSV lebih besar dari `--max-output`; tidak ada yang dicetak | naikkan `--max-output`, persempit SQL, atau pakai `komando db dump` |
| `SQL_HIDDEN_CODE` | 2 | SQL yang tidak bisa dibaca komando seperti server membacanya | tulis ulang seperti yang dinyatakan hint |
| `DUMP_UNSUPPORTED` | 2 | dump milik komando sendiri tidak bisa menulis sebuah objek; pesan menyebutnya | dump dengan `--run-on HOST` (pg_dump), atau dump tabel lain dengan `--table` |
| `TOOL_MISSING` | 3 | `pg_dump`, `mysqldump`, atau `pg_restore` tidak terinstal di tempat seharusnya berjalan | instal di sana, atau pilih server lain dengan `--run-on` |
| `TOOL_TOO_OLD` | 5 | `pg_dump` lebih lama dari server database, atau `pg_restore` lebih lama dari arsip | instal package yang disebut hint |
| `CONN_UNREACHABLE` | 4 | tool tidak bisa menjangkau database dari server tempatnya berjalan | tambahkan conn untuk alamat yang dilihat server itu (lihat [`--run-on`](#run-the-dump-on-a-server-you-choose---run-on-host)) |
| `UNSAFE_BACKUP` | 6 | file backup berisi perintah klien (`\!`, `system`, `\i`) atau SQL yang tidak bisa diikuti komando | hapus baris itu bila file bukan dari dump yang tepercaya |
| `RESTORE_UNSUPPORTED` | 2 | file berpindah database (`\connect`) | dump satu database tanpa `--create` |
| `RESTORE_FAILED` | 5 | restore berhenti di sebuah baris; PostgreSQL tidak mengubah apa pun, MySQL mempertahankan apa yang berjalan sebelumnya | perbaiki file, lalu restore lagi |
| `DB_USER_IN_USE` | 8 | user memiliki objek atau punya sesi | akhiri sesinya (`komando db activity CONN --all`, lalu `komando db kill CONN PID --session`) |
| `NEEDS_TERMINAL` | 2 | `db shell` dijalankan tanpa terminal | pakai `db query` |

`db dump` dan `db restore` melaporkan kesalahan koneksi yang sama dengan `db query`. Setiap kode ada di [Kode kesalahan](error-codes.md).

## Referensi

### Cara nilai kembali (JSON)

| Tipe kolom | Nilai |
|------------|-------|
| date | `"2024-02-29"` |
| timestamp / datetime (tanpa zona waktu) | `"2024-02-29 10:11:12.5"`, tanpa `Z` |
| timestamptz | `"2024-02-29T08:00:00Z"` (satu instan, dalam UTC) |
| tanggal nol MySQL | `"0000-00-00 00:00:00"`, seperti tersimpan |
| biner (bytea, blob) | `{"base64": "..."}`, juga bila kosong; output teks menampilkan heksadesimal `\x` seperti psql |
| integer yang terlalu besar untuk JSON (di atas 2^53) | string; seluruh kolom lalu berupa string |
| money, xml, dan tipe lain | teks, dengan tipe disebut di `columns` |
| SQL Server decimal, money | teks dengan setiap digit (`"12.50"`) |
| SQL Server uniqueidentifier | `"6F9619FF-8B86-D011-B42D-00C04FC964FF"` |
| Oracle DATE (juga memuat waktu dalam sehari) | `"2026-11-09 13:04:05"` |
| ClickHouse Decimal, Int128, dan yang lebih lebar | teks dengan setiap digit (`"12.50"`) |
| ClickHouse Array, Map, Tuple | array dan objek JSON |
| Snowflake NUMBER dengan scale | teks dengan setiap digit (`"12.50"`) |
| Snowflake VARIANT, OBJECT, ARRAY | nilai, array, dan objek JSON |
| Snowflake DATE, TIME, TIMESTAMP | teks dalam bentuk kolom: `TIMESTAMP_NTZ` tanpa zona, `TIMESTAMP_LTZ` dalam UTC, `TIMESTAMP_TZ` dengan offset-nya |
| Snowflake BINARY | `{"base64": "..."}` |
| BigQuery INT64 | angka |
| BigQuery BYTES | `{"base64": "..."}` |
| BigQuery DATE, TIME, DATETIME, GEOGRAPHY, INTERVAL | teks, seperti yang ditulis BigQuery |
| BigQuery NUMERIC, BIGNUMERIC | teks dengan setiap digit |
| BigQuery TIMESTAMP | `"2026-11-09T13:04:05.123456Z"` (UTC) |
| BigQuery STRUCT, ARRAY, JSON | objek, array, dan nilai JSON |
