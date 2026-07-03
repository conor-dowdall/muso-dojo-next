import { type MusicPartConfig } from "@/types/session";
import { getPartDurationInBars } from "@/utils/music-part/partDuration";

const BAR_EPSILON = 0.000_001;
const FRACTION_DENOMINATOR_LIMIT = 8;
const FRACTION_PRECISION = 1_000_000;

export interface PartBarTimelineEntry {
  barAccessibleLabel: string;
  barLabel: string;
  barNumberAccessibleLabel: string;
  barNumberLabel: string;
  barNumber: number;
  barTotalAccessibleLabel: string;
  barTotalLabel: string;
  durationInBars: number;
  partId: string;
  segmentLabel?: string;
  startInBars: number;
}

export interface PartBarTimeline {
  entries: readonly PartBarTimelineEntry[];
  totalBars: number;
  totalLabel: string;
  totalAccessibleLabel: string;
}

interface PendingPartBarTimelineEntry {
  barNumber: number;
  durationInBars: number;
  isPartialBar: boolean;
  partId: string;
  segmentLabel?: string;
  startInBars: number;
}

function roundBarValue(value: number) {
  return Math.round(value * FRACTION_PRECISION) / FRACTION_PRECISION;
}

function gcd(left: number, right: number): number {
  let a = Math.abs(left);
  let b = Math.abs(right);

  while (b > 0) {
    const next = a % b;
    a = b;
    b = next;
  }

  return a || 1;
}

function formatSimpleFraction(value: number) {
  const integerPart = Math.floor(value + BAR_EPSILON);
  const remainder = value - integerPart;

  if (Math.abs(remainder) <= BAR_EPSILON) {
    return String(integerPart);
  }

  for (
    let denominator = 2;
    denominator <= FRACTION_DENOMINATOR_LIMIT;
    denominator += 1
  ) {
    const numerator = Math.round(remainder * denominator);

    if (
      numerator > 0 &&
      Math.abs(remainder - numerator / denominator) <= BAR_EPSILON
    ) {
      const divisor = gcd(numerator, denominator);
      const fractionLabel = `${numerator / divisor}/${denominator / divisor}`;

      return integerPart > 0
        ? `${integerPart} ${fractionLabel}`
        : fractionLabel;
    }
  }

  return String(roundBarValue(value));
}

function formatBarCountLabel(totalBars: number) {
  const totalLabel = formatSimpleFraction(totalBars);

  return totalLabel === "1" ? "1 Bar" : `${totalLabel} Bars`;
}

function getBarNumberWidth(totalBars: number) {
  return Math.max(2, String(Math.ceil(totalBars)).length);
}

function formatBarNumber(barNumber: number, totalBars: number) {
  return String(barNumber).padStart(getBarNumberWidth(totalBars), "0");
}

function getSegmentLabel(index: number) {
  return String.fromCharCode("a".charCodeAt(0) + index);
}

function applySegmentLabels(entries: readonly PendingPartBarTimelineEntry[]) {
  const barGroups = new Map<number, PendingPartBarTimelineEntry[]>();

  entries.forEach((entry) => {
    if (!entry.isPartialBar) {
      return;
    }

    const group = barGroups.get(entry.barNumber) ?? [];

    group.push(entry);
    barGroups.set(entry.barNumber, group);
  });

  barGroups.forEach((group) => {
    group.forEach((entry, index) => {
      entry.segmentLabel = getSegmentLabel(index);
    });
  });
}

export function createPartBarTimeline(
  parts: readonly Pick<MusicPartConfig, "durationInBars" | "id">[],
): PartBarTimeline {
  let currentPosition = 0;
  const pendingEntries = parts.map((part): PendingPartBarTimelineEntry => {
    const durationInBars = getPartDurationInBars(part.durationInBars);
    const startInBars = roundBarValue(currentPosition);
    const barNumber = Math.floor(startInBars + BAR_EPSILON) + 1;
    const startsInsideBar =
      Math.abs(startInBars - Math.floor(startInBars + BAR_EPSILON)) >
      BAR_EPSILON;
    const isPartialBar = durationInBars < 1 - BAR_EPSILON || startsInsideBar;

    currentPosition = roundBarValue(currentPosition + durationInBars);

    return {
      barNumber,
      durationInBars,
      isPartialBar,
      partId: part.id,
      startInBars,
    };
  });

  applySegmentLabels(pendingEntries);

  const totalBars = roundBarValue(currentPosition);
  const totalLabel = Number.isInteger(totalBars)
    ? formatBarNumber(totalBars, totalBars)
    : formatSimpleFraction(totalBars);
  const totalAccessibleLabel = formatSimpleFraction(totalBars);

  return {
    entries: pendingEntries.map((entry) => {
      const barNumberLabel = formatBarNumber(entry.barNumber, totalBars);
      const barNumberAccessibleLabel = String(entry.barNumber);
      const barLabel = `${barNumberLabel}${entry.segmentLabel ?? ""}`;
      const barAccessibleLabel = `${entry.barNumber}${entry.segmentLabel ?? ""}`;

      return {
        barAccessibleLabel,
        barLabel,
        barNumberAccessibleLabel,
        barNumberLabel,
        barNumber: entry.barNumber,
        barTotalAccessibleLabel: totalAccessibleLabel,
        barTotalLabel: totalLabel,
        durationInBars: entry.durationInBars,
        partId: entry.partId,
        ...(entry.segmentLabel ? { segmentLabel: entry.segmentLabel } : {}),
        startInBars: entry.startInBars,
      };
    }),
    totalAccessibleLabel,
    totalBars,
    totalLabel: formatBarCountLabel(totalBars),
  };
}
