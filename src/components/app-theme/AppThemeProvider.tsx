"use client";

import { type ReactNode, useEffect } from "react";
import {
  DEFAULT_APP_THEME_CHOICE,
  type AppThemeChoice,
} from "@/data/appThemes";
import { useAppStore, useHydrateAppStore } from "@/stores/appStore";

export function applyAppThemeChoice(
  themeChoice: AppThemeChoice = DEFAULT_APP_THEME_CHOICE,
) {
  if (typeof document === "undefined") {
    return;
  }

  if (themeChoice === DEFAULT_APP_THEME_CHOICE) {
    document.documentElement.removeAttribute("data-theme");
    return;
  }

  document.documentElement.dataset.theme = themeChoice;
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const hasHydrated = useHydrateAppStore();
  const appThemeChoice = useAppStore(
    (state) => state.dojoSettings.appTheme ?? DEFAULT_APP_THEME_CHOICE,
  );

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    applyAppThemeChoice(appThemeChoice);
  }, [appThemeChoice, hasHydrated]);

  return <>{children}</>;
}
