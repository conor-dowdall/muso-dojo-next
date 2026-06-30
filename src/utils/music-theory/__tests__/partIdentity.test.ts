import { describe, expect, it } from "vitest";
import { getPartIdentity } from "../partIdentity";

describe("getPartIdentity", () => {
  it("formats chord collections as compact chord symbols", () => {
    expect(
      getPartIdentity({ rootNote: "C", noteCollectionKey: "major" }),
    ).toMatchObject({
      accessibleLabel: "C M",
      collectionName: "M",
      isChord: true,
      label: "CM",
      rootNote: "C",
      separator: "",
    });

    expect(
      getPartIdentity({ rootNote: "C", noteCollectionKey: "major7" }),
    ).toMatchObject({
      accessibleLabel: "C M7",
      collectionName: "M7",
      isChord: true,
      label: "CM7",
      separator: "",
    });
  });

  it("formats scale collections with a readable space", () => {
    expect(
      getPartIdentity({ rootNote: "C", noteCollectionKey: "ionian" }),
    ).toMatchObject({
      accessibleLabel: "C Major",
      collectionName: "Major",
      isChord: false,
      label: "C Major",
      separator: " ",
    });
  });

  it("falls back safely for unknown collection keys", () => {
    expect(
      getPartIdentity({ rootNote: "C", noteCollectionKey: "customThing" }),
    ).toMatchObject({
      accessibleLabel: "C customThing",
      collectionName: "customThing",
      isChord: false,
      label: "C customThing",
      separator: " ",
    });
  });
});
