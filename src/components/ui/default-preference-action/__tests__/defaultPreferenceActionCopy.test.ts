import { describe, expect, it } from "vitest";
import { getDefaultPreferenceActionCopy } from "@/components/ui/default-preference-action";

describe("default preference action copy", () => {
  it("formats the active action from value and target labels", () => {
    expect(
      getDefaultPreferenceActionCopy({
        isDefault: false,
        valueLabel: "These Colors",
        targetLabel: "New Sessions",
      }),
    ).toEqual({
      ariaLabel: "Use these colors for new sessions",
      label: "Use These Colors for New Sessions",
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
        actionAriaLabel: "Remember keyboard setup for new instruments",
        actionLabel: "Use This Setup for New Instruments",
        isDefault: false,
        savedAriaLabel: "Keyboard setup is used for new instruments",
        savedLabel: "Used for New Instruments",
        valueLabel: "This Setup",
        targetLabel: "New Instruments",
      }),
    ).toEqual({
      ariaLabel: "Remember keyboard setup for new instruments",
      label: "Use This Setup for New Instruments",
    });

    expect(
      getDefaultPreferenceActionCopy({
        isDefault: true,
        savedAriaLabel: "Current note colors are used for new sessions",
        savedLabel: "Used for New Sessions",
        valueLabel: "These Colors",
        targetLabel: "New Sessions",
      }),
    ).toEqual({
      ariaLabel: "Current note colors are used for new sessions",
      label: "Used for New Sessions",
    });
  });
});
