// English copy of the draft pages (row W28). Blocks: a string is a paragraph; { h }, { h3 }, { ul }, { pre }, { todo }.
// Inline: `code` and [label](href). Every open point is a { todo } block or the word TODO, shown on the page:
// web/deploy/check_download.py refuses to switch a page on while one is left.

export const banner = {
  label: 'Draft.',
  text: 'Not published: this page is not linked, not in the sitemap and not deployed. Do not rely on it.',
};

export const download = {
  title: 'Komando for Mac: download (draft)',
  description: 'Draft of the Komando for Mac download page.',
  h1: 'Komando for Mac',
  notReleased: {
    title: 'The Mac app is not released yet',
    body: [
      'There is no Mac download yet, and this page names no version and no checksum until there is one.',
      'The command line, komando, is free and available today. The install line and the checksum check are on the home page.',
    ],
    link: '[Install komando from the home page](../../../../index.html#install)',
  },
  released: {
    title: 'Download',
    lead: 'Komando {version} for Mac.',
    get: 'Download Komando for Mac',
    checkTitle: 'Check the download',
    checkBody: 'The SHA-256 checksum of the file is `{sha}`. Compare it with the checksum of the file you downloaded:',
    notes: 'Release notes',
  },
  requirements: {
    title: 'System requirements',
    items: ['macOS {macos} or newer.'],
  },
  signing: {
    title: 'Signed and notarized',
    body: ['The Mac app is signed with a Developer ID certificate and notarized by Apple, so macOS opens it without a warning about an unknown developer. This holds once a release ships; there is none yet.'],
  },
  updates: {
    title: 'Updates',
    body: 'The app checks its update feed over HTTPS and verifies a signature before it installs anything. The feed and the archives live at these paths on the download host:',
    convention: 'feed:    {path}\narchive: {archive}',
  },
  open: [
    { todo: ' Host name: set `downloadHost` in `content/drafts/config.json` once the host of row O19 exists.' },
    { todo: ' Whether the build runs on Apple silicon only or on Intel too (system requirements).' },
    { todo: ' Release notes address (`releaseNotesUrl`), and the feed format and paths, which row M38 builds and confirms.' },
  ],
};

