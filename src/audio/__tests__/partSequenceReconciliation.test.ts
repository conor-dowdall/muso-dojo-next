import { describe, expect, it } from "vitest";
import { getPartSequencePlanReconciliation } from "@/audio/partSequenceReconciliation";
import {
  type PartSequencePlaybackPlan,
  type PartSequenceStepPlan,
} from "@/audio/partSequencePlanning";
import { type PartSequenceSnapshot } from "@/audio/partSequenceCoordinator";

function createStep(
  partId: string,
  resetSignature: string,
): PartSequenceStepPlan {
  return {
    continueRhythm: false,
    durationBeats: 4,
    exerciseRequests: [],
    index: 0,
    partId,
    resetSignature,
    rhythmRequests: [],
    updateSignature: `${resetSignature}:update`,
  };
}

function createPlan(
  settings: Partial<PartSequencePlaybackPlan> = {},
): PartSequencePlaybackPlan {
  const parts = [createStep("part-a", "reset-a")];
  return {
    countIn: { durationBeats: 0, pulses: 0 },
    contentSignature: "content",
    mode: "session",
    partResetSignatures: parts.map((part) => part.resetSignature),
    parts,
    sessionId: "session",
    signature: "80:content",
    sourceSignature: "source",
    tempoBpm: 80,
    updateSignature: "80:update",
    ...settings,
  };
}

function createSnapshot(
  settings: Partial<PartSequenceSnapshot> = {},
): PartSequenceSnapshot {
  return {
    activeIndex: 0,
    partCount: 1,
    partResetSignatures: ["reset-a"],
    playing: true,
    sourceSignature: "source",
    tempoBpm: 80,
    updateSignature: "80:update-before",
    ...settings,
  };
}

describe("Part sequence plan reconciliation", () => {
  it("does nothing when the effective plan is already current", () => {
    const plan = createPlan();

    expect(
      getPartSequencePlanReconciliation(
        createSnapshot({ updateSignature: plan.updateSignature }),
        plan,
      ),
    ).toBe("none");
  });

  it("updates future content without restarting the active Part", () => {
    expect(
      getPartSequencePlanReconciliation(createSnapshot(), createPlan()),
    ).toBe("update");
  });

  it("restarts when the active Part reset signature or tempo changes", () => {
    expect(
      getPartSequencePlanReconciliation(
        createSnapshot(),
        createPlan({ partResetSignatures: ["reset-a-next"] }),
      ),
    ).toBe("restart");
    expect(
      getPartSequencePlanReconciliation(
        createSnapshot(),
        createPlan({ tempoBpm: 90 }),
      ),
    ).toBe("restart");
  });

  it("defers content reconciliation across a scheduled handoff", () => {
    expect(
      getPartSequencePlanReconciliation(
        createSnapshot({ pendingIndex: 0 }),
        createPlan(),
      ),
    ).toBe("defer");
  });

  it("stops when the sequence structure changes or disappears", () => {
    expect(
      getPartSequencePlanReconciliation(
        createSnapshot(),
        createPlan({ sourceSignature: "different-source" }),
      ),
    ).toBe("stop");
    expect(getPartSequencePlanReconciliation(createSnapshot(), undefined)).toBe(
      "stop",
    );
  });
});
