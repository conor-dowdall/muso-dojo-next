import { describe, expect, it } from "vitest";
import {
  getObjectManagementActions,
  getObjectMenuTitle,
  getObjectMenuTriggerLabel,
} from "../objectMenuCopy";

describe("object menu copy", () => {
  it("uses Delete for sessions", () => {
    const [, dangerCopy] = getObjectManagementActions("session");

    expect(dangerCopy.label).toBe("Delete");
    expect(dangerCopy.confirmButtonLabel).toBe("Delete");
    expect(dangerCopy.confirmLabel).toBe("Delete this session?");
  });

  it("uses Remove for parts and instruments", () => {
    const [, partDangerCopy] = getObjectManagementActions("part");
    const [, instrumentDangerCopy] = getObjectManagementActions("instrument");

    expect(partDangerCopy.label).toBe("Remove");
    expect(partDangerCopy.confirmLabel).toBe("Remove this part?");
    expect(instrumentDangerCopy.label).toBe("Remove");
    expect(instrumentDangerCopy.confirmLabel).toBe("Remove this instrument?");
  });

  it("keeps menu titles and trigger labels consistent", () => {
    expect(getObjectMenuTitle("session")).toBe("Session Menu");
    expect(getObjectMenuTriggerLabel("session")).toBe("Session menu");
    expect(getObjectMenuTitle("part")).toBe("Part Menu");
    expect(getObjectMenuTriggerLabel("part")).toBe("Part menu");
    expect(getObjectMenuTitle("instrument")).toBe("Instrument Menu");
    expect(getObjectMenuTriggerLabel("instrument")).toBe("Instrument menu");
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
