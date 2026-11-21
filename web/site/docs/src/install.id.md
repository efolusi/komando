# Instal, update, hapus

komando adalah satu file program. Halaman ini menunjukkan cara menginstalnya di macOS, Linux, dan Windows, menjaganya tetap terbaru, menyalakan tab completion, dan menghapusnya lagi.

## Instal di macOS atau Linux

Buka terminal (di macOS, aplikasi **Terminal**) dan tempel:

```bash
curl --proto '=https' --tlsv1.2 -fsSL https://raw.githubusercontent.com/sgnd/komando/main/install.sh | sh
```

Lalu periksa bahwa komando berjalan:

```bash
komando version
```

Muncul `command not found`? Installer menaruh komando di folder yang belum dicari oleh terminal. Jalankan baris `export PATH=...` yang dicetaknya, lalu tambahkan baris itu ke `~/.zshrc` (macOS) atau `~/.bashrc` (Linux) agar tetap berlaku.

Ingin membaca script-nya dulu? Unduh, baca, lalu jalankan:

```bash
curl --proto '=https' --tlsv1.2 -fsSLO https://raw.githubusercontent.com/sgnd/komando/main/install.sh
sh install.sh
```

`KOMANDO_INSTALL_DIR=DIR` memilih foldernya, dan `KOMANDO_VERSION=v0.14.1` memilih satu versi (`KOMANDO_VERSION=v0.14.1 sh install.sh`).

Installer menginstal rilis hanya bila rilis itu ditandatangani dengan key proyek komando, pemeriksaan yang sama dengan `komando update`: orang yang mengganti file sebuah rilis tidak bisa membuatnya menginstal file itu. Tanda tangan diperiksa dengan OpenSSL 3, atau dengan perl bila OpenSSL 3 tidak ada (macOS punya perl; `openssl` bawaannya tidak bisa memeriksa jenis tanda tangan ini). Komputer yang tidak punya keduanya tidak mendapat instalasi apa pun dan diminta menginstal salah satunya. Rilis sampai 0.13.0 tidak bertanda tangan: installer mengenal checksum yang dipakai tiap rilis itu saat dirilis, menginstal salah satunya (yang diminta dengan `KOMANDO_VERSION`) hanya bila file-nya cocok, dan mengatakannya.

## Instal di Windows

