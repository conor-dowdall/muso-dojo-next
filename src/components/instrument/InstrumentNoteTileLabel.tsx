import styles from "./InstrumentNoteTileLabel.module.css";

function TileLabelText({ value }: { value: string }) {
  return (
    <span
      className={styles.text}
      data-is-placeholder={value === "" ? true : undefined}
    >
      {value}
    </span>
  );
}

export function InstrumentNoteTileLabel({
  primary,
  secondary,
}: {
  primary: string;
  secondary: string;
}) {
  return (
    <span className={styles.stack}>
      <span className={styles.slot}>
        <TileLabelText value={primary} />
      </span>
      <span className={styles.slot}>
        <TileLabelText value={secondary} />
      </span>
    </span>
  );
}
