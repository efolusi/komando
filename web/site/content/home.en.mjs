// The English copy of the home page and the shell. build.mjs renders it with Meridian's marketing components.
// A field named *Html holds a little inline markup (code, links, strong); every other field is plain text.
// The Indonesian twin is home.id.mjs (from i18n/home.id.md); build.mjs renders both.

export const release = 'v0.17.4';
export const installSha = '9089ae0c0fbe7689aaf327237c02267b6b7f39dd8060187f91b22f24b46fc4af';

export const meta = {
  lang: 'en',
  title: 'Komando · a DevOps command line for you and your AI agent',
  description: 'Free, open-source command line for servers, databases, caches, storage and VPNs, with free Komando apps for Mac, iPhone and iPad built and in testing.',
  ogDescription: 'One inventory, read-only by default, passwords out of the agent’s reach. Free and open source. The free Komando apps for Mac, iPhone and iPad are built and in testing.',
};

export const shell = {
  brandLabel: 'Komando home',
  skip: 'Skip to content',
  // the link to the other language, named in that language
  switch: { hrefLang: 'id', label: 'Bahasa Indonesia', ariaLabel: 'Baca halaman ini dalam bahasa Indonesia' },
  nav: [
    { id: 'product', label: 'Product', section: 'inventory' },
    { id: 'safety', label: 'Safety', section: 'safety' },
    { id: 'agent', label: 'Agent', section: 'agent' },
    { id: 'editions', label: 'Editions', section: 'editions' },
    { id: 'guide', label: 'Guide', page: 'guide/' },
    { id: 'docs', label: 'Docs', page: 'docs/' },
  ],
  install: 'Install komando',
  footer: {
    tagline: 'One safe command line for DevOps work.',
    columns: [
      { heading: 'Command line', links: [
        { label: 'Inventory', section: 'inventory' },
        { label: 'Safety', section: 'safety' },
        { label: 'Install', section: 'install' },
        { label: 'Docs', page: 'docs/' },
        { label: 'Source on GitHub', href: 'https://github.com/sgnd/komando' },
      ] },
      { heading: 'Komando apps', links: [
        { label: 'Agent', section: 'agent' },
        { label: 'Editions', section: 'editions' },
        { label: 'User guide', page: 'guide/' },
      ] },
    ],
    // {year} is worked out by build.mjs. The three links are efolusi.com's and show only once the draft pages are on.
    rights: '© {year} PT Efolusi Dunia Teknologi. All rights reserved.',
    legal: [
      { label: 'Platform terms', href: 'https://efolusi.com/en/terms' },
      { label: 'Privacy notice', href: 'https://efolusi.com/en/privacy' },
      { label: 'Status', href: 'https://stats.uptimerobot.com/SrVLCmD6V7' },
    ],
    trademarks: 'Product names and logos are trademarks of their owners.',
  },
};

// The not-found page (row W43): a title, one sentence, two links.
export const notFound = {
  title: 'Page not found',
  sub: 'The address may be mistyped, or the page has moved.',
  home: 'Home',
  docs: 'Docs',
};

export const hero = {
  releaseLabel: 'Latest komando release:',
  title: 'DevOps command line for you and your AI agent',
  sub: 'Servers, databases, caches, storage and VPNs in one inventory, read-only until you say otherwise. The command line, komando, is free and open source. Komando with a capital K, the free app for Mac, iPhone and iPad that runs it, is built and in testing.',
  primary: 'Install komando',
  secondary: 'Read the user guide',
};

// the kinds of target in one inventory, as #inventory names them
export const targets = {
  label: 'What komando reaches',
  items: ['Servers', 'Databases', 'Caches', 'Storage', 'Clusters', 'Registries', 'VPNs'],
};

export const oneCommand = {
  titleHtml: 'The komando command line puts SSH sessions, a database client, <span class="nw">redis-cli</span>, storage consoles, kubectl and VPNs behind one command.',
  ledeHtml: 'It gives your AI agent the same reach without showing it a <strong>single password</strong>.',
  swapLabel: 'The tool you use today and the komando line that does the same job',
  swap: [
    ['ssh', 'komando exec web-1 -- uptime'],
    ['psql', 'komando db schema prod-db users'],
    ['redis-cli', 'komando cache get prod-redis session:42'],
    ['aws s3 ls', 'komando storage list backups 2026/'],
    ['kubectl', 'komando cluster status prod-k8s'],
    ['wg-quick', 'komando vpn up office'],
  ],
  agentsHtml: 'AI agents komando recognises by itself. For any other agent, set <code>KOMANDO_AGENT=1</code>.',
  agents: [
    ['claude-code', 'Claude Code'],
    ['openai', 'Codex'],
    ['cursor', 'Cursor'],
    ['gemini', 'Gemini CLI'],
  ],
};

