Home adalah tempat pertama di sidebar (⌘1). Home memberi tahu apa yang perlu perhatian, apa yang sedang berjalan, dan apa yang terjadi belakangan, jadi Anda tidak perlu membaca output komando.

## Tiga bagian

- **Needs attention**: sampai dua temuan, masing-masing satu kalimat ("web-1 allows root to log in with a password."), apa yang dilakukan tombolnya, dan tombolnya. Temuan adalah masalah yang ditemukan health check komando, yaitu doctor-nya.
- **Running now**: VPN dan forward yang sedang aktif, dan baris seperti "3 background jobs" dengan **View**.
- **Recent activity**: apa yang terjadi belakangan, dengan tautan ke **Audit Log**.

Jika tidak ada yang perlu perhatian, bagian itu menampilkan "Everything looks fine." dengan **Refresh**.

{shot:home-and-findings/home|Home: Needs attention dengan dua temuan, Running now, dan Recent activity.}

## Perbaiki temuan

Setiap temuan punya satu tombol. Fungsinya:

- **Fix**: komando mengubah pengaturan untuk Anda. komando bertanya dulu, "Run the fix?", dan menampilkan apa yang berubah dan perintah persisnya, setiap kata seperti yang akan dijalankan, dengan karakter tersembunyi ditulis jelas. Klik **Run the Fix**.
- **Protect Host** atau **Protect Connection**: menandai target sebagai protected, sehingga setiap perubahan di sana bertanya dulu. Tombol ini bertanya "Protect staging-db?" dulu.
- **Remove Connection**, **Remove Host**, atau **Remove Group**: menghapus yang disebut temuan, misalnya koneksi yang menyalin koneksi lain. Bertanya dulu.
- **Add Password**: membuka sheet untuk menyimpan kata sandi yang hilang. Lihat [Keychain](guide:keychain#a-missing-password).
- **View**: membuka tab target.
- **How to Fix**: untuk hal yang tidak bisa diubah komando untuk Anda, karena butuh file, nilai, atau keputusan yang hanya Anda punya. Menampilkan kata-kata komando sendiri dan perintah yang perlu dijalankan, dengan **Copy Command**, yang menyalin satu baris dan menampilkan "Copied". Tidak mengubah apa pun. Klik **Close** jika sudah selesai.

Temuan mendapat tombol sekali klik hanya jika perintahnya mengubah setup komando sendiri di Mac ini dan tidak butuh flag keamanan. Perintah yang berjalan di server, misalnya restart service, selalu tampil di **How to Fix**, untuk Anda jalankan sendiri.

Setelah perbaikan, banner menampilkan "Done. web-1 is fixed; the finding clears on the next check."

**Cancel** pada pertanyaan apa pun tidak mengubah apa-apa. Di target yang protected, pertanyaannya juga menyebutkan bahwa komando akan menjalankannya dengan `--yes`.

## Semua temuan

Klik **View all** di Needs attention, atau pilih **Go** › **All Findings**. Tab Findings menampilkan setiap temuan, lalu **Passed** dengan pemeriksaan yang baik-baik saja. **Refresh** menjalankan pemeriksaan sekarang.

## Security update

Kartu untuk server yang menunggu security update akan hadir di Home. {coming:home-updates} Untuk sekarang, buka tab [Updates](guide:updates) milik server.

## Setelah komando ter-update ke 0.15.0

komando 0.15.0 memeriksa forward, koneksi VPN, dan login server dengan lebih ketat. Yang dimulai oleh komando versi lama dianggap berakhir setelah update.

Sekali saja, setelah update, Home menampilkan catatan di atas: "komando was updated. Forwards, VPN connections and server logins started before the update have ended. Start them again where you need them." Tutup dengan ✕. Di iPhone dan iPad, catatan itu menyebut komputer komando.

### Sebelum Anda update

Akhiri sendiri dulu, agar tidak ada yang tertinggal berjalan di latar belakang:

```bash
komando vpn down --all
```

```bash
komando tunnel stop --all
```

```bash
komando logout SERVER
```

Jalankan baris terakhir sekali untuk setiap server yang Anda masuki dengan `komando login`. Lalu update:

```bash
komando update
```

Setelah update, mulai lagi forward dan koneksi VPN Anda di tempat yang Anda butuhkan.

### Jika Anda sudah update

Koneksi lama mungkin masih berjalan di latar belakang. Koneksi VPN baru ke jaringan yang sama lalu bisa gagal. Restart Mac Anda, atau hentikan proses `komando` dan `openconnect` yang lama di Activity Monitor, lalu hubungkan lagi.

Ini hanya terjadi sekali, untuk update ke 0.15.0. Update berikutnya membiarkan koneksi yang sedang berjalan.

## Di command line

`komando doctor` menjalankan pemeriksaan yang sama.
