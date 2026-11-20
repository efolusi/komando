Agen adalah asisten AI yang menjalankan komando untuk Anda. Jelaskan masalahnya dengan kata-kata biasa, misalnya "Which services failed on web-1 today?", lalu agen menjalankan perintah untuk mencari tahu, menunjukkan setiap perintah, dan menjelaskan apa yang ditemukannya. Agen tidak mengubah apa pun kecuali Anda izinkan, dan setiap perubahan bertanya dulu.

## Menyiapkannya sekali

Agen berjalan di akun Anthropic Anda sendiri, dan tagihannya masuk ke akun itu. Aplikasinya sendiri gratis.

1. Tekan ⌘J. Agen terbuka di kanan dan menulis "Add your Anthropic API key to start."
2. Klik **Settings…**. Settings terbuka di tab **Agent**.
3. Tempel key Anda di **Anthropic API key** dan klik **Save**. Key itu tersimpan di keychain Mac ini.

**Model**-nya Claude Opus 5.5. **Remove Key** menghapus key itu lagi.

## Bertanya

1. Tekan ⌘J, klik gelembung chat di header halaman, atau pilih **Go** › **Ask the Agent**.
2. Klik salah satu pertanyaan di bawah "Try asking", atau ketik pertanyaan Anda sendiri dan tekan Return. Shift-Return menambah baris. Ketik `@` untuk menambahkan server, database, atau grup ke pertanyaan. **Attach a File** menambahkan file log atau output.
3. Apa yang sedang Anda lihat ikut terbawa: di atas terminal, perintahnya; di atas tab sebuah target, target itu.

Agen bekerja dengan perintah yang terlihat. Setiap perintah menjadi satu baris berisi perintah persisnya, bagaimana perintah itu selesai, dan output-nya. Lalu agen menjelaskannya dengan kata-kata biasa. **Stop** (⌘.) mengakhiri gilirannya, dan **New conversation** memulai dari awal.

{shot:agent/drawer|Agen di samping terminal: perintah yang dijalankannya, jawabannya, dan kartu persetujuan.}

## Mengizinkannya mengubah sesuatu

1. Centang ☐ **Allow changes** di bawah kotak pertanyaan. Lalu tertulis "Each change asks first".
2. Setiap perubahan yang akan dihentikan komando demi keamanan menjadi kartu: risikonya ("prod-db is protected"), alasannya, perintah persisnya, **Don't Run**, dan **Allow Once**.
3. **Allow Once** menjalankan satu perintah itu. Pada target yang dilindungi, komando bertanya sekali lagi di jendelanya sendiri.

**Don't Run** melewatinya; agen melanjutkan tanpa perintah itu.

Beberapa pembacaan bisa menjangkau alamat lain di internet: `komando net`, `komando cert check`, dan perintah server yang memakai alat jaringan seperti `curl`. Agen bertanya sebelum menjalankan salah satunya, dengan kartu yang sama seperti perubahan. Jika ☐ **Allow changes** mati, agen tidak menjalankannya.

Kartu bergulir ke layar saat muncul. Jika Anda sudah menggulir ke atas untuk membaca, chip di bawah menulis "1 approval waiting"; klik untuk menuju kartu itu. Di saat-saat pertama, kartu mengabaikan klik, jadi klik yang Anda maksudkan untuk hal lain tidak bisa mengizinkan perubahan.

## Yang tidak pernah dilakukannya

- Agen tidak pernah mengklaim hasil yang tidak ditunjukkan oleh perintah.
- Agen tidak bisa membaca kata sandi Anda: komando menyembunyikan nilainya dari agen. Agen bisa melihat namanya, misalnya `secret:prod-db-pass`, dan server atau database mana yang memakai masing-masing.
- Dengan komando yang lebih lama dari 0.14.1, menyetujui perubahan pada koneksi, misalnya alamat baru, bisa mengirim kata sandi tersimpan koneksi itu ke alamat baru. Baca alamat di kartu sebelum Anda klik **Allow Once**. komando 0.14.1 dan yang lebih baru menolak langkah itu untuk agen (lihat di bawah).
- Agen tidak pernah mengubah atau menghapus kata sandi tersimpan melewati pengaman komando. Saat diminta, agen menjelaskan mengapa ia tidak mau. Ubah kata sandi sendiri di halaman [Keychain](guide:keychain#add-or-replace-a-secret), atau di terminal.
- Setiap perubahan yang dibuatnya, dan setiap perintah yang diblokir komando, masuk ke [audit log](guide:touch-id-and-safety#the-audit-log), ditandai dengan nama agen. Pembacaan biasa, seperti menampilkan daftar service, tidak dicatat di sana.
- Agen tidak bisa melewati penolakan komando sendiri. Saat komando menolak suatu langkah untuk agen AI, agen berhenti di situ.

### Saat baris menulis "Not run"

Ada langkah yang tidak dilakukan komando untuk agen AI, apa pun permintaan agen:

- mengirim kata sandi atau key tersimpan ke tempat baru, misalnya dengan mengubah host sebuah koneksi;
- membaca atau menulis file atau folder yang bisa menyimpan kata sandi atau key, seperti `~/.ssh`.

Baris perintah itu lalu menulis **Not run** dan dibuka dengan satu kalimat sederhana, misalnya "komando did not let the agent use this file or folder, because it can hold passwords or keys; do this step yourself if you need it." Di bawahnya, "komando said:" menampilkan kata-kata komando sendiri.

Tidak ada kartu **Allow Once** untuk langkah ini, dan agen tidak mencoba lagi atau mencari jalan lain. Jika Anda ingin langkah itu dilakukan, lakukan sendiri: klik kanan koneksinya, pilih **Edit…** dan ubah di sana, atau jalankan perintahnya di terminal.

Ini butuh komando 0.14.1 atau yang lebih baru. iPhone dan iPad menampilkan baris yang sama.

{shot:agent/not-run|Baris perintah yang menulis Not run: satu kalimat sederhana, lalu kata-kata komando sendiri.}

AI bawaan, tanpa key milik Anda sendiri, adalah bagian dari upgrade. {coming:upgrade}
