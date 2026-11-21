# Skill agen

`komando guide install` menghubungkan agen AI ke komando. Halaman ini menjelaskan apa yang dipasangnya, bagaimana komando mengenali agen, apa yang bisa dilakukan agen sendiri, dan apa yang selalu menunggu jawaban dari Anda.

## Menghubungkan agen

```bash
komando guide install
```

Perintah ini menghubungkan agen Anda (Claude Code, Codex, Cursor, atau Gemini CLI) ke komando. Perintah itu memasang skill komando dan guard untuk agen yang Anda pakai. Kata sandi tetap di vault komando, dan agen tidak pernah mendapatkannya dari sana.

Agen menemukan komando lewat dua cara:

- Agen punya skill komando, yang dipasang oleh `guide install`.
- Dokumentasi komando sendiri meminta agen AI menjalankan `komando guide`.

## Bagaimana komando mengenali agen

komando mengenali Claude Code, Codex, Gemini CLI, dan Cursor dari variabel lingkungan yang mereka atur. Variabel yang ada dihitung, apa pun nilainya, juga `0` atau kosong. Untuk agen lain, atur `KOMANDO_AGENT=1` (atau `AI_AGENT=1`) di lingkungan tempat agen menjalankan perintah, dan aturan yang sama berlaku untuknya.

Script, dan Anda di terminal sendiri, tidak diperlakukan sebagai agen. Agen yang tidak dikenali komando dihitung sebagai script, jadi aturan untuk agen tidak berlaku baginya.

## Yang bisa dilakukan agen

- Menjalankan perintah komando. Saat agen menjalankan komando lewat pipe, agen mendapat satu objek JSON, bukan teks ([Hasil dan error](output.md#read-a-result)).
- Membaca secara bawaan. `db query`, `cache run`, dan `cluster run` hanya membaca kecuali `--write` ditambahkan ([Keamanan](safety.md#the-seatbelts)).
- Membaca file yang merupakan secret menurut namanya, seperti `.env`, dengan `fs cat`. Nilai secret yang dikenali komando tampil sebagai `[hidden]`.
- Menaruh secret di server tanpa melihatnya. `fs replace` dengan `{{secret:NAME}}` di `--new` menulis nilai dari vault, setelah Anda mengizinkannya di jendela di bawah.
- Mengganti nama secret dengan `secret rename`, tanpa melihatnya. Setiap rujukan ikut berganti.

## Yang selalu bertanya dulu

Saat agen menambahkan `--yes`, `--allow-dangerous`, atau `--reveal`, komando membuka jendela di layar Anda. Jendela itu menampilkan seluruh perintah dan alasan komando menghentikannya. Perintah berjalan hanya saat Anda mengklik **Allow once**, dan agen tidak bisa mengkliknya.

- Dengan `komando config approval-code`, jendela juga meminta kode dari aplikasi autentikator Anda, jadi satu klik saja tidak cukup ([Pengaturan dan file](settings.md#ask-for-a-code-before-an-agents-risky-command)).
- Bila tidak ada layar untuk membuka jendela (sesi SSH, server, atau `KOMANDO_NO_DIALOG` diatur), agen ditolak dan meminta Anda menjalankan perintah itu di terminal sendiri.
- Jendela yang tidak dijawab siapa pun akan menutup. Agen diberi tahu bahwa tidak ada yang menjawab, lalu bertanya apakah perlu mencoba lagi.
- Saat agen mengirim secret ke tempat baru, agen butuh `--yes`, dan jendela menyebut secret dan tempatnya.

Beberapa perintah hanya dijalankan orang, di terminalnya sendiri: `secret set` dan `secret check` untuk agen, `secret keychain`, `secret passphrase`, menyiapkan `config approval-code`, dan mengganti host key yang di-pin dengan `host trust --reset`. Agen menerima `NEEDS_PERSON` dan meminta Anda menjalankannya.

Selengkapnya di [Keamanan](safety.md#seatbelts-for-ai-agents).

## Yang tidak didapat agen

- Nilai di vault tidak pernah ditampilkan ke agen.
- Di output dari server, file, dan database, komando menyembunyikan kata sandi, key, dan token yang dikenalinya sebagai `[hidden]`. Anda dan script Anda melihat nilai sebenarnya. Penyamaran ini bersifat upaya terbaik: secret dengan nama tak lazim, atau yang sangat pendek, masih bisa lolos. Lihat [batasannya](safety.md#limits) di halaman Keamanan.
- `secret show --reveal` hanya untuk orang. Agen AI tidak pernah bisa.
- Agen tidak bisa menyalin file yang merupakan secret menurut namanya (`.env`, private key, `credentials`) ke komputer ini.
- Saat perintah menerima file lokal, komando tidak membaca `~/.komando`, private key, credential store, atau file yang merupakan secret menurut namanya untuk agen.

## Guard

Guard memeriksa apa yang akan dilakukan agen di komputer ini. Sebelum agen membaca file atau menjalankan perintah shell, komando memeriksanya, dan menghentikan:

- pembacaan `~/.komando`, private key, file `.env`, dan credential store (`~/.kube`, `~/.aws`, keychain);
- pendaftaran semua variabel lingkungan;
- perubahan atau pengosongan variabel yang dipakai komando untuk mengenali agen, atau `KOMANDO_HOME`;
- penjalanan `ssh` atau `scp` di sekitar komando.

`komando guide install --no-guard` melewatinya. Guard hanya berjalan di tempat harness agen memintanya. `guide install` memasangnya untuk Claude Code, Cursor, Gemini CLI, dan Codex (setujui sekali di `/hooks`). Agen tanpa hook hanya mendapat jendela persetujuan dan penyamaran, dan itu hanya bila komando mengenalinya.

## Memperbarui atau mencabut

Setelah `komando update`, jalankan `komando guide install` lagi, tanpa `sudo`, agar agen Anda mendapat skill versi baru. Sebelum itu, `komando doctor` menyatakan skill berasal dari versi lain ([Instal, update, hapus](install.md#update)).

Untuk mencabut skill dan guard dari agen Anda, jalankan `komando guide uninstall`. Tambahkan `--project` di folder tempat Anda menjalankan `guide install --project` ([Instal, update, hapus](install.md#remove-komando)). Agen AI yang menjalankan `guide uninstall` butuh `--yes`, karena perintah itu mencabut guard dari pengaturan agen.
