"use client";

import { useMemo } from "react";
import { MusicPart } from "@/components/music-part/MusicPart";
import {
  createInstrumentCreationRangeContextFromSignature,
  createInstrumentCreationRangeContextSignature,
} from "@/components/instrument-creation/instrumentCreationRangeContext";
import { useAppStore } from "@/stores/appStore";
import { getPartBandModules } from "@/utils/music-part/partBand";
import { resolvePartBackingBand } from "@/utils/music-part/resolvePartBackingBand";
import { PartModuleView } from "./PartModuleView";
import { selectPart } from "./sessionSelectors";
import { getSessionBackingBandConfig } from "@/utils/session/sessionBackingBand";
import {
  getBackingNotesSummary,
  getBackingRhythmSummary,
} from "./backingBandSummaries";

interface MusicPartViewProps {
  sessionId: string;
  partId: string;
  isPerformanceMode?: boolean;
  onOpenSessionTempo?: (sessionId: string) => void;
  partSequenceState?: "active" | "pending";
  showReadOnlyIdentity?: boolean;
}

export function MusicPartView({
  sessionId,
  partId,
  isPerformanceMode = false,
  onOpenSessionTempo,
  partSequenceState,
  showReadOnlyIdentity = false,
}: MusicPartViewProps) {
  const part = useAppStore((state) => selectPart(state, sessionId, partId));
  const storedSessionBackingBand = useAppStore(
    (state) => state.sessions[sessionId]?.backingBand,
  );
  const sessionBackingBand = useMemo(
    () => getSessionBackingBandConfig(storedSessionBackingBand),
    [storedSessionBackingBand],
  );
  const resolvedBand = useMemo(
    () => (part ? resolvePartBackingBand(part, sessionBackingBand) : undefined),
    [part, sessionBackingBand],
  );
  const partSettings = useMemo(
    () =>
      part && resolvedBand
        ? {
            rootNote: part.rootNote,
            noteCollectionKey: part.noteCollectionKey,
            automaticLengthBeats: resolvedBand.perPartDurationBeats,
            effectiveLengthBeats: resolvedBand.durationBeats,
            band: resolvedBand.band,
            automaticRhythm: part.automaticRhythm ?? {
              style: "standard",
            },
            bandModuleOptions: {
              backingNotes: getPartBandModules(
                part.modules,
                "backingNotes",
              ).map((module, index) => ({
                detail:
                  module.type === "exercise-looper"
                    ? getBackingNotesSummary(module)
                    : undefined,
                id: module.id,
                label: `Looper ${index + 1}`,
              })),
              rhythm: getPartBandModules(part.modules, "rhythm").map(
                (module, index) => ({
                  id: module.id,
                  label: `Rhythm ${index + 1}`,
                  detail:
                    module.type === "rhythm"
                      ? getBackingRhythmSummary(module.rhythm)
                      : undefined,
                }),
              ),
            },
            showHeader: part.showHeader,
          }
        : undefined,
    [part, resolvedBand],
  );
  const moduleIds = useMemo(
    () => part?.modules.map((module) => module.id) ?? [],
    [part],
  );
  const setPartRootNote = useAppStore((state) => state.setPartRootNote);
  const setPartNoteCollectionKey = useAppStore(
    (state) => state.setPartNoteCollectionKey,
  );
  const setPartBandSource = useAppStore((state) => state.setPartBandSource);
  const addPartModules = useAppStore((state) => state.addPartModules);
  const clonePart = useAppStore((state) => state.clonePart);
  const removePart = useAppStore((state) => state.removePart);
  const instrumentCreationRangeContextSignature = useMemo(
    () => createInstrumentCreationRangeContextSignature(part ? [part] : []),
    [part],
  );
  const instrumentCreationRangeContext =
    createInstrumentCreationRangeContextFromSignature(
      instrumentCreationRangeContextSignature,
    );
  if (!partSettings) {
    return null;
  }

  return (
    <MusicPart
      sessionId={sessionId}
      partId={partId}
      partSequenceState={partSequenceState}
      instrumentCreationRangeContext={instrumentCreationRangeContext}
      isPerformanceMode={isPerformanceMode}
      rootNote={partSettings.rootNote}
      automaticLengthBeats={partSettings.automaticLengthBeats}
      effectiveLengthBeats={partSettings.effectiveLengthBeats}
      band={partSettings.band}
      automaticRhythm={partSettings.automaticRhythm}
      bandModuleOptions={partSettings.bandModuleOptions}
      sessionBackingBand={sessionBackingBand}
      onBandSourceChange={(role, source) =>
        setPartBandSource(sessionId, partId, role, source)
      }
      onRootNoteChange={(rootNote) =>
        setPartRootNote(sessionId, partId, rootNote)
      }
      noteCollectionKey={partSettings.noteCollectionKey}
      onNoteCollectionKeyChange={(noteCollectionKey) =>
        setPartNoteCollectionKey(sessionId, partId, noteCollectionKey)
      }
      showHeader={isPerformanceMode ? false : partSettings.showHeader}
      showReadOnlyIdentity={showReadOnlyIdentity}
      onAddPartModules={
        isPerformanceMode
          ? undefined
          : (requests) => addPartModules(sessionId, partId, requests)
      }
      onClonePart={
        isPerformanceMode ? undefined : () => clonePart(sessionId, partId)
      }
      onRemovePart={
        isPerformanceMode ? undefined : () => removePart(sessionId, partId)
      }
    >
      {moduleIds.map((moduleId) => (
        <PartModuleView
          key={moduleId}
          sessionId={sessionId}
          partId={partId}
          moduleId={moduleId}
          isPerformanceMode={isPerformanceMode}
          onOpenSessionTempo={onOpenSessionTempo}
        />
      ))}
    </MusicPart>
  );
}
