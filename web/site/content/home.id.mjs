// The Indonesian copy of the home page and the shell, from i18n/home.id.md. build.mjs renders it to id/index.html and
// _shell/id/. Same fields as home.en.mjs; the release and the install script's sha256 are the English file's, so
// set_release.py writes them once. Product names, commands, flags and file names stay as they are.
// Fields the source did not give (marked in the W02 report for a native reader) are written in the same voice.

export { release, installSha } from './home.en.mjs';

export const meta = {
  lang: 'id',
  title: 'komando, command line DevOps untuk Anda dan agen AI Anda',
  description: 'Server, database, cache, storage, dan VPN dalam satu inventaris, hanya-baca sampai Anda izinkan. Gratis dan open source.',
  ogDescription: 'Satu inventaris, hanya-baca secara default, kata sandi di luar jangkauan agen. Gratis dan open source. Aplikasi Komando gratis untuk Mac, iPhone, dan iPad sudah dibuat dan sedang diuji.',
};

export const shell = {
  brandLabel: 'Beranda Komando',
  skip: 'Langsung ke konten',
  // the link to the other language, named in that language
  switch: { hrefLang: 'en', label: 'English', ariaLabel: 'Read this page in English' },
  nav: [
    { id: 'product', label: 'Produk', section: 'inventory' },
    { id: 'safety', label: 'Keamanan', section: 'safety' },
    { id: 'agent', label: 'Agen', section: 'agent' },
    { id: 'editions', label: 'Edisi', section: 'editions' },
    { id: 'guide', label: 'Panduan', page: 'guide/' },
    { id: 'docs', label: 'Dokumentasi', page: 'docs/' },
  ],
  install: 'Instal komando',
  footer: {
    tagline: 'Satu command line yang aman untuk pekerjaan DevOps.',
    columns: [
      { heading: 'Command line', links: [
        { label: 'Inventaris', section: 'inventory' },
        { label: 'Keamanan', section: 'safety' },
        { label: 'Instal', section: 'install' },
        { label: 'Dokumentasi', page: 'docs/' },
        { label: 'Kode sumber di GitHub', href: 'https://github.com/sgnd/komando' },
      ] },
      { heading: 'Aplikasi Komando', links: [
        { label: 'Agen', section: 'agent' },
        { label: 'Edisi', section: 'editions' },
        { label: 'Panduan', page: 'guide/' },
      ] },
    ],
    rights: '© 2026 Komando',
    trademarks: 'Nama produk dan logo adalah merek dagang pemiliknya.',
  },
};

export const hero = {
  releaseLabel: 'Rilis komando terbaru:',
  title: 'Command line DevOps untuk Anda dan agen AI Anda',
  sub: 'Server, database, cache, storage, dan VPN dalam satu inventaris, hanya-baca sampai Anda izinkan. Command line-nya, komando, gratis dan open source. Aplikasi Komando (K besar) untuk Mac, iPhone, dan iPad yang menjalankannya juga gratis. Aplikasinya sudah dibuat dan sedang diuji.',
  primary: 'Instal komando',
  secondary: 'Baca panduan',
};

export const targets = {
  label: 'Yang dijangkau komando',
  items: ['Server', 'Database', 'Cache', 'Storage', 'Cluster', 'Registry', 'VPN'],
};

export const oneCommand = {
  titleHtml: 'Command line komando menggabungkan sesi SSH, klien database, <span class="nw">redis-cli</span>, dan lainnya dalam satu perintah.',
  ledeHtml: 'Agen AI Anda mendapat jangkauan yang sama tanpa pernah melihat <strong>satu kata sandi pun</strong>.',
  swapLabel: 'Alat yang Anda pakai sekarang dan baris komando yang mengerjakan hal yang sama',
  swap: [
    ['ssh', 'komando exec web-1 -- uptime'],
    ['psql', 'komando db schema prod-db users'],
    ['redis-cli', 'komando cache get prod-redis session:42'],
    ['aws s3 ls', 'komando storage list backups 2026/'],
    ['kubectl', 'komando cluster status prod-k8s'],
    ['wg-quick', 'komando vpn up office'],
  ],
  agentsHtml: 'komando mengenali agen AI di atas dengan sendirinya. Untuk agen lain, setel <code>KOMANDO_AGENT=1</code>.',
  agents: [
    ['claude-code', 'Claude Code'],
    ['openai', 'Codex'],
    ['cursor', 'Cursor'],
    ['gemini', 'Gemini CLI'],
  ],
};

