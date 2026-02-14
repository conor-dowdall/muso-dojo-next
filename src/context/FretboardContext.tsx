import { createContext, use } from "react";
import { type FretboardConfig, type FretboardProps } from "@/types/fretboard";
import { createFretboardConfig } from "@/utils/fretboard/createFretboardConfig";

const FretboardContext = createContext<Required<FretboardConfig> | null>(null);

export function FretboardProvider({
  children,
  config: userConfig,
  preset,
  ...rest
}: FretboardProps & { children: React.ReactNode }) {
  // We recreate the config whenever the props change.
  // Since createFretboardConfig is synchronous and fast, this is fine.
  // We can memoize if performance becomes an issue, but usually it's lightweight.
  const config = createFretboardConfig(preset, { ...userConfig, ...rest });

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
