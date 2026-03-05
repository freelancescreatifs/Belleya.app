export const RANK_THRESHOLDS = [
  { min: 0, max: 9, label: 'Recrue', color: 'bg-gray-100 text-gray-700', barColor: 'bg-gray-400', rate: 0.10 },
  { min: 10, max: 49, label: 'Closer', color: 'bg-blue-100 text-blue-700', barColor: 'bg-blue-500', rate: 0.12 },
  { min: 50, max: 149, label: 'Pro', color: 'bg-amber-100 text-amber-700', barColor: 'bg-amber-500', rate: 0.15 },
  { min: 150, max: Infinity, label: 'Elite', color: 'bg-rose-100 text-rose-700', barColor: 'bg-rose-500', rate: 0.15 },
];

export function getRank(conversions: number) {
  return RANK_THRESHOLDS.find(r => conversions >= r.min && conversions <= r.max) || RANK_THRESHOLDS[0];
}

export function getNextRank(conversions: number) {
  const idx = RANK_THRESHOLDS.findIndex(r => conversions >= r.min && conversions <= r.max);
  return idx < RANK_THRESHOLDS.length - 1 ? RANK_THRESHOLDS[idx + 1] : null;
}

export function getRankProgress(conversions: number) {
  const rank = getRank(conversions);
  const next = getNextRank(conversions);
  if (!next) return 100;
  const rangeSize = rank.max - rank.min + 1;
  return Math.min(100, Math.round(((conversions - rank.min) / rangeSize) * 100));
}

export function formatEUR(amount: number) {
  return `${amount.toFixed(2)} EUR`;
}

export function daysSince(dateStr: string | null): number {
  if (!dateStr) return 999;
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}
