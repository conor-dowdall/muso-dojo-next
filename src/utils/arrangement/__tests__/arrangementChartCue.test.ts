import { describe, expect, it } from "vitest";
import {
  deriveArrangementChartCueTarget,
  ARRANGEMENT_CHART_CUE_LEAD_SECONDS,
} from "@/utils/arrangement/arrangementChartCue";
import {
  type PartSequencePlaybackPlan,
  type PartSequenceSnapshot,
} from "@/audio";

function createPlan(
  sections: string[],
  completionPolicy: "loop" | "stop-at-end" = "stop-at-end",
): PartSequencePlaybackPlan {
  const parts = sections.map((sectionId, index) => ({
    arrangement: {
      entryId: `entry-${index}`,
      entryIndex: index,
      sectionId,
      playIndex: 0,
      playCount: 1,
      sourcePartId: `source-${index}`,
    },
    continueRhythm: false,
    durationBeats: 4,
    exerciseRequests: [],
    index,
    partId: `part-${index}`,
    resetSignature: `reset-${index}`,
    rhythmRequests: [],
    updateSignature: `update-${index}`,
  }));
  return {
    completionPolicy,
    countIn: { durationBeats: 0, pulses: 0 },
    contentSignature: "content",
    mode: "arrangement",
    owner: { kind: "arrangement", id: "arrangement" },
    partResetSignatures: parts.map(({ resetSignature }) => resetSignature),
    parts,
    sessionId: "arrangement",
    signature: "signature",
    sourceSignature: "source",
    tempoBpm: 60,
    updateSignature: "update",
  };
}

function createSnapshot(
  plan: PartSequencePlaybackPlan,
  activeOccurrence = 0,
): PartSequenceSnapshot {
  return {
    activeArrangementContext:
      plan.parts[activeOccurrence % plan.parts.length]?.arrangement,
    activeOccurrence,
    cycleEndTime: 14,
    mode: "arrangement",
    partCount: plan.parts.length,
    playing: true,
    sourceSignature: plan.sourceSignature,
  };
}

describe("deriveArrangementChartCueTarget", () => {
  it("cues the first different Section one second before its boundary", () => {
    const plan = createPlan(["a", "a", "b"]);
    expect(
      deriveArrangementChartCueTarget({
        plan,
        snapshot: createSnapshot(plan),
        currentSectionStartedAt: 10,
      }),
    ).toMatchObject({
      boundaryTime: 18,
      cueTime: 17,
      effectiveLeadSeconds: ARRANGEMENT_CHART_CUE_LEAD_SECONDS,
      sectionId: "b",
    });
  });

  it("uses half a short display duration and suppresses unusable leads", () => {
    const plan = createPlan(["a", "b"]);
    expect(
      deriveArrangementChartCueTarget({
        plan,
        snapshot: { ...createSnapshot(plan), cycleEndTime: 10.6 },
        currentSectionStartedAt: 10,
      })?.effectiveLeadSeconds,
    ).toBeCloseTo(0.3);
    expect(
      deriveArrangementChartCueTarget({
        plan,
        snapshot: { ...createSnapshot(plan), cycleEndTime: 10.4 },
        currentSectionStartedAt: 10,
      }),
    ).toBeUndefined();
  });

  it("does not cue a finite ending and can cue across a Loop wrap", () => {
    const once = createPlan(["a", "b"]);
    expect(
      deriveArrangementChartCueTarget({
        plan: once,
        snapshot: createSnapshot(once, 1),
        currentSectionStartedAt: 10,
      }),
    ).toBeUndefined();
    const loop = createPlan(["a", "b"], "loop");
    expect(
      deriveArrangementChartCueTarget({
        plan: loop,
        snapshot: createSnapshot(loop, 1),
        currentSectionStartedAt: 10,
      })?.sectionId,
    ).toBe("a");
  });
});
