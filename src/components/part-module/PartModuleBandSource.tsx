"use client";

import { RadioTower } from "lucide-react";
import {
  DisclosureListChoice,
  DisclosureListGroup,
} from "@/components/ui/disclosure-list/DisclosureList";

export function PartModuleBandBadge() {
  return <span className="app-status-badge">Band</span>;
}

export function PartModuleBandSourceChoice({
  isBandSource,
  onUseInBand,
  roleLabel,
}: {
  isBandSource: boolean;
  onUseInBand?: () => void;
  roleLabel: string;
}) {
  if (!onUseInBand) {
    return null;
  }

  return (
    <DisclosureListGroup>
      <DisclosureListChoice
        aria-label={`Use this module as the Practice Band ${roleLabel}`}
        icon={<RadioTower />}
        label="Use in Practice Band"
        selected={isBandSource}
        selectedPreviewKind="current"
        subtitle={`Use this module for ${roleLabel}`}
        onClick={onUseInBand}
      />
    </DisclosureListGroup>
  );
}
