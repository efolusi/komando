# Mulai

komando adalah satu program yang Anda jalankan di terminal. Di halaman ini Anda menginstalnya, menambah satu server, memeriksa bahwa komando bisa login, melihat-lihat isi server itu, lalu menghubungkan agen AI Anda.

## 1. Instal komando

Salin baris instal dari [Instal komando](site:index.html#install) di halaman utama, lalu tempel ke terminal (di macOS, aplikasi **Terminal**). Untuk Windows dan cara instal lain, baca [Instal, update, hapus](install.md).

Lalu periksa bahwa komando berjalan:

```bash
komando version
```

Muncul `command not found`? Installer menaruh komando di folder yang belum dicari oleh terminal Anda. Jalankan baris `export PATH=...` yang dicetaknya, lalu tambahkan baris itu ke `~/.zshrc` (macOS) atau `~/.bashrc` (Linux) agar tetap berlaku.

## 2. Tambah server

Ketik `komando host add` dan jawab satu pertanyaan per baris: nama, alamat, user, port, cara komando login, dan apakah ini production. Setelah itu komando menampilkan perintah lengkapnya, jadi lain kali Anda bisa mengetiknya sendiri:

```bash
komando host add web1 ubuntu@203.0.113.10
```

Kalau `ssh` sudah berjalan di komputer ini, biasanya komando juga berjalan: komando memakai key yang sama dan ssh-agent yang sama. Selengkapnya tentang login ada di [Server](servers.md).

Sudah punya daftar server di `~/.ssh/config`? Bawa semuanya sekaligus. Dry run menampilkan dulu apa yang akan ditambahkan:

```bash
komando import ssh-config --dry-run
komando import ssh-config
```

Sumber lain, seperti file `.env`, `~/.pgpass`, atau PuTTY, ada di [Pindah ke komando dan pindah komputer](import.md).

## 3. Periksa dan lihat-lihat

```bash
komando test web1      # bisakah komando login?
komando facts web1     # server apa ini, dan apa yang perlu diperhatikan?
```

`facts` melaporkan OS, CPU, memori, disk, beban, package manager, dan tool yang terinstal. Perintah ini juga menyebut apa yang perlu diperhatikan, misalnya OS yang tidak lagi mendapat update keamanan. Selengkapnya di [Pemeriksaan kesehatan dan jaringan](health.md).

Jalankan satu perintah, atau buka shell di server:

```bash
komando exec web1 -- uptime
komando shell web1
```

Semua yang ada setelah `--` adalah perintah yang berjalan di server. [Menjalankan perintah](commands.md) juga menjelaskan tugas panjang dan perintah tersimpan.

## 4. Lindungi production

Tandai server production sebagai protected. Setelah itu setiap perubahan di server itu bertanya dulu kepada Anda, di terminal Anda:

```bash
komando host edit web1 --protected
```

[Keamanan](safety.md) menjelaskan apa yang dihentikan komando, dan apa yang perlu dilakukan saat komando menghentikan Anda.

## 5. Hubungkan agen AI Anda

```bash
komando guide install
```

Perintah ini menghubungkan agen Anda (Claude Code, Codex, Cursor, atau Gemini CLI) ke komando. Kata sandi tetap di vault komando, dan agen tidak pernah melihatnya. Jalankan lagi setiap kali selesai `komando update`.

## Langkah berikutnya

- [Target](targets.md): bekerja di satu server, satu grup, satu tag, atau semuanya sekaligus.
- [File](files.md): membaca, mengedit, dan menyalin file dengan aman.
- [Database](databases.md) dan [Cache](caches.md): query keduanya dari command line yang sama.
- [Glosarium](glossary.md): kata-kata yang dipakai komando, dalam bahasa sehari-hari.
