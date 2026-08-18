import { Disc3 } from "lucide-react";
import { Button } from "@/components/ui/buttons/Button";
import { ControlHeader } from "@/components/ui/control-header/ControlHeader";
import { Text } from "@/components/ui/typography/Text";
import styles from "./ChartPlaybackContext.module.css";

export function ChartPlaybackContext({
  disabled = false,
  label,
  onOpenPlayback,
  subtitle,
}: {
  disabled?: boolean;
  label: string;
  onOpenPlayback: () => void;
  subtitle: string;
}) {
  return (
    <ControlHeader
      aria-label={`Chart playback target: ${label}, ${subtitle}`}
      className={styles.context}
      primary={
        <span className={styles.identity}>
          <Text as="span" className={styles.label} size="sm" weight="semibold">
            {label}
          </Text>
          <Text as="span" className={styles.subtitle} size="xs" variant="muted">
            {subtitle}
          </Text>
        </span>
      }
      actions={
        <Button
          aria-label={`Playback options for ${label}, ${subtitle}`}
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
