import { type ReactNode } from "react";
import { WoodSurfaceSwatch } from "@/components/instrument/InstrumentThemeSwatch";
import {
  DisclosureList,
  DisclosureListChoice,
  DisclosureListItem,
} from "@/components/ui/disclosure-list/DisclosureList";
import {
  woodSurfaceOptions,
  woodSurfaces,
  type WoodSurfaceId,
} from "@/data/woodSurfaces";

interface WoodSurfaceChoiceListProps {
  autoLabel?: string;
  autoSelected?: boolean;
  onChange: (surfaceId: WoodSurfaceId) => void;
  onSelectAuto?: () => void;
  selectedSurfaceId?: WoodSurfaceId;
  value?: WoodSurfaceId;
}

export function WoodSurfaceChoiceList({
  autoLabel = "Auto",
  autoSelected = false,
  onChange,
  onSelectAuto,
  selectedSurfaceId,
  value,
}: WoodSurfaceChoiceListProps) {
  const selection = selectedSurfaceId ?? value;

  return (
    <DisclosureList>
      {onSelectAuto ? (
        <DisclosureListChoice
          label={autoLabel}
          selected={autoSelected}
          onClick={onSelectAuto}
        />
      ) : null}
      {woodSurfaceOptions.map((surfaceId) => (
        <DisclosureListChoice
          key={surfaceId}
          label={woodSurfaces[surfaceId].title}
          preview={<WoodSurfaceSwatch surfaceId={surfaceId} />}
          selected={surfaceId === selection}
          onClick={() => onChange(surfaceId)}
        />
      ))}
    </DisclosureList>
  );
}

interface WoodSurfaceDisclosureItemProps {
  ariaLabel?: string;
  children?: ReactNode;
  currentLabel?: string;
  icon?: ReactNode;
  isOpen: boolean;
  keepMounted?: boolean;
  onChange?: (surfaceId: WoodSurfaceId) => void;
  onToggle: () => void;
  surfaceId: WoodSurfaceId;
  subtitle?: ReactNode;
}

export function WoodSurfaceDisclosureItem({
  ariaLabel,
  children,
  currentLabel,
  icon,
  isOpen,
  keepMounted,
  onChange,
  onToggle,
  surfaceId,
  subtitle,
}: WoodSurfaceDisclosureItemProps) {
  const resolvedCurrentLabel = currentLabel ?? woodSurfaces[surfaceId].title;

  return (
    <DisclosureListItem
      ariaLabel={ariaLabel ?? `Wood. Current: ${resolvedCurrentLabel}`}
      icon={icon}
      isOpen={isOpen}
      keepMounted={keepMounted}
      label="Wood"
      preview={<WoodSurfaceSwatch surfaceId={surfaceId} />}
      subtitle={subtitle ?? resolvedCurrentLabel}
      panelVariant="menu"
      onToggle={onToggle}
    >
      {children ??
        (onChange ? (
          <WoodSurfaceChoiceList value={surfaceId} onChange={onChange} />
        ) : null)}
    </DisclosureListItem>
  );
}