1. Unduh `komando_windows_amd64.zip` (atau `komando_windows_arm64.zip` di komputer ARM) dari [Releases](https://github.com/sgnd/komando/releases).
2. Ekstrak `komando.exe` ke folder yang ada di `PATH`.
3. Buka PowerShell dan jalankan `komando version`.

Yang berbeda di Windows:

- komando menyimpan datanya di `%USERPROFILE%\.komando`. Folder itu diberi daftar akses tersendiri: hanya user itu dan sistem yang bisa membukanya. `komando doctor` memperingatkan bila ada file di dalamnya yang membuka akses untuk orang lain.
- Key vault masuk ke Windows Credential Manager (lihat [Tempat komando menyimpan datanya](settings.md#where-komando-keeps-its-data)).
- Path memakai bentuk Windows, misalnya file SQLite `sqlite://C:\data\app.db`.
- Login lewat browser (login VPN dan cloud) membuka browser default, seperti di macOS dan Linux.

Versi Linux juga bisa dijalankan di dalam [WSL](https://learn.microsoft.com/windows/wsl/install), dengan langkah macOS dan Linux di atas.

## Cara instal lainnya

- Dengan Go terinstal: `go install github.com/sgnd/komando/cmd/komando@latest`.
- Periksa bahwa arsip unduhan dibuat oleh workflow rilis komando:

  ```bash
  gh attestation verify komando_linux_amd64.tar.gz --repo sgnd/komando
  ```

## Update

```bash
komando update --dry-run   # adakah versi yang lebih baru? (tidak mengubah apa pun)
komando update             # instal rilis terbaru
```

`update` memeriksa bahwa rilis ditandatangani oleh proyek komando, mengunduh rilis untuk komputer ini, memeriksanya terhadap checksum bertanda tangan milik rilis itu, menjalankan program baru satu kali untuk memastikan program itu berfungsi di sini, dan baru setelah itu menggantikan yang lama. Jika ada yang gagal, komando lama tetap ada. Server, secret, dan riwayat di `~/.komando` tidak berubah.

Setelah update, jalankan `komando guide install` lagi (tanpa `sudo`), agar agen AI mendapat skill versi baru. Sebelum itu `komando doctor` menyatakan skill berasal dari versi lain.

- komando ada di folder yang hanya bisa diubah root, seperti `/usr/local/bin`? Jalankan `sudo komando update`. Sebagai root, komando tidak menulis apa pun di `~/.komando`.
- Di Windows, `komando.exe` yang sedang berjalan diganti namanya (Windows tidak mengizinkan program yang berjalan ditimpa) dan yang baru mengambil namanya.
- `komando update v0.14.1` menginstal versi itu (hanya rilis setelah 0.13.0 yang bertanda tangan; lihat di bawah untuk yang lebih lama). Kembali ke versi yang lebih lama bertanya dulu kepada Anda, karena komando yang lebih lama mungkin tidak punya pemeriksaan keamanan yang dimiliki yang lebih baru. Agen AI butuh `--yes` dan "Allow once" dari Anda.
- `update` hanya menerima versi komando. `komando update web1` adalah kesalahan yang menunjuk ke `komando pkg upgrade web1`, yang memperbarui package di server itu.
- Tanpa versi, `update` tidak pernah mundur, bahkan saat rilis terbaru lebih lama daripada komando yang dijalankan.
- komando hasil build sendiri dari commit di antara rilis tidak diganti (`SOURCE_BUILD`): build ulang saja. Yang dibuild pada tag rilis (`go install ...@v0.14.1`) dihitung sebagai rilis itu.
- Dijalankan sebagai Anda, update ditulis ke audit log seperti perubahan lainnya.
- `update` hanya menginstal rilis yang ditandatangani dengan key proyek komando, yang tertanam di komando. Workflow rilis menandatangani `checksums.txt` (sebagai `checksums.txt.sig`), jadi orang yang mengganti file sebuah rilis tidak bisa membuat `update` menginstalnya. Rilis tanpa tanda tangan berhenti dengan `RELEASE_SIGNATURE_NOT_FOUND`, tanda tangan yang salah dengan `RELEASE_SIGNATURE_INVALID`; tidak ada yang diubah. Jangan mengakali keduanya untuk rilis baru: laporkan ([SECURITY.md](../../SECURITY.md)). Rilis sampai 0.13.0 tidak bertanda tangan, jadi `komando update v0.13.0` juga berhenti; untuk kembali ke salah satunya, pakai baris instal dengan `KOMANDO_VERSION=v0.13.0`.
- Tanda tangan mencakup versinya juga. Mulai 0.15.0, baris pertama `checksums.txt` menyebut rilis dan hari pembuatannya (`komando-release v0.15.0 2026-11-20`). `update` dan baris instal hanya menginstal rilis sebagai versi yang disebut baris itu, sehingga file bertanda tangan milik rilis lama tidak bisa lolos sebagai rilis yang lebih baru (`RELEASE_SIGNATURE_INVALID`). 0.14.0 dan 0.14.1 ditandatangani sebelum adanya baris itu: keduanya hanya terinstal bila diminta dengan versi. Pemeriksaan manual dengan `sha256sum -c checksums.txt` memberi peringatan tentang satu baris ini; file-nya tetap lolos.
- Batasan yang diketahui: orang yang mengendalikan unduhan bisa menyajikan rilis asli yang lebih lama sebagai yang terbaru. `update` lalu menyatakan komando sudah terbaru (komando tidak pernah mundur sendiri), dan baris instal menginstal rilis itu dan mencetak versi serta tanggalnya. Cocokkan keduanya dengan [halaman rilis](https://github.com/sgnd/komando/releases).
- Untuk memeriksa juga provenance build bertanda tangan dari sebuah unduhan, pakai `gh attestation verify` (lihat [Cara instal lainnya](#other-ways-to-install)).
- `update` memakai `HTTPS_PROXY`. `sudo` membuang variabel itu; pertahankan dengan `sudo --preserve-env=HTTPS_PROXY komando update`.
- `--timeout` (default 10 menit) membatasi seluruh update. Saat GitHub menjawab dengan kesalahan, komando mencoba dua kali lagi.

Diinstal dengan `sudo` dan baris instal? Update dengan cara yang sama: `curl --proto '=https' --tlsv1.2 -fsSL https://raw.githubusercontent.com/sgnd/komando/main/install.sh | sudo sh`. Tanpa `sudo`, installer tidak bisa menulis di sana, menaruh versi baru di `~/.local/bin`, dan terminal mungkin tetap menjalankan yang lama. `komando version` menunjukkan mana yang berjalan.

## Tab completion

Tekan Tab untuk melengkapi perintah, flag, dan nama server, conn, grup, dan tag. Nyalakan sekali, lalu buka terminal baru:

```bash
echo 'source <(komando completion zsh)' >> ~/.zshrc          # zsh (macOS)
echo 'eval "$(komando completion bash)"' >> ~/.bashrc        # bash (Linux)
echo 'eval "$(komando completion bash)"' >> ~/.bash_profile  # bash di macOS
```

Untuk fish dan PowerShell, lihat `komando completion --help`.

## Menghapus komando

1. Hentikan apa yang masih dijalankan komando. `komando status` mencantumkannya; `komando vpn down --all` dan `komando tunnel stop --all` menghentikannya.
2. Cabut skill dan guard dari agen AI: `komando guide uninstall` (tambahkan `--project` di folder tempat Anda menjalankan `guide install --project`).
3. Simpan salinan `~/.komando` bila mungkin butuh server atau secret itu lagi (lihat [Pindah ke komputer lain](import.md#move-to-another-computer)), lalu hapus foldernya. Key vault ada di keychain sistem? Bila salinannya disimpan, jalankan `komando secret keychain --off` dulu, kalau tidak salinan itu tidak bisa dibuka nanti. Kalau tidak, hapus item keychain bernama `komando vault ...` (macOS: aplikasi Keychain Access; Windows: Credential Manager).
4. Hapus programnya: `rm "$(command -v komando)"` (dengan `sudo` bila ada di `/usr/local/bin`; di Windows hapus `komando.exe`), dan baris `export PATH=...` yang ditambahkan, bila ada.

## Pemecahan masalah

| Kesalahan | Artinya | Yang perlu dilakukan |
|-------|---------|----------------------|
| `NOT_WRITABLE` (exit 8) | folder komando milik root | jalankan perintah `sudo` yang diberikan petunjuk |
| `VERSION_NOT_FOUND` (exit 3) | tidak ada rilis seperti itu, atau tidak ada untuk komputer ini | lihat [daftar rilis](https://github.com/sgnd/komando/releases) |
| `CONN_UNREACHABLE` (exit 4) | GitHub tidak bisa dijangkau | periksa koneksi internet dan `HTTPS_PROXY` |
| `TIMEOUT` (exit 7) | unduhan memakan waktu lebih lama dari `--timeout`; tidak ada yang berubah | `komando update --timeout 30m` |
| `CHECKSUM_MISMATCH`, `BAD_RELEASE` (exit 1) | unduhan rusak atau tidak berjalan di sini; tidak ada yang berubah | coba lagi; laporkan bila terjadi lagi |
| `SOURCE_BUILD` | komando ini dibuild dari source di antara rilis | build ulang dari source |
