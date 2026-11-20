komando menyimpan kata sandi dan key yang dibutuhkannya di keychain-nya sendiri, terenkripsi. Anda memberikan nilainya sekali, dan Anda tidak perlu melihatnya lagi. Halaman **Keychain**, di bawah **More** di sidebar, menampilkan daftarnya.

## Isi halaman

**Secrets** adalah kata sandi dan token, satu baris masing-masing, dengan nama seperti `secret:prod-db-pass`, beserta apa yang memakainya. **SSH keys** adalah key yang dipakai komando untuk login ke server.

Nilai tidak pernah ditampilkan di halaman. Jika [kunci Touch ID](guide:touch-id-and-safety#the-touch-id-lock) menyala, halaman meminta Touch ID sebelum terbuka.

{shot:keychain/keychain|Halaman Keychain: Secrets beserta apa yang memakai masing-masing, dan SSH keys.}

## Kata sandi yang tidak ada

Saat komando tidak bisa terhubung ke target karena kata sandinya tidak ada, setiap tempat yang menyebutkannya punya **Add Password**: Home, tab Findings, baris target ("Password missing"), dan bagian atas Keychain.

1. Klik **Add Password**. Sheet terbuka dengan nama yang sudah terisi, misalnya `secret:prod-db-pass`.
2. Ketik kata sandinya di **Value**.
3. Klik **Save Secret**. Banner menyebut secret itu sudah ada di keychain. Temuan di Home hilang pada pemeriksaan berikutnya.

## Menambah atau mengganti secret

- **New Secret** di header menambah satu secret. Ketik **Name** dan **Value**, lalu **Save Secret**.
- Klik kanan sebuah secret dan pilih **Replace Value…** untuk mengubahnya, misalnya setelah Anda mengganti kata sandi database.
- Komando tidak pernah mengganti nilai tanpa bertanya. Jika nama itu sudah punya nilai, **Save Secret** bertanya "Replace secret:prod-db-pass?" dan menyebut siapa yang login dengannya, misalnya "prod-db logs in with the new value from then on." Nilai lama tidak bisa dikembalikan. **Replace Value** menyimpannya; **Cancel** tidak menyimpan apa pun.
- Sebelum menyimpan apa pun, **Save Secret** membaca ulang daftar secret milik komando sendiri, bukan daftar di layar. Jika komando tidak bisa membaca daftar secret-nya, tidak ada yang disimpan.
- Saat target yang dilindungi memakai secret itu, komando juga bertanya "This target is protected".
- **Copy Reference** menyalin `secret:NAME`, untuk ditempel di form yang meminta referensi kata sandi.

## Lainnya untuk secret

⋯ pada secret juga berisi:

- **Check Value…**: ketik sebuah nilai untuk mengetahui apakah cocok dengan yang tersimpan, tanpa menampilkan keduanya.
- **Show Value**: komando bertanya dulu di jendelanya sendiri; nilainya tersembunyi lagi setelah beberapa detik.
- **Rename…** dan **Copy to New Name…**.
- **Remove…**: ketik namanya untuk mengonfirmasi. komando menolak selama masih ada target yang memakai secret itu, dan sheet menyebut target yang mana.

Kata sandi lama sebuah server tetap ada di sini setelah Anda memberinya kata sandi baru (yang baru mendapat nama sendiri, misalnya `secret:web-2-pass-2`). Hapus yang lama saat tidak ada lagi yang memakainya.

Jika keychain Anda terbuka dengan passphrase, **Change Passphrase…** di samping judul Secrets mengubahnya. Tab Terminal terbuka, dan di sana komando meminta passphrase baru dua kali; Komando tidak pernah melihatnya.

## Key

- **New Key…** membuat key baru atau mengimpor file key. Lihat [Membuat atau mengimpor key](guide:log-in#make-or-import-a-key).
- Klik kanan sebuah key untuk **Copy Public Key** (baris yang ditambahkan ke `~/.ssh/authorized_keys` di server) dan **Copy Fingerprint** (untuk dibandingkan dengan yang ditampilkan server).
- **Put on a Host…** menambahkan key ke server, jadi server itu login dengannya mulai sekarang.
- **Revoke from a Host…** mencabutnya dari server. komando menghitung dulu baris yang memuatnya. Jika itu key yang dipakai komando sendiri untuk login, Anda akan mengunci diri sendiri, jadi sheet menyebutkannya dan meminta Anda mengetik nama key itu.
- **Rename…** dan **Remove…**. Remove menolak selama masih ada server yang memakai key itu.

## Di command line

`komando secret set prod-db-pass` menyimpan secret, dan `komando key` membuat, menampilkan, memasang, dan mencabut key.
