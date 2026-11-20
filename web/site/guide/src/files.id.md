Salin file antara Mac ini dan sebuah server, dan lihat setiap salinan selesai. Saat ini Files terbuka untuk satu server sekaligus. Tempat Files yang lebih besar, dengan penyalinan antara dua server, akan hadir. {coming:files-place}

## Buka Files

- Di **Hosts**, klik ⋯ milik server (atau klik kanan barisnya) dan pilih **Files**.
- Di terminal, klik ⋯ di toolbar dan pilih **Files**.
- Untuk storage bucket (SFTP, S3, dan sejenisnya), pilih **Browse Files** di ⋯ barisnya di **Connections**.

Sebuah tab terbuka dengan Mac ini di kiri dan server di kanan, masing-masing dengan foldernya di bagian atas. Klik dua kali sebuah folder, atau pilih lalu tekan Return, untuk membukanya. Panah di atas tiap sisi naik satu folder.

{shot:files/files|Files untuk web-1: Mac ini di kiri, server di kanan, dan daftar Transfers di bawah.}

## Salin file

1. Pilih file di salah satu sisi.
2. Klik **Upload to web-1** (⌘↑) untuk mengirimnya dari Mac ini ke server, atau **Download to This Mac** (⌘↓) untuk mengambilnya dari server. Anda juga bisa menyeretnya ke sisi lain.
3. Salinan tampil di bawah **Transfers**: arahnya, filenya, progress bar, dan sisa yang belum tersalin. Salinan yang selesai bertulis **Done**.

**Clear Finished** mengosongkan daftar.

Folder utuh belum bisa disalin dari Files; aplikasi menulis "Folders: use komando upload -r". {coming:files-place}

## Edit file di server

Pilih file teks di sisi server, klik ⋯ di toolbar, lalu pilih **Edit…**. Komando membukanya di tempat. File teks di bawah 1 MiB bisa diedit.

- Klik **Review Changes** untuk melihat apa yang Anda ubah, lalu **Save with Backup**. Versi lama disimpan di samping file, sebagai `NAME.bak` dengan tambahan waktu.
- Untuk file milik root, centang **Write with sudo (for a file root owns)**.
- Bila file berisi rahasia, Komando menampilkan `[hidden]` di sana dan tidak menyimpan, supaya tanda itu tidak pernah menimpa nilai aslinya.

## Lainnya

Tombol ⋯ yang sama berisi **New Folder…** (di server), **Show web-1 Only**, dan **Reload**.

## Bila ada yang salah

- Server yang dilindungi: upload yang menambah atau mengganti file lebih dulu bertanya "This target is protected". **Cancel** membuat barisnya bertulis "Not uploaded". **New Folder…** bertanya dengan cara yang sama, dengan perintah komando yang persis dan **Run Anyway**.
- Download ke file yang sudah ada di Mac ini bertanya "Replace app.log on this Mac?" dengan **Replace**.
- Salinan yang gagal menulis alasannya, dengan warna merah, di barisnya sendiri.

## Salin antara dua server

Penyalinan dari satu server ke server lain, lewat Mac ini, akan hadir bersama tempat Files yang baru. {coming:server-to-server} Saat ini, download file ke Mac ini, lalu buka Files server lain dan upload file itu.

## Di command line

`komando cp`, `komando upload` (dengan `-r` untuk folder), `komando download`, dan `komando sync` melakukan hal yang sama, dan `komando fs` menampilkan, membaca, dan mengedit file di server.
