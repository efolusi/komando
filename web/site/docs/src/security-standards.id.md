# Standar keamanan

Seberapa jauh komando memenuhi standar keamanan internasional yang cocok untuk tool DevOps yang menyimpan kredensial dan dijalankan oleh agen AI. · [Keamanan](safety.md)

Ini adalah penilaian mandiri, dicek terhadap kode dan test. Ini bukan sertifikat: sertifikat (ISO 27001, SOC 2) diberikan kepada sebuah organisasi atas cara kerjanya, dan komando hanya bisa memberi Anda kontrol untuk dipakai di sana.

Kolom status berisi *terpenuhi*, *sebagian terpenuhi* (dengan celah yang disebutkan), atau *tugas Anda* (langkah yang hanya bisa Anda ambil).

## Periksa sendiri

```bash
komando doctor          # keamanan: izin, vault, rantai audit, conn tanpa enkripsi
komando audit verify    # tidak ada yang mengubah audit log
make lint security      # staticcheck, govulncheck (jalankan di salinan source code)
make fuzz               # fuzz parser yang membaca teks tak tepercaya
```

## OWASP ASVS 4.0.3 (Application Security Verification Standard)

| Persyaratan | Cara komando memenuhinya | Status |
|---|---|---|
| 2.10, 6.4 Secret tidak ada di kode, argumen, atau riwayat | Vault, rujukan `secret:NAMA`, manager eksternal (HashiCorp Vault/OpenBao, AWS dan Google Secret Manager, Azure Key Vault, Bitwarden, KeePass, 1Password Connect); nilai secret di command line ditolak | Terpenuhi |
| 6.2 Algoritma yang disetujui, tanpa kripto buatan sendiri | AES-256-GCM (setiap nilai terikat pada namanya), scrypt N=2^17 r=8 p=1, `crypto/rand`, key Ed25519, SSH dan TLS dari Go | Terpenuhi |
| 6.4.2 Materi key terlindungi | Semua yang disimpan komando disegel dalam satu file (`store.db`, AES-256-GCM per record). Vault baru menyimpan key-nya di keychain OS (keychain macOS, Secret Service Linux, Credential Manager Windows), dibaca ulang sebelum dianggap berhasil; mode passphrase tidak menyimpan key di disk; bila keduanya tidak ada, dipakai file key yang hanya bisa dibaca Anda (mode 0600 di folder 0700, atau daftar akses khusus pemilik di Windows); `komando secret keychain` memindahkan key dari file itu ke keychain | Terpenuhi dengan keychain atau passphrase. Sebagian terpenuhi tanpa keychain: file key berada di samping vault (`doctor` memberi peringatan) |
| 4.1.3, 4.3.1 Hak akses minimum, antarmuka administrasi | `komando ssh-gate` membatasi SSH key perangkat lain hanya untuk komando: tanpa shell atau forwarding, aturan agen, tidak ada yang ditulis di komputer komando (juga tidak lewat file sqlite, dan tidak ada apa pun, bahkan pembacaan, di target pada alamat loopback), key `--read-only` hanya menjalankan pembacaan, dan hanya yang tetap berada di server dan conn yang terdaftar kecuali barisnya memakai `--network`, setiap perintah diaudit dengan nama key | Terpenuhi. Tugas Anda: tambahkan key ponsel dengan `komando ssh-gate line` |
| 7.1 Log mencatat siapa, apa, di mana, hasil, tanpa secret | Setiap tindakan: waktu, aktor, agen AI, persetujuan, host, perintah; diuji tidak memuat kata sandi | Terpenuhi |
| 7.3 Log terlindung dari perubahan | Audit log disegel di `store.db`, rantai hash yang diperiksa `komando audit verify`; dengan key di keychain, salinan lama store yang dikembalikan menghentikan setiap perintah (`STORE_OLD_COPY`); dan setiap record bisa dikirim ke server log dengan `audit_syslog` | Terpenuhi dengan `audit_syslog`. Sebagian terpenuhi tanpanya: user yang sama bisa membangun ulang rantai atau memotong ujungnya |
| 8.3 Data sensitif tidak ditampilkan kepada yang tidak berhak melihatnya | Nilai vault disembunyikan untuk semua orang; kata sandi, key, dan token disembunyikan untuk agen AI yang dikenali komando | Sebagian terpenuhi: penyamaran bersifat upaya terbaik, dan nama yang tidak lazim bisa lolos |
| 9.1, 9.2 Koneksi terenkripsi dan server diperiksa | Host key SSH (berhenti bila tidak cocok; key pertama ditampilkan dengan fingerprint-nya); SSH meminta dulu pertukaran key hybrid pasca-kuantum `mlkem768x25519-sha256` (default OpenSSH 10, juga ada di OpenSSH 9.9), baru curve25519; TLS 1.2+ untuk Redis, Kubernetes, FTPS, HashiCorp Vault, dan klien VPN bawaan; WinRM lewat HTTPS dengan sertifikat diperiksa (HTTP polos hanya dengan `?tls=off`); share SMB menandatangani setiap pesan dan dienkripsi saat server memintanya; IKEv1 tanpa 3DES atau grup DH di bawah 14 secara default; tanpa PAP secara default; FTP dan WebDAV polos butuh `?insecure=1`, begitu juga conn Redis dan memcached polos yang baru lewat jaringan | Sebagian terpenuhi: conn Postgres dan MySQL baru lewat jaringan memeriksa sertifikat kecuali URL menyatakan lain; conn yang sudah tersimpan mengikuti URL-nya, dan `doctor` memperingatkan yang tanpa TLS terverifikasi serta mencetak perbaikannya. `--legacy-crypto` (3DES, grup DH 2 dan 5) dan `--allow-pap` menyalakan kembali opsi lemah itu untuk satu VPN, dengan jawaban ya dari seseorang |
| 12.3 File: tanpa path traversal | Download folder menolak path server yang mengarah ke luar target | Terpenuhi |
| 14.2 Dependensi diketahui dan selalu diperbarui | Go module, `govulncheck` di CI, Dependabot | Terpenuhi |

