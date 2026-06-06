"use client";

import { useEffect } from "react";
import { type StringInstrumentKey } from "@musodojo/music-theory-data";
import {
  DEFAULT_FRETBOARD_INLAY_PRESET,
  customFretboardInlayPresetOptions,
  fretboardInlayPresetOptions,
  fretboardInlayPresets,
  type FretboardInlayPresetName,
} from "@/data/fretboard/inlayPresets";
import { getDefaultFretboardWoodThemeName } from "@/data/fretboard/instrumentDefaults";
import {
  fretboardThemes,
  type FretboardThemeName,
} from "@/data/fretboard/themes";
import { keyboardThemes, type KeyboardThemeName } from "@/data/keyboard/themes";
import {
  DisclosureList,
  DisclosureListChoice,
  DisclosureListItem,
  useDisclosureList,
} from "@/components/ui/disclosure-list/DisclosureList";
import {
  FretboardInlayPresetSwatch,
  KeyboardThemeSwatch,
  WoodSurfaceSwatch,
} from "./InstrumentThemeSwatch";

interface FretboardAppearanceEditorProps {
  allowAuto?: boolean;
  closeSignal?: number;
  handedness: "left" | "right";
  inlayPreset?: FretboardInlayPresetName;
  instrument: StringInstrumentKey;
  onInlayPresetChange: (
    inlayPreset: FretboardInlayPresetName | undefined,
  ) => void;
  onThemeChange: (theme: FretboardThemeName | undefined) => void;
  theme?: FretboardThemeName;
}

export function FretboardAppearanceEditor({
  allowAuto = true,
  closeSignal,
  handedness,
  inlayPreset,
  instrument,
  onInlayPresetChange,
  onThemeChange,
  theme,
}: FretboardAppearanceEditorProps) {
  const { closeAll, openChoice, toggleChoice } = useDisclosureList<
    "inlay" | "wood"
  >();
  const effectiveTheme = theme ?? getDefaultFretboardWoodThemeName(instrument);
  const effectiveInlayPreset = inlayPreset ?? DEFAULT_FRETBOARD_INLAY_PRESET;
  const inlayOptions = allowAuto
    ? fretboardInlayPresetOptions
    : customFretboardInlayPresetOptions;

  useEffect(() => {
    closeAll();
  }, [closeAll, closeSignal]);

  return (
    <DisclosureList>
      <DisclosureListItem
        ariaLabel={`Choose wood, ${
          theme ? fretboardThemes[theme].title : "Auto"
        } selected`}
        isOpen={openChoice === "wood"}
        label="Wood"
        onToggle={() => toggleChoice("wood")}
        panelVariant="menu"
        preview={<WoodSurfaceSwatch surfaceId={effectiveTheme} />}
        subtitle={theme ? fretboardThemes[theme].title : "Auto"}
      >
        <DisclosureList>
          {allowAuto ? (
            <DisclosureListChoice
              label="Auto"
              selected={theme === undefined}
              onClick={() => onThemeChange(undefined)}
            />
          ) : null}
          {Object.entries(fretboardThemes).map(
            ([themeName, themeDefinition]) => (
              <DisclosureListChoice
                key={themeName}
                label={themeDefinition.title}
                preview={
                  <WoodSurfaceSwatch
                    surfaceId={themeName as FretboardThemeName}
                  />
                }
                selected={themeName === theme}
                onClick={() => onThemeChange(themeName as FretboardThemeName)}
              />
            ),
          )}
        </DisclosureList>
      </DisclosureListItem>

      <DisclosureListItem
        ariaLabel={`Choose inlay, ${
          inlayPreset ? fretboardInlayPresets[inlayPreset].title : "Auto"
        } selected`}
        isOpen={openChoice === "inlay"}
        label="Inlay"
        onToggle={() => toggleChoice("inlay")}
        panelVariant="menu"
        preview={
          <FretboardInlayPresetSwatch
            handedness={handedness}
            instrument={instrument}
            presetName={effectiveInlayPreset}
            themeName={effectiveTheme}
          />
        }
        subtitle={
          inlayPreset ? fretboardInlayPresets[inlayPreset].title : "Auto"
        }
      >
        <DisclosureList>
          {inlayOptions.map((presetName) => (
            <DisclosureListChoice
              key={presetName}
              label={fretboardInlayPresets[presetName].title}
              selected={
                presetName === (inlayPreset ?? DEFAULT_FRETBOARD_INLAY_PRESET)
              }
              onClick={() =>
                onInlayPresetChange(
                  presetName === DEFAULT_FRETBOARD_INLAY_PRESET
                    ? undefined
                    : presetName,
                )
              }
            />
          ))}
        </DisclosureList>
      </DisclosureListItem>
    </DisclosureList>
  );
}

interface KeyboardAppearanceEditorProps {
  onThemeChange: (theme: KeyboardThemeName) => void;
  theme: KeyboardThemeName;
}

export function KeyboardAppearanceEditor({
  onThemeChange,
  theme,
}: KeyboardAppearanceEditorProps) {
  return (
    <DisclosureList>
      {Object.entries(keyboardThemes).map(([themeName, themeDefinition]) => (
        <DisclosureListChoice
          key={themeName}
          label={themeDefinition.title}
          preview={
            <KeyboardThemeSwatch themeName={themeName as KeyboardThemeName} />
          }
          selected={themeName === theme}
          subtitle={themeDefinition.summary}
          onClick={() => onThemeChange(themeName as KeyboardThemeName)}
        />
      ))}
    </DisclosureList>
  );
}
