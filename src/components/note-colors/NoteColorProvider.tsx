import { createContext, type CSSProperties, type ReactNode, use } from "react";
import { type NoteColorConfig } from "@/types/note-colors";
import {
  createNoteColorStyle,
  resolveNoteColors,
  type ResolvedNoteColors,
} from "@/utils/note-colors/resolveNoteColors";

const NoteColorContext = createContext<ResolvedNoteColors | null>(null);

const defaultNoteColors = resolveNoteColors(undefined);

export function NoteColorProvider({
  children,
  config,
}: {
  children: ReactNode;
  config?: NoteColorConfig;
}) {
  const noteColors = resolveNoteColors(config);
  const style = {
    display: "contents",
    ...createNoteColorStyle(noteColors.colors),
  } as CSSProperties;

  return (
    <NoteColorContext value={noteColors}>
      <div style={style}>{children}</div>
    </NoteColorContext>
  );
}

export function useNoteColors() {
  return use(NoteColorContext) ?? defaultNoteColors;
}
