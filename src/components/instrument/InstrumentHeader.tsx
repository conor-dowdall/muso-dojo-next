import { type ReactNode } from "react";
import styles from "./InstrumentHeader.module.css";
import { Heading } from "../ui/typography/Heading";

interface InstrumentHeaderProps {
  displayFormatButton?: ReactNode;
  children?: ReactNode;
}

export function InstrumentHeader({
  displayFormatButton,
  children,
}: InstrumentHeaderProps) {
  if (!displayFormatButton && !children) return null;

  return (
    <header className={styles.instrumentHeader}>
      {displayFormatButton ? (
        <Heading as="h3" className={styles.titleWrapper}>
          {displayFormatButton}
        </Heading>
      ) : null}
      <div className={styles.actionsWrapper}>{children}</div>
    </header>
  );
}
