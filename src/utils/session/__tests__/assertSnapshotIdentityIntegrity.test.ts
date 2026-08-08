import { describe, expect, it } from "vitest";
import {
  assertSnapshotIdentityIntegrity,
  SnapshotIdentityIntegrityError,
} from "@/utils/session/assertSnapshotIdentityIntegrity";

describe("assertSnapshotIdentityIntegrity", () => {
  it("accepts canonical records and recoverable missing active pointers", () => {
    expect(() =>
      assertSnapshotIdentityIntegrity({
        activeWorkspace: { kind: "session", id: "missing-session" },
        arrangements: {
          arrangement: {
            id: "arrangement",
            entries: [{ id: "entry", sectionId: "section" }],
            sections: [{ id: "section" }],
          },
        },
        sessions: {
          session: { id: "session" },
        },
      }),
    ).not.toThrow();
  });

  it.each([
    {
      label: "a Session record-key mismatch",
      snapshot: {
        sessions: { record: { id: "embedded" } },
      },
    },
    {
      label: "a blank Section identifier",
      snapshot: {
        arrangements: {
          arrangement: {
            id: "arrangement",
            entries: [{ id: "entry", sectionId: "" }],
            sections: [{ id: "" }],
          },
        },
      },
    },
    {
      label: "duplicate Section identifiers",
      snapshot: {
        arrangements: {
          arrangement: {
            id: "arrangement",
            entries: [{ id: "entry", sectionId: "section" }],
            sections: [{ id: "section" }, { id: "section" }],
          },
        },
      },
    },
    {
      label: "a dangling Section reference",
      snapshot: {
        arrangements: {
          arrangement: {
            id: "arrangement",
            entries: [{ id: "entry", sectionId: "missing" }],
            sections: [{ id: "section" }],
          },
        },
      },
    },
  ])("rejects $label", ({ snapshot }) => {
    expect(() => assertSnapshotIdentityIntegrity(snapshot)).toThrow(
      SnapshotIdentityIntegrityError,
    );
  });
});
