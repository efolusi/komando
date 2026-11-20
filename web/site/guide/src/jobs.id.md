Job adalah perintah panjang, misalnya backup, yang terus berjalan di servernya setelah Anda memutus koneksi atau menutup Komando. Halaman **Jobs** menampilkan daftarnya dan mengikuti log-nya.

## Lihat job Anda

Buka **Jobs** di bawah **More** di sidebar, atau klik **View** di samping "3 background jobs" di Home.

Setiap job menulis apa yang dijalankannya dan di mana, beserta statusnya: **Running**, **Done**, **Failed**, atau **Unknown**. Chip menyaringnya. **Refresh** menanyakan lagi ke tiap server apakah job-nya masih berjalan.

{shot:jobs/jobs|Jobs: backup yang sedang berjalan di backup-1, dengan log-nya di samping daftar.}

## Mulai job

1. Di **Jobs**, klik **Start a Job…**.
2. Pilih **Server** dan ketik **Command**, misalnya `./backup.sh --full`. Perintah berjalan lewat login shell server, seperti baris yang diketik di sana.
3. Periksa baris persis yang akan dijalankan, di bawah "komando runs:". Karakter tersembunyi ditulis lengkap di sana, jadi baris itu terbaca sesuai yang akan berjalan. Lalu klik **Start Job**.

Job baru langsung terpilih, dengan log-nya di samping. Di server yang dilindungi, Komando bertanya dulu. [Agen](guide:agent) juga bisa memulai job untuk Anda.

## Ikuti, hentikan, atau hapus job

Tombol ⋯ milik job, dan klik kanan di barisnya, berisi:

- **Show Log**: log-nya, di samping daftar, mengikuti baris baru. Seret garis di antara daftar dan log untuk membuat log lebih lebar atau lebih sempit; klik dua kali mengembalikannya.
- **Run Again…**: membuka Start a Job dengan server dan perintah yang sama sudah terisi. Tidak ada yang berjalan sampai Anda mengklik **Start Job**.
- **Stop Job**, selama job berjalan. Komando bertanya dulu: "Stop this job?"
- **Remove Job…**, setelah job berakhir. Komando bertanya dulu: "Remove this job?" Job hilang dari daftar ini; log-nya di server tetap ada.
- **Copy Command**: satu baris yang menjalankan hal yang sama, bahkan saat perintahnya punya baris baru.

## Bila ada yang salah

- **Unknown**: komando tidak bisa bertanya ke server, karena server tidak menjawab atau sudah keluar dari inventaris. Klik **Refresh** untuk mencoba lagi.
- Bila tidak ada job, halaman menulis "No background jobs".

## Di command line

`komando job start backup-1 -- ./backup.sh --full` memulai job yang sama, dan `komando job` mengikuti, menunggu, dan menghentikan job.
