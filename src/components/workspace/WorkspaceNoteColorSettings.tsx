"use client";

import { useState } from "react";
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
  defaultCustomNoteColors,
  getNoteColorLabel,
  noteColorPresetKeys,
} from "@/data/noteColors";
import {
  createCustomNoteColorConfig,
  normalizeHexColor,
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
const colorInputFallbackValue = "#737373";
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

function getModeLabel(mode: NoteColorMode) {
  return mode === "relative" ? "Relative to Root" : "Fixed to Notes";
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
    return "App Theme";
  }

  if (config.source === "preset") {
    return getModeLabel(colorCollections[config.preset].mode);
  }

  return getModeLabel(config.mode);
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
  color: string | null,
): CustomNoteColorConfig {
  const colors = [...config.colors];
  colors[index] = color;

  return {
    ...config,
    colors: createNoteColorTuple(colors),
  };
}

function getPreviewColorValue(color: string | null) {
  return color ?? NOTE_COLOR_NEUTRAL_VALUE;
}

function getColorInputValue(color: string | null, index: number) {
  return (
    normalizeHexColor(color) ??
    normalizeHexColor(defaultCustomNoteColors[index]) ??
    colorInputFallbackValue
  );
}

function NoteColorPreview({
  colors,
}: {
  colors: NoteColorTuple<string | null>;
}) {
  return (
    <span className={styles.noteColorPreview} aria-hidden="true">
      {NOTE_COLOR_INDEXES.map((index) => {
        const color = colors[index];

        return (
          <span
            key={index}
            className={styles.noteColorPreviewDot}
            data-default={color === null}
            style={{ backgroundColor: getPreviewColorValue(color) }}
          />
        );
      })}
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
  const [selectedCustomColorIndex, setSelectedCustomColorIndex] = useState(
    NOTE_COLOR_INDEXES[0],
  );
  const config = getNormalizedConfig(value);
  const customConfig = createCustomNoteColorConfig(config);
  const selectedCustomConfig =
    config.source === "custom" ? config : customConfig;
  const configLabel = getConfigLabel(config);
  const configSubtitle = getConfigSubtitle(config);
  const isColorChoiceOpen = isOpen ?? openChoice === "note-colors";
  const handleToggle = onToggle ?? (() => toggleChoice("note-colors"));
  const closeNoteColors = onClose ?? (() => closeChoice("note-colors"));
  const selectedCustomColorLabel = getNoteColorLabel(
    selectedCustomConfig.mode,
    selectedCustomColorIndex,
  );
  const selectedCustomColor =
    selectedCustomConfig.colors[selectedCustomColorIndex];

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
                aria-label={`${collection.name} note colors, ${getModeLabel(
                  collection.mode,
                )}`}
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
            ariaLabel={`Choose custom note colors. ${getModeLabel(
              customConfig.mode,
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
                  label="Fixed to Notes"
                  selected={selectedCustomConfig.mode === "absolute"}
                  size="sm"
                  onClick={() =>
                    onChange(updateCustomMode(selectedCustomConfig, "absolute"))
                  }
                />
                <Button
                  density="compact"
                  label="Relative to Root"
                  selected={selectedCustomConfig.mode === "relative"}
                  size="sm"
                  onClick={() =>
                    onChange(updateCustomMode(selectedCustomConfig, "relative"))
                  }
                />
              </div>

              <div
                className={styles.customColorGrid}
                role="group"
                aria-label="Custom note color swatches"
              >
                {NOTE_COLOR_INDEXES.map((index) => {
                  const label = getNoteColorLabel(
                    selectedCustomConfig.mode,
                    index,
                  );
                  const color = selectedCustomConfig.colors[index];

                  return (
                    <button
                      key={index}
                      aria-label={`${label} color, ${
                        color === null ? "Theme Fallback" : color
                      }`}
                      aria-pressed={selectedCustomColorIndex === index}
                      className={styles.customColorSwatchButton}
                      data-default={color === null}
                      data-selected={selectedCustomColorIndex === index}
                      type="button"
                      onClick={() => setSelectedCustomColorIndex(index)}
                    >
                      <span className={styles.customColorLabel}>{label}</span>
                      <span
                        className={styles.customColorSwatch}
                        style={{
                          backgroundColor: getPreviewColorValue(color),
                        }}
                      />
                    </button>
                  );
                })}
              </div>

              <div className={styles.customColorEditor}>
                <div
                  className={styles.customColorChoiceList}
                  role="group"
                  aria-label={`${selectedCustomColorLabel} color source`}
                >
                  <label
                    className={styles.customColorChoice}
                    data-selected={selectedCustomColor !== null}
                  >
                    <span className={styles.customColorChoiceText}>
                      <span className={styles.customColorChoiceLabel}>
                        {selectedCustomColorLabel} Custom Color
                      </span>
                    </span>
                    <input
                      aria-label={`${selectedCustomColorLabel} custom color`}
                      className={styles.customColorChoiceInput}
                      type="color"
                      value={getColorInputValue(
                        selectedCustomColor,
                        selectedCustomColorIndex,
                      )}
                      onChange={(event) =>
                        onChange(
                          updateCustomColor(
                            selectedCustomConfig,
                            selectedCustomColorIndex,
                            event.currentTarget.value,
                          ),
                        )
                      }
                    />
                    <span
                      className={styles.customColorChoiceIndicator}
                      aria-hidden="true"
                    />
                  </label>

                  <button
                    className={styles.customColorChoice}
                    data-selected={selectedCustomColor === null}
                    type="button"
                    onClick={() =>
                      onChange(
                        updateCustomColor(
                          selectedCustomConfig,
                          selectedCustomColorIndex,
                          null,
                        ),
                      )
                    }
                  >
                    <span className={styles.customColorChoiceText}>
                      <span className={styles.customColorChoiceLabel}>
                        {selectedCustomColorLabel} Theme Fallback
                      </span>
                    </span>
                    <span
                      className={`${styles.customColorChoicePreview} ${styles.customColorChoiceDefaultPreview}`}
                      aria-hidden="true"
                      style={{
                        backgroundColor: NOTE_COLOR_NEUTRAL_VALUE,
                      }}
                    />
                    <span
                      className={styles.customColorChoiceIndicator}
                      aria-hidden="true"
                    />
                  </button>
                </div>
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
