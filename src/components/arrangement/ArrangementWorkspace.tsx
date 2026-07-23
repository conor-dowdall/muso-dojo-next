"use client";

import { useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { Copy, ListEnd, ListStart, RefreshCw, Trash2 } from "lucide-react";
import { partSequenceCoordinator } from "@/audio";
import { Button } from "@/components/ui/buttons/Button";
import { IconButton } from "@/components/ui/buttons/IconButton";
import { OptionButton } from "@/components/ui/buttons/OptionButton";
import {
  ControlHeader,
  ControlHeaderCluster,
} from "@/components/ui/control-header/ControlHeader";
import {
  DisclosureListConfirmAction,
  DisclosureListGroup,
} from "@/components/ui/disclosure-list/DisclosureList";
import { NamedLibraryItemSaveField } from "@/components/ui/named-library-item/NamedLibraryItemSaveField";
import { NumericStepper } from "@/components/ui/numeric-stepper/NumericStepper";
import { ObjectMenuDialog } from "@/components/ui/object-menu";
import { Heading } from "@/components/ui/typography/Heading";
import { Text } from "@/components/ui/typography/Text";
import { NoteColorProvider } from "@/components/note-colors/NoteColorProvider";
import { SessionChart } from "@/components/session/SessionView";
import { useArrangementTransport } from "@/hooks/audio/useArrangementTransport";
import { useArrangementChartCue } from "@/hooks/audio/useArrangementChartCue";
import { useAppStore } from "@/stores/appStore";
import { normalizeEntityNameForComparison } from "@/stores/app-store/entityIds";
import {
  MAX_ARRANGEMENT_ENTRY_PLAY_COUNT,
  MIN_ARRANGEMENT_ENTRY_PLAY_COUNT,
} from "@/types/arrangement";
import { ArrangementHeader } from "./ArrangementHeader";
import { ArrangementSectionPicker } from "./ArrangementSectionPicker";
import styles from "./ArrangementWorkspace.module.css";

type ArrangementViewMode = "build" | "chart";

export function ArrangementWorkspace({
  arrangementId,
  onOpenLibrary,
}: {
  arrangementId: string;
  onOpenLibrary: () => void;
}) {
  const arrangement = useAppStore((state) => state.arrangements[arrangementId]);
  const arrangementRecord = useAppStore((state) => state.arrangements);
  const sessions = useAppStore((state) => state.sessions);
  const noteColorConfig = useAppStore(
    (state) => state.dojoSettings.noteColorConfig,
  );
  const actions = useAppStore(
    useShallow((state) => ({
      cloneEntry: state.cloneArrangementEntry,
      moveEntry: state.moveArrangementEntry,
      removeEntry: state.removeArrangementEntry,
      renameArrangement: state.renameArrangement,
      replaceSection: state.replaceArrangementSectionFromSession,
      setPlayCount: state.setArrangementEntryPlayCount,
    })),
  );
  const [viewMode, setViewMode] = useState<ArrangementViewMode>("build");
  const [selectedEntryId, setSelectedEntryId] = useState<string | undefined>(
    () => arrangement?.entries[0]?.id,
  );
  const [arrangementNameDrafts, setArrangementNameDrafts] = useState<
    Record<string, string>
  >({});
  const [removeConfirmEntryId, setRemoveConfirmEntryId] = useState<
    string | undefined
  >();
  const chartTileRefs = useRef(new Map<string, HTMLDivElement>());
  const cardRefs = useRef(new Map<string, HTMLElement>());
  const transport = useArrangementTransport(arrangementId, selectedEntryId);
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
  const removeEntry = arrangement.entries.find(
    ({ id }) => id === removeConfirmEntryId,
  );
  const removeSection = arrangement.sections.find(
    ({ id }) => id === removeEntry?.sectionId,
  );
  const arrangementNameDraft =
    arrangementNameDrafts[arrangementId] ?? arrangement.name;
  const normalizedArrangementName = arrangementNameDraft.trim();
  const arrangementNameConflict = Object.values(arrangementRecord).some(
    (candidate) =>
      candidate.id !== arrangementId &&
      normalizeEntityNameForComparison(candidate.name) ===
        normalizeEntityNameForComparison(normalizedArrangementName),
  );
  const canRenameArrangement =
    normalizedArrangementName.length > 0 &&
    normalizedArrangementName !== arrangement.name &&
    !arrangementNameConflict;
  const stopForMutation = () => {
    if (transport.isActive) partSequenceCoordinator.stop();
  };
  const sectionUseCount = (sectionId: string) =>
    arrangement.entries.filter((entry) => entry.sectionId === sectionId).length;
  const selectNewEntry = (entryId: string) => {
    setSelectedEntryId(entryId);
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
    setRemoveConfirmEntryId(undefined);
  };
  const requestRemove = (entryId: string, sectionId: string) => {
    if (sectionUseCount(sectionId) === 1) {
      setRemoveConfirmEntryId(entryId);
    } else {
      removeEntryById(entryId);
    }
  };

  return (
    <NoteColorProvider config={noteColorConfig}>
      <div className={styles.workspace}>
        <ArrangementHeader
          arrangementId={arrangementId}
          transport={transport}
          viewMode={resolvedViewMode}
          onOpenLibrary={onOpenLibrary}
          onViewModeChange={setViewMode}
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
                  const uses = sectionUseCount(section.id);
                  const sourceChanged =
                    sourceSession !== undefined &&
                    sourceSession.lastModified !==
                      section.source.sessionLastModified;
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
                      aria-label={`Section ${section.name}, Entry ${entryIndex + 1}`}
                      className={styles.sectionCard}
                      data-active={active || undefined}
                      data-pending={pending || undefined}
                    >
                      <ControlHeader
                        className={styles.sectionCardHeader}
                        primary={
                          <span className={styles.sectionName}>
                            {section.name}
                          </span>
                        }
                        actions={
                          <ControlHeaderCluster gap="cluster">
                            <ControlHeaderCluster
                              aria-label={`Reorder Section ${section.name}`}
                              role="group"
                            >
                              <IconButton
                                aria-label={`Move Section ${section.name} earlier`}
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
                                aria-label={`Move Section ${section.name} later`}
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
                              aria-label={`Manage Section ${section.name}`}
                              role="group"
                            >
                              <IconButton
                                aria-label={`Duplicate Section ${section.name}`}
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
                                aria-label={`Remove Section ${section.name} from Arrangement`}
                                icon={<Trash2 />}
                                size="sm"
                                tone="danger"
                                onClick={() =>
                                  requestRemove(entry.id, section.id)
                                }
                              />
                            </ControlHeaderCluster>
                          </ControlHeaderCluster>
                        }
                      />

                      <div className={styles.sectionControlRow}>
                        <OptionButton
                          aria-label={`Select Section ${section.name}, from ${section.source.sessionName}`}
                          className={styles.sectionSessionButton}
                          density="compact"
                          label={section.source.sessionName}
                          presentation="list"
                          selected={
                            !transport.isActive &&
                            selectedEntry?.id === entry.id
                          }
                          selectionSemantics="visual"
                          onClick={() => {
                            if (transport.isActive) return;
                            setSelectedEntryId(entry.id);
                          }}
                        />
                        <NumericStepper
                          aria-label={`Plays for Section ${section.name}`}
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
                      {sourceChanged &&
                      sourceSession &&
                      sourceSession.parts.length > 0 ? (
                        <div className={styles.sectionUpdateRow}>
                          <Text as="span" size="xs" variant="muted">
                            {uses > 1
                              ? `Update affects ${uses} uses of Section ${section.name}`
                              : "Update available"}
                          </Text>
                          <Button
                            icon={<RefreshCw />}
                            label={`Refresh ${section.source.sessionName}`}
                            size="sm"
                            onClick={() => {
                              stopForMutation();
                              actions.replaceSection(
                                arrangementId,
                                section.id,
                                sourceSession.id,
                              );
                            }}
                          />
                        </div>
                      ) : !sourceSession ? (
                        <Text
                          as="div"
                          className={styles.sectionUnavailable}
                          size="xs"
                          variant="muted"
                        >
                          {section.source.sessionName} is unavailable
                        </Text>
                      ) : null}
                    </section>
                  );
                })}
              </div>
            ) : null}

            <ArrangementSectionPicker
              arrangementId={arrangementId}
              onAppended={selectNewEntry}
              onBeforeChange={stopForMutation}
            />

            <form
              className={styles.arrangementNameForm}
              onSubmit={(event) => {
                event.preventDefault();
                if (!canRenameArrangement) return;
                setArrangementNameDrafts((current) => ({
                  ...current,
                  [arrangementId]: normalizedArrangementName,
                }));
                actions.renameArrangement(
                  arrangementId,
                  normalizedArrangementName,
                );
              }}
            >
              <NamedLibraryItemSaveField
                disabled={!canRenameArrangement}
                errorMessage={
                  arrangementNameConflict
                    ? "That name is already in use."
                    : undefined
                }
                label="Arrangement Name"
                saveAriaLabel="Save Arrangement name"
                saveLabel="Save"
                value={arrangementNameDraft}
                onChange={(name) =>
                  setArrangementNameDrafts((current) => ({
                    ...current,
                    [arrangementId]: name,
                  }))
                }
              />
            </form>
          </section>
        ) : (
          <section aria-labelledby="arrangement-chart-heading">
            <Heading
              as="h2"
              className={styles.eyebrow}
              id="arrangement-chart-heading"
              size="xs"
            >
              Chart
            </Heading>
            <div className={styles.sequence}>
              {arrangement.entries.map((entry, entryIndex) => {
                const section = arrangement.sections.find(
                  ({ id }) => id === entry.sectionId,
                );
                const active = transport.activeEntryId === entry.id;
                const pending =
                  !active && transport.pendingEntryId === entry.id;
                const upNext = chartCue.upNextEntryId === entry.id;
                return (
                  <div
                    key={entry.id}
                    ref={(node) => {
                      if (node) chartTileRefs.current.set(entry.id, node);
                      else chartTileRefs.current.delete(entry.id);
                    }}
                    className={styles.entryHost}
                  >
                    <OptionButton
                      aria-current={active ? "step" : undefined}
                      aria-label={`${section?.name ?? "Unavailable Section"}, Entry ${entryIndex + 1}, plays ${entry.playCount} ${entry.playCount === 1 ? "time" : "times"}${upNext ? ", up next" : ""}`}
                      className={styles.entryTile}
                      data-active={active || undefined}
                      data-pending={pending || undefined}
                      data-up-next={upNext || undefined}
                      disabled={
                        transport.isActive || (section?.parts.length ?? 0) === 0
                      }
                      label={`${section?.name ?? "Unavailable"}${entry.playCount > 1 ? ` ×${entry.playCount}` : ""}`}
                      presentation="tile"
                      selected={
                        !transport.isActive && entry.id === selectedEntry?.id
                      }
                      subtitle={upNext ? "Up Next" : undefined}
                      onClick={() => setSelectedEntryId(entry.id)}
                    />
                  </div>
                );
              })}
            </div>

            {presentationSection ? (
              <>
                <div className={styles.chartHeading}>
                  <Text as="p" size="sm" variant="muted">
                    {chartCue.presentation?.kind === "upcoming"
                      ? `Up Next · ${presentationSection.name}`
                      : presentationSection.name}
                  </Text>
                </div>
                <SessionChart
                  activePartId={
                    chartCue.presentation?.kind === "current"
                      ? chartCue.presentation.activeSourcePartId
                      : undefined
                  }
                  ariaLabel={
                    chartCue.presentation?.kind === "upcoming"
                      ? `Up Next, ${presentationSection.name}`
                      : `${presentationSection.name} Chart`
                  }
                  backingBand={presentationSection.backingBand}
                  parts={presentationSection.parts}
                />
                <span aria-live="polite" className={styles.srOnly}>
                  {chartCue.presentation?.kind === "upcoming"
                    ? `Up next, ${presentationSection.name}`
                    : ""}
                </span>
              </>
            ) : null}
          </section>
        )}
      </div>

      <ObjectMenuDialog
        icon={<Trash2 />}
        isOpen={Boolean(removeEntry && removeSection)}
        size="compact"
        title="Remove Section"
        onClose={() => setRemoveConfirmEntryId(undefined)}
      >
        {removeEntry && removeSection ? (
          <DisclosureListGroup>
            <DisclosureListConfirmAction
              actionAriaLabel={`Remove Section ${removeSection.name}`}
              confirmAriaLabel={`Remove Section ${removeSection.name}?`}
              confirmButtonLabel="Remove"
              confirmLabel={`Remove Section ${removeSection.name}?`}
              icon={<Trash2 />}
              isConfirming
              label="Remove from Arrangement"
              tone="danger"
              onCancel={() => setRemoveConfirmEntryId(undefined)}
              onConfirm={() => removeEntryById(removeEntry.id)}
              onRequestConfirm={() => undefined}
            />
          </DisclosureListGroup>
        ) : null}
      </ObjectMenuDialog>
    </NoteColorProvider>
  );
}
