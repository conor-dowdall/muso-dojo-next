import { BookmarkCheck, BookmarkPlus } from "lucide-react";
import { DisclosureListAction } from "@/components/ui/disclosure-list/DisclosureList";
import { type InstrumentType } from "@/types/session";

const instrumentSetupCopy = {
  fretboard: {
    label: "Fretboard Setup",
    summary: "Instrument, tuning, hand and appearance",
    target: "new fretboards",
  },
  keyboard: {
    label: "Keyboard Setup",
    summary: "Appearance",
    target: "new keyboards",
  },
} as const satisfies Record<
  InstrumentType,
  { label: string; summary: string; target: string }
>;

interface InstrumentCreationDefaultActionProps {
  instrumentType: InstrumentType;
  isRemembered: boolean;
  onRemember: () => void;
}

export function InstrumentCreationDefaultAction({
  instrumentType,
  isRemembered,
  onRemember,
}: InstrumentCreationDefaultActionProps) {
  const setupCopy = instrumentSetupCopy[instrumentType];

  return (
    <DisclosureListAction
      aria-label={
        isRemembered
          ? `${setupCopy.label} is remembered for ${setupCopy.target}`
          : `Remember ${setupCopy.label.toLowerCase()} for ${setupCopy.target}`
      }
      disabled={isRemembered}
      icon={isRemembered ? <BookmarkCheck /> : <BookmarkPlus />}
      label={
        isRemembered
          ? `${setupCopy.label} Remembered`
          : `Remember ${setupCopy.label}`
      }
      selected={isRemembered}
      subtitle={
        isRemembered ? `Used for ${setupCopy.target}` : setupCopy.summary
      }
      onClick={onRemember}
    />
  );
}
