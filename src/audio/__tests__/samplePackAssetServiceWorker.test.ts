import { beforeEach, describe, expect, it, vi } from "vitest";

const waitForServiceWorkerControl = vi.hoisted(() => vi.fn());

vi.mock("@/audio/waitForServiceWorkerControl", () => ({
  waitForServiceWorkerControl,
}));

import {
  clearSamplePackAssetCacheForTests,
  loadSamplePackAsset,
} from "@/audio/samplePackLibrary";

describe("sample-pack service-worker coordination", () => {
  beforeEach(() => {
    clearSamplePackAssetCacheForTests();
    vi.restoreAllMocks();
    waitForServiceWorkerControl.mockReset();
  });

  it("does not fetch an Ogg pack until service-worker control settles", async () => {
    let finishWaiting: (controlled: boolean) => void = () => undefined;
    waitForServiceWorkerControl.mockReturnValue(
      new Promise<boolean>((resolve) => {
        finishWaiting = resolve;
      }),
    );
    const arrayBuffer = new ArrayBuffer(8);
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(arrayBuffer));
    const loading = loadSamplePackAsset("piano");

    await Promise.resolve();
    expect(fetchMock).not.toHaveBeenCalled();

    finishWaiting(true);

    await expect(loading).resolves.toEqual(arrayBuffer);
    expect(waitForServiceWorkerControl).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith("/audio/v1/piano.ogg");
  });

  it("shares one control gate across concurrent Ogg pack loads", async () => {
    let finishWaiting: (controlled: boolean) => void = () => undefined;
    waitForServiceWorkerControl.mockReturnValue(
      new Promise<boolean>((resolve) => {
        finishWaiting = resolve;
      }),
    );
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      Promise.resolve(
        new Response(new ArrayBuffer(8), {
          status: 200,
        }),
      ),
    );
    const loading = Promise.all([
      loadSamplePackAsset("piano"),
      loadSamplePackAsset("percussion"),
    ]);

    await Promise.resolve();
    expect(waitForServiceWorkerControl).toHaveBeenCalledOnce();
    expect(fetchMock).not.toHaveBeenCalled();

    finishWaiting(true);
    await loading;

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
