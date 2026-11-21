# Storage: bucket dan file server

Telusuri, unduh, unggah, dan bagikan file di bucket yang kompatibel dengan S3, Google Cloud Storage, Azure Blob Storage, di server WebDAV, FTPS, SFTP, dan FTP, serta di share Windows (SMB), semuanya dengan perintah yang sama.

## Menambah bucket

```bash
komando storage add backups 's3://AKIAEXAMPLE@my-bucket/db?region=eu-west-1' --ask-password
komando test backups                          # bisakah komando menjangkaunya dan login?
```

Jika diketik tanpa argumen, `komando storage add` menanyakan setiap bagian selangkah demi selangkah.

Untuk S3, bagian user di URL adalah access key ID. Secret access key masuk ke vault, seperti kata sandi: `--ask-password` menanyakannya (disembunyikan), atau simpan dulu lalu rujuk:

```bash
komando secret set backups-secret
komando storage add backups 's3://AKIAEXAMPLE@my-bucket/db?region=eu-west-1' --password-ref secret:backups-secret
```

Pengaturan paling aman adalah access key yang hanya bisa melakukan apa yang dibutuhkan komando (read-only untuk laporan, hanya satu bucket). Layanannya sendiri lalu memberlakukannya.

Folder di URL adalah tempat conn dimulai. Key bersifat relatif terhadapnya dan tidak bisa keluar darinya (`../` ditolak, di dry run juga).

Di terminal, perintah yang tidak menyebut storage atau file akan menanyakannya, dengan daftar storage Anda. Jika diketik tanpa argumen, `komando storage list` menanyakan storage mana. Agen AI atau script mendapat `USAGE` (exit 2) dengan contoh lengkap di hint.

