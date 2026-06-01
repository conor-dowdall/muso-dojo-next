"use client";

import { AudioLines, SwatchBook } from "lucide-react";
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
  type AppThemeChoice,
  type AppThemeName,
  type AppThemeOption,
} from "@/data/appThemes";
import { useAppStore } from "@/stores/appStore";
import { DISPLAY_VALUE_SEPARATOR } from "@/utils/valueSummary";
import styles from "./DojoSettingsDialog.module.css";

type ThemeSwatchToken = "base" | "surface-hover" | "accent";

const appThemeSubtitles = {
  system: "Follows Device Appearance",
  dark: "Neutral Low-Light Appearance",
  light: "Neutral Bright Appearance",
  ocean: "Cool High-Contrast Appearance",
  purple: "Violet High-Contrast Appearance",
} as const satisfies Record<AppThemeChoice, string>;

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
  const appThemeSubtitle = appThemeSubtitles[appThemeChoice];
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
              subtitle={masterAmbiencePreset.description}
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
              icon={<SwatchBook />}
              isOpen={isOpen("theme")}
              label="Dojo Theme"
              panelVariant="menu"
              preview={
                <ThemeSwatch option={getAppThemeOption(appThemeChoice)} />
              }
              subtitle={`${appThemeLabel}${DISPLAY_VALUE_SEPARATOR}${appThemeSubtitle}`}
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
                    subtitle={appThemeSubtitles[option.id]}
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
      <span className={styles.themeSwatchSystem} aria-hidden="true">
        <ThemeSwatchPalette
          className={styles.themeSwatchSystemDark}
          theme="dark"
        />
        <ThemeSwatchPalette
          className={styles.themeSwatchSystemLight}
          theme="light"
        />
      </span>
    );
  }

  return <ThemeSwatchPalette theme={option.id} />;
}

function ThemeSwatchPalette({
  className,
  theme,
}: {
  className?: string;
  theme: AppThemeName;
}) {
  return (
    <span
      className={[styles.themeSwatch, className].filter(Boolean).join(" ")}
      data-theme={theme}
      aria-hidden="true"
    >
      <ThemeSwatchChip token="base" />
      <ThemeSwatchChip token="surface-hover" />
      <ThemeSwatchChip token="accent" />
    </span>
  );
}

function ThemeSwatchChip({ token }: { token: ThemeSwatchToken }) {
  return <span className={styles.themeSwatchChip} data-token={token} />;
}
