"use client";

import { Palette } from "lucide-react";
import { Button } from "@/components/ui/buttons/Button";
import {
  DialogContent,
  DialogFooter,
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
  getAppThemeChoice,
  getAppThemeLabel,
  getAppThemeOption,
  type AppThemeOption,
} from "@/data/appThemes";
import { useAppStore } from "@/stores/appStore";
import styles from "./AppPreferencesDialog.module.css";

interface AppPreferencesDialogProps {
  onClose: () => void;
}

/**
 * !!! LLM COPY CONVENTION: App Settings are user-level app behavior.
 * Launch them with SlidersHorizontal from the session header. Keep object
 * menus about the current Session, Part, or Instrument; keep global defaults,
 * themes, and accessibility here unless a contextual "Use for New..." action
 * is clearly closer to the edited setting.
 */
export function AppPreferencesDialog({ onClose }: AppPreferencesDialogProps) {
  const { isOpen, toggleChoice } = useDisclosureList<"theme">("theme");
  const appThemePreference = useAppStore((state) => state.preferences.appTheme);
  const setAppThemePreference = useAppStore(
    (state) => state.setAppThemePreference,
  );
  const appThemeChoice = getAppThemeChoice(appThemePreference);
  const appThemeLabel = getAppThemeLabel(appThemeChoice);

  return (
    <>
      <DialogHeader title="App Settings" onClose={onClose} />
      <DialogContent className={styles.content}>
        <DisclosureList grouped groupGap="section">
          <DisclosureListGroup>
            <DisclosureListItem
              ariaLabel={`Theme. Current: ${appThemeLabel}`}
              icon={<Palette />}
              isOpen={isOpen("theme")}
              label="Theme"
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
                    aria-label={`Use ${option.label} theme`}
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
      <DialogFooter>
        <section className={styles.footerActions} aria-label="Dialog actions">
          <Button label="Done" size="lg" variant="filled" onClick={onClose} />
        </section>
      </DialogFooter>
    </>
  );
}

function ThemeSwatch({ option }: { option: AppThemeOption }) {
  return (
    <span className={styles.themeSwatch} aria-hidden="true">
      {option.swatch.map((color) => (
        <span
          key={color}
          className={styles.themeSwatchChip}
          style={{ backgroundColor: color }}
        />
      ))}
    </span>
  );
}
