import { describe, expect, it } from "vitest";
import { type ArrangementConfig } from "@/types/arrangement";
import { type SessionConfig } from "@/types/session";
import {
  countArrangementsUsingSession,
  getArrangementLibrarySubtitle,
} from "../arrangementLibraryFormatting";

const session = {
  id: "session-1",
  lastModified: "2026-01-02T00:00:00.000Z",
  parts: [{ id: "part-1" }],
} as SessionConfig;

function createArrangement(
  overrides: Partial<ArrangementConfig> = {},
): ArrangementConfig {
  return {
    entries: [{ id: "entry-1", sectionId: "section-1", playCount: 1 }],
    id: "arrangement-1",
    lastModified: "2026-01-01T00:00:00.000Z",
    name: "My Arrangement",
    playbackMode: "once",
    sections: [
      {
        id: "section-1",
        source: {
          capturedAt: "2026-01-01T00:00:00.000Z",
          sessionId: session.id,
          sessionLastModified: "2026-01-01T00:00:00.000Z",
          sessionName: "My Session",
          sessionTempoBpm: 120,
        },
      },
    ],
    tempoBpm: 120,
    ...overrides,
  } as ArrangementConfig;
}

describe("getArrangementLibrarySubtitle", () => {
  it("keeps an empty Arrangement summary concise", () => {
    expect(
      getArrangementLibrarySubtitle(
        createArrangement({ entries: [], sections: [] }),
        {},
      ),
    ).toBe("No Sections Yet");
  });

  it("shows the visible Section count and tempo", () => {
    const arrangement = createArrangement();
    arrangement.sections[0]!.source.sessionLastModified = session.lastModified;

    expect(
      getArrangementLibrarySubtitle(arrangement, {
        [session.id]: session,
      }),
    ).toBe("1 Section • 120 BPM");
  });

  it("counts each changed source Session only once", () => {
    const arrangement = createArrangement({
      sections: [
        createArrangement().sections[0]!,
        {
          ...createArrangement().sections[0]!,
          id: "section-2",
        },
      ],
    });

    expect(
      getArrangementLibrarySubtitle(arrangement, {
        [session.id]: session,
      }),
    ).toBe("1 Section • 120 BPM • 1 Source Session Changed");
  });

  it("reports unavailable and emptied changed Sessions", () => {
    const arrangement = createArrangement();
    const emptiedSession: SessionConfig = { ...session, parts: [] };

    expect(getArrangementLibrarySubtitle(arrangement, {})).toBe(
      "1 Section • 120 BPM • 1 Source Session Unavailable",
    );
    expect(
      getArrangementLibrarySubtitle(arrangement, {
        [session.id]: emptiedSession,
      }),
    ).toBe("1 Section • 120 BPM • 1 Source Session Changed");
  });

  it("counts Arrangements that use a Session without counting repeated Sections", () => {
    const arrangement = createArrangement({
      sections: [
        createArrangement().sections[0]!,
        {
          ...createArrangement().sections[0]!,
          id: "section-2",
        },
      ],
    });

    expect(
      countArrangementsUsingSession(
        [arrangement, createArrangement({ id: "arrangement-2" })],
        session.id,
      ),
    ).toBe(2);
  });
});
