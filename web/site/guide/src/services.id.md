Service adalah program yang terus dijalankan server di latar belakang, misalnya web server (`nginx`) atau database. Tab **Services** menampilkan daftarnya, menunjukkan mana yang berjalan, dan memungkinkan Anda me-restart salah satunya.

## Lihat service

1. Buka server (⌘K lalu namanya, atau barisnya di **Hosts**).
2. Klik tab **Services**.

Setiap service punya titik dan kata untuk statusnya. Chip menyaring daftar: **All**, **Running**, **Stopped**, dan **Failed** (dengan jumlah bila ada yang gagal). **Filter services** mencari service berdasarkan nama atau deskripsinya.

Klik sebuah service untuk melihat statusnya di kanan: statusnya, sudah berapa lama berjalan, proses utamanya, memori, jumlah restart, dan baris log terakhirnya. Membaca tidak mengubah apa pun di server.

{shot:services/services|Tab Services di web-1, dengan nginx terpilih dan statusnya di kanan.}

## Restart, stop, atau start service

1. Centang ☐ **Allow changes**. Sebelum itu, tombol-tombolnya redup dengan tulisan "Tick Allow changes first", dan tab menulis "Allow changes is off: the services stay as they are."
2. Pilih service lalu klik **Restart**, **Stop**, atau **Start**.
3. Komando menampilkan perintah yang persis dan bertanya dulu. Konfirmasi untuk menjalankannya.

Tombol ⋯ di samping tombol-tombol itu berisi **Reload** (service membaca ulang pengaturannya tanpa berhenti), **Start at Boot** atau **Don't Start at Boot**, dan **Copy Name**.

Di server yang dilindungi, komando bertanya "This target is protected" sebelum apa pun berjalan.

> Hapus centang ☐ Allow changes setelah selesai. Opsi ini mati lagi setiap kali Anda membuka tab.

## Bila ada yang salah

- Server tidak menjawab: banner merah dengan pesan komando, dan **Read Again**.
- Perubahan gagal: Komando menampilkan status service dan baris yang ditulisnya ke log, supaya Anda bisa melihat sebabnya.

## Di command line

`komando svc` menampilkan, memeriksa, menjalankan, menghentikan, dan me-restart service, dan `komando svc logs` membaca log satu service.