export const privacy = {
  title: 'Privacy policy (draft)',
  description: 'Draft of the Komando privacy policy for Mac, iPhone and iPad.',
  h1: 'Privacy policy',
  blocks: [
    { todo: ' Effective date. Publish this page at a public URL (the App Store needs it) and have it checked before release (rows O19 and A22).' },
    'Applies to Komando for Mac, iPhone and iPad.',
    { h: 'The short version' },
    'Komando keeps your data on your device. We do not collect anything: no account, no analytics, no crash reports, no tracking. Komando is free and has no trial, so there is no payment either.',
    'Only one thing leaves your device for anyone but your own servers, and only when you start it: what the agent sends to Anthropic, on your own API key (see below for exactly what). If a paid upgrade comes later, this policy will say what it sends before it ships.',
    { h: 'What stays on your device' },
    'Your servers, databases, caches and other targets, their passwords and keys, your audit log and your query history stay on your devices, in komando’s folder (`~/.komando`) and in the app’s own settings and keychain (listed below). We never see them.',
    'When you use Komando, it talks to your own servers and services through komando, and on iPhone and iPad to your own komando computer over SSH. That traffic goes straight from your device to them. It does not pass through us.',
    { h: '1. The agent (optional)' },
    'The agent (⌘J on the Mac, the Agent tab on iPhone and iPad) works only after you add your own Anthropic API key. If you never add a key, the agent sends nothing.',
    'Each time you ask the agent something, Komando sends one request to Anthropic’s API (`api.anthropic.com`) with your key. The request holds:',
    { ul: [
      'The agent’s instructions and its one tool, the `komando` command. These are the same for everyone.',
      'A short note about what you are looking at, written by the app before your question: the agent’s mode (Ask or Act) and the targets you put in its scope.',
      'On the Mac, the screen you are on: for a server or connection, its name, its kind and where it is (`user@address` for a server, the address for a connection); for a terminal tab, the command it runs; for a recipe run, the recipe, where it ran and a one-line result; if you asked about a doctor finding, that finding.',
      'On the Mac, up to 20 of komando’s doctor findings, in plain words.',
      'Your inventory, up to 200 targets: each one’s name and kind, and whether it is protected. On the Mac, also its groups. On iPhone and iPad, the note also says you are on your phone.',
      'The whole conversation so far: your messages, the agent’s answers, the komando commands it ran, and what komando printed back. That can be a list of your servers, a log, a file or a query result. The app runs komando as an agent, so komando hides secret values (passwords, keys, tokens) before the agent sees them.',
    ] },
    'Anthropic handles this under its own terms and privacy policy, on your API account. We do not receive a copy. New Conversation starts over: earlier messages are not sent again.',
    { h: '2. Payment' },
    'Today there is nothing to pay. Komando for Mac, iPhone and iPad is free, has no trial, takes no payment and sends nothing about a purchase.',
    { todo: ' Rewrite the next paragraph before the upgrade ships.' },
    'Later, a paid upgrade may add services that need our server: sync between devices, teams, the built-in AI and approvals on the phone. None is built. Before any of it ships, this policy will say what each service stores on our server, who processes the payment (for example Apple, through in-app purchase) and what we receive from them.',
    'The iPhone and iPad app’s privacy manifest says the same for Apple: no tracking, and the agent’s requests as user content that is not linked to you and used only to answer you. It also names the one required-reason API the app uses, UserDefaults, for its own settings (reason CA92.1).',
    { h: 'What Komando keeps, and how to remove it' },
    { h3: 'On the Mac' },
    { ul: [
      'Settings: appearance, recent targets, the komando path you chose, the menu bar and notifications, in `~/Library/Preferences/com.efolusi.komando.plist`. Quit Komando, then run `defaults delete com.efolusi.komando` in Terminal.',
      'From a version with a trial, if present: the keys `trialStart`, `trialReminded` and `licenseKey`, and the files `trial` and `license.key`, in the settings file and in `~/Library/Application Support/Komando/`. Updating Komando removes them, or delete them by hand.',
      'Query history: older versions keep it in the settings file (`queryHistory.<connection>`); newer versions in `~/Library/Application Support/Komando/History/queries.json`, left out of backups, and never a statement that looks like it holds a password. In newer versions, use Clear History in the database tab’s ⋯ menu. In any version, delete the file or the settings.',
      'Your Anthropic API key: in the keychain, item `com.efolusi.komando.anthropic`. Use Settings → Agent → Remove Key, or delete the item in Keychain Access.',
      'The agent’s token counts per task (time, model, steps, tool calls, tokens; never a question, an answer or a command): `~/Library/Application Support/Komando/agent-usage.jsonl`, left out of backups, never sent anywhere. Use Settings → Agent → Usage → Clear, or delete the file.',
      'Saved workspaces: each workspace’s name and its tabs (target names, terminal commands and tab titles, and how the panes were split; never a password or what a terminal printed). Use ⌘K, then Delete Workspace, or `defaults delete com.efolusi.komando KomandoWorkspaces`.',
      'Saved forwards: for each, the server or connection it goes through, the rule (like `8080:localhost:80`) and the local port. Use Remove Saved Forward in Port Forwarding, or `defaults delete com.efolusi.komando KomandoSavedForwards`.',
    ] },
    'A value or private key you show with Show, Copy Value or Show Private Key on the Keychain page is never written anywhere by Komando: it stays in memory for at most 30 seconds, and a copy on the clipboard is marked so clipboard managers skip it, stays off your other devices, and is cleared after 90 seconds unless you copied something newer. komando records each reveal in its audit log (the name, never the value).',
    { h3: 'On iPhone and iPad' },
    { ul: [
      'In the app’s settings: the komando computer in use (its user, address and port, and its host key once you trusted it), every komando computer you paired with, whether pairing finished, and whether you turned on notifications. From a version with a trial, if present: `trialStart` and `licenseKey`, which updating the app removes.',
      'In the keychain: your Anthropic API key and the phone’s two SSH keys. The keys are made in the Secure Enclave and never leave it; the keychain holds only a reference that works on this phone alone. Each komando computer you add after the first gets its own pair.',
      'In the app’s files: the last answers from each komando computer for Home and Targets, one file per computer. They hold target names, addresses and komando’s findings, never a secret value. The files are left out of iCloud and computer backups and can be read only while the device is unlocked.',
      'Notifications: the app asks iOS for permission only when you turn on Settings → Notifications → Notify Me, and iOS asks you once. A notice says that a background job finished or stopped, or that a forward stopped. It never holds a secret value or what a job printed. The notices are made on the device; no server sends them.',
    ] },
    'Forget This Host in Settings forgets the computer in use: its entry, its last answers file, and its own key pair. Turning off Notify Me stops the notices; iOS Settings → Komando → Notifications withdraws the permission. Settings → Agent → Remove Key deletes the API key from the keychain. Deleting the app removes its settings, but iOS can keep an app’s keychain items after the app is deleted. If you deleted the app without removing the key first, revoke the key in your Anthropic account (console.anthropic.com) so it cannot be used.',
    'komando’s own data (`~/.komando` on the computer that runs komando: your servers, the vault, the audit log) belongs to komando, not to Komando. Removing the app leaves it in place; remove it there if you want.',
    { h: 'Your choices' },
    { ul: ['Do not add an API key, and the agent sends nothing.', 'Questions about this policy: email privacy@efolusi.com.'] },
    { h: 'Changes' },
    'If this policy changes, the new version appears here with a new date, and the release notes say so.',
  ],
};

