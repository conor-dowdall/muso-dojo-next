"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/buttons/Button";
import {
  DisclosureList,
  DisclosureListAction,
  DisclosureListChoice,
  DisclosureListGroup,
  DisclosureListItem,
} from "@/components/ui/disclosure-list/DisclosureList";
import { SelectionPreviewLabel } from "@/components/ui/selection-preview";
import { Text } from "@/components/ui/typography/Text";
import { useAppStore } from "@/stores/appStore";
import styles from "./ArrangementWorkspace.module.css";

export function ArrangementSectionPicker({
  arrangementId,
  onAppended,
  onBeforeChange,
}: {
  arrangementId: string;
  onAppended?: (entryId: string) => void;
  onBeforeChange?: () => void;
}) {
  const arrangement = useAppStore((state) => state.arrangements[arrangementId]);
  const sessionRecord = useAppStore((state) => state.sessions);
  const sessions = useMemo(() => Object.values(sessionRecord), [sessionRecord]);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [preferredSessionId, setPreferredSessionId] = useState<
    string | undefined
  >();
  const addSession = useAppStore((state) => state.addSession);
  const captureSession = useAppStore(
    (state) => state.addArrangementSectionFromSession,
  );
  if (!arrangement) return null;
  const defaultSession =
    sessions.find(({ parts }) => parts.length > 0) ?? sessions[0];
  const selectedSession =
    (preferredSessionId ? sessionRecord[preferredSessionId] : undefined) ??
    defaultSession;

  const chooseSession = (sessionId: string) => {
    setPreferredSessionId(sessionId);
    setSessionOpen(false);
  };

  const addSection = () => {
    if (!selectedSession || selectedSession.parts.length === 0) return;
    onBeforeChange?.();
    const result = captureSession(arrangementId, selectedSession.id);
    if (result) {
      onAppended?.(result.entryId);
    }
  };

  const sessionChoices =
    sessions.length === 0 ? (
      <DisclosureListGroup>
        <Text as="p" size="sm" variant="muted">
          No Sessions Yet
        </Text>
        <DisclosureListAction
          icon={<Plus />}
          label="Create Session"
          onClick={() => addSession()}
        />
      </DisclosureListGroup>
    ) : (
      <DisclosureListGroup>
        {sessions.map((session) => (
          <DisclosureListChoice
            key={session.id}
            disabled={session.parts.length === 0}
            label={session.name}
            selected={selectedSession?.id === session.id}
            subtitle={
              session.parts.length === 0
                ? "No Parts Yet"
                : `${session.parts.length} ${session.parts.length === 1 ? "Part" : "Parts"} · ${session.tempoBpm ?? 80} BPM`
            }
            onClick={() => chooseSession(session.id)}
          />
        ))}
      </DisclosureListGroup>
    );

  return (
    <div className={styles.sectionPicker}>
      <DisclosureList>
        <DisclosureListItem
          ariaLabel={`Session. Current: ${selectedSession?.name ?? "None"}`}
          isOpen={sessionOpen}
          label="Session"
          panelVariant="menu"
          preview={
            selectedSession?.name ?? (
              <SelectionPreviewLabel>None</SelectionPreviewLabel>
            )
          }
          onToggle={() => setSessionOpen((open) => !open)}
        >
          <DisclosureList>{sessionChoices}</DisclosureList>
        </DisclosureListItem>
      </DisclosureList>
      <div className={styles.sectionAdderAction}>
        <Button
          disabled={!selectedSession || selectedSession.parts.length === 0}
          icon={<Plus />}
          label="Add Section"
          preventConcurrentClicks
          size="sm"
          onClick={addSection}
        />
      </div>
    </div>
  );
}
