"use client";

import { useMemo, useState } from "react";
import {
  Ellipsis,
  Gauge,
  LibraryBig,
  ListVideo,
  Plus,
  Repeat2,
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
  DisclosureListAction,
  DisclosureListGroup,
} from "@/components/ui/disclosure-list/DisclosureList";
import { InlineRenameActionItem } from "@/components/ui/inline-rename/InlineRenameActionItem";
import { Dialog } from "@/components/ui/dialog/Dialog";
import { DojoSettingsDialog } from "@/components/dojo-settings/DojoSettingsDialog";
import { useAppStore } from "@/stores/appStore";
import { normalizeEntityNameForComparison } from "@/stores/app-store/entityIds";
import { type useArrangementTransport } from "@/hooks/audio/useArrangementTransport";
import { ArrangementTempoDialog } from "./ArrangementTempoDialog";
import styles from "./ArrangementWorkspace.module.css";

export function ArrangementHeader({
  arrangementId,
  onOpenAddSection,
  onOpenLibrary,
  transport,
}: {
  arrangementId: string;
  onOpenAddSection: () => void;
  onOpenLibrary: () => void;
  transport: ReturnType<typeof useArrangementTransport>;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [tempoOpen, setTempoOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const arrangement = useAppStore((state) => state.arrangements[arrangementId]);
  const arrangementRecord = useAppStore((state) => state.arrangements);
  const arrangements = useMemo(
    () => Object.values(arrangementRecord),
    [arrangementRecord],
  );
  const renameArrangement = useAppStore((state) => state.renameArrangement);
  const setPlaybackMode = useAppStore(
    (state) => state.setArrangementPlaybackMode,
  );
  if (!arrangement) return null;

  return (
    <>
      <ControlHeader
        className={styles.header}
        onKeyDownCapture={transport.shortcuts.onKeyDownCapture}
        onPointerDownCapture={transport.shortcuts.onPointerDownCapture}
        primary={
          <Heading as="h1" className={styles.headerTitle} size="base">
            {arrangement.name}
            {transport.readout ? (
              <span className={styles.headerReadout}>
                {" "}
                · {transport.readout}
              </span>
            ) : null}
          </Heading>
        }
        actions={
          <ControlHeaderCluster aria-label="Arrangement actions" role="group">
            <IconButton
              aria-label="Add Section"
              icon={<Plus />}
              size="sm"
              onClick={onOpenAddSection}
            />
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
        onClose={() => setMenuOpen(false)}
      >
        <DisclosureListGroup>
          <InlineRenameActionItem
            ariaLabel={`Rename ${arrangement.name} arrangement`}
            fieldLabel="Arrangement name"
            isNameAvailable={(name) =>
              !arrangements.some(
                (candidate) =>
                  candidate.id !== arrangementId &&
                  normalizeEntityNameForComparison(candidate.name) ===
                    normalizeEntityNameForComparison(name),
              )
            }
            isOpen={renameOpen}
            label="Rename Arrangement"
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
              onOpenLibrary();
            }}
          />
          <DisclosureListAction
            icon={<Settings2 />}
            label="Dojo Settings"
            onClick={() => {
              setMenuOpen(false);
              setSettingsOpen(true);
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
