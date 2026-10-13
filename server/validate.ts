import { DECK, NAME_MAX, NUMERIC_CARDS, STORY_DESC_MAX, STORY_TITLE_MAX } from '../shared/constants.ts';
import type { Card } from '../shared/types.ts';

const CONTROL = /\p{Cc}/gu;
const INVISIBLE = /\p{Cf}/gu;

export const codePointLength = (s: string) => [...s].length;

export function cleanText(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  return v.normalize('NFC').replace(CONTROL, ' ').replace(INVISIBLE, '').trim();
}

export type NameCheck = { ok: true; name: string } | { ok: false; reason: 'EMPTY' | 'TOO_LONG' };

export function checkName(v: unknown): NameCheck {
  const name = cleanText(v);
  if (!name) return { ok: false, reason: 'EMPTY' };
  if (codePointLength(name) > NAME_MAX) return { ok: false, reason: 'TOO_LONG' };
  return { ok: true, name };
}

export function checkStory(title: unknown, description: unknown): { title: string; description: string } | null {
  const t = cleanText(title);
  const d = description === undefined ? '' : cleanText(description);
  if (!t || d === null) return null;
  if (codePointLength(t) > STORY_TITLE_MAX || codePointLength(d) > STORY_DESC_MAX) return null;
  return { title: t, description: d };
}

export const isCard = (v: unknown): v is Card => typeof v === 'string' && (DECK as readonly string[]).includes(v);

export const isNumericCard = (v: unknown): v is Card =>
  typeof v === 'string' && (NUMERIC_CARDS as readonly string[]).includes(v);

export const isId = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 64;

export const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);

export const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
