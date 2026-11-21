# VPN

Jangkau server dan database yang berada di balik VPN, bahkan beberapa VPN sekaligus, tanpa berpindah-pindah di antaranya.

## Menjangkau server lewat VPN

```bash
komando vpn add office wireguard --config ~/Downloads/office.conf --check 10.0.0.5:22
komando host add db1 admin@10.0.0.5 --via office    # server di dalam VPN
komando exec db1 -- uptime                          # menyambungkan VPN dengan sendirinya
komando test kind:vpn                               # apakah semua VPN berfungsi?
komando vpn status                                  # VPN mana yang aktif, dan apa yang memakainya
```

Di terminal, `komando vpn add` yang diketik tanpa argumen bertanya selangkah demi selangkah, dimulai dari aplikasi VPN yang dipakai perusahaan Anda.

```text
$ komando vpn status
NAME     KIND           UP    SINCE   USED BY   DETAIL
corp     globalprotect  yes   2h      web1      session running
office   wireguard      -     -       db1       connects for each command
```

## VPN yang didukung

| Jenis | Apa itu | Berjalan | Mengubah jaringan komputer Anda? |
|-------|---------|----------|----------------------------------|
| `wireguard` | WireGuard | di dalam komando | tidak |
| `openvpn` (juga `pritunl`) | profil OpenVPN dan Pritunl | di dalam komando | tidak |
| `anyconnect` | Cisco AnyConnect dan ocserv | di dalam komando | tidak |
| `tailscale` | Tailscale, atau server Headscale Anda sendiri (`--server URL`) | di dalam komando | tidak |
| `fortinet` | Fortinet SSL VPN (FortiClient) | di dalam komando, eksperimental (lihat di bawah) | tidak |
| `globalprotect` | Palo Alto GlobalProtect | di dalam komando; dicoba di Prisma Access (lihat di bawah) | tidak |
| `f5` | F5 BIG-IP SSL VPN | di dalam komando, eksperimental | tidak |
| `pulse` | Pulse Secure / Ivanti Connect Secure | di dalam komando, eksperimental | tidak |
| `l2tp` | L2TP/IPsec dengan pre-shared key (Windows Server, MikroTik, strongSwan + xl2tpd, banyak router) | di dalam komando | tidak |
| `ipsec` (juga `cisco`, `xauth`) | IPsec gaya Cisco: nama grup dan kata sandi, lalu login Anda (XAUTH): Cisco ASA/IOS, MikroTik, strongSwan; tipe "IPSec" di macOS dan iOS | di dalam komando | tidak |
| `ikev2` | IKEv2/IPsec, dengan pre-shared key atau login user (EAP-MSCHAPv2) yang diperiksa terhadap sertifikat server | di dalam komando | tidak |
| `socks` | proxy SOCKS5 yang sudah berjalan (`komando tunnel start bastion -D 1080`, proxy perusahaan); dengan login: `--user` dan `--password-ref` | sudah berjalan | tidak |
| `proxy` | proxy HTTP yang membuat tunnel untuk koneksi (CONNECT), seperti proxy perusahaan: `--proxy-address proxy.corp:3128` atau `https://proxy.corp`, loginnya dengan `--user` dan `--password-ref` | sudah berjalan | tidak |
| `system` | VPN yang diatur di pengaturan komputer Anda sendiri | oleh komputer Anda | ya |

