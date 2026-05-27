/**
 * Separator for compact UI value summaries, especially subtitles and previews
 * that combine short peer values: "Guitar • Standard E", "Duplicate • Remove".
 * Prefer normal prose punctuation for sentences or human-readable paragraphs.
 */
export const DISPLAY_VALUE_SEPARATOR = " • ";

type ValueSummaryPart = string | number | false | null | undefined;

/**
 * Formats optional compact value fragments for UI summaries. Use this when the
 * summary is assembled conditionally; use DISPLAY_VALUE_SEPARATOR directly for
 * fixed template strings where interpolation reads more clearly.
 */
export function formatValueSummary(parts: readonly ValueSummaryPart[]) {
  return parts
    .filter((part): part is string | number => part !== false && part != null)
    .map(String)
    .join(DISPLAY_VALUE_SEPARATOR);
}
