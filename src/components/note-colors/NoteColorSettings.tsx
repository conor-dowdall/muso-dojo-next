"use client";

import { useState } from "react";
import { Palette } from "lucide-react";
import {
  colorCollections,
  type ColorCollectionKey,
} from "@musodojo/music-theory-data";
import { Button } from "@/components/ui/buttons/Button";
import {
  DisclosureList,
  DisclosureListChoice,
  DisclosureListChoiceItem,
  DisclosureListItem,
  DisclosureListPanelActions,
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
import { DISPLAY_VALUE_SEPARATOR } from "@/utils/valueSummary";
import { NoteColorPreview } from "./NoteColorPreview";
import {
  type CustomNoteColorConfig,
  type NoteColorMode,
  type NoteColorConfig,
} from "@/types/note-colors";
import styles from "./NoteColorSettings.module.css";

interface NoteColorSettingsProps {
  isOpen?: boolean;
  onClose?: () => void;
  onToggle?: () => void;
  value?: NoteColorConfig;
  onChange: (value: NoteColorConfig) => void;
}

const themePreviewColors = createNoteColorTuple(
  NOTE_COLOR_INDEXES.map(() => NOTE_COLOR_THEME_VALUE),
);
const colorInputFallbackValue = "#737373";
type NoteColorChoice = "note-colors";

function getNormalizedConfig(value: NoteColorConfig | undefined) {
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

function getConfigLabel(config: NoteColorConfig) {
  if (config.source === "theme") {
    return "Plain Color";
  }

  if (config.source === "preset") {
    return colorCollections[config.preset].name;
  }

  return config.name;
}

function getConfigSubtitle(config: NoteColorConfig) {
  if (config.source === "theme") {
    return "Same for Every Note";
  }

  if (config.source === "preset") {
    return getModeLabel(colorCollections[config.preset].mode);
  }

  return getModeLabel(config.mode);
}

function getConfigPreviewColors(config: NoteColorConfig) {
  if (config.source === "theme") {
    return themePreviewColors;
  }

  if (config.source === "preset") {
    return getPresetPreviewColors(config.preset);
  }

  return config.colors;
}

function getConfigSummary(config: NoteColorConfig) {
  return `${getConfigLabel(config)}${DISPLAY_VALUE_SEPARATOR}${getConfigSubtitle(
    config,
  )}`;
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

export function NoteColorSettings({
  isOpen,
  onClose,
  onToggle,
  value,
  onChange,
}: NoteColorSettingsProps) {
  const { closeChoice, openChoice, toggleChoice } =
    useDisclosureList<NoteColorChoice>();
  const [selectedCustomColorIndex, setSelectedCustomColorIndex] = useState(
    NOTE_COLOR_INDEXES[0],
  );
  const [isCustomEditorOpen, setIsCustomEditorOpen] = useState(false);
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
  const selectedCustomColorTargetLabel = `Applies to ${selectedCustomColorLabel}`;
  const selectedCustomColor =
    selectedCustomConfig.colors[selectedCustomColorIndex];
  const isCustomSelected = config.source === "custom";
  const isCustomOpen = isCustomSelected && isCustomEditorOpen;

  return (
    <DisclosureListItem
      ariaLabel={`Choose Note Colors. Current: ${configLabel}, ${configSubtitle}.`}
      isOpen={isColorChoiceOpen}
      icon={<Palette />}
      keepMounted
      label="Note Colors"
      preview={<NoteColorPreview colors={getConfigPreviewColors(config)} />}
      subtitle={getConfigSummary(config)}
      onToggle={handleToggle}
    >
      <div className={styles.noteColorDisclosure}>
        <DisclosureList className={styles.noteColorOptions}>
          <DisclosureListChoice
            aria-label="Use one plain color for every note"
            density="compact"
            label="Plain Color"
            preview={<NoteColorPreview colors={themePreviewColors} />}
            selected={config.source === "theme"}
            subtitle="Same for Every Note"
            onClick={() => {
              setIsCustomEditorOpen(false);
              onChange({ source: "theme" });
            }}
          />

          {noteColorPresetKeys.map((preset) => {
            const collection = colorCollections[preset];

            return (
              <DisclosureListChoice
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
                subtitle={getModeLabel(collection.mode)}
                onClick={() => {
                  setIsCustomEditorOpen(false);
                  onChange({ source: "preset", preset });
                }}
              />
            );
          })}

          <DisclosureListChoiceItem
            ariaLabel={`Choose custom note colors. ${getModeLabel(
              customConfig.mode,
            )}.`}
            density="compact"
            isOpen={isCustomOpen}
            keepMounted
            label="Custom"
            preview={<NoteColorPreview colors={customConfig.colors} />}
            selected={isCustomSelected}
            subtitle={getModeLabel(customConfig.mode)}
            onToggle={() => {
              if (isCustomSelected) {
                setIsCustomEditorOpen((currentValue) => !currentValue);
                return;
              }

              setIsCustomEditorOpen(true);
              onChange(customConfig);
            }}
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
                        color === null ? "Default color" : color
                      }`}
                      aria-pressed={selectedCustomColorIndex === index}
                      className={styles.customColorSwatchButton}
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
                        Choose Color
                      </span>
                      <span className={styles.customColorChoiceTarget}>
                        {selectedCustomColorTargetLabel}
                      </span>
                    </span>
                    <input
                      aria-label={`Custom color value for ${selectedCustomColorLabel}`}
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
                    aria-label={`Use default color for ${selectedCustomColorLabel}`}
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
                        Use Default Color
                      </span>
                      <span className={styles.customColorChoiceTarget}>
                        {selectedCustomColorTargetLabel}
                      </span>
                    </span>
                    <span
                      className={styles.customColorChoicePreview}
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
            </div>
          </DisclosureListChoiceItem>
        </DisclosureList>

        <DisclosureListPanelActions>
          <Button label="Close" size="sm" onClick={closeNoteColors} />
        </DisclosureListPanelActions>
      </div>
    </DisclosureListItem>
  );
}
