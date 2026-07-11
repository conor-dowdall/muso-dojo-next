import { describe, expect, it } from "vitest";
import { getRhythmTheoryReadout } from "@/data/rhythmPresets";
import { normalizeRhythmRecipe } from "@/utils/rhythm/rhythmConfig";
import {
  getRecipeWithBeatCount,
  getRecipeWithBeatCountConstraint,
  getRecipeWithGroove,
  getRecipeWithTimekeeper,
  getAdjacentCompatibleRhythmBeatCount,
  getCompatibleRhythmBeatCounts,
  getRhythmChoiceSummary,
  getRhythmRecipeCreationSummary,
  getRhythmStarterChoiceForRecipe,
  getRhythmStarterRecipe,
  getRhythmStarterSummary,
  isRhythmBeatCountCompatible,
  isRhythmGrooveChoiceAvailable,
  isRhythmStarterChoiceAvailable,
  isRhythmTimekeeperSubdivisionChoiceAvailable,
  rhythmTimekeeperFeelSubdivisionChoices,
  rhythmStarterChoices,
  rhythmTimekeeperSubdivisionChoices,
  rhythmTimekeeperStraightSubdivisionChoices,
} from "@/components/rhythm/rhythmRecipeControls";

describe("rhythmRecipeControls", () => {
  it("keeps every common rhythm starter normalized and compatible", () => {
    rhythmStarterChoices.forEach((choice) => {
      const recipe = getRhythmStarterRecipe(choice.id);

      expect(normalizeRhythmRecipe(recipe)).toStrictEqual(recipe);
    });
  });

  it("maps compound meter starters to counted beats with three-part subdivision", () => {
    const sixEight = getRhythmStarterRecipe("6-8");
    const twelveEight = getRhythmStarterRecipe("12-8");

    expect(sixEight).toMatchObject({
      beats: 2,
      timekeeper: {
        feel: "straight",
        subdivision: "eighth-triplet",
      },
    });
    expect(twelveEight).toMatchObject({
      beats: 4,
      timekeeper: {
        feel: "straight",
        subdivision: "eighth-triplet",
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

  it("resolves recipes back to their musical starter preset", () => {
    const fourFour = getRhythmStarterRecipe("4-4");
    const swing = getRhythmStarterRecipe("swing");
    const shuffle = getRhythmStarterRecipe("shuffle");
    const country = getRhythmStarterRecipe("country");

    expect(getRhythmStarterChoiceForRecipe(fourFour)?.label).toBe("4/4");
    expect(
      getRhythmStarterChoiceForRecipe(
        getRecipeWithTimekeeper(fourFour, { sound: "ride" }),
      )?.label,
    ).toBe("4/4");
    expect(
      getRhythmStarterChoiceForRecipe(
        getRecipeWithTimekeeper(fourFour, { subdivision: "quintuplet" }),
      )?.label,
    ).toBe("4/4");
    expect(
      getRhythmStarterChoiceForRecipe(getRecipeWithGroove(fourFour, "pulse"))
        ?.label,
    ).toBe("4/4");
    expect(getRhythmStarterChoiceForRecipe(swing)?.label).toBe("Swing");
    expect(
      getRhythmStarterChoiceForRecipe(
        getRecipeWithTimekeeper(swing, { sound: "hat" }),
      )?.label,
    ).toBe("Swing");
    expect(getRhythmStarterChoiceForRecipe(shuffle)?.label).toBe("Shuffle");
    expect(getRhythmStarterChoiceForRecipe(country)?.label).toBe("Country");
  });

  it("summarizes rhythm choices with their musical identity and meter", () => {
    expect(getRhythmChoiceSummary(getRhythmStarterRecipe("4-4"))).toBe("4/4");
    expect(getRhythmChoiceSummary(getRhythmStarterRecipe("swing"))).toBe(
      "Swing • 4/4",
    );
    expect(getRhythmChoiceSummary(getRhythmStarterRecipe("shuffle"))).toBe(
      "Shuffle • 4/4",
    );
    expect(getRhythmChoiceSummary(getRhythmStarterRecipe("country"))).toBe(
      "Country • 4/4",
    );
  });

  it("uses the theory meter for compound starter recognition", () => {
    const sixEight = getRhythmStarterRecipe("6-8");
    const twelveEight = getRhythmStarterRecipe("12-8");

    expect(
      getRhythmStarterChoiceForRecipe(
        getRecipeWithTimekeeper(sixEight, { sound: "ride" }),
      )?.label,
    ).toBe("6/8");
    expect(
      getRhythmStarterChoiceForRecipe(getRecipeWithGroove(twelveEight, "pulse"))
        ?.label,
    ).toBe("12/8");
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

  it("offers straight subdivision densities from one through eight per beat", () => {
    expect(
      rhythmTimekeeperStraightSubdivisionChoices.map((choice) => choice.text),
    ).toEqual(["1", "2", "3", "4", "5", "6", "7", "8"]);
    expect(
      rhythmTimekeeperStraightSubdivisionChoices.map((choice) => choice.label),
    ).toContain("Use 5 subdivisions per beat");
    expect(
      rhythmTimekeeperFeelSubdivisionChoices.map((choice) => choice.text),
    ).toEqual(["Sw", "Shf"]);
    expect(
      rhythmTimekeeperSubdivisionChoices.map((choice) => choice.text),
    ).toEqual(
      rhythmTimekeeperStraightSubdivisionChoices
        .map((choice) => choice.text)
        .concat(
          rhythmTimekeeperFeelSubdivisionChoices.map((choice) => choice.text),
        ),
    );
  });

  it("constrains beat counts for split-bar progression compatibility", () => {
    const halfBarConstraint = { requiredBarDivision: 2 };
    const fifthBarConstraint = { requiredBarDivision: 5 };
    const threeFour = getRhythmStarterRecipe("3-4");

    expect(getCompatibleRhythmBeatCounts(halfBarConstraint)).toEqual([
      2, 4, 6, 8,
    ]);
    expect(getCompatibleRhythmBeatCounts(fifthBarConstraint)).toEqual([5]);
    expect(isRhythmBeatCountCompatible(4, halfBarConstraint)).toBe(true);
    expect(isRhythmBeatCountCompatible(3, halfBarConstraint)).toBe(false);
    expect(isRhythmStarterChoiceAvailable("3-4", halfBarConstraint)).toBe(
      false,
    );
    expect(isRhythmStarterChoiceAvailable("6-8", halfBarConstraint)).toBe(true);
    expect(
      getRecipeWithBeatCountConstraint(threeFour, halfBarConstraint),
    ).toMatchObject({
      beats: 4,
    });
    expect(
      getAdjacentCompatibleRhythmBeatCount(4, halfBarConstraint, "previous"),
    ).toBe(2);
    expect(
      getAdjacentCompatibleRhythmBeatCount(4, halfBarConstraint, "next"),
    ).toBe(6);
  });
});
