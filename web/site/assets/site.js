// The site's own browser script: the menu and Marquee icons, the Copy buttons and the guide's folding page list.
// The theme button, the header menu and the Marquee pause are Meridian's plain browser/marketing.js (loaded before
// this file); it also sets data-theme on <html> to light or dark and never removes it.

const LABELS = {
  en: {
    copied: 'Copied. Paste it into your terminal.',
    blocked: 'The browser blocked the clipboard. The command is selected: press Cmd-C or Ctrl-C.',
  },
  id: {
    copied: 'Tersalin. Tempel ke terminal Anda.',
    blocked: 'Browser memblokir clipboard. Perintahnya sudah terpilih: tekan Cmd-C atau Ctrl-C.',
  },
};

// marketing.js changes the state attribute of these buttons; the icon follows it. The icons are the <template>s of the footer.
const ICON_BUTTONS = [
  { selector: '.ef-site-header__menu', attribute: 'aria-expanded', icon: (value) => (value === 'true' ? 'x' : 'menu') },
  { selector: '.ef-marquee__pause', attribute: 'aria-pressed', icon: (value) => (value === 'true' ? 'play' : 'pause') },
];

function swapIcon(doc, button, name) {
  const template = doc.getElementById(`icon-${name}`);
  const old = button.querySelector('[data-slot="icon"]');
  if (template && old) old.replaceWith(template.content.firstElementChild.cloneNode(true));
}

function setupIcons(doc, win) {
  for (const { selector, attribute, icon } of ICON_BUTTONS) {
    for (const button of doc.querySelectorAll(selector)) {
      swapIcon(doc, button, icon(button.getAttribute(attribute)));
      new win.MutationObserver(() => swapIcon(doc, button, icon(button.getAttribute(attribute))))
        .observe(button, { attributes: true, attributeFilter: [attribute] });
    }
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
  setupIcons(doc, win);
  setupCopy(doc, win, text);
  setupSideFold(doc, win);
}

if (typeof document !== 'undefined') init();
