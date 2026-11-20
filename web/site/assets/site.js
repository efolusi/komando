// The site's only browser script: the theme button, the header's menu, the Marquee's pause button, the Copy buttons
// and the guide's folding page list. The markup is Meridian's, rendered to static HTML by build.mjs; this file follows
// the behaviour of Meridian's ThemeToggle, SiteHeader and Marquee (theme contract: guidelines/theming.md).
// Once Meridian 1.27.0 ships these as plain scripts (MD14), this file imports them instead.

const STORAGE_KEY = 'efolusi-theme';
const PREFERENCES = ['light', 'dark', 'system'];
const YEAR = 60 * 60 * 24 * 365;

const LABELS = {
  en: { system: 'System theme', light: 'Light theme', dark: 'Dark theme', next: 'switch to',
    pause: 'Pause the moving list', play: 'Play the moving list',
    copied: 'Copied. Paste it into your terminal.',
    blocked: 'The browser blocked the clipboard. The command is selected: press Cmd-C or Ctrl-C.' },
  id: { system: 'Tema sistem', light: 'Tema terang', dark: 'Tema gelap', next: 'ganti ke',
    pause: 'Jeda daftar berjalan', play: 'Putar daftar berjalan',
    copied: 'Tersalin. Tempel ke terminal Anda.',
    blocked: 'Browser memblokir clipboard. Perintahnya sudah terpilih: tekan Cmd-C atau Ctrl-C.' },
};
const ICON = { light: 'sun', dark: 'moon', system: 'monitor' };

export function nextPreference(pref) {
  const i = PREFERENCES.indexOf(pref);
  return i < 0 ? 'light' : PREFERENCES[(i + 1) % PREFERENCES.length];
}

/** The saved choice on this origin, then the cookie another Efolusi site left (dark|light), else system. */
export function readPreference(storage, cookie) {
  try {
    const saved = storage?.getItem(STORAGE_KEY);
    if (PREFERENCES.includes(saved)) return saved;
  } catch {
    // storage blocked: the cookie still carries the resolved theme
  }
  const m = /(?:^|;\s*)efolusi_theme=(dark|light)(?:;|$)/.exec(cookie || '');
  return m ? m[1] : 'system';
}

export function resolveTheme(pref, prefersDark) {
  if (pref === 'light' || pref === 'dark') return pref;
  return prefersDark ? 'dark' : 'light';
}

/** The cookie holds only the resolved light or dark, on .efolusi.com so the other Efolusi sites inherit it. */
export function themeCookie(theme, hostname, protocol) {
  const domain = hostname === 'efolusi.com' || hostname.endsWith('.efolusi.com') ? '; Domain=.efolusi.com' : '';
  const secure = protocol === 'https:' ? '; Secure' : '';
  return `efolusi_theme=${theme === 'dark' ? 'dark' : 'light'}${domain}; Path=/; Max-Age=${YEAR}; SameSite=Lax${secure}`;
}

function icon(doc, name) {
  const t = doc.getElementById(`icon-${name}`);
  return t ? t.content.firstElementChild.cloneNode(true) : null;
}

function swapIcon(doc, button, name) {
  const next = icon(doc, name);
  const old = button.querySelector('[data-slot="icon"]');
  if (next && old) old.replaceWith(next);
}

