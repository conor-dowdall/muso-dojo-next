"use client";

import { Gauge } from "lucide-react";
import { DisclosureListActionItem } from "@/components/ui/disclosure-list/DisclosureList";
import { SessionTempoEditor } from "@/components/session/SessionTempoEditor";

export function TempoActionItem({
  entityKind,
  item,
  isOpen,
  onTempoBpmChange,
  onToggle,
}: {
  entityKind: "arrangement" | "session";
  item: {
    id: string;
    name: string;
    tempoBpm: number;
  };
  isOpen: boolean;
  onTempoBpmChange: (id: string, tempoBpm: number) => void;
  onToggle: () => void;
}) {
  return (
    <DisclosureListActionItem
      ariaLabel={`Set tempo for ${item.name} ${entityKind}. Current: ${item.tempoBpm} bpm`}
      icon={<Gauge />}
      isOpen={isOpen}
      keepMounted
      label="Set Tempo"
      preview={`${item.tempoBpm} bpm`}
      onToggle={onToggle}
    >
      <SessionTempoEditor
        label={`Tempo (BPM) for ${item.name}`}
        tempoBpm={item.tempoBpm}
        onTempoBpmChange={(tempoBpm) => onTempoBpmChange(item.id, tempoBpm)}
      />
    </DisclosureListActionItem>
  );
}
