import { WoodSurfaceSwatch } from "@/components/instrument/InstrumentThemeSwatch";
import {
  DisclosureList,
  DisclosureListChoice,
} from "@/components/ui/disclosure-list/DisclosureList";
import {
  woodSurfaceOptions,
  woodSurfaces,
  type WoodSurfaceId,
} from "@/data/woodSurfaces";

interface WoodSurfaceChoiceListProps {
  onChange: (surfaceId: WoodSurfaceId) => void;
  value: WoodSurfaceId;
}

export function WoodSurfaceChoiceList({
  onChange,
  value,
}: WoodSurfaceChoiceListProps) {
  return (
    <DisclosureList>
      {woodSurfaceOptions.map((surfaceId) => (
        <DisclosureListChoice
          key={surfaceId}
          label={woodSurfaces[surfaceId].title}
          preview={<WoodSurfaceSwatch surfaceId={surfaceId} />}
          selected={surfaceId === value}
          onClick={() => onChange(surfaceId)}
        />
      ))}
    </DisclosureList>
  );
}
