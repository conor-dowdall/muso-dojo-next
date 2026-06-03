import { describe, expect, it } from "vitest";
import { getDefaultPreferenceActionCopy } from "@/components/ui/default-preference-action";

describe("default preference action copy", () => {
  it("formats the active action from value and target labels", () => {
    expect(
      getDefaultPreferenceActionCopy({
        isDefault: false,
        valueLabel: "This Setup",
        targetLabel: "New Instruments",
      }),
    ).toEqual({
      ariaLabel: "Use this setup for new instruments",
      label: "Use This Setup for New Instruments",
    });
  });

  it("formats the saved state from the target label", () => {
    expect(
      getDefaultPreferenceActionCopy({
        isDefault: true,
        valueLabel: "This Setup",
        targetLabel: "New Instruments",
      }),
    ).toEqual({
      ariaLabel: "Default for new instruments: This Setup",
      label: "Used for New Instruments",
    });
  });

  it("allows surface-specific copy overrides", () => {
    expect(
      getDefaultPreferenceActionCopy({
        actionAriaLabel: "Use keyboard setup for new instruments",
        actionLabel: "Use This Setup for New Instruments",
        isDefault: false,
        savedAriaLabel: "Keyboard setup is used for new instruments",
        savedLabel: "Used for New Instruments",
        valueLabel: "This Setup",
        targetLabel: "New Instruments",
      }),
    ).toEqual({
      ariaLabel: "Use keyboard setup for new instruments",
      label: "Use This Setup for New Instruments",
    });

    expect(
      getDefaultPreferenceActionCopy({
        isDefault: true,
        savedAriaLabel: "Current setup is used for new instruments",
        savedLabel: "Used for New Instruments",
        valueLabel: "This Setup",
        targetLabel: "New Instruments",
      }),
    ).toEqual({
      ariaLabel: "Current setup is used for new instruments",
      label: "Used for New Instruments",
    });
  });
});
