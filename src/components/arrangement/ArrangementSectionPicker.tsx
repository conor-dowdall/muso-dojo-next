"use client";

import { useMemo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/buttons/Button";
import {
  DisclosureList,
  DisclosureListAction,
  DisclosureListGroup,
} from "@/components/ui/disclosure-list/DisclosureList";
import { Heading } from "@/components/ui/typography/Heading";
import { Text } from "@/components/ui/typography/Text";
import { useAppStore } from "@/stores/appStore";
import styles from "./ArrangementWorkspace.module.css";

export function ArrangementSectionPicker({
  arrangementId,
  className = "",
  onAppended,
  onBeforeChange,
  onClose,
  replaceSectionId,
}: {
  arrangementId: string;
  className?: string;
  onAppended?: (entryId: string) => void;
  onBeforeChange?: () => void;
  onClose: () => void;
  replaceSectionId?: string;
}) {
  const arrangement = useAppStore((state) => state.arrangements[arrangementId]);
  const sessionRecord = useAppStore((state) => state.sessions);
  const sessions = useMemo(() => Object.values(sessionRecord), [sessionRecord]);
  const addSession = useAppStore((state) => state.addSession);
  const captureSession = useAppStore(
    (state) => state.addArrangementSectionFromSession,
  );
  const replaceSection = useAppStore(
    (state) => state.replaceArrangementSectionFromSession,
  );
  if (!arrangement) return null;

  const chooseSession = (sessionId: string) => {
    onBeforeChange?.();
    if (replaceSectionId) {
      if (replaceSection(arrangementId, replaceSectionId, sessionId)) onClose();
      return;
    }
    const result = captureSession(arrangementId, sessionId);
    if (result) {
      onAppended?.(result.entryId);
      onClose();
    }
  };

  return (
    <div className={`${styles.sectionPicker} ${className}`.trim()}>
      <section>
        <Heading as="h3" className={styles.dialogGroupHeading} size="xs">
          Choose a Session
        </Heading>
        {sessions.length === 0 ? (
          <DisclosureList grouped>
            <DisclosureListGroup>
              <Text as="p" size="sm" variant="muted">
                No Sessions Yet
              </Text>
              <DisclosureListAction
                icon={<Plus />}
                label="Create Session"
                onClick={() => {
                  addSession();
                  onClose();
                }}
              />
            </DisclosureListGroup>
          </DisclosureList>
        ) : (
          <DisclosureList grouped>
            <DisclosureListGroup>
              {sessions.map((session) => (
                <DisclosureListAction
                  key={session.id}
                  disabled={session.parts.length === 0}
                  label={session.name}
                  subtitle={
                    session.parts.length === 0
                      ? "No Parts Yet"
                      : `${session.parts.length} ${session.parts.length === 1 ? "Part" : "Parts"} · ${session.tempoBpm ?? 80} BPM`
                  }
                  preventConcurrentClicks
                  onClick={() => chooseSession(session.id)}
                />
              ))}
            </DisclosureListGroup>
          </DisclosureList>
        )}
      </section>

      <div className={styles.pickerActions}>
        <Button label="Cancel" size="sm" onClick={onClose} />
      </div>
    </div>
  );
}
