import { describe, expect, it } from "vitest";
import { normalizeSessionConfig } from "@/utils/session/normalizeSessionConfig";

describe("normalizeSessionConfig", () => {
  it("keeps valid session pulse settings", () => {
    expect(
      normalizeSessionConfig({
        countInBeats: 3,
        id: "session-1",
        lastModified: "2026-06-07T00:00:00.000Z",
        metronomeEnabled: false,
        name: "Practice",
        parts: [],
        tempoBpm: 132,
      }),
    ).toMatchObject({
      countInBeats: 3,
      metronomeEnabled: false,
      tempoBpm: 132,
    });
  });

  it("omits default and invalid session pulse settings", () => {
    const session = normalizeSessionConfig({
      countInBeats: 0,
      id: "session-1",
      lastModified: "2026-06-07T00:00:00.000Z",
      metronomeEnabled: true,
      name: "Practice",
      parts: [],
      tempoBpm: 80,
    });

    expect(session).not.toHaveProperty("countInBeats");
    expect(session).not.toHaveProperty("metronomeEnabled");
    expect(session).not.toHaveProperty("tempoBpm");
  });

  it("keeps an explicit count-in now that immediate playback is the default", () => {
    expect(
      normalizeSessionConfig({
        countInBeats: 4,
        id: "session-1",
        lastModified: "2026-06-07T00:00:00.000Z",
        name: "Practice",
        parts: [],
      }),
    ).toMatchObject({ countInBeats: 4 });
  });
});