export const inventory = {
  title: 'Satu inventaris untuk semua server dan layanan',
  lede: 'Tambahkan target sekali, lalu panggil dengan namanya. Server, database, cache, storage, cluster, registry, dan VPN ada dalam satu daftar yang dibaca oleh Anda, skrip Anda, dan agen Anda.',
  link: 'Lihat cara kerja rahasia dan output',
  alt: 'Anda, skrip Anda, dan agen AI Anda semuanya lewat komando untuk menjangkau server, database, cache, storage, cluster, dan VPN.',
  sourcesLabel: 'Siapa yang meminta',
  reachLabel: 'Yang dijangkau komando',
  sources: [
    ['person', 'Anda', 'Teks biasa'],
    ['curlybraces', 'Skrip dan CI', '-o json'],
    ['text-bubble', 'Agen AI', 'Tanpa kata sandi'],
  ],
  core: 'komando',
  reach: [
    ['server-rack', 'Server', 'SSH', 'servers'],
    ['cylinder', 'Database', 'Query', 'db'],
    ['memorychip', 'Cache', 'Key', 'cache'],
    ['archivebox', 'Storage', 'Bucket', 'storage'],
    ['hexagongrid', 'Cluster', 'kubectl', 'db'],
    ['vpn', 'VPN', 'Forward', 'vpn'],
  ],
};

export const safety = {
  title: 'Setiap target mulai dalam mode hanya-baca',
  lede: 'Perintah berbahaya diblokir. Target produksi bisa dilindungi, jadi komando bertanya dulu. Log audit lengkap mencatat apa yang dijalankan dan oleh siapa.',
  rows: [
    ['Lihat dulu', '<span class="nw">hanya-baca</span> secara default'],
    ['Tanya dulu', 'target yang dilindungi'],
    ['Cek catatannya', '<code>komando audit verify</code>'],
  ],
  link: 'Lihat apa yang gratis dan apa yang akan datang',
};

export const features = {
  titleHtml: 'komando menangani rahasia, output, dan riwayat <span class="site-muted">dengan cara yang sama di setiap mesin.</span>',
  cards: [
    { icon: 'key', screen: 'keychain', title: 'Keychain komando menyimpan setiap rahasia',
      bodyHtml: 'Kata sandi tetap di keychain terenkripsi milik komando atau di password manager Anda sendiri. Agen yang dikenali komando mendapat hasilnya, tidak pernah rahasianya.' },
    { icon: 'code', screen: 'output', title: 'Setiap jawaban komando dalam teks atau JSON',
      bodyHtml: 'Orang membaca teks biasa. Skrip, job CI, dan agen menambahkan -o json dan mendapat jawaban yang sama sebagai data yang bisa diolah.' },
    { icon: 'file-text', screen: 'audit', title: 'Log audit untuk setiap perintah',
      bodyHtml: '<code>komando audit</code> mencantumkan apa yang dijalankan dan oleh siapa. <code>komando audit verify</code> memeriksa bahwa tidak ada yang mengubah catatannya.' },
    { icon: 'package', screen: 'clients', title: 'Satu binary komando, klien sudah di dalamnya',
      bodyHtml: 'Klien SSH, database, dan VPN-nya sendiri sudah terpasang, dalam satu file.' },
  ],
};

export const agent = {
  title: 'Agen yang menjalankan komando dan bertanya dulu',
  lede: 'Tekan ⌘J di Mac, atau buka tab Agent di iPhone, lalu jelaskan masalahnya. Agen menjalankan komando, menampilkan setiap perintah, dan bertanya sebelum mengubah apa pun, dengan Claude Opus 5.5 dan API key Anthropic milik Anda sendiri.',
  link: 'Lihat apa yang dilakukan aplikasinya',
};

export const editions = {
  title: 'Gratis sekarang, upgrade nanti',
  lede: 'Aplikasi Komando untuk Mac, iPhone, dan iPad sudah dibuat dan sedang diuji, tetapi belum ada link unduh dan belum ada tanggal. Aplikasinya akan gratis, sama seperti command line-nya, dan menjalankan komando di mesin Anda sendiri, tanpa akun dan tanpa masa uji coba.',
  free: { head: ['Gratis, semuanya lokal', 'Di mana'], rows: [
    ['Setiap perintah, dalam teks atau JSON', 'komando'],
    ['Tab terminal, klien database, port forwarding', 'Mac'],
    ['Perbaikan sekali klik, agen, menu bar', 'Mac'],
    ['Perbaikan, cek cepat, dan agen saat bepergian', 'iPhone dan iPad'],
  ] },
  later: { head: ['Upgrade, nanti', 'Belum dibuat'], rows: [
    ['Sinkronisasi antar perangkat', 'Segera'],
    ['Tim', 'Segera'],
    ['AI bawaan, tanpa API key sendiri', 'Segera'],
    ['Setujui perubahan dari ponsel', 'Segera'],
  ] },
};

