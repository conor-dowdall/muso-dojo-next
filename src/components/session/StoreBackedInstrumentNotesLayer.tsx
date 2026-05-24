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
  "audioPresetId" | "showMidiNumbers"
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
  const setInstrumentActiveNotes = useAppStore(
    (state) => state.setInstrumentActiveNotes,
  );
  const onActiveNotesChange = (
    activeNotes: SettingValue<ActiveNotes | undefined>,
  ) => setInstrumentActiveNotes(sessionId, partId, moduleId, activeNotes);

  return {
    activeNotes,
    onActiveNotesChange,
  };
}

export function StoreBackedFretboardNotesLayer({
  sessionId,
  partId,
  moduleId,
  audioPresetId,
  showMidiNumbers,
}: StoreBackedNotesLayerProps) {
  const { activeNotes, onActiveNotesChange } = useStoreBackedInstrumentNotes({
    sessionId,
    partId,
    moduleId,
  });

  return (
    <FretboardNotesLayer
      activeNotes={activeNotes}
      audioPresetId={audioPresetId}
      onActiveNotesChange={onActiveNotesChange}
      showMidiNumbers={showMidiNumbers}
    />
  );
}

export function StoreBackedKeyboardNotesLayer({
  sessionId,
  partId,
  moduleId,
  audioPresetId,
  showMidiNumbers,
}: StoreBackedNotesLayerProps) {
  const { activeNotes, onActiveNotesChange } = useStoreBackedInstrumentNotes({
    sessionId,
    partId,
    moduleId,
  });

  return (
    <KeyboardNotesLayer
      activeNotes={activeNotes}
      audioPresetId={audioPresetId}
      onActiveNotesChange={onActiveNotesChange}
      showMidiNumbers={showMidiNumbers}
    />
  );
}
