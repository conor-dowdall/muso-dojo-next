import { BookmarkCheck, BookmarkPlus } from "lucide-react";
import { DisclosureListAction } from "@/components/ui/disclosure-list/DisclosureList";
import { type InstrumentType } from "@/types/session";

const instrumentSetupCopy = {
  fretboard: {
    label: "Fretboard Setup",
    instrumentLabel: "fretboard",
  },
  keyboard: {
    label: "Keyboard Setup",
    instrumentLabel: "keyboard",
  },
} as const satisfies Record<
  InstrumentType,
  { label: string; instrumentLabel: string }
>;

interface InstrumentCreationDefaultActionProps {
  instrumentType: InstrumentType;
  isDefault: boolean;
  onRemember: () => void;
}

export function InstrumentCreationDefaultAction({
  instrumentType,
  isDefault,
  onRemember,
}: InstrumentCreationDefaultActionProps) {
  const setupCopy = instrumentSetupCopy[instrumentType];

  return (
    <DisclosureListAction
      aria-label={
        isDefault
          ? `This ${setupCopy.instrumentLabel} setup is the default for new instruments`
          : `Remember this ${setupCopy.instrumentLabel} setup for new instruments`
      }
      disabled={isDefault}
      icon={isDefault ? <BookmarkCheck /> : <BookmarkPlus />}
      label={
        isDefault ? "Default Instrument Setup" : `Remember ${setupCopy.label}`
      }
      selected={isDefault}
      subtitle={
        isDefault ? "Used for new instruments" : "Use this for new instruments"
      }
      onClick={onRemember}
    />
  );
}
