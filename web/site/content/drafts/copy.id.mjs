// Indonesian twin of copy.en.mjs (row W28), block for block. Product names, commands, file names and the app's own
// button and menu names stay English (i18n/page-map.md). Terms follow the bahasa-indonesia skill.

export const banner = {
  label: 'Draf.',
  text: 'Belum terbit: halaman ini tidak ditautkan, tidak ada di peta situs, dan tidak ditayangkan. Jangan dijadikan pegangan.',
};

export const download = {
  title: 'Komando untuk Mac: unduh (draf)',
  description: 'Draf halaman unduh Komando untuk Mac.',
  h1: 'Komando untuk Mac',
  notReleased: {
    title: 'Aplikasi Mac belum dirilis',
    body: [
      'Belum ada unduhan untuk Mac. Halaman ini tidak menyebut versi atau checksum sampai ada rilisnya.',
      'Baris perintah, komando, gratis dan sudah bisa dipakai. Baris pemasangan dan cara memeriksa checksum ada di halaman utama.',
    ],
    link: '[Pasang komando dari halaman utama](../../../../id/index.html#install)',
  },
  released: {
    title: 'Unduh',
    lead: 'Komando {version} untuk Mac.',
    get: 'Unduh Komando untuk Mac',
    checkTitle: 'Periksa unduhan',
    checkBody: 'Checksum SHA-256 berkas ini adalah `{sha}`. Bandingkan dengan checksum berkas yang Anda unduh:',
    notes: 'Catatan rilis',
  },
  requirements: {
    title: 'Kebutuhan sistem',
    items: ['macOS {macos} atau lebih baru.'],
  },
  signing: {
    title: 'Bertanda tangan dan dinotarisasi',
    body: ['Aplikasi Mac ditandatangani dengan sertifikat Developer ID dan dinotarisasi oleh Apple, sehingga macOS membukanya tanpa peringatan pengembang tidak dikenal. Ini berlaku setelah rilis terbit; saat ini belum ada.'],
  },
  updates: {
    title: 'Pembaruan',
    body: 'Aplikasi memeriksa feed pembaruannya lewat HTTPS dan memverifikasi tanda tangan sebelum memasang apa pun. Feed dan arsipnya ada di jalur berikut pada host unduhan:',
    convention: 'feed:    {path}\narsip:   {archive}',
  },
  open: [
    { todo: ' Nama host: isi `downloadHost` di `content/drafts/config.json` setelah host untuk baris O19 tersedia.' },
    { todo: ' Apakah build hanya untuk Apple silicon atau juga Intel (kebutuhan sistem).' },
    { todo: ' Alamat catatan rilis (`releaseNotesUrl`), serta format dan jalur feed, yang dibuat dan dipastikan baris M38.' },
  ],
};

