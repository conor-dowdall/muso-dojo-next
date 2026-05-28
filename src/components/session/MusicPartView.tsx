"use client";

import { useShallow } from "zustand/react/shallow";
import { MusicPart } from "@/components/music-part/MusicPart";
import { useAppStore } from "@/stores/appStore";
import { PartModuleView } from "./PartModuleView";
import { selectPart } from "./sessionSelectors";
import { isInstrumentPartModule } from "@/utils/session/partModuleTypes";
import { type DisplayFormatId } from "@/data/displayFormats";
import { type InstrumentNoteEmphasis } from "@/types/instrument-note-emphasis";

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
  const instrumentSettingValues = useAppStore(
    useShallow(
      (state) =>
        selectPart(state, sessionId, partId)
          ?.modules.filter(isInstrumentPartModule)
          .flatMap((partModule) => [
            partModule.id,
            partModule.instrument.displayFormatId ?? "note-names",
            partModule.instrument.noteEmphasis ?? "large",
          ]) ?? [],
    ),
  );
  const instrumentSettings = [];

  for (let index = 0; index < instrumentSettingValues.length; index += 3) {
    instrumentSettings.push({
      id: instrumentSettingValues[index] as string,
      displayFormatId: instrumentSettingValues[index + 1] as DisplayFormatId,
      noteEmphasis: instrumentSettingValues[
        index + 2
      ] as InstrumentNoteEmphasis,
    });
  }
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
  const setPartDisplayFormatId = useAppStore(
    (state) => state.setPartDisplayFormatId,
  );
  const setPartNoteEmphasis = useAppStore((state) => state.setPartNoteEmphasis);
  const addPartModule = useAppStore((state) => state.addPartModule);
  const clonePart = useAppStore((state) => state.clonePart);
  const removePart = useAppStore((state) => state.removePart);

  if (!partSettings) {
    return null;
  }

  return (
    <MusicPart
      partId={partId}
      instrumentSettings={instrumentSettings}
      onPartDisplayFormatIdChange={
        isPerformanceMode
          ? undefined
          : (displayFormatId) =>
              setPartDisplayFormatId(sessionId, partId, displayFormatId)
      }
      onPartNoteEmphasisChange={
        isPerformanceMode
          ? undefined
          : (noteEmphasis) =>
              setPartNoteEmphasis(sessionId, partId, noteEmphasis)
      }
      rootNote={partSettings.rootNote}
      onRootNoteChange={(rootNote) =>
        setPartRootNote(sessionId, partId, rootNote)
      }
      noteCollectionKey={partSettings.noteCollectionKey}
      onNoteCollectionKeyChange={(noteCollectionKey) =>
        setPartNoteCollectionKey(sessionId, partId, noteCollectionKey)
      }
      showHeader={!isPerformanceMode && partSettings.showHeader}
      onAddPartModule={
        isPerformanceMode
          ? undefined
          : (type, settings) => addPartModule(sessionId, partId, type, settings)
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
