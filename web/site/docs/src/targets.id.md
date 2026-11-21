# Target

Pilih server, conn, dan VPN yang dikerjakan sebuah perintah: satu nama, satu grup, satu tag, atau semuanya.

## Menulis target

Kebanyakan perintah menerima sebuah *target*. Satu target memilih server, conn (database, cache, queue, storage, cluster, registry), dan VPN sekaligus:

```bash
komando exec @web -- uptime            # jalankan di setiap server dalam grup web
```

| Tulis | Memilih |
|-------|---------|
| `web1` | satu server atau conn, menurut namanya |
| `web-*` | nama yang diawali `web-` |
| `@prod` | semua yang ada di grup `prod` |
| `tag:prod` | semua yang diberi tag `prod` |
| `label:dc=jkt` | semua yang berlabel `dc=jkt` (`label:dc` memilih semua yang punya label `dc`) |
| `kind:db` | setiap database (juga `kind:host`, `kind:conn`, `kind:vpn`, `kind:cache`, `kind:queue`, `kind:storage`, `kind:cluster`, `kind:registry`, `kind:postgres`, dan jenis conn lainnya) |
| `os:windows` | setiap server Windows (`os:linux`: setiap server lainnya) |
| `all` | semuanya |
| `@prod,!web2` | gabungkan dengan `,`; kecualikan dengan `!` |
| `!web2` | semuanya kecuali `web2` (sama dengan `all,!web2`) |
| `root@203.0.113.10:22` | server sekali pakai yang tidak ada di daftar Anda (`203.0.113.10` atau `203.0.113.10:22` memakai user default Anda) |

Beri tanda kutip pada target yang mengandung `*` atau `!` agar shell Anda tidak mengubahnya: `'web-*'`, `'@prod,!web2'`.

Nama, grup, dan tag cocok dalam huruf besar atau kecil: `WEB1` menemukan `web1` bila hanya ada satu. Nama, `@group`, atau `tag:` yang salah eja mendapat saran "did you mean".

Di terminal Anda, perintah yang diketik tanpa target akan menanyakannya: pilih satu baris dengan nomornya, ketik sebagian nama untuk mempersempit daftar, atau ketik target seperti di atas ([detail](commands.md#at-your-terminal-komando-asks-for-what-is-missing)).

## Periksa apa yang dipilih sebuah target

```bash
komando list @prod           # hanya yang dipilih @prod
```

```text
NAME     KIND      WHERE                VIA      GROUPS  TAGS  PROTECTED
web1     host      ubuntu@203.0.113.10  -        prod    web   yes
prod-db  postgres  10.0.0.9:5432        bastion  prod    -     yes
```

```bash
komando list                 # semuanya: server, conn, dan VPN
komando list kind:db         # hanya database
komando test @prod           # jangkau dan login ke masing-masing
```

## Apa yang dilakukan setiap perintah dengan sebuah target

Setiap perintah memakai apa yang bisa dikerjakannya dan memberi tahu apa yang dilewatinya. Misalnya, `komando exec @prod -- uptime` berjalan di server dalam `prod` dan mencantumkan database di bawah "skipped". `komando db query @prod "..."` melakukan sebaliknya: perintah ini memakai satu database di `@prod` (perintah `db` butuh tepat satu) dan melewati server. Jika target tidak memilih apa pun yang bisa dipakai perintah itu, error menyebut perintah yang sebaiknya dipakai. Target yang tidak memilih apa pun adalah error, bukan hasil kosong.

## Grup, tag, dan label

Atur saat Anda menambah atau mengedit server atau conn:

```bash
komando host edit web1 --add-group prod --add-tag web --label dc=jkt
komando host edit web1 --rm-group prod --rm-tag web
```

Atau kelola satu grup untuk banyak entri sekaligus:

```bash
komando group add prod 'web-*'          # tambahkan semua yang dipilih sebuah target
komando group add prod web1 web2        # beberapa nama
komando group list                      # setiap grup dan tag beserta anggotanya
komando group list prod                 # anggota satu grup
komando group rm prod web2              # keluarkan web2 dari prod
komando group rm old --dry-run          # hapus seluruh grup: siapa yang akan keluar
komando group rm old                    # lebih dari 3 anggota: bertanya dulu
```

Jika diketik tanpa argumen, `komando group add` menanyakan grup, lalu apa yang masuk ke dalamnya.

Menghapus grup dengan lebih dari 3 anggota bertanya dulu: di terminal Anda komando bertanya `[y/N]`; agen AI atau script menambahkan `--yes` setelah seseorang setuju ([Keamanan](safety.md)). Di terminal, `group rm` ditutup dengan jalan kembali: `Next: komando group add old TARGET...`.

## Batasan

- Nama server, conn, atau VPN memakai huruf, angka, `.`, `_`, dan `-`, diawali huruf atau angka, dan panjangnya paling banyak 63 karakter.
- Nama grup, tag, dan label memakai karakter yang sama, sehingga semuanya bisa ditulis dalam target.
- `all` tidak boleh menjadi nama, karena sebagai target artinya semuanya.
- Server, conn, dan VPN berbagi satu daftar nama, dan `Web1` serta `web1` adalah nama yang sama.
- Perintah `db`, `cache`, atau conn lain butuh tepat satu conn dari jenisnya di dalam target.

## Pemecahan masalah

| Kode error | Artinya | Yang perlu dilakukan |
|------------|---------|----------------------|
| `TARGET_EMPTY` | target tidak cocok dengan apa pun (exit 3) | `komando list` menampilkan server, conn, grup, dan tag |
| `NO_MATCHING_TARGETS` | target hanya memilih hal yang tidak bisa dipakai perintah ini (exit 3) | petunjuk menyebut perintah untuk apa yang dipilih |
| `TARGET_NOT_FOUND` | tidak ada server dengan nama itu (exit 3) | lihat "did you mean", atau `komando host list` |
| `USAGE` | perintah yang butuh tepat satu conn mendapat target berisi beberapa | sebut satu conn itu |
| `CONFIRM_REQUIRED` | `group rm` pada grup dengan lebih dari 3 anggota, dari agen AI atau script tanpa `--yes` | periksa anggotanya dengan `komando group list GROUP`, lalu tambahkan `--yes` setelah seseorang setuju |
