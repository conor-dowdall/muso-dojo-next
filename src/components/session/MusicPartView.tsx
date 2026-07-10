"use client";

import { useShallow } from "zustand/react/shallow";
import { MusicPart } from "@/components/music-part/MusicPart";
import {
  createInstrumentCreationRangeContextFromSignature,
  createInstrumentCreationRangeContextSignature,
} from "@/components/instrument-creation/instrumentCreationRangeContext";
import { useAppStore } from "@/stores/appStore";
import { getPartLengthBeats } from "@/utils/music-part/partLength";
import { usePartPlayback } from "@/hooks/audio/usePartPlayback";
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
  const partSettings = useAppStore(
    useShallow((state) => {
      const part = selectPart(state, sessionId, partId);

      return part
        ? {
            rootNote: part.rootNote,
            noteCollectionKey: part.noteCollectionKey,
            lengthBeats: part.lengthBeats,
            showHeader: part.showHeader,
          }
        : undefined;
    }),
  );
  const moduleIds = useAppStore(
    useShallow(
      (state) =>
        selectPart(state, sessionId, partId)?.modules.map(
          (module) => module.id,
        ) ?? [],
    ),
  );
  const setPartRootNote = useAppStore((state) => state.setPartRootNote);
  const setPartNoteCollectionKey = useAppStore(
    (state) => state.setPartNoteCollectionKey,
  );
  const setPartLengthBeats = useAppStore((state) => state.setPartLengthBeats);
  const addPartModules = useAppStore((state) => state.addPartModules);
  const clonePart = useAppStore((state) => state.clonePart);
  const removePart = useAppStore((state) => state.removePart);
  const instrumentCreationRangeContextSignature = useAppStore(
    useShallow((state) => {
      const part = selectPart(state, sessionId, partId);

      return createInstrumentCreationRangeContextSignature(part ? [part] : []);
    }),
  );
  const instrumentCreationRangeContext =
    createInstrumentCreationRangeContextFromSignature(
      instrumentCreationRangeContextSignature,
    );
  const partPlayback = usePartPlayback(sessionId, partId);

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
      lengthBeats={partSettings.lengthBeats}
      onLengthBeatsChange={(lengthBeats) =>
        setPartLengthBeats(
          sessionId,
          partId,
          typeof lengthBeats === "function"
            ? lengthBeats(
                getPartLengthBeats({ lengthBeats: partSettings.lengthBeats }),
              )
            : lengthBeats,
        )
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
      partPlaybackActive={partPlayback.isActive}
      onTogglePartPlayback={
        isPerformanceMode || !partPlayback.canPlay
          ? undefined
          : partPlayback.toggle
      }
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
