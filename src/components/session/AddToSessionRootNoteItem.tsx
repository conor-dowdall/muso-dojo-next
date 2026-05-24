"use client";

import { type ReactNode } from "react";
import { type RootNote } from "@musodojo/music-theory-data";
import { RootNotePicker } from "@/components/music-theory/RootNotePicker";
import { DisclosureListItem } from "@/components/ui/disclosure-list/DisclosureList";
import localStyles from "./AddToSessionDialog.module.css";

interface AddToSessionRootNoteItemProps {
  icon?: ReactNode;
  isOpen: boolean;
  label: string;
  selectedRootNote: RootNote;
  value: RootNote;
  onChange: (value: RootNote) => void;
  onToggle: () => void;
}

export function AddToSessionRootNoteItem({
  icon,
  isOpen,
  label,
  selectedRootNote,
  value,
  onChange,
  onToggle,
}: AddToSessionRootNoteItemProps) {
  return (
    <DisclosureListItem
      ariaLabel={`Choose ${label.toLowerCase()}, ${selectedRootNote} selected`}
      icon={icon}
      isOpen={isOpen}
      keepMounted
      label={label}
      panelVariant="menu"
      preview={selectedRootNote}
      onToggle={onToggle}
    >
      <div className={localStyles.rootPanel}>
        <RootNotePicker value={value} onChange={onChange} />
      </div>
    </DisclosureListItem>
  );
}
