import { describe, expect, it } from "vitest";
import {
  getPartModuleCreationActionLabel,
  getPartModuleCreationRequest,
} from "@/components/part-module-creation/partModuleCreationConfig";

describe("partModuleCreationConfig", () => {
  it("creates a drone module request", () => {
    const draft = {
      moduleType: "drone",
    } as const;

    expect(getPartModuleCreationActionLabel(draft)).toBe("Add Drone");
    expect(getPartModuleCreationRequest(draft)).toStrictEqual({
      type: "drone",
    });
  });
});
