import { Disc3 } from "lucide-react";
import { Button } from "@/components/ui/buttons/Button";
import { ControlHeader } from "@/components/ui/control-header/ControlHeader";
import { Text } from "@/components/ui/typography/Text";
import styles from "./ChartPlaybackContext.module.css";

export function ChartPlaybackContext({
  accessibleTarget,
  disabled = false,
  label,
  onOpenPlayback,
  subtitle,
}: {
  accessibleTarget?: string;
  disabled?: boolean;
  label: string;
  onOpenPlayback: () => void;
  subtitle?: string;
}) {
  const targetDescription =
    accessibleTarget ?? [label, subtitle].filter(Boolean).join(", ");

  return (
    <ControlHeader
      aria-label={`Chart playback target: ${targetDescription}`}
      className={styles.context}
      primary={
        <span className={styles.identity}>
          <Text as="span" className={styles.label} size="sm" weight="semibold">
            {label}
          </Text>
          {subtitle ? (
            <Text
              as="span"
              className={styles.subtitle}
              size="xs"
              variant="muted"
            >
              {subtitle}
            </Text>
          ) : null}
        </span>
      }
      actions={
        <Button
          aria-label={`Playback options for ${targetDescription}`}
          disabled={disabled}
          icon={<Disc3 />}
          label="Playback"
          size="sm"
          variant="ghost"
          onClick={onOpenPlayback}
        />
      }
    />
  );
}
