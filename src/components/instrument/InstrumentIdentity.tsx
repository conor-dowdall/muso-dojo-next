import { type ReactNode } from "react";
import { Typography } from "@/components/ui/typography/Typography";
import styles from "./InstrumentIdentity.module.css";

interface InstrumentIdentityProps {
  accessory?: ReactNode;
  label: string;
}

export function InstrumentIdentity({
  accessory,
  label,
}: InstrumentIdentityProps) {
  return (
    <span className={styles.identity}>
      <Typography
        as="span"
        className={styles.label}
        leading="none"
        size="xs"
        weight="medium"
      >
        {label}
      </Typography>
      {accessory}
    </span>
  );
}
