Recipe adalah perintah tersimpan yang punya isian kosong, misalnya "restart a service". Jalankan pada satu server atau satu grup, dan lihat jawaban tiap server. Komando datang dengan recipe siap pakai, dan Anda bisa menyimpan recipe sendiri.

## Menjalankan recipe

1. Buka **Recipes** di sidebar. Chip menyaring daftarnya: **All**, **Saved**, dan **Ready-made**. Seret garis di samping daftar untuk melebarkan atau menyempitkannya; klik dua kali mengembalikannya.
2. Klik sebuah recipe. Recipe menampilkan namanya, label yang menyebut apakah ia **Changes the server** atau **Read-only** (dan "sudo" jika memakai sudo), serta perintahnya dengan isian kosong, misalnya `{{service}}`.
3. Isi setiap isian kosong.
4. Di **Run on**, pilih server atau grup, misalnya `@production`.
5. Klik **Run on @production** (⌘↩).

Hasilnya terbuka sebagai tab: berapa server yang berhasil dan gagal, lalu tiap server dengan **Done** atau **Failed** beserta output-nya. **Run Again** menjalankannya lagi.

Cara lain:

- Klik kanan sebuah recipe dan pilih **Run On**, lalu sebuah server.
- Di **Hosts**, ⋯ pada server punya **Run Recipe** › **Choose a Recipe…**, dan ⋯ pada grup punya **Run Recipe on @production…**. Recipes terbuka dengan server atau grup itu sudah terpilih di **Run on**.
- Di terminal, ⋯ › **Run a Recipe** menjalankan satu recipe di server itu.

{shot:recipes/run-results|Hasil restart-nginx pada @production: tiga server Done, satu Failed beserta error-nya.}

## Server yang dilindungi

Jika ada server di grup yang dilindungi dan recipe itu mengubah server, komando bertanya dulu, "This target is protected", dengan perintah persisnya dan **Run Anyway**. Ia bertanya sebelum mulai, jadi recipe berjalan di semua server atau tidak sama sekali. **Cancel** menghentikan seluruh run. Recipe bertanda **Only reads** tidak bertanya.

> Satu jawaban ya berlaku untuk seluruh run: setiap perintah di recipe, dengan isiannya, di setiap server dalam grup. Pertanyaannya mungkin tidak menyebut semuanya satu per satu. Jadi baca seluruh recipe sebelum Anda klik **Run Anyway**: buka dengan **Edit…** (atau **Duplicate…** untuk recipe siap pakai), atau jalankan `komando recipe show restart-nginx` di Terminal. `komando recipe run restart-nginx @production --dry-run` menunjukkan apa yang akan berjalan, tanpa mengubah apa pun.

## Menyimpan recipe sendiri

1. Klik **New Recipe** di header.
2. Isi **Name**, **What it does**, dan **Command**. Tulis `{{name}}` untuk isian kosong dan `{{name=default}}` untuk isian dengan nilai bawaan.
3. **Only reads** awalnya mati, jadi recipe baru dianggap mengubah server sampai Anda menyalakannya. Nyalakan **Runs with sudo** jika perintahnya membutuhkannya; ia memakai kata sandi sudo server.
4. Klik **Save Recipe**.

## Mengubah atau menghapus recipe

⋯ di samping nama recipe, dan klik kanan pada barisnya, berisi **Copy Command**, **Duplicate…** untuk recipe apa pun (recipe siap pakai disalin, tidak pernah diubah), serta **Edit…** dan **Remove Recipe…** untuk recipe Anda sendiri. Menghapus bertanya dulu; tidak ada yang berubah di server Anda.

## Di command line

`komando recipe run restart-nginx @production` melakukan hal yang sama.
