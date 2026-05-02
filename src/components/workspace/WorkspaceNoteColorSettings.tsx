"use client";

import {
  colorCollections,
  type ColorCollectionKey,
} from "@musodojo/music-theory-data";
import { Button } from "@/components/ui/buttons/Button";
import {
  DisclosureList,
  DisclosureListAction,
  DisclosureListItem,
  useDisclosureList,
} from "@/components/ui/disclosure-list/DisclosureList";
import {
  DEFAULT_NOTE_COLOR_CONFIG,
  NOTE_COLOR_INDEXES,
  NOTE_COLOR_NEUTRAL_VALUE,
  NOTE_COLOR_THEME_VALUE,
  createNoteColorTuple,
  getNoteColorLabel,
  noteColorPresetKeys,
} from "@/data/noteColors";
import {
  createCustomNoteColorConfig,
  normalizeNoteColorConfig,
} from "@/utils/note-colors/createNoteColorConfig";
import {
  type CustomNoteColorConfig,
  type NoteColorMode,
  type NoteColorTuple,
  type WorkspaceNoteColorConfig,
} from "@/types/note-colors";
import styles from "./WorkspaceManagementDialog.module.css";

interface WorkspaceNoteColorSettingsProps {
  isOpen?: boolean;
  onClose?: () => void;
  onToggle?: () => void;
  value?: WorkspaceNoteColorConfig;
  onChange: (value: WorkspaceNoteColorConfig) => void;
}

const themePreviewColors = createNoteColorTuple(
  NOTE_COLOR_INDEXES.map(() => NOTE_COLOR_THEME_VALUE),
);
type NoteColorChoice = "note-colors";

function getNormalizedConfig(value: WorkspaceNoteColorConfig | undefined) {
  return normalizeNoteColorConfig(value) ?? DEFAULT_NOTE_COLOR_CONFIG;
}

function getPresetPreviewColors(preset: ColorCollectionKey) {
  return createNoteColorTuple(
    colorCollections[preset].colors.map(
      (color) => color ?? NOTE_COLOR_NEUTRAL_VALUE,
    ),
  );
}

function getCustomSubtitle({ mode }: CustomNoteColorConfig) {
  return mode === "relative" ? "Root-relative" : "Pitch";
}

function getConfigLabel(config: WorkspaceNoteColorConfig) {
  if (config.source === "theme") {
    return "Default";
  }

  if (config.source === "preset") {
    return colorCollections[config.preset].name;
  }

  return config.name;
}

function getConfigSubtitle(config: WorkspaceNoteColorConfig) {
  if (config.source === "theme") {
    return "App theme";
  }

  if (config.source === "preset") {
    return colorCollections[config.preset].mode === "relative"
      ? "Root-relative"
      : "Pitch";
  }

  return getCustomSubtitle(config);
}

function getConfigPreviewColors(config: WorkspaceNoteColorConfig) {
  if (config.source === "theme") {
    return themePreviewColors;
  }

  if (config.source === "preset") {
    return getPresetPreviewColors(config.preset);
  }

  return config.colors;
}

function updateCustomMode(
  config: CustomNoteColorConfig,
  mode: NoteColorMode,
): CustomNoteColorConfig {
  return {
    ...config,
    mode,
  };
}

function updateCustomColor(
  config: CustomNoteColorConfig,
  index: number,
  color: string,
): CustomNoteColorConfig {
  const colors = [...config.colors];
  colors[index] = color;

  return {
    ...config,
    colors: createNoteColorTuple(colors),
  };
}

function NoteColorPreview({ colors }: { colors: NoteColorTuple<string> }) {
  return (
    <span className={styles.noteColorPreview} aria-hidden="true">
      {NOTE_COLOR_INDEXES.map((index) => (
        <span
          key={index}
          className={styles.noteColorPreviewDot}
          style={{ backgroundColor: colors[index] }}
        />
      ))}
    </span>
  );
}

