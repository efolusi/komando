# Kode error

Setiap kode error yang diberikan komando, dengan exit code-nya, contoh pesan, dan langkah berikutnya yang lazim. `hint` milik error itu sendiri menyebut apa yang dilakukan dalam kasus Anda. Halaman ini dibuat dari kode (`komando schema` mencantumkan hal yang sama di `error_codes`). [Hasil dan error](output.md) menjelaskan yang paling umum. Contoh pesan adalah kata-kata komando sendiri, jadi tetap dalam bahasa Inggris.

| Kode | Exit | Contoh pesan | Langkah berikutnya yang lazim |
|------|------|--------------|-------------------------------|
| `AMBIGUOUS_MATCH` | 8 | --old matches … times in … | tambahkan konteks di sekitar --old agar unik (baca file dengan `komando fs cat SERVER PATH`), atau berikan --all |
| `AUDIT_TAMPERED` | 1 | the audit log chain is broken at line … | simpan salinan file dan cari tahu siapa yang mengubahnya; komando terus menambahkan record setelahnya |
| `AUDIT_UNAVAILABLE` | 1 | the store, which keeps the audit log, cannot be written: …; nothing was run | perbaiki izin file atau folder (`komando doctor` memeriksanya) |
| `AUTH_FAILED` | 4 | … asks … (two-factor login); only a person can answer it, and none is at a terminal here | jalankan `komando login SERVER` di terminal: komando menanyakan kodenya sekali dan menyimpan login, sehingga perintah berikutnya (termasuk milik agen AI) tidak butuh kode; agen AI meminta pengguna menjalankannya |
| `AWS_FAILED` | 4 | AWS profile …: … | periksa profil di ~/.aws/config |
| `AWS_LOGIN_REQUIRED` | 4 | AWS profile …: … | seseorang menjalankan `komando login aws --profile …` sekali, lalu jalankan lagi |
| `AWS_PROFILE_NOT_FOUND` | 3 | there is no AWS profile … | tambahkan profil ke ~/.aws/config (atau perbaiki --option aws_profile) |
| `AZURE_FAILED` | 4 | …: … | periksa bahwa komputer ini menjangkau login.microsoftonline.com |
| `AZURE_LOGIN_REQUIRED` | 4 | …: … | atur AZURE_TENANT_ID, AZURE_CLIENT_ID, dan AZURE_CLIENT_SECRET untuk service principal, jalankan komando di Azure dengan managed identity, atau seseorang menjalankan `az login` |
| `BACKUP_FAILED` | 5 | could not make a backup of …: …; the file was not changed | periksa ruang kosong dengan `komando exec TARGET --read-only -- df -h`, atau jalankan tanpa --backup |
| `BACKUP_NOT_FOUND` | 3 | no backup of … found (looked for ….bak) | komando menyimpan backup hanya bila Anda mengedit dengan --backup; berikan salinan lain dengan --copy PATH |
| `BAD_CA` | 2 | registry CA …: … | simpan sertifikat CA registry (PEM) dengan `komando secret set NAMA < ca.crt` |
| `BAD_FILE` | 2 | cannot read backup: … | file bukan SQL teks yang bisa dibaca |
| `BAD_RELEASE` | 1 | … is … bytes, more than komando accepts; nothing was changed | laporkan di …/issues |
| `BAD_SECRET` | 2 | the password for … contains a line break | simpan kata sandi lagi tanpa pindah baris (`komando secret set NAMA`) |
| `BINARY_FILE` | 1 | … is a binary file; fs cat shows text only | simpan dengan `komando download … …` |
| `BUCKET_NOT_FOUND` | 3 | bucket does not exist | periksa nama bucket di URL conn (`komando conn show NAMA`) |
| `BUILTIN_RULE` | 2 | … is a built-in rule and cannot be removed | aturan bawaan selalu berlaku (lihat dengan `komando policy list`); untuk satu perintah yang memang dimaksudkan, konfirmasikan dengan pengguna dan berikan --allow-dangerous |
| `CACHE_AUTH` | 4 | memcached refused the login: … | periksa user di URL dan rujukan kata sandi (`komando conn show NAMA`) |
| `CACHE_CONNECT` | 4 | cannot connect to …: … | sertifikat server tidak bisa diperiksa terhadap CA komputer ini: berikan CA yang menandatanganinya dengan ?ca=secret:NAMA (`komando secret set NAMA < ca.pem`), atau jangkau server --via server SSH dengan skema polos (redis://, memcached://) (`komando conn edit NAMA --via HOST --url ...`) |
| `CACHE_ERROR` | 5 | this memcached cannot list keys: … | jalankan memcached dengan LRU crawler menyala (default sejak 1.5); `cache get` berfungsi tanpanya |
| `CACHE_KEY_NOT_FOUND` | 3 | no cache key named … | daftarkan key dengan `komando cache keys CONN 'pola*'` |
| `CACHE_SECTION_NOT_FOUND` | 3 | INFO … returned nothing | server ini tidak punya bagian seperti itu; coba `komando cache info CONN --all` |
| `CANCELLED` | 1 | interrupted | berhenti sebelum selesai (Ctrl-C atau sinyal); periksa apa yang tertinggal, lalu jalankan lagi |
| `CERT_PROBLEMS` | 1 | … of … targets need attention: … | perbarui atau ganti sertifikat yang ditandai expiring, expired, atau not_trusted; lihat setiap hasil |
| `CHECKSUM_MISMATCH` | 1 | … does not match checksums.txt of its release; nothing was changed | jalankan lagi, dan laporkan di …/issues bila terjadi lagi |
| `CHMOD_FAILED` | 5 | cannot set mode … on …: …; the file was not changed | server SFTP ini tidak mengizinkan pengaturan mode file, dan file barunya lebih terbuka daripada yang diminta; bila server punya shell dan sudo, coba lagi dengan --sudo |
| `CODE_WRONG` | 2 | that code does not match; nothing was changed | periksa jam ponsel dan jalankan lagi |
| `COMMAND_FAILED` | 5 | exit code … | baca output error (stderr) untuk alasannya |
| `COMMAND_NOT_FOUND` | 3 | no command … | jalankan `komando schema --compact` untuk melihat setiap perintah |
| `CONFIRM_REQUIRED` | 6 | deleting group … takes … entries out of it | periksa dengan --dry-run, tanyakan kepada pengguna; setelah mereka setuju, jalankan lagi dengan --yes (komando lalu bertanya kepada mereka di jendela di layar mereka) |
| `CONNECTION_LOST` | 4 | the connection to … broke while reading the job's status | jalankan lagi; job tetap berjalan di server |
| `CONNECTION_REFUSED` | 4 | the server refused the connection: nothing listens on that port | periksa bahwa sshd berjalan di server dan mendengarkan di port ini: `komando host show …` |
| `CONNECT_TIMEOUT` | 7 | connecting to … timed out | firewall memutus koneksi, atau server bersifat privat: periksa alamat dengan `komando host show …`, jangkau lewat bastion atau VPN (`komando host edit … --via NAMA`), atau naikkan --connect-timeout di koneksi lambat |
| `CONN_EXISTS` | 8 | … … already exists | pakai `komando … edit` atau berikan --overwrite untuk menggantikannya |
| `CONN_UNREACHABLE` | 4 | cannot reach …: … | periksa nama dan port; bila situs hanya bisa dijangkau dari server atau VPN, jalankan lagi dengan --via: `komando cert check … --via NAMA` |
| `CONSUMER_GROUP_NOT_FOUND` | 3 | no consumer group named … | daftarkan consumer group dengan `komando queue groups CONN` |
| `CONSUMER_NOT_FOUND` | 3 | no consumer named … | daftarkan consumer dengan `komando queue groups CONN`; sebut satu sebagai STREAM/CONSUMER |
| `CRONTAB_UNREADABLE` | 5 | cannot read the crontab (exit …) | periksa nama user; membaca crontab user lain butuh sudo |
| `DB_AUTH` | 4 | bigquery: the stored key is not a service account key: … | --password-ref pada conn bigquery berisi key service account (file JSON dari konsol), atau hilangkan untuk memakai login gcloud |
| `DB_BYTES_LIMIT` | 6 | the query would read …, more than --max-bytes …, so it did not run | BigQuery menagih menurut byte yang dibaca sebuah query: pilih lebih sedikit kolom, filter pada kolom partisi atau cluster, atau, bila biaya itu memang dimaksudkan (tanyakan kepada pengguna), naikkan --max-bytes |
| `DB_CONNECT` | 4 | cannot open …: … | periksa path file di URL conn (`komando conn show NAMA`) |
| `DB_ERROR` | 5 | … (SQLSTATE …) | perbaiki SQL-nya; `komando db schema CONN TABEL` menampilkan kolom dan tipenya |
| `DB_NOT_FOUND` | 3 | … failed on … (exit …): … | periksa nama database di ujung URL conn (`komando conn show …`) |
| `DB_PRIVILEGE` | 5 | … (error …) | user milik conn tidak punya hak ini; minta admin memberikannya, atau pakai conn dengan user admin |
| `DB_USER_EXISTS` | 8 | user … already exists | ganti kata sandinya dengan `komando db user passwd CONN … --password-ref secret:NAMA` |
| `DB_USER_IN_USE` | 8 | the database user owns objects or has sessions, so it is not removed | akhiri sesinya dulu: cari dengan `komando db activity CONN --all`, lalu `komando db kill CONN PID --session` |
| `DB_USER_NOT_FOUND` | 3 | no database user named … | daftarkan user dengan `komando db user list CONN` |
| `DECLINED` | 6 | not run: the person said no; nothing was changed | jalankan lagi untuk ditanya lagi |
| `DELETE_FAILED` | 1 | cannot delete …: … | periksa izin file |
| `DELIVERY_LIMIT_NEAR` | 8 | subscription … moves a message to its dead-letter topic after … deliveries, and peek would count as one | jangan peek subscription ini: setiap pengiriman dihitung, dan pesan yang terkirim terlalu sering masuk ke dead-letter topic. Peek subscription dari dead-letter topic, atau naikkan maxDeliveryAttempts |
| `DEPLOY_FAILED` | 5 | key deploy could not add the key to the server's authorized_keys (the server's words follow) | periksa bahwa ~/.ssh bisa ditulis di sana: `komando fs stat SERVER ~/.ssh` |
| `DIG_MISSING` | 3 | … records need dig, which is not installed on this server, and komando could not ask the server's resolver itself (no nameserver in /etc/resolv.conf, or the se… | instal dig (Debian/Ubuntu: dnsutils, Alpine: bind-tools, RHEL: bind-utils), misalnya `komando pkg install TARGET dnsutils`; A dan AAAA berfungsi tanpanya |
| `DNS_ERROR` | 4 | the server's name does not resolve on this computer | nama tidak ter-resolve di sini: periksa dengan `komando host show …` dan perbaiki dengan `komando host edit … --address ALAMAT`; nama yang hanya di-resolve VPN butuh --via VPN itu |
| `DOCKER_ERROR` | 5 | docker on the server answered with an error | periksa bahwa Docker berjalan di sana: `komando exec TARGET --read-only -- docker info` |
| `DOCKER_MISSING` | 3 | docker not found | instal Docker di server, atau pilih server lain |
| `DOCKER_OBJECT_NOT_FOUND` | 3 |  | daftarkan apa yang ada dengan `komando docker ps TARGET --all` atau `komando cluster list TARGET services` |
| `DOCKER_PERMISSION` | 5 | the login user may not use docker on the server (add --sudo, or the docker group) | tambahkan --sudo, atau tambahkan user yang dipakai login ke grup docker |
| `DOCTOR_FAILED` | 1 | some checks failed | perbaiki pemeriksaan yang ditandai ✗ (ok: false di -o json), lalu jalankan `komando doctor` lagi |
| `DRY_RUN_UNSUPPORTED` | 2 | this change cannot be previewed; run it without --dry-run to make it | jalankan lagi tanpa --dry-run untuk membuat perubahannya |
| `DUMP_FAILED` | 5 | the backup stopped before the end; no partial file is left | periksa conn dengan `komando test …`; dengan --run-on HOST, pg_dump atau mysqldump di server itu yang dijalankan |
| `DUMP_UNSUPPORTED` | 2 | komando's own dump cannot write an object (the message names it) | jalankan pg_dump di server yang punya dan bisa menjangkau database (--run-on HOST), atau dump tabel lain dengan --table |
| `EMPTY_FOLDER_CONFIRM_REQUIRED` | 6 | … lists no files in …, so --delete would remove … there in …; nothing was deleted | lihat apa yang akan hilang dengan `komando sync SRC DST --delete --dry-run`, tanyakan kepada pengguna; setelah mereka setuju, jalankan lagi dengan --allow-dangerous (komando lalu bertanya kepada mereka di jendela di layar mereka) |
| `ERROR` | 1 | an error with no more specific code (read the message) | baca pesannya; `komando doctor` memeriksa pengaturan komputer ini |
| `FILE_CHANGED` | 8 | … …; nothing was added | jalankan perintah yang sama lagi (`komando cp SRC DST --continue`): komando membaca panjang file lagi |
| `FILE_ERROR` | 1 | a file on this computer cannot be read or written | periksa bahwa foldernya ada dan bisa ditulis |
| `FILE_EXISTS` | 8 | … already exists on this computer | pilih --to lain, hapus filenya, atau berikan --overwrite |
| `FILE_NOT_FOUND` | 3 | identity file …: … | berikan path file private key, atau daftarkan dengan `komando key add NAMA FILE` dan pakai --key |
| `FILE_TOO_LARGE` | 8 | …:… is more than …; komando holds a copy from a pod in memory, and stopped | salin bagian yang lebih kecil, atau kemas lebih kecil di dalam pod dulu: `komando cluster run TARGET --write -- exec POD -- gzip PATH` |
| `FOLDER_NOT_FOUND` | 3 | no folder named … | tambahkan -p/--parents untuk membuatnya |
| `GCP_LOGIN_REQUIRED` | 4 | …: … | seseorang menjalankan `gcloud auth application-default login` lagi, atau atur GOOGLE_APPLICATION_CREDENTIALS ke file key service account; di Google Cloud, service account milik mesin yang dipakai |
| `GROUP_EXISTS` | 8 | group … exists | pilih nama lain; untuk menggabungkannya, jalankan `komando group add … @…` lalu `komando group rm …` |
| `GROUP_NOT_FOUND` | 3 | no group named … | jalankan `komando group list` untuk melihat grup |
| `HELM_RELEASE_NOT_FOUND` | 3 | no Helm release named … in namespace … | lihat release dengan `komando cluster helm list TARGET -A`, dan sebut namespace dengan --namespace |
| `HELM_REVISION_NOT_FOUND` | 3 | … has no revision … | lihat revisi dengan `komando cluster helm history TARGET RELEASE` |
| `HIDDEN_VALUE` | 2 | stdin holds a value komando hid ([hidden] or [secret:NAME]); uploading it would destroy the real value | edit file di server dengan `komando fs replace` (--old yang berisi [hidden] cocok dengan nilai yang disembunyikan), dan masukkan secret dengan {{secret:NAMA}} |
| `HOSTKEY_MISMATCH` | 4 | host key for … changed: the server was rebuilt, or someone is intercepting the connection | kemungkinan man-in-the-middle: laporkan ini kepada pengguna dan jangan percayai ulang key itu sendiri; setelah mereka memeriksa fingerprint baru dengan cara lain, mereka bisa menjalankan `komando host trust … --reset` |
| `HOSTKEY_REVOKED` | 4 | … shows the revoked host key …; nothing was sent | key ini ada di daftar host key yang dicabut milik komando: anggap server sudah disusupi, beri tahu pemiliknya, dan jangan percayai ulang dengan `komando host trust` |
| `HOSTKEY_UNKNOWN` | 4 | host key for … is not trusted yet (host keys are strict) | bandingkan fingerprint dengan yang dilihat pemilik server, lalu jalankan `komando host trust …` (agen AI bertanya kepada pengguna: pin-nya butuh jawaban ya dari mereka) |
| `HOSTKEY_UNREADABLE` | 4 | the pinned host key for … cannot be read | seseorang memeriksa key server dan menjalankan `komando host trust` untuknya di terminalnya sendiri |
| `HOST_EXISTS` | 8 | … … already exists | pakai `komando … edit` atau berikan --overwrite untuk menggantikannya |
| `HOST_IN_USE` | 8 | server … is on the --via path of … | ubah mereka dulu: … (atau --via LAIN), atau hapus mereka dalam perintah yang sama |
| `IMAGE_TAG_NOT_FOUND` | 3 | … not found; the repository has no tags | daftarkan repository dengan `komando registry list CONN` |
| `IMPORT_INCOMPLETE` | 1 | … not imported (see skipped) | perbaiki di sumbernya dan impor lagi: sisanya sudah masuk, dan mengimpor lagi melewatinya |
| `INSECURE_PROTOCOL` | 2 | …:// crosses the network to … without TLS, so the password and the data travel unencrypted | pakai bentuk TLS dari URL bila server punya TLS (rediss://, memcacheds://, amqps://, nats tls://, kafka tls=true, endpoint https://, ftps://, webdavs://), atau jangkau --via server SSH (`--via HOST`); kalau tidak, tambahkan ?insecure=1 untuk menerima bahwa login dan data berjalan tanpa enkripsi |
| `IS_A_DIRECTORY` | 2 | …:… is a folder, not a file | salin folder dan seluruh isinya dengan -r: `komando cp -r … …` |
| `IS_A_SYMLINK` | 8 | … is a symbolic link (--no-follow) | hilangkan --no-follow untuk menulis file yang ditunjuknya |
| `JOB_FAILED` | 5 | job exited with … | baca outputnya dengan `komando job logs … --limit 50` |
| `JOB_KILLED` | 5 | job … was killed (…) | job dihentikan dengan `komando job kill` |
| `JOB_LOST` | 5 | job … lost | job berhenti tanpa exit code (dihentikan paksa, atau server restart): `komando job logs … --limit 50` menunjukkan sejauh mana; mulai lagi dengan `komando job start … -- …` bila perlu |
| `JOB_NOT_FOUND` | 3 | no job named … | lihat dengan `komando job list` |
| `JOB_RUNNING` | 8 | job … is still running | hentikan dulu dengan `komando job kill …`, atau berikan --kill untuk menghentikan dan menghapusnya |
| `JOB_START_FAILED` | 5 | could not start job: … | periksa bahwa /bin/sh dan nohup berfungsi di sana: `komando test TARGET` |
| `JOURNAL_PERMISSION` | 5 | this user may not read the system journal | tambahkan --sudo, atau tambahkan user yang dipakai login ke grup systemd-journal |
| `K8S_CONFLICT` | 8 | the object changed or exists already (the cluster's words follow) | objek berubah sementara itu atau sudah ada: lihat dengan `komando cluster get TARGET TIPE/NAMA`, lalu jalankan lagi |
| `K8S_CONTAINER_NOT_FOUND` | 3 | no container named … | container-nya: … |
| `K8S_ERROR` | 5 | the Kubernetes API answered with an error (its words follow) | baca kata-kata cluster; `komando cluster events TARGET --warnings` menunjukkan apa yang salah belakangan ini |
| `K8S_FORBIDDEN` | 4 | listing Helm releases: … | Helm menyimpan release sebagai Secret: user di kubeconfig harus bisa mendaftar secret di sana (atau sebut satu namespace dengan --namespace) |
| `K8S_INVALID` | 2 | the cluster refused the request as written (its words follow) | cluster menolaknya sebagaimana ditulis: periksa label selector (-l) atau YAML objek |
| `K8S_NOT_FOUND` | 3 |  | daftarkan apa yang ada dengan `komando cluster list TARGET pods` (atau deployments, services ...) |
| `K8S_POD_NOT_FOUND` | 3 | … has no running pod | periksa dengan `komando cluster list TARGET pods` |
| `KEYCHAIN_FAILED` | 5 | …; the vault still uses store.key, nothing was lost | seseorang membuka kunci keychain (agen AI bertanya kepada pengguna), lalu jalankan lagi; di Linux butuh secret-tool dan keyring |
| `KEYCHAIN_SLOW` | 1 | nothing was changed: the keychain did not answer in time, so komando could not check that … is the newest copy | jalankan lagi sebentar lagi; bila terus terjadi, jalankan `komando doctor` |
| `KEYCHAIN_TAKEN` | 8 | …; the vault still uses store.key, nothing was lost | kembalikan vault yang Anda pindahkan, atau setelah tidak ada vault yang butuh key itu, seseorang menghapus item keychain (agen AI bertanya kepada pengguna), lalu jalankan lagi |
| `KEYSCAN_FAILED` | 4 | cannot fetch host key from …: … | periksa alamat dan port dengan `komando host show …` |
| `KEY_EXISTS` | 8 | key … already exists | pilih nama lain, atau `komando key rm …` dulu |
| `KEY_FAILED` | 1 | could not read key …: …; nothing was written | periksa key dengan `komando key show …`, atau hilangkan --with-keys |
| `KEY_INVALID` | 2 | cannot parse …: … | berikan file private key OpenSSH atau PEM |
| `KEY_IN_USE` | 8 | server … still uses this key | beri server key lain dulu: `komando host edit … --key LAIN` |
| `KEY_PASSPHRASE_REQUIRED` | 2 | key … is encrypted and … | muat key ke ssh-agent dengan `ssh-add PATH`, atau simpan passphrase-nya dengan `komando secret set NAMA` (hint memberikan perintah lengkapnya) |
| `KEY_UNREADABLE` | 4 | cannot read key …: … | periksa path key (`komando key list` menampilkan key yang dikenal komando) |
| `KILL_FAILED` | 5 | the server did not stop session … | Anda mungkin tidak punya hak untuk menghentikan sesi user lain |
| `KUBECONFIG` | 2 | conn …: … | impor lagi dengan `komando import kubeconfig` |
| `LOGIN_FAILED` | 4 | the login to … ended early (…) | seseorang membaca seluruh log di … |
| `MIXED_OS` | 2 | the target picks Windows servers (…) and other servers (…) | satu perintah ditulis untuk satu shell: jalankan dua kali, sekali dengan TARGET,os:windows (PowerShell) dan sekali dengan TARGET,!os:windows (sh) |
| `MOVE_FAILED` | 5 | the copy on the server (…) ended badly: …; … was kept | jalankan lagi: `komando storage mv CONN … …` |
| `NAME_TAKEN` | 8 | the rename clashes: …; nothing was renamed | pilih nama lain, atau ganti nama atau hapus yang menghalangi dulu |
| `NEEDS_PERSON` | 6 | logging in to … needs a person at a terminal to answer its questions | minta seseorang menjalankan `komando login …` di terminal; setelah itu perintah Anda ke … tidak butuh login |
| `NEEDS_TERMINAL` | 2 | cluster shell needs a person at a terminal | agen dan script memakai `komando cluster exec` |
| `NOTHING_TO_RENAME` | 3 | no … starts with … | periksa LAMA dengan `komando list` dan `komando secret list`; nama dicocokkan dari awal, sebagaimana ditulis |
| `NOT_A_FOLDER` | 8 | … is a file, not a folder | berikan path folder, bukan file |
| `NOT_SUPPORTED` | 2 | … waits for data that keeps coming, so cache run would never return | cache run mengirim satu perintah dan mencetak satu balasannya; hilangkan BLOCK dari XREAD, dan pakai redis-cli untuk MONITOR atau SUBSCRIBE |
| `NOT_SWARM_MANAGER` | 3 | … is not a Swarm manager (docker not found) | perintah Swarm berjalan di manager: `komando exec … --read-only -- docker node ls` menunjukkan apakah server itu manager |
| `NOT_TEXT` | 2 | … is not text | unduh dengan `komando storage download CONN OBJEK` |
| `NOT_WRITABLE` | 8 | cannot replace …: …: …; nothing was changed | buat … bisa ditulis, atau instal komando di folder lain dengan baris instal (KOMANDO_INSTALL_DIR=DIR) |
| `NO_AUTH` | 4 | no authentication method available for …: it has no key or password, and … | jalankan ssh-agent, lalu jalankan … |
| `NO_CERTIFICATE` | 5 | … sent no certificate | periksa bahwa … adalah port TLS situs itu |
| `NO_FOLDER` | 1 | cannot find the folder: … | atur HOME, atau jalankan dari folder proyek |
| `NO_JOURNAL` | 3 | journald has no log files on this server | service mungkin mencatat log ke file: `komando logs TARGET --file /var/log/...` |
| `NO_MATCH` | 8 | --old text not found in … | baca file dengan `komando fs cat TARGET …` dan salin teks persisnya (spasi berpengaruh) |
| `NO_MATCHING_TARGETS` | 3 | nothing to check | berikan server, conn TLS, atau situs web (https://NAMA): `komando cert check URL` |
| `NO_PACKAGE_MANAGER` | 3 | no supported package manager on this server | komando mengenal apt, dnf, yum, apk, zypper, dan pacman |
| `NO_PASSPHRASE` | 2 | the vault has no passphrase to take away | vault sudah menyimpan key-nya di store.key atau keychain OS; hint menyebut yang mana |
| `NO_PUBLIC_KEY` | 2 | komando does not have the public key of … | taruh ….pub di samping key, lalu `komando key rm …` dan tambahkan lagi |
| `NO_RECORDS` | 3 | … has no … records (or does not exist) from this server | periksa nama dan tipe, dan DNS server (/etc/resolv.conf) |
| `NO_RESPONSE` | 4 | no HTTP answer from … | periksa URL, dan bahwa server bisa menjangkaunya: `komando net check … ALAMAT:443` |
| `NO_SYSTEMD` | 3 | systemd is not running on this server | server ini berjalan tanpa systemd (container?); baca log dengan `komando logs TARGET --file PATH` atau `komando docker logs` |
| `NO_TUNNEL_NEEDED` | 2 | … has no --via, so it is reachable without a tunnel | sambungkan ke … secara langsung |
| `NXDOMAIN` | 3 | … does not resolve from this server | periksa nama, dan DNS server (/etc/resolv.conf) |
| `OBJECT_NOT_FOUND` | 3 | … not found | daftarkan file dengan `komando storage list CONN [PREFIX]` |
| `OPEN_BIND` | 6 | the tunnel would listen on … of …, open to its network (the default 127.0.0.1 keeps it to that computer) | periksa dengan --dry-run, tanyakan kepada pengguna; setelah mereka setuju, jalankan lagi dengan --yes (komando lalu bertanya kepada mereka di jendela di layar mereka) |
| `OPTION_LIKE_VAR` | 2 | the value of … may not start with '-' (… would be read as an option) | untuk path yang diawali -, tulis ./… |
| `OUTPUT_TRUNCATED` | 1 | the rows are more than the output size cap (--max-output) allows; nothing was printed | naikkan --max-output (dalam byte, misalnya --max-output 104857600), atau persempit SQL dengan WHERE atau LIMIT; seluruh database disalin dengan `komando db dump` |
| `OVPN_UNSUPPORTED` | 2 | the OpenVPN profile has an option komando's own client does not support (the message names it) | ubah profilnya, atau laporkan opsi yang Anda butuhkan di …/issues |
| `PACKAGE_NOT_FOUND` | 3 | …: no such package in the server's package index | periksa namanya; segarkan indeks dengan `komando pkg update TARGET` bila package-nya baru |
| `PARTIAL_FAILURE` | 1 | some targets failed and some worked (see each result) | baca error dan hint tiap target (data.results di -o json) |
| `PARTIAL_TRANSFER` | 5 | … could not be copied; the other files were copied | perbaiki yang tercantum (izin?) dan jalankan lagi |
| `PARTITION_NOT_FOUND` | 3 | topic … has no partition … (it has …) | partisi diberi nomor mulai dari 0; lihat dengan `komando queue describe CONN …` |
| `PASSPHRASE_MISMATCH` | 2 | the two passphrases you typed differ; nothing was changed | jalankan lagi |
| `PATH_NOT_FOUND` | 3 | … does not exist; nothing was changed | periksa path sumber |
| `PERMISSION_DENIED` | 5 | cannot read … | tambahkan --sudo |
| `PHONE_KEY_INVALID` | 2 | the key does not match the key check the phone shows; nothing was written | periksa bahwa file key berasal dari ponsel, lalu jalankan `komando export --for-phone --to FILE` lagi dan ketik key check yang ditampilkannya |
| `PKG_FAILED` | 5 | pkg … failed (exit …) | baca output error (stderr) untuk pesan dari package manager |
| `POLICY_BLOCKED` | 6 | the command matches destructive rules [rm-rf]: deletes files recursively | periksa dengan --dry-run, tanyakan kepada pengguna; setelah mereka setuju, jalankan lagi dengan --allow-dangerous (komando lalu bertanya kepada mereka di jendela di layar mereka) |
| `PORT_CLOSED` | 5 | cannot connect to … | periksa alamat, firewall, atau service di sisi lain |
| `PORT_IN_USE` | 8 | cannot listen on 127.0.0.1:…: … | pilih port LOKAL lain (`komando tunnel list` menampilkan port yang dipegang komando) |
| `POWERSHELL_FAILED` | 5 | the login check in PowerShell failed on … (exit …): … | komando menjalankan setiap perintah di Windows dalam Windows PowerShell (powershell.exe): periksa bahwa ada di PATH user yang dipakai login, dan baca pesannya |
| `PROTECTED_TARGET` | 6 | a change action on protected conn …: … | periksa dengan --dry-run, tanyakan kepada pengguna; setelah mereka setuju, jalankan lagi dengan --yes (komando lalu bertanya kepada mereka di jendela di layar mereka) |
| `PROXY_FAILED` | 4 | proxy command for …: … | periksa bahwa program di --proxy-command sudah terinstal |
| `PROXY_NOT_FIRST` | 2 | … has a proxy command but is reached through another hop | proxy command hanya bisa memulai sebuah jalur; taruh server itu pertama di --via |
| `QUEUE_AUTH` | 4 | the brokers refused the login: … | periksa user di URL, opsi sasl=, dan rujukan kata sandi (`komando conn show NAMA`) |
| `QUEUE_CONNECT` | 4 | cannot connect to …: … | jalankan `komando test TARGET` untuk memeriksa keterjangkauan, atau jangkau server --via server SSH yang bisa |
| `QUEUE_DENIED` | 5 | the server refused the vhost …: … | periksa vhost di path URL (%2F adalah vhost default "/") dan bahwa user punya izin di sana |
| `QUEUE_ERROR` | 5 | …: could not give back the messages peek pulled: …; nothing is lost | Pub/Sub memberikan lagi pesan itu setelah ack deadline subscription lewat |
| `QUEUE_EXISTS` | 8 | queue … already exists | pilih nama lain, atau lihat dengan `komando queue describe CONN …` |
| `QUEUE_NOT_FOUND` | 3 | no queue named … | daftarkan queue dengan `komando queue list CONN` (butuh ?management=PORT di URL conn); vhost adalah path URL |
| `READ_FAILED` | 5 | cannot read …: … | jalankan lagi; output terpotong (naikkan --max-output?) |
| `READ_ONLY_VIOLATION` | 6 | --read-only, but the command is not known to only read (…) | --read-only hanya menjalankan apa yang diketahui komando hanya membaca: untuk keadaan server pakai komando facts, logs, svc status, atau fs read; kalau tidak, beri tahu pengguna apa yang dilakukan perintah itu, lalu jalankan tanpa --read-only (server yang dilindungi juga butuh --yes) |
| `REBOOT_FAILED` | 5 | the reboot command failed (exit …): … | baca output error (stderr); tanpa hak sudo, reboot ditolak |
| `REBOOT_TIMEOUT` | 7 | … did not come back within … | periksa konsol server; komando tidak mereboot server setelahnya |
| `RECIPE_BUILTIN` | 8 | … is a built-in recipe | pilih nama lain; lihat `komando recipe list` |
| `RECIPE_CHANGED` | 8 | recipe … changed while komando was starting | jalankan lagi |
| `RECIPE_EXISTS` | 8 | recipe … exists | lihat dengan `komando recipe show NAMA`, atau berikan --overwrite untuk menggantikannya |
| `RECIPE_NOT_FOUND` | 3 | no recipe named … | lihat dengan `komando recipe list` |
| `REGISTRY_AUTH` | 4 | the registry refused to list its repositories: … | login mungkin boleh membaca image tetapi tidak boleh mendaftar setiap repository: sebut satu dengan `komando registry list CONN REPO`; kalau tidak, periksa user di URL conn dan --password-ref-nya |
| `REGISTRY_ERROR` | 5 | the registry did not say the image's digest | jalankan lagi; bila terus gagal, registry mungkin tidak mendukung format image ini |
| `REGISTRY_RATE_LIMIT` | 5 | the registry turned the request down: too many requests (Docker Hub's pull limit) | registry membatasi jumlah permintaan yang diterimanya (Docker Hub: pull per 6 jam, lebih sedikit tanpa login); tunggu dan jalankan lagi |
| `REGISTRY_TLS` | 4 | the registry's TLS certificate is for another name: … | pakai nama host yang dituju sertifikat di URL conn; dengan --via, server di jalur yang mencari nama itu (/etc/hosts miliknya berlaku) |
| `REGISTRY_UNSUPPORTED` | 5 | … has no list of every repository | sebut repository-nya: `komando registry list CONN REPO` (di Docker Hub, nginx berarti library/nginx) |
| `RELEASE_SIGNATURE_INVALID` | 2 | komando … is not signed with the komando project's key; nothing was changed | jangan instal dengan cara lain, mungkin ada yang mengganti file rilis: laporkan secara privat di …/security, dan periksa lagi nanti dengan `komando update --dry-run` |
| `RELEASE_SIGNATURE_NOT_FOUND` | 3 | komando … has no signature, so komando cannot tell it comes from the komando project; nothing was changed | rilis sampai … tidak bertanda tangan: untuk tetap kembali ke salah satunya, pakai baris instal dengan KOMANDO_VERSION=… (…#install); untuk tetap di rilis bertanda tangan, jalankan `komando update` |
| `REMOTE_ERROR` | 1 | an error from outside komando with no more specific code (its words follow) | jalankan lagi dengan -o json untuk detailnya; `komando doctor` memeriksa pengaturan komputer ini |
| `REMOTE_WRITE_FAILED` | 5 | cannot write …: …; the file was not changed | periksa bahwa user boleh menulis ke folder dan disk punya ruang kosong: `komando fs stat SERVER PATH` |
| `RENAME_FAILED` | 1 | the vault cannot rename the VPN's secrets: …; nothing was renamed | periksa bahwa vault terbuka (`komando secret list`, KOMANDO_VAULT_PASS) |
| `REPOSITORY_NOT_FOUND` | 3 | no repository named … | daftarkan repository dengan `komando registry list CONN` |
| `RESERVED_SECRET` | 2 | secret … belongs to komando's approval code | seseorang mengelolanya dengan `komando config approval-code` |
| `RESTORE_FAILED` | 5 | the restore stopped at a line: PostgreSQL changed nothing (one transaction), MySQL kept the statements before it | perbaiki file, lalu restore lagi: `komando db restore … --from …` |
| `RESTORE_UNSUPPORTED` | 2 | line … switches to another database: … | file berpindah database (pg_dump --create atau pg_dumpall); dump satu database tanpa --create dan restore ke conn ini |
| `RESUME_CONFLICT` | 8 | … does not match the source after the copy (sha256 …, the source …); it was left as it is | salin seluruh file lagi tanpa --continue (download menggantikan file di sini hanya dengan --overwrite): `komando cp SRC DST` |
| `RESUME_UNSUPPORTED` | 2 | … cannot be continued: this kind of storage (S3, Google Cloud Storage, Azure Blob, WebDAV) stores a file whole and cannot add to one; nothing was changed | jalankan lagi tanpa --continue untuk menyalin seluruh file: `komando cp SRC DST` |
| `REVEAL_NEEDS_PERSON` | 6 | --reveal needs the user's yes | nilai tetap [hidden] di dry run; jalankan tanpa --dry-run untuk bertanya kepada pengguna di jendela di layar mereka |
| `REVEAL_NEEDS_TERMINAL` | 6 | --reveal only works for a person at a terminal | minta seseorang menjalankan `komando secret show … --reveal` di terminal; untuk memakai secret dalam sebuah perintah, rujuk (secret:…) |
| `REVISION_NOT_FOUND` | 3 | no earlier revision to go back to | lihat revisi dengan `komando cluster history TARGET TIPE/NAMA` |
| `REVOKE_FAILED` | 5 | the key could not be removed from a server's authorized_keys | jalankan lagi; untuk melihat file: `komando fs cat SERVER ~/.ssh/authorized_keys` |
| `ROLLOUT_FAILED` | 5 | pods stuck for … | lihat alasannya dengan `komando cluster describe TARGET …`; `komando cluster rollback` kembali ke versi sebelumnya |
| `ROLLOUT_TIMEOUT` | 7 | not rolled out after … (replicas …)… | lihat task dengan `komando cluster describe … service/…` |
| `RULE_NOT_FOUND` | 3 | no custom deny rule named … | lihat aturan kustom dan id-nya dengan `komando policy list` |
| `SAFETY_SETTING` | 6 | … weakens komando's safety checks | periksa dengan --dry-run, tanyakan kepada pengguna; setelah mereka setuju, jalankan lagi dengan --yes (komando lalu bertanya kepada mereka di jendela di layar mereka) |
| `SEALED_FILE_INVALID` | 2 | … is damaged or cut short: komando cannot read it as a sealed file; nothing was imported | salin file lagi secara utuh, atau buat lagi dengan `komando export --sealed --to FILE` |
| `SEALED_FILE_UNSUPPORTED` | 2 | … is sealed for the iPhone app: only the phone whose key it was sealed to opens it; nothing was imported | di komputer lama, buat file untuk komputer ini dengan `komando export --sealed --to FILE` |
| `SECRET_DESTINATION` | 6 | an AI agent asked to send …; that needs a person's yes | periksa dengan --dry-run, tanyakan kepada pengguna; setelah mereka setuju, jalankan lagi dengan --yes (komando lalu bertanya kepada mereka di jendela di layar mereka) |
| `SECRET_EXISTS` | 8 | secret … is used by … already; --ask-password and --ask-psk do not replace it | pakai dengan --… …, atau simpan yang ini dengan nama lain: `komando secret set NAMA`, lalu --… secret:NAMA |
| `SECRET_IN_ARGS` | 2 | refusing a secret value on the command line: it would be saved in shell history | jalankan `komando secret set …` dan ketik (disembunyikan), pakai --from-env VAR, atau kirim lewat pipe (stdin) |
| `SECRET_IN_USE` | 8 | secret … is used by … | arahkan pemakainya ke secret lain dulu, misalnya `…`, atau ganti namanya dengan `komando secret rename` |
| `SECRET_MISMATCH` | 1 | the value is not the one stored in … | bila yang tersimpan salah, simpan yang benar dengan `komando secret set …` |
| `SECRET_NOT_FOUND` | 3 | no secret named … | lihat dengan `komando secret list` |
| `SECRET_UNRESOLVED` | 3 | registry CA …: … | simpan sertifikat CA dengan `komando secret set NAMA < ca.crt` |
| `SECURITY_UNSUPPORTED` | 3 | komando picks security updates on apt and dnf/yum servers only; … uses … | pakai `komando pkg upgrade TARGET` di server ini |
| `SELF_NOT_FOUND` | 1 | cannot find the komando program that is running: … | jalankan komando dengan path lengkapnya, misalnya /usr/local/bin/komando update |
| `SENSITIVE_FILE` | 6 | … is …, not … | pakai database Anda sendiri; data komando hanya dibaca lewat perintah komando (`komando list`, `komando secret list`) |
| `SESSION_NOT_FOUND` | 3 | no session … | daftarkan sesi dengan `komando db activity CONN --all` |
| `SFTP_UNAVAILABLE` | 4 | sftp: … | aktifkan subsistem sftp di sshd_config |
| `SHARED_FOLDER_CONFLICT` | 8 | … can be changed by …, not only by root and the SSH user: as root, komando does not write … there (that user could swap it for a link while root writes) | tulis sebagai … sebagai gantinya, misalnya `komando exec TARGET --sudo-user … --stdin-file FILE -- sh -c 'cat > "$0"' …` |
| `SIZE_CONFLICT` | 8 | --size said … bytes, and stdin sent …; nothing was put into place | kirim seluruh file lagi: `komando upload TARGET - DEST --size N` |
| `SKIPPED` | 1 | skipped: another server failed first, and --fail-fast is on | jalankan tanpa --fail-fast untuk menjangkau setiap server |
| `SOURCE_BUILD` | 8 | this komando was built from source (version …), so update does not replace it | build ulang (git pull, lalu make build), atau instal rilis dengan baris instal: https://github.com/sgnd/komando#install |
| `SOURCE_EMPTY` | 3 | … has no files to sync, so --delete would remove everything in …; nothing was deleted | periksa path sumber |
| `SQL_HIDDEN_CODE` | 2 | -- is followed by a non-ASCII byte | taruh spasi setelah -- untuk memulai komentar: apakah ini memulai komentar bergantung pada character set server |
| `SQL_SAFE_SETTINGS_REQUIRED` | 6 | this user's queries are read as …, not ClickHouse SQL | komando memeriksa SQL ClickHouse; pakai user yang settings profile-nya mempertahankan dialect = 'clickhouse' (`komando conn edit NAMA --url URL`) |
| `SQL_STRING_RULES` | 2 | changing … is not allowed in komando db | biarkan pengaturan ini: komando memeriksa SQL dengan aturan string default server |
| `SQL_TX_CHECK_REQUIRED` | 6 | statement … (…) ended komando's transaction, so komando stopped (…) | serahkan transaksi kepada komando, dan beri tahu pengguna: apa yang berjalan sebelum titik ini mungkin sudah di-commit; lihat data dengan `komando db query CONN -- SELECT ...` |
| `SQL_TX_CONTROL` | 2 | … is not allowed in komando db | serahkan transaksi kepada komando: tanpa --write ia menjalankan transaksi read-only, dengan --write satu transaksi yang di-rollback oleh --dry-run |
| `SSH_AGENT_NEEDED` | 2 | a key komando made is sealed in its store and never written to a file, so OpenSSH gets it from a running ssh-agent, and none was found (SSH_AUTH_SOCK) | jalankan satu dengan `eval "$(ssh-agent)"` dan jalankan ini lagi, atau pakai `komando shell SERVER`, yang login dengan key itu sendiri |
| `SSH_AGENT_REFUSED` | 1 | the ssh-agent did not take key …: … | periksa ssh-agent, atau pakai `komando shell SERVER` |
| `SSH_GATE_NETWORK_REQUIRED` | 6 | komando … is refused for a read key without network: … | key ini ditambahkan dengan --read-only dan tanpa --network: key ini hanya menjalankan pembacaan yang tetap berada di server dan conn di daftar Anda; seseorang menambahkan key untuk ini dengan `komando ssh-gate line --read-only --network`, atau menjalankannya di komputer komando |
| `SSH_GATE_PATH` | 1 | komando cannot tell its own full path, which the line needs | jalankan komando dengan path lengkapnya, misalnya /usr/local/bin/komando ssh-gate line ... |
| `SSH_GATE_READ_ONLY` | 6 | komando … is refused for a read-only key: … | key ini ditambahkan dengan --read-only dan hanya menjalankan perintah yang membaca; pakai key yang boleh mengubah, atau komputer komando itu sendiri |
| `SSH_GATE_REFUSED` | 6 | komando … needs a person at a terminal on this computer; a key cannot run it | seseorang menjalankannya di terminal di komputer komando itu sendiri |
| `SSH_GATE_SYNTAX` | 2 | an ssh-gate key sent more than one komando command, or a character a shell would expand (the message names it) | kirim satu perintah komando; taruh argumen yang berisi ; \| & $ atau backquote di dalam tanda kutip tunggal ($ dan backquote ditolak bahkan di dalam tanda kutip ganda) |
| `SSH_KEY_NOT_FOUND` | 3 | no SSH key named … | lihat dengan `komando key list` |
| `SSM_FAILED` | 4 | AWS Session Manager could not open a session to the instance | periksa ID instance, agen SSM-nya, dan login AWS Anda (`komando login aws`) |
| `STATE_CORRUPT` | 1 | … does not open with the store's key | file ini hanya menyimpan sesi VPN, login, job, dan tunnel yang berjalan: pindahkan, lalu sambungkan lagi (VPN yang dimulai sebelum key store berubah diakhiri oleh `komando vpn down`) |
| `STORAGE_AUTH` | 4 | an azblob conn needs the storage account's key or a SAS token | simpan key storage account atau token SAS dengan `komando secret set NAMA` dan berikan --password-ref secret:NAMA |
| `STORAGE_CONNECT` | 4 | komando could not reach the bucket or file server | jalankan `komando test TARGET` untuk memeriksa keterjangkauan |
| `STORAGE_ERROR` | 5 | the file is in use | program lain membuka file itu; tutup di sana dan jalankan lagi |
| `STORAGE_TLS` | 4 | the storage server's TLS certificate does not verify: … | bila server memakai sertifikat self-signed yang Anda percayai, tambahkan ?tls=skip-verify ke URL conn |
| `STORAGE_UNSUPPORTED` | 2 | … is … storage, which has no file modes | chmod berfungsi di conn SFTP; `komando list kind:storage` mencantumkan milik Anda |
| `STORE_BUSY` | 8 | komando's store stayed busy for …, so the server's host key could not be checked: … | proses komando lain sedang menulis store komando, atau ada yang macet (`komando status` mencantumkan apa yang berjalan): tunggu sampai selesai, lalu jalankan lagi |
| `STORE_CONFLICT` | 8 | nothing was done: … was replaced, given a new key or checked again while this command ran, and this command still held it as it was | jalankan perintah lagi: komando membuka store lagi dari awal; bila terus terjadi, jalankan `komando doctor` |
| `STORE_KEY_CHANGED` | 1 | …: … | jalankan lagi: komando lain mengubah key store saat yang ini berjalan |
| `STORE_NEWER` | 1 | … was made by a newer komando | komando yang lebih baru membuat atau mengubah store ini; perbarui yang ini: `komando update` |
| `STORE_OLD_COPY` | 6 | … …: servers, rules, secrets or pinned host keys may be old | bila folder komando sengaja dipulihkan dari backup, seseorang menjalankan `komando doctor --accept-old-copy` di terminalnya sendiri; kalau tidak, cari tahu siapa yang mengembalikan salinan lama atau mengubah keychain |
| `STREAM_EXISTS` | 8 | stream … already exists | pilih nama lain, atau lihat dengan `komando queue describe CONN …` |
| `STREAM_NOT_FOUND` | 3 | no stream named … | daftarkan stream dengan `komando queue list CONN` |
| `SUBSCRIPTION_EXISTS` | 8 | subscription … already exists | pilih nama lain, atau lihat dengan `komando queue describe CONN subscriptions/…` |
| `SUBSCRIPTION_NOT_FOUND` | 3 | no subscription named … | daftarkan subscription dengan `komando queue groups CONN`; `komando queue describe CONN TOPIC` menampilkan milik sebuah topic |
| `SVC_FAILED` | 5 | systemctl daemon-reload failed (…) | baca output error (stderr) untuk alasan dari systemd; unit file yang salah disebut di sana |
| `SWARM_ERROR` | 5 | Docker Swarm answered with an error | periksa bahwa Docker berjalan di sana: `komando exec TARGET --read-only -- docker info` |
| `SWARM_OBJECT_NOT_FOUND` | 3 | no … named … | daftarkan apa yang ada dengan `komando cluster list TARGET …s` |
| `SWARM_SERVICE_NOT_FOUND` | 3 | no service named … | daftarkan service dengan `komando cluster list TARGET services` |
| `SWARM_STACK_NOT_FOUND` | 3 | no stack named … | daftarkan stack dengan `komando cluster list … stacks` |
| `SYMLINK_LOOP` | 8 | …: too many levels of symbolic links | sebuah link menunjuk kembali ke dirinya sendiri; lihat dengan `komando fs stat SERVER PATH` |
| `TABLE_NOT_FOUND` | 3 | no table named … | jalankan `komando db schema CONN` untuk mendaftarkan tabel |
| `TARGET_EMPTY` | 3 | target … matched nothing | jalankan `komando list` untuk melihat server, conn, grup, dan tag |
| `TARGET_NOT_FOUND` | 3 | no VPN named … | lihat dengan `komando vpn list` |
| `TIMEOUT` | 7 | redis did not answer in time | naikkan --timeout |
| `TLS_HANDSHAKE_FAILED` | 4 | TLS handshake with … failed: … | server mengakhiri TLS handshake; jalankan lagi, dan periksa bahwa … adalah port TLS (bukan HTTP polos) |
| `TOOL_FAILED` | 5 | kubectl exited … | baca output error (stderr) untuk alasannya; `komando cluster events TARGET --warnings` menampilkan masalah cluster belakangan ini |
| `TOOL_MISSING` | 3 | curl is not installed | instal curl di server |
| `TOOL_TOO_OLD` | 5 | … failed on … (exit …): … | pg_dump … lebih tua daripada server (…): instal postgresql-client-… di tempat tool berjalan, atau sebut server yang punya dengan --run-on HOST |
| `TOO_MANY` | 8 | … objects match, more than --max-remove … | persempit --prefix atau --older-than, atau naikkan --max-remove di atas … setelah memeriksa daftarnya |
| `TOO_MANY_TAGS` | 2 | … has more than … tags | komando membersihkan repository dengan paling banyak 10000 tag, dan --match tidak mengubahnya (setiap tag dibaca, jadi tag yang dipertahankan melindungi image-nya): hapus beberapa dulu dengan `komando registry rm CONN IMAGE` |
| `TOPIC_EXISTS` | 8 | topic … already exists | pilih nama lain, atau lihat dengan `komando queue describe CONN …` |
| `TOPIC_NOT_FOUND` | 3 | no topic named … | daftarkan topic dengan `komando queue list CONN` |
| `TUNNEL_FAILED` | 4 | the server refused the port forwarding (AllowTcpForwarding, address) | periksa bahwa server mengizinkan forwarding (AllowTcpForwarding di sshd_config) dan bahwa alamatnya benar |
| `TUNNEL_NOT_FOUND` | 3 | no tunnel named … | lihat dengan `komando tunnel list` |
| `TUNNEL_TIMEOUT` | 7 | tunnel did not become ready… | periksa bahwa … menjawab: `komando test …`; seseorang membaca seluruh log di … |
| `UNEXPECTED_CHANGE` | 8 | … changed after patching: … | periksa server (`komando docker ps …`, `komando svc list … --failed`); server setelahnya belum di-patch: jalankan lagi dengan --keep-going untuk tetap mem-patch mereka |
| `UNEXPECTED_STATUS` | 5 | HTTP …, expected … | periksa URL dan service di baliknya |
| `UNIT_NOT_ACTIVE` | 5 | not active after …s: … | baca alasannya dengan `komando logs TARGET --unit UNIT -n 50` |
| `UNIT_NOT_FOUND` | 3 | no unit named … | periksa nama dengan `komando svc list TARGET` |
| `UNKNOWN_SETTING` | 2 | komando has no setting named … | lihat pengaturan dengan `komando config show`: … |
| `UNKNOWN_VAR` | 2 | recipe … has no blank named … (…) | lihat recipe dengan `komando recipe list` |
| `UNSAFE_BACKUP` | 6 | line … is a client command, not SQL: … | file berisi perintah klien yang bisa menjalankan program atau membaca file di tempat restore berjalan; hapus baris itu bila file bukan dari dump yang tepercaya |
| `UNSAFE_PATH` | 5 | path … leads outside …; nothing outside the folder was written | ganti nama file agar tidak ada .. di path-nya |
| `UNSUPPORTED_PLATFORM` | 8 | there is no komando release for … | build komando dari source: https://github.com/sgnd/komando#install |
| `UPLOAD_NOT_RENAMED` | 5 | could not rename the upload into place: …; the old file was removed | isi baru ada di server sebagai …: ganti namanya secara manual |
| `URL_HAS_PASSWORD` | 2 | a conn URL holds no password | hapus kata sandi dari URL, simpan dengan `komando secret set NAMA`, lalu berikan --password-ref secret:NAMA |
| `USAGE` | 2 | --… and --unset … contradict each other | berikan salah satunya |
| `USER_NOT_FOUND` | 3 | no user named … | daftarkan akun dengan `komando user list TARGET --all` |
| `VALIDATION_FAILED` | 8 | --validate rejected the new file: …; the file was not changed | perbaiki isinya dan jalankan lagi |
| `VAULT_CHANGED` | 8 | …; nothing was changed | jalankan lagi |
| `VAULT_DECRYPT` | 1 | …; nothing was lost | KOMANDO_VAULT_PASS bukan passphrase yang dipakai saat vault ini disimpan: atur yang benar (`komando doctor` menyebut mode vault mana yang dipakai) |
| `VAULT_KEY` | 1 | password for … (…): … | pulihkan ~/.komando/store.key dari backup, atau pindahkan key kembali dengan `komando secret keychain` di komputer yang keychain-nya menyimpannya; `komando doctor` memeriksa vault |
| `VAULT_LOCKED` | 1 | password for … (…): … | orang yang mengatur passphrase mengekspor KOMANDO_VAULT_PASS di shell yang menjalankan komando (agen AI bertanya kepada pengguna; agen tidak pernah melihat passphrase) |
| `VERSION_NOT_FOUND` | 3 | komando … has no download for … | pilih versi lain dari …/releases |
| `VIA_CYCLE` | 2 | server … is in its own --via path | --via menyebut server (atau VPN) di depan server ini, bukan server itu sendiri |
| `VIA_NOT_FOUND` | 3 | no server or VPN named … | --via menerima nama server dan VPN; lihat dengan `komando list` |
| `VIA_ORDER` | 2 | …: the --via path reaches VPN … after another step | sebuah jalur bisa memakai satu VPN, sebagai langkah pertamanya |
| `VPN_CLIENT_MISSING` | 3 | … VPNs need the … program, which is not installed | instal program yang disebut pesan (macOS: `brew install NAMA`; Linux: package-nya) |
| `VPN_CONFIG` | 2 | …: … | periksa bahwa file adalah konfigurasi WireGuard (wg-quick) |
| `VPN_DOWN` | 4 | VPN … did not start: … | pesan diakhiri dengan lognya; `komando vpn test …` mencoba lagi, dan seseorang membaca seluruh log di … |
| `VPN_EXISTS` | 8 | … … already exists | pakai `komando … edit` atau berikan --overwrite untuk menggantikannya |
| `VPN_IN_USE` | 8 | VPN … is on the --via path of … | ubah --via mereka dulu: `komando host edit TARGET --via LAIN` |
| `VPN_LOGIN_REQUIRED` | 4 | VPN … is not connected and needs a person to log in | minta seseorang menjalankan `komando vpn up …` (butuh login mereka); lalu jalankan lagi |
| `VPN_NOT_FOR_OPENSSH` | 2 | VPN … (…) runs inside komando; OpenSSH cannot use it | pakai `komando shell SERVER` (membuka VPN itu sendiri), atau sambungkan VPN di komputer ini dan hilangkan dari --via |
| `VPN_STOP_FAILED` | 1 | could not disconnect …: … | jalankan `komando vpn down …` lagi; bila masih gagal, akhiri proses … sendiri |
| `WAIT_TIMEOUT` | 7 | job … still running after … | masih berjalan: `komando job wait …` menunggu lagi, `komando job logs … --limit 50` menampilkan outputnya sejauh ini |
| `WEAK_PASSPHRASE` | 2 | …; nothing was changed | jalankan lagi dengan passphrase lain |
| `WINRM_ERROR` | 5 | …: … | baca pesannya; `winrm quickconfig` di server menyiapkan WinRM, dan user butuh hak untuk memakainya (administrator, atau grup Remote Management Users) |
| `WINRM_INSECURE` | 2 | Basic login over plain HTTP sends the password unencrypted | pakai HTTPS (hilangkan tls=off), atau NTLM (hilangkan auth=basic), yang tidak pernah mengirim kata sandi |
| `WINRM_NOT_HTTPS` | 4 | …: … | server berbicara HTTP polos di sana: pakai port 5986 untuk HTTPS, atau ?tls=off bila memang tidak punya HTTPS (perintah lalu berjalan tanpa enkripsi) |
| `WINRM_TLS` | 4 | …: the WinRM server's certificate cannot be trusted: … | bila sertifikat server berasal dari CA Anda sendiri, simpan dengan `komando secret set NAMA < ca.crt` dan tambahkan ?ca=secret:NAMA ke alamat winrm://-nya (`komando host edit … --address winrm://...`) |
| `WRITE_FAILED` | 1 | …; nothing was changed | periksa bahwa Anda boleh menulis ke … |
| `WRITE_REQUIRES_FLAG` | 6 | … needs --write | perintah ini mungkin mengubah data (atau tidak diketahui sebagai pembacaan); jalankan lagi dengan --write |
| `WRONG_KIND` | 2 | … is a … URL, not one for `komando … add` | tambahkan dengan `komando … add` (atau `komando conn add`) |
| `WRONG_PASSPHRASE` | 2 | that passphrase does not open the vault; nothing was changed | jalankan lagi dan ketik passphrase yang dimiliki vault sekarang |
