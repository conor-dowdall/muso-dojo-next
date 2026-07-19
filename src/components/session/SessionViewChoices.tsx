"use client";

import { type ReactNode } from "react";
import { MonitorPlay, PanelTop, PanelsTopLeft, Rows3 } from "lucide-react";
import {
  DisclosureList,
  DisclosureListChoice,
} from "@/components/ui/disclosure-list/DisclosureList";
import {
  requiresSessionParts,
  sessionViewModeConfig,
  sessionViewModes,
  type SessionViewMode,
} from "./sessionViewMode";

const sessionViewModeIcons = {
  session: <PanelsTopLeft />,
  chart: <Rows3 />,
  live: <MonitorPlay />,
  clean: <PanelTop />,
} as const satisfies Record<SessionViewMode, ReactNode>;

export function SessionViewChoices({
  canUsePartViews,
  onSelect,
  viewMode,
}: {
  canUsePartViews: boolean;
  onSelect: (mode: SessionViewMode) => void;
  viewMode: SessionViewMode;
}) {
  return (
    <DisclosureList aria-label="Views" density="compact">
      {sessionViewModes.map((mode) => {
        const copy = sessionViewModeConfig[mode];
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
            onClick={() => onSelect(mode)}
          />
        );
      })}
    </DisclosureList>
  );
}
