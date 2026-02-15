import { createContext, use, useMemo } from "react";
import {
  type FretboardConfig,
  type FretboardProps,
} from "@/types/fretboard/fretboard";
import { createFretboardConfig } from "@/utils/fretboard/createFretboardConfig";
import { fretboardDefaults } from "@/configs/fretboard/defaults";

const FretboardContext = createContext<Required<FretboardConfig> | null>(null);

export function FretboardProvider({
  children,
  config: userConfig,
  preset,
  ...rest
}: FretboardProps & { children: React.ReactNode }) {
  // Filter `rest` to only include keys that are actual FretboardConfig keys.
  // This prevents random props from invalidating the config.
  const configOverrides = useMemo(() => {
    const validConfigKeys = Object.keys(fretboardDefaults);
    const filteredrest = Object.fromEntries(
      Object.entries(rest).filter(([key]) => validConfigKeys.includes(key)),
    );
    return { ...userConfig, ...filteredrest };
  }, [userConfig, rest]);

  // We recreate the config ONLY when actual config props change.
  // We use JSON.stringify on the overrides to ensure deep equality for the dependency,
  // preventing re-renders when new object references with same values are passed.
  const config = useMemo(() => {
    return createFretboardConfig(preset, configOverrides);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, JSON.stringify(configOverrides)]);

  return (
    <FretboardContext.Provider value={config}>
      {children}
    </FretboardContext.Provider>
  );
}

export function useFretboardConfig() {
  const context = use(FretboardContext);
  if (!context) {
    throw new Error(
      "useFretboardConfig must be used within a FretboardProvider",
    );
  }
  return context;
}
