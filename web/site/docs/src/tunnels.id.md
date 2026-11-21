# Server privat dan tunnel

Jangkau server dan layanan yang tidak ada di internet, lalu buka di aplikasi di komputer ini.

## Menjangkau server privat lewat bastion

Banyak server privat hanya bisa dijangkau lewat satu server gerbang publik, yang disebut bastion atau jump host. Beri tahu komando sekali dengan `--via`, dan setiap perintah lewat sana dengan sendirinya:

```bash
komando host add bastion ubuntu@203.0.113.10
komando host add db1 admin@10.0.0.5 --via bastion          # satu langkah
komando exec db1 -- uptime                                 # lewat bastion
```

```bash
komando host add web2 admin@10.1.0.7 --via bastion,db1     # rantai: bastion, lalu db1
komando conn add prod-db postgres://app@10.0.0.9/app --via bastion   # database di belakangnya
```

- Rantai mencantumkan langkah-langkahnya berurutan, dari komputer ini ke target.
- `--via` bekerja sama untuk server dan conn (database, cache, storage). Rantai juga bisa diawali VPN: lihat [VPN](vpn.md).
- komando membuka koneksi lewat bastion di dalam prosesnya sendiri. Tidak ada port yang terbuka di komputer ini, dan pengaturan jaringan tidak berubah.
- Server di belakang bastion yang sama berbagi satu koneksi ke bastion itu dalam satu perintah (lihat [Server](servers.md#add-a-server)).

## Membuka database privat di aplikasi sendiri

Untuk memakai TablePlus, DBeaver, psql, atau aplikasi lain pada database di belakang bastion, mulai tunnel dengan nama conn-nya. komando memilih port lokal yang bebas dan mencetaknya:

```bash
komando tunnel start prod-db
```

```text
tunnel t1108-195255-ab12cd34 is up: 127.0.0.1:53412 (this computer) -> prod-db (10.0.0.9:5432), through bastion
stop it with: komando tunnel stop t1108-195255-ab12cd34
```

Jika diketik tanpa argumen di terminal, `komando tunnel start` menanyakan ke server atau conn mana tunnel itu menuju.

```bash
komando tunnel start prod-db --port 15432     # pilih port sendiri
```

Arahkan aplikasi ke alamat itu, dengan nama user dan kata sandi database. Kata sandinya ada di vault komando: di terminal, `komando secret show prod-db-pass --reveal | pbcopy` menyalinnya (macOS; `xclip` di Linux) tanpa menampilkannya. Agen AI tidak pernah mendapatkannya; mereka memakai `komando db query`. Tunnel berjalan di latar belakang sampai dihentikan dengan `komando tunnel stop`.

## Forward port apa pun

Tunnel membuat layanan di server tampil di komputer sendiri (atau sebaliknya). Ada tiga jenis:

| Flag | Arah | Contoh | Artinya |
|------|------|--------|---------|
| `-L` | server → komputer ini | `-L 15432:localhost:5432` | port 15432 di komputer *Anda* menuju port 5432 seperti yang terlihat dari server |
| `-R` | komputer ini → server | `-R 9000:localhost:3000` | port 9000 *di server* menuju port 3000 di komputer ini |
| `-D` | proxy SOCKS5 | `-D 1080` | aplikasi yang diatur memakai proxy `localhost:1080` tersambung lewat server |

```bash
komando tunnel start db1 -L 15432:localhost:5432    # lalu sambungkan ke localhost:15432
komando tunnel start web1 -L 8080:localhost:80      # aplikasi web di web1, di localhost:8080
komando tunnel start web1 -R 9000:localhost:3000    # tampilkan aplikasi lokal Anda ke web1
komando tunnel start bastion -D 1080                # berselancar lewat bastion
komando tunnel start office -D 1080                 # berselancar lewat VPN office (-L juga bisa; -R butuh server)
```

Alamat IPv6 ditulis dalam kurung siku, seperti di ssh: `-L 8080:[::1]:80`, atau `-L [::1]:8080:[fd00::5]:5432` untuk mendengarkan di loopback IPv6.

- Port `0` memilih port yang bebas. Hasilnya menampilkan alamat yang dipakai.
- Untuk `-R`, alamat yang mendengarkan ada di server. Hasilnya menyebutkannya (`remote_listen`, `listen_on`).
- Ctrl-C saat tunnel sedang dimulai menghentikannya dan melupakannya (`CANCELLED`).

## Melihat dan menghentikan tunnel

```bash
komando tunnel list                                 # tunnel dan apakah masih berjalan
komando tunnel stop t1108-195255-ab12cd34           # hentikan satu menurut ID-nya
komando tunnel stop --all
```

```text
ID                     HOST     KIND   LISTEN           TO                         STATE  AGE
t1108-195255-ab12cd34  bastion  local  127.0.0.1:53412  prod-db (10.0.0.9:5432)    up     2h
```

- `tunnel list` menghapus entri tunnel yang sudah tidak berjalan.
- `tunnel stop` menerima ID atau `--all`, tidak keduanya.
- Tunnel yang prosesnya sudah hilang, atau yang process ID-nya sekarang milik program lain, tampil sebagai down dan tidak pernah diberi sinyal.
- `komando status` menampilkan tunnel bersama VPN, login, dan job ([Apa yang masih berjalan](commands.md#see-what-is-still-running)).

## Di balik proxy perusahaan

Sebagian jaringan hanya bisa menjangkau internet lewat proxy perusahaan. Atur proxy itu dengan cara yang dibaca `curl`, `kubectl`, dan `docker`, misalnya di `~/.zshrc`:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=.internal,10.0.0.0/8     # nama dan jaringan yang dijangkau langsung
```

| Apa | Cara keluarnya |
|---|---|
| API web: cluster Kubernetes (juga `cluster exec`, `cluster forward`, `cluster shell`), registry, storage S3, secret store (Vault, 1Password, Bitwarden, AWS, GCP, Azure), login dan tunnel VPN AnyConnect, Fortinet, GlobalProtect, F5, dan Pulse, serta `komando update` | lewat `HTTPS_PROXY` (dan `HTTP_PROXY` untuk alamat `http://`), kecuali yang disebut `NO_PROXY` |
| Server (SSH), database, cache, FTP, dan SFTP | tidak lewat `HTTPS_PROXY`: `ssh` dan `psql` juga tidak membacanya, dan proxy perusahaan biasanya hanya mengizinkan lalu lintas web keluar. Jangkau lewat proxy yang ditambahkan sebagai VPN, lalu `--via NAME`: proxy HTTP dengan `komando vpn add NAME proxy --proxy-address HOST:PORT`, proxy SOCKS dengan `komando vpn add NAME socks --proxy-address HOST:PORT`; atau lewat bastion |
| VPN WireGuard, L2TP/IPsec, IPsec, dan IKEv2 | tidak lewat proxy: VPN ini memakai UDP, yang tidak bisa dibawa proxy web |

- `HTTPS_PROXY`, `HTTP_PROXY`, dan `NO_PROXY` hanya berlaku saat seseorang menjalankan komando. Saat agen AI yang menjalankannya, lingkungannya milik agen, dan komando tidak mengambil proxy darinya: kalau tidak, agen bisa mengirim setiap login lewat proxy miliknya sendiri. Jika perintah agen perlu lewat proxy perusahaan, tambahkan proxy itu sebagai VPN dan pakai `--via`, atau untuk cluster taruh `proxy-url` di kubeconfig-nya.
- komando memeriksa sertifikat terhadap CA milik komputer itu sendiri (dan `?ca=` milik conn, `--ca` milik VPN, atau CA milik kubeconfig). `SSL_CERT_FILE` dan `SSL_CERT_DIR` diabaikan, di Linux, macOS, dan Windows: proxy yang memeriksa TLS butuh CA-nya di trust store sistem, atau diberikan sebagai `?ca=` / `--ca`.
- `proxy-url` di kubeconfig mengalahkan `HTTPS_PROXY` untuk cluster itu, seperti di `kubectl`. Nilainya boleh `http://`, `https://`, atau `socks5://`.
- Server atau conn yang dijangkau dengan `--via` keluar lewat jalurnya sendiri, tidak pernah lewat proxy ini.
- Proxy HTTP sebagai VPN (jenis `proxy`) membuat tunnel untuk setiap koneksi dengan CONNECT. `host ssh-command` mengubahnya menjadi `ProxyCommand` OpenSSH (`nc -X connect`) saat proxy tidak butuh login.
- Alamat di komputer ini (`localhost`, port `127.0.0.1` milik tunnel) tidak pernah memakai proxy.
- Nama user dan kata sandi di URL proxy (`http://user:password@proxy:3128`) dikirim ke proxy. Kesalahan menampilkan URL dengan kata sandi disembunyikan.

## Batasan

- Tunnel mendengarkan di `127.0.0.1`, jadi hanya komputer ini yang bisa memakainya. Untuk mendengarkan di alamat lain (`-L 0.0.0.0:8080:...`), tambahkan `--yes`; agen AI menambahkannya hanya setelah seseorang setuju ([Keamanan](safety.md)). Siapa pun di jaringan itu lalu bisa memakai tunnel tanpa login.
- `-R` butuh server di ujung jalur: VPN tidak bisa mendengarkan.
- Satu tunnel memakai tepat satu dari `-L`, `-R`, dan `-D`.
- Banyak proxy perusahaan hanya mengizinkan port 443.
- VPN WireGuard, L2TP/IPsec, IPsec, dan IKEv2 tidak bisa lewat proxy web.
- Lewat WinRM, server Windows tidak menerima tunnel ([Server Windows](windows.md)).

## Pemecahan masalah

| Kode kesalahan | Artinya | Yang perlu dilakukan |
|------------|---------|----------------------|
| `OPEN_BIND` | tunnel akan mendengarkan di alamat yang bisa dijangkau komputer lain (exit 6) | pertahankan default `127.0.0.1`, atau tambahkan `--yes` bila memang bermaksud begitu |
| `PORT_IN_USE` | port lokal sudah dipakai (exit 8); untuk `-R`, sshd di server mungkin mematikan `AllowTcpForwarding` | pilih port lain, atau `0` untuk port yang bebas |
| `CANCELLED` | Ctrl-C menghentikan tunnel sebelum aktif; tidak ada yang tersisa berjalan | mulai lagi |
| `TUNNEL_NOT_FOUND` | tidak ada tunnel dengan ID itu | lihat daftarnya dengan `komando tunnel list` |
| `VPN_DOWN` | VPN atau proxy di jalur tidak aktif, atau proxy menolak port | baca pesannya; `komando vpn test NAME` mencoba lagi |
| `HOST_IN_USE` | server yang ingin dihapus masih menjadi langkah di jalur `--via` server lain | ubah `--via` mereka dulu |
