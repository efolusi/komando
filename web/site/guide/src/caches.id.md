Cache adalah tempat simpan key dan value yang cepat, seperti Redis atau Valkey. Komando memungkinkan Anda mencari key, membacanya, dan mengubahnya hanya dengan sengaja.

## Mencari key

1. Buka **Connections**, klik chip **Caches**, lalu cache-nya, misalnya `sessions`. Cache terbuka di **Overview**-nya, dengan pemeriksaan cepat **Info**.
2. Klik tab **Keys**.
3. Ketik pola, misalnya `session:*` (`*` cocok dengan apa saja), lalu tekan Return.

Key-key muncul dengan tipe dan TTL-nya, yaitu waktu sebelum cache melupakan key itu ("none" jika tidak pernah kedaluwarsa). Status bar menyebut berapa key yang ada di cache dan berapa yang sudah dipindai. **Scan More** membaca lebih jauh.

{shot:caches/keys|Tab Keys pada sessions: key yang cocok dengan session:*, dan field dari satu key hash.}

## Membaca key

Klik sebuah key. Hash menampilkan field-nya sebagai tabel; value JSON tampil berwarna di bawahnya.

- Klik kanan sebuah key, atau pakai ⋯-nya, untuk **Copy Key Name** dan **Copy Value**. Status bar menulis "Copied …" sebentar. Untuk value yang sangat besar, komando hanya membaca bagian awalnya, dan status bar menyebutkannya.
- ⋯ pada daftar key berisi **Refresh**, **Copy Pattern**, dan **Show One Type**.
- Klik judul kolom di tabel hash untuk mengurutkan menurut kolom itu, dan seret tepi kolom untuk mengubah lebarnya. Lihat [Mengurutkan dan mengatur lebar hasil](guide:databases#sort-and-size-the-results).
- Seret garis di antara key dan value untuk memberi salah satunya ruang lebih. Komando mengingatnya.

## Mengubah key dengan sengaja

☐ **Allow changes** mati: "Allow changes is off: the cache stays as it is." Tombol-tombol perubahan diredupkan, dengan "Tick Allow changes first".

1. Centang ☐ **Allow changes**.
2. Lalu:
   - **Delete Key…** (juga ada di menu klik kanan key) bertanya dulu, "Delete session:7f3a9c21?", dengan **Delete Key**. Key yang dihapus tidak kembali.
   - **Change Expiry…** meminta waktu, misalnya `30m`, `24h`, atau `7d`; kosong berarti tidak pernah kedaluwarsa.
   - **Set Value…** mengganti value key string.
   - **Add Field…** menambah field ke hash.
   - **New String Key…** membuat key baru.
3. Tiap perubahan menunjukkan perintah persis komando sebelum dijalankan. Lalu banner mengonfirmasinya, misalnya "Deleted session:7f3a9c21."

Pada cache yang dilindungi, satu pertanyaan sebelum perubahan itu adalah satu-satunya yang ditanyakan komando.

## Di command line

`komando cache keys sessions 'session:*'` dan `komando cache get sessions KEY` melakukan hal yang sama.
