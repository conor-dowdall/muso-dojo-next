import { type CSSProperties, type ReactNode } from "react";
import { type InstrumentNoteEmphasis } from "@/types/instrument-note-emphasis";
import { type InstrumentWidthMode } from "@/types/instrument-layout";
import { ControlHeader } from "@/components/ui/control-header/ControlHeader";
import styles from "./PartModuleFrame.module.css";

interface PartModuleFrameProps {
  bodyClassName?: string;
  children: ReactNode;
  className?: string;
  headerActions?: ReactNode;
  headerActionsGrow?: boolean;
  headerPrimary?: ReactNode;
  noteEmphasis?: InstrumentNoteEmphasis;
  showHeader?: boolean;
  style?: CSSProperties;
  widthMode?: InstrumentWidthMode;
}

/**
 * Shared framed surface for Part modules. Instruments, Drone, and future
 * modules should use this frame so module-level headers and bodies keep one
 * visual language while their interiors stay domain-specific.
 */
export function PartModuleFrame({
  bodyClassName = "",
  children,
  className = "",
  headerActions,
  headerActionsGrow = false,
  headerPrimary,
  noteEmphasis,
  showHeader = true,
  style,
  widthMode = "auto",
}: PartModuleFrameProps) {
  return (
    <div
      className={`${styles.partModuleFrame} ${className}`}
      style={style}
      data-width-mode={widthMode}
      data-note-emphasis={noteEmphasis}
    >
      {showHeader && (headerPrimary || headerActions) ? (
        <ControlHeader
          actions={headerActions}
          actionsGrow={headerActionsGrow}
          primary={headerPrimary}
        />
      ) : null}
      <div className={styles.scrollArea}>
        <div className={`${styles.content} ${bodyClassName}`}>{children}</div>
      </div>
    </div>
  );
}
