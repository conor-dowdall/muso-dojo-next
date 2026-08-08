"use client";

import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  FileInput,
  LibraryBig,
  List,
  PanelTopBottomDashed,
  PanelsTopLeft,
  SlidersVertical,
} from "lucide-react";
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
import { TempoActionItem } from "@/components/tempo/TempoActionItem";
import { Heading } from "@/components/ui/typography/Heading";
import { Text } from "@/components/ui/typography/Text";
import { useAppStore } from "@/stores/appStore";
import { normalizeEntityNameForComparison } from "@/stores/app-store/entityIds";
import { SessionManagementRow } from "@/components/session/SessionManagementRow";
import { createSessionPartSummary } from "@/components/session/sessionManagementFormatting";
import {
  countArrangementsUsingSession,
  getArrangementLibrarySubtitle,
} from "@/components/arrangement/arrangementLibraryFormatting";
import { CustomTuningsDialog } from "@/components/fretboard-tuning/CustomTuningsDialog";
import { CustomChordProgressionsDialog } from "@/components/music-theory/CustomChordProgressionsDialog";
import { DojoResourceImportDialog } from "@/components/workspace/DojoResourceImportDialog";
import {
  DojoBackupError,
  readDojoBackupFile,
  type ParsedDojoBackup,
} from "@/utils/dojo-backup/dojoBackup";
import { createDojoResourceImportCatalog } from "@/utils/dojo-backup/dojoResourceImport";
import styles from "./WorkspaceLibraryDialog.module.css";

function formatSavedCount(count: number) {
  return `${count} saved`;
}

export function WorkspaceLibraryResources({
  feedback,
  isReadingBackup = false,
  progressionCount,
  tuningCount,
  onImportResources,
  onOpenProgressions,
  onOpenTunings,
}: {
  feedback?: { message: string; tone: "error" | "status" } | null;
  isReadingBackup?: boolean;
  progressionCount: number;
  tuningCount: number;
  onImportResources: () => void;
  onOpenProgressions: () => void;
  onOpenTunings: () => void;
}) {
  return (
    <DialogContentSection ariaLabel="Resources" menuGroup>
      <Heading as="h3" size="xs" variant="muted">
        Resources
      </Heading>
      <DisclosureList grouped groupGap="section">
        <DisclosureListGroup>
          <DisclosureListAction
            icon={<SlidersVertical />}
            label="My Tunings"
            preview={formatSavedCount(tuningCount)}
            onClick={onOpenTunings}
          />
          <DisclosureListAction
            icon={<List />}
            label="My Progressions"
            preview={formatSavedCount(progressionCount)}
            onClick={onOpenProgressions}
          />
        </DisclosureListGroup>
        <DisclosureListGroup>
          <DisclosureListAction
            aria-label="Choose a Dojo backup JSON file to import resources from"
            disabled={isReadingBackup}
            icon={<FileInput />}
            label={
              isReadingBackup
                ? "Reading Backup…"
                : "Import Resources from Backup"
            }
            shouldYield={false}
            subtitle="Add Custom Tunings and Custom Chord Progressions without replacing your Dojo."
            onClick={onImportResources}
          />
          {feedback ? (
            <Text
              as="p"
              className={
                feedback.tone === "error"
                  ? styles.importError
                  : styles.importStatus
              }
              role={feedback.tone === "error" ? "alert" : "status"}
              size="sm"
            >
              {feedback.message}
            </Text>
          ) : null}
        </DisclosureListGroup>
      </DisclosureList>
    </DialogContentSection>
  );
}

