"use client";

import { useState } from "react";
import {
  Ellipsis,
  GalleryThumbnails,
  Gauge,
  LibraryBig,
  ListVideo,
  PanelTopBottomDashed,
  Repeat2,
  Rows3,
  Settings2,
  Square,
} from "lucide-react";
import {
  ControlHeader,
  ControlHeaderCluster,
} from "@/components/ui/control-header/ControlHeader";
import { IconButton } from "@/components/ui/buttons/IconButton";
import { Heading } from "@/components/ui/typography/Heading";
import {
  ObjectMenuDialog,
  OverflowMenuButton,
} from "@/components/ui/object-menu";
import {
  DisclosureListChoice,
  DisclosureListAction,
  DisclosureListGroup,
} from "@/components/ui/disclosure-list/DisclosureList";
import { Dialog } from "@/components/ui/dialog/Dialog";
import { DojoSettingsDialog } from "@/components/dojo-settings/DojoSettingsDialog";
import {
  PracticeBandReadout,
  type PracticeBandReadoutModel,
} from "@/components/session/PracticeBandTransport";
import { InlineRenameActionItem } from "@/components/ui/inline-rename/InlineRenameActionItem";
import { useAppStore } from "@/stores/appStore";
import { normalizeEntityNameForComparison } from "@/stores/app-store/entityIds";
import { type useArrangementTransport } from "@/hooks/audio/useArrangementTransport";
import { ArrangementTempoDialog } from "./ArrangementTempoDialog";
import styles from "./ArrangementWorkspace.module.css";

