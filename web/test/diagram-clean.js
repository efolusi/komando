// The checks of diagram-clean.html (kept in a file of its own: the hostile samples hold </script>).
import { cleanSvg } from '../site/assets/diagrams/diagram.js';

// the cleaner diagram.js used before (kept here only to compare against)
const oldClean = (svg, id) => svg.replace(/<\?xml[\s\S]*?\?>|<!--[\s\S]*?-->|<title>[\s\S]*?<\/title>|<script[\s\S]*?<\/script>/gi, '')
  .replace(/\son[a-z]+="[^"]*"/gi, '')
  .replace(/\sid="([^"]+)"/g, ` id="$1-${id}"`)
  .replace(/url\(#([^)]+)\)/g, `url(#$1-${id})`)
  .replace(/href="#([^"]+)"/g, `href="#$1-${id}"`);

const span = html => { const s = document.createElement('span'); s.innerHTML = html; return s; };
const fails = [];
let checked = 0;

// 1. the site's own icons: the same DOM as before
for (const dir of ['../site/glyphs/', '../site/assets/icons/', '../site/assets/ui/icons/']) {
  const listing = await (await fetch(dir)).text();
  const names = [...listing.matchAll(/href="([^"]+\.svg)"/g)].map(m => m[1]);
  if (!names.length) fails.push(`no icons found in ${dir}`);
  for (const name of names) {
    const text = await (await fetch(dir + name)).text();
    const a = span(oldClean(text, 'dgi7')), b = span(cleanSvg(text, 'dgi7'));
    // the <svg> itself must match; the old cleaner also kept the file's trailing newline as a text node
    // beside it, which draws nothing
    if (!b.firstElementChild || !a.firstElementChild.isEqualNode(b.firstElementChild) || a.children.length !== 1) fails.push(`${dir}${name} differs:\n  old ${a.innerHTML.slice(0, 300)}\n  new ${b.innerHTML.slice(0, 300)}`);
    checked++;
  }
}

// 2. hostile files
const NS = 'xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"';
const hostile = [
  `<svg ${NS} onload='alert(1)'><path d="M0 0"/></svg>`,
  `<svg ${NS}><path d="M0 0" onclick="alert(1)"/></svg>`,
  `<svg ${NS}><path d="M0 0" onclick=alert(1) /></svg>`,   // not well-formed XML: the whole icon is dropped
  `<svg ${NS}><g ONMOUSEOVER = 'x()'><circle r="1"/></g></svg>`,
  `<svg ${NS}><script>alert(1)</script><script xlink:href="data:,alert(1)"/></svg>`,
  `<svg ${NS}><foreignObject><iframe xmlns="http://www.w3.org/1999/xhtml" src="javascript:alert(1)"></iframe></foreignObject></svg>`,
  `<svg ${NS}><a xlink:href="javascript:alert(1)"><path d="M0 0"/></a></svg>`,
  `<svg ${NS}><use xlink:href=" javascript:alert(1)"/><use href="https://evil.example/x.svg#a"/><use href="#ok"/></svg>`,
  `<svg ${NS}><animate attributeName="href" to="javascript:alert(1)"/><set attributeName="onclick" to="alert(1)"/></svg>`,
  `<svg ${NS}><iframe src="https://evil.example"/><image href="https://evil.example/t.png"/></svg>`,
  `not an svg <script>alert(1)</script>`,
  `<html><body onload="alert(1)"></body></html>`,
];
for (const text of hostile) {
  const out = span(cleanSvg(text, 'dgi9'));
  const all = [...out.querySelectorAll('*')];
  const bad = [];
  if (out.querySelector('script, foreignObject, iframe, a, animate, set, image')) bad.push('kept a forbidden element');
  for (const el of all) for (const at of el.attributes) {
    if (/^on/i.test(at.localName)) bad.push(`kept ${at.name}`);
    if (at.localName === 'href' && !at.value.startsWith('#')) bad.push(`kept ${at.name}="${at.value}"`);
  }
  if (bad.length) fails.push(`hostile ${text.slice(0, 80)}: ${bad.join(', ')}\n  out ${out.innerHTML}`);
  checked++;
}
// the same-document reference survives, with the new id
if (!cleanSvg(`<svg ${NS}><use href="#ok"/></svg>`, 'dgi9').includes('href="#ok-dgi9"')) fails.push('#ok lost its new id');

document.getElementById('result').textContent = fails.length
  ? `RESULT: FAIL (${fails.length} of ${checked})\n${fails.join('\n')}`
  : `RESULT: PASS (${checked} files)`;
