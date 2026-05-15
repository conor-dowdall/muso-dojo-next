"use client";

import { useShallow } from "zustand/react/shallow";
import { Plus } from "lucide-react";
import { SessionNoteColorProvider } from "@/components/note-colors/SessionNoteColorProvider";
import { Button } from "@/components/ui/buttons/Button";
import { useAppStore } from "@/stores/appStore";
import { MusicPartView } from "./MusicPartView";
import styles from "./SessionView.module.css";

interface SessionViewProps {
  sessionId: string;
  onOpenAddDialog?: () => void;
  isPerformanceMode?: boolean;
}

export function SessionView({
  sessionId,
  onOpenAddDialog,
  isPerformanceMode = false,
}: SessionViewProps) {
  const noteColorConfig = useAppStore(
    (state) => state.sessions[sessionId]?.noteColorConfig,
  );
  const partIds = useAppStore(
    useShallow(
      (state) => state.sessions[sessionId]?.parts.map((part) => part.id) ?? [],
    ),
  );

  return (
    <SessionNoteColorProvider config={noteColorConfig}>
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
            isPerformanceMode={isPerformanceMode}
          />
        ))
      )}
    </SessionNoteColorProvider>
  );
}
