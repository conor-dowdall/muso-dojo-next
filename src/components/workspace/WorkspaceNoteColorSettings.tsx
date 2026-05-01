"use client";

import {
  colorCollections,
  type ColorCollectionKey,
} from "@musodojo/music-theory-data";
import { Button } from "@/components/ui/buttons/Button";
import { OptionButton } from "@/components/ui/buttons/OptionButton";
import { Heading } from "@/components/ui/typography/Heading";
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
  value?: WorkspaceNoteColorConfig;
  onChange: (value: WorkspaceNoteColorConfig) => void;
}

const themePreviewColors = createNoteColorTuple(
  NOTE_COLOR_INDEXES.map(() => NOTE_COLOR_THEME_VALUE),
);

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
  value,
  onChange,
}: WorkspaceNoteColorSettingsProps) {
  const config = getNormalizedConfig(value);
  const customConfig = createCustomNoteColorConfig(config);
  const selectedCustomConfig =
    config.source === "custom" ? config : customConfig;

  return (
    <section className={styles.section} aria-label="Note colors">
      <Heading as="h3" size="sm" weight="semibold">
        Note colors
      </Heading>

      <div className={styles.noteColorOptions}>
        <OptionButton
          density="compact"
          label="Theme"
          presentation="list"
          preview={<NoteColorPreview colors={themePreviewColors} />}
          selected={config.source === "theme"}
          subtitle="Global"
          onClick={() => onChange({ source: "theme" })}
        />

        {noteColorPresetKeys.map((preset) => {
          const collection = colorCollections[preset];

          return (
            <OptionButton
              key={preset}
              density="compact"
              label={collection.name}
              presentation="list"
              preview={
                <NoteColorPreview colors={getPresetPreviewColors(preset)} />
              }
              selected={config.source === "preset" && config.preset === preset}
              subtitle={
                collection.mode === "relative" ? "Root-relative" : "Pitch"
              }
              onClick={() => onChange({ source: "preset", preset })}
            />
          );
        })}

        <OptionButton
          density="compact"
          label="Custom"
          presentation="list"
          preview={<NoteColorPreview colors={customConfig.colors} />}
          selected={config.source === "custom"}
          subtitle={getCustomSubtitle(customConfig)}
          onClick={() => onChange(customConfig)}
        />
      </div>

      {config.source === "custom" ? (
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
              const label = getNoteColorLabel(selectedCustomConfig.mode, index);

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
        </div>
      ) : null}
    </section>
  );
}
