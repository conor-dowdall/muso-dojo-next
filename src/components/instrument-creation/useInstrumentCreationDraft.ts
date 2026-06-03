"use client";

import { useState } from "react";
import { useAppStore } from "@/stores/appStore";
import {
  createDefaultInstrumentSelections,
  getDefaultInstrumentType,
  getInstrumentCreationDefault,
  instrumentCreationDefaultMatchesSelection,
  type FretboardInstrumentSelection,
  type InstrumentCreationRangeContext,
  type KeyboardInstrumentSelection,
} from "./instrumentCreationConfig";

export function useInstrumentCreationDraft(
  instrumentCreationRangeContext?: InstrumentCreationRangeContext,
) {
  const defaultInstrumentSetup = useAppStore(
    (state) => state.dojoSettings.defaultInstrumentSetup,
  );
  const setDefaultInstrumentSetup = useAppStore(
    (state) => state.setDefaultInstrumentSetup,
  );
  const [initialSelections] = useState(() =>
    createDefaultInstrumentSelections(
      undefined,
      defaultInstrumentSetup,
      instrumentCreationRangeContext,
    ),
  );
  const [instrumentType, setInstrumentType] = useState(() =>
    getDefaultInstrumentType(defaultInstrumentSetup),
  );
  const [keyboardSelection, setKeyboardSelection] =
    useState<KeyboardInstrumentSelection>(initialSelections.keyboardSelection);
  const [fretboardSelection, setFretboardSelection] =
    useState<FretboardInstrumentSelection>(
      initialSelections.fretboardSelection,
    );
  const isDefaultInstrumentSetup = instrumentCreationDefaultMatchesSelection(
    instrumentType,
    defaultInstrumentSetup,
    keyboardSelection,
    fretboardSelection,
  );

  const useCurrentSetupForNewInstruments = () => {
    setDefaultInstrumentSetup(
      getInstrumentCreationDefault(
        instrumentType,
        keyboardSelection,
        fretboardSelection,
      ),
    );
  };

  return {
    defaultInstrumentSetup,
    fretboardSelection,
    instrumentType,
    isDefaultInstrumentSetup,
    keyboardSelection,
    setFretboardSelection,
    setInstrumentType,
    setKeyboardSelection,
    useCurrentSetupForNewInstruments,
  };
}
