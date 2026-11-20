Apa pun yang bukan server adalah koneksi: database, cache, storage bucket, cluster, container registry, atau message queue. VPN ditambahkan dengan cara yang sama; lihat [VPN](guide:vpn).

## Tambah koneksi

1. Klik **Add** (⌘N). Di halaman Connections, tombolnya ada di header. Di Home yang masih kosong, klik **Add something else**.
2. "What do you want to add?" menampilkan delapan kartu: **Server**, **Database**, **Cache**, **Storage**, **Cluster**, **Registry**, **Queue**, dan **VPN**. Klik salah satu selain Server.
3. Formulir terbuka dengan keluarga itu terpilih, misalnya "Add PostgreSQL". Menu **Kind** menampilkan jenis dari keluarga itu lebih dulu, jadi salah pilih cukup diperbaiki lewat satu menu.
4. **Connection name**: nama pendek tanpa spasi, misalnya `staging-db`.
5. Di **Connection String**, tempel alamatnya, misalnya `postgres://app@db.internal:5432/app`, tanpa kata sandi. Atau beralih ke **Individual Fields** lalu isi host, port, user, dan database satu per satu.
6. **Password**: punya kolom sendiri dan disimpan terenkripsi sebagai `secret:staging-db-pass`. Kata sandi itu tidak pernah menimpa secret yang sudah ada: jika nama itu sudah dipakai, Komando memilih nama berikutnya yang kosong (`secret:staging-db-pass-2`). Jenis tanpa kata sandi, seperti SQLite atau Memcached, tidak menampilkan kolom ini. S3 dan SQS meminta **Secret access key**.
7. Opsional: **Groups**, **Reach through a server or VPN** (untuk database yang hanya bisa dijangkau lewat server), dan **Protected** (untuk production).
8. Klik **Save Connection** (⌘↩).

Komando menampilkan "staging-db is in the inventory.", lalu "Testing the connection…", lalu "Connected". Klik **Open staging-db** untuk membukanya sebagai tab, atau **Close**.

**Save Connection** tetap redup sampai nama tidak berisi spasi dan alamat berisi `://`.

{shot:add-a-connection/new-connection|Formulir New Connection untuk PostgreSQL: Kind, Connection name, Connection String, dan Password.}

### Jenis dengan formulir sendiri

Beberapa jenis tidak punya formulir siap pakai. Komando lalu membuat formulir dari apa yang menurut komando dibutuhkan jenis itu: kolom wajib lebih dulu, lalu **More options**, dalam keadaan terlipat. Jenis yang login-nya membuka browser Anda menyebutkannya sebelum Anda menyimpan.

### Jika uji gagal

Koneksi tetap disimpan, dan banner merah menampilkan pesan komando dan petunjuk.

- Kata sandi salah: buka **Keychain**, klik kanan `secret:staging-db-pass`, pilih **Replace Value…** lalu simpan yang benar. Mengubahnya di dalam **Edit…** akan segera hadir. {coming:edit-login}
- Host, port, user, atau database salah: klik kanan koneksi di **Connections**, pilih **Edit…**, lalu perbaiki di sana.

Lalu buka koneksi itu dan klik **Test** (⇧⌘T).

## Impor koneksi yang sudah Anda punya

Klik **Add** (⌘N) lalu, di bawah "Or import what you already have", pilih sumbernya: **.pgpass…** (database PostgreSQL dan kata sandinya), **my.cnf…** (MySQL dan MariaDB), **.env…** (alamat database, cache, dan storage dari file .env; klik **Choose a .env File…** dulu), **kubeconfig…** (satu koneksi per context cluster), **Docker…** (registry tempat Anda sudah login), **DBeaver…**, **AWS…** (satu koneksi S3 untuk setiap bucket), **rclone…**, atau **FileZilla…**.

komando menampilkan dulu apa yang akan ditambahkannya dan tidak menambahkan apa pun sampai Anda klik **Import**. Database dari DBeaver masuk tanpa kata sandi: tambahkan di [Keychain](guide:keychain#a-missing-password).

## Lihat storage, cluster, registry, atau queue

Di **Connections**, klik chip keluarganya (Storage, Clusters, Registries, atau Queues), lalu barisnya. Koneksi terbuka sebagai tab dengan jenis dan alamatnya di header, serta **Quick checks** yang hanya membaca dan tidak mengubah apa pun. Klik salah satu, dan jawabannya muncul di tempat.

- **Storage**: **Files** menampilkan isi bucket.
- **Cluster** (Kubernetes atau Docker Swarm): **Status**, **Pods**, **Deployments**, dan **Events**. Klik nama pod atau deployment untuk membukanya di tab sendiri dengan status, kondisi, label, dan event terbarunya. Tab **Logs** milik pod menampilkan baris log-nya.
- **Registry**: **Repositories**.
- **Queue** (Kafka, RabbitMQ, NATS JetStream, Amazon SQS, Google Pub/Sub): tampilkan topic atau queue, pilih satu, lalu klik **Peek** untuk membaca pesan terbaru tanpa menghapusnya. Di RabbitMQ, SQS, dan Pub/Sub, melihat bisa terhitung sebagai pengiriman; kalimat di samping Peek menjelaskan caranya.

Upload ke bucket, restart deployment, atau mengirim pesan belum punya tombol. {coming:connection-changes} Pakai ⌘K, lalu **Run a Command…**, misalnya `storage list assets`.

Database dan cache punya tab sendiri: lihat [Database](guide:databases) dan [Cache](guide:caches).

## Di command line

`komando conn add NAME URL` menambahkan koneksi, dan `komando test NAME` memeriksanya.
