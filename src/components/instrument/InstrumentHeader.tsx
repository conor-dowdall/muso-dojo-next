import { type ReactNode } from "react";
import { ControlHeader } from "@/components/ui/control-header/ControlHeader";

interface InstrumentHeaderProps {
  displayControls?: ReactNode;
  children?: ReactNode;
}

export function InstrumentHeader({
  displayControls,
  children,
}: InstrumentHeaderProps) {
  if (!displayControls && !children) return null;

  return (
    <ControlHeader
      actions={children}
      actionsGrow
      primary={displayControls}
    />
  );
}