| Jenis | Contoh URL | Catatan |
|-------|------------|---------|
| S3 dan yang kompatibel | `s3://ACCESS_KEY_ID@my-bucket/backups?endpoint=https://minio.internal:9000&region=us-east-1` | AWS S3, MinIO, Cloudflare R2, Wasabi, DigitalOcean Spaces, Backblaze B2, Garage. Hilangkan `endpoint` untuk AWS. Bila DNS endpoint salah atau tidak ada, tambahkan `&resolve=IP` (atau `IP:PORT`): komando tersambung ke alamat itu dan tetap memeriksa sertifikat terhadap nama endpoint. |
| Google Cloud Storage | `gs://my-bucket/backups` | Login seperti gcloud (application default credentials), atau dengan key service account di `--password-ref`. Lihat [Google Cloud dan Azure](#add-a-google-cloud-or-azure-bucket). |
| Azure Blob Storage | `azblob://ACCOUNT@my-container/backups` | Key storage account, atau token SAS, di `--password-ref`. |
| WebDAV | `webdavs://alice@cloud.example.com/remote.php/dav/files/alice` | Nextcloud, ownCloud, NAS, Apache, atau nginx. Tambahkan `?tls=skip-verify` hanya untuk sertifikat self-signed yang Anda percayai. `webdav://` (tanpa enkripsi) ditolak tanpa `?insecure=1`. |
| FTPS | `ftps://deploy@files.example.com/public_html` | FTP dengan TLS. Tambahkan `?tls=skip-verify` hanya untuk sertifikat self-signed yang Anda percayai. |
| SFTP | `sftp://deploy@files.example.com/uploads` | Akses file lewat SSH, untuk akun tanpa shell. Path dimulai dari root server (di hosting, sering folder home Anda). |
| SMB (share Windows) | `smb://alice@fileserver.corp.lan/team/reports?domain=CORP` | File server Windows, Samba, NAS, atau Azure Files. Bagian pertama path adalah share. Lihat [Share Windows](#add-a-windows-share-smb). |
| FTP | `ftp://deploy@files.example.com/www?insecure=1` | Tanpa enkripsi: kata sandi dan file berjalan dalam teks polos. Ditolak tanpa `?insecure=1`. Pilih FTPS atau SFTP. |

**Sertifikat dari CA Anda sendiri** (MinIO perusahaan, atau proxy yang memeriksa TLS): simpan CA dan sebut di URL, untuk S3, Google Cloud, dan Azure. komando lalu mempercayai CA itu selain yang lazim, dan tetap memeriksa sertifikat sepenuhnya. Tanpanya, error-nya `STORAGE_TLS` dengan hint ini.

```bash
komando secret set corp-ca < corp-ca.crt
komando storage add minio 's3://AKIAEXAMPLE@media?endpoint=https://minio.corp.lan:9000&ca=secret:corp-ca' --ask-password
```

### Login AWS (SSO, role, key sementara)

Sebagai ganti key yang tersimpan, sebuah conn bisa memakai profil dari `~/.aws/config` (`default` memakai rantai login AWS yang lazim). komando membaca profil sendiri, tanpa aws CLI, dan mengambil key baru setiap kali, sehingga SSO, role yang di-assume, dan key sementara bekerja seperti yang Anda atur:

```bash
komando storage add backups 's3://my-bucket/db?region=eu-west-1' --option aws_profile=prod
```

- `AWS_LOGIN_REQUIRED`: login SSO sudah kedaluwarsa. Seseorang menjalankan `komando login aws --profile prod` sekali. Perintah itu membuka halaman login dan menyimpan login di tempat aws CLI menyimpannya, sehingga keduanya berbagi.
- `AWS_PROFILE_NOT_FOUND`: profil tidak ada di `~/.aws/config`.

Registry Amazon ECR memakai login AWS dengan cara yang sama (lihat [Container registry](registry.md)).

## Menelusuri dan membaca file

```bash
komando storage list backups                  # satu tingkat (sampai 1000 entri; -n/--limit)
```

```text
SIZE      MODIFIED              KEY
DIR       -                     2026/
48.2 MiB  2026-11-12 02:00 UTC  app.sql.gz
```

```bash
komando storage list backups 2026/ --recursive        # semua di bawah 2026/
komando storage cat backups logs/app.log --tail 50    # baca teks tanpa mengunduhnya
komando storage cat backups config/app.env --head 20
```

- `storage list backups 2026` dan `storage list backups 2026/` sama-sama mencantumkan isi folder 2026, di setiap jenis storage. Di bucket, prefix yang tidak menyebut folder (`storage list backups logs/app-2026-11`) mencantumkan key yang diawali prefix itu.
- Mencantumkan folder yang kosong atau tidak ada adalah `FOLDER_NOT_FOUND` (exit 3), di setiap jenis storage. Objek "folder marker" kosong yang dibuat konsol S3 dikeluarkan dari daftar dan unduhan.
- `cat` hanya menampilkan teks; biner adalah `NOT_TEXT` (exit 2), jadi unduh saja. Pakai `--head` atau `--tail` (salah satunya, 1 baris atau lebih). Perintah ini membaca paling banyak `--max-bytes` (1 MiB secara default) dan menyatakan di stderr bila memotong file.

## Mengunduh dan mengunggah

```bash
komando download backups 2026/app.sql.gz                    # ke folder saat ini
komando upload backups ./app.sql.gz 2026/app.sql.gz
```

```text
backups: app.sql.gz (48.2 MiB)
uploaded ./app.sql.gz -> 2026/app.sql.gz (48.2 MiB), replaced the old object
```

Jika diketik tanpa argumen, `komando download` menanyakan server atau storage mana, lalu path-nya.

```bash
komando download backups reports/q3.pdf --to ~/Downloads/   # ke sebuah folder
komando download backups logs/app.log --to - | less         # ke stdout
komando download backups reports -r --to ./reports          # seluruh folder
komando upload backups ./a.pdf reports/                     # menyimpan reports/a.pdf
komando upload backups ./reports reports -r                 # seluruh folder
```

`komando storage download` dan `komando storage upload` melakukan hal yang sama untuk conn storage saja, dan `komando cp` menulis salinan yang sama dengan `cp ./a.pdf backups:reports/`. Unggah folder (`-r`) hanya mengirim file yang baru dan berubah, seperti `komando sync`.

- Unduhan tidak pernah menimpa file di komputer Anda kecuali Anda menambahkan `--overwrite`. File hanya bisa dibaca Anda. `--to` menerima nama file, folder (yang sudah ada, atau nama yang diakhiri `/`: file mempertahankan namanya di dalamnya), atau `-` untuk mengalirkannya ke stdout (`-o` apa pun: jawaban komando sendiri lalu menuju stderr). Unduhan folder mempertahankan file yang sudah ada di sana.
- `komando storage upload CONN - KEY` (atau `upload CONN - KEY`) mengalirkan stdin ke KEY; `--size N` membuat aliran dengan panjang lain gagal dengan `SIZE_CONFLICT` dan tidak mengganti apa pun. Lihat [Mengalirkan file lewat stdout atau stdin](files.md#stream-a-file-through-stdout-or-stdin).
- Unggahan menggantikan objek dengan key yang sama; hasilnya menyatakan `"replaced": true`. Key yang diakhiri `/` adalah folder.
- Di conn yang dilindungi, `upload` bertanya dulu kepada orang di terminal; agen AI atau script menambahkan `--yes` setelah seseorang setuju.
- `--dry-run` tidak mengirim apa pun, tetapi memeriksa: `upload` menampilkan key dan apakah akan menggantikan objek, `download` ke mana file akan pergi dan ukurannya.
- `--continue` melanjutkan satu file yang terputus. Unduhan mempertahankan bagian yang sudah ada di komputer Anda bila cocok dengan objek (sha256), mengambil sisanya, dan memeriksa seluruh file. Unggahan hanya bisa dilanjutkan di conn SFTP, FTP, FTPS, atau SMB; S3, Google Cloud Storage, Azure Blob, dan WebDAV menyimpan file secara utuh dan tidak bisa menambah ke satu file, jadi file yang terputus di sana berhenti dengan `RESUME_UNSUPPORTED` (unggah lagi tanpa `--continue`). Storage tidak bisa menghitung jumlah dari sebagian objek, jadi komando membaca bagian yang sudah disalin sekali lagi untuk memeriksanya.
- `komando cp` juga menyalin antara dua conn storage, atau antara conn dan server: `komando cp backups:2026/db.sql.gz dr-backups:2026/`. Data mengalir lewat komputer Anda dan tidak pernah disimpan di disknya.
- Untuk menjaga sebuah folder tetap sinkron dan hanya mengirim file yang baru dan berubah, pakai `komando sync` (lihat [File](files.md)):

```bash
komando sync ./site backups:site --exclude '*.tmp'
komando sync backups:2026/ ./restore
```

## Membagikan file dengan link sementara

```bash
komando storage link backups 2026/app.sql.gz --expires 24h   # default 1h, paling lama 7d
```

```text
https://my-bucket.s3.eu-west-1.amazonaws.com/db/2026/app.sql.gz?X-Amz-Algorithm=AWS4-HMAC-SHA256&...
```

```bash
komando storage link media site/report.pdf                   # Google Cloud dan Azure juga
komando storage link backups 2026/app.sql.gz --endpoint https://files.example.com
```

- Untuk agen AI, `storage link` butuh jawaban ya dari seseorang (`--reveal`): link adalah file apa adanya, melewati penyembunyian yang diterapkan `storage cat` dan `storage download`. Tanpanya perintah berhenti dengan `SENSITIVE_FILE`; untuk file yang merupakan secret menurut namanya (`.env`, key) selalu begitu.
- Link berfungsi untuk siapa pun yang memilikinya sampai kedaluwarsa. Bagikan seperti kata sandi. Link tidak ditulis ke riwayat audit.
- Di conn yang dilindungi, `link` bertanya dulu kepada orang di terminal; agen AI atau script menambahkan `--yes` setelah seseorang setuju.
- Link memakai alamat di URL conn. Saat komando menjangkau storage lewat `--via`, hasilnya memperingatkan bahwa orang di luar jaringan itu tidak bisa membukanya. Pakai `--endpoint` untuk menandatanganinya bagi alamat publik.
- Unduhan mempertahankan nama file, juga dengan huruf non-ASCII.
- Conn yang login dengan profil AWS (SSO, role yang di-assume) menandatangani link dengan key sementara, jadi link berhenti berfungsi saat key itu kedaluwarsa, sering setelah satu jam, apa pun kata `--expires`. Hasilnya memperingatkannya. Untuk link yang tahan lama, beri conn access key tersendiri.

## Membuat folder, memindahkan dan mengganti nama file

```bash
komando storage mkdir backups reports/2026 --dry-run       # periksa dulu
komando storage mkdir backups reports/2026                 # induk yang hilang juga
komando storage mv backups db/old.sql.gz archive/          # ke sebuah folder, nama sama
komando storage mv backups reports/draft.pdf reports/q3.pdf --overwrite
komando storage chmod backups 0640 config/app.yml          # hanya SFTP
```

```text
would move db/old.sql.gz -> archive/old.sql.gz (48.1 MiB, by a copy that is checked before the original is deleted; replaces a file: no)
```

- `mkdir` membuat folder dan folder di atasnya yang hilang. Folder yang sudah ada tidak masalah. S3, Google Cloud, dan Azure tidak punya folder sungguhan: `mkdir` menyimpan folder marker kosong (`reports/2026/`), seperti konsol web mereka, sehingga `storage list` menampilkan folder kosong itu.
- `mv` memindahkan satu file atau folder di dalam satu conn. `DST` yang diakhiri `/` adalah folder: file pindah ke dalamnya dan mempertahankan namanya. File yang sudah ada di `DST` menghentikan pemindahan (`FILE_EXISTS`) kecuali Anda menambahkan `--overwrite`; folder di `DST` tidak pernah digantikan.
- Di file server (SFTP, FTP, FTPS, WebDAV, SMB) `mv` adalah satu rename di server, dan memindahkan folder juga. Bila server tidak bisa me-rename menimpa file, `--overwrite` lebih dulu memindahkan file lama ke samping (`.komando-old-NAMA`) dan mengembalikannya bila rename gagal, sehingga pemindahan yang gagal tidak pernah menghilangkannya.
- Path ditulis apa adanya: `.` atau `//` di dalamnya berhenti dengan `USAGE`.
- S3, Google Cloud, dan Azure tidak bisa me-rename. Di sana `mv` menyalin objek di server, memeriksa bahwa salinan punya ukuran dan checksum yang sama, dan baru kemudian menghapus aslinya (`method: copy_then_delete` di hasilnya). Bila pemeriksaan gagal, aslinya tetap dan salinannya dihapus (`MOVE_FAILED`). Perintah ini memindahkan satu objek sekali waktu, bukan folder (`STORAGE_UNSUPPORTED`). Di bucket yang menyimpan versi lama, versi lama dari aslinya tetap ada.
- `chmod` mengatur mode Unix file atau folder, dalam angka (`0644`, `640`, `2775`), dan hasilnya menyatakan mode lamanya juga. Hanya server SFTP yang punya mode; di jenis lain perintah berhenti dengan `STORAGE_UNSUPPORTED` sebelum komando menghubungi storage.
- Ketiganya adalah perubahan, seperti `upload`: coba dengan `--dry-run`, conn yang dilindungi bertanya dulu kepada seseorang (agen AI atau script menambahkan `--yes` setelah seseorang setuju), dan setiap eksekusi ada di `komando audit`.

## Menghapus file

```bash
komando storage rm backups --prefix daily/ --older-than 30d --dry-run   # daftar backup lama
komando storage rm backups --prefix daily/ --older-than 30d             # hapus
komando storage rm backups 2026/old.sql.gz                              # key yang persis
```

```text
SIZE      MODIFIED              KEY
48.1 MiB  2026-10-01 02:00 UTC  daily/app-2026-10-01.sql.gz
48.0 MiB  2026-10-02 02:00 UTC  daily/app-2026-10-02.sql.gz
would delete 2 objects (96.1 MiB)
```

Objek yang dihapus hilang (kecuali bucket menyimpan versi lama, lihat di bawah). Di terminal Anda komando bertanya dulu: Anda mengetik nama key, atau untuk beberapa objek jumlahnya. Dengan `--prefix`, komando lebih dulu mencantumkan apa yang akan hilang (20 objek pertama, jumlah, dan ukurannya). Jawaban lain membatalkan dan tidak menghapus apa pun. Agen AI atau script menambahkan `--allow-dangerous` (dan `--yes` di conn yang dilindungi) setelah seseorang setuju. Lihat [Keamanan](safety.md#what-needs-a-yes).

- Tanpa `--prefix`, `rm` hanya menerima key yang persis, tanpa pola.
- `--prefix` menghapus semua di bawah sebuah folder (`/` untuk seluruh conn); `--older-than` (`30d`, `12h`, `90m`) mempertahankan yang lebih baru.
- `--prefix` menolak menghapus lebih dari `--max-remove` objek (1000 secara default; `TOO_MANY`). Periksa daftar dry run, dan naikkan batasnya bila itu memang maksud Anda.
- `--dry-run` mencantumkan objek satu per baris dengan ukuran dan tanggal.

### Versi lama (versioning S3)

Bucket dengan versioning menyimpan setiap objek yang ditimpa atau dihapus, dan `rm` meninggalkannya (S3 menambahkan delete marker). Lihat, dan hapus sebuah key beserta setiap versinya:

```bash
komando storage list backups app/ --all-versions               # setiap versi dan delete marker
komando storage rm backups app/config.json --all-versions --dry-run
komando storage rm backups app/config.json --all-versions      # benar-benar hilang
```

`--all-versions` menerima key yang persis dan berfungsi di S3 dan storage yang kompatibel dengan S3; perintah ini bertanya dulu seperti `rm` mana pun.

## Menambah bucket Google Cloud atau Azure

```bash
komando storage add media gs://my-bucket/site                     # login seperti gcloud
komando secret set media-sa < key.json                            # atau key service account
komando conn edit media --password-ref secret:media-sa

komando secret set files-key                                      # key1 dari portal, atau token SAS
komando storage add files azblob://mystorageacct@uploads/2026 --password-ref secret:files-key
```

- Google Cloud Storage tanpa `--password-ref` memakai login yang disimpan gcloud (`gcloud auth application-default login`), file `GOOGLE_APPLICATION_CREDENTIALS`, atau akun milik server sendiri di Google Cloud. `STORAGE_AUTH` menyatakan bila tidak ada. Key service account adalah file JSON dari konsol.
- Azure Blob Storage menerima key storage account (`key1` atau `key2`) atau token SAS (bagian setelah `?`, diawali `sv=`). Token SAS yang hanya bisa membaca dan mendaftar membatasi komando pada pembacaan.
- Link (`storage link`) butuh key yang bisa menandatanganinya: key service account untuk Google Cloud, key account untuk Azure. Login gcloud sendiri dan token SAS tidak bisa.
- Emulator atau cloud lain menerima `?endpoint=URL`, misalnya `azblob://devstoreaccount1@media?endpoint=http://127.0.0.1:10000/devstoreaccount1` untuk Azurite. Endpoint `http://` di komputer lain mengirim file (dan untuk S3 session token AWS) tanpa enkripsi, jadi ditolak (`INSECURE_PROTOCOL`) kecuali conn lewat `--via` server SSH atau URL menambahkan `&insecure=1`. Endpoint di komputer ini (localhost, 127.0.0.1) tidak masalah.
- Login gcloud sendiri hanya menuju Google (`https://…googleapis.com`), tidak pernah ke emulator atau endpoint lain. Key service account butuh endpoint `https://`: lewat `http://` tokennya akan berjalan tanpa enkripsi, jadi komando menolaknya (`INSECURE_PROTOCOL`). Token SAS ditolak lewat `http://` karena alasan yang sama; key account Azure hanya menandatangani, jadi emulator seperti Azurite berfungsi dengannya.

## Menambah file server (WebDAV, FTPS, SFTP, FTP)

Web hosting dan sistem yang lebih tua sering hanya memberi Anda akses file. Tambahkan server sebagai conn:

```bash
komando secret set hosting-pass
komando storage add site 'ftps://deploy@files.example.com/public_html' --password-ref secret:hosting-pass
komando storage list site --recursive
komando upload site ./index.html index.html
komando download site logs/error.log
```

- Unggahan menuju nama sementara dulu lalu di-rename ke tempatnya, jadi unggahan yang gagal tidak pernah meninggalkan setengah file di bawah nama sebenarnya. Folder yang hilang dibuat.
- SFTP memeriksa identitas server seperti server SSH mana pun: diingat saat pertama kali, dan perubahan ditolak dengan `HOSTKEY_MISMATCH`. SFTP bisa memakai SSH key Anda juga selain kata sandi.
- WebDAV membuat folder yang hilang saat mengunggah. Untuk Nextcloud dan ownCloud, path-nya `remote.php/dav/files/USER`, dan app password (Settings, Security) lebih aman daripada kata sandi Anda sendiri.

## Menambah share Windows (SMB)

Folder bersama di server Windows, Samba, NAS, atau Azure Files (`\\fileserver\team` yang Anda buka di Explorer) juga sebuah conn:

```bash
komando secret set team-share
komando storage add team 'smb://alice@fileserver.corp.lan/team/reports?domain=CORP' --password-ref secret:team-share
komando storage list team
komando upload team ./q3.pdf 2026/q3.pdf
```

- **URL-nya:** `smb://USER@HOST/SHARE/FOLDER`. Bagian pertama path adalah nama share (`team`); sisanya adalah folder tempat conn dimulai. `cifs://` berarti sama.
- **Akun domain** (`CORP\alice`): tambahkan `?domain=CORP`. Bentuk SMB yang lazim `smb://CORP;alice@host/share` juga berfungsi; pakai salah satunya, tidak keduanya. Akun lokal di server tidak butuh domain.
- **Kata sandinya** masuk ke vault (`--password-ref`), tidak pernah ke URL. komando login dengan NTLMv2.
- **Aman di kabel:** komando berbicara SMB 2 dan 3 dan menandatangani setiap pesan, sehingga tidak ada yang di tengah jalan bisa mengubah apa yang dikirim server. Lalu lintas dienkripsi saat server memintanya (enkripsi SMB 3, yang dinyalakan Azure Files secara default; di Windows, "Encrypt data access" pada share; di Samba, `smb encrypt = required`). Tanpanya, `komando doctor` memperingatkan conn yang melewati jaringan.
- **Port 445 sering diblokir** lewat internet. Jangkau server `--via` server SSH di jaringannya, atau lewat VPN, seperti conn lain.
- **Azure Files:** `smb://STORAGEACCOUNT@STORAGEACCOUNT.file.core.windows.net/SHARE` dengan key storage account sebagai kata sandi.
- Unggahan menuju nama sementara dulu. File yang sudah ada dipindah ke samping, yang baru di-rename ke tempatnya, dan yang lama baru dihapus setelah itu; bila rename gagal, file lama kembali.

## Memeriksa, mengubah, mengganti nama, atau menghapus storage

Storage adalah sebuah conn, jadi perintah conn berfungsi padanya:

```bash
komando list kind:storage                     # storage Anda
komando test backups                          # bisakah komando menjangkaunya dan login?
komando conn show backups                     # URL, jalan masuk, dan rujukan kata sandinya
komando conn edit backups --url 's3://AKIAEXAMPLE@my-bucket/db?region=eu-central-1'
komando conn edit backups --via web1          # jangkau lewat bastion atau VPN
komando conn edit backups --protected         # setiap perubahan lalu butuh jawaban ya dari seseorang
komando conn rename backups db-backups
komando conn rm backups                       # komando melupakannya; file-nya tetap ada
```

`--via` bekerja sama seperti untuk conn lain: lewat bastion atau VPN.

## Batasan

- Key tidak bisa keluar dari folder conn (`../` ditolak).
- `storage mv` tetap di dalam satu conn, dan di S3, Google Cloud, dan Azure memindahkan satu objek sekali waktu; `storage chmod` hanya untuk conn SFTP.
- `storage cat` hanya menampilkan teks, paling banyak `--max-bytes` (1 MiB secara default).
- `storage rm` tanpa `--prefix` menerima key yang persis, tanpa pola; dengan `--prefix` berhenti di atas `--max-remove` objek (1000 secara default) dan di atas sejuta objek di bawah prefix.
- **Bucket yang menyimpan versi lama** (versioning S3, versioning objek atau soft delete Google Cloud, versioning blob atau soft delete Azure): `rm` hanya menghapus objek yang sekarang. Penyedia menyimpan versi lama (S3 menambahkan delete marker), versi itu tetap memakan biaya storage, dan bisa dikembalikan di konsol atau CLI penyedia. Di S3, `--all-versions` mencantumkan dan menghapusnya (lihat [Versi lama](#old-versions-s3-versioning)); di Google Cloud dan Azure komando tidak melakukannya, dan aturan lifecycle pada bucket yang melakukannya.
- File server (WebDAV, FTPS, SFTP, FTP, SMB) tidak punya link sementara: `storage link` untuk S3, Google Cloud, dan Azure. Login gcloud sendiri dan token SAS Azure juga tidak bisa menandatangani link.
- Link yang ditandatangani dengan key AWS sementara berhenti berfungsi saat key itu kedaluwarsa.
- SMB: tiket Kerberos tidak dipakai, dan login guest tidak bisa menandatangani, jadi nama user wajib ada.
- FTP dan FTPS: daftar bisa berakhir lebih awal dan tetap tampak lengkap. Di FTP polos, dan di FTPS saat koneksi menutup setelah enkripsi disiapkan, satu-satunya tanda adalah jawaban server di akhir, dan server yang tetap menyatakan "226 Transfer complete" dipercaya. komando berhenti saat koneksi menutup sebelum enkripsi disiapkan, dan `sync --delete` berhenti sebelum mengosongkan folder yang dicantumkan sumber sebagai kosong (`EMPTY_FOLDER_CONFIRM_REQUIRED`, lihat [files.md](files.md)). Folder yang hanya mencantumkan sebagian file-nya tidak tertangkap: jalankan `sync --delete` dari sumber FTP atau FTPS dengan `--dry-run` dulu dan baca apa yang akan dihapusnya.

## Pemecahan masalah

| Error | Artinya | Yang perlu dilakukan |
|-------|---------|----------------------|
| `STORAGE_AUTH` | storage menolak login, atau tidak ada (Google Cloud) | periksa key dengan `komando conn show backups`, atau login dengan gcloud |
| `STORAGE_CONNECT` | komando tidak bisa menjangkau bucket atau file server | `komando test backups`; jangkau `--via` server atau VPN |
| `STORAGE_TLS` | sertifikat tidak lolos pemeriksaan | sebut CA Anda dengan `?ca=secret:NAMA` |
| `STORAGE_ERROR` | misalnya, program lain membuka file itu | tutup di sana dan jalankan lagi |
| `BUCKET_NOT_FOUND` | bucket (atau share SMB) tidak ada | periksa nama di URL conn |
| `FOLDER_NOT_FOUND` | folder kosong atau tidak ada (exit 3) | periksa dengan `komando storage list backups` |
| `OBJECT_NOT_FOUND` | tidak ada key seperti itu | `komando storage list backups PREFIX` menampilkan key |
| `NOT_TEXT` | `storage cat` pada file biner (exit 2) | unduh saja |
| `FILE_EXISTS` | unduhan akan menimpa file di komputer ini | pilih `--to` lain, atau tambahkan `--overwrite` |
| `TOO_MANY` | lebih banyak objek yang cocok daripada `--max-remove` | persempit `--prefix` atau `--older-than`, atau naikkan `--max-remove` setelah memeriksa daftarnya |
| `INSECURE_PROTOCOL` | URL mengirim login atau file tanpa enkripsi lewat jaringan | pakai bentuk TLS (`webdavs://`, `ftps://`, `https://`), `--via`, atau tambahkan `?insecure=1` |
| `AWS_LOGIN_REQUIRED`, `AWS_PROFILE_NOT_FOUND` | login AWS SSO kedaluwarsa, atau profil hilang | seseorang menjalankan `komando login aws --profile prod`; atau perbaiki `aws_profile` |
| `HOSTKEY_MISMATCH` | identitas server SFTP berubah | jangan ubah apa pun; laporkan, mungkin itu serangan |
| `POLICY_BLOCKED` | `rm` tanpa `--allow-dangerous` (exit 6) | jalankan di terminal, atau tambahkan flag setelah seseorang setuju |

Setiap kode ada di [Kode error](error-codes.md).
