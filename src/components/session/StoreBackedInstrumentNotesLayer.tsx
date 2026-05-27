"use client";

import { FretboardNotesLayer } from "@/components/fretboard/FretboardNotesLayer";
import { KeyboardNotesLayer } from "@/components/keyboard/KeyboardNotesLayer";
import { useAppStore } from "@/stores/appStore";
import { type ActiveNotes } from "@/types/instrument-active-note";
import { type InstrumentNotesLayerProps } from "@/types/instrument";
import { type SettingValue } from "@/types/state";
import { selectInstrumentForModule } from "./sessionSelectors";

type StoreBackedNotesLayerProps = Pick<
  InstrumentNotesLayerProps,
  "audioPresetId"
> & {
  sessionId: string;
  partId: string;
  moduleId: string;
};

function useStoreBackedInstrumentNotes({
  sessionId,
  partId,
  moduleId,
}: Pick<StoreBackedNotesLayerProps, "sessionId" | "partId" | "moduleId">) {
  const activeNotes = useAppStore(
    (state) =>
      selectInstrumentForModule(state, sessionId, partId, moduleId)
        ?.activeNotes,
  );
  const activeNotesLocked = useAppStore(
    (state) =>
      selectInstrumentForModule(state, sessionId, partId, moduleId)
        ?.activeNotesLocked === true,
  );
  const setInstrumentActiveNotes = useAppStore(
    (state) => state.setInstrumentActiveNotes,
  );
  const onActiveNotesChange = (
    activeNotes: SettingValue<ActiveNotes | undefined>,
  ) => setInstrumentActiveNotes(sessionId, partId, moduleId, activeNotes);

  return {
    activeNotes,
    activeNotesLocked,
    onActiveNotesChange,
  };
}

export function StoreBackedFretboardNotesLayer({
  sessionId,
  partId,
  moduleId,
  audioPresetId,
}: StoreBackedNotesLayerProps) {
  const {
    activeNotes,
    activeNotesLocked,
    onActiveNotesChange,
  } = useStoreBackedInstrumentNotes({
    sessionId,
    partId,
    moduleId,
  });

  return (
    <FretboardNotesLayer
      activeNotes={activeNotes}
      activeNotesLocked={activeNotesLocked}
      audioPresetId={audioPresetId}
      onActiveNotesChange={onActiveNotesChange}
    />
  );
}

export function StoreBackedKeyboardNotesLayer({
  sessionId,
  partId,
  moduleId,
  audioPresetId,
}: StoreBackedNotesLayerProps) {
  const {
    activeNotes,
    activeNotesLocked,
    onActiveNotesChange,
  } = useStoreBackedInstrumentNotes({
    sessionId,
    partId,
    moduleId,
  });

  return (
    <KeyboardNotesLayer
      activeNotes={activeNotes}
      activeNotesLocked={activeNotesLocked}
      audioPresetId={audioPresetId}
      onActiveNotesChange={onActiveNotesChange}
    />
  );
}
