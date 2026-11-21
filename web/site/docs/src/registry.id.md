# Container registry

Lihat image apa yang disimpan sebuah registry, salin image antar-registry, dan bersihkan yang lama. Berfungsi dengan Docker Hub, GHCR, GitLab, Harbor, Amazon ECR, Azure Container Registry, Google Artifact Registry, dan `registry:2` milik Anda sendiri.

## Melihat tag sebuah image

```bash
komando import docker                          # registry yang sudah Anda login
komando list kind:registry                     # nama yang diberikan impor (ghcr.io -> ghcr ...)
komando registry list ghcr myorg/api           # tag satu repository
```

Jika diketik tanpa argumen di terminal, `komando registry list` menanyakan registry, dengan daftar milik Anda untuk dipilih, lalu repository (kosong mencantumkan semua repository).

```text
1.4.1
1.4.2
latest
```

`list` dan `inspect` hanya membaca. `copy` menulis ke tujuan. `rm` dan `prune` menghapus image. Agen AI memberikan setiap argumen; argumen yang kurang adalah error `USAGE` (exit 2) yang hint-nya menunjukkan contoh.

## Menambah registry

```bash
komando import docker                         # dari ~/.docker/config.json
komando registry add ghcr registry://alice@ghcr.io --ask-password                         # menanyakan token, disembunyikan
komando registry add ghcr registry://alice@ghcr.io --password-ref secret:ghcr-token       # token yang Anda simpan dengan secret set
komando registry add harbor 'registry://alice@harbor.lan:5000?tls=false' --via bastion    # tanpa TLS, di balik bastion
```

Kata sandinya biasanya sebuah access token. Token butuh hak baca untuk melihat, hak tulis untuk menyalin ke registry, dan hak hapus untuk menghapus. Untuk Docker Hub pakai `registry://alice@docker.io`.

`import docker` membaca setiap `docker login` dari `~/.docker/config.json`, dengan bertanya ke credential helper (`credsStore`, `credHelpers`) saat docker menyimpan login di sana. Amazon ECR, registry Google yang login lewat gcloud, dan registry Azure yang login dengan `az acr login` memegang token yang hanya bertahan beberapa jam: komando menambahkannya tanpa token itu dan login dengan login AWS, Google, atau Azure Anda setiap kali (lihat di bawah).

Untuk mengeluarkan registry dari daftar Anda: `komando conn rm ghcr` (registry-nya sendiri tidak disentuh).

### Docker Hub

```bash
komando registry add dockerhub registry://alice@docker.io --ask-password
komando registry list dockerhub alice/app       # tag repository Anda
komando registry inspect dockerhub nginx        # image resmi: library/nginx:latest
```

- Nama image resmi tanpa `/` (`nginx`) berarti `library/nginx`, seperti pada `docker pull`.
- Docker Hub tidak punya daftar semua repository: `registry list dockerhub` tanpa repository memberi `REGISTRY_UNSUPPORTED`; sebut satu.
- Docker Hub membatasi pull (lebih sedikit tanpa login) dan menghitung setiap pembacaan manifest. Melewati batas, komando berhenti dengan `REGISTRY_RATE_LIMIT` dan menyatakan kapan mencoba lagi. `list` dan `rm` membaca tag dengan permintaan yang tidak dihitung Docker Hub; `prune` membaca setiap image sekali.

### Amazon ECR

Login ECR bertahan 12 jam, jadi komando mengambil yang baru dari AWS setiap kali, dengan login AWS Anda yang lazim (tidak butuh aws CLI). Hilangkan `--password-ref` dan sebut profil AWS-nya:

```bash
komando registry add ecr registry://AWS@123456789012.dkr.ecr.eu-west-1.amazonaws.com --option aws_profile=prod
```

Bila login SSO sudah kedaluwarsa, error-nya `AWS_LOGIN_REQUIRED`: seseorang menjalankan `komando login aws --profile prod` sekali. Lihat [Login cloud](cloud.md).

Login ECR berlaku untuk setiap repository yang dijangkau login AWS Anda, jadi komando mengirimnya hanya lewat https ke registry yang sertifikatnya diperiksa. Conn dengan `?tls=false` atau `?tls=skip-verify` berhenti dengan error penggunaan. Begitu juga conn registry cloud (ECR, Google, Azure) dengan `?ca=` atau `?resolve=` dan tanpa `--password-ref`: registry cloud punya sertifikat yang dipercayai setiap komputer, di alamatnya sendiri.

