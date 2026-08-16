import {
  type ArrangementConfig,
  type ArrangementEndingConfig,
  type ArrangementSectionConfig,
} from "@/types/arrangement";
import {
  RHYTHM_PPQ,
  getRhythmRecipeBarBeatCount,
  type RhythmPattern,
} from "@/data/rhythmPresets";
import { getArrangementEndingMidi } from "@/utils/arrangement/arrangementEnding";
import { resolvePartBackingBand } from "@/utils/music-part/resolvePartBackingBand";
import { getRhythmSelectionRecipe } from "@/utils/rhythm/rhythmConfig";
import {
  createPartSequencePlaybackPlan,
  createPartSequenceStepResetSignature,
  createPartSequenceStepUpdateSignature,
  createPartSequenceTempoSignature,
  type PartSequencePlaybackPlan,
  type PartSequenceStartOptions,
  type PartSequenceStepPlan,
} from "./partSequencePlanning";

export interface ArrangementPlaybackRequest {
  plan: PartSequencePlaybackPlan;
  start: PartSequenceStartOptions;
}

const ARRANGEMENT_ENDING_NOTE_VELOCITY = 0.72;
const ARRANGEMENT_ENDING_KICK_VELOCITY = 0.8;
const ARRANGEMENT_ENDING_CRASH_VELOCITY = 0.56;
const ARRANGEMENT_ENDING_RELEASE_SECONDS = 1.4;

function createArrangementSourceSignature(
  arrangementId: string,
  mode: Extract<
    PartSequencePlaybackPlan["mode"],
    "arrangement" | "arrangement-from-entry" | "arrangement-entry-loop"
  >,
  steps: readonly PartSequenceStepPlan[],
) {
  return JSON.stringify({
    owner: arrangementId,
    mode,
    steps: steps.map((step) => ({
      stepId: step.stepId,
      sourcePartId: step.sourcePartId,
      arrangement: step.arrangement,
    })),
  });
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

function createEndingStep({
  arrangement,
  ending,
  finalSection,
  index,
}: {
  arrangement: ArrangementConfig;
  ending: ArrangementEndingConfig;
  finalSection: ArrangementSectionConfig;
  index: number;
}): PartSequenceStepPlan {
  const finalEntryIndex = arrangement.entries.length - 1;
  const finalEntry = arrangement.entries[finalEntryIndex]!;
  const finalPart = finalSection.parts.at(-1)!;
  const tempoBpm = finalEntry.tempoOverrideBpm ?? arrangement.tempoBpm;
  const resolvedBand = resolvePartBackingBand(
    finalPart,
    finalSection.backingBand,
  );
  const finalRhythmRecipe = getRhythmSelectionRecipe(
    resolvedBand.rhythm.selection,
  );
  const durationBeats = getRhythmRecipeBarBeatCount(finalRhythmRecipe);
  const stepId = `${arrangement.id}:ending`;
  const exerciseRequests = [
    {
      countInBeats: 0 as const,
      events: [
        {
          durationBeats,
          gateRatio: 1,
          midi: getArrangementEndingMidi(ending),
          offsetBeats: 0,
          stepIndex: 0,
          sustainTailSeconds: ARRANGEMENT_ENDING_RELEASE_SECONDS,
          velocity: ARRANGEMENT_ENDING_NOTE_VELOCITY,
        },
      ],
      id: `${stepId}:note`,
      metronomeEnabled: false,
      presetId: ending.audioPresetId,
      tempoBpm,
    },
  ];
  const endingPattern: RhythmPattern = {
    cycleTicks: durationBeats * RHYTHM_PPQ,
    hits: [
      {
        atTicks: 0,
        sampleId: "kick" as const,
        velocity: ARRANGEMENT_ENDING_KICK_VELOCITY,
      },
      {
        atTicks: 0,
        sampleId: "crash" as const,
        velocity: ARRANGEMENT_ENDING_CRASH_VELOCITY,
      },
    ],
    meter: { beatUnit: 4, beats: durationBeats },
    ppq: RHYTHM_PPQ,
  };
  const rhythmRequests = [
    {
      id: `${stepId}:percussion`,
      pattern: endingPattern,
      tempoBpm,
    },
  ];
  const signatureInput = {
    continueRhythm: false,
    durationBeats,
    exerciseRequests,
    rhythmRequests,
  };
  const resetSignature = createPartSequenceStepResetSignature(signatureInput);
  const updateSignature = createPartSequenceStepUpdateSignature(signatureInput);

  return {
    arrangement: {
      entryId: finalEntry.id,
      entryIndex: finalEntryIndex,
      sectionId: finalSection.id,
      playIndex: finalEntry.playCount - 1,
      playCount: finalEntry.playCount,
      sourcePartId: finalPart.id,
    },
    ...signatureInput,
    index,
    partId: stepId,
    releaseSeconds: ARRANGEMENT_ENDING_RELEASE_SECONDS,
    sourcePartId: finalPart.id,
    stepId,
    resetSignature,
    tempoBpm,
    updateSignature,
  };
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
  const loopPartCount = steps.length;
  if (arrangement.ending) {
    const finalEntry = arrangement.entries.at(-1)!;
    const finalSection = sectionById.get(finalEntry.sectionId)!;
    steps.push(
      createEndingStep({
        arrangement,
        ending: arrangement.ending,
        finalSection,
        index: steps.length,
      }),
    );
  }
  const firstSection = sectionById.get(arrangement.entries[0]!.sectionId)!;
  const countIn = {
    durationBeats: firstSection.backingBand.countInBeats,
    pulses: firstSection.backingBand.countInBeats,
  };
  const sourceSignature = createArrangementSourceSignature(
    arrangement.id,
    "arrangement",
    steps,
  );
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
    loopPartCount,
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

export function createArrangementPlaybackRequestFromEntry(
  arrangement: ArrangementConfig,
  entryId: string,
): ArrangementPlaybackRequest | undefined {
  const request = createArrangementPlaybackRequest(arrangement);
  const entry = arrangement.entries.find(({ id }) => id === entryId);
  const section = arrangement.sections.find(
    ({ id }) => id === entry?.sectionId,
  );
  const startIndex = request?.plan.parts.findIndex(
    (step) => step.arrangement?.entryId === entryId,
  );
  if (
    !request ||
    !entry ||
    !section ||
    startIndex === undefined ||
    startIndex < 0
  ) {
    return undefined;
  }

  const countIn = {
    durationBeats: section.backingBand.countInBeats,
    pulses: section.backingBand.countInBeats,
  };
  const plan: PartSequencePlaybackPlan = {
    ...request.plan,
    countIn,
    mode: "arrangement-from-entry",
    signature: `arrangement-from-entry:${request.plan.signature}`,
    sourceSignature: createArrangementSourceSignature(
      arrangement.id,
      "arrangement-from-entry",
      request.plan.parts,
    ),
    updateSignature: `arrangement-from-entry:${request.plan.updateSignature}`,
  };
  return {
    plan,
    start: { countIn, startIndex },
  };
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
  const sourceSignature = createArrangementSourceSignature(
    arrangement.id,
    "arrangement-entry-loop",
    steps,
  );
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
