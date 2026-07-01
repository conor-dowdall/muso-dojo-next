import { describe, expect, it } from "vitest";
import { getRhythmTheoryReadout } from "@/data/rhythmPresets";
import { normalizeRhythmRecipe } from "@/utils/rhythm/rhythmConfig";
import {
  getRecipeWithBeatCount,
  getRecipeWithGroove,
  getRecipeWithTimekeeper,
  getRhythmRecipeCreationSummary,
  getRhythmStarterRecipe,
  getRhythmStarterSummary,
  isRhythmGrooveChoiceAvailable,
  isRhythmTimekeeperSubdivisionChoiceAvailable,
  rhythmStarterChoices,
  rhythmTimekeeperSubdivisionChoices,
} from "@/components/rhythm/rhythmRecipeControls";

describe("rhythmRecipeControls", () => {
  it("keeps every common rhythm starter normalized and compatible", () => {
    rhythmStarterChoices.forEach((choice) => {
      const recipe = getRhythmStarterRecipe(choice.id);

      expect(normalizeRhythmRecipe(recipe)).toStrictEqual(recipe);
    });
  });

  it("maps compound meter starters to counted beats with three-part feel", () => {
    const sixEight = getRhythmStarterRecipe("6-8");
    const twelveEight = getRhythmStarterRecipe("12-8");

    expect(sixEight).toMatchObject({
      beats: 2,
      timekeeper: {
        feel: "triplet",
        subdivision: "eighth",
      },
    });
    expect(twelveEight).toMatchObject({
      beats: 4,
      timekeeper: {
        feel: "triplet",
        subdivision: "eighth",
      },
    });
    expect(getRhythmTheoryReadout(sixEight).title).toBe("6/8");
    expect(getRhythmTheoryReadout(twelveEight).title).toBe("12/8");
  });

  it("keeps swing and shuffle as editable 4/4 recipe starters", () => {
    const swing = getRhythmStarterRecipe("swing");
    const shuffle = getRhythmStarterRecipe("shuffle");

    expect(swing).toMatchObject({
      beats: 4,
      groove: "kit",
      grouping: "auto",
      timekeeper: {
        feel: "swing",
        sound: "ride",
        subdivision: "eighth",
      },
    });
    expect(shuffle).toMatchObject({
      beats: 4,
      groove: "kit",
      grouping: "auto",
      timekeeper: {
        feel: "shuffle",
        sound: "hat",
        subdivision: "eighth",
      },
    });
  });

  it("includes a country drive starter for 4/4 hi-hat practice", () => {
    const country = getRhythmStarterRecipe("country");

    expect(country).toMatchObject({
      beats: 4,
      groove: "bluegrass",
      grouping: "auto",
      timekeeper: {
        feel: "straight",
        sound: "hat",
        subdivision: "eighth",
      },
    });
    expect(getRhythmStarterSummary("country")).toBe(
      "4 Beats • Drive • Hi-Hat • 2 per Beat",
    );
    expect(getRhythmRecipeCreationSummary(country)).toBe(
      "4/4 • Drive • Hi-Hat • 2 per Beat",
    );
  });

  it("includes meter in creation summaries", () => {
    const sixEight = getRhythmStarterRecipe("6-8");

    expect(getRhythmStarterSummary("6-8")).toBe(
      "2 Beats • Kit • Hi-Hat • 3 per Beat",
    );
    expect(getRhythmRecipeCreationSummary(sixEight)).toBe(
      "6/8 • Kit • Hi-Hat • 3 per Beat",
    );
  });

  it("normalizes incompatible groove and feel combinations through shared mutators", () => {
    const swing = getRhythmStarterRecipe("swing");
    const drive = getRecipeWithGroove(swing, "bluegrass");

    expect(drive).toMatchObject({
      groove: "bluegrass",
      timekeeper: {
        feel: "straight",
        subdivision: "eighth",
      },
    });
    expect(
      getRecipeWithTimekeeper(drive, {
        feel: "swing",
        subdivision: "eighth",
      }),
    ).toMatchObject({
      groove: "bluegrass",
      timekeeper: {
        feel: "straight",
        subdivision: "eighth",
      },
    });
  });

  it("uses the same availability rules as the recipe mutators", () => {
    const oneBeat = getRecipeWithBeatCount(getRhythmStarterRecipe("swing"), 1);
    const swingChoice = rhythmTimekeeperSubdivisionChoices.find(
      (choice) => choice.feel === "swing",
    );

    if (!swingChoice) {
      throw new Error("Expected a swing timekeeper choice");
    }

    expect(isRhythmGrooveChoiceAvailable(oneBeat, "kit")).toBe(false);
    expect(
      isRhythmTimekeeperSubdivisionChoiceAvailable(oneBeat, swingChoice),
    ).toBe(false);
    expect(oneBeat).toMatchObject({
      beats: 1,
      groove: "pulse",
      timekeeper: {
        feel: "straight",
        subdivision: "eighth",
      },
    });
  });
});
