# Rotasi key dan kata sandi, dan saat seseorang pergi

Ganti key atau kata sandi di semua tempat komando memakainya, dengan urutan yang benar, dan cabut akses saat seseorang pergi.

## Rotasi key SSH

Buat key baru, pasang di server, pastikan setiap server bisa login dengannya, dan baru setelah itu cabut key lama:

```bash
komando key gen deploy-2                          # pasangan key baru, disegel di penyimpanan komando
komando key deploy deploy-2 @web --set-default    # di server, dan sejak itu komando login dengannya
komando test @web                                 # setiap server tetap bisa login
komando key revoke deploy @web --dry-run          # berapa baris yang dimiliki key lama
komando key revoke deploy @web                    # cabut key lama dari server
komando key rm deploy                             # lalu dari komando (ditolak selama ada server yang memakainya)
```

Jika diketik tanpa argumen, `komando key deploy` menanyakan key, lalu server.

`key revoke` berhenti sebelum mencabut key yang masih dipakai komando sendiri untuk login (Anda akan mengunci diri sendiri). Di terminal, ketik nama key itu untuk melanjutkan. Agen AI atau script menambahkan `--allow-dangerous` setelah seseorang setuju.

## Rotasi kata sandi server

Ganti kata sandi di server seperti biasa, lalu berikan yang baru ke komando. Nilai lama diganti di bawah nama yang sama, jadi setiap server yang memakainya ikut berubah:

```bash
komando host edit web1 --ask-password        # ketik yang baru (disimpan sebagai secret:web1-pass)
komando test web1
```

Untuk kata sandi yang dipakai bersama oleh beberapa server, jalankan `komando secret set NAME` dengan nama secret-nya (`komando secret list` menunjukkan apa yang memakai tiap secret).

## Rotasi kata sandi database

Simpan kata sandi baru dengan nama baru, minta database menerimanya, arahkan conn ke sana, periksa, lalu hapus yang lama:

```bash
komando secret set prod-db-pass-2                                 # kata sandi baru, diketik sekali
komando db user passwd prod-db app --password-ref secret:prod-db-pass-2
komando conn edit prod-db --password-ref secret:prod-db-pass-2    # sejak itu komando login dengannya
komando test prod-db
komando secret rm prod-db-pass                                    # yang lama
```

Pada conn yang dilindungi, `db user passwd` dan `conn edit` bertanya dulu kepada Anda di terminal. Agen AI atau script menambahkan `--yes` setelah seseorang setuju (lihat [Keamanan](safety.md#what-needs-a-yes)).

## Saat seseorang pergi

1. Cabut SSH key mereka dari setiap server, lewat file public key atau barisnya:

   ```bash
   komando key revoke ~/keys/alice.pub all --dry-run
   komando key revoke ~/keys/alice.pub all
   ```

2. Kunci akun mereka sendiri di server (atau hapus nanti):

   ```bash
   komando user lock all alice
   ```

3. Ganti setiap kata sandi yang mereka tahu: `komando secret list` menunjukkan tiap secret dan apa yang memakainya; rotasi seperti di atas.
4. Apakah mereka tahu passphrase vault? Beri passphrase baru: `komando secret passphrase` (lalu atur `KOMANDO_VAULT_PASS` yang baru di setiap tempat yang memakainya).
5. Lihat apa yang mereka lakukan dengan komando:

   ```bash
   komando audit --actor alice --since 30d
   ```

`--actor` cocok dengan nama di `KOMANDO_ACTOR`, agen AI (`claude`, `codex` ...), atau akun komputer yang menjalankan komando.

## Batasan

- `key rm` ditolak selama masih ada server yang memakai key itu: arahkan server tersebut ke key baru dulu (`key deploy --set-default` melakukannya).
- `key revoke` menghapus key dari `~/.ssh/authorized_keys` milik user yang dipakai login, atau milik `--user NAME` (dengan sudo). Key di file user lain tidak disentuh.
- `audit --actor` hanya menemukan apa yang dilakukan lewat komando.

## Pemecahan masalah

| Kesalahan | Artinya | Yang perlu dilakukan |
|-------|---------|----------------------|
| `POLICY_BLOCKED` (exit 6) | `key revoke` pada key yang dipakai komando untuk login | deploy key lain dengan `--set-default` dulu |
| `KEY_IN_USE` (exit 8) | `key rm` pada key yang masih dipakai server | arahkan server ke key lain dulu |
| `KEY_EXISTS` (exit 8) | `key gen` ke nama yang sudah dipakai | pilih nama lain, atau jalankan `komando key rm NAME` dulu |
| `PROTECTED_TARGET`, `PROTECTED_TARGET` (exit 6) | perubahan di server atau conn yang dilindungi | di terminal, komando bertanya dulu; script menambahkan `--yes` |
| `AUTH_FAILED` (exit 4) | key atau kata sandi baru tidak bisa login | periksa sebelum mencabut yang lama; lihat [Hasil dan kesalahan](output.md#troubleshooting) |