export const install = {
  title: 'Instal komando di macOS, Linux, atau Windows',
  copy: 'Salin perintah',
  ledeHtml: 'Satu baris menginstal rilis <a class="site-link" href="https://github.com/sgnd/komando/releases/tag/{release}" data-release>{release}</a>. Lalu jalankan <code>komando version</code> untuk memeriksanya. Kode sumbernya ada di <a class="site-link" href="https://github.com/sgnd/komando">GitHub</a>.',
  unix: {
    title: 'macOS, Linux, dan Windows',
    body: 'Buka terminal dan jalankan baris ini. Di Windows, komando berjalan lewat WSL: buka terminal WSL dan jalankan baris yang sama.',
    checkHtml: '<b>Periksa installer-nya dulu.</b> Unduh skripnya, baca, lalu jalankan. sha256-nya adalah',
    signed: 'Installer memastikan rilisnya ditandatangani dengan kunci proyek komando (pemeriksaan yang sama dengan <code>komando update</code>) dan tidak menginstal apa pun jika gagal.',
  },
  go: {
    title: 'Dengan Go 1.27.4 atau lebih baru',
    body: 'Kalau Go sudah terpasang, baris ini membangun komando dari kode sumbernya.',
  },
};

export const closing = {
  title: 'Sepuluh menit pertama Anda dengan Komando',
  lede: 'Instal komando, tambahkan satu server, lalu login ke server itu. Gratis dan open source dengan lisensi AGPL-3.0; aplikasi Komando juga akan gratis.',
  action: 'Baca halaman panduan pertama',
};

// The drawn app screens are the app's own English interface and are shared with the English page. Only their
// description for screen readers, and the few lines i18n/home.id.md gives, are Indonesian: build.mjs swaps them in
// and stops if a line it expects is not in the screen.
export const screens = {
  home: { label: 'Layar Home Komando: dua temuan di bawah Needs attention, dua VPN dan satu forward berjalan, serta aktivitas terbaru' },
  keychain: { label: 'Keychain Komando: empat rahasia dan dua SSH key, masing-masing terkunci, masing-masing dengan keterangan apa yang memakainya' },
  output: { label: 'Sebuah skrip berisi perintah komando: komando list dan komando facts untuk orang, perintah yang sama dengan -o json untuk skrip, CI, dan agen' },
  audit: { label: 'Log audit Komando, disaring dengan All: enam entri, siapa yang menjalankan masing-masing dan di mana; satu pembacaan cache gagal dan satu restart di web-1 diblokir' },
  clients: { label: 'Klien di dalam komando: SSH, database, dan VPN, semuanya sudah terpasang' },
  safety: {
    label: 'Halaman Hosts Komando: web-1, web-2, dan bastion di bawah production memakai gembok karena dilindungi; staging-1 dan staging-2 tidak. Di atasnya, komando menghentikan restart di web-1: This target is protected. Perintah yang akan dijalankan, dengan --yes, dan dua tombol: Cancel dan Run Anyway',
    replace: [['<p class="khosts__group">Production</p>', '<p class="khosts__group">Produksi</p>']],
  },
  agent: {
    label: 'Agen Komando di samping terminal web-1: agen memeriksa kunci di prod-db, menemukan query 48213 menahan tabel orders, dan bertanya dulu sebelum membatalkannya di prod-db yang dilindungi',
    replace: [
      ['<p>The app on web-1 is waiting for prod-db.</p>', '<p>Aplikasi di web-1 sedang menunggu prod-db.</p>'],
      ['<p>Query 48213 has held the orders table for 14 minutes.</p>', '<p>Query 48213 sudah menahan tabel orders selama 14 menit.</p>'],
    ],
  },
  upgrade: {
    label: 'Lembar Upgrade Komando: Komando gratis. Semua di Mac ini gratis, seperti command line komando; upgrade nanti menambah layanan yang butuh server. Empat fitur bertanda Coming: sinkronisasi antar perangkat, tim, AI bawaan, setujui dari ponsel. Belum ada yang bisa dibeli.',
    replace: [['Nothing to buy yet. Komando says so here when the upgrade is ready.', 'Belum ada yang bisa dibeli. Komando akan mengabarkannya di sini saat upgrade siap.']],
  },
};
