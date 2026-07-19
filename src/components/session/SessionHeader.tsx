"use client";

import { useState } from "react";
import {
  Gauge,
  GalleryThumbnails,
  Disc3,
  Ellipsis,
  LibraryBig,
  Plus,
  Settings2,
  X,
} from "lucide-react";
import { Heading } from "@/components/ui/typography/Heading";
import { IconButton } from "@/components/ui/buttons/IconButton";
import {
  ControlHeader,
  ControlHeaderCluster,
} from "@/components/ui/control-header/ControlHeader";
import { Dialog } from "@/components/ui/dialog/Dialog";
import { DojoSettingsDialog } from "@/components/dojo-settings/DojoSettingsDialog";
import { type AppStore, useAppStore } from "@/stores/appStore";
import {
  DisclosureListAction,
  DisclosureListGroup,
} from "@/components/ui/disclosure-list/DisclosureList";
import {
  ObjectMenuDialog,
  OverflowMenuButton,
} from "@/components/ui/object-menu";
import {
  PracticeBandPlayButton,
  PracticeBandReadout,
  usePracticeBandTransport,
} from "./PracticeBandTransport";
import {
  isSessionFocusViewMode,
  sessionViewModeConfig,
  type SessionViewMode,
  type SessionWorkspaceViewMode,
} from "./sessionViewMode";
import styles from "./SessionHeader.module.css";
import { SessionBackingBandDialog } from "./SessionBackingBandDialog";
import { SessionViewDialog } from "./SessionViewDialog";
import { SessionRenameActionItem } from "./SessionRenameActionItem";

interface SessionHeaderProps {
  onOpenAddDialog: () => void;
  onOpenSessionTempo: (sessionId: string) => void;
  onOpenSessionsDialog: () => void;
  onViewModeChange: (mode: SessionViewMode) => void;
  onViewModeExit?: () => void;
  viewMode: SessionViewMode;
  workspaceViewMode: SessionWorkspaceViewMode;
  viewModeTransitionPending?: boolean;
}

type SessionMenuSection = "rename";

type SessionNameSummary = {
  id: string;
  name: string;
};

function createSessionNameSummariesSelector() {
  let previousSummaries: readonly SessionNameSummary[] | undefined;

  return (state: AppStore): readonly SessionNameSummary[] => {
    const sessions = Object.values(state.sessions);

    if (
      previousSummaries?.length === sessions.length &&
      sessions.every(
        (session, index) =>
          previousSummaries?.[index]?.id === session.id &&
          previousSummaries[index]?.name === session.name,
      )
    ) {
      return previousSummaries;
    }

    previousSummaries = sessions.map(({ id, name }) => ({ id, name }));
    return previousSummaries;
  };
}

const selectSessionNameSummaries = createSessionNameSummariesSelector();

