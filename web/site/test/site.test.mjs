// The theme, menu and Marquee behaviour of assets/site.js, without a browser.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextPreference, readPreference, resolveTheme, themeCookie } from '../assets/site.js';

const store = (value) => ({ getItem: () => value });

test('the theme button cycles light, dark, system', () => {
  assert.equal(nextPreference('light'), 'dark');
  assert.equal(nextPreference('dark'), 'system');
  assert.equal(nextPreference('system'), 'light');
  assert.equal(nextPreference('nonsense'), 'light');
});

test('the saved choice wins over the cookie', () => {
  assert.equal(readPreference(store('system'), 'efolusi_theme=dark'), 'system');
  assert.equal(readPreference(store('light'), 'efolusi_theme=dark'), 'light');
});

test('without a saved choice the cookie from another Efolusi site decides', () => {
  assert.equal(readPreference(store(null), 'a=1; efolusi_theme=dark'), 'dark');
  assert.equal(readPreference(store('bogus'), 'efolusi_theme=light'), 'light');
  assert.equal(readPreference(store(null), ''), 'system');
});

test('blocked storage falls back to the cookie', () => {
  const blocked = { getItem() { throw new Error('blocked'); } };
  assert.equal(readPreference(blocked, 'efolusi_theme=dark'), 'dark');
});

test('system resolves through the colour scheme', () => {
  assert.equal(resolveTheme('system', true), 'dark');
  assert.equal(resolveTheme('system', false), 'light');
  assert.equal(resolveTheme('light', true), 'light');
});

test('the cookie holds only light or dark, shared on efolusi.com over https', () => {
  const c = themeCookie('dark', 'komando.efolusi.com', 'https:');
  assert.match(c, /^efolusi_theme=dark; Domain=\.efolusi\.com; Path=\/; Max-Age=31536000; SameSite=Lax; Secure$/);
  assert.equal(themeCookie('system', 'localhost', 'http:'), 'efolusi_theme=light; Path=/; Max-Age=31536000; SameSite=Lax');
});
