import { createContext, type CSSProperties, type ReactNode, use } from "react";
import { type SessionNoteColorConfig } from "@/types/note-colors";
import {
  createSessionNoteColorStyle,
  resolveSessionNoteColors,
  type ResolvedSessionNoteColors,
} from "@/utils/note-colors/resolveNoteColors";

const SessionNoteColorContext = createContext<ResolvedSessionNoteColors | null>(
  null,
);

const defaultSessionNoteColors = resolveSessionNoteColors(undefined);

export function SessionNoteColorProvider({
  children,
  config,
}: {
  children: ReactNode;
  config?: SessionNoteColorConfig;
}) {
  const noteColors = resolveSessionNoteColors(config);
  const style = {
    display: "contents",
    ...createSessionNoteColorStyle(noteColors.colors),
  } as CSSProperties;

  return (
    <SessionNoteColorContext value={noteColors}>
      <div style={style}>{children}</div>
    </SessionNoteColorContext>
  );
}

export function useSessionNoteColors() {
  return use(SessionNoteColorContext) ?? defaultSessionNoteColors;
}
