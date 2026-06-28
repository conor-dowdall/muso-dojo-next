import { describe, expect, it } from "vitest";
import { normalizeSessionConfig } from "@/utils/session/normalizeSessionConfig";

describe("normalizeSessionConfig", () => {
  it("keeps a valid session tempo", () => {
    expect(
      normalizeSessionConfig({
        id: "session-1",
        lastModified: "2026-06-07T00:00:00.000Z",
        name: "Practice",
        parts: [],
        tempoBpm: 132,
      }),
    ).toMatchObject({
      tempoBpm: 132,
    });
  });

  it("omits the default session tempo", () => {
    const session = normalizeSessionConfig({
      id: "session-1",
      lastModified: "2026-06-07T00:00:00.000Z",
      name: "Practice",
      parts: [],
      tempoBpm: 80,
    });

    expect(session).not.toHaveProperty("tempoBpm");
  });

  it("omits empty Practice Band settings", () => {
    const session = normalizeSessionConfig({
      id: "session-1",
      lastModified: "2026-06-07T00:00:00.000Z",
      name: "Practice",
      parts: [],
      practiceBand: {},
    });

    expect(session).not.toHaveProperty("practiceBand");
  });

  it("normalizes Practice Band settings and omits defaults", () => {
    expect(
      normalizeSessionConfig({
        id: "session-1",
        lastModified: "2026-06-07T00:00:00.000Z",
        name: "Practice",
        parts: [],
        practiceBand: {
          audioPresetId: "piano",
          backingNotes: false,
          drums: false,
          octaveOffset: 0,
        },
      }),
    ).toMatchObject({
      practiceBand: {
        audioPresetId: "piano",
        backingNotes: false,
        drums: false,
        octaveOffset: 0,
      },
    });

    const defaultSession = normalizeSessionConfig({
      id: "session-1",
      lastModified: "2026-06-07T00:00:00.000Z",
      name: "Practice",
      parts: [],
      practiceBand: {
        audioPresetId: "plucked-string",
        backingNotes: true,
        drums: true,
        octaveOffset: -1,
      },
    });

    expect(defaultSession).not.toHaveProperty("practiceBand");
  });

  it("keeps partial Practice Band settings", () => {
    expect(
      normalizeSessionConfig({
        id: "session-1",
        lastModified: "2026-06-07T00:00:00.000Z",
        name: "Practice",
        parts: [],
        practiceBand: {
          drums: false,
        },
      }),
    ).toMatchObject({
      practiceBand: {
        drums: false,
      },
    });
  });
});
