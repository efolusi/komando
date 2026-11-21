# Cache

Baca dan ubah key di cache yang kompatibel dengan Redis (Redis, Valkey, KeyDB, Dragonfly) dan memcached dengan aman.

## Menambah cache

```bash
komando cache add prod-redis redis://default@10.0.0.7:6379/0 --via web1 --ask-password
komando test prod-redis                       # bisakah komando menjangkaunya dan login?
```

Jika diketik tanpa argumen, `komando cache add` menanyakan setiap bagian selangkah demi selangkah.

URL-nya `redis://USER@HOST:PORT/DB`; pakai `rediss://` untuk TLS. Kata sandi masuk ke vault, tidak pernah ke URL: `--ask-password` menanyakannya (disembunyikan), atau simpan dulu lalu rujuk:

```bash
komando secret set prod-redis-pass            # tiap kata sandi sekali, diketik tersembunyi
komando cache add prod-redis redis://default@10.0.0.7:6379/0 --via web1 --password-ref secret:prod-redis-pass
```

`--via` menjangkau cache lewat bastion atau VPN, seperti conn lainnya (lihat [Tunnel](tunnels.md) dan [VPN](vpn.md)).

Di terminal, perintah yang tidak menyebut cache atau key akan menanyakan hanya bagian itu, dengan daftar cache Anda untuk dipilih, lalu menampilkan perintah lengkapnya. Jika diketik tanpa argumen, `komando cache get` menanyakan cache mana, lalu key-nya. Agen AI, script, atau pipe tidak pernah mendapat pertanyaan: perintah yang sama berhenti dengan `USAGE` (exit 2) dan hint berisi contoh (`komando cache get prod-redis session:42`).

### Enkripsi (TLS)

`redis://` langsung lewat jaringan (tanpa `--via`, bukan ke komputer ini) mengirim kata sandi dan data tanpa enkripsi, jadi `cache add` (dan `conn edit --url`) menolaknya dengan `INSECURE_PROTOCOL`: pakai `rediss://` atau `--via`, atau tambahkan `?insecure=1` untuk menerima bahwa lalu lintasnya bisa dibaca di jalan (untuk agen AI butuh jawaban ya dari seseorang). Hal yang sama berlaku untuk `memcached://`. Conn seperti itu yang sudah ada di daftar Anda tetap berfungsi; `komando doctor` memperingatkannya dan mencetak baris yang mengubahnya.

`rediss://` dan `memcacheds://` memeriksa sertifikat server terhadap CA tepercaya di komputer Anda, atau terhadap CA Anda sendiri dengan `?ca=secret:NAMA` (CA privat, atau milik cloud):

```bash
komando secret set prod-redis-ca < ca.pem
komando cache add prod-redis 'rediss://default@cache.internal:6380/1?ca=secret:prod-redis-ca' --password-ref secret:prod-redis-pass
```

### Redis Cluster dan Sentinel

Tambahkan Redis Cluster (atau cluster Valkey, atau ElastiCache dan MemoryDB dalam mode cluster) lewat alamat satu node dengan `?cluster=1`: komando menemukan node lainnya dari sana. Di balik Sentinel, tambahkan alamat satu Sentinel dengan `?sentinel=` dan nama master: komando menanyakan ke Sentinel di mana master sekarang, sehingga failover tidak butuh perubahan.

```bash
komando cache add sessions 'rediss://default@clustercfg.sessions.abc123.cache.amazonaws.com:6379?cluster=1' --password-ref secret:sessions-pass
komando cache add jobs-redis 'redis://default@sentinel1:26379/0?sentinel=mymaster&sentinels=sentinel2,sentinel3' --via web1 --password-ref secret:jobs-redis-pass
```

- Di Cluster, `cache keys` memindai setiap master dan `cache info` menjumlahkan memori, klien, dan key dari semuanya, beserta status cluster (`cluster_state`, `masters`). Perintah untuk satu key menuju node yang menyimpannya, dan `cache rm` menghapus key dari slot berbeda satu per satu. `cache run -- DBSIZE` menjumlahkan setiap master.
- Sentinel mendengarkan di 26379 bila URL tidak menyebut port. Sentinel tambahan ditulis di `sentinels=HOST[:PORT],...`. Kata sandinya untuk Redis; bila Sentinel juga memintanya, tambahkan `&sentinel_auth=same`.
- Lewat `--via`, setiap node dan Sentinel dijangkau lewat bastion atau VPN yang sama, dengan TLS untuk `rediss://`.

