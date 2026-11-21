# Login cloud

komando berbicara ke AWS sendiri, tanpa aws CLI: komando memakai profil di `~/.aws/config`, dan seseorang memperbarui login SSO dengan satu perintah.

## Login ke AWS IAM Identity Center (SSO)

Untuk profil di `~/.aws/config` yang memakai SSO (`sso_session` atau `sso_start_url`), atau profil yang meng-assume role dari profil seperti itu (`role_arn` dengan `source_profile`):

```bash
komando login aws --profile prod                                   # seseorang login sekali di browser
komando conn add backups 's3://my-bucket/db?region=eu-west-1' --option aws_profile=prod
komando storage list backups                                       # memakai login itu sampai habis masa berlakunya
```

komando menampilkan sebuah kode dan membuka halaman login AWS di browser. Konfirmasikan kode yang sama di sana. Login disimpan di tempat aws CLI menyimpannya (`~/.aws/sso/cache`, hanya bisa dibaca Anda), sehingga komando, AWS SDK, dan aws CLI semuanya memakainya.

- Tanpa `--profile`, komando memakai `AWS_PROFILE`, kalau tidak ada maka `default`. komando tidak bertanya: profil yang lazim adalah jawabannya.
- `komando login aws --profile prod --dry-run` memeriksa profil dan menampilkan halaman login-nya (`sso_start_url`) dan regionnya, tanpa login ke mana pun.
- Profil dengan key di `~/.aws/credentials` tidak butuh login. Menjalankan `komando login aws` untuknya akan menyatakan hal itu (`AWS_FAILED`).
- Login cloud memakai huruf kecil: `komando login AWS` berhenti dengan `USAGE` dan menunjuk ke `komando login aws`.
- komando hanya membuka alamat login `https://` di browser. Di mesin tanpa browser, buka alamat yang dicetak di perangkat mana pun.
- Ctrl-C saat komando menunggu login akan menghentikannya (`CANCELLED`); login lama, kalau ada, tetap seperti semula.

**Agen AI** tidak bisa login: login terjadi di browser seseorang. Agen mendapat `NEEDS_PERSON` (exit 6) dengan petunjuk *ask the user to run `komando login aws --profile prod` in their own terminal*. Setelah orangnya login, perintah agen memakai login itu. Script tanpa terminal mendapat `NEEDS_PERSON` (exit 6), seperti agen. komando tidak pernah menaruh token di command line, outputnya, atau audit log; audit hanya mencatat `login.aws` dan nama profilnya.

## Memakai profil AWS di sebuah conn

Sebuah conn menyebut profil dengan `--option aws_profile=NAME`. komando membaca profil itu setiap kali, sehingga SSO, role yang di-assume, dan key sementara bekerja seperti yang dipakai aws CLI, dan tidak ada key yang disimpan di komando:

```bash
komando conn add backups 's3://my-bucket/db?region=eu-west-1' --option aws_profile=prod   # S3
komando conn add orders sqs://eu-west-1 --option aws_profile=prod                         # SQS
komando registry add ecr registry://AWS@123456789012.dkr.ecr.eu-west-1.amazonaws.com --option aws_profile=prod
komando conn edit backups --option aws_profile=staging                                    # profil lain
```

- Region berasal dari conn (`region=` untuk S3, alamatnya untuk SQS dan ECR), bukan dari profil.
- `aws_profile=default` memakai rantai AWS yang lazim: variabel `AWS_*`, profil default, atau role mesin tempat komando berjalan.
- Secret dari AWS Secrets Manager (`--password-ref aws-sm:NAME`) juga memakai rantai yang lazim (`AWS_PROFILE` memilih profilnya).

