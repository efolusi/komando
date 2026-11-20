Terminal memberi Anda command prompt di sebuah server, seolah Anda duduk di depannya. Komando membukanya di dalam jendelanya sendiri, di tab di samping server itu.

## Buka terminal

1. Tekan ⌘K, ketik nama server, lalu tekan Return. Atau buka **Hosts** di sidebar dan klik baris server itu. Server terbuka sebagai tab, di **Overview**-nya.
2. Klik **Open Terminal**.
3. Terminal menulis "Connecting to web-1…" (dengan "through bastion" bila server dicapai lewat server lain). **Cancel** menghentikannya.
4. Pada kali pertama, `ssh` bertanya apakah identitas server itu dipercaya. Ketik `yes` lalu tekan Return. Bila diminta kata sandi, ketik kata sandinya; kata sandi tidak tampil saat diketik.

Prompt muncul, misalnya `deploy@web-1`, dan titik di toolbar terminal menjadi hijau.

Pintasan: klik dua kali baris server di Hosts untuk langsung ke terminalnya. Untuk menjangkau server yang tidak ada di inventaris, tekan ⌘K, ketik `deploy@10.0.0.4`, lalu pilih **Connect to deploy@10.0.0.4**.

{shot:open-a-terminal/terminal|Terminal di web-1, dengan menu ⋯ di toolbar terbuka.}

## Pane, sesi, dan lainnya

Tombol ⋯ di toolbar terminal, dan menu **Terminal**, berisi sisanya:

- **Split Right** (⌘D) menaruh pane kedua di server yang sama, di samping pane ini. **Split Down** (⇧⌘D) menaruhnya di bawah. Paling banyak empat pane.
- **Broadcast Input** (⌥⌘I, dengan dua pane atau lebih) mengetik ke semua pane sekaligus. Status bar menulis "Typing into 2 panes" sampai Anda memilih **Stop Broadcasting**.
- **New Session** (⌘T) membuka sesi lain di server yang sama.
- **Run a Recipe** menjalankan salah satu perintah tersimpan Anda di sini. Lihat [Resep](guide:recipes).
- **Files** membuka file server itu. Lihat [File](guide:files).
- **Restart Session** memulai sesi dari awal.
- **Open in Terminal App** membuka sesi yang sama di aplikasi Terminal milik Mac.
- **Bigger Text** (⌘+), **Smaller Text** (⌘−), dan **Actual Size** (⌘0), di menu **Terminal**, mengubah ukuran teks di semua pane, dari 11 sampai 28 poin. Komando menyimpan ukuran itu.

Dengan dua pane atau lebih:

- Seret garis di antara dua pane untuk memberi salah satunya ruang lebih. Komando mengingat ukurannya untuk tab berikutnya dan saat dibuka lagi. Sebuah pane tetap berukuran sama saat pane lain dibuka atau ditutup.
- Tanda × di kepala pane hanya menutup pane itu. Selama sesinya berjalan, Komando bertanya dulu: "Close this pane?" Pane lain tetap terbuka.

> Broadcast Input mengetik tombol yang sama di semua pane, tanpa pemeriksaan keamanan komando. Untuk menjalankan satu perintah di banyak server dengan pemeriksaan itu, pakai resep.

## Saat sesi berakhir

Saat Anda mengetik `exit`, atau server menutup sesi, pane menulis "Session ended", atau "Session ended with an error", dan menawarkan **Reconnect** dan **Close Pane**. Bila hanya ada satu pane, **Close Terminal** mengakhiri sesi dan membawa Anda kembali ke Overview server; tabnya tetap terbuka.

## Bila tidak bisa terhubung

Kepala pane menulis bahwa koneksi gagal, di samping titik merah. Pesan galat dan saran dari komando tetap tampil di atas bar bertuliskan "Could not connect to web-1", dengan **Reconnect** dan **Close Pane**.

- Kata sandi atau key salah: lihat [Login dengan key atau kata sandi](guide:log-in#change-how-a-server-logs-in).
- Server ada di balik VPN yang sedang mati: nyalakan VPN itu (lihat [VPN](guide:vpn)), lalu klik **Reconnect**.
- Server tidak menjawab tepat waktu: pastikan server menyala dan alamatnya benar (**Edit Host…** di Hosts).
- "Identity changed": host key server berbeda dari sebelumnya. Lihat [Saat identitas server berubah](guide:log-in#when-a-server-s-identity-changes).

## Yang tidak bisa dilakukan server pada terminal Anda

Terminal menampilkan apa yang dikirim server. Komando membuang beberapa hal yang bisa dipakai server untuk membuat aplikasi crash atau untuk menipu Anda. Sisanya tampil seperti biasa.

- Gambar yang dikirim sebagai output terminal (gambar Sixel, Kitty, dan iTerm2) tidak tampil.
- Server tidak bisa mengubah ukuran terminal Anda. Perintah resize xterm (`resize -s`) tidak berpengaruh, dan server tidak bisa mengganti pane antara 80 dan 132 kolom atau mengatur margin kiri dan kanan.
- Control sequence yang tidak pernah selesai dipotong, jadi tidak bisa membekukan pane.
- Output server tidak bisa berpura-pura bahwa host key berubah. Peringatan itu hanya pernah datang dari Komando sendiri.

Anda tidak perlu menyalakan apa pun untuk ini.

## Simpan satu set tab

Bila Anda membuka terminal yang sama setiap hari, simpan sebagai workspace. Tekan ⌘K dan pilih **Save Workspace…**: tab dan split yang terbuka disimpan dengan sebuah nama, misalnya `deploy`. Nanti, ⌘K → **Open Workspace deploy** membukanya kembali.

## Di command line

`komando shell web-1` di aplikasi Terminal membuka login shell yang sama.
