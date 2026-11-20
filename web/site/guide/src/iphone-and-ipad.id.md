Komando untuk iPhone dan iPad dipakai saat Anda jauh dari meja: lihat apa yang perlu perhatian, perbaiki dengan Face ID, jalankan pemeriksaan cepat, ikuti job, dan bertanya ke agen. Aplikasinya gratis, seperti aplikasi Mac.

Ponsel tidak menjalankan komando sendiri. Ponsel berbicara dengan mesin tempat komando berada, lewat SSH: sebuah server, atau Mac Anda dengan Remote Login menyala.

## Pasangkan ponsel

1. Buka aplikasinya. Aplikasi menulis "Komando on call".
2. Ponsel membuat dua key, disimpan di chip aman miliknya: satu yang "Reads, without Face ID" dan satu untuk "Changes, after Face ID". Biarkan **Network checks** mati kecuali Anda membutuhkannya (lihat [Read key dan Network checks](#the-read-key-and-network-checks)). Ketuk **Copy Both Lines**.
3. Tambahkan dua baris itu ke `~/.ssh/authorized_keys` di mesin yang menjalankan komando. Setiap baris membuat komando yang menentukan apa yang boleh dijalankan key itu.
4. Di bawah "2. Where komando lives", ketik `user@address`-nya lalu ketuk **Connect**.
5. Pada kali pertama, ponsel menampilkan identitas mesin itu. Jalankan perintah yang ditampilkan di mesin itu, bandingkan, lalu ketuk **It Matches, Trust This Host**.

Ponsel harus punya passcode. Tanpa passcode, aplikasi menulis "Set a passcode first: Settings → Face ID & Passcode." komando di mesin itu harus versi 0.13.0 atau lebih baru; ponsel memberi tahu dengan jelas bila versinya lebih lama. Aturan jaringan untuk read key di bawah butuh komando 0.15.0.

Untuk melihat-lihat dulu, ketuk **Try the Demo**. Demo menampilkan server dan temuan contoh, tidak ada yang nyata.

{shot:iphone-and-ipad/pair|Memasangkan di iPhone: dua baris key dan Where komando lives.}

## Read key dan Network checks

Ponsel memakai dua key, keduanya di chip amannya:

- **Read key** bekerja tanpa Face ID. Key ini hanya bisa membaca.
- **Change key** hanya bekerja setelah Face ID. Key ini dipakai saat Anda mengubah sesuatu.

Dengan komando 0.15.0 dan yang lebih baru, read key juga dijauhkan dari jaringan. Key ini bisa membaca kondisi server Anda, tetapi tidak bisa membuat server atau komputer komando menghubungi alamat lain. Jadi read key yang dicuri atau ditipu tidak bisa mengirim data Anda ke tempat lain.

### Yang berjalan tanpa Network checks

- Home, Targets, Activity, dan Jobs.
- **Right now** di server: CPU, memori, dan disk.
- Pemeriksaan cepat **Health** dan **Disk**, dalam kalimat biasa. Health yang dibaca dengan cara ini tidak menampilkan service yang gagal: ketuk **Services** untuk itu.
- **Services** dan **Test Connection**.

### Yang butuh Network checks

- **Certificates** (`komando cert check`) dan pemeriksaan jaringan (`komando net`), yang menjangkau jaringan dari server.
- Menjalankan resep selain health dan disk dari Shortcuts.

Tanpa Network checks, pemeriksaan seperti itu berhenti dan memberi tahu, dengan pesan dari komando sendiri. Tidak ada yang berjalan.

### Nyalakan Network checks

Network checks adalah sakelar di Welcome, di atas **Copy Both Lines**. Awalnya mati.

1. Di Settings, ketuk **Forget This Computer** (**Forget This Mac** bila komando berjalan di Mac Anda), atau mulai dari Welcome.
2. Nyalakan **Network checks**.
3. Ketuk **Copy Both Lines**.
4. Di komputer komando, buka `~/.ssh/authorized_keys`. Hapus baris read lama milik ponsel, lalu tempel baris-baris baru.
5. Di ponsel, ketik alamatnya lalu ketuk **Connect**.

Settings lalu menulis apa yang boleh dilakukan read key: "Reads only, no network" atau "Reads, with network checks".

### Saat baris dan sakelar tidak cocok

Saat memasangkan, aplikasi memeriksa bahwa baris read key di komputer komando cocok dengan sakelarnya. Bila tidak cocok, tidak ada yang dipasangkan dan aplikasi menulis, misalnya, "The read key's line on mac-mini does not allow network checks, but Network checks is on here." Ini terjadi bila baris lama untuk key yang sama masih ada di `authorized_keys` (baris pertama yang berlaku), atau bila Anda mengubah sakelar setelah menyalin baris-barisnya.

Hapus baris lama dan tempel lagi baris-barisnya, atau ubah sakelar agar cocok dengan baris yang ingin Anda pertahankan.

### Setelah Anda memperbarui komando

Tarik ke bawah untuk refresh di ponsel. Ponsel membaca ulang versi komando setiap kali refresh, jadi Anda tidak perlu memasangkan lagi.

Dengan komando yang lebih lama dari 0.15.0, tidak ada yang berubah: read key membaca seperti sebelumnya, sakelar tidak berpengaruh, dan Settings menulis "Reads only".

## Home

Home menampilkan **Needs attention**, **Running now**, dan **Recent activity**, seperti di Mac.

- Perbaikan yang bertindak di server bertanya dulu. Dialognya menulis "This runs:" dan menampilkan perintah komando yang persis, setiap kata seperti yang akan dijalankan, dengan karakter tersembunyi ditulis lengkap. Lalu Face ID.
- Perbaikan yang butuh persetujuan tambahan komando (`--yes` atau `--allow-dangerous`), misalnya di target yang dilindungi, tidak punya tombol **Fix** di ponsel. Lakukan di Komando di Mac.
- Perbaikan yang mengubah pengaturan komando sendiri, misalnya Protect atau Add Password, meminta Anda melakukannya di Komando di Mac.
- **Running now** menautkan ke background job, dengan status dan log-nya. **Stop Job** dan **Remove Job** bertanya dulu, lalu Face ID.
- Saat Face ID dibatalkan, atau perubahan gagal, alasannya tampil tepat di bawah tombol yang Anda ketuk.
- **All Activity**, dan tab **Activity**, membuka audit log, dengan filter **Changes**, **Failed**, dan **Agent**, serta **Check the Record**.

## Targets

Tab **Targets** menampilkan setiap target per kelompok; **Find a target** mencari. Sentuh dan tahan sebuah target, atau geser barisnya, untuk **Test Connection** dan Copy; salinan bertulis "Copied". Server punya pemeriksaan cepat seperti **Disk** dan **Services**, yang hanya membaca. Queue punya pemeriksaan hanya-baca sendiri.

Jawaban yang sangat besar, di atas 16 MB, dipotong supaya tidak memenuhi memori ponsel. Layar memberi tahu bahwa jawaban itu dipotong. Minta lebih sedikit, misalnya lebih sedikit baris log, atau baca di Mac Anda.

## Agen

Tab **Agent** bekerja seperti di Mac (lihat [Agen](guide:agent)), dengan ☐ **Allow changes**. **Allow Once** meminta Face ID dulu. **Stop** mengakhiri giliran agen, dan pesan terbaru tetap terlihat. Sampai Anda menyimpan key di Settings, tab ini menulis "Add your Anthropic API key in Settings first."

Sebagian pembacaan bisa menjangkau alamat lain di internet: `komando net`, `komando cert check`, dan perintah server yang memakai alat jaringan seperti `curl`. Agen bertanya sebelum menjalankan salah satunya, dengan kartu yang sama seperti perubahan. Dengan ☐ **Allow changes** mati, agen tidak menjalankannya.

## Settings

Settings berisi alamat dan versi mesin komando, **Forget This Computer** (**Forget This Mac** bila komando berjalan di Mac Anda; **Leave the Demo** di demo), **Import from a Computer…**, **Remove Imported Inventory** setelah Anda mengimpor sesuatu, **Upgrade**, dan Anthropic API key untuk agen (**Save Key**).

**Forget This Computer** membawa Anda kembali ke Welcome. Tombol ini juga menghapus key yang dibuat ponsel ini untuk mesin itu. Pakai juga saat mesin itu dibangun ulang dan identitasnya berubah.

### Notifikasi

Nyalakan **Notify Me** di Settings untuk diberi tahu saat background job selesai atau forward berhenti, selama aplikasi terbuka. Notifikasi menyebut server dan kejadiannya, misalnya "A job on backup-1 finished.". Notifikasi tidak pernah menampilkan perintah. Saat lock screen menyembunyikan pratinjau (**Show Previews** di Settings › Notifications pada iPhone), notifikasi hanya menulis "Open Komando to see what changed."

### Bawa inventaris Anda

**Import from a Computer…** membawa apa yang diketahui komando di sebuah komputer, disegel supaya hanya ponsel ini yang bisa membukanya.

1. Ketuk **Make a New Key**, lalu **Copy Key** atau **Share Key File…**.
2. Di komputer, jalankan `komando export --for-phone --to phone.kmdseal`. Perintah ini meminta key dan mencetak enam kata.
3. Di ponsel, ketuk **Choose File…** dan pilih filenya. Bandingkan enam kata itu dengan yang dicetak komputer. Bila cocok, ketuk **Words Match, Import**. Bila berbeda, itu bukan file yang Anda buat: jangan diimpor.

Untuk menghapusnya lagi dari ponsel, ketuk **Remove Imported Inventory** di Settings. Aplikasi bertanya dulu "Remove the imported inventory?". Server, koneksi, kata sandi, dan key yang Anda impor keluar dari ponsel, bersama key yang menyegelnya. komando di komputer tetap menyimpan salinannya sendiri, dan Anda bisa mengimpor lagi kapan saja.

## iPad

Di iPad, tab menjadi sidebar, dengan **Jobs** di dalamnya, dan Targets menampilkan daftar di samping target yang dipilih. Seret tepi daftar Targets untuk membuatnya lebih lebar atau lebih sempit; iPad mengingat lebarnya. Dengan keyboard: ⌘1 sampai ⌘4 membuka tiap tempat, ⌘R refresh, ⌘F mencari target, dan ⌘N memulai percakapan baru dengan agen.

## Yang tetap di Mac

Terminal, editor SQL, Files, Protect, dan apa pun yang melewati batas keamanan komando sendiri tetap di Mac. Perubahan pada server yang dilindungi menulis "change it from Komando on your Mac".

Files di ponsel {coming:phone-files} dan resep di ponsel {coming:phone-recipes} akan hadir.

## Bila ada yang salah

- Mesin tidak menerima key ponsel: tambahkan baris-barisnya lagi, persis seperti yang disalin.