`komando vpn add --help` menunjukkan flag mana yang cocok untuk setiap jenis; `komando schema vpn add` mencantumkan hal yang sama untuk sebuah program, di `add_kinds` (lihat [Referensi: komando schema](output.md#reference-komando-schema)).

"Di dalam komando" berarti: tanpa program tambahan, tanpa Docker, tanpa hak admin. Route dan DNS komputer Anda tetap sama, jadi dua VPN yang memakai alamat yang sama (keduanya `10.0.0.0/8`) tidak saling mengganggu. Nama di dalam VPN (`db.internal`) dicari dengan server DNS yang diberikan konfigurasi VPN itu sendiri.

## Menambah VPN

VPN yang login dengan kata sandi, pre-shared key, atau auth key membacanya dari vault: simpan dulu dengan `komando secret set NAME` (menanyakannya, disembunyikan), lalu sebut di `--password-ref` atau `--psk-ref`. Atau ketik saat Anda menambah VPN: `--ask-password` menyimpannya sebagai `secret:NAME-pass`, dan `--ask-psk` menyimpan pre-shared key sebagai `secret:NAME-psk`.

Pilih baris untuk jenis VPN Anda:

```bash
komando vpn add office wireguard --config ~/Downloads/office.conf --check 10.0.0.5:22
komando vpn add office openvpn --config office.ovpn --user alice --password-ref secret:office-pass --check 10.8.0.1:22
komando vpn add office globalprotect --portal vpn.example.com --user alice --password-ref secret:office-pass --mfa
komando vpn add office globalprotect --portal vpn.example.com     # login lewat jendela browser saat `vpn up`
komando vpn add office tailscale --password-ref secret:ts-authkey
komando vpn add office l2tp --server vpn.example.com --psk-ref secret:office-psk --user alice --password-ref secret:office-pass --check 10.1.0.5:22
komando vpn add office ipsec --server asa.example.com --id staff --psk-ref secret:office-group --user alice --password-ref secret:office-pass
komando vpn add office ikev2 --server vpn.example.com --user alice --password-ref secret:office-pass --check 10.2.0.5:22
komando vpn add office system --service "Corp VPN" --check 10.20.0.1:443
komando vpn add office socks --proxy-address 127.0.0.1:1080
komando vpn add office proxy --proxy-address proxy.corp.example:3128
```

- `--check host:port` adalah alamat yang hanya menjawab lewat VPN. `komando test` dan `komando vpn up` tersambung ke sana untuk membuktikan VPN berfungsi. Selalu tambahkan satu; VPN `system` dan `openvpn` membutuhkannya. Tanpanya, VPN proxy SOCKS atau HTTP diperiksa dengan tersambung ke proxy itu sendiri.
- `--config` menerima file `.conf` WireGuard atau `.ovpn` OpenVPN. komando menyimpannya di vault, bersama key-nya. File aslinya masih memuat private key, jadi hapus bila Anda tidak lagi membutuhkannya. Secret di vault dinamai menurut VPN: `NAME-key` dan `NAME-psk` (WireGuard) atau `NAME-config` (OpenVPN). Bila secret dengan nama itu sudah ada, `vpn add` berhenti dengan `SECRET_EXISTS` dan tidak menyimpan apa pun, jadi tidak pernah menggantikan secret yang dipakai server atau file. Pilih nama VPN lain, atau pindahkan secret-nya dulu (`komando secret rename`, atau `komando secret rm` bila VPN sebelumnya dengan nama itu yang meninggalkannya). `--overwrite` boleh memakai ulang secret milik VPN yang digantikannya, bila tidak ada yang lain memakainya, dan secret yang tidak dipakai apa pun dan sudah berisi key yang sama (file yang sama ditambahkan lagi setelah `vpn rm`) juga dipakai ulang.
- `--password-ref` bekerja seperti di mana pun di komando: `secret:NAME`, `env:VAR`, password manager, dan seterusnya (lihat [Server](servers.md)). Untuk Tailscale itu adalah auth key. VPN mengirimnya (dan `--psk-ref`) ke servernya setiap kali tersambung, jadi saat agen AI menambah VPN dengannya, atau mengarahkan VPN ke server atau alamat lain, seseorang mengizinkannya: `--yes` dan klik di jendela komando, yang menyebut rujukan dan servernya (`SECRET_DESTINATION`).
- `--portal` adalah server VPN untuk `anyconnect`, `fortinet`, `globalprotect`, `f5`, dan `pulse`.
- `--server` adalah server VPN untuk `l2tp`, `ipsec`, dan `ikev2`, dan `--psk-ref` pre-shared key-nya ("shared secret"; untuk `ipsec` kata sandi grup), sebagai rujukan seperti `--password-ref`. Lihat [Detail L2TP/IPsec, IPsec, dan IKEv2](#l2tpipsec-ipsec-and-ikev2-details).
- `--service` (hanya `system`) adalah nama VPN di pengaturan komputer Anda. Dengannya, `komando vpn up` menyambungkan VPN untuk Anda (macOS: `scutil`; Linux: NetworkManager). Tanpanya, sambungkan VPN sendiri; komando memeriksanya dengan `--check`.
- `vpn add` menerima `--label` dan `--protected` juga.

## Memakai VPN

Taruh VPN di urutan pertama `--via`. Perintah yang membutuhkannya menyambungkannya dengan sendirinya:

```bash
komando host add db1 admin@10.0.0.5 --via office                        # server di dalam VPN
komando conn add prod-db postgres://app@10.0.0.9/app --via office,bastion # VPN, lalu bastion
komando exec db1 -- uptime
komando tunnel start prod-db                                            # buka di TablePlus, psql, ...
komando tunnel start office -D 1080                                     # proxy SOCKS di port 1080 yang lewat VPN
```

Berapa lama VPN tetap aktif bergantung pada jenisnya:

- **VPN sesi** (OpenVPN, AnyConnect dan SSL VPN lainnya, L2TP, IPsec, IKEv2, Tailscale) berjalan di latar belakang setelah tersambung, dan perintah berikutnya memakai ulang sesi itu. Saat sebuah perintah menyambungkannya sendiri, perintah itu menyatakannya dalam satu baris:

  ```text
  komando: vpn corp connected; it stays up until unused for 30m (`komando vpn down corp` stops it)
  ```

- **WireGuard** tersambung untuk setiap perintah, jadi tidak ada yang tetap berjalan. Setelah `komando vpn up office`, VPN WireGuard dipertahankan aktif dan dipakai ulang seperti sesi, yang menghemat satu handshake pada setiap perintah.
- VPN **SOCKS, proxy HTTP, dan `system`** sudah berjalan; komando hanya memakainya.

Sesi yang tidak dipakai selama 30 menit ditutup. Pemakaian berarti sebuah koneksi lewat VPN itu: koneksi yang tetap terbuka (`shell`, `logs --follow`, tunnel) dihitung selama masih terbuka. Untuk mengubahnya: `komando config set vpn_idle 1h` (`0` mempertahankannya aktif sampai Anda menghentikannya).

## VPN yang membutuhkan seseorang (MFA, SSO)

Tambahkan `--mfa` bila login membutuhkan seseorang: kode sekali pakai, notifikasi push, login lewat browser. komando mengaturnya sendiri untuk SSL VPN (`anyconnect`, `globalprotect`, `fortinet`, `f5`, `pulse`) tanpa `--password-ref`, VPN Tailscale tanpa auth key, dan VPN `openvpn`, `l2tp`, `ipsec`, atau `ikev2` dengan `--user` tetapi tanpa `--password-ref`. Lalu seseorang menyambungkannya sekali:

```bash
komando vpn up corp           # login di sini, termasuk MFA
komando exec web1 -- uptime   # perintah berikutnya (dan agen) memakai ulang sesi itu
komando vpn down corp         # atau: komando vpn down --all
```

Jika diketik tanpa argumen di terminal, `komando vpn up` menanyakan VPN mana, dengan daftar milik Anda untuk dipilih.

Agen AI tidak pernah login. Tanpa sesi, agen mendapat `VPN_LOGIN_REQUIRED` (exit 4); hint menyebut `komando vpn up corp` untuk orangnya. `komando vpn up corp --dry-run` menampilkan `would_connect: false` dan `meta.would_be_blocked`. komando tidak pernah menjawab MFA sendiri.

Tailscale tanpa auth key bekerja dengan cara yang sama: `komando vpn up office` menampilkan halaman login sekali, dan node tetap login setelah itu.

`vpn down` menyatakan apa akibat pemutusan itu pada server dan conn yang memakai VPN:

```text
disconnected corp
  web1 stop answering until a person runs `komando vpn up corp`
```

VPN tanpa login seseorang disambungkan lagi oleh perintah berikutnya yang membutuhkannya (`--dry-run` menampilkan daftar yang sama lebih dulu; di JSON namanya `affects`).

## Mengelola VPN

```bash
komando vpn list                              # semua VPN
komando vpn test office                       # apakah tersambung? (sama dengan komando test office)
komando vpn show office                       # pengaturannya dan apa yang memakainya
komando vpn edit office --check 10.0.0.6:22   # ubah satu pengaturan (lihat daftar di bawah)
komando vpn status                            # mana yang aktif, sejak kapan, apa yang memakainya
komando vpn rename office office-jkt          # ganti nama; setiap jalur --via ikut
komando vpn rm office                         # hapus (beberapa nama atau selector diperbolehkan)
komando vpn edit tag:prod --protected         # tandai VPN sebagai dilindungi (seperti host edit)
```

- `vpn status`: VPN sesi aktif selama sesinya berjalan; VPN proxy SOCKS atau HTTP saat alamatnya menjawab; VPN `system` saat alamat `--check`-nya menjawab. WireGuard tersambung untuk setiap perintah, kecuali Anda menjalankan `komando vpn up` untuknya: lalu VPN itu tetap aktif seperti sesi.
- `vpn rm` menolak VPN yang masih ada di jalur `--via` (`VPN_IN_USE`, juga dengan `--dry-run`). Ubah jalur `--via` itu dulu. Jawabannya mencantumkan VPN yang dihapus (`removed`, selalu berupa daftar); `--dry-run` mencantumkannya sebagai `would_remove`. Key-nya tetap di vault sampai `komando secret rm`; VPN WireGuard atau OpenVPN baru dengan nama yang sama membutuhkannya hilang dulu, kecuali ditambahkan dari file yang sama.
- `vpn edit` mengubah `--check`, `--proxy-address`, `--user`, `--password-ref`, `--portal`, `--server`, `--psk-ref`, `--id`, `--remote-id`, `--ca`, `--service`, `--mfa`, `--legacy-crypto`, `--allow-pap`, `--notes`, `--label KEY=VALUE` (nilai kosong menghapusnya), `--protected`, serta grup dan tag: `--add-group` dan `--add-tag` menambah satu, `--rm-group` dan `--rm-tag` mencabut satu. `--unset` mengosongkan `user`, `password-ref`, `psk-ref`, `id`, `remote-id`, `ca`, `check`, atau `notes`; tidak menerima `mfa` atau `protected`. Agen AI yang menukar atau mengosongkan `--ca` sebuah VPN butuh jawaban ya dari seseorang (`SAFETY_SETTING`): CA lain membiarkan server lain mendapatkan login VPN itu.
- `vpn edit` dan `vpn rm` menerima beberapa nama atau selector (`@office`, `tag:lab`), seperti `host edit` dan `host rm`.
- VPN yang dilindungi (`--protected`) butuh jawaban ya dari seseorang sebelum diubah, digantikan, atau dihapus (`PROTECTED_TARGET`). Di terminal Anda komando bertanya dulu; agen AI atau script menambahkan `--yes` setelah seseorang setuju. Mematikan perlindungannya (`--protected=false`) atau mematikan `--mfa` melemahkan sebuah pemeriksaan, jadi juga butuh jawaban ya itu (`SAFETY_SETTING`). Lihat [Keamanan](safety.md#what-needs-a-yes).
- Untuk memberi VPN WireGuard atau OpenVPN file konfigurasi baru, tambahkan lagi dengan `--overwrite`.
- `vpn rename` menolak VPN yang sedang aktif: jalankan `komando vpn down NAME` dulu. Secret vault yang dibuat `vpn add` dengan namanya (`OLD-key`, `OLD-psk`, `OLD-config`, `OLD-pass`) pindah ke nama baru bila hanya VPN ini yang memakainya, sehingga VPN baru bisa memakai nama lama.

## Detail OpenVPN

komando punya klien OpenVPN sendiri. Klien ini mendukung UDP dan TCP, `tls-auth` dan `tls-crypt`, AES-GCM, ChaCha20-Poly1305, dan AES-CBC, serta login dengan sertifikat, nama user dan kata sandi, atau keduanya.

- Profil diperiksa saat Anda menambahkannya. Opsi yang tidak dipahami klien ditolak menurut namanya (`OVPN_UNSUPPORTED`), dan apa yang perlu diketahui seseorang tentangnya (tanpa pemeriksaan sertifikat server, di bawah) ada di `warnings` jawabannya.
- Sertifikat server harus berasal dari `<ca>` profil. Klien juga memeriksa apa yang diminta profil, seperti OpenVPN: `remote-cert-tls server` (sertifikat harus menyatakan serverAuth), `ns-cert-type server`, `remote-cert-eku`, `remote-cert-ku`, dan `verify-x509-name` (secara default seluruh subject harus cocok persis, atribut demi atribut dan berurutan, seperti `"C=US, O=Corp, CN=vpn.corp.com"`).
- Profil yang tidak meminta satu pun dari ini tetap mendapat satu pemeriksaan: sertifikat server harus ditandai untuk server (serverAuth, atau nsCertType server yang lebih lama). Kalau tidak, sertifikat user lain dari CA yang sama bisa berpura-pura menjadi server; OpenVPN sendiri hanya memperingatkan di sini. Bila sertifikat server Anda tidak ditandai untuk keduanya, error menampilkan nama di dalamnya. Periksa nama itu dengan admin VPN, lalu tambahkan `verify-x509-name NAME name` ke profil (atau minta sertifikat diterbitkan lagi dengan serverAuth).
- Saat server mendorong `auth-token`, komando login dengannya saat key diperbarui, jadi kode sekali pakai tidak ditanyakan lagi. Token tidak pernah dicatat di log.
- Kompresi (`comp-lzo yes`, `compress lz4`) juga ditolak: mengompresi sebelum mengenkripsi membocorkan data (serangan VORACLE). `comp-lzo no` dan `compress stub-v2` tidak masalah.
- Dengan `auth-user-pass` di profil, berikan `--user` dan `--password-ref`, atau `--mfa` untuk mengetik kata sandi (dengan PIN atau kode sekali pakai, untuk Pritunl) saat `komando vpn up`. Profil OpenVPN biasa yang diekspor dari Pritunl berfungsi.
- Port lokal setiap sesi butuh login yang hanya diketahui komando, jadi user lain di komputer Anda tidak bisa memakainya.
- komando membaca `.ovpn` dan menolak apa pun yang bisa dibaca berbeda oleh komando dan OpenVPN (escape backslash, tanda kutip nyasar, baris terlalu panjang, inline tag yang aneh). Profil yang bergantung pada salah satu trik itu ditolak; tulis dalam bentuk biasa.

## AnyConnect dan SSL VPN lainnya

`anyconnect` berjalan di dalam komando. Lalu lintas lewat DTLS (UDP, lebih cepat) bila server menawarkannya, dan kembali ke TLS saat UDP diblokir.

`fortinet`, `globalprotect`, `f5`, dan `pulse` juga punya klien sendiri di komando. `globalprotect` sudah dicoba pada portal dan gateway Prisma Access sungguhan, dengan login browser dan Cloud Authentication Service di bawah. `fortinet`, `f5`, dan `pulse` eksperimental: ditulis menurut protokol vendor, tetapi belum dicoba pada server milik vendor. komando memakai klien ini:

- saat program `openconnect` tidak terinstal, atau
- selalu, saat `KOMANDO_EXPERIMENTAL_VPN` menyebutnya (`KOMANDO_EXPERIMENTAL_VPN=fortinet,pulse`, atau `all`).

Kalau tidak, bila `openconnect` terinstal, komando menjalankannya bersama `ocproxy`. Itu juga membiarkan jaringan komputer Anda tidak berubah. Kedua program harus terinstal; bila salah satu hilang, `vpn up` berhenti dengan `VPN_CLIENT_MISSING` (exit 3) dan menyatakan cara menginstalnya. VPN GlobalProtect tanpa `--user` selalu memakai klien komando sendiri: hanya klien itu yang melakukan login browser di bawah.

### GlobalProtect dengan login browser

Banyak portal GlobalProtect login lewat halaman web: login perusahaan Anda (Microsoft, Okta, Google ...) dengan kode sekali pakai, juga saat portal memakai Cloud Authentication Service milik Palo Alto. Tambahkan VPN seperti itu hanya dengan portalnya, tanpa user dan tanpa kata sandi:

```bash
komando vpn add corp globalprotect --portal vpn.example.com
komando vpn up corp
```

`komando vpn up` menanyakan ke portal bagaimana cara loginnya. Untuk login browser, komando membuka jendela Chrome, Edge, Brave, atau Chromium (mana pun yang ada di komputer Anda) dengan profil sementara yang kosong: tidak berbagi apa pun dengan browser Anda sendiri dan dihapus sesudahnya. Login di sana, dengan kata sandi dan kode Anda. Jendela menutup sendiri dan VPN tersambung. Perintah berikutnya, dan agen AI, memakai sesi itu; komando tidak pernah mengetikkan kata sandi atau kode ke halaman itu.

- Portal mencantumkan gateway-nya. komando memilih yang diurutkan pertama oleh portal untuk region Anda, dan yang berikutnya bila gateway itu tidak bisa dijangkau.
- Gateway yang tidak menerima login portal punya login sendiri. komando menyatakannya dan menampilkannya di jendela yang sama; apakah Anda mengetik kata sandi lagi di sana bergantung pada login perusahaan Anda.
- Untuk login hanya sekali, berikan alamat gateway sendiri sebagai `--portal` (`komando vpn edit corp --portal gw1.example.com`): komando lalu melewati portal.
- Tanpa satu pun browser itu, login dibuka di browser Anda sendiri. Halaman terakhir punya link atau tombol yang membuka GlobalProtect: salin alamat link itu (diawali `globalprotectcallback:`) dan tempel ke terminal.

## Detail L2TP/IPsec, IPsec, dan IKEv2

Ketiganya berjalan di dalam komando: IPsec (IKE dan ESP) dan, untuk `l2tp`, L2TP dan PPP adalah kode komando sendiri. ESP selalu lewat UDP (port 4500), jadi tidak butuh hak admin; server harus mengizinkan UDP 500 dan 4500 serta NAT traversal (hampir semua mengizinkan).

Yang Anda butuhkan dari administrator VPN, atau dari pengaturan VPN di komputer tempat VPN itu sudah berfungsi:

| Jenis | Pengaturan | Flag komando |
|-------|------------|--------------|
| `l2tp` | server, pre-shared key ("shared secret"), nama user, kata sandi | `--server`, `--psk-ref`, `--user`, `--password-ref` |
| `ipsec` | server, nama grup, kata sandi grup, nama user, kata sandi | `--server`, `--id`, `--psk-ref`, `--user`, `--password-ref` |
| `ikev2`, login user | server, remote ID (bila bukan nama server), nama user, kata sandi; sertifikat CA bila sertifikat server bukan yang publik | `--server`, `--remote-id`, `--user`, `--password-ref`, `--ca FILE` |
| `ikev2`, pre-shared key | server, local ID, pre-shared key | `--server`, `--id`, `--psk-ref` |

```bash
komando secret set office-psk          # ketik pre-shared key
komando secret set office-pass         # ketik kata sandi Anda
komando vpn add office l2tp --server vpn.example.com --psk-ref secret:office-psk \
  --user alice --password-ref secret:office-pass --check 10.1.0.5:22
komando test office
```

- Tanpa `--password-ref`, seseorang mengetik kata sandi saat `komando vpn up NAME` (kata sandi dengan kode sekali pakai juga berfungsi).
- `l2tp` login ke PPP dengan MS-CHAPv2, dan memeriksa juga bukti dari server bahwa ia mengetahui kata sandi Anda. Dengan pre-shared key yang dibagi bersama, siapa pun yang mengetahui key itu bisa berpura-pura menjadi server, jadi server yang meminta login lebih lemah diminta MS-CHAPv2 sebagai gantinya: PAP menyerahkan kata sandi Anda sendiri kepada server, dan CHAP-MD5 atau tanpa login tidak membuktikan apa pun tentang server. Server yang bersikeras berhenti dengan error yang menyatakannya. Tautan tidak pernah aktif sebelum login. Bila server tidak bisa lebih baik dan Anda menerimanya, izinkan login lemah untuk VPN itu saja: `komando vpn edit office --allow-pap`.
- `ipsec` dengan nama grup (`--id`) login dengan IKEv1 aggressive mode, seperti klien Cisco sendiri. Siapa pun yang melihat login itu bisa menebak kata sandi grup secara offline, dan dengannya berpura-pura menjadi server. Log sesi dan `komando doctor` memperingatkannya; pakai `ikev2` bila server menawarkannya.
- `ikev2` dengan login user memeriksa sertifikat server terhadap CA tepercaya di komputer Anda, atau terhadap `--ca`, dan bahwa sertifikat itu dibuat atas nama server (atau `--remote-id`). komando tidak pernah melewati pemeriksaan itu.
- Sesi tetap aktif: komando menjawab pemeriksaan liveness dari server dan melakukan rekey, membuat key baru sendiri sebelum yang lama kedaluwarsa, dan mengetahui saat server menghilang.
- Cipher untuk IKEv1 (`l2tp`, `ipsec`): AES dengan SHA-256 atau SHA-1 dan DH group 14 (2048-bit) atau 19; ESP dengan AES-GCM atau AES-CBC. Server hanya bisa memilih salah satunya, tidak ada yang lebih lemah. 3DES dan DH group 2 dan 5 lemah (penyerang yang berdana besar bisa memecahkannya) dan tidak ditawarkan: server yang menginginkannya berhenti dengan error yang menyatakannya. Bila admin-nya tidak bisa mengubahnya, izinkan untuk VPN itu saja: `komando vpn edit office --legacy-crypto`. Cipher itu lalu ditaruh setelah yang kuat, dan log sesi memperingatkan saat server memilih salah satunya. IKEv2: AES-GCM dan AES-CBC dengan SHA-2 atau SHA-1, DH group 14, 19, 20, 31 (dan 2 untuk server lama). DES tunggal dan MD5 tidak pernah dipakai.
- `--legacy-crypto` dan `--allow-pap` membuat login lebih lemah, jadi menyalakan salah satunya butuh jawaban ya dari seseorang: di terminal Anda komando bertanya dulu; agen AI atau script menambahkan `--yes` setelah seseorang setuju. Nyalakan saat Anda menambah VPN (`komando vpn add office l2tp ... --legacy-crypto`) atau nanti dengan `komando vpn edit`; `--legacy-crypto=false` dan `--allow-pap=false` mematikannya lagi. `komando doctor` mencantumkan setiap VPN yang menyalakan salah satunya.
- Saat sesi berakhir sendiri, `komando vpn status` menampilkan alasannya di `last_end`.
- Bila server tidak menjawab, jalankan `KOMANDO_IPSEC_DEBUG=1 komando vpn up NAME`: log sesi lalu mencantumkan setiap pesan IKE yang dikirim dan diterima (ukuran dan tipe, tidak pernah key). Hanya mengirim dan tidak ada yang diterima berarti UDP 500 tidak tembus, atau server mengabaikan tawaran komando.

## Batasan

- WireGuard memakai baris `MTU` di file konfigurasinya (1420 bila tidak ada). Dengan VPN yang ditumpuk di dalam satu sama lain, turunkan di sana.
- `fortinet`, `f5`, dan `pulse` eksperimental, dan login PIN atau kode sekali pakai milik Pritunl belum dicoba pada server Pritunl.
- GlobalProtect: gateway Prisma Access di balik load balancer tidak didukung. Gateway seperti itu ditolak dengan error yang menyebut gateway lain milik portal; tambahkan salah satunya sebagai `--portal` VPN.
- GlobalProtect: laporan perangkat (HIP) yang diminta sebagian perusahaan tidak didukung. VPN yang membutuhkannya tersambung tetapi mungkin tidak meneruskan lalu lintas apa pun.
- `l2tp`: secret tunnel di lapisan L2TP ("L2TP secret" atau "challenge") tidak didukung.
- Pulse/Ivanti: server yang meminta sertifikat klien (EAP-TTLS) atau Host Checker ditolak dengan error yang jelas. Lalu lintas tetap di TLS; komando tidak memindahkannya ke UDP (ESP).
- VPN `system` mengubah route komputer Anda. `vpn up` membandingkan route sebelum dan sesudah, dan memperingatkan bila dua jaringan mengklaim alamat yang sama.

## Pemecahan masalah

| Kode | Artinya | Yang perlu dilakukan |
|------|---------|----------------------|
| `VPN_DOWN` (exit 4) | VPN tidak menjawab | hint bergantung pada jenisnya: sambungkan VPN `system`; jalankan proxy SOCKS (`komando tunnel start bastion -D 1080`); periksa bahwa proxy HTTP menjawab dan membiarkan port lewat (banyak proxy perusahaan hanya mengizinkan 443); periksa bahwa endpoint WireGuard bisa dijangkau dan key-nya cocok; untuk VPN sesi, sambungkan ulang dengan `komando vpn down NAME` dan `komando vpn up NAME` |
| `VPN_DOWN` saat `vpn up` pada WireGuard | tidak ada yang menjawab di `--check` lewat tunnel (belum ada handshake) | periksa endpoint dan key (`komando vpn show office`) |
| `VPN_LOGIN_REQUIRED` (exit 4) | VPN butuh login dari seseorang dan tidak punya sesi | seseorang menjalankan `komando vpn up NAME` |
| `VPN_CLIENT_MISSING` (exit 3) | `openconnect` atau `ocproxy` tidak terinstal | instal program yang disebut pesan |
| `VPN_IN_USE` (exit 8) | `vpn rm` pada VPN yang masih ada di jalur `--via` | ubah jalur `--via` itu dulu |
| `VPN_CONFIG` (exit 2) | pengaturan tersimpan atau file konfigurasi salah | perbaiki dengan `komando vpn add NAME ... --overwrite` |
| `OVPN_UNSUPPORTED` (exit 2) | profil OpenVPN punya opsi yang tidak didukung klien komando | ubah profilnya; pesan menyebut opsinya |
| `SECRET_EXISTS` (exit 8) | secret vault dengan nama VPN itu sudah ada | pilih nama VPN lain, atau pindahkan secret-nya dulu |

`komando vpn down` pada VPN SOCKS memberi tahu tunnel mana yang dihentikan.
