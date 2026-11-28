Komando adalah aplikasi gratis untuk Mac, iPhone, dan iPad. Komando bekerja dengan menjalankan komando, sebuah command line gratis, di Mac Anda. Jadi Anda instal komando dulu, lalu Komando memakainya. Dalam sepuluh menit, Anda akan punya satu server di Komando dan command prompt di server itu.

## Istilah yang akan Anda temui

- **komando** (k kecil) adalah command line yang mengerjakan tugasnya. **Komando** (K besar) adalah aplikasi yang menjalankannya untuk Anda.
- **Server**, juga disebut **host**, adalah komputer yang Anda masuki lewat SSH. SSH adalah cara aman untuk masuk ke server.
- **Target** adalah apa saja yang bisa dijangkau komando: server, database, cache, storage bucket, cluster, registry, message queue, atau VPN. **Inventaris** adalah daftar semuanya.
- **Key** adalah file yang membuktikan identitas Anda ke server, sebagai ganti kata sandi.
- **Protected** menandai target yang setiap perubahannya menanyai Anda dulu, misalnya production.

## 1. Dapatkan Komando

Komando untuk Mac membutuhkan macOS. Aplikasi iPhone dan iPad dijelaskan di [Komando di iPhone dan iPad](guide:iphone-and-ipad). {coming:app-download}

## 2. Instal komando

Buka Komando. Jika komando belum ada di Mac ini, jendelanya menampilkan "Install the komando command line".

1. Buka aplikasi Terminal, tempel baris ini, lalu tekan Return. Baris ini mengunduh skrip instal komando untuk rilis v0.17.5, lalu skrip itu menginstal rilis tersebut:
   `curl --proto '=https' --tlsv1.2 -fsSL https://raw.githubusercontent.com/sgnd/komando/v0.17.5/install.sh | KOMANDO_VERSION=v0.17.5 sh`
2. Kembali ke Komando, klik **Check Again**.

> Jika mau, periksa dulu: unduh skripnya, baca, lalu jalankan. Di Terminal, jalankan `curl --proto '=https' --tlsv1.2 -fsSLO https://raw.githubusercontent.com/sgnd/komando/v0.17.5/install.sh`, lalu `shasum -a 256 install.sh`. Hasilnya harus `9089ae0c0fbe7689aaf327237c02267b6b7f39dd8060187f91b22f24b46fc4af`. Baca skripnya dengan `less install.sh`, lalu jalankan dengan `KOMANDO_VERSION=v0.17.5 sh install.sh`. Installer memeriksa bahwa rilis itu ditandatangani dengan key proyek komando (pemeriksaan yang sama dengan `komando update`), dan tidak menginstal apa pun jika gagal.

Jika komando terinstal di folder yang tidak dicari Komando, klik **Choose komando…** lalu pilih program komando.

{shot:first-ten-minutes/install|Jendela yang ditampilkan Komando saat komando belum terinstal: perintah instal, Copy Command, Choose komando…, dan Check Again.}

## 3. Selamat datang

Saat komando menjawab dan Anda belum punya server, Home menampilkan "Welcome to Komando" dengan tiga kartu:

- **Add a Host**: tambahkan satu server secara manual. Ini langkah Anda berikutnya.
- **Add something else**: tambahkan database, cache, storage, cluster, registry, queue, atau VPN. Lihat [Tambah database, cache, atau lainnya](guide:add-a-connection).
- **Import from ~/.ssh/config**: bawa masuk server yang sudah ada di pengaturan SSH Anda. Lihat [Tambah server](guide:add-a-host#import-what-you-already-have).

{shot:first-ten-minutes/welcome|Welcome to Komando, dengan tiga kartunya.}

## 4. Tambahkan server pertama Anda

1. Klik **Add a Host**. Tab **New Host** terbuka.
2. **Name**: nama pendek tanpa spasi, misalnya `web-1`.
3. **Address**: user yang Anda pakai untuk masuk, `@`, lalu alamat server, misalnya `deploy@10.0.0.4`. Tambahkan `:2222` di akhir hanya jika SSH tidak memakai port 22.
4. **Log in with**: pilih **SSH Agent** jika Anda sudah masuk ke server ini dari aplikasi Terminal dengan key. Pilih **Password** untuk mengetik kata sandi server; kata sandi itu disimpan terenkripsi. [Masuk dengan key atau kata sandi](guide:log-in) menjelaskan setiap pilihan.
5. Klik **Save Host** (⌘↩).

Komando menampilkan "web-1 is in the inventory." lalu langsung menguji koneksinya: "Testing the connection…", lalu "Connected". Jika uji gagal, server tetap disimpan dan Komando menjelaskan sebabnya. [Tambah server](guide:add-a-host#if-the-test-fails) menunjukkan apa yang harus dilakukan.

## 5. Buka terminal

1. Klik **Open web-1**. Server terbuka sebagai tab, di Overview-nya.
2. Klik **Open Terminal**.
3. Pada kali pertama, identitas server masih baru bagi Mac ini. Ketik `yes` lalu tekan Return.

Sekarang Anda punya command prompt di web-1, `deploy@web-1`, berwarna hijau. Ketik `exit` atau tutup tab jika sudah selesai. [Buka terminal](guide:open-a-terminal) berisi selebihnya.

## 6. Lihat Home

Klik **Home** di sidebar (⌘1). Sekarang Home menampilkan tiga bagian:

- **Needs attention**: masalah yang ditemukan health check komando, satu kalimat per masalah, dengan tombol untuk memperbaikinya. Lihat [Home dan temuan](guide:home-and-findings).
- **Running now**: VPN, forward, dan job latar belakang.
- **Recent activity**: apa yang terjadi belakangan, dengan tautan ke audit log.

## Langkah berikutnya

- Tambahkan server Anda yang lain: [Tambah server](guide:add-a-host).
- Tambahkan database dan query dengan aman: [Database](guide:databases).
- Minta bantuan agen dengan kata-kata biasa: [Agen](guide:agent).
- Pelajari cara Komando mencegah Anda mengubah sesuatu tanpa sengaja: [Touch ID dan keamanan](guide:touch-id-and-safety).