function setupTheme(doc, win, text) {
  const dark = win.matchMedia('(prefers-color-scheme: dark)');
  const storage = (() => { try { return win.localStorage; } catch { return null; } })();
  let pref = readPreference(storage, doc.cookie);

  const apply = () => {
    const theme = resolveTheme(pref, dark.matches);
    if (theme === 'dark') doc.documentElement.setAttribute('data-theme', 'dark');
    else doc.documentElement.removeAttribute('data-theme');
    return theme;
  };
  const show = () => {
    const next = nextPreference(pref);
    for (const b of doc.querySelectorAll('[data-slot="theme-toggle"]')) {
      b.dataset.preference = pref;
      b.title = text[pref];
      b.setAttribute('aria-label', `${text[pref]}, ${text.next} ${text[next].toLowerCase()}`);
      swapIcon(doc, b, ICON[pref]);
    }
  };

  apply();
  show();
  for (const b of doc.querySelectorAll('[data-slot="theme-toggle"]')) {
    b.addEventListener('click', () => {
      pref = nextPreference(pref);
      try { storage?.setItem(STORAGE_KEY, pref); } catch { /* blocked: the cookie still carries it */ }
      doc.cookie = themeCookie(apply(), win.location.hostname, win.location.protocol);
      show();
    });
  }
  // under System, follow the OS when it changes, and keep the cookie on the new resolved theme
  dark.addEventListener('change', () => {
    if (pref === 'system') doc.cookie = themeCookie(apply(), win.location.hostname, win.location.protocol);
  });
  // the same choice made in another tab
  win.addEventListener('storage', (e) => {
    if (e.key !== null && e.key !== STORAGE_KEY) return;
    pref = readPreference(storage, doc.cookie);
    apply();
    show();
  });
}

function setupHeader(doc, win) {
  const header = doc.querySelector('.ef-site-header');
  if (!header) return;
  const onScroll = () => header.toggleAttribute('data-scrolled', win.scrollY > 4);
  onScroll();
  win.addEventListener('scroll', onScroll, { passive: true });

  const button = header.querySelector('.ef-site-header__menu');
  const panel = button && doc.getElementById(button.getAttribute('aria-controls'));
  if (!panel) return;
  const set = (open) => {
    button.setAttribute('aria-expanded', String(open));
    panel.toggleAttribute('data-open', open);
    swapIcon(doc, button, open ? 'x' : 'menu');
  };
  button.addEventListener('click', () => set(button.getAttribute('aria-expanded') !== 'true'));
  panel.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
  doc.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || button.getAttribute('aria-expanded') !== 'true') return;
    set(false);
    button.focus();
  });
}

function setupMarquee(doc, text) {
  for (const button of doc.querySelectorAll('.ef-marquee__pause')) {
    const root = button.closest('.ef-marquee');
    button.addEventListener('click', () => {
      const paused = !root.hasAttribute('data-paused');
      root.toggleAttribute('data-paused', paused);
      button.setAttribute('aria-pressed', String(paused));
      button.setAttribute('aria-label', paused ? text.play : text.pause);
      swapIcon(doc, button, paused ? 'play' : 'pause');
    });
  }
}

// Put the command on the clipboard and say so; when the clipboard is refused, select the command instead.
function setupCopy(doc, win, text) {
  for (const button of doc.querySelectorAll('[data-copy]')) {
    const code = doc.getElementById(button.dataset.copy);
    const status = doc.getElementById(button.getAttribute('aria-describedby'));
    button.addEventListener('click', async () => {
      try {
        await win.navigator.clipboard.writeText(code.textContent.trim());
        status.textContent = text.copied;
      } catch {
        const r = doc.createRange();
        r.selectNodeContents(code);
        const s = win.getSelection();
        s.removeAllRanges();
        s.addRange(r);
        status.textContent = text.blocked;
      }
    });
  }
}

// On a narrow screen the guide's and the docs' page list starts folded, so the page's own text comes first.
function setupSideFold(doc, win) {
  const fold = doc.querySelector('.g-side__fold');
  if (fold && win.matchMedia('(max-width: 1023px)').matches) fold.removeAttribute('open');
}

export function init(doc = globalThis.document, win = globalThis.window) {
  const text = LABELS[doc.documentElement.lang] || LABELS.en;
  setupTheme(doc, win, text);
  setupHeader(doc, win);
  setupMarquee(doc, text);
  setupCopy(doc, win, text);
  setupSideFold(doc, win);
}

if (typeof document !== 'undefined') init();