## OWASP Top 10 for LLM Applications (2025)

| Risiko | Cara komando memenuhinya | Status |
|---|---|---|
| LLM01 Prompt injection | Aturan agen menyatakan output server adalah data, bukan instruksi; tindakan berisiko butuh klik dari seseorang, yang tidak bisa diberikan oleh teks yang disisipkan | Sebagian terpenuhi: tidak ada tool yang bisa menghentikan injection itu sendiri, hanya membatasi apa yang dijangkaunya |
| LLM02 Sensitive information disclosure | Penyamaran untuk agen, `SENSITIVE_FILE`, guard di komputer ini (Claude Code, Cursor, Gemini CLI, Codex), `secret show --reveal` hanya untuk manusia | Sebagian terpenuhi: penyamaran hanya bekerja untuk agen yang dikenali komando: Claude Code, Codex, Cursor, Gemini CLI, atau agen apa pun dengan `KOMANDO_AGENT=1` |
| LLM05 Improper output handling | Teks yang disamarkan tidak pernah ditulis kembali (`HIDDEN_VALUE`); setiap perintah yang dikirim agen melewati filter kebijakan | Terpenuhi |
| LLM06 Excessive agency | Membaca secara default (`--read-only`, `--write`), target yang dilindungi, seseorang yang mengizinkan `--yes`, `--allow-dangerous`, dan `--reveal`, audit log menyebut nama agennya | Sebagian terpenuhi: jendela persetujuan untuk `--yes`, `--allow-dangerous`, dan `--reveal` hanya bekerja untuk agen yang dikenali komando (lihat LLM02); agen lain dianggap script |
| LLM10 Unbounded consumption | Timeout, batas output per host, batas paralelisme, pekerjaan panjang sebagai job | Terpenuhi |

## NIST

