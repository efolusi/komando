Ubah detail server atau koneksi, lindungi, atau keluarkan dari inventaris, tanpa command line.

## Mengubah server atau koneksi

1. Klik kanan barisnya di **Hosts** atau **Connections**, atau pakai ⋯ pada baris, lalu pilih **Edit Host…** untuk server atau **Edit…** untuk yang lain.
2. Sheet "Edit web-2" menampilkan detailnya, sudah terisi, dalam urutan yang sama dengan New Host:
   - **Name**: nama baru diganti di semua tempat komando memakainya.
   - **Address**: `user@address`, dengan `:port` jika SSH tidak mendengarkan di 22. Hapus user atau port untuk mengosongkannya.
   - **Log in with**: cara server login saat ini sudah terpilih. Lihat [Mengubah cara server login](guide:log-in#change-how-a-server-logs-in).
   - **Reach through a server or VPN**, **Groups**, dan **Protected**.
   - **More**: kata sandi sudo. Yang tersimpan tampil sebagai "Sudo password saved"; biarkan kolomnya kosong untuk mempertahankannya.
3. Klik **Save**. Tombol ini tetap redup sampai ada yang berubah, dan hanya yang berubah yang dikirim. Banner menulis "Saved web-2." Tab yang terbuka untuk target yang diganti namanya mengikuti nama baru.

Jika penyimpanan gagal, pesan komando muncul di atas tombol dan yang Anda ketik tetap ada di sheet, jadi Anda bisa mencoba lagi.

**Edit…** pada koneksi mengubah nama, grup, rute, dan Protected-nya. Mengubah kata sandinya di sana segera hadir. {coming:edit-login}

## Kata sandi baru untuk server

Ketik di **Log in with**, pada tab **Password**, di **Set a new password**. Cara kerjanya:

- Kata sandi tersimpan tidak pernah ditampilkan. Sheet menulis "Password saved (secret:web-2-pass)" di atas kolom kosong. Biarkan kolomnya kosong untuk mempertahankan kata sandi yang ada.
- Kata sandi baru tidak pernah menimpa yang tersimpan. Komando menyimpannya dengan nama yang belum dipakai secret mana pun, misalnya `secret:web-2-pass-2`, dan web-2 login dengannya mulai saat itu.
- Kata sandi lama tetap ada di keychain. Saat tidak ada lagi yang memakainya, hapus di halaman [Keychain](guide:keychain#more-for-a-secret). Jika server lain ikut memakainya, sheet menyebut server itu, dan kata sandinya tidak berubah.
- Sebelum menyimpan apa pun, **Save** membaca ulang daftar secret milik komando sendiri. Jika komando tidak bisa membaca daftar secret-nya, tidak ada yang disimpan, dan sheet menyebutkannya.
- Jika penyimpanan gagal, pesan komando muncul di sheet dan kata sandi yang Anda ketik tetap ada di kolomnya, jadi Anda bisa mencoba lagi. Jika secret baru sudah telanjur disimpan, Komando bertanya "Remove secret:web-2-pass-2 again?" sebelum menghapusnya.

{shot:edit-or-remove/edit-host|Sheet Edit Host untuk web-2.}

## Semua isi menu baris

Setiap server dan koneksi punya menu yang sama di empat tempat: ⋯ pada barisnya, klik kanan pada baris, tab-nya, dan ⋯ di halamannya. Menu itu punya lima kelompok, selalu dalam urutan ini:

1. Aksinya sendiri, menurut jenis: **Open Terminal** dan **Files** untuk server, **Query** untuk database, **Keys** untuk cache, **Files** untuk storage, **Peek Messages** untuk queue, **Images** untuk registry, **Workloads** dan **Events** untuk cluster.
2. **Test Connection**.
3. **Run Recipe** › dan **New Forward…**. Lihat [Recipe](guide:recipes) dan [Port forwarding](guide:port-forwarding).
4. **Copy Name**, **Copy Address**, dan **Show SSH Command**. Salinan selalu [satu baris bersih](guide:touch-id-and-safety#copy-gives-one-clean-line).
5. **Edit Host…** (atau **Edit…**) dan **Remove Host…** (atau **Remove…**).

Setiap halaman juga punya satu tombol utama untuk jenisnya, misalnya **Open Terminal**, **Browse Files**, **Peek Messages**, **Show Images**, atau **Show Workloads**.

## Melindungi target

Nyalakan **Protected** di sheet Edit, atau klik **Protect** pada temuan di Home. Mulai saat itu, setiap perubahan pada target itu bertanya dulu. Lihat [Touch ID dan keamanan](guide:touch-id-and-safety#protected-targets).

Menyimpan perubahan apa pun pada target yang dilindungi, termasuk mematikan Protected, bertanya dulu "This target is protected", sebelum ada yang disimpan. Pertanyaan itu menyebut satu flag yang ditambahkan oleh jawaban ya Anda (`--yes`) dan menunjukkan perintah persisnya. Jawaban ya Anda hanya berlaku untuk satu perintah itu: perubahan berikutnya bertanya lagi. **Cancel** tidak menyimpan apa pun.

## Menghapus target

1. Klik **Remove…** di kiri sheet Edit, atau **Remove Host…** (**Remove…** untuk koneksi) di menu baris.
2. Komando bertanya "Remove web-2 from the inventory?". komando melupakannya; kata sandinya tetap ada di keychain, dan server atau database itu sendiri tidak disentuh.
3. Banner menyebut target itu sudah tidak ada di inventaris, dan tab yang terbuka ditutup.

Tidak ada undo. Untuk mengembalikannya, tambahkan lagi; kata sandinya masih ada di keychain.

## Di command line

`komando host edit`, `komando conn edit`, `komando vpn edit`, dan `komando host rename` melakukan hal yang sama, dan `komando host rm` menghapus server.
