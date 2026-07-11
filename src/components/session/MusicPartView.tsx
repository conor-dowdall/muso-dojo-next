"use client";

import { useMemo } from "react";
import { MusicPart } from "@/components/music-part/MusicPart";
import {
  createInstrumentCreationRangeContextFromSignature,
  createInstrumentCreationRangeContextSignature,
} from "@/components/instrument-creation/instrumentCreationRangeContext";
import { useAppStore } from "@/stores/appStore";
import {
  formatPartLengthBeats,
  getAutomaticRhythmBeats,
  getPartLengthBeats,
} from "@/utils/music-part/partLength";
import {
  getPartBandConfig,
  getPartBandModules,
} from "@/utils/music-part/partBand";
import { getRhythmSelectionRecipe } from "@/utils/rhythm/rhythmConfig";
import { PartModuleView } from "./PartModuleView";
import { selectPart } from "./sessionSelectors";

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
  const partSettings = useMemo(
    () =>
      part
        ? {
            rootNote: part.rootNote,
            noteCollectionKey: part.noteCollectionKey,
            effectiveLengthBeats: getPartLengthBeats(part),
            band: getPartBandConfig(part),
            automaticRhythm: part.automaticRhythm ?? {
              beats: getAutomaticRhythmBeats(part),
              style: "standard",
            },
            bandModuleOptions: {
              backingNotes: getPartBandModules(
                part.modules,
                "backingNotes",
              ).map((module, index) => ({
                id: module.id,
                label: `Looper ${index + 1}`,
              })),
              rhythm: getPartBandModules(part.modules, "rhythm").map(
                (module, index) => ({
                  id: module.id,
                  label: `Rhythm ${index + 1}`,
                  detail:
                    module.type === "rhythm"
                      ? formatPartLengthBeats(
                          getRhythmSelectionRecipe(module.rhythm).beats,
                        )
                      : undefined,
                }),
              ),
            },
            showHeader: part.showHeader,
          }
        : undefined,
    [part],
  );
  const moduleIds = useMemo(
    () => part?.modules.map((module) => module.id) ?? [],
    [part],
  );
  const setPartRootNote = useAppStore((state) => state.setPartRootNote);
  const setPartNoteCollectionKey = useAppStore(
    (state) => state.setPartNoteCollectionKey,
  );
  const setPartAutomaticRhythmBeats = useAppStore(
    (state) => state.setPartAutomaticRhythmBeats,
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
      partId={partId}
      partSequenceState={partSequenceState}
      instrumentCreationRangeContext={instrumentCreationRangeContext}
      isPerformanceMode={isPerformanceMode}
      rootNote={partSettings.rootNote}
      effectiveLengthBeats={partSettings.effectiveLengthBeats}
      band={partSettings.band}
      automaticRhythm={partSettings.automaticRhythm}
      bandModuleOptions={partSettings.bandModuleOptions}
      onAutomaticRhythmBeatsChange={(beats) =>
        setPartAutomaticRhythmBeats(
          sessionId,
          partId,
          typeof beats === "function"
            ? beats(partSettings.automaticRhythm.beats)
            : beats,
        )
      }
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
