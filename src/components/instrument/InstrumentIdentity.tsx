import { Typography } from "@/components/ui/typography/Typography";
import styles from "./InstrumentIdentity.module.css";

interface InstrumentIdentityProps {
  label: string;
}

export function InstrumentIdentity({ label }: InstrumentIdentityProps) {
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
    </span>
  );
}