export const inventory = {
  title: 'One inventory for every server and service',
  lede: 'Add a target once and reach it by name. Servers, databases, caches, storage, clusters, registries and VPNs share one list that you, your scripts and your agent all read.',
  link: 'See how secrets and output work',
  alt: 'You, your scripts and your AI agent all go through komando to reach servers, databases, caches, storage, clusters and VPNs.',
  sourcesLabel: 'Who asks',
  reachLabel: 'What komando reaches',
  sources: [
    ['person', 'You', 'Plain text'],
    ['curlybraces', 'Scripts and CI', '-o json'],
    ['text-bubble', 'AI agent', 'No passwords'],
  ],
  core: 'komando',
  // the glyph, the name, what komando does there, and the family tint from the apps' design/tokens.json
  reach: [
    ['server-rack', 'Servers', 'SSH', 'servers'],
    ['cylinder', 'Databases', 'Queries', 'db'],
    ['memorychip', 'Caches', 'Keys', 'cache'],
    ['archivebox', 'Storage', 'Buckets', 'storage'],
    ['hexagongrid', 'Clusters', 'kubectl', 'db'],
    ['vpn', 'VPNs', 'Forwards', 'vpn'],
  ],
};

export const safety = {
  title: 'Every target starts read-only',
  lede: 'Dangerous commands are blocked. Production targets can be protected, so they ask first. A full audit log keeps what was done and by whom.',
  rows: [
    ['Look first', '<span class="nw">read-only</span> by default'],
    ['Ask first', 'protected targets'],
    ['Check the record', '<code>komando audit verify</code>'],
  ],
  link: 'See what is free and what is coming',
};

export const features = {
  titleHtml: 'Secrets, output and history. <span class="site-muted">Handled the same way on every machine.</span>',
  cards: [
    { icon: 'key', screen: 'keychain', title: 'komando\'s keychain holds every secret',
      bodyHtml: 'Passwords stay in komando\'s encrypted keychain or your own password manager. An agent komando recognises gets the result, never the secret.' },
    { icon: 'code', screen: 'output', title: 'Every komando answer as text or JSON',
      bodyHtml: 'People read plain text. Scripts, CI jobs and agents add -o json and get the same answer as data they can parse.' },
    { icon: 'file-text', screen: 'audit', title: 'An audit log of every command',
      bodyHtml: '<code>komando audit</code> lists what was done and by whom. <code>komando audit verify</code> checks that nobody edited the record.' },
    { icon: 'package', screen: 'clients', title: 'One komando binary, clients built in',
      bodyHtml: 'Its own SSH, database and VPN clients are built in, in one file.' },
  ],
};

export const agent = {
  title: 'An agent that runs komando and asks first',
  lede: 'Press ⌘J on the Mac, or open the Agent tab on iPhone, and describe the problem. The agent runs komando, shows every command and asks before any change, on Claude Opus 5.5 with your own Anthropic API key.',
  link: 'See what the apps do',
};

export const editions = {
  title: 'Free, with an upgrade later',
  lede: 'The Komando apps for Mac, iPhone and iPad are built and in testing, with no download link and no date yet. They will be free, like the command line, and run komando on your own machines, with no account and no trial.',
  free: { head: ['Free, everything local', 'Where'], rows: [
    ['Every command, as text or JSON', 'komando'],
    ['Terminal tabs, database client, forwards', 'Mac'],
    ['One-click fixes, the agent, menu bar', 'Mac'],
    ['Fixes, quick checks and the agent on the go', 'iPhone and iPad'],
  ] },
  later: { head: ['Upgrade, later', 'Not built yet'], rows: [
    ['Sync between your devices', 'Coming'],
    ['Teams', 'Coming'],
    ['Built-in AI, with no API key of your own', 'Coming'],
    ['Approve changes from your phone', 'Coming'],
  ] },
};

export const install = {
  title: 'Install komando on macOS, Linux or Windows',
  copy: 'Copy command',
  // {release} is the tag; the link keeps data-release so set_release.py finds it
  ledeHtml: 'One line installs release <a class="site-link" href="https://github.com/sgnd/komando/releases/tag/{release}" data-release>{release}</a>. Then run <code>komando version</code> to check it. The source is on <a class="site-link" href="https://github.com/sgnd/komando">GitHub</a>.',
  unix: {
    title: 'macOS, Linux and Windows',
    body: 'Open a terminal and run this line. On Windows, komando runs through WSL: open a WSL terminal and run the same line.',
    checkHtml: '<b>Check it first.</b> Download the script, read it, then run it. Its sha256 is',
    signed: 'The installer checks that the release is signed with the komando project\'s key (the check <code>komando update</code> makes) and installs nothing otherwise.',
  },
  go: {
    title: 'With Go 1.27.4 or newer',
    body: 'With Go installed, this line builds komando from its source.',
  },
};

export const closing = {
  title: 'Your first ten minutes with Komando',
  lede: 'Install komando, add one server and log in to it. Free and open source under AGPL-3.0; the Komando apps will be free too.',
  action: 'Read the first guide page',
};
