import { type ReactNode, type CSSProperties } from "react";
import { PartModuleFrame } from "@/components/part-module/PartModuleFrame";
import { type InstrumentNoteEmphasis } from "@/types/instrument-note-emphasis";
import {
  type InstrumentIntrinsicSizing,
  type InstrumentLayoutConfig,
} from "@/types/instrument-layout";
import { resolveInstrumentLayout } from "@/utils/instrument/resolveInstrumentLayout";

interface InstrumentContainerProps {
  displayControls?: ReactNode;
  headerActions?: ReactNode;
  children: ReactNode;
  showHeader?: boolean;
  className?: string;
  bodyClassName?: string;
  style?: CSSProperties;
  noteEmphasis?: InstrumentNoteEmphasis;
  sizing?: InstrumentIntrinsicSizing;
  layout?: InstrumentLayoutConfig;
}

/**
 * Shared container for all instruments (Fretboard, Keyboard, etc.)
 * Standardizes the relationship between the instrument header and the body.
 */
export function InstrumentContainer({
  displayControls,
  headerActions,
  children,
  showHeader = true,
  className = "",
  bodyClassName = "",
  style,
  noteEmphasis,
  sizing,
  layout,
}: InstrumentContainerProps) {
  const resolvedLayout = resolveInstrumentLayout(sizing, layout);

  return (
    <PartModuleFrame
      bodyClassName={bodyClassName}
      className={className}
      headerActions={headerActions}
      headerActionsGrow
      headerPrimary={displayControls}
      noteEmphasis={noteEmphasis}
      showHeader={showHeader}
      style={{ ...resolvedLayout.style, ...style }}
      widthMode={resolvedLayout.widthMode}
    >
      {children}
    </PartModuleFrame>
  );
}
