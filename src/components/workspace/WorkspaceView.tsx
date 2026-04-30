"use client";

import { memo } from "react";
import { useShallow } from "zustand/react/shallow";
import { MusicGroup } from "@/components/music-group/MusicGroup";
import { Fretboard } from "@/components/fretboard/Fretboard";
import { Keyboard } from "@/components/keyboard/Keyboard";
import { useAppStore } from "@/stores/appStore";
import { type ActiveNotes } from "@/types/instrument-active-note";
import { type InstrumentNoteEmphasis } from "@/types/instrument-note-emphasis";
import { type SettingValue } from "@/types/state";
import { type DisplayFormatId } from "@/data/displayFormats";

interface WorkspaceViewProps {
  workspaceId: string;
}

function selectGroup(
  state: ReturnType<typeof useAppStore.getState>,
  workspaceId: string,
  groupId: string,
) {
  return state.workspaces[workspaceId]?.groups.find(
    (group) => group.id === groupId,
  );
}

const InstrumentView = memo(function InstrumentView({
  workspaceId,
  groupId,
  instrumentId,
}: {
  workspaceId: string;
  groupId: string;
  instrumentId: string;
}) {
  const instrument = useAppStore((state) =>
    selectGroup(state, workspaceId, groupId)?.instruments.find(
      (candidateInstrument) => candidateInstrument.id === instrumentId,
    ),
  );
  const setInstrumentDisplayFormatId = useAppStore(
    (state) => state.setInstrumentDisplayFormatId,
  );
  const setInstrumentNoteEmphasis = useAppStore(
    (state) => state.setInstrumentNoteEmphasis,
  );
  const setInstrumentActiveNotes = useAppStore(
    (state) => state.setInstrumentActiveNotes,
  );
  const cloneInstrument = useAppStore((state) => state.cloneInstrument);
  const removeInstrument = useAppStore((state) => state.removeInstrument);

  if (!instrument) {
    return null;
  }

  const sharedProps = {
    rootNote: instrument.rootNote,
    noteCollectionKey: instrument.noteCollectionKey,
    displayFormatId: instrument.displayFormatId,
    onDisplayFormatIdChange: (displayFormatId: SettingValue<DisplayFormatId>) =>
      setInstrumentDisplayFormatId(
        workspaceId,
        groupId,
        instrument.id,
        displayFormatId,
      ),
    noteEmphasis: instrument.noteEmphasis,
    onNoteEmphasisChange: (
      noteEmphasis: SettingValue<InstrumentNoteEmphasis>,
    ) =>
      setInstrumentNoteEmphasis(
        workspaceId,
        groupId,
        instrument.id,
        noteEmphasis,
      ),
    activeNotes: instrument.activeNotes,
    onActiveNotesChange: (activeNotes: SettingValue<ActiveNotes | undefined>) =>
      setInstrumentActiveNotes(
        workspaceId,
        groupId,
        instrument.id,
        activeNotes,
      ),
    layout: instrument.layout,
    showHeader: instrument.showHeader,
    showMidiNumbers: instrument.showMidiNumbers,
    onClone: () => cloneInstrument(workspaceId, groupId, instrument.id),
    onRemove: () => removeInstrument(workspaceId, groupId, instrument.id),
  };

  if (instrument.type === "fretboard") {
    return (
      <Fretboard
        {...sharedProps}
        theme={instrument.theme}
        config={instrument.config}
      />
    );
  }

  return (
    <Keyboard
      {...sharedProps}
      range={instrument.range}
      theme={instrument.theme}
      config={instrument.config}
    />
  );
});

const MusicGroupView = memo(function MusicGroupView({
  workspaceId,
  groupId,
}: {
  workspaceId: string;
  groupId: string;
}) {
  const groupSettings = useAppStore(
    useShallow((state) => {
      const group = selectGroup(state, workspaceId, groupId);

      return group
        ? {
            rootNote: group.rootNote,
            noteCollectionKey: group.noteCollectionKey,
            layout: group.layout,
            showHeader: group.showHeader,
          }
        : undefined;
    }),
  );
  const instrumentIds = useAppStore(
    useShallow(
      (state) =>
        selectGroup(state, workspaceId, groupId)?.instruments.map(
          (instrument) => instrument.id,
        ) ?? [],
    ),
  );
  const setGroupRootNote = useAppStore((state) => state.setGroupRootNote);
  const setGroupNoteCollectionKey = useAppStore(
    (state) => state.setGroupNoteCollectionKey,
  );
  const addInstrument = useAppStore((state) => state.addInstrument);
  const cloneMusicGroup = useAppStore((state) => state.cloneMusicGroup);
  const removeMusicGroup = useAppStore((state) => state.removeMusicGroup);

  if (!groupSettings) {
    return null;
  }

  return (
    <MusicGroup
      groupId={groupId}
      layout={groupSettings.layout}
      rootNote={groupSettings.rootNote}
      onRootNoteChange={(rootNote) =>
        setGroupRootNote(workspaceId, groupId, rootNote)
      }
      noteCollectionKey={groupSettings.noteCollectionKey}
      onNoteCollectionKeyChange={(noteCollectionKey) =>
        setGroupNoteCollectionKey(workspaceId, groupId, noteCollectionKey)
      }
      showHeader={groupSettings.showHeader}
      onAddInstrument={(type, settings) =>
        addInstrument(workspaceId, groupId, type, settings)
      }
      onCloneGroup={() => cloneMusicGroup(workspaceId, groupId)}
      onRemoveGroup={() => removeMusicGroup(workspaceId, groupId)}
    >
      {instrumentIds.map((instrumentId) => (
        <InstrumentView
          key={instrumentId}
          workspaceId={workspaceId}
          groupId={groupId}
          instrumentId={instrumentId}
        />
      ))}
    </MusicGroup>
  );
});

export function WorkspaceView({ workspaceId }: WorkspaceViewProps) {
  const groupIds = useAppStore(
    useShallow(
      (state) =>
        state.workspaces[workspaceId]?.groups.map((group) => group.id) ?? [],
    ),
  );

  return (
    <>
      {groupIds.map((groupId) => (
        <MusicGroupView
          key={groupId}
          workspaceId={workspaceId}
          groupId={groupId}
        />
      ))}
    </>
  );
}
