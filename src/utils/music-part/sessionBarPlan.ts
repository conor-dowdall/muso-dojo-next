import { getRhythmTheoryReadout } from "@/data/rhythmPresets";
import {
  type MusicPartConfig,
  type SessionBackingBandConfig,
} from "@/types/session";
import { getAutomaticRhythmSelection } from "@/utils/rhythm/automaticRhythm";
import {
  getRhythmSelectionPattern,
  getRhythmSelectionRecipe,
  rhythmSelectionsAreEqual,
  type RhythmSelection,
} from "@/utils/rhythm/rhythmConfig";
import {
  getRepresentablePartDurationBeats,
  getRhythmSelectionForBeatCount,
  getPartDurationChartUnits,
} from "./partDuration";
import {
  createPartBarTimeline,
  type PartBarTimelineEntry,
} from "./partBarTimeline";
import {
  resolvePartBackingBand,
  type ResolvedPartBackingBand,
} from "./resolvePartBackingBand";

const DURATION_EPSILON = 0.000_001;

export interface SessionBarPlanSegment {
  chartSpanUnits: number;
  part: MusicPartConfig;
  resolvedBand: ResolvedPartBackingBand;
  segmentLabel?: string;
  timelineEntry: PartBarTimelineEntry;
}

export interface SessionBarPlanEntry {
  accessibleLabel: string;
  continuousRhythmScope?: "bar" | "session";
  continuousRhythmSelection?: RhythmSelection;
  label: string;
  meterLabel?: string;
  segments: readonly SessionBarPlanSegment[];
}

export interface SessionBarPlan {
  entries: readonly SessionBarPlanEntry[];
  layout: "authored" | "linear";
  positionLabel: "Bar" | "Part";
  totalAccessibleLabel: string;
  totalCountLabel: string;
  totalNumberLabel: string;
}

interface PendingBarEntry {
  accessibleLabel: string;
  label: string;
  segments: SessionBarPlanSegment[];
}

function valuesAreClose(left: number, right: number) {
  return Math.abs(left - right) <= DURATION_EPSILON;
}

function getAuthoredBarStart(entry: PendingBarEntry) {
  const first = entry.segments[0];

  return first ? first.timelineEntry.barNumber - 1 : undefined;
}

/**
 * The timeline is inferred from the current Part order, so reject entries that
 * only appear to share a bar because a Part crosses a boundary or the entry
 * begins part-way through a bar. Incomplete final bars remain valid for Chart
 * layout, but they are not complete parent bars.
 */
function segmentsStayWithinOneAuthoredBar(entry: PendingBarEntry) {
  const barStart = getAuthoredBarStart(entry);
  if (barStart === undefined) {
    return true;
  }

  let expectedStart = barStart;
  return entry.segments.every((segment) => {
    const { durationInBars, startInBars } = segment.timelineEntry;
    const endInBars = startInBars + durationInBars;
    const isValid =
      valuesAreClose(startInBars, expectedStart) &&
      endInBars <= barStart + 1 + DURATION_EPSILON;

    expectedStart = endInBars;
    return isValid;
  });
}

function segmentsFillOneAuthoredBar(entry: PendingBarEntry) {
  const barStart = getAuthoredBarStart(entry);
  const last = entry.segments.at(-1);

  return (
    barStart !== undefined &&
    last !== undefined &&
    segmentsStayWithinOneAuthoredBar(entry) &&
    valuesAreClose(
      last.timelineEntry.startInBars + last.timelineEntry.durationInBars,
      barStart + 1,
    )
  );
}

function isAuthoredSplit(entry: PendingBarEntry) {
  return (
    entry.segments.length > 1 ||
    entry.segments.some(
      (segment) => segment.timelineEntry.durationInBars < 1 - DURATION_EPSILON,
    )
  );
}

function getSessionCustomSegmentBeats(segment: SessionBarPlanSegment) {
  if (
    segment.resolvedBand.rhythm.source.mode !== "session" ||
    segment.resolvedBand.session.rhythm.mode !== "custom"
  ) {
    return undefined;
  }

  return getRepresentablePartDurationBeats(
    segment.timelineEntry.durationInBars,
    getRhythmSelectionRecipe(segment.resolvedBand.session.rhythm.selection)
      .beats,
  );
}

function sessionCustomReplacesFraction(segment: SessionBarPlanSegment) {
  return (
    segment.resolvedBand.rhythm.source.mode === "session" &&
    segment.resolvedBand.session.rhythm.mode === "custom" &&
    getSessionCustomSegmentBeats(segment) === undefined
  );
}

