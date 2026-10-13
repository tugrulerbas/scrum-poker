import { storage } from './identity.ts';

export type Theme = 'light' | 'dark';
const KEY = 'sp:theme';

export function applyStoredTheme(): void {
  const t = storage.get(KEY);
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
}

export function currentTheme(): Theme {
  const t = document.documentElement.dataset.theme;
  if (t === 'light' || t === 'dark') return t;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function setTheme(t: Theme): void {
  document.documentElement.dataset.theme = t;
  storage.set(KEY, t);
}
