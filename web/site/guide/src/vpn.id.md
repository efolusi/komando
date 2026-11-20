VPN adalah jaringan privat yang Anda masuki untuk menjangkau server yang tidak ada di internet. Biasanya Anda tidak perlu melakukan apa pun: saat sebuah target butuh VPN, komando menyalakannya sendiri.

## Menambah VPN

1. Klik **Add** (⌘N), lalu **VPN**.
2. Pilih **Kind**: **WireGuard**, **OpenVPN**, atau **Tailscale**, atau jenis lain yang dikenal komando.
3. Beri **Name**, lalu isi yang dibutuhkan jenis itu:
   - **WireGuard**: klik **Choose…** dan pilih file `.conf`-nya.
   - **OpenVPN**: klik **Choose…** dan pilih file `.ovpn`-nya, lalu user dan kata sandi jika diminta.
   - **Tailscale**: tempel **Auth key** (`tskey-auth-…`) dari admin console Tailscale.
4. Opsional: **Check address**, yaitu `host:port` yang hanya menjawab lewat VPN, supaya komando tahu VPN sudah menyala.
5. Klik **Save VPN**.

komando menyimpan file itu terenkripsi di keychain-nya, jadi Anda boleh menghapus salinan Anda setelahnya. Kata sandi yang diminta VPN bisa disimpan dengan **Save in keychain**, atau diketik setiap kali dengan **Ask each time**.

Untuk menjangkau server lewat VPN, nyalakan **Reach through a server or VPN** pada server itu dan pilih VPN-nya.

{shot:vpn/new-vpn|Form VPN untuk WireGuard: Name, file .conf, dan Check address.}

## Menyalakan atau mematikannya secara manual

1. Buka **Connections** dan klik chip **VPNs**.
2. VPN yang mati bertuliskan "Down" dengan **Connect**. Klik tombol itu.
3. VPN yang meminta login, misalnya kode sekali pakai, membuka tab tersendiri tempat komando memintanya. Yang Anda ketik tidak ditampilkan. Setelah menyala, tutup tab itu.

VPN yang menyala bertuliskan "Up since 2 hours ago" dengan titik hijau, dan muncul di Home di bawah Running now serta di menu bar. **Disconnect** ada di ⋯ barisnya, di tab-nya, dan di menu bar.

## Saat VPN putus

Saat VPN putus ketika jendela tidak di depan, notifikasi menulis "VPN disconnected". komando menyalakannya lagi saat ada target yang membutuhkannya.

## Mengubah VPN

Klik **Edit…** di ⋯ barisnya. WireGuard dan OpenVPN tetap memakai file-nya: untuk memakai file lain, hapus VPN itu lalu tambahkan lagi.

## Di command line

`komando vpn up office` dan `komando vpn down office` melakukan hal yang sama.