function authoredDurationsRemainProportional(entry: PendingBarEntry) {
  if (!isAuthoredSplit(entry)) {
    return true;
  }

  if (entry.segments.some(sessionCustomReplacesFraction)) {
    return false;
  }

  const [first, ...remaining] = entry.segments;
  if (!first) {
    return true;
  }

  const beatsPerAuthoredBar =
    first.resolvedBand.durationBeats / first.timelineEntry.durationInBars;

  return remaining.every((segment) =>
    valuesAreClose(
      segment.resolvedBand.durationBeats / segment.timelineEntry.durationInBars,
      beatsPerAuthoredBar,
    ),
  );
}

function getAutomaticBarRhythmSelection(
  entry: PendingBarEntry,
): RhythmSelection | undefined {
  const [first, ...remaining] = entry.segments;
  if (
    !first ||
    !first.resolvedBand.rhythm.enabled ||
    first.resolvedBand.rhythm.source.mode !== "session" ||
    first.resolvedBand.session.rhythm.mode !== "automatic"
  ) {
    return undefined;
  }

  const style = first.part.automaticRhythm?.style ?? "standard";
  if (
    remaining.some(
      (segment) =>
        !segment.resolvedBand.rhythm.enabled ||
        segment.resolvedBand.rhythm.source.mode !== "session" ||
        segment.resolvedBand.session.rhythm.mode !== "automatic" ||
        (segment.part.automaticRhythm?.style ?? "standard") !== style,
    )
  ) {
    return undefined;
  }

  const durationBeats = entry.segments.reduce(
    (total, segment) => total + segment.resolvedBand.durationBeats,
    0,
  );
  const selection = getAutomaticRhythmSelection(style, durationBeats);

  return valuesAreClose(
    getRhythmSelectionRecipe(selection).beats,
    durationBeats,
  )
    ? selection
    : undefined;
}

function getSessionCustomBarRhythmSelection(
  entry: PendingBarEntry,
): RhythmSelection | undefined {
  const [first, ...remaining] = entry.segments;
  if (
    !first ||
    !segmentsFillOneAuthoredBar(entry) ||
    !first.resolvedBand.rhythm.enabled ||
    first.resolvedBand.rhythm.source.mode !== "session" ||
    first.resolvedBand.session.rhythm.mode !== "custom" ||
    getSessionCustomSegmentBeats(first) === undefined
  ) {
    return undefined;
  }

  const selection = first.resolvedBand.session.rhythm.selection;
  return remaining.every(
    (segment) =>
      segment.resolvedBand.rhythm.enabled &&
      segment.resolvedBand.rhythm.source.mode === "session" &&
      segment.resolvedBand.session.rhythm.mode === "custom" &&
      getSessionCustomSegmentBeats(segment) !== undefined &&
      rhythmSelectionsAreEqual(
        segment.resolvedBand.session.rhythm.selection,
        selection,
      ),
  )
    ? selection
    : undefined;
}

function rhythmHitsAreEqual(
  left: ReturnType<typeof getRhythmSelectionPattern>["hits"][number],
  right: ReturnType<typeof getRhythmSelectionPattern>["hits"][number],
) {
  return (
    left.atTicks === right.atTicks &&
    left.sampleId === right.sampleId &&
    left.velocity === right.velocity
  );
}

function parentRhythmMatchesSegmentAudio(
  entry: PendingBarEntry,
  parentSelection: RhythmSelection,
) {
  const parentPattern = getRhythmSelectionPattern(parentSelection);
  let tickOffset = 0;
  const segmentHits = entry.segments.flatMap((segment) => {
    const pattern = getRhythmSelectionPattern(
      segment.resolvedBand.rhythm.selection,
    );
    const hits = pattern.hits.map((hit) => ({
      ...hit,
      atTicks: hit.atTicks + tickOffset,
    }));

    tickOffset += pattern.cycleTicks;
    return hits;
  });

  return (
    tickOffset === parentPattern.cycleTicks &&
    segmentHits.length === parentPattern.hits.length &&
    segmentHits.every((hit, index) => {
      const parentHit = parentPattern.hits[index];
      return parentHit !== undefined && rhythmHitsAreEqual(hit, parentHit);
    })
  );
}

