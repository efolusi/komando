Port forwarding membuat sesuatu di server bisa dijangkau dari Mac ini. Misalnya, database yang hanya mendengarkan di dalam jaringan Anda muncul di `localhost:15432`, jadi alat database Anda sendiri bisa terhubung ke sana. komando menjaga forward tetap terbuka di latar belakang sampai Anda menghentikannya.

## Memulai forward

1. Buka **Port Forwarding** di sidebar. Jika belum ada yang terbuka, halaman menulis "No forwards open".
2. Klik **New Forward** di header.
3. Di **Through**, pilih server, database, atau cache.
4. Untuk database atau cache, hanya **Local port** yang ditanyakan. Biarkan kosong dan komando memilih port yang bebas.
5. Untuk server, pilih salah satu dari tiga tab dan ketik **Rule**-nya:
   - **Local**: port di Mac ini menjangkau port di server atau di belakangnya, ditulis `LOCAL_PORT:HOST:PORT` seperti yang dilihat server, misalnya `8080:localhost:80`.
   - **Remote**: port di server menjangkau port di Mac ini, ditulis `SERVER_PORT:HOST:PORT` seperti yang dilihat Mac ini.
   - **SOCKS Proxy**: port lokal, misalnya `1080`, untuk proxy yang lalu lintasnya keluar lewat server.
6. Sebuah baris menjelaskan apa yang akan dilakukan **Start**, misalnya "Opens a port on this Mac (localhost:9090), connected to port 9090 on web-1." Klik **Start**.

Sheet menulis "Forward started". Forward itu kini menjadi baris di halaman, muncul di Home di bawah Running now, dan ikon menu bar terisi.

{shot:port-forwarding/new-forward|Sheet New Forward: Through prod-db, Local port kosong, dan Start.}

## Memakainya

Klik ⋯ pada baris, atau klik kanan barisnya, lalu pilih:

- **Copy Address**: menyalin satu baris bersih, dan halaman menulis "Copied localhost:15432". Tempelkan ke alat database Anda.
- **Open in Browser**: untuk forward ke halaman web, membukanya di browser Anda.
- **Restart**: menghentikan forward lalu memulainya lagi dengan rule yang sama.
- **Save as Forward…**: menyimpan rule forward ini sebagai forward tersimpan (lihat di bawah). Save tidak memulai apa pun; forward yang terbuka tetap berjalan.

## Menyimpan forward yang sering dipakai

Centang "Keep it as a saved forward, with a switch on this page" di sheet New Forward, atau pilih **Save as Forward…** pada forward yang terbuka. Forward tersimpan ada di Mac ini, di bawah **Saved forwards**: nyalakan untuk memulainya, matikan untuk menghentikannya.

⋯ dan menu klik kanan forward tersimpan berisi:

- **Start** atau **Stop**, dan **Copy Address**.
- **Edit…**: mengubah rule yang tersimpan. Save tidak memulai apa pun. Jika forward-nya terbuka, ia memakai rule lama sampai Anda me-restart-nya.
- **Remove Saved Forward…**: bertanya dulu, dan menyebut forward itu dengan alamatnya. Hanya rule tersimpan yang hilang; forward yang terbuka tetap berjalan.

## Menghentikan forward

Klik ⋯ pada baris dan pilih **Stop…**. Ia bertanya dulu ("Stop the forward to prod-db?"), karena port lokal tertutup untuk setiap aplikasi yang memakainya. Menu bar juga punya ini: klik forward-nya, lalu **Stop Forward**.

## Jika ada masalah

- **Start** gagal: banner merah menjelaskan sebabnya dengan kata-kata ("The forward did not start."), beserta pesan komando.
- "komando did not run": buka kunci Komando, atau periksa komando di **Settings**, lalu coba lagi.
- Forward yang mati menampilkan **Stopped** berwarna merah. Saat jendela tidak di depan, notifikasi menulis "Forward stopped". Selama Mac atau Komando Anda terkunci, notifikasi tidak menyebut nama forward-nya. Matikan notifikasi ini di **Settings** lewat "Notify me when a forward or VPN stops".

## Di command line

`komando tunnel start prod-db` membuka forward yang sama. Di command line, kata yang dipakai tetap `tunnel`.
