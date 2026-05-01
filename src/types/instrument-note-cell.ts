import { type CSSProperties, type KeyboardEvent } from "react";
import { type ActiveNote } from "./instrument-active-note";
import { type InstrumentNoteColor } from "./note-colors";

export interface InstrumentNoteCellInfo {
  key: string;
  midi: number;
  style: CSSProperties;
  labelLarge?: string;
  labelSmall?: string;
}

export interface InstrumentNoteCellWrapperProps<
  TNoteCell extends InstrumentNoteCellInfo = InstrumentNoteCellInfo,
> {
  noteCell: TNoteCell;
  note?: ActiveNote;
  noteColor: InstrumentNoteColor;
  label?: string;
  ariaLabel: string;
  isFocused: boolean;
  setItemRef: (key: string, el: HTMLElement | null) => void;
  handleKeyDown: (e: KeyboardEvent, key: string) => void;
  interactItem: (key: string) => void;
}