export const privacy = {
  title: 'Kebijakan privasi (draf)',
  description: 'Draf kebijakan privasi Komando untuk Mac, iPhone, dan iPad.',
  h1: 'Kebijakan privasi',
  blocks: [
    { todo: ' Tanggal berlaku. Terbitkan halaman ini di URL publik (App Store membutuhkannya) dan periksakan sebelum rilis (baris O19 dan A22).' },
    'Berlaku untuk Komando untuk Mac, iPhone, dan iPad.',
    { h: 'Ringkasnya' },
    'Komando menyimpan data Anda di perangkat Anda. Kami tidak mengumpulkan apa pun: tanpa akun, tanpa analitik, tanpa laporan crash, tanpa pelacakan. Komando gratis dan tanpa masa percobaan, jadi tidak ada pembayaran juga.',
    'Hanya satu hal yang keluar dari perangkat Anda ke pihak selain server Anda sendiri, dan hanya saat Anda memulainya: apa yang dikirim agen ke Anthropic, dengan kunci API Anda sendiri (rinciannya di bawah). Jika kelak ada peningkatan berbayar, kebijakan ini akan menyebut apa yang dikirimnya sebelum dirilis.',
    { h: 'Yang tetap di perangkat Anda' },
    'Server, database, cache, dan target lain Anda, kata sandi dan kuncinya, log audit, serta riwayat kueri tetap di perangkat Anda, di folder komando (`~/.komando`) dan di pengaturan serta keychain aplikasi sendiri (daftarnya di bawah). Kami tidak pernah melihatnya.',
    'Saat Anda memakai Komando, aplikasi berbicara dengan server dan layanan Anda sendiri lewat komando, dan di iPhone serta iPad dengan komputer komando Anda sendiri lewat SSH. Lalu lintas itu langsung dari perangkat Anda ke sana. Tidak melewati kami.',
    { h: '1. Agen (opsional)' },
    'Agen (⌘J di Mac, tab Agent di iPhone dan iPad) hanya bekerja setelah Anda menambahkan kunci API Anthropic Anda sendiri. Jika Anda tidak pernah menambahkan kunci, agen tidak mengirim apa pun.',
    'Setiap kali Anda bertanya kepada agen, Komando mengirim satu permintaan ke API Anthropic (`api.anthropic.com`) dengan kunci Anda. Isi permintaannya:',
    { ul: [
      'Instruksi agen dan satu alatnya, perintah `komando`. Isinya sama untuk semua orang.',
      'Catatan singkat tentang apa yang sedang Anda lihat, ditulis aplikasi sebelum pertanyaan Anda: mode agen (Ask atau Act) dan target yang Anda masukkan ke cakupannya.',
      'Di Mac, layar yang sedang Anda buka: untuk server atau koneksi, namanya, jenisnya, dan lokasinya (`user@address` untuk server, alamat untuk koneksi); untuk tab terminal, perintah yang dijalankannya; untuk resep yang dijalankan, resepnya, tempat dijalankan, dan hasil satu baris; jika Anda bertanya tentang temuan doctor, temuan itu.',
      'Di Mac, hingga 20 temuan doctor komando, dalam kata-kata biasa.',
      'Inventaris Anda, hingga 200 target: nama dan jenis tiap target, serta apakah dilindungi. Di Mac, ditambah grupnya. Di iPhone dan iPad, catatan itu juga menyebut bahwa Anda memakai ponsel.',
      'Seluruh percakapan sejauh ini: pesan Anda, jawaban agen, perintah komando yang dijalankannya, dan apa yang dicetak komando. Isinya bisa daftar server Anda, sebuah log, sebuah berkas, atau hasil kueri. Aplikasi menjalankan komando sebagai agen, sehingga komando menyembunyikan nilai rahasia (kata sandi, kunci, token) sebelum agen melihatnya.',
    ] },
    'Anthropic menangani ini berdasarkan ketentuan dan kebijakan privasinya sendiri, pada akun API Anda. Kami tidak menerima salinannya. New Conversation memulai dari awal: pesan sebelumnya tidak dikirim lagi.',
    { h: '2. Pembayaran' },
    'Saat ini tidak ada yang perlu dibayar. Komando untuk Mac, iPhone, dan iPad gratis, tanpa masa percobaan, tanpa pembayaran, dan tidak mengirim apa pun tentang pembelian.',
    { todo: ' Tulis ulang paragraf berikut sebelum peningkatan dirilis.' },
    'Kelak, peningkatan berbayar mungkin menambahkan layanan yang membutuhkan server kami: sinkronisasi antarperangkat, tim, AI bawaan, dan persetujuan di ponsel. Belum ada yang dibuat. Sebelum satu pun dirilis, kebijakan ini akan menyebut apa yang disimpan tiap layanan di server kami, siapa yang memproses pembayaran (misalnya Apple, lewat pembelian dalam aplikasi), dan apa yang kami terima dari mereka.',
    'Privacy manifest aplikasi iPhone dan iPad menyatakan hal yang sama untuk Apple: tanpa pelacakan, dan permintaan agen sebagai konten pengguna yang tidak ditautkan ke Anda dan hanya dipakai untuk menjawab Anda. Manifest itu juga menyebut satu API alasan wajib yang dipakai aplikasi, UserDefaults, untuk pengaturannya sendiri (alasan CA92.1).',
    { h: 'Yang disimpan Komando, dan cara menghapusnya' },
    { h3: 'Di Mac' },
    { ul: [
      'Pengaturan: tampilan, target terbaru, jalur komando yang Anda pilih, menu bar, dan notifikasi, di `~/Library/Preferences/com.efolusi.komando.plist`. Tutup Komando, lalu jalankan `defaults delete com.efolusi.komando` di Terminal.',
      'Dari versi yang punya masa percobaan, jika ada: kunci `trialStart`, `trialReminded`, dan `licenseKey`, serta berkas `trial` dan `license.key`, di berkas pengaturan dan di `~/Library/Application Support/Komando/`. Memperbarui Komando menghapusnya, atau hapus sendiri.',
      'Riwayat kueri: versi lama menyimpannya di berkas pengaturan (`queryHistory.<connection>`); versi baru di `~/Library/Application Support/Komando/History/queries.json`, tidak ikut dicadangkan, dan tidak pernah berisi pernyataan yang tampak memuat kata sandi. Di versi baru, pakai Clear History di menu ⋯ tab database. Di versi mana pun, hapus berkas atau pengaturannya.',
      'Kunci API Anthropic Anda: di keychain, item `com.efolusi.komando.anthropic`. Pakai Settings → Agent → Remove Key, atau hapus item itu di Keychain Access.',
      'Jumlah token agen per tugas (waktu, model, langkah, panggilan alat, token; tidak pernah pertanyaan, jawaban, atau perintah): `~/Library/Application Support/Komando/agent-usage.jsonl`, tidak ikut dicadangkan, tidak pernah dikirim ke mana pun. Pakai Settings → Agent → Usage → Clear, atau hapus berkasnya.',
      'Workspace tersimpan: nama tiap workspace dan tab-tabnya (nama target, perintah terminal dan judul tab, serta cara panel dibagi; tidak pernah kata sandi atau apa yang dicetak terminal). Pakai ⌘K, lalu Delete Workspace, atau `defaults delete com.efolusi.komando KomandoWorkspaces`.',
      'Forward tersimpan: untuk tiap forward, server atau koneksi yang dilaluinya, aturannya (seperti `8080:localhost:80`), dan port lokalnya. Pakai Remove Saved Forward di Port Forwarding, atau `defaults delete com.efolusi.komando KomandoSavedForwards`.',
    ] },
    'Nilai atau kunci privat yang Anda tampilkan dengan Show, Copy Value, atau Show Private Key di halaman Keychain tidak pernah ditulis ke mana pun oleh Komando: nilai itu tetap di memori paling lama 30 detik, dan salinan di clipboard diberi tanda agar pengelola clipboard melewatinya, tidak ikut ke perangkat Anda yang lain, dan dibersihkan setelah 90 detik kecuali Anda menyalin hal yang lebih baru. komando mencatat setiap penampilan di log auditnya (namanya, tidak pernah nilainya).',
    { h3: 'Di iPhone dan iPad' },
    { ul: [
      'Di pengaturan aplikasi: komputer komando yang sedang dipakai (pengguna, alamat, dan portnya, serta host key-nya setelah Anda mempercayainya), setiap komputer komando yang Anda pasangkan, apakah pemasangan selesai, dan apakah Anda menyalakan notifikasi. Dari versi yang punya masa percobaan, jika ada: `trialStart` dan `licenseKey`, yang dihapus saat aplikasi diperbarui.',
      'Di keychain: kunci API Anthropic Anda dan dua kunci SSH ponsel. Kunci dibuat di Secure Enclave dan tidak pernah keluar darinya; keychain hanya menyimpan referensi yang hanya berlaku di ponsel ini. Setiap komputer komando yang Anda tambahkan setelah yang pertama mendapat pasangan kunci sendiri.',
      'Di berkas aplikasi: jawaban terakhir dari tiap komputer komando untuk Home dan Targets, satu berkas per komputer. Isinya nama target, alamat, dan temuan komando, tidak pernah nilai rahasia. Berkas ini tidak ikut iCloud dan cadangan komputer, dan hanya bisa dibaca saat perangkat tidak terkunci.',
      'Notifikasi: aplikasi meminta izin ke iOS hanya saat Anda menyalakan Settings → Notifications → Notify Me, dan iOS bertanya sekali. Notifikasi memberi tahu bahwa pekerjaan latar selesai atau berhenti, atau bahwa sebuah forward berhenti. Isinya tidak pernah memuat nilai rahasia atau apa yang dicetak pekerjaan. Notifikasi dibuat di perangkat; tidak ada server yang mengirimnya.',
    ] },
    'Forget This Host di Settings melupakan komputer yang sedang dipakai: entrinya, berkas jawaban terakhirnya, dan pasangan kuncinya sendiri. Mematikan Notify Me menghentikan notifikasi; iOS Settings → Komando → Notifications mencabut izinnya. Settings → Agent → Remove Key menghapus kunci API dari keychain. Menghapus aplikasi menghapus pengaturannya, tetapi iOS dapat menyimpan item keychain aplikasi setelah aplikasi dihapus. Jika Anda menghapus aplikasi tanpa menghapus kuncinya lebih dulu, cabut kunci itu di akun Anthropic Anda (console.anthropic.com) agar tidak bisa dipakai.',
    'Data komando sendiri (`~/.komando` di komputer yang menjalankan komando: server Anda, vault, log audit) milik komando, bukan Komando. Menghapus aplikasi membiarkannya di tempat; hapus di sana jika Anda mau.',
    { h: 'Pilihan Anda' },
    { ul: ['Jangan tambahkan kunci API, dan agen tidak mengirim apa pun.', 'Pertanyaan tentang kebijakan ini: kirim email ke privacy@efolusi.com.'] },
    { h: 'Perubahan' },
    'Jika kebijakan ini berubah, versi baru muncul di sini dengan tanggal baru, dan catatan rilis menyebutkannya.',
  ],
};

