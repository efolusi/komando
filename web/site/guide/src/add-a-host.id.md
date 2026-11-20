Server, atau host, adalah komputer yang Anda masuki lewat SSH. Tambahkan setiap server ke inventaris komando sekali saja, lalu Komando bisa membuka terminal, membaca log dan service-nya, dan menjaganya tetap ter-update.

## Tambah server

1. Buka **Hosts** di sidebar lalu klik **Add** (⌘N). Di Home yang masih kosong, klik **Add a Host**. Di tempat lain, **Add** (⌘N) membuka "What do you want to add?": klik **Host**.
2. Tab **New Host** terbuka. Isi:
   - **Name**: nama pendek tanpa spasi, misalnya `web-1`.
   - **Address**: `user@address`, misalnya `deploy@10.0.0.4`. Tambahkan `:port` hanya jika SSH tidak mendengarkan di port 22, misalnya `deploy@10.0.0.4:2222`.
3. Di bawah **Log in with**, pilih cara Komando masuk: **SSH Agent**, **Saved Key**, atau **Password**. [Masuk dengan key atau kata sandi](guide:log-in) menjelaskan masing-masing. {coming:ask-each-time}
   Kata sandi disimpan sebagai secret baru, misalnya `secret:web-1-pass`. Kata sandi itu tidak pernah menimpa secret yang sudah ada: jika nama itu sudah dipakai, Komando memilih nama berikutnya yang kosong (`secret:web-1-pass-2`).
4. Opsional:
   - **Groups**: nama dipisah koma, misalnya `production`. Setelah itu Anda bisa menjalankan recipe di seluruh grup sebagai `@production`.
   - **Reach through a server or VPN**: nyalakan untuk server yang hanya bisa dijangkau lewat server lain (sering disebut bastion) atau VPN, lalu pilih yang mana.
   - **Protected**: nyalakan untuk production. Setiap perubahan di server yang protected menanyai Anda dulu.
5. Klik **Save Host** (⌘↩).

**Save Host** tetap redup sampai nama tidak berisi spasi, alamat berisi `@`, dan login yang Anda pilih sudah lengkap.

{shot:add-a-host/new-host|Tab New Host: Name, Address, Log in with, Groups, Reach through a server or VPN, dan Protected.}

## Uji koneksi

Setelah Anda menyimpan, Komando menampilkan "web-1 is in the inventory." lalu menguji koneksinya: "Testing the connection…", lalu "Connected" beserta berapa lama server menjawab.

Lalu klik **Open web-1** untuk membuka server sebagai tab, atau **Close**.

### Periksa host key

Host key adalah cara server membuktikan bahwa ia server yang sama setiap kali. Setelah uji, formulir menampilkan "Host key komando saved for web-1": tipe key (misalnya ED25519) dan fingerprint lengkapnya, dengan tombol untuk menyalinnya.

Bandingkan dengan fingerprint yang diberikan pemilik server.

- Cocok: selesai.
- Berbeda: mungkin ada pihak lain di antara Anda dan server. Jangan pakai web-1, dan beri tahu pemiliknya. Jika Anda masuk dengan kata sandi, uji tadi sudah mengirimnya ke server itu, jadi ganti kata sandi tersebut.

Menghapus web-1 tetap menyimpan key yang tersimpan. Setelah pemilik memberi Anda key yang benar, ganti di terminal dengan perintah yang ditampilkan formulir: `komando host trust web-1 --reset`.

### Jika uji gagal

Uji menampilkan "Saved, but the test failed:" dengan pesan dari komando dan petunjuk. Server tetap masuk inventaris, jadi Anda bisa memperbaikinya di tempat:

- Kata sandi salah: buka **Edit Host…** lalu ketik yang benar di **Set a new password**. Lihat [Ubah cara server masuk](guide:log-in#change-how-a-server-logs-in).
- User atau alamat salah: klik kanan server di **Hosts**, pilih **Edit Host…**, lalu ubah **Address**.
- Server ada di balik VPN atau server lain: nyalakan **Reach through a server or VPN** di sheet yang sama.

Lalu buka server dan klik **Test** (⇧⌘T) di Overview-nya untuk mencoba lagi.

## Impor yang sudah Anda punya

Jika Anda sudah menyimpan server di tool lain, impor saja daripada mengetik satu per satu.

1. Klik **Add** (⌘N). Di bawah "Or import what you already have", klik sumbernya, misalnya **SSH Config…**. Di Home yang masih kosong, **Import from ~/.ssh/config** melakukan hal yang sama, begitu juga **File** › **Import from SSH Config…**.
2. komando menjalankan percobaan yang tidak menambahkan apa pun, lalu menampilkan apa yang akan ditambahkannya.
3. Klik **Import 3 Targets** (tombolnya menghitung jumlahnya). Komando menampilkan "Added 3 targets." dan daftarnya.

Sumber lainnya adalah .pgpass, my.cnf, .env, kubeconfig, Docker, DBeaver, AWS, rclone, dan FileZilla. Entri dari DBeaver masuk tanpa kata sandinya: barisnya menampilkan "Password missing", dengan **Add Password**. Lihat [Keychain](guide:keychain).

Jika semuanya sudah ada di inventaris, sheet menampilkan "Nothing new to add."

{shot:add-a-host/import|Import from SSH Config: daftar server yang akan ditambahkan komando, dan tombol Import.}

## Grup

Grup adalah nama yang Anda berikan untuk beberapa server, misalnya `web` atau `production`. Grup tampil sebagai chip di **Hosts**, jadi Anda bisa menyaring daftar, dan Anda bisa menjalankan recipe di semuanya sekaligus.

- Untuk memasukkan server ke grup, ketik nama grup di **Groups** saat Anda menambahkannya.
- Untuk mengganti nama grup, klik ⋯ grup itu di **Hosts** lalu pilih **Rename Group…**. Server-nya tetap; hanya namanya yang berubah. **Remove Group…** di menu yang sama menghapus grup dan membiarkan server-nya.
- Memasukkan beberapa server ke grup sekaligus, memasukkan setiap server yang diimpor ke grup, dan mengubah cara seluruh grup masuk belum ada di aplikasi. {coming:group-tools}

## Di command line

`komando host add` sama dengan New Host, dan `komando import ssh-config` (serta sumber lainnya) sama dengan sheet impor.