### Azure Container Registry

Hilangkan `--password-ref` dan komando login dengan login Azure Anda, seperti yang dilakukan `az acr login`: komando mengambil token Azure dan menukarnya dengan registry untuk login registry yang bertahan beberapa jam. Ini dilakukan setiap kali, tidak menyimpan apa pun, dan tidak butuh program `az`:

```bash
komando registry add acr registry://myregistry.azurecr.io
komando test acr
```

komando mencari login Azure dengan urutan ini:

1. service principal: `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, dan `AZURE_CLIENT_SECRET`;
2. workload identity di AKS: `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, dan `AZURE_FEDERATED_TOKEN_FILE`;
3. token yang disimpan Azure CLI setelah `az login` (Linux dan macOS). Token bertahan sekitar satu jam, dan perintah `az` apa pun memperbaruinya; komando membacanya tetapi tidak bisa memperbaruinya sendiri;
4. managed identity mesin Azure tempat komando berjalan (`AZURE_CLIENT_ID` memilih yang user-assigned).

Login butuh role `AcrPull` pada registry untuk melihat, `AcrPush` untuk menyalin image ke sana, dan `AcrDelete` untuk menghapus. Tanpa login, error-nya `AZURE_LOGIN_REQUIRED`; role yang hilang memberi `REGISTRY_AUTH`. Token registry atau user admin juga berfungsi: taruh user di URL dan berikan `--password-ref`, seperti untuk registry mana pun.

Token Azure berlaku untuk seluruh subscription Anda, bukan hanya registry-nya, jadi komando mengirimnya hanya lewat https ke registry yang sertifikatnya diperiksa. Conn dengan `?tls=false` atau `?tls=skip-verify` berhenti dengan error penggunaan; pakai token registry dengan `--password-ref`.

### Google Artifact Registry dan Container Registry

Host seperti `europe-west1-docker.pkg.dev`, `gcr.io`, `eu.gcr.io`, `us.gcr.io`, dan `asia.gcr.io` login dengan login Google Anda bila conn tidak punya `--password-ref`, seperti yang disiapkan `gcloud auth configure-docker`: komando mengambil access token Google (bertahan satu jam) setiap kali dan login sebagai `oauth2accesstoken`. Login itu adalah yang dipakai komando untuk storage `gs://` dan `gcp-sm:`: `GOOGLE_APPLICATION_CREDENTIALS` (file key service account), login dari `gcloud auth application-default login`, atau service account milik mesin di Google Cloud. Tidak butuh program `gcloud`:

```bash
komando registry add gar registry://europe-west1-docker.pkg.dev
komando registry list gar my-project/my-repo/api
```

Untuk memakai key service account dari vault, simpan file key dan beri user nama `_json_key`:

```bash
komando secret set gar-key < key.json
komando registry add gar registry://_json_key@europe-west1-docker.pkg.dev --password-ref secret:gar-key
```

Login butuh role Artifact Registry Reader untuk melihat, Writer untuk menyalin image ke sana, dan Repository Administrator untuk menghapus. Tanpa login Google sama sekali, komando membaca tanpa login, jadi image publik tetap berfungsi; login yang sudah habis, atau file `GOOGLE_APPLICATION_CREDENTIALS` atau file login gcloud yang hilang atau rusak, memberi `GCP_LOGIN_REQUIRED`. Seperti Azure, token Google berlaku untuk seluruh project Anda, jadi hanya dikirim lewat https ke registry yang sertifikatnya diperiksa: tidak dengan `?tls=false` atau `?tls=skip-verify`.

### HTTPS dengan sertifikat Anda sendiri

Secara default komando memeriksa sertifikat registry terhadap CA yang dipercayai komputer Anda. Registry dengan sertifikat dari CA privat (mkcert, CA internal) ditolak dengan `REGISTRY_TLS`. Dua cara memperbaikinya:

```bash
komando secret set harbor-ca < ca.crt        # 1. lebih baik: percayai CA itu (sertifikat PEM-nya), pemeriksaan tetap menyala
komando registry add harbor 'registry://alice@harbor.lan?ca=secret:harbor-ca' --password-ref secret:harbor-token
komando registry add harbor 'registry://alice@harbor.lan?tls=skip-verify' --password-ref secret:harbor-token   # 2. tanpa pemeriksaan sama sekali
```

