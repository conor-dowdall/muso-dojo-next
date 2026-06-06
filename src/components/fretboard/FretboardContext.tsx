import { createContext, use } from "react";
import {
  type FretboardGeometry,
  type FretboardPresentation,
  type FretboardProps,
} from "@/types/fretboard";
import { createFretboardConfig } from "@/utils/fretboard/createFretboardConfig";
import { createFretboardGeometry } from "@/utils/fretboard/createFretboardGeometry";
import { useInstrumentPresentation } from "@/hooks/instrument/useInstrumentPresentation";

const FretboardGeometryContext = createContext<FretboardGeometry | null>(null);
const FretboardPresentationContext =
  createContext<FretboardPresentation | null>(null);

type FretboardProviderProps = Pick<
  FretboardProps,
  | "children"
  | "theme"
  | "inlayPreset"
  | "config"
  | "displayFormatId"
  | "initialDisplayFormatId"
  | "onDisplayFormatIdChange"
  | "noteEmphasis"
  | "initialNoteEmphasis"
  | "onNoteEmphasisChange"
  | "noteInteractionMode"
  | "initialNoteInteractionMode"
  | "onNoteInteractionModeChange"
>;

export function FretboardProvider({
  children,
  theme,
  inlayPreset,
  config: userConfig,
  displayFormatId,
  initialDisplayFormatId,
  onDisplayFormatIdChange,
  noteEmphasis,
  initialNoteEmphasis,
  onNoteEmphasisChange,
  noteInteractionMode,
  initialNoteInteractionMode,
  onNoteInteractionModeChange,
}: FretboardProviderProps) {
  const baseConfig = createFretboardConfig(theme, userConfig, inlayPreset);
  const geometry = createFretboardGeometry(baseConfig);

  const presentation = useInstrumentPresentation({
    displayFormatId,
    initialDisplayFormatId,
    onDisplayFormatIdChange,
    noteEmphasis,
    initialNoteEmphasis,
    onNoteEmphasisChange,
    noteInteractionMode,
    initialNoteInteractionMode,
    onNoteInteractionModeChange,
  });

  return (
    <FretboardGeometryContext value={geometry}>
      <FretboardPresentationContext value={presentation}>
        {children}
      </FretboardPresentationContext>
    </FretboardGeometryContext>
  );
}

export function useFretboardGeometry() {
  const context = use(FretboardGeometryContext);
  if (!context) {
    throw new Error(
      "useFretboardGeometry must be used within a FretboardProvider",
    );
  }
  return context;
}

export function useFretboardPresentation() {
  const context = use(FretboardPresentationContext);
  if (!context) {
    throw new Error(
      "useFretboardPresentation must be used within a FretboardProvider",
    );
  }
  return context;
}
