"use client";

import { useShallow } from "zustand/react/shallow";
import { MusicPart } from "@/components/music-part/MusicPart";
import {
  createInstrumentCreationRangeContextFromSignature,
  createInstrumentCreationRangeContextSignature,
} from "@/components/instrument-creation/instrumentCreationRangeContext";
import { useAppStore } from "@/stores/appStore";
import { PartModuleView } from "./PartModuleView";
import { selectPart } from "./sessionSelectors";

interface MusicPartViewProps {
  sessionId: string;
  partId: string;
  isPerformanceMode?: boolean;
}

export function MusicPartView({
  sessionId,
  partId,
  isPerformanceMode = false,
}: MusicPartViewProps) {
  const partSettings = useAppStore(
    useShallow((state) => {
      const part = selectPart(state, sessionId, partId);

      return part
        ? {
            rootNote: part.rootNote,
            noteCollectionKey: part.noteCollectionKey,
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

  if (!partSettings) {
    return null;
  }

  return (
    <MusicPart
      partId={partId}
      instrumentCreationRangeContext={instrumentCreationRangeContext}
      isPerformanceMode={isPerformanceMode}
      rootNote={partSettings.rootNote}
      onRootNoteChange={(rootNote) =>
        setPartRootNote(sessionId, partId, rootNote)
      }
      noteCollectionKey={partSettings.noteCollectionKey}
      onNoteCollectionKeyChange={(noteCollectionKey) =>
        setPartNoteCollectionKey(sessionId, partId, noteCollectionKey)
      }
      showHeader={isPerformanceMode ? true : partSettings.showHeader}
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
        />
      ))}
    </MusicPart>
  );
}