Apa yang tidak bisa dilakukan Cluster ada di bawah [Batasan](#limits).

## Melihat data

```bash
komando cache get prod-redis session:42       # tipe apa pun: string, hash, list, set, sorted set
```

```text
key:   session:42
type:  string
ttl:   1740s
size:  9 bytes
value: logged-in
```

Perintah ini hanya membaca:

```bash
komando cache info prod-redis                 # ringkasan
komando cache info prod-redis memory          # satu bagian INFO mentah
komando cache info prod-redis --all           # setiap field dari bagian INFO default
komando cache keys prod-redis 'session:*'     # key yang cocok dengan pola (sampai 100; --limit 1000)
komando cache get prod-redis leaderboard --limit 10   # paling banyak 10 item dari hash atau list besar
```

```text
version:   7.2.4 (standalone)
role:      master
uptime:    12d
memory:    1.2 GiB used of 4.0 GiB (eviction: allkeys-lru)
clients:   37
keys db0:  48210 (31002 with a ttl)
hit rate:  94.1% (1830211 hits, 114502 misses)
(all fields: --all, or a section such as memory or stats)
```

`cache keys` memakai `SCAN`, jadi aman di cache besar. Jangan pernah memakai `KEYS`. Setiap key menampilkan tipe dan time to live-nya, tidak pernah nilainya:

```text
KEY        TYPE    TTL
queue      list    2s
session:1  string  1h
session:2  hash    none
```

Di JSON, `items` mencantumkan key yang sama dengan `keys`, dalam urutan yang sama, masing-masing sebagai `{"key", "type", "ttl_seconds"}`: `ttl_seconds` bernilai -1 untuk tanpa kedaluwarsa dan null bila tidak diketahui, dan `type` bernilai null bila server menolak `TYPE` (ACL tanpa itu). Redis membaca `TYPE` dan `PTTL` seluruh halaman dalam satu round trip (satu per master di Cluster). Di memcached setiap tipe adalah `string` dan time to live berasal dari daftar LRU crawler. `--limit` di bawah 1 adalah error `USAGE`. Bila lebih banyak key yang cocok, daftar ditutup dengan `(first 100 keys; more match: narrow the pattern or raise --limit)`.

## Mengubah data

```bash
komando cache set prod-redis maintenance on --ttl 30m       # --ttl menerima 30m, 24h, 7d
komando cache set prod-redis feature:dark-mode on           # tanpa --ttl: tidak pernah kedaluwarsa
```

```text
set maintenance (expires in 30m)
```

- `cache set` menyimpan string dan menggantikan nilai lama apa pun. `--ttl` harus positif. `set` dan `get` sama-sama melaporkan `ttl_seconds` (`null` bila key tidak pernah kedaluwarsa).
- Conn yang dilindungi bertanya kepada orang di terminal sebelum setiap perubahan; agen AI atau script menambahkan `--yes` setelah seseorang setuju (kalau tidak, `PROTECTED_TARGET`, exit 6).
- Redis tidak bisa membatalkan, jadi `--dry-run` tidak mengirim perubahan sama sekali: `cache set` menyatakan apakah key ada dan akan digantikan, `cache rm` key mana yang ada.

### Menghapus key

```bash
komando cache rm prod-redis session:42 session:43 --dry-run   # mana dari key ini yang ada
komando cache rm prod-redis session:42 session:43
```

```text
would delete 1 key:
  session:42
  session:43 (does not exist)
```

`cache rm` menghapus key menurut nama persisnya (tanpa pola), dan key yang dihapus tidak bisa kembali. Di terminal Anda komando bertanya dulu: Anda mengetik nama key (untuk beberapa key, jumlahnya). Agen AI atau script menambahkan `--allow-dangerous` setelah seseorang setuju; tanpanya, mereka mendapat `POLICY_BLOCKED` (exit 6). Lihat [Keamanan](safety.md#what-needs-a-yes).

## Perintah Redis lainnya

`cache run` mengirim perintah apa pun. Perintah ini hanya membaca kecuali Anda menambahkan `--write`:

```bash
komando cache run prod-redis -- HGETALL user:42
komando cache run prod-redis -- ZREVRANGE leaderboard 0 9 WITHSCORES
komando cache run prod-redis --write -- EXPIRE session:42 3600
komando cache run prod-redis -- "GET feature:dark-mode"   # satu baris dalam tanda kutip, dipecah seperti redis-cli
```

Perintah yang menghapus, mengosongkan, memblokir, menjalankan script, atau mengonfigurasi ulang server (`DEL`, `FLUSHALL`, `KEYS`, `EVAL`, `CONFIG SET`, `SHUTDOWN`, ...) bersifat merusak, jadi bertanya seperti `cache rm` (`--allow-dangerous` untuk agen). Error menyebut perintah yang lebih aman sebagai gantinya (`cache keys` untuk `KEYS`, `cache rm` untuk `DEL`).

- Script read-only (`EVAL_RO`, `EVALSHA_RO`, `FCALL_RO`) dihitung sebagai script: tidak bisa menulis, tetapi yang berputar membuat Redis menjawab `BUSY` kepada setiap klien sampai seseorang mengirim `SCRIPT KILL` (`FUNCTION KILL` untuk `FCALL_RO`).
- Kode modul juga dihitung: fungsi Redis Stack (`TFCALL`, `TFCALLASYNC`) dan RedisGears (`RG.PYEXECUTE`, `RG.TRIGGER`).
- Administrasi Cluster dan Sentinel juga dihitung: `CLUSTER MEET`, `ADDSLOTS`, `FLUSHSLOTS`, `REPLICATE` (node membuang datanya sendiri), `SENTINEL SET`, `FAILOVER`, `REMOVE`, `CONFIG SET`, dan sejenisnya. `CLUSTER NODES`, `CLUSTER REPLICAS`, `SENTINEL MASTERS`, `SENTINEL GET-MASTER-ADDR-BY-NAME`, dan `SENTINEL CONFIG GET` hanya membaca.
- Begitu juga perintah yang menghapus key dengan cara lain: `FT.DROPINDEX ... DD`, `FT.DROP` tanpa `KEEPDOCS`, dan `SET` atau `GETEX` dengan waktu `EXAT` atau `PXAT` yang sudah lewat.
- `FUNCTION LOAD REPLACE` dan `TFUNCTION LOAD REPLACE` juga dihitung: keduanya menukar kode di balik fungsi yang sudah dipanggil aplikasi. `FUNCTION LOAD` biasa hanya butuh `--write`.
- `CONFIG GET` hanya membaca. Untuk agen AI, nilai pengaturan kata sandi (`requirepass`, `masterauth`, `tls-key-file-pass`, ...) dan hash kata sandi di `ACL LIST` dan `ACL GETUSER` tampil sebagai `[hidden]`, bahkan bila kata sandinya sebuah kata seperti `yes`. Field hash yang namanya seperti secret (`password`, `token`, ...) disembunyikan dengan cara yang sama lewat RESP2 dan RESP3.

## Memeriksa, mengubah, mengganti nama, atau menghapus cache

Cache adalah sebuah conn, jadi perintah conn berfungsi padanya:

```bash
komando test prod-redis                       # bisakah komando menjangkaunya dan login?
komando conn show prod-redis                  # URL, jalan masuk, dan rujukan kata sandinya
komando conn edit prod-redis --via web2       # jangkau dengan cara lain
komando conn edit prod-redis --protected      # setiap perubahan lalu butuh jawaban ya dari seseorang
komando conn rename prod-redis sessions-redis
komando conn rm prod-redis                    # hapus dari daftar Anda (cache-nya tidak disentuh)
```

### Backup cache

komando tidak punya perintah backup untuk cache. Redis menyimpan snapshot-nya sendiri, yang lalu bisa Anda ambil dari servernya:

```bash
komando cache run prod-redis --write -- BGSAVE
komando download web1 /var/lib/redis/dump.rdb --sudo --to ./
```

## memcached

Perintah yang sama berfungsi dengan memcached. URL-nya `memcached://HOST:11211`; pakai `memcacheds://` untuk TLS. Untuk server yang dijalankan dengan `memcached -Y`, berikan user di URL dan kata sandi sebagai rujukan:

```bash
komando cache add prod-memcached memcached://cache.internal:11211 --via web1
komando cache add app-memcached memcached://app@cache.internal:11211 --via web1 --password-ref secret:app-memcached-pass
komando cache get prod-memcached session:42   # nilainya, dan di 1.6+ time to live-nya
komando cache keys prod-memcached 'session:*' # lewat LRU crawler memcached
komando cache info prod-memcached             # ringkasan `stats`; `info prod-memcached items` untuk satu bagian
komando cache run prod-memcached -- stats slabs
```

- `cache set` dan `cache rm` bekerja seperti di Redis, dengan aturan keamanan yang sama.
- `cache run` mengirim satu baris perintah dan hanya membaca kecuali `--write`. `flush_all` dan perintah yang mengubah atau menghentikan server bersifat merusak. Simpan nilai dengan `cache set`.
- Baris dipecah pada spasi seperti cara memcached membacanya, dan kata perintah dikirim dalam huruf kecil.

## Batasan

- `cache rm` menerima nama key yang persis, tidak pernah pola.
- `cache run` mencetak satu balasan, jadi perintah yang tidak pernah berhenti mengirim (`MONITOR`, `SUBSCRIBE`, `PSUBSCRIBE`, `XREAD ... BLOCK`) berhenti dengan `NOT_SUPPORTED`. Di memcached, `watch` tidak pernah kembali, jadi berhenti dengan cara yang sama.
- Di memcached, pindah baris atau karakter kontrol lain di baris `cache run` berhenti dengan `USAGE` (akan memulai perintah kedua).
- Cluster hanya punya database 0.
- Di Cluster, `SCAN`, `RANDOMKEY`, `KEYS`, `FLUSHALL`, `FLUSHDB`, dan `SWAPDB` hanya akan menjangkau satu master, jadi berhenti dengan `NOT_SUPPORTED` (pakai `cache keys`; untuk mengosongkan, tambahkan setiap master sebagai conn tersendiri). Perintah atas beberapa key dari slot berbeda (`MGET a b`) gagal dengan `CROSSSLOT`: pakai satu perintah per key, atau `{tag}` yang sama di nama key.
- `cache keys` di memcached butuh LRU crawler (menyala secara default sejak memcached 1.5).
- komando tidak punya perintah backup untuk cache (lihat [Backup cache](#back-up-a-cache)).

## Pemecahan masalah

| Error | Artinya | Yang perlu dilakukan |
|-------|---------|----------------------|
| `CACHE_CONNECT` | komando tidak bisa menjangkau cache, atau tidak bisa memeriksa sertifikatnya | `komando test prod-redis`; untuk CA privat tambahkan `?ca=secret:NAMA`, atau jangkau `--via` sebuah server |
| `CACHE_AUTH` | cache menolak login | periksa user di URL dan rujukan kata sandi (`komando conn show prod-redis`) |
| `CACHE_ERROR` | memcached tidak bisa mencantumkan key | jalankan memcached dengan LRU crawler menyala; `cache get` berfungsi tanpanya |
| `INSECURE_PROTOCOL` | `redis://` atau `memcached://` melewati jaringan tanpa enkripsi | pakai `rediss://` atau `memcacheds://`, atau `--via`, atau tambahkan `?insecure=1` |
| `NOT_FOUND` | `cache info` meminta bagian yang tidak dimiliki server | `komando cache info prod-redis --all` |
| `NOT_SUPPORTED` | perintah yang tidak pernah kembali, atau yang tidak bisa dijalankan Cluster di semua master | hint menyebut apa yang dipakai sebagai gantinya |
| `POLICY_BLOCKED` | perintah merusak tanpa `--allow-dangerous` (exit 6) | jalankan di terminal, atau tambahkan flag setelah seseorang setuju |
| `PROTECTED_TARGET` | perubahan pada cache yang dilindungi tanpa `--yes` (exit 6) | jalankan di terminal, atau tambahkan flag setelah seseorang setuju |
| `USAGE` | argumen hilang atau salah (exit 2) | hint menunjukkan contoh lengkap |

Setiap kode ada di [Kode error](error-codes.md).

## Referensi

### Output

Output teks (`-o text`) tampak seperti `redis-cli`: satu item per baris, bernomor, balasan bersarang diberi indentasi. String diberi tanda kutip bila berisi spasi, tanda kutip, atau karakter kontrol (pindah baris tampil sebagai `\n`), jadi nilai tidak pernah merusak tata letak. Entri hash atau map tampil sebagai `nama: nilai`.

JSON menyimpan nilai persis apa adanya; nilai biner datang sebagai `{"base64": "..."}`.