export const support = {
  title: 'Dukungan (draf)',
  description: 'Draf halaman dukungan Komando.',
  h1: 'Dukungan',
  blocks: [
    { todo: ' Ini kerangka untuk App Review (baris O19 dan A22). Alamat dukungan dan pelacak masalah untuk aplikasi menunggu pemilik.' },
    { h: 'Dapatkan bantuan' },
    { ul: [
      'Baca [panduan pengguna](../../../../id/guide/index.html) untuk aplikasi dan [dokumentasi](../../../../id/docs/index.html) untuk baris perintah.',
      'Masalah dan usul untuk baris perintah: [GitHub issues](https://github.com/sgnd/komando/issues).',
    ] },
    { todo: ' Tempat melaporkan masalah aplikasi: alamat dukungan atau pelacak (O19).' },
    { h: 'Pertanyaan privasi' },
    'Kirim email ke privacy@efolusi.com. [Kebijakan privasi](privacy.html) menjelaskan apa yang disimpan dan dikirim Komando.',
    { h: 'Laporan keamanan' },
    'Laporkan masalah keamanan lewat `SECURITY.md` di repositori komando di GitHub, bukan di issue publik.',
    { todo: ' Tautkan alamat `SECURITY.md` yang tepat setelah jalur repositori final.' },
  ],
};