export function ArrangementHeader({
  arrangementId,
  onOpenLibrary,
  transport,
  viewMode,
  onViewModeChange,
}: {
  arrangementId: string;
  onOpenLibrary: () => void;
  onViewModeChange: (mode: "build" | "chart") => void;
  transport: ReturnType<typeof useArrangementTransport>;
  viewMode: "build" | "chart";
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [tempoOpen, setTempoOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const arrangement = useAppStore((state) => state.arrangements[arrangementId]);
  const arrangements = useAppStore((state) => state.arrangements);
  const sessions = useAppStore((state) => state.sessions);
  const renameArrangement = useAppStore((state) => state.renameArrangement);
  const setPlaybackMode = useAppStore(
    (state) => state.setArrangementPlaybackMode,
  );
  if (!arrangement) return null;
  const viewModeLabel = viewMode === "build" ? "Arrangement" : "Chart";
  const activeEntryIndex = arrangement.entries.findIndex(
    ({ id }) => id === transport.activeEntryId,
  );
  const activeEntry = arrangement.entries[activeEntryIndex];
  const activeSection = arrangement.sections.find(
    ({ id }) => id === activeEntry?.sectionId,
  );
  const activeSessionName = activeSection
    ? (sessions[activeSection.source.sessionId]?.name ??
      activeSection.source.sessionName)
    : undefined;
  const sectionNumberWidth = Math.max(
    2,
    String(arrangement.entries.length).length,
  );
  const playbackReadout: PracticeBandReadoutModel | null =
    transport.isActive &&
    activeEntryIndex >= 0 &&
    activeSessionName !== undefined
      ? {
          barAccessibleLabel: String(activeEntryIndex + 1),
          barNumberLabel: String(activeEntryIndex + 1).padStart(
            sectionNumberWidth,
            "0",
          ),
          barTotalAccessibleLabel: String(arrangement.entries.length),
          barTotalLabel: String(arrangement.entries.length).padStart(
            sectionNumberWidth,
            "0",
          ),
          countLabel: `${arrangement.entries.length} Sections`,
          identityAccessibleLabel: activeSessionName,
          identityLabel: activeSessionName,
          positionAccessibleLabel: "Section",
          positionLabel: "§",
        }
      : null;
  const openViewDialog = () => {
    setMenuOpen(false);
    setRenameOpen(false);
    setViewOpen(true);
  };

  return (
    <>
      <ControlHeader
        className={styles.header}
        onKeyDownCapture={transport.shortcuts.onKeyDownCapture}
        onPointerDownCapture={transport.shortcuts.onPointerDownCapture}
        primary={
          <Heading
            as="h1"
            className={styles.headerTitle}
            data-content={playbackReadout ? "readout" : "text"}
            size="base"
          >
            {playbackReadout ? (
              <PracticeBandReadout
                prominence="title"
                readout={playbackReadout}
              />
            ) : (
              <span className={styles.headerTitleText}>{arrangement.name}</span>
            )}
          </Heading>
        }
        actions={
          <ControlHeaderCluster aria-label="Arrangement actions" role="group">
            <IconButton
              aria-label={
                transport.isActive ? "Stop Arrangement" : "Play Arrangement"
              }
              disabled={!transport.canPlay}
              icon={transport.isActive ? <Square /> : <ListVideo />}
              selected={transport.isActive}
              size="sm"
              onClick={transport.togglePlayback}
            />
            <IconButton
              aria-label={`Loop arrangement. ${arrangement.playbackMode === "loop" ? "On" : "Off"}`}
              aria-pressed={arrangement.playbackMode === "loop"}
              icon={<Repeat2 />}
              selected={arrangement.playbackMode === "loop"}
              size="sm"
              onClick={() =>
                setPlaybackMode(
                  arrangementId,
                  arrangement.playbackMode === "loop" ? "once" : "loop",
                )
              }
            />
            <IconButton
              aria-label={`Set arrangement tempo. Current tempo: ${arrangement.tempoBpm} bpm`}
              disabled={arrangement.entries.length === 0}
              icon={<Gauge />}
              size="sm"
              onClick={() => setTempoOpen(true)}
            />
            <IconButton
              aria-label={`Choose view. Current: ${viewModeLabel}`}
              icon={<GalleryThumbnails />}
              size="sm"
              onClick={openViewDialog}
            />
            <OverflowMenuButton
              aria-label="Arrangement menu"
              onClick={() => setMenuOpen(true)}
            />
          </ControlHeaderCluster>
        }
      />
      <ObjectMenuDialog
        icon={<Ellipsis />}
        isOpen={menuOpen}
        title="Arrangement Menu"
        onClose={() => {
          setMenuOpen(false);
          setRenameOpen(false);
        }}
      >
        <DisclosureListGroup>
          <DisclosureListAction
            aria-label={`Choose view. Current: ${viewModeLabel}`}
            icon={<GalleryThumbnails />}
            label="View"
            preview={viewModeLabel}
            onClick={openViewDialog}
          />
          <InlineRenameActionItem
            ariaLabel={`Rename arrangement. Current name: ${arrangement.name}`}
            fieldLabel="Arrangement Name"
            isNameAvailable={(name) =>
              !Object.values(arrangements).some(
                (candidate) =>
                  candidate.id !== arrangementId &&
                  normalizeEntityNameForComparison(candidate.name) ===
                    normalizeEntityNameForComparison(name),
              )
            }
            isOpen={renameOpen}
            label="Rename Arrangement"
            shouldFocusInput
            value={arrangement.name}
            onClose={() => setRenameOpen(false)}
            onRename={(name) => renameArrangement(arrangementId, name)}
            onToggle={() => setRenameOpen((open) => !open)}
          />
          <DisclosureListAction
            icon={<LibraryBig />}
            label="Library"
            onClick={() => {
              setMenuOpen(false);
              setRenameOpen(false);
              onOpenLibrary();
            }}
          />
          <DisclosureListAction
            icon={<Settings2 />}
            label="Dojo Settings"
            onClick={() => {
              setMenuOpen(false);
              setRenameOpen(false);
              setSettingsOpen(true);
            }}
          />
        </DisclosureListGroup>
      </ObjectMenuDialog>
      <ObjectMenuDialog
        icon={<GalleryThumbnails />}
        isOpen={viewOpen}
        size="compact"
        title="View"
        onClose={() => setViewOpen(false)}
      >
        <DisclosureListGroup>
          <DisclosureListChoice
            aria-label="Use Arrangement view"
            icon={<PanelTopBottomDashed />}
            label="Arrangement"
            selected={viewMode === "build"}
            selectedPreviewKind="current"
            onClick={() => {
              onViewModeChange("build");
              setViewOpen(false);
            }}
          />
          <DisclosureListChoice
            aria-label="Use Chart view"
            disabled={arrangement.entries.length === 0}
            icon={<Rows3 />}
            label="Chart"
            selected={viewMode === "chart"}
            selectedPreviewKind="current"
            onClick={() => {
              onViewModeChange("chart");
              setViewOpen(false);
            }}
          />
        </DisclosureListGroup>
      </ObjectMenuDialog>
      <Dialog
        isOpen={tempoOpen}
        size="standard"
        onClose={() => setTempoOpen(false)}
      >
        <ArrangementTempoDialog
          arrangementId={arrangementId}
          onClose={() => setTempoOpen(false)}
        />
      </Dialog>
      <Dialog
        isOpen={settingsOpen}
        size="standard"
        onClose={() => setSettingsOpen(false)}
      >
        <DojoSettingsDialog onClose={() => setSettingsOpen(false)} />
      </Dialog>
    </>
  );
}
