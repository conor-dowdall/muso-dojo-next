"use client";

import { type CSSProperties, type ReactNode, useId } from "react";
import { MusicGroupHeader } from "./MusicGroupHeader";
import {
  MusicGroupProvider,
  type MusicGroupContextValue,
} from "./MusicGroupContext";
import {
  type MusicGroupControlProps,
  type MusicGroupLayout,
} from "@/types/music-group";
import { type AddInstrumentHandler } from "@/types/workspace";
import { useControllableState } from "@/hooks/useControllableState";
import styles from "./MusicGroup.module.css";

interface MusicGroupProps {
  children: ReactNode;
  groupId?: string;
  className?: string;
  headerClassName?: string;
  accentColor?: string;
  layout?: MusicGroupLayout;
  showHeader?: boolean;
  onAddInstrument?: AddInstrumentHandler;
  onCloneGroup?: () => void;
  onRemoveGroup?: () => void;
}

type MusicGroupComponentProps = MusicGroupProps & MusicGroupControlProps;

function MusicGroupContent({
  children,
  layout,
  showHeader,
  headerClassName,
}: {
  children: ReactNode;
  layout: MusicGroupLayout;
  showHeader: boolean;
  headerClassName?: string;
}) {
  return (
    <>
      {showHeader ? <MusicGroupHeader className={headerClassName} /> : null}
      <div className={styles.content} data-layout={layout}>
        {children}
      </div>
    </>
  );
}

export function MusicGroup({
  children,
  groupId: userGroupId,
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
  onAddInstrument,
  onCloneGroup,
  onRemoveGroup,
}: MusicGroupComponentProps) {
  const autoId = useId();
  const groupId = userGroupId ?? autoId;

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

  const contextValue: MusicGroupContextValue = {
    groupId,
    rootNote,
    noteCollectionKey,
    setRootNote,
    setNoteCollectionKey,
    addInstrument: onAddInstrument,
    cloneGroup: onCloneGroup,
    removeGroup: onRemoveGroup,
  };

  return (
    <MusicGroupProvider value={contextValue}>
      <div className={styles.musicGroupWrapper}>
        <section
          className={`${styles.musicGroup} ${className}`}
          style={
            accentColor
              ? ({ "--color-accent": accentColor } as CSSProperties)
              : {}
          }
        >
          <MusicGroupContent
            headerClassName={headerClassName}
            layout={layout}
            showHeader={showHeader}
          >
            {children}
          </MusicGroupContent>
        </section>
      </div>
    </MusicGroupProvider>
  );
}