export const support = {
  title: 'Support (draft)',
  description: 'Draft of the Komando support page.',
  h1: 'Support',
  blocks: [
    { todo: ' This is a skeleton for App Review (rows O19 and A22). The support address and the issue tracker for the apps wait on the owner.' },
    { h: 'Get help' },
    { ul: [
      'Read the [user guide](../../../../guide/index.html) for the apps and the [docs](../../../../docs/index.html) for the command line.',
      'Command line problems and ideas: [GitHub issues](https://github.com/sgnd/komando/issues).',
    ] },
    { todo: ' Where an app problem is reported: the support address or tracker (O19).' },
    { h: 'Privacy questions' },
    'Email privacy@efolusi.com. The [privacy policy](privacy.html) says what Komando keeps and sends.',
    { h: 'Security reports' },
    'Report a security problem through `SECURITY.md` in the komando repository on GitHub, not in a public issue.',
    { todo: ' Link the exact `SECURITY.md` address once the repository path is final.' },
  ],
};

export const pricing = {
  title: 'Plans (draft)',
  description: 'Draft of the Komando plans text. No prices.',
  h1: 'Plans',
  blocks: [
    { todo: ' Draft text for rows U34 and W27. Not linked. No price or plan name is decided (row O03), so this page names none.' },
    'The Komando apps for Mac, iPhone and iPad are free today. A paid upgrade is planned and not built. It would add services that need our server, such as sync between devices. This page will list the price when the owner has decided it.',
    { h: 'Before you buy: the command line cannot sync' },
    'Sync works between the Komando apps. The command line on Linux and Windows is not a sync device, so if you only use the command line there, a paid plan gives you nothing to sync.',
    'Your own free path stays: save your list with `komando export --sealed --to FILE`, copy the file to the other computer, and read it there with `komando import komando FILE`. Komando asks for a passphrase of 15 characters or more, and the file opens only with it.',
    { h: 'What always stays free' },
    { ul: [
      'Everything the CLI does today and adds later. The CLI has no paid features and never will.',
      'Every Mac, iPhone and iPad screen that works on your own data, on one device or paired to your own komando host.',
      'Bring-your-own AI: your own key, your own endpoint, and the private on-device mode when it comes.',
      'Local safety: the approval window, the approval code, protected marks, dry runs, policy, masking, and the local audit log with `audit verify`.',
      'Moving your data yourself: import, export, export with secrets, the sealed phone export from Linux or Windows, Save a sealed copy, and a person-started LAN exchange.',
      'After a plan ends: your local data, and AI with your own key.',
      'Widgets, Live Activities, Shortcuts and local notifications, because they work on local data.',
      'Backing up and restoring your own data (Time Machine, a device backup, a new computer), and the last-known view when a host cannot be reached.',
      'Accessibility, any translated app text, and update channels (stable and beta).',
      'Support through GitHub issues and the docs, and security reports through SECURITY.md.',
      'No trial anywhere in the free apps, and no telemetry.',
    ] },
    { todo: ' The list is word for word from plans.md, section "What always stays free". Two notes were taken out: "(if the owner confirms decision 9)" after the LAN exchange (confirm before this page goes live) and the "(added by completeness check)" tags; "(owner decision 2026-11-12)" was dropped from the trial line.' },
  ],
};
