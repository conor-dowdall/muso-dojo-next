import { describe, expect, it } from "vitest";
import {
  getAppThemeAriaLabel,
  getAppThemeChoice,
  getAppThemeLabel,
  getAppThemeOption,
  normalizeAppThemePreference,
} from "@/data/appThemes";

describe("app themes", () => {
  it("normalizes only persisted app theme names", () => {
    expect(normalizeAppThemePreference("ocean")).toBe("ocean");
    expect(normalizeAppThemePreference("system")).toBeUndefined();
    expect(normalizeAppThemePreference("not-a-theme")).toBeUndefined();
  });

  it("uses System as the visible choice when no explicit theme is stored", () => {
    expect(getAppThemeChoice(undefined)).toBe("system");
    expect(getAppThemeLabel("system")).toBe("System");
  });

  it("formats theme choice aria labels", () => {
    expect(getAppThemeAriaLabel(getAppThemeOption("system"))).toBe(
      "Follow system theme",
    );
    expect(getAppThemeAriaLabel(getAppThemeOption("purple"))).toBe(
      "Use Purple theme",
    );
  });
});
