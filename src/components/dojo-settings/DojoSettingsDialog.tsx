"use client";

import { PaintbrushVertical } from "lucide-react";
import {
  DialogContent,
  DialogDoneFooter,
  DialogHeader,
} from "@/components/ui/dialog/Dialog";
import { NoteColorSettings } from "@/components/note-colors/NoteColorSettings";
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
 * Launch them from the Dojo settings header action. Keep Dojo-wide appearance,
 * sound, defaults, and accessibility here. Sessions manage musical workspaces;
 * object overflow surfaces such as Part Actions and Instrument Options manage
 * the object beside their ellipsis.
 */
export function DojoSettingsDialog({ onClose }: DojoSettingsDialogProps) {
  const { closeChoice, isOpen, toggleChoice } = useDisclosureList<
    "note-colors" | "theme"
  >();
  const appThemeSetting = useAppStore((state) => state.dojoSettings.appTheme);
  const noteColorConfig = useAppStore(
    (state) => state.dojoSettings.noteColorConfig,
  );
  const setAppTheme = useAppStore((state) => state.setAppTheme);
  const setNoteColorConfig = useAppStore((state) => state.setNoteColorConfig);
  const appThemeChoice = getAppThemeChoice(appThemeSetting);
  const appThemeLabel = getAppThemeLabel(appThemeChoice);

  return (
    <>
      <DialogHeader title="Dojo Settings" onClose={onClose} />
      <DialogContent menuRhythm="compact">
        <DisclosureList grouped groupGap="section">
          <DisclosureListGroup>
            <DisclosureListItem
              ariaLabel={`Theme. Current: ${appThemeLabel}`}
              icon={<PaintbrushVertical />}
              isOpen={isOpen("theme")}
              label="Theme"
              panelVariant="menu"
              preview={
                <ThemeSwatch option={getAppThemeOption(appThemeChoice)} />
              }
              subtitle={appThemeLabel}
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
                    onClick={() => setAppTheme(option.id)}
                  />
                ))}
              </DisclosureList>
            </DisclosureListItem>

            <NoteColorSettings
              isOpen={isOpen("note-colors")}
              value={noteColorConfig}
              onClose={() => closeChoice("note-colors")}
              onToggle={() => toggleChoice("note-colors")}
              onChange={setNoteColorConfig}
            />
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
      <span className={styles.themeSwatchAccent} />
    </span>
  );
}