| Kontrol | Cara komando memenuhinya | Status |
|---|---|---|
| SP 800-63B Panjang passphrase | `doctor` memperingatkan di bawah 15 karakter | Sebagian terpenuhi: diperingatkan, tidak dipaksakan |
| SP 800-132 Key derivation | scrypt dengan cost yang tersimpan; vault lama naik tingkat pada perubahan berikutnya | Terpenuhi |
| SP 800-53 AC-6 Hak akses minimum | Agen AI membaca secara default dan butuh seseorang untuk yang lebih; SSH key perangkat lain hanya menjalankan komando, read-only bila Anda pilih (`ssh-gate`) | Terpenuhi. Tugas Anda: beri komando user SSH yang hanya memiliki apa yang dibutuhkannya |
| SP 800-53 AU-2, AU-3, AU-9 Peristiwa audit, isi, perlindungan | Lihat ASVS 7 | Sebagian terpenuhi |
| SP 800-53 SC-8 Kerahasiaan transmisi | Lihat ASVS 9 | Sebagian terpenuhi |
| SP 800-53 SI-7 Integritas software | Checksum rilis dan provenance build yang ditandatangani | Terpenuhi |
| SP 800-218 (SSDF) PS.3, PW.7, PW.8, RV.1 | Provenance, analisis statis (staticcheck, vet), test unit, end-to-end, dan fuzz, pemindaian kerentanan | Terpenuhi |

## ISO/IEC 27001:2022 Annex A dan CIS Controls v8

komando memberi Anda kontrol untuk standar ini; sertifikatnya adalah tentang organisasi Anda.

| Kontrol | Bagian komando |
|---|---|
| A.5.17 Informasi autentikasi · CIS 3.11 | Vault terenkripsi, rujukan sebagai ganti nilai |
| A.8.2 Akses istimewa · CIS 5.4 | Target yang dilindungi, jendela persetujuan, filter kebijakan |
| A.8.5 Autentikasi aman | SSH key dan agen, pemeriksaan host key, key yang dibatasi untuk komando (`ssh-gate`) |
| A.8.15 Logging · CIS 8 | Audit log dengan rantai hash |
| A.8.24 Penggunaan kriptografi · CIS 3.10 | AES-256-GCM, scrypt, SSH, TLS 1.2+ |
| A.8.28 Secure coding · CIS 16 | Analisis statis, fuzzing, build tool yang di-pin |

## Supply chain: OpenSSF Scorecard dan SLSA

| Pemeriksaan | Status |
|---|---|
| Security-Policy (SECURITY.md, laporan privat) | Terpenuhi |
| Token-Permissions (CI hanya membaca; rilis hanya menulis yang harus ditulis) | Terpenuhi |
| Pinned-Dependencies (action di-pin ke commit, tool ke versi) | Terpenuhi |
| Dependency-Update-Tool (Dependabot) | Terpenuhi |
| SAST dan Vulnerabilities (staticcheck, govulncheck) | Terpenuhi |
| Fuzzing (penyamaran, tampilan output, filter kebijakan (shell dan PowerShell), guard, scanner SQL, parser OpenVPN, IPsec, L2TP, Pulse, SSM, dan Bitwarden) | Terpenuhi |
| Signed-Releases: provenance SLSA Build Level 2 | Terpenuhi. Periksa unduhan dengan `gh attestation verify komando_*.tar.gz --repo sgnd/komando` |
| Branch-Protection, Code-Review | Tugas Anda. Di GitHub, lindungi `main`, wajibkan review dan CI |

## Batasan

Yang tidak dicakup komando:

- Agen AI adalah user Anda sendiri. komando menghentikan kesalahan dan instruksi yang disisipkan; komando tidak bisa menghentikan program yang berjalan sebagai Anda dan berniat jahat. Isolasi sungguhan butuh sandbox OS atau akun user terpisah untuk agen.
- Key vault tidak berada di hardware key (YubiKey, TPM); keychain OS adalah tempat terkuat untuk komando menyimpannya.
- Jendela persetujuan hanya satu klik, kecuali Anda menyalakan kode persetujuan (`komando config approval-code`): dengan itu jendela juga butuh kode 6 digit dari aplikasi authenticator Anda.
- Guard hanya berjalan di tempat harness agen memintanya. `komando guide install` memasangnya untuk Claude Code, Cursor, Gemini CLI (v0.26+), dan Codex (setujui sekali di `/hooks`). Guard diuji dengan input hook yang didokumentasikan masing-masing. Agen tanpa hook hanya mendapat jendela persetujuan dan penyamaran, dan itu hanya bila komando mengenalinya: Claude Code, Codex, Cursor, Gemini CLI, atau agen apa pun dengan `KOMANDO_AGENT=1`.