function getAuthoredLocalBarRhythmSelection(
  entry: PendingBarEntry,
): RhythmSelection | undefined {
  const firstModule = entry.segments[0]?.resolvedBand.rhythm.module;
  const authoredBarRhythm = firstModule?.authoredBarRhythm;

  if (!authoredBarRhythm) {
    return undefined;
  }

  if (!segmentsFillOneAuthoredBar(entry)) {
    return undefined;
  }

  const authoredBeats = getRhythmSelectionRecipe(authoredBarRhythm).beats;
  const modulesStillMatchAuthoredSegments = entry.segments.every((segment) => {
    const rhythmModule = segment.resolvedBand.rhythm.module;
    const expectedBeats = getRepresentablePartDurationBeats(
      segment.timelineEntry.durationInBars,
      authoredBeats,
    );

    return (
      segment.resolvedBand.rhythm.enabled &&
      segment.resolvedBand.rhythm.source.mode === "module" &&
      rhythmModule?.authoredBarRhythm !== undefined &&
      rhythmSelectionsAreEqual(
        rhythmModule.authoredBarRhythm,
        authoredBarRhythm,
      ) &&
      expectedBeats !== undefined &&
      rhythmSelectionsAreEqual(
        rhythmModule.rhythm,
        getRhythmSelectionForBeatCount(expectedBeats, authoredBarRhythm),
      )
    );
  });

  return modulesStillMatchAuthoredSegments ? authoredBarRhythm : undefined;
}

function getLocalBarRhythmSelection(
  entry: PendingBarEntry,
): RhythmSelection | undefined {
  if (!isAuthoredSplit(entry) || entry.segments.length < 2) {
    return undefined;
  }

  const authoredBarRhythm = getAuthoredLocalBarRhythmSelection(entry);
  if (authoredBarRhythm) {
    return authoredBarRhythm;
  }

  const [first, ...remaining] = entry.segments;
  if (
    !first ||
    !first.resolvedBand.rhythm.enabled ||
    first.resolvedBand.rhythm.source.mode !== "module"
  ) {
    return undefined;
  }

  const firstSelection = first.resolvedBand.rhythm.selection;
  if (
    remaining.some(
      (segment) =>
        !segment.resolvedBand.rhythm.enabled ||
        segment.resolvedBand.rhythm.source.mode !== "module",
    )
  ) {
    return undefined;
  }

  const durationBeats = entry.segments.reduce(
    (total, segment) => total + segment.resolvedBand.durationBeats,
    0,
  );
  const selection = getRhythmSelectionForBeatCount(
    durationBeats,
    firstSelection,
  );

  return valuesAreClose(
    getRhythmSelectionRecipe(selection).beats,
    durationBeats,
  ) && parentRhythmMatchesSegmentAudio(entry, selection)
    ? selection
    : undefined;
}

function timekeepersMatch(left: RhythmSelection, right: RhythmSelection) {
  const leftTimekeeper = getRhythmSelectionRecipe(left).timekeeper;
  const rightTimekeeper = getRhythmSelectionRecipe(right).timekeeper;

  return (
    leftTimekeeper.feel === rightTimekeeper.feel &&
    leftTimekeeper.sound === rightTimekeeper.sound &&
    leftTimekeeper.subdivision === rightTimekeeper.subdivision
  );
}

function getBarMeterSelection(
  entry: PendingBarEntry,
  continuousRhythmSelection: RhythmSelection | undefined,
) {
  if (continuousRhythmSelection) {
    return continuousRhythmSelection;
  }

  const [first, ...remaining] = entry.segments;
  if (!first) {
    return undefined;
  }

  if (entry.segments.length === 1) {
    return first.resolvedBand.rhythm.selection;
  }

  if (
    remaining.some(
      (segment) =>
        !timekeepersMatch(
          first.resolvedBand.rhythm.selection,
          segment.resolvedBand.rhythm.selection,
        ),
    )
  ) {
    return undefined;
  }

  const durationBeats = entry.segments.reduce(
    (total, segment) => total + segment.resolvedBand.durationBeats,
    0,
  );

  const selection = getRhythmSelectionForBeatCount(
    durationBeats,
    first.resolvedBand.rhythm.selection,
  );

  return valuesAreClose(
    getRhythmSelectionRecipe(selection).beats,
    durationBeats,
  )
    ? selection
    : undefined;
}

