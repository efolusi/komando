Komando dibuat supaya Anda tidak bisa mengubah server tanpa sengaja. Membaca selalu aman; mengubah butuh centang, pertanyaan, atau keduanya. Halaman ini menjelaskan kontrol keamanan, audit log, dan kunci Touch ID.

## Allow changes

Halaman yang bisa mengubah sesuatu (Services, Updates, Containers, tab Query database, tab Keys cache, dan agen) punya satu kotak: ☐ **Allow changes**.

- Selama kotak itu mati, tombol yang mengubah sesuatu diredupkan, dengan "Tick Allow changes first". Database menolak perubahan apa pun, bahkan yang Anda ketik sendiri.
- Saat dicentang, halaman menjelaskan apa yang terjadi selanjutnya, misalnya "Allow changes is on: every change asks before it runs."
- Kotak itu mati lagi setiap kali Anda membuka halaman.

## Target yang dilindungi

Nyalakan **Protected** untuk server dan database produksi, saat menambahkannya atau di **Edit Host…** / **Edit…**. Pada target yang dilindungi, setiap perubahan bertanya dulu "This target is protected", dengan perintah persisnya dan **Run Anyway**. **Cancel** tidak menjalankan apa pun.

## Pertanyaan yang diajukan komando

komando menghentikan perintah berisiko dan Komando bertanya kepada Anda, dengan kata-kata biasa, satu kali:

- "This changes data", dengan **Allow Writes**, saat query akan mengubah database sementara ☐ Allow changes mati.
- "This target is protected", dengan **Run Anyway**.
- "This command looks destructive", untuk perintah yang bisa merusak, misalnya menghapus package yang dibutuhkan server.

Setiap pertanyaan menunjukkan perintah persisnya dan menyebut satu flag yang ditambahkan oleh jawaban ya Anda (`--write`, `--yes`, atau `--allow-dangerous`). Jawaban ya Anda hanya berlaku untuk satu perintah itu; perintah berikutnya bertanya lagi. **Cancel** selalu tidak menjalankan apa pun.

## Audit log

Audit log adalah catatan komando tentang setiap perubahan yang dibuatnya dan setiap upaya yang diblokirnya.

1. Buka **Audit Log** di bawah **More**, atau klik **Audit Log** di bawah Recent activity di Home.
2. Yang terbaru di atas: kapan, siapa (Anda atau agen), perintahnya, targetnya, dan hasilnya (Done, Failed, atau Blocked saat komando menghentikannya).
3. Chip menyaringnya: **All**, **Changes**, **Failed**, **Agent**. Menu **Last 200** menampilkan lebih banyak.
4. Klik sebuah baris untuk melihat perintah persisnya dan siapa yang mengizinkannya. Baris yang dijalankan agen punya **Open Conversation**. Seret garis di samping detail untuk melebarkan atau menyempitkannya.
5. Klik kanan sebuah baris untuk **Copy Command** (satu baris yang diterima komando, berisi apa yang dijalankan), **Show Target** (membuka server atau koneksi itu), dan **Show Only This Target** (hanya menampilkan entri target itu).

Untuk memeriksa bahwa tidak ada yang mengubah catatannya, klik ⋯ › **Verify the Record…**. Jika ada yang diubah di luar komando, Home menampilkan temuan.

{shot:touch-id-and-safety/audit-log|Audit Log: perubahan oleh Anda dan agen, satu Blocked.}

## Copy memberi satu baris bersih

Nama atau alamat bisa berasal dari server, dan server bisa menyembunyikan pindah baris atau kode kontrol di dalamnya. Jika ditempel ke terminal, itu bisa menjalankan perintah kedua yang tidak pernah Anda lihat.

Jadi di Mac, **Copy Name**, **Copy ID**, **Copy Address**, **Copy Key Name**, **Copy Local Address**, dan **Copy Command** selalu menyalin satu baris, dengan kode tersembunyi dibuang. ⌘C di tabel menyalin setiap sel dalam satu baris, jadi sebuah sel tidak bisa menambah baris.

Saat penyalinan berhasil, Komando menulis "Copied" sebentar di atas halaman.

## Kunci Touch ID

Kunci Komando supaya orang berikutnya di Mac Anda tidak bisa membuka server Anda di aplikasi.

> Kunci ini hanya berlaku untuk aplikasi Komando. Kunci ini tidak menghentikan orang di Mac Anda menjalankan `komando` di aplikasi Terminal, yang menjangkau server yang sama. Kunci Mac Anda sendiri (Control-Command-Q) saat Anda meninggalkannya.

1. Buka **Settings** (⌘,), tab **General**.
2. Nyalakan **Lock Komando with Touch ID**. macOS meminta Touch ID, atau kata sandi Mac Anda, untuk menyalakannya.

Mulai saat itu:

- Saat Komando terbuka, tertulis "Komando is locked". Klik **Unlock** dan pakai Touch ID atau kata sandi Mac Anda.
- Halaman Keychain bertanya lagi di setiap kunjungan, kecuali Anda membuka kunci dalam beberapa menit terakhir.
- Komando terkunci lagi saat Mac Anda terkunci atau tidur. Selama terkunci, tidak ada yang tampil dan tidak ada yang berjalan; sesi terminal tetap berjalan di latar belakang.
- Menu bar hanya menampilkan "Komando is locked", **Open Komando**, dan **Quit Komando**.

Mematikan kunci juga meminta Touch ID. Tanpa Touch ID, kata sandi Mac Anda tetap bisa dipakai, jadi tidak ada yang terkunci di luar.

{shot:touch-id-and-safety/locked|Komando terkunci, dengan tombol Unlock.}

## Di iPhone dan iPad

Di ponsel, setiap perubahan meminta Face ID dulu. Lihat [Komando di iPhone dan iPad](guide:iphone-and-ipad).

## Di command line

komando mengajukan pertanyaan yang sama di aplikasi Terminal, dan menyebut flag yang mengizinkan perintah itu (`--yes`, `--write`, `--allow-dangerous`). `komando audit` dan `komando audit verify` menampilkan dan memeriksa log-nya.
