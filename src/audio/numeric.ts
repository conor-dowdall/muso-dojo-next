export function clampUnit(value: number | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(1, Math.max(0, value))
    : fallback;
}

export function normalizeNonNegativeNumber(
  value: number | undefined,
  fallback: number,
) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : fallback;
}

export function normalizePositiveNumber(
  value: number | undefined,
  fallback: number,
) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : fallback;
}
