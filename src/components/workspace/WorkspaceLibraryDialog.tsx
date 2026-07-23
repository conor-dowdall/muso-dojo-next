"use client";

import { useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { LibraryBig, Plus } from "lucide-react";
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
import { InlineRenameActionItem } from "@/components/ui/inline-rename/InlineRenameActionItem";
import { ObjectManagementGroup } from "@/components/ui/object-menu";
import { SelectableOverflowRow } from "@/components/ui/selectable-overflow-row";
import { Heading } from "@/components/ui/typography/Heading";
import { Text } from "@/components/ui/typography/Text";
import { useAppStore } from "@/stores/appStore";
import { normalizeEntityNameForComparison } from "@/stores/app-store/entityIds";
import { SessionManagementRow } from "@/components/session/SessionManagementRow";
import { createSessionPartSummary } from "@/components/session/sessionManagementFormatting";
import styles from "./WorkspaceLibraryDialog.module.css";

export function WorkspaceLibraryDialog({ onClose }: { onClose: () => void }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [tempoId, setTempoId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const activeWorkspace = useAppStore((state) => state.activeWorkspace);
  const sessionRecord = useAppStore((state) => state.sessions);
  const sessions = useMemo(
    () =>
      Object.values(sessionRecord).map((session) => ({
        id: session.id,
        name: session.name,
        parts: session.parts.map(createSessionPartSummary),
        tempoBpm: session.tempoBpm ?? 80,
      })),
    [sessionRecord],
  );
  const arrangementRecord = useAppStore((state) => state.arrangements);
  const arrangements = useMemo(
    () => Object.values(arrangementRecord),
    [arrangementRecord],
  );
  const actions = useAppStore(
    useShallow((state) => ({
      addArrangement: state.addArrangement,
      addSession: state.addSession,
      cloneArrangement: state.cloneArrangement,
      cloneSession: state.cloneSession,
      removeArrangement: state.removeArrangement,
      removeSession: state.removeSession,
      renameArrangement: state.renameArrangement,
      renameSession: state.renameSession,
      setActiveWorkspace: state.setActiveWorkspace,
      setSessionTempoBpm: state.setSessionTempoBpm,
    })),
  );
  const resetMenus = () => {
    setOpenId(null);
    setRenameId(null);
    setTempoId(null);
    setDeleteId(null);
  };
  const selectWorkspace = (workspace: NonNullable<typeof activeWorkspace>) => {
    actions.setActiveWorkspace(workspace);
    resetMenus();
    onClose();
  };

  return (
    <>
      <DialogHeader icon={<LibraryBig />} title="Library" onClose={onClose} />
      <DialogContent menuRhythm="standard">
        <DialogContentSection ariaLabel="Create workspace">
          <DisclosureList grouped>
            <DisclosureListGroup>
              <DisclosureListAction
                icon={<Plus />}
                label="New Session"
                preventConcurrentClicks
                onClick={() => {
                  actions.addSession();
                  onClose();
                }}
              />
              <DisclosureListAction
                icon={<Plus />}
                label="New Arrangement"
                preventConcurrentClicks
                onClick={() => {
                  actions.addArrangement();
                  onClose();
                }}
              />
            </DisclosureListGroup>
          </DisclosureList>
        </DialogContentSection>

        <DialogContentSection ariaLabel="Sessions">
          <Heading as="h2" className={styles.heading} size="xs">
            Sessions
          </Heading>
          <DisclosureList grouped>
            <DisclosureListGroup>
              {sessions.length === 0 ? (
                <Text as="p" size="sm" variant="muted">
                  No Sessions Yet
                </Text>
              ) : (
                sessions.map((session) => (
                  <SessionManagementRow
                    key={session.id}
                    isActive={
                      activeWorkspace?.kind === "session" &&
                      activeWorkspace.id === session.id
                    }
                    isDeleteConfirming={deleteId === session.id}
                    isOpen={openId === session.id}
                    isRenameOpen={renameId === session.id}
                    isTempoOpen={tempoId === session.id}
                    session={session}
                    sessions={sessions}
                    onCancelDeleteSession={() => setDeleteId(null)}
                    onCloseRename={() => setRenameId(null)}
                    onDeleteSession={actions.removeSession}
                    onDuplicateSession={(id) => {
                      actions.cloneSession(id);
                      resetMenus();
                    }}
                    onRenameSession={actions.renameSession}
                    onRequestDeleteSession={setDeleteId}
                    onSetTempoBpm={actions.setSessionTempoBpm}
                    onToggleActions={(id) => {
                      setOpenId(openId === id ? null : id);
                      setRenameId(null);
                      setTempoId(null);
                      setDeleteId(null);
                    }}
                    onToggleRename={(id) =>
                      setRenameId(renameId === id ? null : id)
                    }
                    onToggleTempo={(id) =>
                      setTempoId(tempoId === id ? null : id)
                    }
                    onUseSession={(id) =>
                      selectWorkspace({ kind: "session", id })
                    }
                  />
                ))
              )}
            </DisclosureListGroup>
          </DisclosureList>
        </DialogContentSection>

        <DialogContentSection ariaLabel="Arrangements">
          <Heading as="h2" className={styles.heading} size="xs">
            Arrangements
          </Heading>
          <DisclosureList grouped>
            <DisclosureListGroup>
              {arrangements.length === 0 ? (
                <Text as="p" size="sm" variant="muted">
                  No Arrangements Yet
                </Text>
              ) : (
                arrangements.map((arrangement) => {
                  const isActive =
                    activeWorkspace?.kind === "arrangement" &&
                    activeWorkspace.id === arrangement.id;
                  const sectionCount = arrangement.sections.length;
                  const entryCount = arrangement.entries.length;
                  return (
                    <SelectableOverflowRow
                      key={arrangement.id}
                      actionsLabel={`${openId === arrangement.id ? "Close" : "Open"} actions for ${arrangement.name} arrangement`}
                      isActionsOpen={openId === arrangement.id}
                      label={arrangement.name}
                      selected={isActive}
                      selectAriaLabel={`Use ${arrangement.name} arrangement`}
                      selectedAriaLabel={`Current arrangement: ${arrangement.name}`}
                      subtitle={`${sectionCount} ${sectionCount === 1 ? "Section" : "Sections"} · ${entryCount} ${entryCount === 1 ? "Entry" : "Entries"} · ${arrangement.tempoBpm} BPM${arrangement.playbackMode === "loop" ? " · Loop" : ""}`}
                      onSelect={() =>
                        selectWorkspace({
                          kind: "arrangement",
                          id: arrangement.id,
                        })
                      }
                      onToggleActions={() => {
                        setOpenId(
                          openId === arrangement.id ? null : arrangement.id,
                        );
                        setRenameId(null);
                        setDeleteId(null);
                      }}
                    >
                      <DisclosureList grouped groupGap="section">
                        <DisclosureListGroup>
                          <InlineRenameActionItem
                            ariaLabel={`Rename ${arrangement.name} arrangement`}
                            fieldLabel="Arrangement name"
                            isNameAvailable={(name) =>
                              !arrangements.some(
                                (candidate) =>
                                  candidate.id !== arrangement.id &&
                                  normalizeEntityNameForComparison(
                                    candidate.name,
                                  ) === normalizeEntityNameForComparison(name),
                              )
                            }
                            isOpen={renameId === arrangement.id}
                            label="Rename Arrangement"
                            value={arrangement.name}
                            onClose={() => setRenameId(null)}
                            onRename={(name) =>
                              actions.renameArrangement(arrangement.id, name)
                            }
                            onToggle={() =>
                              setRenameId(
                                renameId === arrangement.id
                                  ? null
                                  : arrangement.id,
                              )
                            }
                          />
                        </DisclosureListGroup>
                        <ObjectManagementGroup
                          isDangerConfirming={deleteId === arrangement.id}
                          kind="arrangement"
                          objectName={arrangement.name}
                          onCancelDangerConfirm={() => setDeleteId(null)}
                          onDanger={() =>
                            actions.removeArrangement(arrangement.id)
                          }
                          onDuplicate={() => {
                            actions.cloneArrangement(arrangement.id);
                            resetMenus();
                          }}
                          onRequestDangerConfirm={() =>
                            setDeleteId(arrangement.id)
                          }
                        />
                      </DisclosureList>
                    </SelectableOverflowRow>
                  );
                })
              )}
            </DisclosureListGroup>
          </DisclosureList>
        </DialogContentSection>
      </DialogContent>
      <DialogCloseFooter onClose={onClose} />
    </>
  );
}