function completeBarEntry(entry: PendingBarEntry): SessionBarPlanEntry {
  const sessionCustomRhythmSelection =
    getSessionCustomBarRhythmSelection(entry);
  const automaticRhythmSelection = sessionCustomRhythmSelection
    ? undefined
    : getAutomaticBarRhythmSelection(entry);
  const localRhythmSelection =
    sessionCustomRhythmSelection || automaticRhythmSelection
      ? undefined
      : getLocalBarRhythmSelection(entry);
  const continuousRhythmSelection =
    sessionCustomRhythmSelection ??
    automaticRhythmSelection ??
    localRhythmSelection;
  const meterSelection = getBarMeterSelection(entry, continuousRhythmSelection);

  return {
    accessibleLabel: entry.accessibleLabel,
    ...(continuousRhythmSelection
      ? {
          continuousRhythmScope:
            automaticRhythmSelection || sessionCustomRhythmSelection
              ? ("session" as const)
              : ("bar" as const),
        }
      : {}),
    ...(continuousRhythmSelection ? { continuousRhythmSelection } : {}),
    label: entry.label,
    ...(meterSelection
      ? {
          meterLabel: getRhythmTheoryReadout(
            getRhythmSelectionRecipe(meterSelection),
          ).title,
        }
      : {}),
    segments: entry.segments,
  };
}

function createAuthoredEntries(
  parts: readonly MusicPartConfig[],
  backingBand: SessionBackingBandConfig | undefined,
) {
  const timeline = createPartBarTimeline(parts);
  const entries: PendingBarEntry[] = [];

  parts.forEach((part, index) => {
    const timelineEntry = timeline.entries[index];
    if (!timelineEntry) {
      throw new Error("Missing authored bar timeline entry");
    }

    const previous = entries.at(-1);
    const entry =
      previous && previous.label === timelineEntry.barNumberLabel
        ? previous
        : undefined;
    const target =
      entry ??
      ({
        accessibleLabel: timelineEntry.barNumberAccessibleLabel,
        label: timelineEntry.barNumberLabel,
        segments: [],
      } satisfies PendingBarEntry);

    const resolvedBand = resolvePartBackingBand(part, backingBand);
    const segment = {
      chartSpanUnits: getPartDurationChartUnits(part.durationInBars),
      part,
      resolvedBand,
      ...(timelineEntry.segmentLabel
        ? { segmentLabel: timelineEntry.segmentLabel }
        : {}),
      timelineEntry,
    } satisfies SessionBarPlanSegment;
    const sessionCustomBeats = getSessionCustomSegmentBeats(segment);

    target.segments.push(
      sessionCustomBeats === undefined
        ? segment
        : {
            ...segment,
            resolvedBand: {
              ...resolvedBand,
              durationBeats: sessionCustomBeats,
            },
          },
    );

    if (!entry) {
      entries.push(target);
    }
  });

  return { entries, timeline };
}

function createLinearPlan(
  parts: readonly MusicPartConfig[],
  backingBand: SessionBackingBandConfig | undefined,
): SessionBarPlan {
  const timeline = createPartBarTimeline(
    parts.map((part) => ({ id: part.id })),
  );

  return {
    entries: parts.map((part, index) => {
      const timelineEntry = timeline.entries[index];
      if (!timelineEntry) {
        throw new Error("Missing linear Part timeline entry");
      }

      return completeBarEntry({
        accessibleLabel: timelineEntry.barNumberAccessibleLabel,
        label: timelineEntry.barNumberLabel,
        segments: [
          {
            chartSpanUnits: getPartDurationChartUnits(undefined),
            part,
            resolvedBand: resolvePartBackingBand(part, backingBand),
            timelineEntry,
          },
        ],
      });
    }),
    layout: "linear",
    positionLabel: "Part",
    totalAccessibleLabel: timeline.totalAccessibleLabel,
    totalCountLabel: `${parts.length} ${parts.length === 1 ? "Part" : "Parts"}`,
    totalNumberLabel: timeline.entries.at(-1)?.barTotalLabel ?? "0",
  };
}

export function createSessionBarPlan(
  parts: readonly MusicPartConfig[],
  backingBand?: SessionBackingBandConfig,
): SessionBarPlan {
  const authored = createAuthoredEntries(parts, backingBand);

  if (
    !authored.entries.every(
      (entry) =>
        segmentsStayWithinOneAuthoredBar(entry) &&
        authoredDurationsRemainProportional(entry),
    )
  ) {
    return createLinearPlan(parts, backingBand);
  }

  return {
    entries: authored.entries.map(completeBarEntry),
    layout: "authored",
    positionLabel: "Bar",
    totalAccessibleLabel: authored.timeline.totalAccessibleLabel,
    totalCountLabel: authored.timeline.totalLabel,
    totalNumberLabel: authored.timeline.entries.at(-1)?.barTotalLabel ?? "0",
  };
}