export function SessionHeader({
  onOpenAddDialog,
  onOpenSessionTempo,
  onOpenSessionsDialog,
  onViewModeChange,
  onViewModeExit,
  viewMode,
  workspaceViewMode,
  viewModeTransitionPending = false,
}: SessionHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openMenuSection, setOpenMenuSection] =
    useState<SessionMenuSection | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isBackingBandDialogOpen, setIsBackingBandDialogOpen] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const activeSessionId = useAppStore((state) => state.activeSessionId);
  const sessionNameSummaries = useAppStore(selectSessionNameSummaries);
  const renameSession = useAppStore((state) => state.renameSession);
  const practiceBandTransport = usePracticeBandTransport(activeSessionId);
  const sessionName = useAppStore(
    (state) =>
      (activeSessionId ? state.sessions[activeSessionId]?.name : null) ??
      "No Sessions Yet",
  );
  const activeSessionTempoBpm = useAppStore((state) =>
    activeSessionId ? (state.sessions[activeSessionId]?.tempoBpm ?? 80) : 80,
  );
  const activeSessionPartCount = useAppStore((state) =>
    activeSessionId ? (state.sessions[activeSessionId]?.parts.length ?? 0) : 0,
  );
  const hasActiveSession = activeSessionId !== null;
  const activeSessionNameSummary = activeSessionId
    ? sessionNameSummaries.find((session) => session.id === activeSessionId)
    : undefined;
  const viewModeLabel = sessionViewModeConfig[viewMode].label;
  const workspaceViewModeLabel = sessionViewModeConfig[workspaceViewMode].label;
  const canUsePartViews = activeSessionPartCount > 0;
  const isFocusHeader = isSessionFocusViewMode(viewMode);
  const isAlternateView = viewMode !== "session";
  const titleText = isFocusHeader ? viewModeLabel : sessionName;
  const titleReadout = practiceBandTransport.isActive
    ? practiceBandTransport.readout
    : null;

  const openSettingsDialog = () => {
    setIsMenuOpen(false);
    setOpenMenuSection(null);
    setDialogKey((currentKey) => currentKey + 1);
    setIsSettingsDialogOpen(true);
  };

  const closeSettingsDialog = () => setIsSettingsDialogOpen(false);
  const openSessionMenu = () => {
    setIsViewDialogOpen(false);
    setOpenMenuSection(null);
    setIsMenuOpen(true);
  };
  const openViewDialog = () => {
    setIsMenuOpen(false);
    setOpenMenuSection(null);
    setIsViewDialogOpen(true);
  };
  const openSessionsDialog = () => {
    setIsMenuOpen(false);
    setOpenMenuSection(null);
    onOpenSessionsDialog();
  };
  const openSessionTempo = () => {
    if (!activeSessionId) {
      return;
    }

    onOpenSessionTempo(activeSessionId);
  };
  const selectViewMode = (nextViewMode: SessionViewMode) => {
    setIsMenuOpen(false);
    setIsViewDialogOpen(false);
    setOpenMenuSection(null);

    if (nextViewMode === viewMode) {
      return;
    }

    onViewModeChange(nextViewMode);
  };
  const toggleMenuSection = (section: SessionMenuSection) => {
    setOpenMenuSection((currentSection) =>
      currentSection === section ? null : section,
    );
  };

  return (
    <>
      <ControlHeader
        aria-busy={viewModeTransitionPending}
        actionsClassName={styles.headerActions}
        className={styles.header}
        data-view-transition-pending={
          viewModeTransitionPending ? true : undefined
        }
        onKeyDownCapture={practiceBandTransport.shortcuts.onKeyDownCapture}
        onPointerDownCapture={
          practiceBandTransport.shortcuts.onPointerDownCapture
        }
        primaryClassName={styles.headerPrimary}
        primary={
          <div className={styles.identity}>
            <Heading
              as="h1"
              className={styles.title}
              data-content={titleReadout ? "readout" : "text"}
              size="base"
            >
              {titleReadout ? (
                <PracticeBandReadout
                  prominence="title"
                  readout={titleReadout}
                />
              ) : (
                <span className={styles.titleText}>{titleText}</span>
              )}
            </Heading>
          </div>
        }
        actions={
          <ControlHeaderCluster aria-label="Session actions" role="group">
            {isFocusHeader ? null : (
              <IconButton
                aria-label="Add to session"
                disabled={!hasActiveSession || viewModeTransitionPending}
                icon={<Plus />}
                size="sm"
                onClick={onOpenAddDialog}
              />
            )}
            <PracticeBandPlayButton transport={practiceBandTransport} />
            <IconButton
              aria-label="Session Backing Band"
              disabled={!hasActiveSession}
              icon={<Disc3 />}
              size="sm"
              shouldYield={false}
              onClick={() => setIsBackingBandDialogOpen(true)}
            />
            <IconButton
              aria-label={`Set session tempo. Current tempo: ${activeSessionTempoBpm} bpm`}
              disabled={!hasActiveSession}
              icon={<Gauge />}
              size="sm"
              shouldYield={false}
              onClick={openSessionTempo}
            />
            <IconButton
              aria-label={`Choose view. Current: ${viewModeLabel}`}
              disabled={!hasActiveSession || viewModeTransitionPending}
              icon={<GalleryThumbnails />}
              selected={isAlternateView}
              size="sm"
              shouldYield={false}
              onClick={openViewDialog}
            />
            {isFocusHeader ? null : (
              <OverflowMenuButton
                aria-label="Menu"
                disabled={viewModeTransitionPending}
                onClick={openSessionMenu}
              />
            )}
            {isFocusHeader ? (
              <IconButton
                aria-label={`Return to ${workspaceViewModeLabel} view`}
                aria-keyshortcuts="Escape"
                disabled={!onViewModeExit || viewModeTransitionPending}
                icon={<X />}
                size="sm"
                shouldYield={false}
                onClick={onViewModeExit}
              />
            ) : null}
          </ControlHeaderCluster>
        }
      />

      <ObjectMenuDialog
        icon={<Ellipsis />}
        isOpen={isMenuOpen}
        title="Menu"
        onClose={() => setIsMenuOpen(false)}
      >
        <DisclosureListGroup>
          <DisclosureListAction
            aria-label={`Choose view. Current: ${viewModeLabel}`}
            disabled={!hasActiveSession || viewModeTransitionPending}
            icon={<GalleryThumbnails />}
            label="View"
            preview={viewModeLabel}
            onClick={openViewDialog}
          />
          {activeSessionNameSummary ? (
            <SessionRenameActionItem
              isOpen={openMenuSection === "rename"}
              label="Rename Session"
              session={activeSessionNameSummary}
              sessions={sessionNameSummaries}
              shouldFocusInput
              onClose={() => setOpenMenuSection(null)}
              onRenameSession={renameSession}
              onToggle={() => toggleMenuSection("rename")}
            />
          ) : null}
          <DisclosureListAction
            icon={<LibraryBig />}
            label="Session Library"
            onClick={openSessionsDialog}
          />
          <DisclosureListAction
            icon={<Settings2 />}
            label="Dojo Settings"
            onClick={openSettingsDialog}
          />
        </DisclosureListGroup>
      </ObjectMenuDialog>

      <SessionViewDialog
        canUsePartViews={canUsePartViews}
        isOpen={isViewDialogOpen}
        viewMode={viewMode}
        onClose={() => setIsViewDialogOpen(false)}
        onSelect={selectViewMode}
      />

      <Dialog
        isOpen={isSettingsDialogOpen}
        onClose={closeSettingsDialog}
        size="standard"
      >
        <DojoSettingsDialog key={dialogKey} onClose={closeSettingsDialog} />
      </Dialog>
      {activeSessionId ? (
        <SessionBackingBandDialog
          isOpen={isBackingBandDialogOpen}
          sessionId={activeSessionId}
          onClose={() => setIsBackingBandDialogOpen(false)}
        />
      ) : null}
    </>
  );
}
