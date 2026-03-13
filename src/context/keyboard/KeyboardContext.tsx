import { createContext, use, useMemo } from "react";
import {
  type KeyboardConfig,
  type KeyboardProps,
} from "@/types/keyboard/keyboard";
import { createKeyboardConfig } from "@/utils/keyboard/createKeyboardConfig";

const KeyboardContext = createContext<Required<KeyboardConfig> | null>(null);

export function KeyboardProvider({
  children,
  preset,
  config: userConfig,
}: KeyboardProps & { children: React.ReactNode }) {
  // manually memoizing using `config object stringification` to avoid re-renders
  const config = useMemo(() => {
    return createKeyboardConfig(preset, userConfig);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, JSON.stringify(userConfig)]);

  return (
    <KeyboardContext.Provider value={config}>
      {children}
    </KeyboardContext.Provider>
  );
}

export function useKeyboardConfig() {
  const context = use(KeyboardContext);
  if (!context) {
    throw new Error(
      "useKeyboardConfig must be used within a KeyboardProvider",
    );
  }
  return context;
}
