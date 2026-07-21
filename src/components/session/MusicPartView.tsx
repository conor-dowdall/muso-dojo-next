"use client";

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { MusicPart } from "@/components/music-part/MusicPart";
import {
  createInstrumentCreationRangeContextFromSignature,
  createInstrumentCreationRangeContextSignature,
} from "@/components/instrument-creation/instrumentCreationRangeContext";
import { useAppStore } from "@/stores/appStore";
import { getPartBandModules } from "@/utils/music-part/partBand";
import { resolvePartBackingBand } from "@/utils/music-part/resolvePartBackingBand";
import { PartModuleView } from "./PartModuleView";
import { getSessionBackingBandConfig } from "@/utils/session/sessionBackingBand";
import {
  getBackingNotesSummary,
  getBackingRhythmSummary,
} from "./backingBandSummaries";

interface MusicPartViewProps {
  sessionId: string;
  partId: string;
  isPartSequenceActive?: boolean;
  isPerformanceMode?: boolean;
  onOpenSessionTempo?: (sessionId: string) => void;
  showReadOnlyIdentity?: boolean;
}

export function MusicPartView({
  sessionId,
  partId,
  isPartSequenceActive = false,
  isPerformanceMode = false,
  onOpenSessionTempo,
  showReadOnlyIdentity = false,
}: MusicPartViewProps) {
  const partSource = useAppStore(
    useShallow((state) => {
      const part = state.sessions[sessionId]?.parts.find(
        (candidatePart) => candidatePart.id === partId,
      );

      return part
        ? {
            automaticRhythm: part.automaticRhythm,
            band: part.band,
            durationInBars: part.durationInBars,
            noteCollectionKey: part.noteCollectionKey,
            rootNote: part.rootNote,
            showHeader: part.showHeader,
          }
        : undefined;
    }),
  );
  const backingNotesModules = useAppStore(
    useShallow((state) => {
      const modules = state.sessions[sessionId]?.parts.find(
        (part) => part.id === partId,
      )?.modules;

      return modules ? getPartBandModules(modules, "backingNotes") : [];
    }),
  );
  const rhythmModules = useAppStore(
    useShallow((state) => {
      const modules = state.sessions[sessionId]?.parts.find(
        (part) => part.id === partId,
      )?.modules;

      return modules ? getPartBandModules(modules, "rhythm") : [];
    }),
  );
  const moduleIds = useAppStore(
    useShallow(
      (state) =>
        state.sessions[sessionId]?.parts
          .find((part) => part.id === partId)
          ?.modules.map((module) => module.id) ?? [],
    ),
  );
  const instrumentCreationRangeContextSignature = useAppStore(
    useShallow((state) => {
      const part = state.sessions[sessionId]?.parts.find(
        (candidatePart) => candidatePart.id === partId,
      );

      return createInstrumentCreationRangeContextSignature(part ? [part] : []);
    }),
  );
  const storedSessionBackingBand = useAppStore(
    (state) => state.sessions[sessionId]?.backingBand,
  );
  const sessionBackingBand = useMemo(
    () => getSessionBackingBandConfig(storedSessionBackingBand),
    [storedSessionBackingBand],
  );
  const resolvedBand = useMemo(
    () =>
      partSource
        ? resolvePartBackingBand(
            {
              automaticRhythm: partSource.automaticRhythm,
              band: partSource.band,
              durationInBars: partSource.durationInBars,
              modules: [...backingNotesModules, ...rhythmModules],
            },
            sessionBackingBand,
          )
        : undefined,
    [backingNotesModules, partSource, rhythmModules, sessionBackingBand],
  );
  const partSettings = useMemo(
    () =>
      partSource && resolvedBand
        ? {
            rootNote: partSource.rootNote,
            noteCollectionKey: partSource.noteCollectionKey,
            automaticLengthBeats: resolvedBand.perPartDurationBeats,
            effectiveLengthBeats: resolvedBand.durationBeats,
            band: resolvedBand.band,
            automaticRhythm: partSource.automaticRhythm ?? {
              style: "standard",
            },
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
                id: module.id,
                label: `Rhythm ${index + 1}`,
                detail:
                  module.type === "rhythm"
                    ? getBackingRhythmSummary(module.rhythm)
                    : undefined,
              })),
            },
            showHeader: partSource.showHeader,
          }
        : undefined,
    [backingNotesModules, partSource, resolvedBand, rhythmModules],
  );
  const setPartRootNote = useAppStore((state) => state.setPartRootNote);
  const setPartNoteCollectionKey = useAppStore(
    (state) => state.setPartNoteCollectionKey,
  );
  const setPartBandSource = useAppStore((state) => state.setPartBandSource);
  const addPartModules = useAppStore((state) => state.addPartModules);
  const clonePart = useAppStore((state) => state.clonePart);
  const removePart = useAppStore((state) => state.removePart);
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
      isPartSequenceActive={isPartSequenceActive}
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
