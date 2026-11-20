Tab **Updates** menampilkan update yang sedang ditunggu server, yang security lebih dulu, dan memasangnya saat Anda izinkan. Tab ini juga memberi tahu saat server perlu reboot untuk menyelesaikan update.

## Lihat yang sedang menunggu

Buka server dan klik tab **Updates**. Komando menanyakan ke server update mana yang menunggu; ini tidak mengubah apa pun.

**Waiting updates** menampilkan setiap paket: namanya, versi terpasang, versi baru, dan jenisnya. Update security bertanda **Security** dan tampil paling atas. Baris di bawah judul menulis jumlahnya, misalnya "12 updates, 3 of them for security."

**About these updates**, di kanan, menulis alat apa yang memasang paket di server (apt, dnf, dan sejenisnya), seberapa lama daftar paketnya, apakah server perlu reboot, dan service mana yang perlu di-restart setelah update.

Bila tidak ada yang menunggu, tab menulis "web-1 is up to date".

{shot:updates/updates|Tab Updates: Waiting updates dengan tiga update security, dan About these updates.}

## Ambil daftar terbaru

Server hanya tahu update yang ada di daftar paketnya. Bila daftarnya lama, klik **Refresh** di bawah About these updates. Tombol ini mengunduh daftar terbaru dan memeriksa lagi; tidak ada yang dipasang. Di server yang dilindungi, Komando bertanya dulu.

## Pasang update

1. Centang ☐ **Allow changes**. Sebelum itu, tombol-tombolnya redup dan tab menulis "Allow changes is off: nothing is installed or restarted."
2. Klik **Install Security Updates** untuk memasang yang security saja, atau **Install All**. Tooltip tiap tombol menampilkan perintah yang persis.
3. Selama memasang, tombol bertulis "Installing…". Prosesnya bisa makan waktu beberapa menit; komando menjalankannya di server, jadi menutup tab tidak menghentikannya.
4. Banner menulis apa yang terpasang, misalnya "Installed 3 security updates on web-1.", dan service mana yang perlu di-restart.

Di server yang dilindungi, komando lebih dulu bertanya "This target is protected". Bila update akan menghapus paket yang dibutuhkan server, misalnya `openssh-server` atau `sudo`, komando berhenti dan bertanya sebelum lanjut.

## Reboot saat update membutuhkannya

Saat update butuh reboot, kartu di atas menulis "web-1 needs a reboot to finish an update." dan alasannya, misalnya kernel Linux baru.

1. Centang ☐ **Allow changes**.
2. Klik **Reboot…**. Komando bertanya "Reboot web-1?" dan menampilkan perintah yang persis.
3. Selama berjalan, tombol bertulis "Rebooting…". komando menunggu sampai server menjawab lagi, lalu banner menulis bahwa server sudah kembali.

komando tidak pernah me-reboot server dengan sendirinya.

Update security juga akan tampil di Home. {coming:home-updates}

## Saat tidak bisa

- Sebagian alat paket (apk, zypper, pacman) tidak bisa memasang update security saja lewat komando; **Install Security Updates** lalu redup dan menulis alasannya.
- Server Windows: "komando can't update Windows servers yet."

## Baris System

Dengan komando 0.15.0 dan yang lebih baru, baris **System** di sini dibaca dengan `komando facts web-1 --only system`, dan Overview server membaca **Right now**, **System**, dan **Up for** dengan cara yang sama, juga di server yang dilindungi. Bila server tidak memberi nama atau uptime, barisnya menulis "Unknown".

Bila komando tidak bisa membacanya, barisnya menulis "Not read", dengan satu baris di bawah kartu yang menjelaskan sebabnya. Update Anda tidak terpengaruh, dan Anda tetap bisa memasangnya. Dengan komando yang lebih lama, Mac memakai skrip kecil yang hanya membaca, dan server yang dilindungi bisa menolaknya: barisnya lalu menulis "Not read" dengan alasan dari komando.

## Di command line

`komando pkg security web-1`, `komando pkg upgradable web-1`, `komando pkg upgrade web-1 --security`, dan `komando reboot web-1` melakukan hal yang sama.