export function WorkspaceNoteColorSettings({
  isOpen,
  onClose,
  onToggle,
  value,
  onChange,
}: WorkspaceNoteColorSettingsProps) {
  const { closeChoice, openChoice, toggleChoice } =
    useDisclosureList<NoteColorChoice>();
  const config = getNormalizedConfig(value);
  const customConfig = createCustomNoteColorConfig(config);
  const selectedCustomConfig =
    config.source === "custom" ? config : customConfig;
  const configLabel = getConfigLabel(config);
  const configSubtitle = getConfigSubtitle(config);
  const isColorChoiceOpen = isOpen ?? openChoice === "note-colors";
  const handleToggle = onToggle ?? (() => toggleChoice("note-colors"));
  const closeNoteColors = onClose ?? (() => closeChoice("note-colors"));

  return (
    <DisclosureListItem
      ariaLabel={`Choose Note Colors. Current: ${configLabel}, ${configSubtitle}.`}
      isOpen={isColorChoiceOpen}
      label="Note Colors"
      preview={<NoteColorPreview colors={getConfigPreviewColors(config)} />}
      onToggle={handleToggle}
    >
      <div className={styles.noteColorDisclosure}>
        <DisclosureList className={styles.noteColorOptions}>
          <DisclosureListAction
            aria-label="Use default note colors from the app theme"
            density="compact"
            label="Default"
            preview={<NoteColorPreview colors={themePreviewColors} />}
            selected={config.source === "theme"}
            showSelectionIndicator
            onClick={() => {
              onChange({ source: "theme" });
              closeNoteColors();
            }}
          />

          {noteColorPresetKeys.map((preset) => {
            const collection = colorCollections[preset];

            return (
              <DisclosureListAction
                key={preset}
                aria-label={`${collection.name} note colors, ${
                  collection.mode === "relative" ? "root-relative" : "pitch"
                }`}
                density="compact"
                label={collection.name}
                preview={
                  <NoteColorPreview colors={getPresetPreviewColors(preset)} />
                }
                selected={
                  config.source === "preset" && config.preset === preset
                }
                showSelectionIndicator
                onClick={() => {
                  onChange({ source: "preset", preset });
                  closeNoteColors();
                }}
              />
            );
          })}

          <DisclosureListItem
            ariaLabel={`Choose custom note colors. ${getCustomSubtitle(
              customConfig,
            )}.`}
            density="compact"
            isOpen={config.source === "custom"}
            label="Custom"
            preview={<NoteColorPreview colors={customConfig.colors} />}
            showSelectionIndicator
            onToggle={() => onChange(customConfig)}
          >
            <div className={styles.customColorPanel}>
              <div
                className={styles.noteColorModeControls}
                role="group"
                aria-label="Custom color mode"
              >
                <Button
                  density="compact"
                  label="Pitch"
                  selected={selectedCustomConfig.mode === "absolute"}
                  size="sm"
                  onClick={() =>
                    onChange(updateCustomMode(selectedCustomConfig, "absolute"))
                  }
                />
                <Button
                  density="compact"
                  label="Root-relative"
                  selected={selectedCustomConfig.mode === "relative"}
                  size="sm"
                  onClick={() =>
                    onChange(updateCustomMode(selectedCustomConfig, "relative"))
                  }
                />
              </div>

              <div className={styles.customColorGrid}>
                {NOTE_COLOR_INDEXES.map((index) => {
                  const label = getNoteColorLabel(
                    selectedCustomConfig.mode,
                    index,
                  );

                  return (
                    <label key={index} className={styles.customColorField}>
                      <span className={styles.customColorLabel}>{label}</span>
                      <input
                        aria-label={`${label} color`}
                        className={styles.customColorInput}
                        type="color"
                        value={selectedCustomConfig.colors[index]}
                        onChange={(event) =>
                          onChange(
                            updateCustomColor(
                              selectedCustomConfig,
                              index,
                              event.currentTarget.value,
                            ),
                          )
                        }
                      />
                    </label>
                  );
                })}
              </div>

              <div className={styles.customColorActions}>
                <Button label="Done" size="sm" onClick={closeNoteColors} />
              </div>
            </div>
          </DisclosureListItem>
        </DisclosureList>
      </div>
    </DisclosureListItem>
  );
}
