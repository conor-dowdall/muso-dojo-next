"use client";

import { useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  Copy,
  ExternalLink,
  ListEnd,
  ListStart,
  Plus,
  RefreshCw,
  Replace,
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
import { Dialog } from "@/components/ui/dialog/Dialog";
import {
  DisclosureList,
  DisclosureListAction,
  DisclosureListConfirmAction,
  DisclosureListGroup,
} from "@/components/ui/disclosure-list/DisclosureList";
import { InlineRenameActionItem } from "@/components/ui/inline-rename/InlineRenameActionItem";
import { NumericStepper } from "@/components/ui/numeric-stepper/NumericStepper";
import { Heading } from "@/components/ui/typography/Heading";
import { Text } from "@/components/ui/typography/Text";
import { NoteColorProvider } from "@/components/note-colors/NoteColorProvider";
import { SessionChart } from "@/components/session/SessionView";
import { useArrangementTransport } from "@/hooks/audio/useArrangementTransport";
import { useArrangementChartCue } from "@/hooks/audio/useArrangementChartCue";
import { useAppStore } from "@/stores/appStore";
import { normalizeEntityNameForComparison } from "@/stores/app-store/entityIds";
import { ArrangementHeader } from "./ArrangementHeader";
import { ArrangementSectionPickerDialog } from "./ArrangementSectionPickerDialog";
import styles from "./ArrangementWorkspace.module.css";

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
      append: state.appendArrangementSectionEntry,
      cloneEntry: state.cloneArrangementEntry,
      moveEntry: state.moveArrangementEntry,
      removeEntry: state.removeArrangementEntry,
      renameSection: state.renameArrangementSection,
      replaceSection: state.replaceArrangementSectionFromSession,
      setActiveWorkspace: state.setActiveWorkspace,
      setPlayCount: state.setArrangementEntryPlayCount,
    })),
  );
  const [selectedEntryId, setSelectedEntryId] = useState<string | undefined>(
    () => arrangement?.entries[0]?.id,
  );
  const [addOpen, setAddOpen] = useState(false);
  const [replaceSectionId, setReplaceSectionId] = useState<string | undefined>(
    undefined,
  );
  const [renameOpen, setRenameOpen] = useState(false);
  const [removeConfirming, setRemoveConfirming] = useState(false);
  const tileRefs = useRef(new Map<string, HTMLDivElement>());
  const transport = useArrangementTransport(arrangementId, selectedEntryId);
  const selectedEntry =
    arrangement?.entries.find(({ id }) => id === selectedEntryId) ??
    arrangement?.entries[0];
  const selectedSection = arrangement?.sections.find(
    ({ id }) => id === selectedEntry?.sectionId,
  );
  const fallback = selectedEntry
    ? { entryId: selectedEntry.id, sectionId: selectedEntry.sectionId }
    : undefined;
  const chartCue = useArrangementChartCue(transport.plan, fallback);

  useEffect(() => {
    if (transport.activeEntryId) {
      const tile = tileRefs.current.get(transport.activeEntryId);
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      tile?.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "nearest",
        inline: "nearest",
      });
      const activeEntryId = transport.activeEntryId;
      const selectionTimer = globalThis.setTimeout(
        () => setSelectedEntryId(activeEntryId),
        0,
      );
      return () => globalThis.clearTimeout(selectionTimer);
    }
  }, [transport.activeEntryId]);

  const presentationSection = arrangement?.sections.find(
    ({ id }) => id === chartCue.presentation?.sectionId,
  );
  const selectedIndex =
    arrangement?.entries.findIndex(({ id }) => id === selectedEntry?.id) ?? -1;
  const sectionUseCount =
    arrangement?.entries.filter(
      ({ sectionId }) => sectionId === selectedSection?.id,
    ).length ?? 0;
  const sourceSession = selectedSection
    ? sessions[selectedSection.source.sessionId]
    : undefined;
  const sourceChanged =
    sourceSession !== undefined &&
    sourceSession.lastModified !== selectedSection?.source.sessionLastModified;
  const stopForMutation = () => {
    if (transport.isActive) partSequenceCoordinator.stop();
  };
  const selectNewEntry = (entryId: string) => {
    setSelectedEntryId(entryId);
    globalThis.setTimeout(
      () =>
        tileRefs.current
          .get(entryId)
          ?.scrollIntoView({ block: "nearest", inline: "nearest" }),
      0,
    );
  };

  if (!arrangement) return null;

  const removeSelectedEntry = () => {
    if (!selectedEntry) return;
    stopForMutation();
    const currentIndex = arrangement.entries.findIndex(
      ({ id }) => id === selectedEntry.id,
    );
    const nextSelection =
      arrangement.entries[currentIndex + 1]?.id ??
      arrangement.entries[currentIndex - 1]?.id;
    actions.removeEntry(arrangementId, selectedEntry.id);
    setSelectedEntryId(nextSelection);
    setRemoveConfirming(false);
  };

  return (
    <NoteColorProvider config={noteColorConfig}>
      <div className={styles.workspace}>
        <ArrangementHeader
          arrangementId={arrangementId}
          transport={transport}
          onOpenAddSection={() => setAddOpen(true)}
          onOpenLibrary={onOpenLibrary}
        />

        {arrangement.entries.length === 0 ? (
          <section className={styles.empty}>
            <Heading as="h2" size="lg">
              No Sections Yet
            </Heading>
            <Button
              icon={<Plus />}
              label="Add First Section"
              size="md"
              variant="outline"
              onClick={() => setAddOpen(true)}
            />
          </section>
        ) : (
          <>
            <section aria-labelledby="arrangement-sequence-heading">
              <Heading
                as="h2"
                className={styles.eyebrow}
                id="arrangement-sequence-heading"
                size="xs"
              >
                Arrangement
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
                      className={styles.entryHost}
                      ref={(node) => {
                        if (node) tileRefs.current.set(entry.id, node);
                        else tileRefs.current.delete(entry.id);
                      }}
                    >
                      <OptionButton
                        aria-current={active ? "step" : undefined}
                        aria-label={`${section?.name ?? "Unavailable Section"}, entry ${entryIndex + 1}, plays ${entry.playCount} ${entry.playCount === 1 ? "time" : "times"}${upNext ? ", up next" : ""}`}
                        className={styles.entryTile}
                        data-active={active || undefined}
                        data-pending={pending || undefined}
                        data-up-next={upNext || undefined}
                        disabled={
                          transport.isActive ||
                          (section?.parts.length ?? 0) === 0
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
            </section>

            {selectedEntry && selectedSection ? (
              <section
                aria-labelledby="selected-section-heading"
                className={styles.editorCard}
              >
                <Heading
                  as="h2"
                  className={styles.eyebrow}
                  id="selected-section-heading"
                  size="xs"
                >
                  Selected Section
                </Heading>
                <ControlHeader
                  className={styles.editorHeader}
                  primary={
                    <div>
                      <Heading as="h3" size="base">
                        {selectedSection.name}
                      </Heading>
                      <Text as="p" size="sm" variant="muted">
                        {transport.isActive &&
                        transport.activeEntryId === selectedEntry.id
                          ? `Play ${(transport.activePlayIndex ?? 0) + 1} of ${transport.activePlayCount ?? selectedEntry.playCount}`
                          : `Entry ${selectedIndex + 1} of ${arrangement.entries.length}`}
                      </Text>
                    </div>
                  }
                  actions={
                    <ControlHeaderCluster
                      aria-label={`Actions for ${selectedSection.name}`}
                      role="group"
                    >
                      <IconButton
                        aria-label={`Move ${selectedSection.name} earlier`}
                        disabled={selectedIndex <= 0}
                        icon={<ListStart />}
                        size="sm"
                        onClick={() => {
                          stopForMutation();
                          actions.moveEntry(
                            arrangementId,
                            selectedEntry.id,
                            "earlier",
                          );
                        }}
                      />
                      <IconButton
                        aria-label={`Move ${selectedSection.name} later`}
                        disabled={
                          selectedIndex >= arrangement.entries.length - 1
                        }
                        icon={<ListEnd />}
                        size="sm"
                        onClick={() => {
                          stopForMutation();
                          actions.moveEntry(
                            arrangementId,
                            selectedEntry.id,
                            "later",
                          );
                        }}
                      />
                      <IconButton
                        aria-label={`Duplicate ${selectedSection.name} entry`}
                        icon={<Copy />}
                        size="sm"
                        onClick={() => {
                          stopForMutation();
                          const id = actions.cloneEntry(
                            arrangementId,
                            selectedEntry.id,
                          );
                          if (id) selectNewEntry(id);
                        }}
                      />
                      <IconButton
                        aria-label={`Remove ${selectedSection.name} from arrangement`}
                        icon={<Trash2 />}
                        size="sm"
                        tone="danger"
                        onClick={() => {
                          if (sectionUseCount === 1) setRemoveConfirming(true);
                          else removeSelectedEntry();
                        }}
                      />
                    </ControlHeaderCluster>
                  }
                />

                <div className={styles.playCount}>
                  <Text as="span" size="sm">
                    Section plays
                  </Text>
                  <NumericStepper
                    aria-label={`Section plays for ${selectedSection.name}`}
                    formatValue={(value) => `×${value}`}
                    max={99}
                    min={1}
                    value={selectedEntry.playCount}
                    onChange={(value) => {
                      stopForMutation();
                      actions.setPlayCount(
                        arrangementId,
                        selectedEntry.id,
                        value,
                      );
                    }}
                  />
                </div>
                {sectionUseCount > 1 ? (
                  <Text as="p" size="sm" variant="muted">
                    Used {sectionUseCount} times in this Arrangement
                  </Text>
                ) : null}
                {sourceChanged ? (
                  <Text as="p" size="sm" variant="muted">
                    Source changed since capture
                  </Text>
                ) : null}
                {!sourceSession ? (
                  <Text as="p" size="sm" variant="muted">
                    Source Session unavailable
                  </Text>
                ) : null}

                <DisclosureList grouped groupGap="section">
                  <DisclosureListGroup>
                    <InlineRenameActionItem
                      ariaLabel={`Rename ${selectedSection.name} section`}
                      fieldLabel="Section name"
                      isNameAvailable={(name) =>
                        !arrangement.sections.some(
                          (candidate) =>
                            candidate.id !== selectedSection.id &&
                            normalizeEntityNameForComparison(candidate.name) ===
                              normalizeEntityNameForComparison(name),
                        )
                      }
                      isOpen={renameOpen}
                      label="Rename Section"
                      value={selectedSection.name}
                      onClose={() => setRenameOpen(false)}
                      onRename={(name) =>
                        actions.renameSection(
                          arrangementId,
                          selectedSection.id,
                          name,
                        )
                      }
                      onToggle={() => setRenameOpen((open) => !open)}
                    />
                    <DisclosureListAction
                      disabled={
                        !sourceSession || sourceSession.parts.length === 0
                      }
                      icon={<RefreshCw />}
                      label="Refresh from Source"
                      subtitle={
                        sectionUseCount > 1
                          ? `Updates ${sectionUseCount} Entries`
                          : undefined
                      }
                      onClick={() => {
                        if (!sourceSession) return;
                        stopForMutation();
                        actions.replaceSection(
                          arrangementId,
                          selectedSection.id,
                          sourceSession.id,
                        );
                      }}
                    />
                    <DisclosureListAction
                      disabled={
                        !Object.values(sessions).some(
                          ({ parts }) => parts.length > 0,
                        )
                      }
                      icon={<Replace />}
                      label="Replace from Session…"
                      subtitle={
                        sectionUseCount > 1
                          ? `Updates ${sectionUseCount} Entries`
                          : undefined
                      }
                      onClick={() => setReplaceSectionId(selectedSection.id)}
                    />
                    <DisclosureListAction
                      disabled={!sourceSession}
                      icon={<ExternalLink />}
                      label="Open Source Session"
                      onClick={() => {
                        if (!sourceSession) return;
                        partSequenceCoordinator.stop();
                        actions.setActiveWorkspace({
                          kind: "session",
                          id: sourceSession.id,
                        });
                      }}
                    />
                  </DisclosureListGroup>
                  {sectionUseCount === 1 ? (
                    <DisclosureListGroup>
                      <DisclosureListConfirmAction
                        actionAriaLabel={`Remove ${selectedSection.name} from arrangement`}
                        confirmAriaLabel={`Confirm removing ${selectedSection.name}. Its captured Section will also be deleted.`}
                        confirmButtonLabel="Remove"
                        confirmLabel={`Remove ${selectedSection.name}? Its captured Section will also be deleted.`}
                        icon={<Trash2 />}
                        isConfirming={removeConfirming}
                        label="Remove from Arrangement"
                        tone="danger"
                        onCancel={() => setRemoveConfirming(false)}
                        onConfirm={removeSelectedEntry}
                        onRequestConfirm={() => setRemoveConfirming(true)}
                      />
                    </DisclosureListGroup>
                  ) : null}
                </DisclosureList>
              </section>
            ) : null}

            {presentationSection ? (
              <section aria-labelledby="arrangement-chart-heading">
                <div className={styles.chartHeading}>
                  <Heading
                    as="h2"
                    className={styles.eyebrow}
                    id="arrangement-chart-heading"
                    size="xs"
                  >
                    Chart
                  </Heading>
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
              </section>
            ) : null}
          </>
        )}
      </div>

      <Dialog
        isOpen={addOpen}
        size="standard"
        onClose={() => setAddOpen(false)}
      >
        <ArrangementSectionPickerDialog
          arrangementId={arrangementId}
          onAppended={selectNewEntry}
          onBeforeChange={stopForMutation}
          onClose={() => setAddOpen(false)}
        />
      </Dialog>
      <Dialog
        isOpen={Boolean(replaceSectionId)}
        size="standard"
        onClose={() => setReplaceSectionId(undefined)}
      >
        {replaceSectionId ? (
          <ArrangementSectionPickerDialog
            arrangementId={arrangementId}
            replaceSectionId={replaceSectionId}
            onBeforeChange={stopForMutation}
            onClose={() => setReplaceSectionId(undefined)}
          />
        ) : null}
      </Dialog>
    </NoteColorProvider>
  );
}
