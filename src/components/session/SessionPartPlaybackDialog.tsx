"use client";

import { useMemo } from "react";
import {
  PartPlaybackDialog,
  type PartPlaybackDialogModel,
} from "@/components/music-part/PartPlaybackDialog";
import { useAppStore } from "@/stores/appStore";
import { getPartBandModules } from "@/utils/music-part/partBand";
import { resolvePartBackingBand } from "@/utils/music-part/resolvePartBackingBand";
import { getSessionBackingBandConfig } from "@/utils/session/sessionBackingBand";
import {
  getBackingNotesSummary,
  getBackingRhythmSummary,
} from "./backingBandSummaries";

export function SessionPartPlaybackDialog({
  isOpen,
  onClose,
  partId,
  sessionId,
}: {
  isOpen: boolean;
  onClose: () => void;
  partId: string;
  sessionId: string;
}) {
  const session = useAppStore((state) => state.sessions[sessionId]);
  const setPartBandSource = useAppStore((state) => state.setPartBandSource);
  const model = useMemo((): PartPlaybackDialogModel | undefined => {
    const part = session?.parts.find((candidate) => candidate.id === partId);
    if (!part || !session) return undefined;

    const backingBand = getSessionBackingBandConfig(session.backingBand);
    const backingNotesModules = getPartBandModules(
      part.modules,
      "backingNotes",
    );
    const rhythmModules = getPartBandModules(part.modules, "rhythm");
    const resolvedBand = resolvePartBackingBand(part, backingBand);

    return {
      automaticLengthBeats: resolvedBand.perPartDurationBeats,
      automaticRhythm: part.automaticRhythm ?? { style: "standard" },
      band: resolvedBand.band,
      bandModuleOptions: {
        backingNotes: backingNotesModules.map((module, index) => ({
          detail:
            module.type === "exercise-looper"
              ? getBackingNotesSummary(module)
              : undefined,
          id: module.id,
          label: `Looper ${index + 1}`,
        })),
        rhythm: rhythmModules.map((module, index) => ({
          detail:
            module.type === "rhythm"
              ? getBackingRhythmSummary(module.rhythm)
              : undefined,
          id: module.id,
          label: `Rhythm ${index + 1}`,
        })),
      },
      partId,
      sessionBackingBand: backingBand,
      sessionId,
      setBandSource: (role, source) =>
        setPartBandSource(sessionId, partId, role, source),
    };
  }, [partId, session, sessionId, setPartBandSource]);
  const partIndex =
    session?.parts.findIndex((candidate) => candidate.id === partId) ?? -1;

  if (!model || partIndex < 0) return null;

  return (
    <PartPlaybackDialog
      isOpen={isOpen}
      part={model}
      title={`Playback for Part ${String(partIndex + 1).padStart(2, "0")}`}
      variant="transport"
      onClose={onClose}
    />
  );
}
