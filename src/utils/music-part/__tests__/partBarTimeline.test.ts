import { describe, expect, it } from "vitest";
import { createPartBarTimeline } from "@/utils/music-part/partBarTimeline";
import { type MusicPartConfig } from "@/types/session";

function createPart(
  id: string,
  durationInBars?: number,
): Pick<MusicPartConfig, "durationInBars" | "id"> {
  return {
    id,
    ...(durationInBars === undefined ? {} : { durationInBars }),
  };
}

describe("createPartBarTimeline", () => {
  it("labels split bars with a shared bar number and segment suffixes", () => {
    const timeline = createPartBarTimeline([
      createPart("bar-1"),
      createPart("bar-2"),
      createPart("bar-3"),
      createPart("bar-4"),
      createPart("bar-5"),
      createPart("bar-6"),
      createPart("bar-7-a", 0.5),
      createPart("bar-7-b", 0.5),
      createPart("bar-8"),
    ]);

    expect(timeline.totalBars).toBe(8);
    expect(timeline.totalLabel).toBe("8 Bars");
    expect(timeline.entries.map((entry) => entry.barLabel)).toEqual([
      "01",
      "02",
      "03",
      "04",
      "05",
      "06",
      "07a",
      "07b",
      "08",
    ]);
    expect(timeline.entries.map((entry) => entry.barNumberLabel)).toEqual([
      "01",
      "02",
      "03",
      "04",
      "05",
      "06",
      "07",
      "07",
      "08",
    ]);
    expect(timeline.entries.map((entry) => entry.barAccessibleLabel)).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7a",
      "7b",
      "8",
    ]);
    expect(
      timeline.entries.map((entry) => entry.barNumberAccessibleLabel),
    ).toEqual(["1", "2", "3", "4", "5", "6", "7", "7", "8"]);
  });

  it("labels three-way bar splits in order", () => {
    const timeline = createPartBarTimeline([
      createPart("one"),
      createPart("two-a", 1 / 3),
      createPart("two-b", 1 / 3),
      createPart("two-c", 1 / 3),
    ]);

    expect(timeline.entries.map((entry) => entry.barLabel)).toEqual([
      "01",
      "02a",
      "02b",
      "02c",
    ]);
  });
});