export function WorkspaceLibraryDialog({ onClose }: { onClose: () => void }) {
  const resourceBackupInputRef = useRef<HTMLInputElement>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [tempoId, setTempoId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openResource, setOpenResource] = useState<
    "tunings" | "progressions" | null
  >(null);
  const [isReadingResourceBackup, setIsReadingResourceBackup] = useState(false);
  const [isResourceImportOpen, setIsResourceImportOpen] = useState(false);
  const [pendingResourceBackup, setPendingResourceBackup] =
    useState<ParsedDojoBackup | null>(null);
  const [resourceImportFeedback, setResourceImportFeedback] = useState<{
    message: string;
    tone: "error" | "status";
  } | null>(null);
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
  const tuningCount = useAppStore(
    (state) => state.dojoSettings.customFretboardTunings?.length ?? 0,
  );
  const progressionCount = useAppStore(
    (state) => state.dojoSettings.customChordProgressions?.length ?? 0,
  );
  const dojoSettings = useAppStore((state) => state.dojoSettings);
  const resourceImportCatalog = useMemo(
    () =>
      pendingResourceBackup
        ? createDojoResourceImportCatalog(
            dojoSettings,
            pendingResourceBackup.snapshot.dojoSettings,
          )
        : null,
    [dojoSettings, pendingResourceBackup],
  );
  const actions = useAppStore(
    useShallow((state) => ({
      addArrangement: state.addArrangement,
      addSession: state.addSession,
      cloneArrangement: state.cloneArrangement,
      cloneSession: state.cloneSession,
      importDojoBackupResources: state.importDojoBackupResources,
      removeArrangement: state.removeArrangement,
      removeSession: state.removeSession,
      renameArrangement: state.renameArrangement,
      renameSession: state.renameSession,
      setActiveWorkspace: state.setActiveWorkspace,
      setArrangementTempoBpm: state.setArrangementTempoBpm,
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
  const chooseResourceBackup = () => {
    setOpenResource(null);
    setResourceImportFeedback(null);
    resourceBackupInputRef.current?.click();
  };
  const readResourceBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";

    if (!file) {
      return;
    }

    setResourceImportFeedback(null);
    setIsReadingResourceBackup(true);

    try {
      setPendingResourceBackup(await readDojoBackupFile(file));
      setIsResourceImportOpen(true);
    } catch (error) {
      setIsResourceImportOpen(false);
      setPendingResourceBackup(null);
      setResourceImportFeedback({
        message:
          error instanceof DojoBackupError
            ? error.message
            : "The backup could not be read.",
        tone: "error",
      });
    } finally {
      setIsReadingResourceBackup(false);
    }
  };
  const importResources = (selectedKeys: readonly string[]) => {
    if (!pendingResourceBackup) {
      return;
    }

    const result = actions.importDojoBackupResources(
      pendingResourceBackup.snapshot,
      selectedKeys,
    );
    setIsResourceImportOpen(false);
    setResourceImportFeedback({
      message: `Imported ${result.imported} ${
        result.imported === 1 ? "resource" : "resources"
      }. Skipped ${result.skipped} ${
        result.skipped === 1 ? "resource" : "resources"
      }.`,
      tone: "status",
    });
  };

  return (
    <>
      <DialogHeader icon={<LibraryBig />} title="Library" onClose={onClose} />
      <DialogContent layout="stack" menuRhythm="standard">
        <DialogContentSection ariaLabel="Sessions" menuGroup>
          <Heading as="h3" size="xs" variant="muted">
            Sessions
          </Heading>
          <DisclosureList grouped groupGap="section">
            <DisclosureListGroup>
              <DisclosureListAction
                icon={<PanelsTopLeft />}
                label="New Session"
                preventConcurrentClicks
                subtitle="Build and play music with Parts, Instruments, Loopers, and more."
                onClick={() => {
                  actions.addSession();
                  onClose();
                }}
              />
            </DisclosureListGroup>
            <DisclosureListGroup>
              {sessions.length === 0 ? (
                <Text as="p" size="sm" variant="muted">
                  No Sessions Yet
                </Text>
              ) : (
                sessions.map((session) => (
                  <SessionManagementRow
                    key={session.id}
                    arrangementReferenceCount={countArrangementsUsingSession(
                      arrangements,
                      session.id,
                    )}
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
                    onRequestDeleteSession={(id) => {
                      setDeleteId(id);
                      setRenameId(null);
                      setTempoId(null);
                    }}
                    onSetTempoBpm={actions.setSessionTempoBpm}
                    onToggleActions={(id) => {
                      setOpenId(openId === id ? null : id);
                      setRenameId(null);
                      setTempoId(null);
                      setDeleteId(null);
                    }}
                    onToggleRename={(id) => {
                      setRenameId(renameId === id ? null : id);
                      setTempoId(null);
                      setDeleteId(null);
                    }}
                    onToggleTempo={(id) => {
                      setTempoId(tempoId === id ? null : id);
                      setRenameId(null);
                      setDeleteId(null);
                    }}
                    onUseSession={(id) =>
                      selectWorkspace({ kind: "session", id })
                    }
                  />
                ))
              )}
            </DisclosureListGroup>
          </DisclosureList>
        </DialogContentSection>

        <DialogContentSection ariaLabel="Arrangements" menuGroup>
          <Heading as="h3" size="xs" variant="muted">
            Arrangements
          </Heading>
          <DisclosureList grouped groupGap="section">
            <DisclosureListGroup>
              <DisclosureListAction
                icon={<PanelTopBottomDashed />}
                label="New Arrangement"
                preventConcurrentClicks
                subtitle="Build and play a sequence of Sections from your Sessions."
                onClick={() => {
                  actions.addArrangement();
                  onClose();
                }}
              />
            </DisclosureListGroup>
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
                  return (
                    <SelectableOverflowRow
                      key={arrangement.id}
                      actionsLabel={`${openId === arrangement.id ? "Close" : "Open"} actions for ${arrangement.name} arrangement`}
                      isActionsOpen={openId === arrangement.id}
                      label={arrangement.name}
                      selected={isActive}
                      selectAriaLabel={`Use ${arrangement.name} arrangement`}
                      selectedAriaLabel={`Current arrangement: ${arrangement.name}`}
                      subtitle={getArrangementLibrarySubtitle(
                        arrangement,
                        sessionRecord,
                      )}
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
                        setTempoId(null);
                        setDeleteId(null);
                      }}
                    >
                      <DisclosureList grouped groupGap="section">
                        <DisclosureListGroup>
                          <TempoActionItem
                            entityKind="arrangement"
                            isOpen={tempoId === arrangement.id}
                            item={arrangement}
                            onTempoBpmChange={actions.setArrangementTempoBpm}
                            onToggle={() => {
                              setTempoId(
                                tempoId === arrangement.id
                                  ? null
                                  : arrangement.id,
                              );
                              setRenameId(null);
                              setDeleteId(null);
                            }}
                          />
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
                            onToggle={() => {
                              setRenameId(
                                renameId === arrangement.id
                                  ? null
                                  : arrangement.id,
                              );
                              setTempoId(null);
                              setDeleteId(null);
                            }}
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
                          onRequestDangerConfirm={() => {
                            setDeleteId(arrangement.id);
                            setRenameId(null);
                            setTempoId(null);
                          }}
                        />
                      </DisclosureList>
                    </SelectableOverflowRow>
                  );
                })
              )}
            </DisclosureListGroup>
          </DisclosureList>
        </DialogContentSection>

        <WorkspaceLibraryResources
          feedback={resourceImportFeedback}
          isReadingBackup={isReadingResourceBackup}
          progressionCount={progressionCount}
          tuningCount={tuningCount}
          onImportResources={chooseResourceBackup}
          onOpenProgressions={() => setOpenResource("progressions")}
          onOpenTunings={() => setOpenResource("tunings")}
        />
      </DialogContent>
      <DialogCloseFooter onClose={onClose} />
      <CustomTuningsDialog
        isOpen={openResource === "tunings"}
        mode="manage"
        onClose={() => setOpenResource(null)}
      />
      <CustomChordProgressionsDialog
        isOpen={openResource === "progressions"}
        mode="manage"
        onClose={() => setOpenResource(null)}
      />
      {pendingResourceBackup && resourceImportCatalog ? (
        <DojoResourceImportDialog
          catalog={resourceImportCatalog}
          exportedAt={pendingResourceBackup.exportedAt}
          isOpen={isResourceImportOpen}
          onClose={() => setIsResourceImportOpen(false)}
          onImport={importResources}
        />
      ) : null}
      <input
        ref={resourceBackupInputRef}
        hidden
        accept=".json,application/json"
        type="file"
        onChange={readResourceBackup}
      />
    </>
  );
}
