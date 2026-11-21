# Glosarium

Kata-kata yang dipakai di dokumentasi ini, dalam bahasa sehari-hari.

| Kata | Arti |
|------|------|
| Agen AI (AI agent) | AI yang menjalankan tool sendiri untuk menyelesaikan tugas, seperti Claude Code, Codex, Cursor, atau Gemini CLI. |
| Jendela persetujuan (approval window) | Jendela yang dibuka komando di layar saat agen AI meminta menjalankan sesuatu yang butuh jawaban ya dari Anda. Perintah itu berjalan hanya setelah Anda klik **Allow once**. Lihat [Keamanan](safety.md). |
| Audit log | Riwayat komando tentang setiap tindakan: siapa, apa, di mana, dan hasilnya. Lihat dengan `komando audit`. |
| Bastion / jump host | Server gerbang yang dilewati untuk menjangkau server privat. Di komando, ditulis sebagai `--via bastion`. |
| Bucket | Wadah mirip folder untuk file di object storage (S3, MinIO, R2). |
| Cache | Penyimpanan cepat dan sementara yang dipakai aplikasi untuk mempercepat kerja, seperti Redis atau Valkey. |
| CLI / terminal | Command-line interface: jendela tempat mengetik perintah, bukan mengklik. |
| Cluster | Sekelompok mesin yang menjalankan container bersama, dikelola oleh Kubernetes atau Docker Swarm. |
| Conn | Kata komando untuk semua yang disambungkan selain server: database, cache, queue, bucket storage, cluster, atau registry. Tambahkan dengan `komando conn add`. |
| Container | Aplikasi yang dikemas bersama semua yang dibutuhkannya, sehingga berjalan sama di mana saja (Docker). |
| Container image | Aplikasi terkemas yang menjadi asal sebuah container, misalnya `nginx:1.27`. |
| Container registry | Server yang menyimpan container image: Docker Hub, GHCR, Harbor, ECR. |
| Database | Tempat aplikasi menyimpan datanya dalam tabel: PostgreSQL, MySQL, SQLite. |
| Dry run | Menjalankan perintah dengan `--dry-run`: perintah menampilkan apa yang akan terjadi, tanpa mengubah apa pun. |
| Exit code | Angka hasil sebuah program: 0 berarti berhasil, selain itu berarti ada masalah. Lihat [Hasil dan kesalahan](output.md). |
| Fingerprint / host key | Kartu identitas server. Jika berubah, komando tidak menyambung (`HOSTKEY_MISMATCH`). |
| Flag | Opsi yang ditambahkan ke perintah, seperti `--yes` atau `--dry-run`. |
| Grup (group) | Kumpulan server dan conn bernama, dipakai sebagai target dengan `@name` (misalnya `@web`). |
| Host | Kata perintah untuk server: `komando host add`, `komando host edit`. Hasil perintah menyebut setiap target di field bernama `host`. |
| Job | Tugas panjang yang dibiarkan berjalan di server, dimulai dengan `komando job start`. |
| JSON | Teks terstruktur yang mudah dibaca program. komando menjawab agen dan script dalam JSON. |
| Message queue | Layanan yang meneruskan pesan dari satu aplikasi ke aplikasi lain: Kafka, RabbitMQ, NATS, Amazon SQS, Google Cloud Pub/Sub. Lihat [Queue](queues.md). |
| Namespace | Bagian bernama di dalam cluster Kubernetes, untuk memisahkan aplikasi. |
| Object storage | Layanan yang menyimpan file sebagai objek di dalam bucket, dijangkau lewat internet: S3, MinIO, R2. |
| Pod | Unit terkecil yang dijalankan Kubernetes: satu container atau lebih bersama-sama. |
| Protected (dilindungi) | Server, conn, atau VPN yang ditandai dengan `--protected`, untuk production. Sebelum ada perubahan di sana, komando bertanya kepada Anda; agen AI atau script butuh `--yes`, yang disetujui oleh seseorang. Lihat [Keamanan](safety.md). |
| Recipe | Perintah siap pakai atau tersimpan, dijalankan dengan `komando recipe run NAME TARGET`. |
| Secret | Kata sandi, token, atau key yang disimpan di vault terenkripsi milik komando, dirujuk sebagai `secret:NAME`. |
| Selector / target | Apa yang dikerjakan sebuah perintah: nama, grup (`@web`), tag (`tag:prod`), glob (`web-*`), atau `all`. Lihat [Target](targets.md). |
| Server | Komputer (sering di cloud) yang menjalankan aplikasi. |
| Service | Program latar belakang, seperti nginx, yang dikelola oleh systemd (atau Windows). Dikelola dengan `komando svc`. |
| SSH | Cara aman untuk login dan mengendalikan server Linux dari jauh. |
| SSH key | Sepasang file yang membuktikan siapa Anda; lebih aman daripada kata sandi. |
| sudo | Menjalankan perintah sebagai administrator (root). |
| Tag / label | Satu kata (`prod`) atau pasangan `key=value` (`env=prod`) yang ditempelkan ke server dan conn, supaya bisa dipilih sebagai target. |
| Tunnel | Membuat layanan jarak jauh, seperti database, tampil di komputer sendiri. |
| Vault | Penyimpanan terenkripsi milik komando untuk kata sandi dan secret lainnya. |
| VPN | Tautan jaringan privat ke jaringan perusahaan atau cloud. komando bisa menyambungkan beberapa sekaligus, dengan sendirinya, saat sebuah target membutuhkannya. |
| Daftar Anda (your list) | Semua yang ditambahkan ke komando: server, conn, dan VPN. Lihat dengan `komando list`. |
