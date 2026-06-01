"use client";

import { AudioLines, Palette } from "lucide-react";
import {
  masterAmbiencePresets,
  musoAudioEngine,
  resolveMasterAmbiencePresetId,
  type MasterAmbiencePresetId,
} from "@/audio";
import {
  DialogContent,
  DialogDoneFooter,
  DialogHeader,
} from "@/components/ui/dialog/Dialog";
import {
  DisclosureList,
  DisclosureListChoice,
  DisclosureListGroup,
  DisclosureListItem,
  useDisclosureList,
} from "@/components/ui/disclosure-list/DisclosureList";
import {
  appThemeOptions,
  getAppThemeAriaLabel,
  getAppThemeChoice,
  getAppThemeLabel,
  getAppThemeOption,
  type AppThemeName,
  type AppThemeOption,
} from "@/data/appThemes";
import { useAppStore } from "@/stores/appStore";
import styles from "./DojoSettingsDialog.module.css";

interface DojoSettingsDialogProps {
  onClose: () => void;
}

/**
 * !!! LLM COPY CONVENTION: Dojo Settings are workspace-level behavior.
 * Launch them from the Dojo settings header action. Keep object menus about
 * the current Session, Part, or Instrument; keep Dojo-wide defaults, themes,
 * sound, and accessibility here unless a contextual "Use for New..." action
 * is clearly closer to the edited setting.
 */
export function DojoSettingsDialog({ onClose }: DojoSettingsDialogProps) {
  const { isOpen, toggleChoice } = useDisclosureList<"sound" | "theme">();
  const appThemePreference = useAppStore((state) => state.preferences.appTheme);
  const masterAmbiencePreference = useAppStore(
    (state) => state.preferences.masterAmbiencePresetId,
  );
  const setAppThemePreference = useAppStore(
    (state) => state.setAppThemePreference,
  );
  const setMasterAmbiencePresetId = useAppStore(
    (state) => state.setMasterAmbiencePresetId,
  );
  const appThemeChoice = getAppThemeChoice(appThemePreference);
  const appThemeLabel = getAppThemeLabel(appThemeChoice);
  const masterAmbiencePresetId = resolveMasterAmbiencePresetId(
    masterAmbiencePreference,
  );
  const masterAmbiencePreset = masterAmbiencePresets[masterAmbiencePresetId];

  const handleMasterAmbiencePresetChange = (
    presetId: MasterAmbiencePresetId,
  ) => {
    setMasterAmbiencePresetId(presetId);
    musoAudioEngine.setMasterAmbiencePresetId(presetId);
    void musoAudioEngine.playNote({
      midiNote: 60,
      presetId: "piano",
      use: "preview",
      velocity: 0.82,
    });
  };

  return (
    <>
      <DialogHeader title="Dojo Settings" onClose={onClose} />
      <DialogContent className={styles.content}>
        <DisclosureList grouped groupGap="section">
          <DisclosureListGroup>
            <DisclosureListItem
              ariaLabel={`Dojo sound. Current: ${masterAmbiencePreset.label}`}
              icon={<AudioLines />}
              isOpen={isOpen("sound")}
              label="Dojo Sound"
              panelVariant="menu"
              preview={
                <span className={styles.soundPreview}>
                  {masterAmbiencePreset.label}
                </span>
              }
              subtitle="Shared room and echo for all playback."
              onToggle={() => toggleChoice("sound")}
            >
              <DisclosureList>
                {Object.values(masterAmbiencePresets).map((preset) => (
                  <DisclosureListChoice
                    key={preset.id}
                    aria-label={`Use ${preset.label} dojo sound`}
                    label={preset.label}
                    selected={preset.id === masterAmbiencePresetId}
                    subtitle={preset.description}
                    onClick={() => handleMasterAmbiencePresetChange(preset.id)}
                  />
                ))}
              </DisclosureList>
            </DisclosureListItem>

            <DisclosureListItem
              ariaLabel={`Dojo theme. Current: ${appThemeLabel}`}
              icon={<Palette />}
              isOpen={isOpen("theme")}
              label="Dojo Theme"
              panelVariant="menu"
              preview={
                <span className={styles.themePreview}>
                  <ThemeSwatch option={getAppThemeOption(appThemeChoice)} />
                  <span>{appThemeLabel}</span>
                </span>
              }
              onToggle={() => toggleChoice("theme")}
            >
              <DisclosureList>
                {appThemeOptions.map((option) => (
                  <DisclosureListChoice
                    key={option.id}
                    aria-label={getAppThemeAriaLabel(option)}
                    label={option.label}
                    preview={<ThemeSwatch option={option} />}
                    selected={option.id === appThemeChoice}
                    onClick={() => setAppThemePreference(option.id)}
                  />
                ))}
              </DisclosureList>
            </DisclosureListItem>
          </DisclosureListGroup>
        </DisclosureList>
      </DialogContent>
      <DialogDoneFooter onDone={onClose} />
    </>
  );
}

function ThemeSwatch({ option }: { option: AppThemeOption }) {
  if (option.id === "system") {
    return (
      <span className={styles.themeSwatch} aria-hidden="true">
        <ThemeSwatchChip theme="dark" token="base" />
        <ThemeSwatchChip theme="light" token="base" />
        <span
          className={`${styles.themeSwatchChip} ${styles.themeSwatchSplitChip}`}
        >
          <span
            className={styles.themeSwatchChipHalf}
            data-theme="dark"
            data-token="accent"
          />
          <span
            className={styles.themeSwatchChipHalf}
            data-theme="light"
            data-token="accent"
          />
        </span>
      </span>
    );
  }

  return (
    <span
      className={styles.themeSwatch}
      data-theme={option.id}
      aria-hidden="true"
    >
      <ThemeSwatchChip token="base" />
      <ThemeSwatchChip token="surface" />
      <ThemeSwatchChip token="accent" />
    </span>
  );
}

function ThemeSwatchChip({
  theme,
  token,
}: {
  theme?: AppThemeName;
  token: "base" | "surface" | "accent";
}) {
  return (
    <span
      className={styles.themeSwatchChip}
      data-theme={theme}
      data-token={token}
    />
  );
}
