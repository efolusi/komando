Setiap server di Komando masuk dengan satu cara: dengan SSH agent Anda, dengan key yang disimpan komando, atau dengan kata sandi yang disimpan komando. Anda memilihnya di **Log in with** saat menambahkan server.

## Tiga cara masuk

**SSH Agent.** komando memakai SSH agent Anda dan key di `~/.ssh`, seperti perintah `ssh`. Pilih ini jika Anda sudah masuk ke server dari aplikasi Terminal tanpa mengetik kata sandi. Tidak ada yang disimpan di Komando.

**Saved Key.** komando masuk dengan key yang disimpan di keychain-nya sendiri. Pilih key di **Choose a key…**. Bagian publik key harus ada di server; [pasang di sana](#put-a-key-on-a-server) dulu jika belum.

**Password.** Ketik kata sandi server. Kata sandi disimpan terenkripsi di keychain komando sebagai `secret:web-1-pass`, dan Anda tidak akan melihatnya lagi. komando memakainya setiap kali terhubung.

**Ask each time** {coming:ask-each-time}: tidak ada yang disimpan, dan Anda mengetik kata sandi setiap kali Komando terhubung. Pilihan ini belum tersedia untuk server.

> Key lebih aman daripada kata sandi: tidak ada yang bisa menebaknya, dan Anda bisa mencabutnya dari server kapan saja. Jika ragu, pakai key.

{shot:log-in/log-in-with|Log in with di New Host: SSH Agent, Saved Key, dan Password.}

## Buat atau impor key

Jika **Saved Key** menampilkan "No keys yet", komando belum punya key sendiri.

1. Buka **Keychain** di bawah **More** di sidebar.
2. Klik **New Key…**. Sheet "New SSH Key" terbuka.
3. Pilih **Make a New Key** lalu beri **Name**, misalnya `deploy`. **Ed25519 (recommended)** pendek dan kuat; pilih RSA hanya untuk server lama yang memintanya. Atau pilih **Import a Key File** lalu klik **Choose…** untuk memilih key yang sudah Anda punya; file-nya tetap di tempatnya.
4. Klik **Make Key** atau **Import Key**.

Sekarang New Host menawarkan key dengan nama ini di **Saved Key**.

## Pasang key di server

Server menerima key setelah bagian publik key itu ada di `~/.ssh/authorized_keys` di server.

1. Di **Keychain**, klik ⋯ key itu lalu pilih **Put on a Host…**.
2. Pilih server, lalu di **Whose keys** pilih user login atau semua user di server. Klik **Put on Host**. komando menambahkan public key di sana. Server yang sudah punya key itu dibiarkan apa adanya.

Untuk melakukannya secara manual, klik kanan key lalu pilih **Copy Public Key**, lalu tempel barisnya ke `~/.ssh/authorized_keys` di server.

Untuk mencabut key dari server, pakai **Revoke from a Server…** di menu yang sama. Lihat [Keychain](guide:keychain#keys).

## Kali pertama: percayai identitas server

Setiap server punya identitas, yaitu host key-nya, dengan fingerprint yang membuktikan bahwa ia server yang sama di lain waktu. Saat komando pertama kali terhubung ke server (ketika Anda menambahkan, menguji, atau membuka terminal di server itu), komando menyimpan fingerprint itu tanpa bertanya. Sejak itu, komando memeriksa bahwa server menunjukkan fingerprint yang sama.

Pada kali pertama itu, tidak ada yang membuktikan bahwa key itu benar-benar milik server Anda. Untuk memastikan, bandingkan fingerprint yang disimpan komando dengan milik server sendiri:

1. Di aplikasi Terminal, jalankan `komando audit --command host.key-pinned --target web-1 -o json`. Catatannya berisi `fingerprint` yang disimpan komando, misalnya `SHA256:pVt2…`.
2. Di konsol server itu sendiri (atau konsol penyedia cloud Anda, yang sering menampilkannya di log boot pertama), jalankan `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub`.
3. Jika kedua fingerprint cocok, selesai. Jika berbeda, berhenti memakai server itu dan tanyakan pengelolanya: mungkin ada pihak lain di antara Anda dan server.

> Untuk memeriksa setiap server baru sebelum komando mempercayainya, jalankan `komando config set host_key_policy strict`. Setelah itu komando menolak server yang belum pernah ditemuinya sampai Anda menjalankan `komando host trust web-1` dan memeriksa fingerprint yang ditampilkannya.

### Saat identitas server berubah

Jika fingerprint berbeda dari sebelumnya, komando menolak terhubung. Terminal menampilkan "Identity changed" di samping titik merah, beserta fingerprint lama dan baru. Ini terjadi saat server dibangun ulang. Bisa juga berarti server milik orang lain sedang menjawab sebagai gantinya.

1. Periksa fingerprint baru di konsol server itu sendiri, atau tanyakan pengelola server. Di server, `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub` menampilkannya.
2. Klik **Trust New Key…**. Sheet memperingatkan bahwa itu mungkin server orang lain dan menampilkan **Before** dan **Now**. Fingerprint yang Anda periksa harus sama persis dengan **Now**.
3. Centang "I checked that web-1 shows this new key", lalu klik **Trust New Key…**. Tab terminal terbuka dan menjalankan perintah yang ditampilkan sheet. komando bertanya sekali lagi.
4. Klik **Reconnect**.

Jika Anda tidak menduga perubahan itu, jangan percayai. Tanyakan pengelola server dulu.

{shot:log-in/trust-new-key|Sheet Trust New Key: peringatan, Before dan Now, kotak untuk dicentang, dan perintah dengan key Now.}

#### komando mempercayai key yang Anda periksa, atau tidak sama sekali

Perintah di sheet diakhiri dengan `--fingerprint` dan key **Now**. komando mempercayai key baru hanya jika server masih menunjukkan key yang sama persis saat perintah berjalan.

Jika saat itu server menunjukkan key lain, komando berhenti dan tidak mempercayai apa pun. Tab terminal menampilkan "The server shows a different key than the one you checked; nothing was trusted." Sengaja tidak ada tombol Trust di sana: key yang berubah di antara pemeriksaan Anda dan perintah adalah tanda bahaya.

1. Jangan langsung mencoba lagi.
2. Periksa key di konsol server sekali lagi, atau tanyakan pengelola server. Server mungkin menawarkan jenis key yang berbeda dari yang Anda bandingkan.
3. Buka terminal lagi. Jika masih menampilkan "Identity changed", mulai dari langkah 1 di atas dengan key yang ditampilkannya sekarang.

#### Dengan komando yang lebih lama dari 0.15.0

komando versi lama tidak bisa diikat ke key yang Anda periksa. Sheet menyebutkannya di bawah perintah, misalnya "komando v0.14.1 is older than 0.15.0, so Komando can't make sure it trusts the key you checked."

Anda tetap bisa mempercayai key itu. Di tab terminal, komando menampilkan key lama dan baru lagi: bandingkan key baru dengan key yang Anda periksa sebelum menjawab. Lebih baik lagi: update komando dulu (lihat [Instal komando](guide:first-ten-minutes#2-install-komando)).

#### Server yang belum pernah ditemui komando

Saat host key disetel ke strict, komando juga menolak server yang belum pernah dihubunginya. Terminal menampilkan "Identity not checked". **Trust Key…** membuka sheet yang sama dengan satu key, **It shows**. Periksa dengan cara yang sama, centang kotaknya, lalu klik **Trust Key…**.

Di iPhone dan iPad tidak ada Trust Key. Percayai key di Mac Anda, atau di terminal dengan `komando host trust NAME --fingerprint SHA256:…`.

## Ubah cara server masuk

1. Klik kanan server di **Hosts**, atau pakai ⋯-nya, lalu pilih **Edit Host…**.
2. Di **Log in with**, cara masuk yang berlaku sekarang sudah terpilih: **SSH Agent**, **Saved Key**, atau **Password**. File key yang disetel di terminal tampil sebagai "Key file: … (set in the terminal)" tanpa tab terpilih; pilih tab hanya jika ingin mengubahnya.
3. Pilih tab lain untuk beralih, atau ketik kata sandi baru:
   - **Password** menampilkan "Password saved (secret:web-1-pass)" dan kolom **Set a new password** yang kosong. Biarkan kosong untuk mempertahankan kata sandi tersimpan.
   - Kata sandi baru tidak pernah menimpa yang tersimpan. Kata sandi baru disimpan dengan nama baru, misalnya `secret:web-1-pass-2`, dan yang lama tetap di keychain. Jika server lain memakai yang lama, teks bantuan menyebut server-server itu. Hapus yang lama di **Keychain** jika tidak ada yang memakainya.
   - Beralih dari **Password** juga membiarkan kata sandi tersimpan tetap di keychain.
4. Klik **Save**. Server yang protected bertanya "This target is protected" dulu, dengan perintah persisnya, sebelum apa pun disimpan; **Cancel** membiarkan semuanya seperti semula. Kata sandi baru masuk ke keychain dan tidak pernah ke command line.

Jika penyimpanan gagal setelah kata sandi tersimpan, Komando menghapusnya lagi. Komando bertanya dulu: "Remove secret:web-1-pass-2 again?" Klik **Remove Secret**, atau **Cancel** untuk menyimpannya.

Selain itu:

- **Kata sandi yang hilang.** Jika kata sandi server tidak ada di keychain, barisnya dan Home menyebutkannya, dengan **Add Password**. Lihat [Keychain](guide:keychain#a-missing-password).
- **Kata sandi yang dipakai beberapa server.** Untuk mengubahnya di semua server sekaligus, buka **Keychain**, klik kanan `secret:web-pass` lalu pilih **Replace Value…**. Ketik kata sandi baru lalu klik **Save Secret**. Komando bertanya "Replace secret:web-pass?" dulu. Klik **Replace Value**.

Setelah perubahan apa pun, buka server lalu klik **Test** (⇧⌘T) di Overview-nya. **About this server** menyebutkan cara server masuk ("Works without a password" atau "Asks for a password") dan "Connected" jika berhasil.

## Di command line

`komando host add NAME USER@ADDRESS` menambahkan server, `komando host edit` mengubah cara server masuk, dan `komando host trust NAME --fingerprint SHA256:…` mempercayai identitasnya hanya jika server menunjukkan key itu (komando 0.15.0 dan yang lebih baru).
