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
import { PartModuleCreationDialog } from "@/components/part-module-creation/PartModuleCreationDialog";
import { Button } from "@/components/ui/buttons/Button";
import { Dialog } from "@/components/ui/dialog/Dialog";
import {
  type MusicPartControlProps,
  type MusicPartLayout,
} from "@/types/music-part";
import { type AddPartModuleHandler } from "@/types/session";
import { useControllableState } from "@/hooks/useControllableState";
import styles from "./MusicPart.module.css";

interface MusicPartProps {
  children: ReactNode;
  partId?: string;
  className?: string;
  headerClassName?: string;
  accentColor?: string;
  layout?: MusicPartLayout;
  showHeader?: boolean;
  onAddPartModule?: AddPartModuleHandler;
  onClonePart?: () => void;
  onRemovePart?: () => void;
}

type MusicPartComponentProps = MusicPartProps & MusicPartControlProps;

function MusicPartContent({
  children,
  layout,
  showHeader,
  headerClassName,
}: {
  children: ReactNode;
  layout: MusicPartLayout;
  showHeader: boolean;
  headerClassName?: string;
}) {
  const musicPart = useMusicPart();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const hasContent = Children.count(children) > 0;
  const canAddPartModule = musicPart.addPartModule !== undefined;
  const openAddDialog = () => setIsAddDialogOpen(true);
  const closeAddDialog = () => setIsAddDialogOpen(false);

  return (
    <>
      {showHeader ? (
        <MusicPartHeader
          className={headerClassName}
          onOpenAddDialog={canAddPartModule ? openAddDialog : undefined}
        />
      ) : null}
      <div
        className={styles.content}
        data-empty={hasContent ? undefined : true}
        data-layout={layout}
      >
        {hasContent ? children : null}
        {!hasContent && canAddPartModule ? (
          <Button
            icon={<Plus />}
            label="Add to Part"
            size="md"
            variant="outline"
            onClick={openAddDialog}
          />
        ) : null}
      </div>
      {musicPart.addPartModule ? (
        <Dialog isOpen={isAddDialogOpen} onClose={closeAddDialog} size="lg">
          <PartModuleCreationDialog
            onAddPartModule={musicPart.addPartModule}
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
  layout = "column",
  rootNote: controlledRootNote,
  initialRootNote = "C",
  onRootNoteChange,
  noteCollectionKey: controlledNoteCollectionKey,
  initialNoteCollectionKey = "major",
  onNoteCollectionKeyChange,
  showHeader = true,
  onAddPartModule,
  onClonePart,
  onRemovePart,
}: MusicPartComponentProps) {
  const autoId = useId();
  const partId = userPartId ?? autoId;

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
    rootNote,
    noteCollectionKey,
    setRootNote,
    setNoteCollectionKey,
    addPartModule: onAddPartModule,
    clonePart: onClonePart,
    removePart: onRemovePart,
  };

  return (
    <MusicPartProvider value={contextValue}>
      <div className={styles.musicPartWrapper}>
        <section
          className={`${styles.musicPart} ${className}`}
          style={
            accentColor
              ? ({ "--color-accent": accentColor } as CSSProperties)
              : {}
          }
        >
          <MusicPartContent
            headerClassName={headerClassName}
            layout={layout}
            showHeader={showHeader}
          >
            {children}
          </MusicPartContent>
        </section>
      </div>
    </MusicPartProvider>
  );
}
