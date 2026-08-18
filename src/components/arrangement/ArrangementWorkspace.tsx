"use client";

import { useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  Copy,
  Disc3,
  LibraryBig,
  ListEnd,
  ListStart,
  Plus,
  Trash2,
} from "lucide-react";
import { partSequenceCoordinator } from "@/audio";
import { Button } from "@/components/ui/buttons/Button";
import { IconButton } from "@/components/ui/buttons/IconButton";
import { OptionButton } from "@/components/ui/buttons/OptionButton";
import {
  ControlHeader,
  ControlHeaderCluster,
} from "@/components/ui/control-header/ControlHeader";
import { NumericStepper } from "@/components/ui/numeric-stepper/NumericStepper";
import { SelectionPreviewLabel } from "@/components/ui/selection-preview";
import { Text } from "@/components/ui/typography/Text";
import { WorkspaceEmptyState } from "@/components/workspace/WorkspaceEmptyState";
import { NoteColorProvider } from "@/components/note-colors/NoteColorProvider";
import { SessionChart } from "@/components/session/SessionView";
import { useArrangementTransport } from "@/hooks/audio/useArrangementTransport";
import { useArrangementChartCue } from "@/hooks/audio/useArrangementChartCue";
import { useAppStore } from "@/stores/appStore";
import {
  MAX_ARRANGEMENT_ENTRY_PLAY_COUNT,
  MIN_ARRANGEMENT_ENTRY_PLAY_COUNT,
} from "@/types/arrangement";
import { ArrangementHeader } from "./ArrangementHeader";
import { ArrangementSectionPicker } from "./ArrangementSectionPicker";
import { ArrangementSectionPlaybackDialog } from "./ArrangementSectionPlaybackDialog";
import styles from "./ArrangementWorkspace.module.css";

function formatSectionNumber(entryIndex: number) {
  return String(entryIndex + 1).padStart(2, "0");
}

function SectionMarker({ entryIndex }: { entryIndex: number }) {
  return (
    <span aria-hidden="true" className={styles.sectionMarker}>
      <span className={styles.sectionMark}>§</span>
      <span className={styles.sectionMarkerNumber}>
        {formatSectionNumber(entryIndex)}
      </span>
    </span>
  );
}

export function ArrangementChartEntryTile({
  current,
  entryIndex,
  playCount,
  playbackActive,
  selected,
  unavailable,
  upcoming,
  onSelect,
}: {
  current: boolean;
  entryIndex: number;
  playCount: number;
  playbackActive: boolean;
  selected: boolean;
  unavailable: boolean;
  upcoming: boolean;
  onSelect: () => void;
}) {
  return (
    <OptionButton
      aria-disabled={playbackActive || unavailable ? true : undefined}
      aria-current={current ? "step" : undefined}
      aria-label={`Section ${entryIndex + 1}, plays ${playCount} ${playCount === 1 ? "time" : "times"}${current ? ", currently playing" : ""}${upcoming ? ", up next chart displayed" : ""}${playbackActive ? ", chart follows playback" : ""}`}
      className={styles.entryTile}
      data-active={current || undefined}
      data-upcoming={upcoming || undefined}
      disabled={unavailable}
      label={
        <span className={styles.sectionTileLabel}>
          <SectionMarker entryIndex={entryIndex} />
          {playCount > 1 ? <span>×{playCount}</span> : null}
        </span>
      }
      presentation="tile"
      selected={!playbackActive && selected}
      tabIndex={playbackActive ? -1 : undefined}
      onClick={() => {
        if (!playbackActive) onSelect();
      }}
    />
  );
}

