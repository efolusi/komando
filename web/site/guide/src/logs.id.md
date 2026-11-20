Tab **Logs** membaca apa yang dicatat server selama berjalan: system journal-nya, log satu service, atau sebuah file log. Anda bisa membaca baris terakhir, atau mengikuti baris baru saat masuk.

## Baca log

1. Buka server dan klik tab **Logs**.
2. Di bawah **Read from**, pilih:
   - **System journal**: semua yang dicatat systemd di server. Ini pilihan bawaan.
   - **Service…**: log satu service. Ketik namanya, misalnya `nginx`, lalu tekan Return.
   - **Log file…**: sebuah file. Ketik path lengkapnya, misalnya `/var/log/nginx/error.log`, lalu tekan Return.
3. Di bawah **How much**, pilih **Last 100 lines**, **Last 200 lines** (bawaan), **Last 1,000 lines**, atau rentang waktu: **Last 15 minutes**, **Last hour**, atau **Last 24 hours**. File log tidak punya waktu, jadi pilih jumlah baris untuknya.

Setiap baris menampilkan waktu, program yang menulisnya, dan teksnya. Peringatan tampil kuning dan galat tampil merah. Baris terbaru ada di bawah.

{shot:logs/logs|Tab Logs di web-1: system journal, 200 baris terakhir.}

## Ikuti baris baru

Nyalakan **Follow**. Komando membaca yang Anda minta, lalu terus menambah baris baru di bawah saat server menulisnya. Status bar menulis "Following" dan jumlah baris yang ditampung. Aplikasi menyimpan 5.000 baris terakhir.

Mematikan **Follow**, meninggalkan tab, atau memilih sumber lain akan menghentikannya. **Reload** (⌘R) membaca ulang.

## "Cut short"

Bila server punya lebih banyak baris daripada yang Anda minta, status bar memberi tahu, misalnya "Cut short: only the last 200 lines. Pick more lines to see further back." Pilih angka lebih besar di bawah **How much** untuk membaca lebih jauh ke belakang.

## Bila ada yang salah

- Membaca butuh root: sebagian log hanya bisa dibaca administrator server. Banner lalu menawarkan **Read With sudo**, yang membaca ulang sumber itu lewat `sudo` di server.
- Hanya entri milik Anda yang tampil: banner kuning memberi tahu, dengan **Read With sudo** yang sama.
- komando gagal: banner merah dengan pesan dan sarannya, dan **Try Again**.

## Di command line

`komando logs web-1` membaca hal yang sama, dengan `--unit nginx` untuk service, `--file PATH` untuk file, dan `-f` untuk mengikuti.
