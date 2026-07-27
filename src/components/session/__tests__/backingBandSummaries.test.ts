import { describe, expect, it } from "vitest";
import { type MusicPartConfig } from "@/types/session";
import { DEFAULT_RHYTHM_SELECTION } from "@/utils/rhythm/rhythmConfig";
import { reconcilePartBandAfterModuleRemoval } from "@/utils/music-part/partBand";
import {
  getBackingNotesSummary,
  getBackingRhythmSummary,
  getBandChoosesRhythmSummary,
  getSessionBandCoverageSummary,
} from "../backingBandSummaries";

type TestMusicPart = MusicPartConfig & {
  band: NonNullable<MusicPartConfig["band"]>;
};

function createPart(id: string, style: "standard" | "swing"): TestMusicPart {
  return {
    automaticRhythm: { style },
    band: {
      backingNotes: { mode: "session" },
      rhythm: { mode: "session" },
    },
    id,
    modules: [],
    noteCollectionKey: "major",
    rootNote: "C",
  };
}

describe("backing band summaries", () => {
  it("uses the same compact value list for Backing Notes", () => {
    expect(
      getBackingNotesSummary({ audioPresetId: "piano", octaveOffset: 0 }),
    ).toBe("Piano • Octave 3");
  });

  it("uses the complete musical value list for a concrete Rhythm", () => {
    expect(getBackingRhythmSummary(DEFAULT_RHYTHM_SELECTION)).toBe(
      "4/4 • Kit • Hi-Hat • 2 per Beat",
    );
  });

  it("summarizes Band Chooses without claiming a fixed meter", () => {
    expect(
      getBandChoosesRhythmSummary([
        createPart("straight", "standard"),
        createPart("swing", "swing"),
      ]),
    ).toBe("Kit • Hi-Hat or Ride • 2 per Beat or Swing Eighths");
  });

  it("only summarizes Parts routed to the Session Band", () => {
    const localRhythmPart = createPart("local", "swing");
    localRhythmPart.modules = [
      { id: "rhythm", rhythm: DEFAULT_RHYTHM_SELECTION, type: "rhythm" },
    ];
    localRhythmPart.band = {
      backingNotes: { mode: "session" },
      rhythm: { mode: "module", moduleId: "rhythm" },
    };

    expect(
      getBandChoosesRhythmSummary([
        createPart("session", "standard"),
        localRhythmPart,
      ]),
    ).toBe("Kit • Hi-Hat • 2 per Beat");
  });

  describe("Session Band coverage", () => {
    it("handles a Session without Parts", () => {
      expect(getSessionBandCoverageSummary([], "backingNotes")).toBe(
        "No Parts in Session",
      );
      expect(getSessionBandCoverageSummary([], "rhythm")).toBe(
        "No Parts in Session",
      );
    });

    it("uses singular and all-Parts copy for Session sources", () => {
      expect(
        getSessionBandCoverageSummary(
          [createPart("only", "standard")],
          "rhythm",
        ),
      ).toBe("Applies to 1 Part");
      expect(
        getSessionBandCoverageSummary(
          [createPart("first", "standard"), createPart("second", "swing")],
          "backingNotes",
        ),
      ).toBe("Applies to all 2 Parts");
    });

    it("summarizes mixed Rhythm sources and omits zero counts", () => {
      const sessionPart = createPart("session", "standard");
      const secondSessionPart = createPart("second-session", "standard");
      const localPart = createPart("local", "swing");
      const offPart = createPart("off", "standard");
      localPart.modules = [
        {
          id: "local-rhythm",
          rhythm: DEFAULT_RHYTHM_SELECTION,
          type: "rhythm",
        },
      ];
      localPart.band.rhythm = {
        mode: "module",
        moduleId: "local-rhythm",
      };
      offPart.band.rhythm = { mode: "off" };

      expect(
        getSessionBandCoverageSummary(
          [sessionPart, secondSessionPart, localPart, offPart],
          "rhythm",
        ),
      ).toBe("Applies to 2 Parts • 1 local Rhythm • 1 Rhythm Off");
    });

    it("summarizes mixed Backing Notes sources", () => {
      const sessionPart = createPart("session", "standard");
      const secondSessionPart = createPart("second-session", "standard");
      const localPart = createPart("local", "standard");
      const offPart = createPart("off", "standard");
      localPart.modules = [
        {
          id: "local-looper",
          type: "exercise-looper",
        },
      ];
      localPart.band.backingNotes = {
        mode: "module",
        moduleId: "local-looper",
      };
      offPart.band.backingNotes = { mode: "off" };

      expect(
        getSessionBandCoverageSummary(
          [sessionPart, secondSessionPart, localPart, offPart],
          "backingNotes",
        ),
      ).toBe("Applies to 2 Parts • 1 local Looper • 1 Backing Notes Off");
    });

    it("pluralizes local modules and preserves Off capitalization", () => {
      const localParts = ["first", "second"].map((id) => {
        const part = createPart(id, "standard");
        const moduleId = `${id}-rhythm`;
        part.modules = [
          {
            id: moduleId,
            rhythm: DEFAULT_RHYTHM_SELECTION,
            type: "rhythm",
          },
        ];
        part.band.rhythm = { mode: "module", moduleId };
        return part;
      });
      const offPart = createPart("off", "standard");
      offPart.band.rhythm = { mode: "off" };

      expect(
        getSessionBandCoverageSummary([...localParts, offPart], "rhythm"),
      ).toBe("Applies to 0 Parts • 2 local Rhythms • 1 Rhythm Off");
    });

    it("summarizes all-local and all-Off Backing Notes", () => {
      const localParts = ["first", "second"].map((id) => {
        const part = createPart(id, "standard");
        const moduleId = `${id}-looper`;
        part.modules = [{ id: moduleId, type: "exercise-looper" }];
        part.band.backingNotes = { mode: "module", moduleId };
        return part;
      });
      const offParts = ["first", "second"].map((id) => {
        const part = createPart(id, "standard");
        part.band.backingNotes = { mode: "off" };
        return part;
      });

      expect(getSessionBandCoverageSummary(localParts, "backingNotes")).toBe(
        "Applies to 0 Parts • 2 local Loopers",
      );
      expect(getSessionBandCoverageSummary(offParts, "backingNotes")).toBe(
        "Applies to 0 Parts • 2 Backing Notes Off",
      );
    });

    it("updates when a local module is removed and its Part returns to Session", () => {
      const localPart = createPart("local", "standard");
      localPart.modules = [
        {
          id: "local-rhythm",
          rhythm: DEFAULT_RHYTHM_SELECTION,
          type: "rhythm",
        },
      ];
      localPart.band.rhythm = {
        mode: "module",
        moduleId: "local-rhythm",
      };

      expect(getSessionBandCoverageSummary([localPart], "rhythm")).toBe(
        "Applies to 0 Parts • 1 local Rhythm",
      );

      const reconciledPart = reconcilePartBandAfterModuleRemoval(
        localPart,
        "local-rhythm",
      );
      reconciledPart.modules = [];

      expect(getSessionBandCoverageSummary([reconciledPart], "rhythm")).toBe(
        "Applies to 1 Part",
      );
    });
  });
});
