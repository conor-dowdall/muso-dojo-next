import { describe, expect, it, vi } from "vitest";
import { DronePlaybackCoordinator } from "@/hooks/audio/dronePlaybackCoordinator";

describe("DronePlaybackCoordinator", () => {
  it("stops the previously active drone when another drone activates", () => {
    const coordinator = new DronePlaybackCoordinator();
    const stopFirst = vi.fn();
    const stopSecond = vi.fn();

    coordinator.register("first", { stopAll: stopFirst });
    coordinator.register("second", { stopAll: stopSecond });

    coordinator.activate("first");
    coordinator.activate("first");
    coordinator.activate("second");
    coordinator.activate("second");

    expect(stopFirst).toHaveBeenCalledOnce();
    expect(stopSecond).not.toHaveBeenCalled();
  });

  it("does not stop a cleared inactive drone", () => {
    const coordinator = new DronePlaybackCoordinator();
    const stopFirst = vi.fn();
    const stopSecond = vi.fn();

    coordinator.register("first", { stopAll: stopFirst });
    coordinator.register("second", { stopAll: stopSecond });

    coordinator.activate("first");
    coordinator.clear("first");
    coordinator.activate("second");

    expect(stopFirst).not.toHaveBeenCalled();
    expect(stopSecond).not.toHaveBeenCalled();
  });
});
