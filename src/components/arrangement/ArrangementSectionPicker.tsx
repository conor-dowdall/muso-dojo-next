"use client";

import { useMemo } from "react";
import { Plus } from "lucide-react";
import {
  DisclosureList,
  DisclosureListAction,
  DisclosureListChoice,
  DisclosureListGroup,
} from "@/components/ui/disclosure-list/DisclosureList";
import { Text } from "@/components/ui/typography/Text";
import { useAppStore } from "@/stores/appStore";
import { formatValueSummary } from "@/utils/valueSummary";
import { getArrangementSectionSourceStatus } from "@/utils/arrangement/arrangementSectionSource";
import styles from "./ArrangementWorkspace.module.css";

export function ArrangementSectionPicker({
  arrangementId,
  id,
  onBeforeChange,
  onClose,
  sectionId,
  sectionLabel,
}: {
  arrangementId: string;
  id: string;
  onBeforeChange?: () => void;
  onClose: () => void;
  sectionId: string;
  sectionLabel: string;
}) {
  const arrangement = useAppStore((state) => state.arrangements[arrangementId]);
  const sessionRecord = useAppStore((state) => state.sessions);
  const sessions = useMemo(() => Object.values(sessionRecord), [sessionRecord]);
  const addSession = useAppStore((state) => state.addSession);
  const replaceSection = useAppStore(
    (state) => state.replaceArrangementSectionFromSession,
  );
  if (!arrangement) return null;
  const section = arrangement.sections.find(({ id }) => id === sectionId);
  if (!section) return null;
  const sectionUseCount = arrangement.entries.filter(
    (entry) => entry.sectionId === sectionId,
  ).length;

  const chooseSession = (sessionId: string) => {
    onBeforeChange?.();
    if (replaceSection(arrangementId, sectionId, sessionId)) onClose();
  };

  return (
    <div
      aria-label={`Session for ${sectionLabel}`}
      className={styles.sessionChoiceEditor}
      id={id}
      role="region"
    >
      <DisclosureList>
        {sessions.length === 0 ? (
          <DisclosureListGroup>
            <Text as="p" size="sm" variant="muted">
              No Sessions Yet
            </Text>
            <DisclosureListAction
              density="compact"
              icon={<Plus />}
              label="New Session"
              onClick={() => addSession()}
            />
          </DisclosureListGroup>
        ) : (
          <DisclosureListGroup>
            {sessions.map((session) => {
              const selected = section.source.sessionId === session.id;
              const sourceStatus = selected
                ? getArrangementSectionSourceStatus(section, session)
                : "current";
              const sourceChanged =
                sourceStatus === "changed" || sourceStatus === "empty";
              const updateAvailable = sourceChanged && session.parts.length > 0;
              const updateImpact =
                sectionUseCount > 1
                  ? `Updates ${sectionUseCount} Positions`
                  : undefined;
              const subtitle =
                session.parts.length === 0
                  ? sourceChanged
                    ? formatValueSummary([
                        "Changed Since Added",
                        "No Parts to Update",
                      ])
                    : "No Parts Yet"
                  : formatValueSummary([
                      sourceChanged ? "Changed Since Added" : undefined,
                      updateImpact,
                      `${session.parts.length} ${
                        session.parts.length === 1 ? "Part" : "Parts"
                      }`,
                      `${session.tempoBpm ?? 80} BPM`,
                    ]);

              return (
                <DisclosureListChoice
                  key={session.id}
                  aria-label={
                    updateAvailable
                      ? `Update ${sectionLabel} from ${session.name}${sectionUseCount > 1 ? `. Updates ${sectionUseCount} positions` : ""}`
                      : selected
                        ? `Current Session: ${session.name}`
                        : `Use ${session.name} for ${sectionLabel}`
                  }
                  density="compact"
                  disabled={session.parts.length === 0}
                  label={session.name}
                  selected={selected}
                  selectedPreviewLabel={updateAvailable ? "Update" : undefined}
                  subtitle={subtitle}
                  onClick={() => chooseSession(session.id)}
                />
              );
            })}
          </DisclosureListGroup>
        )}
      </DisclosureList>
    </div>
  );
}
