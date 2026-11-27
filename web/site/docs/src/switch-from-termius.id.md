# Pindah dari Termius

Termius dan komando sama-sama menyimpan daftar server dan login ke sana lewat SSH. Halaman ini menunjukkan cara membawa host ke komando, dan di mana setiap tugas sehari-hari berada setelah itu.

## Bawa host

komando tidak membaca data Termius. komando membaca file SSH config, daftar host biasa yang dipakai `ssh` sendiri:

1. Taruh host di `~/.ssh/config`, satu blok `Host` untuk masing-masing, kalau belum ada di sana. Salin alamat, user, port, dan path key dari setiap host di Termius.
2. Lihat apa yang akan ditambahkan komando, tanpa menambahkan apa pun:
   `komando import ssh-config --dry-run`
3. Impor host itu, misalnya ke sebuah grup:
   `komando import ssh-config --group work`
4. Periksa bahwa komando bisa login ke semuanya:
   `komando test @work`

Untuk membaca file lain, tambahkan path-nya: `komando import ssh-config FILE`. Baris `ProxyJump` ikut masuk, jadi server di balik jump host tetap punya jalannya ke sana.

Mengimpor file yang sama sekali lagi tidak mengubah apa pun, dan komando mencantumkan apa saja yang tidak bisa diimpor, beserta alasannya.

## Kata sandi dan key

File SSH config tidak menyimpan kata sandi. Di terminal, komando meminta kata sandi saat server membutuhkannya, sama seperti `ssh`. Untuk menyimpannya sekali di vault komando, agar script dan agen AI juga bisa login:

```bash
komando host edit web1 --ask-password      # disimpan sebagai secret:web1-pass
```

Atau beralih ke key. komando membuat key dan memasangnya di server, dengan login yang sekarang dipakai server itu:

```bash
komando key gen deploy
komando key deploy deploy @work --set-default
```

Key yang sudah berjalan dengan `ssh` di komputer ini juga berjalan dengan komando. Selengkapnya di [Server](servers.md#log-in-with-a-key).

## Tempat tugas sehari-hari

| Tugas | Di komando |
|------|------------|
| Buka terminal di server | `komando shell web1` |
| Jalankan satu perintah di banyak server | `komando exec @web -- uptime` |
| Simpan perintah dan jalankan lagi | `komando recipe add` dan `komando recipe run` ([Menjalankan perintah](commands.md#recipes-ready-made-and-saved-commands)) |
| Salin file ke dan dari server | `komando upload`, `komando download`, atau `komando cp` ([File](files.md#copy-files)) |
| Salin dari satu server ke server lain | `komando cp web1:/var/backups/db.sql.gz web2:/var/backups/` |
| Forward port | `komando tunnel start db1 -L 15432:localhost:5432` ([Server privat dan tunnel](tunnels.md#forward-any-port)) |
| Menjangkau server lewat jump host | `komando host add db1 admin@10.0.0.5 --via bastion` |
| Simpan kata sandi dan key | `komando secret` dan `komando key` ([Secret](secrets.md)) |

Kalau diketik tanpa argumen di terminal, sebagian besar perintah ini menanyakan apa yang kurang, satu baris per pertanyaan.

## Yang berbeda

- **Ini command line.** Setiap tugas adalah perintah yang bisa diketik, taruh di script, atau serahkan ke agen AI. Aplikasi Komando gratis untuk Mac, iPhone, dan iPad yang menjalankan perintah yang sama sudah dibangun dan sedang diuji; [panduan pengguna](site:guide/) menjelaskannya.
- **Agen AI memakainya dengan aman.** Kata sandi tetap di vault komando, dan agen tidak pernah mendapatkannya dari sana. Hubungkan agen dengan `komando guide install` ([Mulai](getting-started.md#5-connect-your-ai-agent)).
- **Production bertanya dulu.** Tandai server dengan `komando host edit web1 --protected`, dan setiap perubahan di server itu butuh persetujuan Anda ([Keamanan](safety.md)).
- **Lebih dari server.** Daftar yang sama menyimpan database, cache, queue, storage, cluster, dan VPN.
- **Catatan semua tindakan.** `komando audit` menampilkan apa yang dilakukan, dan oleh siapa.

## Pindah ke komputer lain

`komando export --to komando-backup.json` menyimpan server, koneksi, VPN, dan perintah tersimpan, tanpa kata sandi. Di komputer lain, `komando import komando komando-backup.json` membawanya kembali. Detailnya ada di [Pindah ke komando dan pindah komputer](import.md#move-to-another-computer).
