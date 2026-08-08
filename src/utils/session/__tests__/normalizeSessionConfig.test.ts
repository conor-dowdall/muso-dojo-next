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

  it("discards legacy Practice Band settings", () => {
    const session = normalizeSessionConfig({
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
    });

    expect(session).not.toHaveProperty("practiceBand");
  });

  it("repairs Module ids across Parts and remaps local band references", () => {
    const session = normalizeSessionConfig({
      id: "session-1",
      lastModified: "2026-06-07T00:00:00.000Z",
      name: "Practice",
      parts: [
        {
          band: {
            backingNotes: { mode: "session" },
            rhythm: { mode: "module", moduleId: "shared-module" },
          },
          id: "part-1",
          modules: [
            {
              id: "shared-module",
              rhythm: { source: "recipe" },
              type: "rhythm",
            },
          ],
        },
        {
          band: {
            backingNotes: { mode: "session" },
            rhythm: { mode: "module", moduleId: "shared-module" },
          },
          id: "part-2",
          modules: [
            {
              id: "shared-module",
              rhythm: { source: "recipe" },
              type: "rhythm",
            },
          ],
        },
      ],
    });

    expect(session.parts[0]?.modules[0]?.id).toBe("shared-module");
    expect(session.parts[1]?.modules[0]?.id).toBe("shared-module-copy");
    expect(session.parts[1]?.band?.rhythm).toEqual({
      mode: "module",
      moduleId: "shared-module-copy",
    });
  });
});
