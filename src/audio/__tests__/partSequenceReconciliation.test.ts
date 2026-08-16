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
    tempoBpm: 80,
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
    tempoSignature: "tempo-80",
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
    tempoSignature: "tempo-80",
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

  it("updates a live completion-mode change and defers it across a queued handoff", () => {
    const loopPlan = createPlan({
      completionPolicy: "loop",
      loopPartCount: 1,
      updateSignature: "80:loop",
    });

    expect(getPartSequencePlanReconciliation(createSnapshot(), loopPlan)).toBe(
      "update",
    );
    expect(
      getPartSequencePlanReconciliation(
        createSnapshot({ pendingIndex: 0, pendingKind: "handoff" }),
        loopPlan,
      ),
    ).toBe("defer");
  });

  it("restarts when the active Part reset signature changes", () => {
    expect(
      getPartSequencePlanReconciliation(
        createSnapshot(),
        createPlan({ partResetSignatures: ["reset-a-next"] }),
      ),
    ).toBe("restart");
  });

  it("retimes immediately even when a Part handoff is already queued", () => {
    expect(
      getPartSequencePlanReconciliation(
        createSnapshot({ pendingIndex: 0, pendingKind: "handoff" }),
        createPlan({ tempoBpm: 90, tempoSignature: "tempo-90" }),
      ),
    ).toBe("retime");
  });

  it("stops Arrangement playback when its effective tempo map changes", () => {
    expect(
      getPartSequencePlanReconciliation(
        createSnapshot(),
        createPlan({ mode: "arrangement", tempoSignature: "tempo-90" }),
      ),
    ).toBe("stop");
  });

  it("retimes Play From Here Session playback", () => {
    expect(
      getPartSequencePlanReconciliation(
        createSnapshot(),
        createPlan({
          mode: "session-from-part",
          tempoSignature: "tempo-90",
        }),
      ),
    ).toBe("retime");
  });

  it("defers content reconciliation across a scheduled handoff", () => {
    expect(
      getPartSequencePlanReconciliation(
        createSnapshot({ pendingIndex: 0 }),
        createPlan(),
      ),
    ).toBe("defer");
  });

  it("can replace a queued restart when the active content changes again", () => {
    expect(
      getPartSequencePlanReconciliation(
        createSnapshot({ pendingIndex: 0, pendingKind: "restart" }),
        createPlan({ partResetSignatures: ["reset-a-next"] }),
      ),
    ).toBe("restart");
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
