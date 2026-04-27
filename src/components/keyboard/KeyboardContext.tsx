import { createContext, type ReactNode, use, useMemo } from "react";
import {
  type KeyboardGeometry,
  type KeyboardPresentation,
  type KeyboardProps,
} from "@/types/keyboard";
import { createKeyboardConfig } from "@/utils/keyboard/createKeyboardConfig";
import { createKeyboardGeometry } from "@/utils/keyboard/createKeyboardGeometry";
import { useInstrumentPresentation } from "@/hooks/instrument/useInstrumentPresentation";

const KeyboardGeometryContext = createContext<KeyboardGeometry | null>(null);
const KeyboardPresentationContext = createContext<KeyboardPresentation | null>(
  null,
);

export function KeyboardProvider({
  children,
  range,
  theme,
  config: userConfig,
  displayFormatId,
  initialDisplayFormatId,
  onDisplayFormatIdChange,
  noteEmphasis,
  initialNoteEmphasis,
  onNoteEmphasisChange,
}: KeyboardProps & { children: ReactNode }) {
  const geometry = useMemo(() => {
    const baseConfig = createKeyboardConfig(range, theme, userConfig);
    return createKeyboardGeometry(baseConfig);
  }, [range, theme, userConfig]);

  const presentation = useInstrumentPresentation({
    displayFormatId,
    initialDisplayFormatId,
    onDisplayFormatIdChange,
    noteEmphasis,
    initialNoteEmphasis,
    onNoteEmphasisChange,
  });

  return (
    <KeyboardGeometryContext value={geometry}>
      <KeyboardPresentationContext value={presentation}>
        {children}
      </KeyboardPresentationContext>
    </KeyboardGeometryContext>
  );
}

export function useKeyboardGeometry() {
  const context = use(KeyboardGeometryContext);
  if (!context) {
    throw new Error(
      "useKeyboardGeometry must be used within a KeyboardProvider",
    );
  }
  return context;
}

export function useKeyboardPresentation() {
  const context = use(KeyboardPresentationContext);
  if (!context) {
    throw new Error(
      "useKeyboardPresentation must be used within a KeyboardProvider",
    );
  }
  return context;
}
