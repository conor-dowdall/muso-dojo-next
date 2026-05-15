"use client";

import { DisclosureListGroup } from "@/components/ui/disclosure-list/DisclosureList";
import {
  PartModuleCreationSettingsMenu,
  type PartModuleCreationSettingsMenuProps,
} from "@/components/part-module-creation/PartModuleCreationSettingsMenu";

export type AddToSessionModuleSettingsProps =
  PartModuleCreationSettingsMenuProps & {
    closeSignal: number;
    onChoiceOpen: () => void;
  };

export function AddToSessionModuleSettings(
  props: AddToSessionModuleSettingsProps,
) {
  return (
    <DisclosureListGroup aria-label="Module settings">
      <PartModuleCreationSettingsMenu {...props} />
    </DisclosureListGroup>
  );
}
