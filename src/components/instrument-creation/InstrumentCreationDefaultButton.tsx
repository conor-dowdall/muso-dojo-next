import { Button } from "@/components/ui/buttons/Button";
import { type InstrumentType } from "@/types/session";

const instrumentSetupCopy = {
  fretboard: {
    label: "Fretboard Setup",
    target: "new fretboards",
  },
  keyboard: {
    label: "Keyboard Setup",
    target: "new keyboards",
  },
} as const satisfies Record<InstrumentType, { label: string; target: string }>;

interface InstrumentCreationDefaultButtonProps {
  instrumentType: InstrumentType;
  isRemembered: boolean;
  onRemember: () => void;
}

export function InstrumentCreationDefaultButton({
  instrumentType,
  isRemembered,
  onRemember,
}: InstrumentCreationDefaultButtonProps) {
  const setupCopy = instrumentSetupCopy[instrumentType];

  return (
    <Button
      aria-label={
        isRemembered
          ? `${setupCopy.label} is remembered for ${setupCopy.target}`
          : `Remember ${setupCopy.label.toLowerCase()} for ${setupCopy.target}`
      }
      disabled={isRemembered}
      label={
        isRemembered
          ? `${setupCopy.label} Remembered`
          : `Remember ${setupCopy.label}`
      }
      size="lg"
      variant="ghost"
      onClick={onRemember}
    />
  );
}
