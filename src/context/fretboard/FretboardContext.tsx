import { createContext, use, useMemo } from "react";
import {
  type FretboardConfig,
  type FretboardProps,
} from "@/types/fretboard/fretboard";
import { createFretboardConfig } from "@/utils/fretboard/createFretboardConfig";

const FretboardContext = createContext<Required<FretboardConfig> | null>(null);

export function FretboardProvider({
  children,
  preset,
  config: userConfig,
}: FretboardProps & { children: React.ReactNode }) {
  // manually memoizing using `config object stringification` to avoid re-renders
  const config = useMemo(() => {
    return createFretboardConfig(preset, userConfig);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, JSON.stringify(userConfig)]);

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
