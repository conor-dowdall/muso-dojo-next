import { describe, expect, it } from "vitest";
import { getObjectManagementActions } from "../objectMenuCopy";

describe("object management copy", () => {
  it("uses Delete for sessions", () => {
    const [, dangerCopy] = getObjectManagementActions("session");

    expect(dangerCopy.label).toBe("Delete");
    expect(dangerCopy.confirmButtonLabel).toBe("Delete");
    expect(dangerCopy.confirmLabel).toBe("Delete this session?");
  });

  it("uses Remove for parts, instruments, and drones", () => {
    const [, partDangerCopy] = getObjectManagementActions("part");
    const [, instrumentDangerCopy] = getObjectManagementActions("instrument");
    const [, droneDangerCopy] = getObjectManagementActions("drone");

    expect(partDangerCopy.label).toBe("Remove");
    expect(partDangerCopy.confirmLabel).toBe("Remove this part?");
    expect(instrumentDangerCopy.label).toBe("Remove");
    expect(instrumentDangerCopy.confirmLabel).toBe("Remove this instrument?");
    expect(droneDangerCopy.label).toBe("Remove");
    expect(droneDangerCopy.confirmLabel).toBe("Remove this drone?");
  });

  it("keeps management labels scoped to object lifecycle actions", () => {
    const [sessionDuplicate] = getObjectManagementActions("session");
    const [partDuplicate] = getObjectManagementActions("part");
    const [instrumentDuplicate] = getObjectManagementActions("instrument");
    const [droneDuplicate] = getObjectManagementActions("drone");

    expect(sessionDuplicate.ariaLabel).toBe("Duplicate session");
    expect(partDuplicate.ariaLabel).toBe("Duplicate part");
    expect(instrumentDuplicate.ariaLabel).toBe("Duplicate instrument");
    expect(droneDuplicate.ariaLabel).toBe("Duplicate drone");
  });

  it("keeps management actions ordered as duplicate then danger", () => {
    const actions = getObjectManagementActions("instrument");

    expect(actions.map((action) => action.kind)).toStrictEqual([
      "duplicate",
      "danger",
    ]);
  });

  it("formats named session delete confirmation copy", () => {
    const [, dangerCopy] = getObjectManagementActions("session", {
      objectName: "Lydian Shapes",
    });

    expect(dangerCopy.confirmLabel).toBe("Delete Lydian Shapes?");
    expect(dangerCopy.confirmAriaLabel).toBe(
      "Confirm deleting Lydian Shapes. This cannot be undone.",
    );
  });
});
