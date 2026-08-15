import {
  type ArrangementConfig,
  type ArrangementSectionConfig,
} from "@/types/arrangement";
import {
  createPartSequencePlaybackPlan,
  createPartSequenceTempoSignature,
  type PartSequencePlaybackPlan,
  type PartSequenceStartOptions,
  type PartSequenceStepPlan,
} from "./partSequencePlanning";

export interface ArrangementPlaybackRequest {
  plan: PartSequencePlaybackPlan;
  start: PartSequenceStartOptions;
}

function namespaceStep(
  step: PartSequenceStepPlan,
  namespace: string,
  context: NonNullable<PartSequenceStepPlan["arrangement"]>,
  index: number,
): PartSequenceStepPlan {
  const exerciseRequests = step.exerciseRequests.map((request) => ({
    ...request,
    id: `${namespace}:${request.id}`,
  }));
  const rhythmRequests = step.rhythmRequests.map((request) => ({
    ...request,
    id: `${namespace}:${request.id}`,
  }));
  const resetSignature = JSON.stringify({
    continueRhythm: index === 0 ? false : step.continueRhythm,
    namespace,
    source: step.resetSignature,
  });
  const updateSignature = JSON.stringify({
    namespace,
    source: step.updateSignature,
  });
  return {
    ...step,
    arrangement: context,
    continueRhythm: index === 0 ? false : step.continueRhythm,
    exerciseRequests,
    index,
    partId: `${namespace}:${step.partId}`,
    sourcePartId: step.partId,
    stepId: `${namespace}:${step.partId}`,
    resetSignature,
    rhythmRequests,
    updateSignature,
  };
}

function createSectionSteps({
  arrangement,
  entryId,
  entryIndex,
  playCount,
  playIndex,
  section,
  tempoBpm,
}: {
  arrangement: ArrangementConfig;
  entryId: string;
  entryIndex: number;
  playCount: number;
  playIndex: number;
  section: ArrangementSectionConfig;
  tempoBpm: number;
}) {
  const sectionPlan = createPartSequencePlaybackPlan({
    backingBand: section.backingBand,
    id: `${arrangement.id}:${section.id}`,
    lastModified: arrangement.lastModified,
    name: section.source.sessionName,
    parts: section.parts,
    tempoBpm,
    workspaceViewMode: "session",
  });
  const namespace = `${arrangement.id}:${entryId}:${playIndex + 1}`;
  return sectionPlan.parts.map((step, sectionPartIndex) =>
    namespaceStep(
      step,
      namespace,
      {
        entryId,
        entryIndex,
        sectionId: section.id,
        playIndex,
        playCount,
        sourcePartId: step.partId,
      },
      sectionPartIndex,
    ),
  );
}

export function createArrangementPlaybackRequest(
  arrangement: ArrangementConfig,
): ArrangementPlaybackRequest | undefined {
  const sectionById = new Map(
    arrangement.sections.map((section) => [section.id, section]),
  );
  if (
    arrangement.entries.length === 0 ||
    arrangement.entries.some(
      (entry) => (sectionById.get(entry.sectionId)?.parts.length ?? 0) === 0,
    )
  ) {
    return undefined;
  }

  const steps: PartSequenceStepPlan[] = [];
  arrangement.entries.forEach((entry, entryIndex) => {
    const section = sectionById.get(entry.sectionId)!;
    for (let playIndex = 0; playIndex < entry.playCount; playIndex += 1) {
      const sectionSteps = createSectionSteps({
        arrangement,
        entryId: entry.id,
        entryIndex,
        playCount: entry.playCount,
        playIndex,
        section,
        tempoBpm: entry.tempoOverrideBpm ?? arrangement.tempoBpm,
      });
      steps.push(
        ...sectionSteps.map((step) => ({
          ...step,
          index: steps.length + step.index,
        })),
      );
    }
  });
  const firstSection = sectionById.get(arrangement.entries[0]!.sectionId)!;
  const countIn = {
    durationBeats: firstSection.backingBand.countInBeats,
    pulses: firstSection.backingBand.countInBeats,
  };
  const sourceSignature = JSON.stringify({
    owner: arrangement.id,
    mode: "arrangement",
    steps: steps.map((step) => ({
      stepId: step.stepId,
      sourcePartId: step.sourcePartId,
      arrangement: step.arrangement,
    })),
  });
  const contentSignature = JSON.stringify(
    steps.map(({ stepId, resetSignature }) => ({ stepId, resetSignature })),
  );
  const tempoSignature = createPartSequenceTempoSignature(steps);
  const updateSignature = `${tempoSignature}:${arrangement.playbackMode}:${JSON.stringify(
    steps.map(({ stepId, updateSignature }) => ({ stepId, updateSignature })),
  )}`;
  const completionPolicy =
    arrangement.playbackMode === "loop" ? "loop" : "stop-at-end";
  const plan: PartSequencePlaybackPlan = {
    completionPolicy,
    countIn,
    contentSignature,
    mode: "arrangement",
    owner: { kind: "arrangement", id: arrangement.id },
    partResetSignatures: steps.map(({ resetSignature }) => resetSignature),
    parts: steps,
    steps,
    sessionId: arrangement.id,
    signature: `${tempoSignature}:${completionPolicy}:${contentSignature}`,
    sourceSignature,
    tempoBpm: arrangement.tempoBpm,
    tempoSignature,
    updateSignature,
  };
  return { plan, start: { startIndex: 0, countIn } };
}

export function createArrangementEntryLoopPlaybackRequest(
  arrangement: ArrangementConfig,
  entryId: string,
): ArrangementPlaybackRequest | undefined {
  const entryIndex = arrangement.entries.findIndex(({ id }) => id === entryId);
  const entry = arrangement.entries[entryIndex];
  const section = arrangement.sections.find(
    ({ id }) => id === entry?.sectionId,
  );
  if (!entry || !section || section.parts.length === 0) return undefined;

  const steps = createSectionSteps({
    arrangement,
    entryId: entry.id,
    entryIndex,
    playCount: 1,
    playIndex: 0,
    section,
    tempoBpm: entry.tempoOverrideBpm ?? arrangement.tempoBpm,
  });
  const countIn = {
    durationBeats: section.backingBand.countInBeats,
    pulses: section.backingBand.countInBeats,
  };
  const sourceSignature = JSON.stringify({
    owner: arrangement.id,
    mode: "arrangement-entry-loop",
    steps: steps.map((step) => ({
      stepId: step.stepId,
      sourcePartId: step.sourcePartId,
      arrangement: step.arrangement,
    })),
  });
  const contentSignature = JSON.stringify(
    steps.map(({ stepId, resetSignature }) => ({ stepId, resetSignature })),
  );
  const tempoSignature = createPartSequenceTempoSignature(steps);
  const stepUpdateSignature = JSON.stringify(
    steps.map(({ stepId, updateSignature }) => ({ stepId, updateSignature })),
  );
  const plan: PartSequencePlaybackPlan = {
    completionPolicy: "loop",
    countIn,
    contentSignature,
    mode: "arrangement-entry-loop",
    owner: { kind: "arrangement", id: arrangement.id },
    partResetSignatures: steps.map(({ resetSignature }) => resetSignature),
    parts: steps,
    steps,
    sessionId: arrangement.id,
    signature: `${tempoSignature}:loop:${contentSignature}`,
    sourceSignature,
    tempoBpm: arrangement.tempoBpm,
    tempoSignature,
    updateSignature: `${tempoSignature}:loop:${stepUpdateSignature}`,
  };
  return { plan, start: { startIndex: 0, countIn } };
}
