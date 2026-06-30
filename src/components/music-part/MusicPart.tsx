"use client";

import {
  Children,
  type CSSProperties,
  type ReactNode,
  useId,
  useState,
} from "react";
import { Plus } from "lucide-react";
import { MusicPartHeader } from "./MusicPartHeader";
import {
  MusicPartProvider,
  useMusicPart,
  type MusicPartContextValue,
} from "./MusicPartContext";
import { MusicPartIdentity } from "./MusicPartIdentity";
import { PartModuleCreationDialog } from "@/components/part-module-creation/PartModuleCreationDialog";
import { Button } from "@/components/ui/buttons/Button";
import { Dialog } from "@/components/ui/dialog/Dialog";
import { type InstrumentCreationRangeContext } from "@/components/instrument-creation/instrumentCreationConfig";
import { type MusicPartControlProps } from "@/types/music-part";
import { type AddPartModulesHandler } from "@/types/session";
import { useControllableState } from "@/hooks/useControllableState";
import styles from "./MusicPart.module.css";

interface MusicPartProps {
  children: ReactNode;
  partId?: string;
  className?: string;
  headerClassName?: string;
  accentColor?: string;
  instrumentCreationRangeContext?: InstrumentCreationRangeContext;
  isPerformanceMode?: boolean;
  partSequenceState?: "active" | "pending";
  showHeader?: boolean;
  showReadOnlyIdentity?: boolean;
  onAddPartModules?: AddPartModulesHandler;
  onClonePart?: () => void;
  onRemovePart?: () => void;
}

type MusicPartComponentProps = MusicPartProps & MusicPartControlProps;

function MusicPartContent({
  children,
  showHeader,
  headerClassName,
  isPerformanceMode,
  showReadOnlyIdentity,
}: {
  children: ReactNode;
  showHeader: boolean;
  headerClassName?: string;
  isPerformanceMode?: boolean;
  showReadOnlyIdentity?: boolean;
}) {
  const musicPart = useMusicPart();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addDialogKey, setAddDialogKey] = useState(0);
  const hasContent = musicPart.moduleCount > 0;
  const canAddPartModules = musicPart.addPartModules !== undefined;
  const openAddDialog = () => {
    setAddDialogKey((currentKey) => currentKey + 1);
    setIsAddDialogOpen(true);
  };
  const closeAddDialog = () => setIsAddDialogOpen(false);

  return (
    <>
      {showHeader ? (
        <MusicPartHeader
          className={headerClassName}
          isPerformanceMode={isPerformanceMode}
          onOpenAddDialog={canAddPartModules ? openAddDialog : undefined}
        />
      ) : showReadOnlyIdentity ? (
        <MusicPartIdentity />
      ) : null}
      <div
        className={styles.content}
        data-empty={hasContent ? undefined : true}
      >
        {hasContent ? children : null}
        {!hasContent && canAddPartModules ? (
          <Button
            icon={<Plus />}
            label="Add to Part"
            size="md"
            variant="outline"
            onClick={openAddDialog}
          />
        ) : null}
      </div>
      {musicPart.addPartModules ? (
        <Dialog isOpen={isAddDialogOpen} onClose={closeAddDialog} size="wide">
          <PartModuleCreationDialog
            key={addDialogKey}
            instrumentCreationRangeContext={
              musicPart.instrumentCreationRangeContext
            }
            onAddPartModules={musicPart.addPartModules}
            onClose={closeAddDialog}
            title="Add to Part"
          />
        </Dialog>
      ) : null}
    </>
  );
}

export function MusicPart({
  children,
  partId: userPartId,
  className = "",
  headerClassName,
  accentColor,
  instrumentCreationRangeContext,
  isPerformanceMode = false,
  partSequenceState,
  rootNote: controlledRootNote,
  initialRootNote = "C",
  onRootNoteChange,
  noteCollectionKey: controlledNoteCollectionKey,
  initialNoteCollectionKey = "major",
  onNoteCollectionKeyChange,
  showHeader = true,
  showReadOnlyIdentity = false,
  onAddPartModules,
  onClonePart,
  onRemovePart,
}: MusicPartComponentProps) {
  const autoId = useId();
  const partId = userPartId ?? autoId;
  const moduleCount = Children.count(children);

  const [rootNote, setRootNote] = useControllableState({
    value: controlledRootNote,
    defaultValue: initialRootNote,
    onChange: onRootNoteChange,
  });
  const [noteCollectionKey, setNoteCollectionKey] = useControllableState({
    value: controlledNoteCollectionKey,
    defaultValue: initialNoteCollectionKey,
    onChange: onNoteCollectionKeyChange,
  });

  const contextValue: MusicPartContextValue = {
    partId,
    moduleCount,
    rootNote,
    noteCollectionKey,
    setRootNote,
    setNoteCollectionKey,
    instrumentCreationRangeContext,
    addPartModules: onAddPartModules,
    clonePart: onClonePart,
    removePart: onRemovePart,
  };

  return (
    <MusicPartProvider value={contextValue}>
      <div className={styles.musicPartWrapper}>
        <section
          className={`${styles.musicPart} ${className}`}
          data-part-sequence-state={partSequenceState}
          style={
            accentColor
              ? ({ "--color-accent": accentColor } as CSSProperties)
              : {}
          }
        >
          <MusicPartContent
            headerClassName={headerClassName}
            isPerformanceMode={isPerformanceMode}
            showHeader={showHeader}
            showReadOnlyIdentity={showReadOnlyIdentity}
          >
            {children}
          </MusicPartContent>
        </section>
      </div>
    </MusicPartProvider>
  );
}
