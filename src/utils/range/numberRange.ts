export type NumericRange = readonly [number, number];

interface NormalizeBoundedRangeOptions {
  fallbackEnd?: number;
  fallbackStart?: number;
  max: number;
  min: number;
  minSpan: number;
}

export function areRangesEqual(a: NumericRange, b: NumericRange) {
  return a[0] === b[0] && a[1] === b[1];
}

export function normalizeBoundedRange(
  [start, end]: NumericRange,
  {
    fallbackEnd,
    fallbackStart,
    max,
    min,
    minSpan,
  }: NormalizeBoundedRangeOptions,
): NumericRange {
  const normalizedStart = clamp(
    Number.isFinite(start) ? Math.floor(start) : (fallbackStart ?? min),
    min,
    max - minSpan,
  );
  const normalizedEnd = clamp(
    Number.isFinite(end) ? Math.floor(end) : (fallbackEnd ?? min + minSpan),
    min + minSpan,
    max,
  );

  if (normalizedEnd - normalizedStart >= minSpan) {
    return [normalizedStart, normalizedEnd] as const;
  }

  return [normalizedStart, Math.min(max, normalizedStart + minSpan)] as const;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
