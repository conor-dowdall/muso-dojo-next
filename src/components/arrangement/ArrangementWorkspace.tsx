"use client";

import { useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  Copy,
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
import styles from "./ArrangementWorkspace.module.css";

type ArrangementViewMode = "build" | "chart";

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

export function ArrangementWorkspace({
  arrangementId,
  onOpenLibrary,
}: {
  arrangementId: string;
  onOpenLibrary: () => void;
}) {
  const arrangement = useAppStore((state) => state.arrangements[arrangementId]);
  const sessions = useAppStore((state) => state.sessions);
  const noteColorConfig = useAppStore(
    (state) => state.dojoSettings.noteColorConfig,
  );
  const actions = useAppStore(
    useShallow((state) => ({
      addSection: state.addArrangementSectionFromSession,
      cloneEntry: state.cloneArrangementEntry,
      moveEntry: state.moveArrangementEntry,
      removeEntry: state.removeArrangementEntry,
      setPlayCount: state.setArrangementEntryPlayCount,
    })),
  );
  const [viewMode, setViewMode] = useState<ArrangementViewMode>("build");
  const [selectedEntryId, setSelectedEntryId] = useState<string | undefined>(
    () => arrangement?.entries[0]?.id,
  );
  const [openSessionEntryId, setOpenSessionEntryId] = useState<
    string | undefined
  >();
  const [showCaptureExplanation, setShowCaptureExplanation] = useState(false);
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
  const stopForMutation = () => {
    if (transport.isActive) partSequenceCoordinator.stop();
  };
  const selectNewEntry = (entryId: string) => {
    setSelectedEntryId(entryId);
    setOpenSessionEntryId(undefined);
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
  };
  const addDefaultSection = (revealSection: boolean) => {
    if (!defaultSession) return;
    const isFirstSection = arrangement.entries.length === 0;
    stopForMutation();
    const result = actions.addSection(arrangementId, defaultSession.id);
    if (!result) return;

    if (isFirstSection) {
      setShowCaptureExplanation(true);
    }

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
          onViewModeChange={setViewMode}
        />

        {resolvedViewMode === "build" ? (
          <section
            aria-label="Arrangement Sections"
            className={styles.buildSurface}
          >
            {arrangement.entries.length > 0 && showCaptureExplanation ? (
              <Text
                as="p"
                className={styles.captureExplanation}
                role="status"
                size="sm"
                variant="muted"
              >
                This Section captured the Session&apos;s current Parts and
                backing. If the Session changes, use Update to refresh this
                Section.
              </Text>
            ) : null}

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
                  const pending =
                    !active && transport.pendingEntryId === entry.id;

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
                      data-pending={pending || undefined}
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
                  Adding a Session captures its current Parts and backing. If
                  the Session changes, you can update the Section later.
                </WorkspaceEmptyState>
              ) : (
                <WorkspaceEmptyState
                  action={
                    <Button
                      icon={<LibraryBig />}
                      label="Open Library"
                      size="sm"
                      onClick={onOpenLibrary}
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
                const displayed =
                  transport.isActive &&
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
                    <OptionButton
                      aria-disabled={
                        transport.isActive || unavailable ? true : undefined
                      }
                      aria-current={displayed ? "step" : undefined}
                      aria-label={`Section ${entryIndex + 1}, plays ${entry.playCount} ${entry.playCount === 1 ? "time" : "times"}${displayed ? ", chart displayed" : ""}${transport.isActive ? ", chart follows playback" : ""}`}
                      className={styles.entryTile}
                      data-active={displayed || undefined}
                      disabled={unavailable}
                      label={
                        <span className={styles.sectionTileLabel}>
                          <SectionMarker entryIndex={entryIndex} />
                          {entry.playCount > 1 ? (
                            <span>×{entry.playCount}</span>
                          ) : null}
                        </span>
                      }
                      presentation="tile"
                      selected={
                        !transport.isActive && entry.id === selectedEntry?.id
                      }
                      tabIndex={transport.isActive ? -1 : undefined}
                      onClick={() => {
                        if (transport.isActive) return;
                        setSelectedEntryId(entry.id);
                      }}
                    />
                  </li>
                );
              })}
            </ol>

            {presentationSection && chartCue.presentation ? (
              <>
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
                <span aria-live="polite" className={styles.srOnly}>
                  {chartCue.presentation.kind === "upcoming"
                    ? `Up next, ${presentationSectionLabel}`
                    : ""}
                </span>
              </>
            ) : null}
          </section>
        )}
      </div>
    </NoteColorProvider>
  );
}
