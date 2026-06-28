"use client";

import { useState } from "react";
import {
  LibraryBig,
  Maximize2,
  Plus,
  Settings2,
  SlidersHorizontal,
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
import { PracticeBandOptionsDialog } from "./PracticeBandOptionsDialog";
import styles from "./SessionHeader.module.css";

interface SessionHeaderProps {
  onOpenAddDialog: () => void;
  onOpenSessionsDialog: () => void;
  onEnterPerformanceMode?: () => void;
}

export function SessionHeader({
  onEnterPerformanceMode,
  onOpenAddDialog,
  onOpenSessionsDialog,
}: SessionHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
  const hasActiveSession = activeSessionId !== null;

  const openSettingsDialog = () => {
    setIsMenuOpen(false);
    setDialogKey((currentKey) => currentKey + 1);
    setIsSettingsDialogOpen(true);
  };

  const closeSettingsDialog = () => setIsSettingsDialogOpen(false);
  const openSessionsDialog = () => {
    setIsMenuOpen(false);
    onOpenSessionsDialog();
  };
  const openPracticeBandOptions = () => {
    setIsMenuOpen(false);
    setIsPracticeBandOptionsOpen(true);
  };

  return (
    <>
      <ControlHeader
        className={styles.header}
        onKeyDownCapture={practiceBandTransport.shortcuts.onKeyDownCapture}
        onPointerDownCapture={
          practiceBandTransport.shortcuts.onPointerDownCapture
        }
        primary={
          <div className={styles.identity}>
            {practiceBandTransport.isActive ? (
              <Heading
                as="h1"
                className={styles.title}
                data-band-active="true"
                size="base"
              >
                <PracticeBandReadout
                  prominence="title"
                  readout={practiceBandTransport.readout}
                />
              </Heading>
            ) : (
              <Heading as="h1" className={styles.title} size="base">
                {sessionName}
              </Heading>
            )}
          </div>
        }
        actions={
          <ControlHeaderCluster aria-label="Session actions" role="group">
            <IconButton
              aria-label="Add to session"
              disabled={!hasActiveSession}
              icon={<Plus />}
              size="sm"
              variant="filled"
              onClick={onOpenAddDialog}
            />
            <PracticeBandPlayButton transport={practiceBandTransport} />
            <IconButton
              aria-label="Enter performance mode"
              disabled={!hasActiveSession || !onEnterPerformanceMode}
              icon={<Maximize2 />}
              size="sm"
              shouldYield={false}
              onClick={onEnterPerformanceMode}
            />
            <OverflowMenuButton
              aria-label="Session menu"
              onClick={() => setIsMenuOpen(true)}
            />
          </ControlHeaderCluster>
        }
      />

      <ObjectMenuDialog
        isOpen={isMenuOpen}
        title="Session Menu"
        onClose={() => setIsMenuOpen(false)}
      >
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