Lihat [Storage](storage.md#aws-logins-sso-roles-temporary-keys), [Queue](queues.md#add-an-sqs-region), dan [Container registry](registry.md).

## Menambah conn untuk setiap bucket S3

```bash
komando import aws --dry-run      # apa yang akan ditambahkan
komando import aws                # satu conn storage per bucket dari setiap profil
komando import aws ~/work/aws-config
```

Setiap conn memakai profilnya (`aws_profile`), jadi tidak ada key yang disalin. Profil yang loginnya sudah habis, atau yang tidak punya key, dilewati dengan catatan tentang apa yang memperbaikinya: `komando login aws --profile NAME` untuk profil SSO, file credentials untuk yang lain. Setelah itu jalankan impor lagi. Lihat [Pindah ke komando dan pindah komputer](import.md).

Dengan sebuah FILE, conn hanya menyimpan nama tiap profil: perintah berikutnya membaca `~/.aws/config` (atau `AWS_CONFIG_FILE`), jadi taruh profilnya di sana juga, kalau tidak perintah berhenti dengan `AWS_PROFILE_NOT_FOUND`.

## Melihat dan mengakhiri login AWS

`komando status` mencantumkan login SSO dari profil di `~/.aws/config` (dibuat oleh `komando login aws`, `aws sso login`, atau AWS SDK): profil yang berbagi tiap login dan kapan tokennya habis. Login dengan refresh token (`renews: true`) mendapat token baru dengan sendirinya setelah itu, selama sesi AWS berlangsung.

```bash
komando logout aws --profile prod   # akhiri sekarang
komando logout aws --all            # setiap login SSO dari profil Anda
```

`komando logout aws` melakukan apa yang dilakukan `aws sso logout`: memberi tahu AWS untuk mengakhiri token dan menghapus login di `~/.aws/sso/cache`, sehingga komando, AWS SDK, dan aws CLI semuanya butuh `komando login aws` lagi. Profil yang berbagi login (satu `sso-session`) di-logout bersamaan. Saat AWS tidak bisa dijangkau, login di komputer ini tetap berakhir (`revoked: false`); token lalu habis sendiri. Token tidak pernah ditampilkan.

## Google Cloud dan Azure

Login Google Cloud dan Azure belum tersedia. Yang bisa dipakai sebagai gantinya:

- **Google Cloud**: application default credentials (`GOOGLE_APPLICATION_CREDENTIALS`, atau file yang disimpan gcloud), atau key service account di vault:

  ```bash
  komando secret set gcs-key < key.json
  komando conn add media gs://my-bucket/site --password-ref secret:gcs-key
  ```

- **Azure**: conn Azure blob menerima key storage account atau token SAS. Secret Key Vault (`--password-ref azure-kv:VAULT/NAME`) memakai service principal (`AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`), token yang disimpan Azure CLI, atau managed identity milik mesin.

  ```bash
  komando secret set blob-key
  komando conn add files azblob://mystorageacct@uploads --password-ref secret:blob-key
  ```

Registry di Google Cloud dan Azure login dengan cara yang sama: lihat [Container registry](registry.md).

Login cloud hanya dikirim ke alamat login milik cloud itu sendiri:

- File login Google yang menyebut alamat (file workload atau workforce identity, `external_account`; service account yang di-impersonate) dipakai hanya bila alamat itu adalah layanan token milik Google (`https://sts.googleapis.com/v1/token`, `https://iamcredentials.googleapis.com/...`).
- `AZURE_AUTHORITY_HOST` wajib salah satu host login milik Azure.
- Login gcloud dan login registry cloud tidak pernah dikirim ke conn yang memiliki CA sendiri (`?ca=`) atau `?resolve=`.

Untuk perintah agen AI, lebih banyak hal yang dikunci, karena agen mengatur variabel di command line-nya sendiri:

- Sebagai file login Google hanya login gcloud (`gcloud auth application-default login`) atau key service account yang dipakai; jenis lain berhenti dengan `NEEDS_PERSON`: pengguna menyiapkan login itu di terminalnya sendiri.
- `AWS_ENDPOINT_URL`, `AWS_ENDPOINT_URL_*`, dan `endpoint_url` milik profil tidak diikuti, begitu juga alamat container credentials (`AWS_CONTAINER_CREDENTIALS_FULL_URI`) yang bukan milik ECS atau EKS. Emulator atau VPC endpoint ditaruh di conn (`endpoint=`).
- File yang disebut `AZURE_FEDERATED_TOKEN_FILE`, `AWS_WEB_IDENTITY_TOKEN_FILE` (atau `web_identity_token_file` di profil AWS) tidak boleh berupa private key, data milik komando sendiri, credential store, atau file yang namanya menandakan isi secret: `NEEDS_PERSON` (tidak ada flag yang mengangkatnya; pengguna menyiapkan login di terminalnya sendiri).

## Batasan

- Hanya AWS yang punya `komando login`; Google Cloud dan Azure memakai login di atas.
- `aws`, `gcp`, dan `azure` (huruf besar atau kecil) tidak boleh menjadi nama server, conn, atau VPN baru, seperti halnya `all`: kata-kata itu adalah login cloud.

## Pemecahan masalah

| Kode | Yang terjadi | Yang perlu dilakukan |
|---|---|---|
| `AWS_LOGIN_REQUIRED` (exit 4) | login SSO profil sudah habis, atau belum pernah dibuat | seseorang menjalankan `komando login aws --profile NAME`, perintah di petunjuk |
| `AWS_FAILED` (exit 4) | profil tidak memakai SSO dan tidak memberi key, atau role yang di-assume ditolak | petunjuk menyebut yang mana: tambahkan key ke `~/.aws/credentials`, atau periksa role dan profil sumbernya |
| `AWS_PROFILE_NOT_FOUND` (exit 3) | profil tidak ada di `~/.aws/config` atau `~/.aws/credentials` | tambahkan, atau perbaiki `--option aws_profile` milik conn |
| `NEEDS_PERSON` (exit 6) | agen AI menjalankan `komando login aws` | orangnya menjalankannya di terminalnya sendiri |
| `CANCELLED` (exit 1) | Ctrl-C saat menunggu login | jalankan lagi; login lama tidak berubah |