Opsi URL ada di [Referensi](#reference). Secret CA dihitung dipakai oleh conn: `secret list` menampilkannya, `secret rm` menolaknya, `secret rename` mengubah URL juga, dan `export` mencantumkannya di `secrets_needed`.

Bila CA ada di tempat lain (mkcert di komputer lain) dan registry hanya mengirim sertifikatnya sendiri, simpan sertifikat itu sebagai `ca=`. komando lalu mempercayai persis sertifikat itu (di-pin), tetap memeriksa nama dan tanggalnya, dan menolak yang lain. Saat registry mendapat sertifikat baru, simpan yang baru.

```bash
komando secret set harbor-cert < registry.crt    # sertifikat registry sendiri, PEM
komando registry add harbor 'registry://alice@harbor.lan?ca=secret:harbor-cert'
```

### Saat DNS menunjuk ke tempat lain

Kadang DNS publik registry menunjuk ke tempat selain alamat yang dipakai server Anda, atau nama itu tidak punya DNS sama sekali. Ada dua jalan memutarnya.

Lewat server (`--via`): komando mengirim nama registry ke server terakhir di jalur `--via`, dan server itu yang mencarinya, jadi `/etc/hosts` dan DNS-nya berlaku. Pemeriksaan sertifikat dan header `Host` tetap memakai nama di URL:

```bash
komando registry add harbor 'registry://alice@registry.example.com?ca=secret:harbor-ca' --via web1
```

Dengan `?resolve=`: bila Anda bisa menjangkau registry dari komputer Anda, Anda tidak butuh server untuk ini. Berikan alamat IP-nya di URL, seperti `curl --resolve`. komando tersambung ke alamat itu dan tetap mengirim nama, jadi opsi TLS bekerja seperti tanpanya: sertifikat diperiksa terhadap nama (dengan atau tanpa `ca=`), atau tidak diperiksa sama sekali dengan `tls=skip-verify`:

```bash
komando registry add harbor 'registry://alice@registry.example.com?ca=secret:harbor-ca&resolve=203.0.113.10'
komando registry add harbor 'registry://alice@harbor.lan?tls=skip-verify&resolve=203.0.113.20'
komando test harbor
```

Hanya koneksi ke nama registry sendiri yang menuju IP itu. Layanan login atau unduhan di host lain dicari seperti biasa. Dengan `--via`, server terakhir di jalur yang tersambung ke IP. `komando tunnel` juga memakai IP itu.

## Melihat image

```bash
komando registry list harbor                    # repository (Docker Hub dan GHCR tidak mengizinkan ini)
komando registry list ghcr myorg/api            # tag satu repository
komando registry inspect ghcr myorg/api:1.4.2   # digest, ukuran, platform, waktu dibuat, label
```

Jika diketik tanpa argumen di terminal, `komando registry inspect` menanyakan registry, lalu image.

```text
myorg/api:1.4.2
  digest: sha256:4c2e...
  media type: application/vnd.oci.image.index.v1+json
  size: 48.2 MB in 7 layers, compressed
  platforms: linux/amd64, linux/arm64
  created: 2026-11-02 10:14 WIB
```

Tag atau repository yang tidak ada adalah "not found" (exit 3), dan pesan menyebut apa yang ada: `mirror/busybox:latest not found; tags: stable`.

`list` menampilkan paling banyak 1000 entri (`--limit` mengubahnya). Daftar yang terpotong punya `"truncated": true` di JSON dan baris `(the first 1000 tags in shop/api; there are more: raise -n)` di terminal.

Nama mengikuti aturan OCI: repository berupa huruf kecil, angka, `.`, `_`, `-`, dan `/` di antara bagian (`shop/api`); tag paling banyak 128 huruf, angka, `.`, `_`, dan `-`; digest adalah `sha256:` dan 64 digit heksadesimal. Selain itu ditolak dengan `USAGE` sebelum komando mengirim permintaan.

## Menyalin image

```bash
komando registry copy ghcr:myorg/api:1.4.2 harbor:prod/api:1.4.2   # antar-registry
komando registry copy ghcr:myorg/api:1.4.2 harbor:                  # pertahankan nama dan tag yang sama
komando registry copy harbor:app:latest harbor:app:stable           # tag lain di registry yang sama
```

Jika diketik tanpa argumen di terminal, `komando registry copy` menanyakan dari mana (`ghcr:myorg/api:1.4.2`), lalu ke mana.

- Kedua sisi ditulis `CONN:IMAGE`, seperti pada `komando cp`. Image adalah `REPO[:TAG]` atau `REPO@DIGEST`.
- Setiap platform dari image multi-platform disalin, dan digest tetap sama, sehingga tanda tangan dan deployment yang di-pin tetap valid.
- Layer yang sudah dimiliki tujuan dilewati. Di registry yang sama layer ditautkan, bukan disalin, bila registry mengizinkan.
- Hanya tujuan yang berubah, jadi hanya tujuan yang dilindungi yang butuh `--yes`.
- Hasilnya menyatakan `"replaced": true` bila tag tujuan sebelumnya menunjuk ke image yang berbeda.
- `harbor:prod/api` (tanpa tag) mempertahankan tag sumber; sumber yang diberikan dengan digest butuh tag tujuan. Menyalin image ke dirinya sendiri ditolak.
- `--dry-run` membaca kedua registry: menampilkan image sumber (`source`) dan menyatakan `"would_replace": true` bila tag tujuan sekarang menunjuk ke image lain.

## Menghapus image

```bash
komando registry rm harbor shop/api:1.9 --dry-run     # mencantumkan setiap tag yang akan hilang
komando registry rm harbor shop/api:1.9
```

`rm` menghapus image yang ditunjuk tag, jadi setiap tag lain pada image yang sama ikut hilang. Sebut tag atau digest: `rm` tidak pernah memilih `latest` sendiri. `--dry-run` menyebut setiap tag yang akan hilang (`would_remove_tags`) sebelum apa pun dihapus:

```text
$ komando registry rm harbor shop/api:1.9 --dry-run
would delete shop/api@sha256:4c2e...
with it goes every tag on that image: 1.9, latest
latest is one of them: docker pull without a tag stops working
```

komando memeriksa setiap tag repository (sampai 10000); bila lebih banyak, `tags_note` menyatakan tag lain mungkin menunjuk ke image itu juga.

Penghapusan tidak bisa dibatalkan. Di terminal Anda komando bertanya dulu: komando menyebut image dan setiap tag yang akan hilang, dan Anda mengetik nama image (`Type the name shop/api:1.9 to continue`). Agen AI atau script menambahkan `--allow-dangerous` setelah seseorang setuju; registry yang dilindungi juga butuh `--yes`. Lihat [Keamanan](safety.md#what-needs-a-yes).

Ruang disk kembali setelah registry menjalankan garbage collection-nya.

### Menghapus image lama

```bash
komando registry prune harbor shop/api --keep 10 --dry-run   # apa yang akan hilang, dan mengapa sisanya tetap
komando registry prune harbor shop/api --keep 10 --older-than 30d --match '^v'
```

`prune` menghapus image lama dari satu repository. Di terminal Anda komando bertanya dulu: ketik nama repository. Agen AI atau script menambahkan `--allow-dangerous` setelah seseorang setuju. Berikan `--keep`, `--older-than`, atau keduanya:

- `--keep N` mempertahankan N tag terbaru yang cocok.
- `--older-than 30d` hanya menghapus image yang dibuat sebelum usia itu. Dengan keduanya, sebuah tag harus lolos keduanya untuk dihapus.
- `--match REGEX` membatasi pada tag yang cocok dengan pola ini (regular expression, seperti `^v` untuk tag yang diawali v).

```text
shop/api: would delete 2 images of 14 tags
  - v1.0                 2026-03-02 09:12 WIB  sha256:91ab2c3d4e5f
  - v1.1                 2026-04-10 15:40 WIB  sha256:7f3e1d2c3b4a
keeps 12 tags:
  = latest               latest is always kept
  = v2.9                 one of the newest
  ...
```

`latest`, tag yang tidak cocok, dan tag tanpa tanggal build selalu tetap, begitu juga image mana pun yang ditunjuk tag yang dipertahankan. Index multi-platform punya tanggal build dari image pertamanya, jadi aturan berlaku padanya seperti pada image mana pun.

## Batasan

- Docker Hub dan GHCR tidak punya daftar semua repository: sebut satu.
- `list` menampilkan paling banyak 1000 entri kecuali Anda menaikkan `--limit`.
- `rm` dan dry run-nya memeriksa setiap tag repository, sampai 10000, untuk tag lain pada image yang sama.
- `prune` membaca digest setiap tag (8 sekaligus), lalu setiap image sekali, dan berhenti dengan `TOO_MANY_TAGS` di atas 10000 tag (`--match` tidak mengangkatnya, karena setiap tag dibaca): hapus beberapa dulu dengan `registry rm`.
- Registry dengan penghapusan dimatikan (`registry:2` tanpa `REGISTRY_STORAGE_DELETE_ENABLED=true`) menjawab `rm` dan `prune` dengan `REGISTRY_UNSUPPORTED`.
- Token Azure dan Google hanya dikirim lewat https dengan sertifikat yang diperiksa: tidak dengan `?tls=false` atau `?tls=skip-verify`.
- Ruang disk kembali hanya setelah garbage collection milik registry sendiri.

## Pemecahan masalah

| Kode | Artinya | Yang perlu dilakukan |
|------|---------|----------------------|
| `REGISTRY_AUTH` (exit 4) | registry menolak login, atau token kekurangan hak | periksa user di URL conn dan `--password-ref`-nya (token dengan scope atau role yang tepat) |
| `REPOSITORY_NOT_FOUND` (exit 3) | tidak ada repository seperti itu | `komando registry list harbor` menampilkan repository |
| `REGISTRY_UNSUPPORTED` (exit 5) | registry tidak mengizinkannya: tanpa daftar semua repository, atau penghapusan dimatikan | sebut repository-nya; nyalakan penghapusan di registry |
| `REGISTRY_RATE_LIMIT` (exit 5) | terlalu banyak permintaan (batas pull Docker Hub) | tunggu selama yang disebut hint, atau login |
| `REGISTRY_TLS` (exit 4) | sertifikat berasal dari CA privat, atau untuk nama lain | tambahkan `?ca=secret:NAME`, atau pakai nama yang dituju sertifikat |
| `CONN_UNREACHABLE` (exit 4) | registry tidak menjawab | `komando test harbor`, dan periksa jalur `--via`-nya |
| `AWS_LOGIN_REQUIRED` (exit 4) | login AWS profil ECR sudah habis | seseorang menjalankan `komando login aws --profile prod` |
| `AZURE_LOGIN_REQUIRED` (exit 4) | tidak ada login Azure | atur service principal, atau seseorang menjalankan `az login` |
| `GCP_LOGIN_REQUIRED` (exit 4) | login Google sudah habis atau file-nya rusak | seseorang menjalankan `gcloud auth application-default login`, atau atur `GOOGLE_APPLICATION_CREDENTIALS` |
| `TOO_MANY_TAGS` (exit 2) | `prune` pada repository dengan lebih dari 10000 tag (`--match` tidak mengangkatnya) | hapus beberapa dulu dengan `registry rm` |

## Referensi

Opsi URL pada conn `registry://`:

| Opsi URL | Fungsinya |
|---|---|
| (tidak ada) | HTTPS, sertifikat diperiksa terhadap CA komputer Anda |
| `?ca=secret:NAME` | HTTPS, sertifikat diperiksa terhadap CA itu ditambah sertifikat PEM di secret vault `NAME`: sebuah CA, atau sertifikat registry sendiri |
| `?resolve=IP` | tersambung ke alamat IP ini sebagai ganti yang diberikan DNS untuk nama itu (seperti `curl --resolve`). `IP:PORT` mengatur port juga; tulis IPv6 dalam kurung siku: `[2001:db8::1]:443`. TLS tetap memakai nama di URL. Bisa dipakai bersama setiap opsi lain di tabel ini; lihat [Saat DNS menunjuk ke tempat lain](#when-dns-points-somewhere-else) |
| `?tls=skip-verify` | HTTPS, tetapi sertifikat tidak diperiksa (seperti `insecure-registries` milik Docker). Siapa pun di jalur bisa berpura-pura menjadi registry; `komando doctor` memperingatkannya |
| `?tls=false` | HTTP polos, tidak ada yang dienkripsi (`registry:2` di jaringan privat) |
