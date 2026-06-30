"use client";

import { type ReactNode, useState } from "react";
import {
  LibraryBig,
  Minimize2,
  MonitorPlay,
  PanelsTopLeft,
  Plus,
  Rows3,
  Settings2,
  SlidersHorizontal,
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
import { PracticeBandOptionsDialog } from "./PracticeBandOptionsDialog";
import {
  requiresSessionParts,
  sessionViewModeCopy,
  sessionViewModes,
  type SessionViewMode,
} from "./sessionViewMode";
import styles from "./SessionHeader.module.css";

interface SessionHeaderProps {
  onOpenAddDialog: () => void;
  onOpenSessionsDialog: () => void;
  onViewModeChange: (mode: SessionViewMode) => void;
  onViewModeExit?: () => void;
  variant?: "full" | "practice";
  viewMode: SessionViewMode;
}

type SessionMenuSection = "view";

const sessionViewModeIcons = {
  session: <PanelsTopLeft />,
  band: <Rows3 />,
  "live-part": <MonitorPlay />,
  focus: <Minimize2 />,
} as const satisfies Record<SessionViewMode, ReactNode>;

export function SessionHeader({
  onOpenAddDialog,
  onOpenSessionsDialog,
  onViewModeChange,
  onViewModeExit,
  variant = "full",
  viewMode,
}: SessionHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openMenuSection, setOpenMenuSection] =
    useState<SessionMenuSection | null>(null);
  const [isPracticeBandOptionsOpen, setIsPracticeBandOptionsOpen] =
    useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const activeSessionId = useAppStore((state) => state.activeSessionId);
  const updatePracticeBandSettings = useAppStore(
    (state) => state.updatePracticeBandSettings,
  );
  const practiceBandTransport = usePracticeBandTransport(activeSessionId);
  const sessionName = useAppStore(
    (state) =>
      (activeSessionId ? state.sessions[activeSessionId]?.name : null) ??
      "No Sessions Yet",
  );
  const activeSessionPartCount = useAppStore((state) =>
    activeSessionId ? (state.sessions[activeSessionId]?.parts.length ?? 0) : 0,
  );
  const hasActiveSession = activeSessionId !== null;
  const viewModeLabel = sessionViewModeCopy[viewMode].label;
  const canUsePartViews = activeSessionPartCount > 0;
  const isPracticeHeader = variant === "practice";
  const titleText = isPracticeHeader ? viewModeLabel : sessionName;
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
  const openPracticeBandOptions = () => {
    setIsMenuOpen(false);
    setIsPracticeBandOptionsOpen(true);
  };
  const selectViewMode = (nextViewMode: SessionViewMode) => {
    setIsMenuOpen(false);
    setOpenMenuSection(null);
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
        actionsClassName={styles.headerActions}
        className={styles.header}
        data-variant={variant}
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
            {isPracticeHeader ? null : (
              <IconButton
                aria-label="Add to session"
                disabled={!hasActiveSession}
                icon={<Plus />}
                size="sm"
                variant="filled"
                onClick={onOpenAddDialog}
              />
            )}
            <PracticeBandPlayButton transport={practiceBandTransport} />
            {isPracticeHeader ? null : (
              <IconButton
                aria-label={`Session view. Current: ${viewModeLabel}`}
                disabled={!hasActiveSession}
                icon={sessionViewModeIcons[viewMode]}
                selected={viewMode !== "session"}
                size="sm"
                shouldYield={false}
                onClick={openViewSection}
              />
            )}
            {isPracticeHeader ? (
              <IconButton
                aria-label="Return to session view"
                disabled={!onViewModeExit}
                icon={<X />}
                size="sm"
                shouldYield={false}
                variant="ghost"
                onClick={onViewModeExit}
              />
            ) : (
              <OverflowMenuButton
                aria-label="Session menu"
                onClick={openSessionMenu}
              />
            )}
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
            selected={viewMode !== "session"}
            onToggle={() => toggleMenuSection("view")}
          >
            <DisclosureList density="compact">
              {sessionViewModes.map((mode) => {
                const copy = sessionViewModeCopy[mode];
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
          <DisclosureListAction
            disabled={!practiceBandTransport.canPlay}
            icon={<SlidersHorizontal />}
            label="Practice Band Options"
            onClick={openPracticeBandOptions}
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

      {activeSessionId ? (
        <PracticeBandOptionsDialog
          config={practiceBandTransport.resolvedConfig}
          isOpen={isPracticeBandOptionsOpen}
          onAudioPresetIdChange={(audioPresetId) =>
            updatePracticeBandSettings(activeSessionId, { audioPresetId })
          }
          onBackingNotesChange={(backingNotes) =>
            updatePracticeBandSettings(activeSessionId, { backingNotes })
          }
          onClose={() => setIsPracticeBandOptionsOpen(false)}
          onDrumsChange={(drums) =>
            updatePracticeBandSettings(activeSessionId, { drums })
          }
          onOctaveOffsetChange={(octaveOffset) =>
            updatePracticeBandSettings(activeSessionId, { octaveOffset })
          }
        />
      ) : null}

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
