"use client";

import { useMemo } from "react";
import { Layers3, Plus } from "lucide-react";
import {
  DialogCloseFooter,
  DialogContent,
  DialogContentSection,
  DialogHeader,
} from "@/components/ui/dialog/Dialog";
import {
  DisclosureList,
  DisclosureListAction,
  DisclosureListGroup,
} from "@/components/ui/disclosure-list/DisclosureList";
import { Heading } from "@/components/ui/typography/Heading";
import { Text } from "@/components/ui/typography/Text";
import { useAppStore } from "@/stores/appStore";
import styles from "./ArrangementWorkspace.module.css";

export function ArrangementSectionPickerDialog({
  arrangementId,
  onAppended,
  onBeforeChange,
  onClose,
  replaceSectionId,
}: {
  arrangementId: string;
  onAppended?: (entryId: string) => void;
  onBeforeChange?: () => void;
  onClose: () => void;
  replaceSectionId?: string;
}) {
  const arrangement = useAppStore((state) => state.arrangements[arrangementId]);
  const sessionRecord = useAppStore((state) => state.sessions);
  const sessions = useMemo(() => Object.values(sessionRecord), [sessionRecord]);
  const addSession = useAppStore((state) => state.addSession);
  const appendSection = useAppStore(
    (state) => state.appendArrangementSectionEntry,
  );
  const captureSession = useAppStore(
    (state) => state.addArrangementSectionFromSession,
  );
  const replaceSection = useAppStore(
    (state) => state.replaceArrangementSectionFromSession,
  );
  if (!arrangement) return null;

  const chooseSession = (sessionId: string) => {
    if (replaceSectionId) {
      onBeforeChange?.();
      if (replaceSection(arrangementId, replaceSectionId, sessionId)) onClose();
      return;
    }
    onBeforeChange?.();
    const result = captureSession(arrangementId, sessionId);
    if (result) {
      onAppended?.(result.entryId);
      onClose();
    }
  };

  return (
    <>
      <DialogHeader
        icon={<Layers3 />}
        title={replaceSectionId ? "Replace Section" : "Add Section"}
        onClose={onClose}
      />
      <DialogContent menuRhythm="standard">
        {!replaceSectionId && arrangement.sections.length > 0 ? (
          <DialogContentSection ariaLabel="Sections in this arrangement">
            <Heading as="h2" className={styles.dialogGroupHeading} size="xs">
              Sections in This Arrangement
            </Heading>
            <DisclosureList grouped>
              <DisclosureListGroup>
                {arrangement.sections.map((section) => {
                  const uses = arrangement.entries.filter(
                    ({ sectionId }) => sectionId === section.id,
                  ).length;
                  return (
                    <DisclosureListAction
                      key={section.id}
                      label={section.name}
                      subtitle={`Used ${uses} ${uses === 1 ? "time" : "times"}`}
                      preventConcurrentClicks
                      onClick={() => {
                        onBeforeChange?.();
                        const entryId = appendSection(
                          arrangementId,
                          section.id,
                        );
                        if (entryId) {
                          onAppended?.(entryId);
                          onClose();
                        }
                      }}
                    />
                  );
                })}
              </DisclosureListGroup>
            </DisclosureList>
          </DialogContentSection>
        ) : null}
        <DialogContentSection ariaLabel="Sessions">
          <Heading as="h2" className={styles.dialogGroupHeading} size="xs">
            Sessions
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
        </DialogContentSection>
      </DialogContent>
      <DialogCloseFooter onClose={onClose} />
    </>
  );
}
