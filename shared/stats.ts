import { DECK, DISPERSION_MIN_STEPS, NUMERIC_CARDS } from './constants.ts';
import type { Card } from './types.ts';

export interface CardCount {
  card: Card;
  count: number;
}

export interface Extreme {
  card: Card;
  participantIds: string[];
}

export interface Results {
  total: number;
  numericCount: number;
  average: number | null;
  median: number | null;
  /** Sayısal kartlar, deste sırasıyla, yalnızca oy alanlar. */
  distribution: CardCount[];
  /** ? ve ☕ — istatistiğe katılmaz. */
  nonNumeric: CardCount[];
  consensus: boolean;
  dispersed: boolean;
  lowest: Extreme | null;
  highest: Extreme | null;
  allUnknown: boolean;
  suggested: Card | null;
}

const numericIndex = (c: Card) => (NUMERIC_CARDS as readonly string[]).indexOf(c);

export function isNumericCard(c: Card): boolean {
  return numericIndex(c) >= 0;
}

export function nearestCard(value: number): Card {
  let best: Card = NUMERIC_CARDS[0];
  let bestDiff = Infinity;
  for (const c of NUMERIC_CARDS) {
    const diff = Math.abs(Number(c) - value);
    // eşitlikte büyük kart (<= ile sonraki kazanır)
    if (diff <= bestDiff) {
      best = c;
      bestDiff = diff;
    }
  }
  return best;
}

export function computeResults(votes: Record<string, Card>): Results {
  const entries = Object.entries(votes);
  const counts = new Map<Card, number>();
  for (const [, card] of entries) counts.set(card, (counts.get(card) ?? 0) + 1);

  const numericEntries = entries.filter(([, c]) => isNumericCard(c));
  const nums = numericEntries.map(([, c]) => Number(c)).sort((a, b) => a - b);

  const distribution: CardCount[] = [];
  const nonNumeric: CardCount[] = [];
  for (const card of DECK) {
    const count = counts.get(card);
    if (!count) continue;
    (isNumericCard(card) ? distribution : nonNumeric).push({ card, count });
  }

  let average: number | null = null;
  let median: number | null = null;
  if (nums.length > 0) {
    average = nums.reduce((s, n) => s + n, 0) / nums.length;
    const mid = Math.floor(nums.length / 2);
    median = nums.length % 2 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
  }

  let lowest: Extreme | null = null;
  let highest: Extreme | null = null;
  if (distribution.length > 0) {
    const lo = distribution[0].card;
    const hi = distribution[distribution.length - 1].card;
    lowest = { card: lo, participantIds: numericEntries.filter(([, c]) => c === lo).map(([id]) => id) };
    highest = { card: hi, participantIds: numericEntries.filter(([, c]) => c === hi).map(([id]) => id) };
  }

  const consensus = entries.length >= 2 && counts.size === 1 && isNumericCard(entries[0][1]);
  const dispersed =
    !!lowest && !!highest && numericIndex(highest.card) - numericIndex(lowest.card) >= DISPERSION_MIN_STEPS;

  return {
    total: entries.length,
    numericCount: nums.length,
    average,
    median,
    distribution,
    nonNumeric,
    consensus,
    dispersed,
    lowest,
    highest,
    allUnknown: entries.length > 0 && entries.every(([, c]) => c === '?'),
    suggested: median === null ? null : nearestCard(median),
  };
}
