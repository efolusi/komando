# Home, Indonesian

The Indonesian copy of `index.html`, in its order. Each block names the English element it replaces. Product names (komando, Komando), commands, flags and file names stay as they are.

## Head

- title: komando, command line DevOps untuk Anda dan agen AI Anda
- description: Server, database, cache, storage, dan VPN dalam satu inventaris, hanya-baca sampai Anda izinkan. Gratis dan open source.

## Navigation

- Skip to content: Langsung ke konten
- Product: Produk
- Command line: Command line
- Inventory, "One list for every service": Inventaris, "Satu daftar untuk semua layanan"
- Safety, "Read-only until you say so": Keamanan, "Hanya-baca sampai Anda izinkan"
- Install, "macOS, Linux and Windows": Instal, "macOS, Linux, dan Windows"
- Komando apps: Aplikasi Komando
- Agent, "Runs komando, asks first": Agen, "Menjalankan komando, bertanya dulu"
- Editions, "Free now, an upgrade later": Edisi, "Gratis sekarang, upgrade nanti"
- User guide, "How to use Komando, one page per task": Panduan, "Cara memakai Komando, satu halaman per tugas"
- Safety / Agent / Editions / Guide / Docs: Keamanan / Agen / Edisi / Panduan / Dokumentasi
- Install komando: Instal komando
- Latest komando release: v0.15.0: Rilis komando terbaru: v0.15.0

## Hero

- h1: Command line DevOps untuk Anda dan agen AI Anda
- lede: Server, database, cache, storage, dan VPN dalam satu inventaris, hanya-baca sampai Anda izinkan. Command line-nya, komando, gratis dan open source. Aplikasi Komando (K besar) untuk Mac, iPhone, dan iPad yang menjalankannya juga gratis. Aplikasinya sudah dibuat dan sedang diuji.
- button: Baca panduan

## One command (statement)

- h2: Command line komando menggabungkan sesi SSH, klien database, redis-cli, dan lainnya dalam satu perintah.
- line: Agen AI Anda mendapat jangkauan yang sama tanpa pernah melihat satu kata sandi pun.
- note (English: "AI agents komando recognises by itself. For any other agent, set KOMANDO_AGENT=1", printed under the list of agents): komando mengenali agen AI di atas dengan sendirinya. Untuk agen lain, setel KOMANDO_AGENT=1.

## Inventory

- h2: Satu inventaris untuk semua server dan layanan
- p: Tambahkan target sekali, lalu panggil dengan namanya. Server, database, cache, storage, cluster, registry, dan VPN ada dalam satu daftar yang dibaca oleh Anda, skrip Anda, dan agen Anda.
- link: Lihat cara kerja rahasia dan output
- diagram labels: Anda / Skrip dan CI / Agen AI / Server / Database / Cache / Storage / Cluster / VPN

## Safety

- h2: Setiap target mulai dalam mode hanya-baca
- p: Perintah berbahaya diblokir. Target produksi bisa dilindungi, jadi komando bertanya dulu. Log audit lengkap mencatat apa yang dijalankan dan oleh siapa.
- steps: Lihat dulu / Tanya dulu / Cek catatannya
- link: Lihat apa yang gratis dan apa yang akan datang
- labels: Produksi / Staging

## Features

- h2: komando menangani rahasia, output, dan riwayat dengan cara yang sama di setiap mesin.
- card 1, "komando's keychain holds every secret": Keychain komando menyimpan setiap rahasia. Kata sandi tetap di keychain terenkripsi milik komando atau di password manager Anda sendiri. Agen yang dikenali komando mendapat hasilnya, tidak pernah rahasianya.
- card 2, "Every komando answer as text or JSON": Setiap jawaban komando dalam teks atau JSON. Orang membaca teks biasa. Skrip, job CI, dan agen menambahkan -o json dan mendapat jawaban yang sama sebagai data yang bisa diolah.
- card 3, "An audit log of every command": Log audit untuk setiap perintah. (command: komando audit)
- card 4, "One komando binary, clients built in": Satu binary komando, klien sudah di dalamnya. Klien SSH, database, dan VPN-nya sendiri sudah terpasang, dalam satu file.

## Agent

- h2: Agen yang menjalankan komando dan bertanya dulu
- p: Tekan ⌘J di Mac, atau buka tab Agent di iPhone, lalu jelaskan masalahnya. Agen menjalankan komando, menampilkan setiap perintah, dan bertanya sebelum mengubah apa pun, dengan Claude Opus 5.5 dan API key Anthropic milik Anda sendiri.
- link: Lihat apa yang dilakukan aplikasinya
- demo lines: Aplikasi di web-1 sedang menunggu prod-db. / Query 48213 sudah menahan tabel orders selama 14 menit.

## Editions

- h2: Gratis sekarang, upgrade nanti
- p: Aplikasi Komando untuk Mac, iPhone, dan iPad sudah dibuat dan sedang diuji, tetapi belum ada link unduh dan belum ada tanggal. Aplikasinya akan gratis, sama seperti command line-nya, dan menjalankan komando di mesin Anda sendiri, tanpa akun dan tanpa masa uji coba.
- free list: Gratis, semuanya lokal / Setiap perintah, dalam teks atau JSON / Tab terminal, klien database, port forwarding / Perbaikan sekali klik, agen, menu bar / Perbaikan, cek cepat, dan agen saat bepergian
- upgrade list: Upgrade, nanti / Sinkronisasi antar perangkat / Tim / AI bawaan, tanpa API key sendiri / Setujui perubahan dari ponsel
- note: Belum ada yang bisa dibeli. Komando akan mengabarkannya di sini saat upgrade siap.

## Install

- h2: Instal komando di macOS, Linux, atau Windows
- p: Satu baris menginstal rilis v0.15.0
- h3: macOS, Linux, dan Windows
- p: Buka terminal dan jalankan baris ini. Di Windows, komando berjalan lewat WSL: buka terminal WSL dan jalankan baris yang sama.
- button: Salin perintah
- p (the label before the verify step): Periksa installer-nya dulu.
- p: Installer memastikan rilisnya ditandatangani dengan kunci proyek komando, pemeriksaan yang sama dengan komando update.
- h3: Dengan Go 1.27.4 atau lebih baru
- p: Kalau Go sudah terpasang, baris ini membangun komando dari kode sumbernya.

## Close

- h2: Sepuluh menit pertama Anda dengan Komando
- p: Instal komando, tambahkan satu server, lalu login ke server itu. Gratis dan open source dengan lisensi AGPL-3.0; aplikasi Komando juga akan gratis.
- button: Baca halaman panduan pertama

## Footer

- line: Satu command line yang aman untuk pekerjaan DevOps.
- Command line: Inventaris / Keamanan / Instal / Dokumentasi / Kode sumber di GitHub
- Komando apps: Agen / Edisi / Panduan
