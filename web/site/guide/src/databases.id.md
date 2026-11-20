Komando memungkinkan Anda membaca database tanpa risiko mengubahnya tanpa sengaja, dan mengubah data hanya saat Anda memang mau. Tambahkan database-nya dulu: lihat [Menambah database, cache, atau yang lain](guide:add-a-connection).

## Membuka database

1. Buka **Connections** di sidebar, klik chip **Databases**, lalu database-nya, misalnya `prod-db`. Database terbuka sebagai tab di **Overview**-nya.
2. Overview punya pemeriksaan cepat yang tidak mengubah apa pun: **Info**, **Sizes**, **Activity**, dan **Locks**. **About this connection** punya **Test** (⇧⌘T).
3. Klik tab **Query**.

{shot:databases/query|Tab Query pada prod-db: tabel di samping, editor query, dan hasilnya.}

## Menjalankan query

Tab Query menampilkan tabel di samping (**Filter tables** mencarikan satu tabel), editor query, dan hasil di bawahnya.

Di samping, tabel dikelompokkan menurut schema-nya. Schema pertama terbuka; klik sebuah schema, atau tekan → dan ←, untuk membuka atau menutupnya. **Filter tables** hanya menyisakan schema yang cocok. Komando mengingat schema mana yang terbuka dan tabel yang Anda pilih, untuk tiap database. Klik sebuah tabel untuk melihat kolomnya; view tidak menampilkan kolom.

1. Tulis query, misalnya `select * from orders limit 20`.
2. Klik **Run** (⌘↩). Selama berjalan, **Run** berubah menjadi **Stop**.
3. Baris-barisnya muncul, dan status bar menyebut jumlah baris dan kolom, serta berapa lama prosesnya.

### Mengurutkan dan mengatur lebar hasil

- Klik judul kolom untuk mengurutkan baris menurut kolom itu. Angka diurutkan menurut nilainya, dan nilai kosong (NULL) ditaruh paling akhir. Klik lagi untuk membalik urutannya. Baris yang Anda pilih tetap terpilih.
- Seret tepi kolom untuk melebarkan atau menyempitkannya. Klik dua kali tepinya untuk menyesuaikan lebar kolom lagi. Komando mengingat lebarnya untuk tiap jenis hasil.
- Seret garis di antara tabel, editor, dan hasil untuk memberi salah satunya ruang lebih. Komando juga mengingatnya.
- Panah bulat di bawah daftar tabel membaca ulang tabel-tabelnya.

### Perubahan dimatikan

☐ **Allow changes** mati, jadi database menolak perubahan apa pun: "Allow changes is off: the database refuses any change." Query yang hanya membaca selalu berjalan.

## Lainnya di ⋯

- **Dry Run**: menjalankan perubahan, menunjukkan apa yang akan terjadi, lalu membatalkannya. Status bar menulis "Rolled back" dan tidak ada yang disimpan.
- **History**: query yang Anda jalankan di sini. Memilih salah satu mengembalikannya ke editor tanpa menjalankannya. **Clear History** menghapusnya.
- **Export Results as CSV…**: menyimpan baris-barisnya sebagai file. Nilai yang akan dijalankan spreadsheet sebagai rumus (yang diawali `=`, `+`, `-`, atau `@`) diberi `'` di depannya, jadi data dari server tidak pernah bisa berjalan di Excel atau Numbers. Angka biasa seperti `-5` tetap apa adanya.
- **Open SQL Shell**: prompt SQL di tab tersendiri.
- **Open in Terminal**: prompt SQL yang sama di aplikasi Terminal Mac.

## Mengubah data dengan sengaja

1. Centang ☐ **Allow changes**. Baris di bawahnya menulis "Allow changes is on: the next query may change data."
2. Tulis perubahannya, misalnya `update orders set status = 'paid' where id = 48213`, lalu klik **Run**.
3. Hasilnya menyebut berapa baris yang berubah, dan status bar menulis **Committed**.
4. Hapus centang ☐ **Allow changes** setelah selesai.

Jika Anda menjalankan perubahan saat kotak itu mati, komando menghentikannya dan bertanya "This changes data", dengan **Allow Writes**. Allow Writes menjalankan ulang satu query itu dengan `--write`. Kotaknya tetap mati, jadi perubahan berikutnya bertanya lagi. Pada database yang dilindungi, perubahan bertanya "This target is protected" dengan perintah persisnya dan **Run Anyway**. **Cancel** pada kedua pertanyaan itu tidak menjalankan apa pun.

> Coba perubahan dengan Dry Run dulu. Anda melihat apa yang akan terjadi, dan tidak ada yang disimpan.

## MongoDB

Database MongoDB bekerja dengan dokumen, bukan SQL. Tab Query-nya menampilkan daftar collection dan menerima perintah JSON; tidak ada SQL shell.

## Jika ada masalah

- Error muncul di banner merah di atas hasil, dalam kata-kata komando beserta petunjuk.
- Kata sandi tidak ada: baris database menulis "Password missing", dengan **Add Password**. Lihat [Keychain](guide:keychain#a-missing-password).
- Tab **Backups**, dengan Back Up Now dan Restore, segera hadir. {coming:db-backups}

## Di command line

`komando db query prod-db 'select …'` menjalankan query yang sama, hanya-baca kecuali Anda menambahkan `--write`.