export function ArrangementWorkspace({
  arrangementId,
  onOpenLibrary,
}: {
  arrangementId: string;
  onOpenLibrary: (returnFocusTo?: HTMLElement | null) => void;
}) {
  const arrangement = useAppStore((state) => state.arrangements[arrangementId]);
  const sessions = useAppStore((state) => state.sessions);
  const noteColorConfig = useAppStore(
    (state) => state.dojoSettings.noteColorConfig,
  );
  const viewMode = useAppStore(
    (state) => state.arrangements[arrangementId]?.workspaceViewMode ?? "build",
  );
  const actions = useAppStore(
    useShallow((state) => ({
      addSection: state.addArrangementSectionFromSession,
      cloneEntry: state.cloneArrangementEntry,
      moveEntry: state.moveArrangementEntry,
      removeEntry: state.removeArrangementEntry,
      setPlayCount: state.setArrangementEntryPlayCount,
      setViewMode: state.setArrangementWorkspaceViewMode,
    })),
  );
  const [selectedEntryId, setSelectedEntryId] = useState<string | undefined>(
    () => arrangement?.entries[0]?.id,
  );
  const [openSessionEntryId, setOpenSessionEntryId] = useState<
    string | undefined
  >();
  const [playbackDialogEntryId, setPlaybackDialogEntryId] = useState<
    string | undefined
  >();
  const [playbackDialogOpen, setPlaybackDialogOpen] = useState(false);
  const chartTileRefs = useRef(new Map<string, HTMLLIElement>());
  const cardRefs = useRef(new Map<string, HTMLElement>());
  const transport = useArrangementTransport(arrangementId);
  const selectedEntry =
    arrangement?.entries.find(({ id }) => id === selectedEntryId) ??
    arrangement?.entries[0];
  const fallback = selectedEntry
    ? { entryId: selectedEntry.id, sectionId: selectedEntry.sectionId }
    : undefined;
  const chartCue = useArrangementChartCue(transport.plan, fallback);
  const resolvedViewMode =
    arrangement?.entries.length === 0 ? "build" : viewMode;

  useEffect(() => {
    if (!transport.activeEntryId) return;
    const activeEntryId = transport.activeEntryId;
    const tile = chartTileRefs.current.get(activeEntryId);
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    tile?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "nearest",
      inline: "nearest",
    });
    const selectionTimer = globalThis.setTimeout(
      () => setSelectedEntryId(activeEntryId),
      0,
    );
    return () => globalThis.clearTimeout(selectionTimer);
  }, [transport.activeEntryId]);

  if (!arrangement) return null;

  const presentationSection = arrangement.sections.find(
    ({ id }) => id === chartCue.presentation?.sectionId,
  );
  const presentationEntryIndex = arrangement.entries.findIndex(
    ({ id }) => id === chartCue.presentation?.entryId,
  );
  const presentationSectionLabel =
    presentationEntryIndex >= 0
      ? `Section ${formatSectionNumber(presentationEntryIndex)}`
      : "Section";
  const defaultSession = Object.values(sessions).find(
    ({ parts }) => parts.length > 0,
  );
  const openPlaybackEntryIndex = arrangement.entries.findIndex(
    ({ id }) => id === playbackDialogEntryId,
  );
  const openPlaybackEntry = arrangement.entries[openPlaybackEntryIndex];
  const stopForMutation = () => {
    if (transport.isActive) partSequenceCoordinator.stop();
  };
  const selectNewEntry = (entryId: string) => {
    setSelectedEntryId(entryId);
    setOpenSessionEntryId(undefined);
    setPlaybackDialogOpen(false);
    globalThis.setTimeout(() => {
      cardRefs.current
        .get(entryId)
        ?.scrollIntoView({ block: "nearest", inline: "nearest" });
    }, 0);
  };
  const removeEntryById = (entryId: string) => {
    stopForMutation();
    const index = arrangement.entries.findIndex(({ id }) => id === entryId);
    const nextSelection =
      arrangement.entries[index + 1]?.id ?? arrangement.entries[index - 1]?.id;
    actions.removeEntry(arrangementId, entryId);
    if (selectedEntryId === entryId) setSelectedEntryId(nextSelection);
    if (openSessionEntryId === entryId) setOpenSessionEntryId(undefined);
    if (playbackDialogEntryId === entryId) setPlaybackDialogOpen(false);
    globalThis.setTimeout(() => {
      const target = Array.from(
        document.querySelectorAll<HTMLButtonElement>(
          "button[data-arrangement-entry-playback-id]",
        ),
      ).find(
        (button) => button.dataset.arrangementEntryPlaybackId === nextSelection,
      );
      if (target) {
        target.focus();
      } else {
        document
          .querySelector<HTMLElement>(
            '[aria-label="Arrangement actions"] button:not(:disabled)',
          )
          ?.focus();
      }
    }, 0);
  };
  const addDefaultSection = (revealSection: boolean) => {
    if (!defaultSession) return;
    stopForMutation();
    const result = actions.addSection(arrangementId, defaultSession.id);
    if (!result) return;

    if (revealSection) {
      selectNewEntry(result.entryId);
    } else {
      setSelectedEntryId(result.entryId);
      setOpenSessionEntryId(undefined);
    }
  };

  return (
    <NoteColorProvider config={noteColorConfig}>
      <div className={styles.workspace}>
        <ArrangementHeader
          arrangementId={arrangementId}
          canAddSection={defaultSession !== undefined}
          transport={transport}
          viewMode={resolvedViewMode}
          onAddSection={() => addDefaultSection(false)}
          onOpenLibrary={onOpenLibrary}
          onViewModeChange={(mode) => actions.setViewMode(arrangementId, mode)}
        />

        {resolvedViewMode === "build" ? (
          <section
            aria-label="Arrangement Sections"
            className={styles.buildSurface}
          >
            {arrangement.entries.length > 0 ? (
              <div className={styles.sectionList}>
                {arrangement.entries.map((entry, entryIndex) => {
                  const section = arrangement.sections.find(
                    ({ id }) => id === entry.sectionId,
                  );
                  if (!section) return null;
                  const sourceSession = sessions[section.source.sessionId];
                  const sourceChanged =
                    sourceSession !== undefined &&
                    sourceSession.lastModified !==
                      section.source.sessionLastModified;
                  const sourceUnavailable = sourceSession === undefined;
                  const sourceSessionName =
                    sourceSession?.name ?? section.source.sessionName;
                  const sectionNumber = entryIndex + 1;
                  const active = transport.activeEntryId === entry.id;
                  const effectiveTempo =
                    entry.tempoOverrideBpm ?? arrangement.tempoBpm;
                  const tempoStatus =
                    entry.tempoOverrideBpm === undefined
                      ? "inherited from Arrangement Tempo"
                      : "Section override";
                  const loopActive =
                    transport.snapshot.mode === "arrangement-entry-loop" &&
                    (transport.activeEntryId === entry.id ||
                      transport.pendingEntryId === entry.id);
                  const formattedSectionNumber =
                    formatSectionNumber(entryIndex);

                  return (
                    <section
                      key={entry.id}
                      ref={(node) => {
                        if (node) cardRefs.current.set(entry.id, node);
                        else cardRefs.current.delete(entry.id);
                      }}
                      aria-label={`Section ${sectionNumber}`}
                      className={styles.sectionCard}
                      data-active={active || undefined}
                    >
                      <ControlHeader
                        className={styles.sectionCardHeader}
                        primary={
                          <span className={styles.sectionNumber}>
                            <SectionMarker entryIndex={entryIndex} />
                          </span>
                        }
                        actions={
                          <ControlHeaderCluster gap="cluster">
                            <IconButton
                              aria-label={`Playback options for Section ${formattedSectionNumber}. ${effectiveTempo} BPM, ${tempoStatus}. ${loopActive ? "This Section loop is active." : "This Section loop is inactive."}`}
                              data-arrangement-entry-playback-id={entry.id}
                              icon={<Disc3 />}
                              selected={loopActive}
                              size="sm"
                              onClick={() => {
                                setSelectedEntryId(entry.id);
                                setPlaybackDialogEntryId(entry.id);
                                setPlaybackDialogOpen(true);
                              }}
                            />
                            <ControlHeaderCluster
                              aria-label={`Reorder Section ${sectionNumber}`}
                              role="group"
                            >
                              <IconButton
                                aria-label={`Move Section ${sectionNumber} earlier`}
                                disabled={entryIndex === 0}
                                icon={<ListStart />}
                                size="sm"
                                onClick={() => {
                                  stopForMutation();
                                  actions.moveEntry(
                                    arrangementId,
                                    entry.id,
                                    "earlier",
                                  );
                                }}
                              />
                              <IconButton
                                aria-label={`Move Section ${sectionNumber} later`}
                                disabled={
                                  entryIndex === arrangement.entries.length - 1
                                }
                                icon={<ListEnd />}
                                size="sm"
                                onClick={() => {
                                  stopForMutation();
                                  actions.moveEntry(
                                    arrangementId,
                                    entry.id,
                                    "later",
                                  );
                                }}
                              />
                            </ControlHeaderCluster>
                            <ControlHeaderCluster
                              aria-label={`Manage Section ${sectionNumber}`}
                              role="group"
                            >
                              <IconButton
                                aria-label={`Duplicate Section ${sectionNumber}`}
                                icon={<Copy />}
                                size="sm"
                                onClick={() => {
                                  stopForMutation();
                                  if (playbackDialogEntryId === entry.id) {
                                    setPlaybackDialogOpen(false);
                                  }
                                  const id = actions.cloneEntry(
                                    arrangementId,
                                    entry.id,
                                  );
                                  if (id) selectNewEntry(id);
                                }}
                              />
                              <IconButton
                                aria-label={`Remove Section ${sectionNumber} from Arrangement`}
                                icon={<Trash2 />}
                                size="sm"
                                tone="danger"
                                onClick={() => removeEntryById(entry.id)}
                              />
                            </ControlHeaderCluster>
                          </ControlHeaderCluster>
                        }
                      />

                      <div className={styles.sectionControlRow}>
                        <OptionButton
                          aria-label={`Session for Section ${sectionNumber}. Current: ${sourceSessionName}.${sourceUnavailable ? " Session unavailable." : sourceChanged ? " Session changed since it was added." : ""}`}
                          aria-controls={
                            openSessionEntryId === entry.id
                              ? `session-picker-${entry.id}`
                              : undefined
                          }
                          aria-expanded={openSessionEntryId === entry.id}
                          className={styles.sectionSessionButton}
                          density="compact"
                          disclosureState={
                            openSessionEntryId === entry.id ? "open" : "closed"
                          }
                          label={sourceSessionName}
                          presentation="list"
                          preview={
                            sourceUnavailable ? (
                              <SelectionPreviewLabel>
                                Unavailable
                              </SelectionPreviewLabel>
                            ) : sourceChanged ? (
                              <SelectionPreviewLabel>
                                Changed
                              </SelectionPreviewLabel>
                            ) : undefined
                          }
                          selected={openSessionEntryId === entry.id}
                          selectionSemantics="visual"
                          onClick={() => {
                            stopForMutation();
                            setSelectedEntryId(entry.id);
                            setOpenSessionEntryId((current) =>
                              current === entry.id ? undefined : entry.id,
                            );
                          }}
                        />
                        <NumericStepper
                          aria-label={`Plays for Section ${sectionNumber}`}
                          formatValue={(value) =>
                            `×${value} ${value === 1 ? "Play" : "Plays"}`
                          }
                          max={MAX_ARRANGEMENT_ENTRY_PLAY_COUNT}
                          min={MIN_ARRANGEMENT_ENTRY_PLAY_COUNT}
                          value={entry.playCount}
                          onChange={(value) => {
                            stopForMutation();
                            actions.setPlayCount(
                              arrangementId,
                              entry.id,
                              value,
                            );
                          }}
                        />
                      </div>
                      {openSessionEntryId === entry.id ? (
                        <ArrangementSectionPicker
                          arrangementId={arrangementId}
                          id={`session-picker-${entry.id}`}
                          sectionId={section.id}
                          sectionLabel={`Section ${sectionNumber}`}
                          onBeforeChange={stopForMutation}
                          onClose={() => setOpenSessionEntryId(undefined)}
                        />
                      ) : sourceChanged && sourceSession.parts.length === 0 ? (
                        <Text
                          as="div"
                          className={styles.sectionUnavailable}
                          size="xs"
                          variant="muted"
                        >
                          {sourceSession.name} has no Parts to update
                        </Text>
                      ) : null}
                    </section>
                  );
                })}
              </div>
            ) : null}

            {openPlaybackEntry ? (
              <ArrangementSectionPlaybackDialog
                key={openPlaybackEntry.id}
                arrangementId={arrangementId}
                entryId={openPlaybackEntry.id}
                isOpen={playbackDialogOpen}
                sectionNumber={formatSectionNumber(openPlaybackEntryIndex)}
                onClose={() => setPlaybackDialogOpen(false)}
              />
            ) : null}

            {arrangement.entries.length === 0 ? (
              defaultSession ? (
                <WorkspaceEmptyState
                  action={
                    <Button
                      icon={<Plus />}
                      label="Add First Section"
                      size="sm"
                      onClick={() => addDefaultSection(true)}
                    />
                  }
                >
                  Adding a Session captures its current Parts and playback
                  settings. If the Session changes, you can update the Section
                  later.
                </WorkspaceEmptyState>
              ) : (
                <WorkspaceEmptyState
                  action={
                    <Button
                      icon={<LibraryBig />}
                      label="Open Library"
                      size="sm"
                      onClick={() => onOpenLibrary()}
                    />
                  }
                >
                  Arrangements are built from Sessions. Add at least one Part to
                  a Session first.
                </WorkspaceEmptyState>
              )
            ) : (
              <div className={styles.addSectionAction}>
                <Button
                  disabled={!defaultSession}
                  icon={<Plus />}
                  label="Add Section"
                  size="sm"
                  onClick={() => addDefaultSection(true)}
                />
              </div>
            )}
          </section>
        ) : (
          <section aria-label="Arrangement Chart" className={styles.chartView}>
            <ol className={styles.sequence}>
              {arrangement.entries.map((entry, entryIndex) => {
                const section = arrangement.sections.find(
                  ({ id }) => id === entry.sectionId,
                );
                const unavailable = (section?.parts.length ?? 0) === 0;
                const current =
                  transport.isActive && transport.activeEntryId === entry.id;
                const upcoming =
                  transport.isActive &&
                  chartCue.presentation?.kind === "upcoming" &&
                  chartCue.presentation?.entryId === entry.id;
                return (
                  <li
                    key={entry.id}
                    ref={(node) => {
                      if (node) chartTileRefs.current.set(entry.id, node);
                      else chartTileRefs.current.delete(entry.id);
                    }}
                    className={styles.entryHost}
                  >
                    <ArrangementChartEntryTile
                      current={current}
                      entryIndex={entryIndex}
                      playbackActive={transport.isActive}
                      playCount={entry.playCount}
                      selected={entry.id === selectedEntry?.id}
                      unavailable={unavailable}
                      upcoming={upcoming}
                      onSelect={() => {
                        setSelectedEntryId(entry.id);
                      }}
                    />
                  </li>
                );
              })}
            </ol>

            {presentationSection && chartCue.presentation ? (
              <SessionChart
                activePartId={
                  chartCue.presentation.kind === "current"
                    ? chartCue.presentation.activeSourcePartId
                    : undefined
                }
                ariaLabel={
                  chartCue.presentation.kind === "upcoming"
                    ? `Up Next, ${presentationSectionLabel}`
                    : `${presentationSectionLabel} Chart`
                }
                backingBand={presentationSection.backingBand}
                parts={presentationSection.parts}
              />
            ) : null}
          </section>
        )}
      </div>
    </NoteColorProvider>
  );
}
