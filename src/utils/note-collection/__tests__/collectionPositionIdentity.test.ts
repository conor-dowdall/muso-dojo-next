import { describe, expect, it } from "vitest";
import { resolveCollectionPositionMatch } from "@/utils/note-collection/collectionPositionIdentity";

describe("resolveCollectionPositionMatch", () => {
  it("preserves collection position when collection sizes match", () => {
    const match = resolveCollectionPositionMatch({
      candidates: [
        {
          collectionPosition: 0,
          collectionSize: 3,
          id: "root",
          intervalDegree: 1,
        },
        {
          collectionPosition: 1,
          collectionSize: 3,
          id: "flat-third",
          intervalDegree: 3,
        },
      ],
      identity: {
        collectionPosition: 1,
        collectionSize: 3,
        intervalDegree: 3,
      },
    });

    expect(match?.id).toBe("flat-third");
  });

  it("preserves interval degree when same-sized collections have different degree patterns", () => {
    const match = resolveCollectionPositionMatch({
      candidates: [
        {
          collectionDegreeSignature: "1,3,5,6,9",
          collectionPosition: 0,
          collectionSize: 5,
          id: "root",
          intervalDegree: 1,
        },
        {
          collectionDegreeSignature: "1,3,5,6,9",
          collectionPosition: 1,
          collectionSize: 5,
          id: "third",
          intervalDegree: 3,
        },
      ],
      identity: {
        collectionDegreeSignature: "1,2,3,5,6",
        collectionPosition: 2,
        collectionSize: 5,
        intervalDegree: 3,
      },
    });

    expect(match?.id).toBe("third");
  });

  it("preserves interval degree when collection sizes change", () => {
    const match = resolveCollectionPositionMatch({
      candidates: [
        {
          collectionPosition: 1,
          collectionSize: 7,
          id: "second",
          intervalDegree: 2,
        },
        {
          collectionPosition: 2,
          collectionSize: 7,
          id: "third",
          intervalDegree: 3,
        },
      ],
      identity: {
        collectionPosition: 1,
        collectionSize: 3,
        intervalDegree: 3,
      },
    });

    expect(match?.id).toBe("third");
  });

  it("returns undefined when a changed collection cannot supply the degree", () => {
    const match = resolveCollectionPositionMatch({
      candidates: [
        {
          collectionPosition: 0,
          collectionSize: 3,
          intervalDegree: 1,
        },
        {
          collectionPosition: 1,
          collectionSize: 3,
          intervalDegree: 3,
        },
      ],
      identity: {
        collectionPosition: 8,
        collectionSize: 7,
        intervalDegree: 9,
      },
    });

    expect(match).toBeUndefined();
  });
});
