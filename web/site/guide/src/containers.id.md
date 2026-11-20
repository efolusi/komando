Server yang menjalankan Docker punya tab **Containers**. Tab ini menampilkan container, status dan log tiap container, dan memungkinkan Anda me-restart, menghentikan, atau menjalankan salah satunya. Server tanpa Docker tidak punya tab Containers.

## Lihat container

1. Buka server dan klik tab **Containers**.
2. Klik sebuah container. Di kanan: statusnya, port, CPU dan memori, dan 200 baris log terakhirnya, yang terbaru di bawah.

Chip menyaring daftar berdasarkan status. Tombol ⋯ milik container berisi **Copy Name** dan **Copy ID**.

{shot:containers/containers|Tab Containers di web-1, dengan shop-api terpilih dan baris log-nya.}

## Restart, stop, atau start container

1. Centang ☐ **Allow changes**. Sebelum itu, tombol-tombolnya redup dan tab menulis "Allow changes is off: the containers stay as they are."
2. Pilih container lalu klik **Restart**, **Stop**, atau **Start**.
3. Restart dan Stop bertanya dulu. Banner lalu menulis, misalnya, "Restarted shop-api on web-1."

## Image dan ruang kosong

Klik **Images** untuk melihat image yang tersimpan di server, ukurannya, dan container mana yang memakai tiap image.

Untuk mengosongkan ruang, klik ⋯ dan pilih **Free Up Space…**. Komando lebih dulu menampilkan apa yang akan dihapus (container yang berhenti, image tanpa nama, build cache) dan berapa ruang yang kosong, sebelum apa pun dihapus. Anda juga bisa mencentang "Also remove images no container uses". Volume dan data di dalamnya selalu tetap.

## Docker Compose

Tombol ⋯ yang sama berisi **Docker Compose…**. Ketik folder proyek di server, yang berisi `compose.yaml`, pilih tindakannya, lalu klik **Run**.

## Bila ada yang salah

- "Docker would not let deploy in": user login tidak diizinkan memakai Docker. Klik **Read with sudo** untuk membaca lewat `sudo`, atau tambahkan user itu ke grup `docker` di server.
- komando gagal: banner merah dengan pesannya dan **Try Again**.

## Di command line

`komando docker` memeriksa container, membaca log-nya, menjalankan compose, dan membersihkan.
