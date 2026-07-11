"use client";

import { type ReactNode, useState } from "react";
import {
  Gauge,
  LibraryBig,
  Minimize2,
  MonitorPlay,
  PanelsTopLeft,
  Plus,
  Rows3,
  Settings2,
  View,
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
import { useAppStore } from "@/stores/appStore";
import {
  DisclosureList,
  DisclosureListAction,
  DisclosureListActionItem,
  DisclosureListChoice,
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
  requiresSessionParts,
  sessionViewModeConfig,
  sessionViewModes,
  type SessionViewMode,
} from "./sessionViewMode";
import styles from "./SessionHeader.module.css";

interface SessionHeaderProps {
  onOpenAddDialog: () => void;
  onOpenSessionTempo: (sessionId: string) => void;
  onOpenSessionsDialog: () => void;
  onViewModeChange: (mode: SessionViewMode) => void;
  onViewModeExit?: () => void;
  viewMode: SessionViewMode;
  viewModeTransitionPending?: boolean;
}

type SessionMenuSection = "view";

const sessionViewModeIcons = {
  session: <PanelsTopLeft />,
  chart: <Rows3 />,
  live: <MonitorPlay />,
  clean: <Minimize2 />,
} as const satisfies Record<SessionViewMode, ReactNode>;

export function SessionHeader({
  onOpenAddDialog,
  onOpenSessionTempo,
  onOpenSessionsDialog,
  onViewModeChange,
  onViewModeExit,
  viewMode,
  viewModeTransitionPending = false,
}: SessionHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openMenuSection, setOpenMenuSection] =
    useState<SessionMenuSection | null>(null);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const activeSessionId = useAppStore((state) => state.activeSessionId);
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
  const viewModeLabel = sessionViewModeConfig[viewMode].label;
  const canUsePartViews = activeSessionPartCount > 0;
  const isFocusHeader = isSessionFocusViewMode(viewMode);
  const isAlternateView = viewMode !== "session";
  const titleText = isFocusHeader ? viewModeLabel : sessionName;
  const titleReadout = practiceBandTransport.isActive
    ? practiceBandTransport.readout
    : null;

  const openSettingsDialog = () => {
    setIsMenuOpen(false);
    setDialogKey((currentKey) => currentKey + 1);
    setIsSettingsDialogOpen(true);
  };

  const closeSettingsDialog = () => setIsSettingsDialogOpen(false);
  const openSessionMenu = () => {
    setOpenMenuSection(null);
    setIsMenuOpen(true);
  };
  const openViewSection = () => {
    setOpenMenuSection("view");
    setIsMenuOpen(true);
  };
  const openSessionsDialog = () => {
    setIsMenuOpen(false);
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
              title={titleReadout ? undefined : titleText}
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
              aria-label={`Set session tempo. Current tempo: ${activeSessionTempoBpm} bpm`}
              disabled={!hasActiveSession}
              icon={<Gauge />}
              size="sm"
              shouldYield={false}
              onClick={openSessionTempo}
            />
            <IconButton
              aria-label={`Session view. Current: ${viewModeLabel}`}
              disabled={!hasActiveSession || viewModeTransitionPending}
              icon={<View />}
              selected={isAlternateView}
              size="sm"
              shouldYield={false}
              onClick={openViewSection}
            />
            {isFocusHeader ? null : (
              <OverflowMenuButton
                aria-label="Session menu"
                disabled={viewModeTransitionPending}
                onClick={openSessionMenu}
              />
            )}
            {isFocusHeader ? (
              <IconButton
                aria-label="Close focus view"
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
        isOpen={isMenuOpen}
        title="Session Menu"
        onClose={() => setIsMenuOpen(false)}
      >
        <DisclosureListGroup>
          <DisclosureListActionItem
            ariaLabel={`Choose session view. Current: ${viewModeLabel}`}
            icon={<View />}
            isOpen={openMenuSection === "view"}
            label="View"
            panelVariant="menu"
            preview={viewModeLabel}
            selected={isAlternateView}
            onToggle={() => toggleMenuSection("view")}
          >
            <DisclosureList density="compact">
              {sessionViewModes.map((mode) => {
                const copy = sessionViewModeConfig[mode];
                const disabled = requiresSessionParts(mode) && !canUsePartViews;

                return (
                  <DisclosureListChoice
                    key={mode}
                    aria-label={`Use ${copy.label} view`}
                    disabled={disabled}
                    icon={sessionViewModeIcons[mode]}
                    label={copy.label}
                    selected={mode === viewMode}
                    selectedPreviewKind="current"
                    onClick={() => selectViewMode(mode)}
                  />
                );
              })}
            </DisclosureList>
          </DisclosureListActionItem>
        </DisclosureListGroup>

        <DisclosureListGroup>
          <DisclosureListAction
            icon={<LibraryBig />}
            label="Session Library"
            onClick={openSessionsDialog}
          />
        </DisclosureListGroup>
        <DisclosureListGroup>
          <DisclosureListAction
            icon={<Settings2 />}
            label="Dojo Settings"
            onClick={openSettingsDialog}
          />
        </DisclosureListGroup>
      </ObjectMenuDialog>

      <Dialog
        isOpen={isSettingsDialogOpen}
        onClose={closeSettingsDialog}
        size="standard"
      >
        <DojoSettingsDialog key={dialogKey} onClose={closeSettingsDialog} />
      </Dialog>
    </>
  );
}