export const pricing = {
  title: 'Paket (draf)',
  description: 'Draf teks paket Komando. Tanpa harga.',
  h1: 'Paket',
  blocks: [
    { todo: ' Teks draf untuk baris U34 dan W27. Tidak ditautkan. Harga dan nama paket belum diputuskan (baris O03), jadi halaman ini tidak menyebut satu pun.' },
    'Aplikasi Komando untuk Mac, iPhone, dan iPad gratis saat ini. Peningkatan berbayar direncanakan dan belum dibuat. Peningkatan itu akan menambah layanan yang membutuhkan server kami, seperti sinkronisasi antarperangkat. Halaman ini akan memuat harganya setelah pemilik memutuskannya.',
    { h: 'Sebelum membeli: baris perintah tidak bisa sinkron' },
    'Sinkronisasi bekerja antaraplikasi Komando. Baris perintah di Linux dan Windows bukan perangkat sinkronisasi, jadi jika Anda hanya memakai baris perintah di sana, paket berbayar tidak memberi Anda apa pun untuk disinkronkan.',
    'Jalur gratis Anda tetap ada: simpan daftar Anda dengan `komando export --sealed --to FILE`, salin berkasnya ke komputer lain, lalu baca di sana dengan `komando import komando FILE`. Komando meminta kata sandi sepanjang 15 karakter atau lebih, dan berkas hanya terbuka dengan kata sandi itu.',
    { h: 'Yang selalu tetap gratis' },
    { ul: [
      'Semua yang dilakukan CLI hari ini dan yang ditambahkan kelak. CLI tidak punya fitur berbayar dan tidak akan pernah punya.',
      'Setiap layar Mac, iPhone, dan iPad yang bekerja pada data Anda sendiri, di satu perangkat atau dipasangkan ke host komando Anda sendiri.',
      'AI milik sendiri: kunci Anda sendiri, endpoint Anda sendiri, dan mode pribadi di perangkat saat tersedia.',
      'Keamanan lokal: jendela persetujuan, kode persetujuan, tanda terlindungi, dry run, kebijakan, penyamaran, dan log audit lokal dengan `audit verify`.',
      'Memindahkan data Anda sendiri: import, export, export dengan rahasia, ekspor ponsel tersegel dari Linux atau Windows, Save a sealed copy, dan pertukaran LAN yang dimulai oleh orang.',
      'Setelah paket berakhir: data lokal Anda, dan AI dengan kunci Anda sendiri.',
      'Widget, Live Activities, Shortcuts, dan notifikasi lokal, karena semuanya bekerja pada data lokal.',
      'Mencadangkan dan memulihkan data Anda sendiri (Time Machine, cadangan perangkat, komputer baru), dan tampilan terakhir yang diketahui saat host tidak terjangkau.',
      'Aksesibilitas, teks aplikasi terjemahan apa pun, dan kanal pembaruan (stable dan beta).',
      'Dukungan lewat GitHub issues dan dokumentasi, serta laporan keamanan lewat SECURITY.md.',
      'Tanpa masa percobaan di aplikasi gratis mana pun, dan tanpa telemetri.',
    ] },
    { todo: ' Daftar ini diterjemahkan dari plans.md, bagian "What always stays free". Dua catatan dibuang: "(if the owner confirms decision 9)" setelah pertukaran LAN (pastikan sebelum halaman ini tayang) dan penanda "(added by completeness check)"; "(owner decision 2026-11-12)" dibuang dari baris masa percobaan.' },
  ],
};
