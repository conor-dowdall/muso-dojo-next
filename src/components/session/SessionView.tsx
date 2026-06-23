"use client";

import { useSyncExternalStore } from "react";
import { useShallow } from "zustand/react/shallow";
import { Plus } from "lucide-react";
import { partSequenceCoordinator } from "@/audio";
import { NoteColorProvider } from "@/components/note-colors/NoteColorProvider";
import { Button } from "@/components/ui/buttons/Button";
import { useAppStore } from "@/stores/appStore";
import { MusicPartView } from "./MusicPartView";
import styles from "./SessionView.module.css";

interface SessionViewProps {
  sessionId: string;
  onOpenAddDialog?: () => void;
  onOpenSessionTempo?: (sessionId: string) => void;
  isPerformanceMode?: boolean;
}

export function SessionView({
  sessionId,
  onOpenAddDialog,
  onOpenSessionTempo,
  isPerformanceMode = false,
}: SessionViewProps) {
  const noteColorConfig = useAppStore(
    (state) => state.dojoSettings.noteColorConfig,
  );
  const partIds = useAppStore(
    useShallow(
      (state) => state.sessions[sessionId]?.parts.map((part) => part.id) ?? [],
    ),
  );
  const partSequenceSnapshot = useSyncExternalStore(
    partSequenceCoordinator.subscribe,
    partSequenceCoordinator.getSnapshot,
    partSequenceCoordinator.getSnapshot,
  );
  const partSequenceIsActive =
    partSequenceSnapshot.playing &&
    partSequenceSnapshot.sessionId === sessionId;

  return (
    <NoteColorProvider config={noteColorConfig}>
      {partIds.length === 0 && onOpenAddDialog ? (
        <div className={styles.emptySession}>
          <Button
            icon={<Plus />}
            label="Add to Session"
            size="md"
            variant="outline"
            onClick={onOpenAddDialog}
          />
        </div>
      ) : (
        partIds.map((partId) => (
          <MusicPartView
            key={partId}
            sessionId={sessionId}
            partId={partId}
            partSequenceState={
              partSequenceIsActive &&
              partSequenceSnapshot.pendingPartId === partId
                ? "pending"
                : partSequenceIsActive &&
                    partSequenceSnapshot.activePartId === partId
                  ? "active"
                  : undefined
            }
            isPerformanceMode={isPerformanceMode}
            onOpenSessionTempo={onOpenSessionTempo}
          />
        ))
      )}
    </NoteColorProvider>
  );
}
