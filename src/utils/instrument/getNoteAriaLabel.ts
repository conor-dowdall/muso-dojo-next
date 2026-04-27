interface FretboardContext {
  type: "fretboard";
  stringIndex: number;
  fretNumber: number;
}

interface KeyboardContext {
  type: "keyboard";
  isBlack: boolean;
  midi: number;
}

type InstrumentContext = FretboardContext | KeyboardContext;

/**
 * Generates a consistent ARIA label for a note component based on its instrument context.
 */
export function getNoteAriaLabel(
  context: InstrumentContext,
  noteName: string | undefined,
): string {
  const noteNameSuffix = noteName ? `, ${noteName}` : "";

  if (context.type === "fretboard") {
    return `String ${context.stringIndex + 1}, Fret ${context.fretNumber}${noteNameSuffix}`;
  }

  const keyType = context.isBlack ? "Black" : "White";
  return `${keyType} key, MIDI ${context.midi}${noteNameSuffix}`;
}
