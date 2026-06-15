"use client";

import { Gauge } from "lucide-react";
import { DisclosureListActionItem } from "@/components/ui/disclosure-list/DisclosureList";
import { SessionTempoEditor } from "./SessionTempoEditor";

export function SessionTempoActionItem({
  isOpen,
  onTempoBpmChange,
  onToggle,
  session,
  shouldFocusInput = false,
}: {
  isOpen: boolean;
  onTempoBpmChange: (sessionId: string, tempoBpm: number) => void;
  onToggle: () => void;
  shouldFocusInput?: boolean;
  session: {
    id: string;
    name: string;
    tempoBpm: number;
  };
}) {
  return (
    <DisclosureListActionItem
      ariaLabel={`Set tempo for ${session.name}. Current: ${session.tempoBpm} bpm`}
      icon={<Gauge />}
      isOpen={isOpen}
      keepMounted
      label="Set Tempo"
      preview={`${session.tempoBpm} bpm`}
      onToggle={onToggle}
    >
      <SessionTempoEditor
        label={`Tempo for ${session.name}`}
        shouldFocusInput={shouldFocusInput}
        tempoBpm={session.tempoBpm}
        onTempoBpmChange={(tempoBpm) => onTempoBpmChange(session.id, tempoBpm)}
      />
    </DisclosureListActionItem>
  );
}
