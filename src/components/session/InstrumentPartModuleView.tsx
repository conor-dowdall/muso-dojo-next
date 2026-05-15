"use client";

import { useShallow } from "zustand/react/shallow";
import { Fretboard } from "@/components/fretboard/Fretboard";
import { Keyboard } from "@/components/keyboard/Keyboard";
import { useAppStore } from "@/stores/appStore";
import { type DisplayFormatId } from "@/data/displayFormats";
import { type InstrumentNoteInteractionMode } from "@/types/instrument";
import { type InstrumentNoteEmphasis } from "@/types/instrument-note-emphasis";
import {
  type FretboardInstrumentInstanceConfig,
  type InstrumentInstanceConfig,
  type KeyboardInstrumentInstanceConfig,
} from "@/types/session";
import { type SettingValue } from "@/types/state";
import { assertNever } from "@/utils/assertNever";
import {
  StoreBackedFretboardNotesLayer,
  StoreBackedKeyboardNotesLayer,
} from "./StoreBackedInstrumentNotesLayer";
import { selectInstrumentForModule } from "./sessionSelectors";

interface InstrumentPartModuleViewProps {
  sessionId: string;
  partId: string;
  moduleId: string;
  isPerformanceMode?: boolean;
}

function selectInstrumentBase(module: InstrumentInstanceConfig) {
  return {
    displayFormatId: module.displayFormatId,
    noteEmphasis: module.noteEmphasis,
    layout: module.layout,
    showHeader: module.showHeader,
    showMidiNumbers: module.showMidiNumbers,
  };
}

function selectInstrumentRenderModel(
  instrument: InstrumentInstanceConfig,
): FretboardInstrumentInstanceConfig | KeyboardInstrumentInstanceConfig {
  switch (instrument.type) {
    case "fretboard":
      return {
        ...selectInstrumentBase(instrument),
        type: instrument.type,
        theme: instrument.theme,
        config: instrument.config,
      };
    case "keyboard":
      return {
        ...selectInstrumentBase(instrument),
        type: instrument.type,
        range: instrument.range,
        theme: instrument.theme,
        config: instrument.config,
      };
    default:
      return assertNever(instrument, "Unsupported instrument type");
  }
}

export function InstrumentPartModuleView({
  sessionId,
  partId,
  moduleId,
  isPerformanceMode = false,
}: InstrumentPartModuleViewProps) {
  const instrument = useAppStore(
    useShallow((state) => {
      const instrument = selectInstrumentForModule(
        state,
        sessionId,
        partId,
        moduleId,
      );

      return instrument ? selectInstrumentRenderModel(instrument) : undefined;
    }),
  );
  const setInstrumentDisplayFormatId = useAppStore(
    (state) => state.setInstrumentDisplayFormatId,
  );
  const setInstrumentNoteEmphasis = useAppStore(
    (state) => state.setInstrumentNoteEmphasis,
  );
  const clonePartModule = useAppStore((state) => state.clonePartModule);
  const removePartModule = useAppStore((state) => state.removePartModule);

  if (!instrument) {
    return null;
  }

  const noteInteractionMode: InstrumentNoteInteractionMode | undefined =
    isPerformanceMode ? "play" : undefined;

  const sharedProps = {
    displayFormatId: instrument.displayFormatId,
    onDisplayFormatIdChange: (displayFormatId: SettingValue<DisplayFormatId>) =>
      setInstrumentDisplayFormatId(
        sessionId,
        partId,
        moduleId,
        displayFormatId,
      ),
    noteEmphasis: instrument.noteEmphasis,
    onNoteEmphasisChange: (
      noteEmphasis: SettingValue<InstrumentNoteEmphasis>,
    ) => setInstrumentNoteEmphasis(sessionId, partId, moduleId, noteEmphasis),
    layout: instrument.layout,
    noteInteractionMode,
    showHeader: !isPerformanceMode && instrument.showHeader,
    onClone: isPerformanceMode
      ? undefined
      : () => clonePartModule(sessionId, partId, moduleId),
    onRemove: isPerformanceMode
      ? undefined
      : () => removePartModule(sessionId, partId, moduleId),
  };

  switch (instrument.type) {
    case "fretboard":
      return (
        <Fretboard
          {...sharedProps}
          theme={instrument.theme}
          config={instrument.config}
        >
          <StoreBackedFretboardNotesLayer
            sessionId={sessionId}
            partId={partId}
            moduleId={moduleId}
            showMidiNumbers={instrument.showMidiNumbers}
          />
        </Fretboard>
      );
    case "keyboard":
      return (
        <Keyboard
          {...sharedProps}
          range={instrument.range}
          theme={instrument.theme}
          config={instrument.config}
        >
          <StoreBackedKeyboardNotesLayer
            sessionId={sessionId}
            partId={partId}
            moduleId={moduleId}
            showMidiNumbers={instrument.showMidiNumbers}
          />
        </Keyboard>
      );
    default:
      return assertNever(instrument, "Unsupported instrument type");
  }
}
