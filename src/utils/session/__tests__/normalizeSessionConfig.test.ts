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
});
