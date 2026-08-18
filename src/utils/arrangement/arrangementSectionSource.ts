import { createPartSequencePlaybackPlan } from "@/audio/partSequencePlanning";
import { type ArrangementSectionConfig } from "@/types/arrangement";
import { type MusicPartConfig, type SessionConfig } from "@/types/session";
import { cloneMusicPartGraph } from "./cloneMusicPartGraph";

export type ArrangementSectionSourceStatus =
  "changed" | "current" | "empty" | "unavailable";

function canonicalizeParts(parts: readonly MusicPartConfig[]) {
  let moduleIndex = 0;
  let partIndex = 0;
  let progressionIndex = 0;

  return cloneMusicPartGraph(parts, {
    createModuleId: () => `module-${moduleIndex++}`,
    createPartId: () => `part-${partIndex++}`,
    createProgressionInstanceId: () => `progression-${progressionIndex++}`,
  });
}

function createArrangementRelevantSignature(
  session: Pick<SessionConfig, "backingBand" | "parts">,
) {
  const parts = canonicalizeParts(session.parts);
  const plan = createPartSequencePlaybackPlan({
    backingBand: session.backingBand,
    id: "arrangement-source",
    lastModified: "",
    name: "Arrangement Source",
    parts,
    tempoBpm: 80,
    workspaceViewMode: "session",
  });

  return JSON.stringify({
    chart: parts.map(
      ({
        authoredProgression,
        durationInBars,
        noteCollectionKey,
        rootNote,
      }) => ({
        authoredProgression,
        durationInBars,
        noteCollectionKey,
        rootNote,
      }),
    ),
    countIn: plan.countIn,
    playback: plan.parts.map(({ updateSignature }) => updateSignature),
  });
}

export function getArrangementSectionSourceStatus(
  section: ArrangementSectionConfig,
  session: SessionConfig | undefined,
): ArrangementSectionSourceStatus {
  if (!session) {
    return "unavailable";
  }

  if (session.parts.length === 0) {
    return "empty";
  }

  return createArrangementRelevantSignature(section) ===
    createArrangementRelevantSignature(session)
    ? "current"
    : "changed";
}

export function getUpdateableArrangementSections(
  sections: readonly ArrangementSectionConfig[],
  sessions: Readonly<Record<string, SessionConfig>>,
) {
  return sections.filter((section) => {
    const session = sessions[section.source.sessionId];
    return getArrangementSectionSourceStatus(section, session) === "changed";
  });
}
