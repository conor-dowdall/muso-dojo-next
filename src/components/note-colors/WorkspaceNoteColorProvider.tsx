import {
  createContext,
  type CSSProperties,
  type ReactNode,
  use,
  useMemo,
} from "react";
import { type WorkspaceNoteColorConfig } from "@/types/note-colors";
import {
  createWorkspaceNoteColorStyle,
  resolveWorkspaceNoteColors,
  type ResolvedWorkspaceNoteColors,
} from "@/utils/note-colors/resolveNoteColors";

const WorkspaceNoteColorContext =
  createContext<ResolvedWorkspaceNoteColors | null>(null);

const defaultWorkspaceNoteColors = resolveWorkspaceNoteColors(undefined);

export function WorkspaceNoteColorProvider({
  children,
  config,
}: {
  children: ReactNode;
  config?: WorkspaceNoteColorConfig;
}) {
  const noteColors = useMemo(
    () => resolveWorkspaceNoteColors(config),
    [config],
  );
  const style = useMemo(
    () =>
      ({
        display: "contents",
        ...createWorkspaceNoteColorStyle(noteColors.colors),
      }) as CSSProperties,
    [noteColors],
  );

  return (
    <WorkspaceNoteColorContext value={noteColors}>
      <div style={style}>{children}</div>
    </WorkspaceNoteColorContext>
  );
}

export function useWorkspaceNoteColors() {
  return use(WorkspaceNoteColorContext) ?? defaultWorkspaceNoteColors;
}
