import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AUDIO_STOP_RELEASE_SECONDS,
  DRONE_STOP_RELEASE_SECONDS,
  PERCUSSION_STOP_RELEASE_SECONDS,
} from "@/audio/audioStopConfig";
import { createWebAudioEngine } from "@/audio/createWebAudioEngine";
import {
  SAMPLE_PACK_IDS,
  clearSamplePackAssetCacheForTests,
  loadSamplePackAsset,
  preloadSamplePackAssets,
} from "@/audio/samplePackLibrary";

class MockAudioParam {
  readonly events: Array<{
    time: number;
    type: "cancel" | "ramp" | "set";
    value?: number;
  }> = [];
  value = 1;

  cancelScheduledValues(time: number) {
    this.events.push({ time, type: "cancel" });
    return this;
  }

  linearRampToValueAtTime(value: number, time: number) {
    this.events.push({ time, type: "ramp", value });
    this.value = value;
    return this;
  }

  setValueAtTime(value: number, time: number) {
    this.events.push({ time, type: "set", value });
    this.value = value;
    return this;
  }
}

class MockAudioNode {
  readonly context: BaseAudioContext;

  constructor(context: MockAudioContext) {
    this.context = context as unknown as BaseAudioContext;
  }

  connect(destination: AudioNode | AudioParam) {
    MockAudioContext.connectionCount += 1;
    return destination as AudioNode;
  }

  disconnect() {
    MockAudioContext.disconnectionCount += 1;
  }
}

class MockGainNode extends MockAudioNode {
  readonly gain = new MockAudioParam() as unknown as AudioParam;
}

class MockAudioBuffer {
  readonly duration: number;
  readonly length: number;
  readonly numberOfChannels: number;
  readonly sampleRate: number;
  private readonly channels: Float32Array[];

  constructor(numberOfChannels = 1, length = 48_000, sampleRate = 48_000) {
    this.duration = length / sampleRate;
    this.length = length;
    this.numberOfChannels = numberOfChannels;
    this.sampleRate = sampleRate;
    this.channels = Array.from(
      { length: numberOfChannels },
      () => new Float32Array(length),
    );
  }

  getChannelData(channel: number) {
    return this.channels[channel]!;
  }
}

class MockAudioBufferSourceNode extends MockAudioNode {
  readonly endedListeners = new Set<() => void>();
  readonly playbackRate = new MockAudioParam() as unknown as AudioParam;
  buffer: AudioBuffer | null = null;
  loop = false;
  loopEnd = 0;
  loopStart = 0;
  startCalls: Array<{
    duration?: number;
    offset?: number;
    time?: number;
  }> = [];
  stopCalls: Array<{ time?: number }> = [];

  addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    if (type === "ended" && typeof listener === "function") {
      this.endedListeners.add(listener as () => void);
    }
  }

  emitEnded() {
    this.endedListeners.forEach((listener) => listener());
    this.endedListeners.clear();
  }

  start(time?: number, offset?: number, duration?: number) {
    this.startCalls.push({ duration, offset, time });
    MockAudioContext.bufferSourceStartCalls.push({ duration, offset, time });
  }

  stop(time?: number) {
    this.stopCalls.push({ time });
    MockAudioContext.bufferSourceStopCalls.push({ time });
  }
}

class MockAudioContext {
  static bufferSourceStartCalls: Array<{
    duration?: number;
    offset?: number;
    time?: number;
  }> = [];
  static bufferSourceStopCalls: Array<{ time?: number }> = [];
  static bufferSources: MockAudioBufferSourceNode[] = [];
  static connectionCount = 0;
  static decodeCount = 0;
  static disconnectionCount = 0;
  static gainNodes: MockGainNode[] = [];
  static initialState: AudioContextState = "running";
  static lastInstance: MockAudioContext | undefined;
  static lastOptions: AudioContextOptions | undefined;
  static resumeCount = 0;

  readonly destination = new MockAudioNode(
    this,
  ) as unknown as AudioDestinationNode;
  readonly sampleRate = 48_000;
  currentTime = 0;
  state: AudioContextState;

  constructor(options?: AudioContextOptions) {
    this.state = MockAudioContext.initialState;
    MockAudioContext.lastInstance = this;
    MockAudioContext.lastOptions = options;
  }

  static resetCounts() {
    MockAudioContext.bufferSourceStartCalls = [];
    MockAudioContext.bufferSourceStopCalls = [];
    MockAudioContext.bufferSources = [];
    MockAudioContext.connectionCount = 0;
    MockAudioContext.decodeCount = 0;
    MockAudioContext.disconnectionCount = 0;
    MockAudioContext.gainNodes = [];
    MockAudioContext.initialState = "running";
    MockAudioContext.lastInstance = undefined;
    MockAudioContext.lastOptions = undefined;
    MockAudioContext.resumeCount = 0;
  }

  createBuffer(numberOfChannels: number, length: number, sampleRate: number) {
    return new MockAudioBuffer(
      numberOfChannels,
      length,
      sampleRate,
    ) as unknown as AudioBuffer;
  }

  createBufferSource() {
    const source = new MockAudioBufferSourceNode(this);

    MockAudioContext.bufferSources.push(source);
    return source as unknown as AudioBufferSourceNode;
  }

  createGain() {
    const gainNode = new MockGainNode(this);

    MockAudioContext.gainNodes.push(gainNode);
    return gainNode as unknown as GainNode;
  }

  decodeAudioData() {
    MockAudioContext.decodeCount += 1;
    return Promise.resolve(
      new MockAudioBuffer(1, 8 * 60 * 48_000, 48_000) as unknown as AudioBuffer,
    );
  }

  getOutputTimestamp() {
    return {
      contextTime: this.currentTime,
      performanceTime: 1234,
    } satisfies AudioTimestamp;
  }

  resume() {
    MockAudioContext.resumeCount += 1;
    this.state = "running";
    return Promise.resolve();
  }
}

class MockOfflineAudioContext {
  static instanceCount = 0;

  readonly sampleRate: number;

  constructor(options?: OfflineAudioContextOptions | number) {
    MockOfflineAudioContext.instanceCount += 1;
    this.sampleRate =
      typeof options === "object" && options ? options.sampleRate : 48_000;
  }

  static resetCounts() {
    MockOfflineAudioContext.instanceCount = 0;
  }

  decodeAudioData() {
    MockAudioContext.decodeCount += 1;
    return Promise.resolve(
      new MockAudioBuffer(1, 8 * 60 * 48_000, 48_000) as unknown as AudioBuffer,
    );
  }
}

function installMockAudioWindow({
  offline = false,
  search = "",
}: { offline?: boolean; search?: string } = {}) {
  MockAudioContext.resetCounts();
  MockOfflineAudioContext.resetCounts();
  vi.stubGlobal("window", {
    AudioContext: MockAudioContext,
    ...(offline ? { OfflineAudioContext: MockOfflineAudioContext } : {}),
    clearTimeout: globalThis.clearTimeout,
    location: { search } satisfies Partial<Location>,
    setTimeout: globalThis.setTimeout,
  });
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve({
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
        ok: true,
      } satisfies Pick<Response, "arrayBuffer" | "ok">),
    ),
  );
}

describe("createWebAudioEngine", () => {
  afterEach(() => {
    clearSamplePackAssetCacheForTests();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("primes all generated sample packs on an interactive context", async () => {
    installMockAudioWindow();

    const engine = createWebAudioEngine();
    const prepared = await engine.prime();

    expect(prepared).toBe(true);
    expect(MockAudioContext.lastOptions).toMatchObject({
      latencyHint: "interactive",
    });
    expect(fetch).toHaveBeenCalledTimes(SAMPLE_PACK_IDS.length);
    expect(MockAudioContext.decodeCount).toBe(SAMPLE_PACK_IDS.length);
  });

  it("warms generated sample packs without resuming a suspended context", async () => {
    installMockAudioWindow();
    MockAudioContext.initialState = "suspended";

    const engine = createWebAudioEngine();
    const warmed = await engine.warm();

    expect(warmed).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(SAMPLE_PACK_IDS.length);
    expect(MockAudioContext.decodeCount).toBe(SAMPLE_PACK_IDS.length);
    expect(MockAudioContext.resumeCount).toBe(0);
    expect(MockAudioContext.lastInstance?.state).toBe("suspended");

    const prepared = await engine.prime();

    expect(prepared).toBe(true);
    expect(MockAudioContext.resumeCount).toBe(1);
    expect(MockAudioContext.decodeCount).toBe(SAMPLE_PACK_IDS.length);
    expect(fetch).toHaveBeenCalledTimes(SAMPLE_PACK_IDS.length);
  });

  it("prefers an offline context when warming generated sample packs", async () => {
    installMockAudioWindow({ offline: true });
    MockAudioContext.initialState = "suspended";

    const engine = createWebAudioEngine();
    const warmed = await engine.warm();

    expect(warmed).toBe(true);
    expect(MockOfflineAudioContext.instanceCount).toBe(1);
    expect(MockAudioContext.lastInstance).toBeUndefined();
    expect(MockAudioContext.resumeCount).toBe(0);
    expect(MockAudioContext.decodeCount).toBe(SAMPLE_PACK_IDS.length);

    const prepared = await engine.prime();

    expect(prepared).toBe(true);
    expect(MockAudioContext.resumeCount).toBe(1);
    expect(MockAudioContext.decodeCount).toBe(SAMPLE_PACK_IDS.length);
    expect(fetch).toHaveBeenCalledTimes(SAMPLE_PACK_IDS.length);
  });

  it("shares sample fetches when a sample asset request overlaps with priming", async () => {
    installMockAudioWindow();

    const engine = createWebAudioEngine();

    await Promise.all([loadSamplePackAsset("piano"), engine.prime()]);

    expect(fetch).toHaveBeenCalledTimes(SAMPLE_PACK_IDS.length);
    expect(MockAudioContext.decodeCount).toBe(SAMPLE_PACK_IDS.length);
  });

  it("shares sample fetches when background sample preloading overlaps with priming", async () => {
    installMockAudioWindow();

    const engine = createWebAudioEngine();

    await Promise.all([preloadSamplePackAssets(), engine.prime()]);

    expect(fetch).toHaveBeenCalledTimes(SAMPLE_PACK_IDS.length);
    expect(MockAudioContext.decodeCount).toBe(SAMPLE_PACK_IDS.length);
  });

  it("shares sample fetches when a note preview overlaps with priming", async () => {
    installMockAudioWindow();

    const engine = createWebAudioEngine();

    await Promise.all([
      engine.prime(),
      engine.playNote({
        midiNote: 60,
        presetId: "piano",
        use: "preview",
      }),
    ]);

    expect(fetch).toHaveBeenCalledTimes(SAMPLE_PACK_IDS.length);
    expect(MockAudioContext.decodeCount).toBe(SAMPLE_PACK_IDS.length);
  });

  it("does not start an aborted note preview after its sample finishes loading", async () => {
    installMockAudioWindow();

    let resolveDecode: (buffer: AudioBuffer) => void = () => undefined;
    const decodeSpy = vi
      .spyOn(MockAudioContext.prototype, "decodeAudioData")
      .mockImplementation(
        () =>
          new Promise<AudioBuffer>((resolve) => {
            resolveDecode = resolve;
          }),
      );
    const engine = createWebAudioEngine();
    const controller = new AbortController();
    const preview = engine.playNote({
      midiNote: 60,
      presetId: "piano",
      signal: controller.signal,
      use: "preview",
    });

    controller.abort();
    resolveDecode(
      new MockAudioBuffer(1, 8 * 60 * 48_000, 48_000) as unknown as AudioBuffer,
    );

    await expect(preview).resolves.toBeUndefined();
    expect(MockAudioContext.bufferSourceStartCalls).toHaveLength(0);

    decodeSpy.mockRestore();
  });

  it("plays notes through their mapped sample pack", async () => {
    installMockAudioWindow();

    const engine = createWebAudioEngine();
    const handle = await engine.playNote({
      midiNote: 60,
      presetId: "piano",
      use: "preview",
    });
    const source = MockAudioContext.bufferSources.at(-1)!;

    expect(handle).toBeDefined();
    expect(fetch).toHaveBeenCalledWith("/audio/v1/piano.ogg");
    expect(source.loop).toBe(false);
    expect(source.startCalls.at(-1)?.time).toBe(0);
    expect(source.startCalls.at(-1)?.offset).toBeGreaterThan(0);
  });

  it("can audition wav sample sprites from the browser format flag", async () => {
    installMockAudioWindow({ search: "?audioFormat=wav" });

    const engine = createWebAudioEngine();
    const handle = await engine.playNote({
      midiNote: 60,
      presetId: "piano",
      use: "preview",
    });

    expect(handle).toBeDefined();
    expect(fetch).toHaveBeenCalledWith("/audio/v1/piano.wav");
  });

  it("schedules exercise notes from decoded sprites", async () => {
    installMockAudioWindow();

    const engine = createWebAudioEngine();
    await engine.prime();
    const group = engine.createPlaybackGroup();
    const handle = engine.scheduleNote({
      durationSeconds: 0.25,
      group,
      midiNote: 64,
      presetId: "plucked-string",
      startTime: 1.5,
      use: "exercise",
      velocity: 0.7,
    });
    const source = MockAudioContext.bufferSources.at(-1)!;

    expect(handle).toBeDefined();
    expect(source.startCalls.at(-1)?.time).toBe(1.5);
    expect(source.startCalls.at(-1)?.duration).toBeGreaterThan(0);
    expect(
      (source.playbackRate as unknown as MockAudioParam).events.at(-1)?.value,
    ).toBeGreaterThan(0);
  });

  it("notifies voice-end subscribers when a sample source ends", async () => {
    installMockAudioWindow();

    const engine = createWebAudioEngine();
    const handle = await engine.playNote({
      durationSeconds: 0.2,
      midiNote: 60,
      use: "preview",
    });
    const listener = vi.fn();

    engine.subscribeToVoiceEnd(handle!, listener);
    MockAudioContext.bufferSources.at(-1)?.emitEnded();

    expect(listener).toHaveBeenCalledOnce();
  });

  it("notifies a late subscriber without retaining completed voice handles", async () => {
    installMockAudioWindow();

    const engine = createWebAudioEngine();
    const handle = await engine.playNote({
      durationSeconds: 0.2,
      midiNote: 60,
      use: "preview",
    });
    const listener = vi.fn();

    MockAudioContext.bufferSources.at(-1)?.emitEnded();
    engine.subscribeToVoiceEnd(handle!, listener);
    await Promise.resolve();

    expect(listener).toHaveBeenCalledOnce();
  });

  it("keeps the metronome on buffer sources and cancels grouped playback", async () => {
    installMockAudioWindow();

    const engine = createWebAudioEngine();
    await engine.prime();
    const group = engine.createPlaybackGroup();
    const voiceHandle = engine.scheduleNote({
      durationSeconds: 0.25,
      group,
      midiNote: 60,
      startTime: 2,
      use: "exercise",
    });
    const clickScheduled = engine.scheduleMetronomeClick({
      group,
      startTime: 2.25,
    });

    engine.cancelPlaybackGroup(group);

    expect(voiceHandle).toBeDefined();
    expect(clickScheduled).toBe(true);
    expect(
      MockAudioContext.bufferSourceStopCalls.some(
        (call) => call.time !== undefined && call.time <= 2.25,
      ),
    ).toBe(true);
  });

  it("can schedule grouped playback cancellation at a future audio time", async () => {
    vi.useFakeTimers();
    installMockAudioWindow();

    const engine = createWebAudioEngine();
    await engine.prime();
    MockAudioContext.lastInstance!.currentTime = 1;
    const group = engine.createPlaybackGroup();
    const groupGain = MockAudioContext.gainNodes.at(-1)!
      .gain as unknown as MockAudioParam;
    const voiceHandle = engine.scheduleNote({
      durationSeconds: 1,
      group,
      midiNote: 60,
      startTime: 1.1,
      use: "exercise",
    });
    const clickScheduled = engine.scheduleMetronomeClick({
      group,
      startTime: 1.2,
    });

    engine.cancelPlaybackGroup(group, { atTime: 1.5, releaseSeconds: 0.02 });

    expect(voiceHandle).toBeDefined();
    expect(clickScheduled).toBe(true);
    expect(
      groupGain.events.some(
        (event) =>
          event.type === "ramp" &&
          event.time === 1.52 &&
          event.value === 0.0001,
      ),
    ).toBe(true);
    expect(groupGain.events).toContainEqual({
      time: 1.5,
      type: "set",
      value: 1,
    });
    expect(
      engine.scheduleNote({
        durationSeconds: 1,
        group,
        midiNote: 60,
        startTime: 1.6,
        use: "exercise",
      }),
    ).toBeUndefined();
    expect(
      engine.scheduleMetronomeClick({
        group,
        startTime: 1.6,
      }),
    ).toBe(false);
  });

  it("can clear a future group cancellation before its audio boundary", async () => {
    vi.useFakeTimers();
    installMockAudioWindow();

    const engine = createWebAudioEngine();
    await engine.prime();
    MockAudioContext.lastInstance!.currentTime = 1;
    const group = engine.createPlaybackGroup();
    const groupGain = MockAudioContext.gainNodes.at(-1)!
      .gain as unknown as MockAudioParam;

    engine.cancelPlaybackGroup(group, { atTime: 1.5, releaseSeconds: 0.02 });
    MockAudioContext.lastInstance!.currentTime = 1.25;

    expect(engine.clearPlaybackGroupCancellation(group)).toBe(true);
    expect(groupGain.events).toContainEqual({ time: 1.25, type: "cancel" });
    expect(groupGain.events).toContainEqual({
      time: 1.25,
      type: "set",
      value: 1,
    });
    expect(
      engine.scheduleNote({
        durationSeconds: 1,
        group,
        midiNote: 60,
        startTime: 1.6,
        use: "exercise",
      }),
    ).toBeDefined();

    await vi.advanceTimersByTimeAsync(1_000);

    expect(
      engine.scheduleMetronomeClick({
        group,
        startTime: 2.5,
      }),
    ).toBe(true);
  });

  it("lets an immediate group cancellation preempt a scheduled future cancellation", async () => {
    vi.useFakeTimers();
    installMockAudioWindow();

    const engine = createWebAudioEngine();
    await engine.prime();
    MockAudioContext.lastInstance!.currentTime = 1;
    const group = engine.createPlaybackGroup();

    engine.scheduleNote({
      durationSeconds: 1,
      group,
      midiNote: 60,
      startTime: 1.1,
      use: "exercise",
    });
    engine.cancelPlaybackGroup(group, { atTime: 1.5, releaseSeconds: 0.02 });
    MockAudioContext.lastInstance!.currentTime = 1.25;
    engine.cancelPlaybackGroup(group);

    expect(
      MockAudioContext.bufferSourceStopCalls.some(
        (call) => call.time !== undefined && call.time <= 1.35,
      ),
    ).toBe(true);
  });

  it("uses a musical release when cancelling sample voices immediately", async () => {
    installMockAudioWindow();

    const engine = createWebAudioEngine();
    await engine.prime();
    const group = engine.createPlaybackGroup();
    MockAudioContext.lastInstance!.currentTime = 1;

    const handle = engine.scheduleNote({
      durationSeconds: 1,
      group,
      midiNote: 60,
      startTime: 1,
      use: "exercise",
    });
    MockAudioContext.lastInstance!.currentTime = 1.25;
    engine.cancelPlaybackGroup(group);

    expect(handle).toBeDefined();
    expect(MockAudioContext.bufferSourceStopCalls.at(-1)?.time).toBeCloseTo(
      1.25 + AUDIO_STOP_RELEASE_SECONDS + 0.01,
    );
  });

  it("de-clicks percussion hits when grouped playback is cancelled", async () => {
    installMockAudioWindow();

    const engine = createWebAudioEngine();
    await engine.prime();
    const group = engine.createPlaybackGroup();
    MockAudioContext.lastInstance!.currentTime = 3;

    expect(
      engine.schedulePercussionHit({
        group,
        sampleId: "kick",
        startTime: 3,
      }),
    ).toBe(true);

    MockAudioContext.lastInstance!.currentTime = 3.05;
    engine.cancelPlaybackGroup(group);

    expect(MockAudioContext.bufferSourceStopCalls.at(-1)?.time).toBeCloseTo(
      3.05 + PERCUSSION_STOP_RELEASE_SECONDS + 0.001,
    );
  });

  it("uses the shared gentle stop policy for global all-stop", async () => {
    installMockAudioWindow();

    const engine = createWebAudioEngine();
    const voiceHandle = await engine.playNote({
      durationSeconds: 1,
      midiNote: 60,
      use: "preview",
    });
    const droneHandle = await engine.createDrone({
      notes: [{ id: "root", midiNote: 60 }],
      presetId: "bowed-strings",
      use: "drone",
    });
    MockAudioContext.lastInstance!.currentTime = 0.5;

    engine.stopAll();

    expect(voiceHandle).toBeDefined();
    expect(droneHandle).toBeDefined();
    expect(
      MockAudioContext.bufferSourceStopCalls.some((call) =>
        call.time
          ? Math.abs(call.time - (0.5 + AUDIO_STOP_RELEASE_SECONDS + 0.01)) <
            0.000_001
          : false,
      ),
    ).toBe(true);
    expect(
      MockAudioContext.bufferSourceStopCalls.some((call) =>
        call.time
          ? Math.abs(call.time - (0.5 + DRONE_STOP_RELEASE_SECONDS + 0.01)) <
            0.000_001
          : false,
      ),
    ).toBe(true);
  });

  it("schedules regular and accented clicks from the percussion sprite", async () => {
    installMockAudioWindow();

    const engine = createWebAudioEngine();
    await engine.prime();
    const group = engine.createPlaybackGroup();

    expect(
      engine.scheduleMetronomeClick({
        accent: false,
        group,
        startTime: 1,
      }),
    ).toBe(true);
    expect(
      engine.scheduleMetronomeClick({
        accent: true,
        group,
        startTime: 2,
      }),
    ).toBe(true);

    const regularSource = MockAudioContext.bufferSources.at(-2)!;
    const accentSource = MockAudioContext.bufferSources.at(-1)!;
    const regularGain = MockAudioContext.gainNodes.at(-2)!
      .gain as unknown as MockAudioParam;
    const accentGain = MockAudioContext.gainNodes.at(-1)!
      .gain as unknown as MockAudioParam;
    const regularStart = regularSource.startCalls.at(-1)!;
    const accentStart = accentSource.startCalls.at(-1)!;
    const regularLevel = regularGain.events.find(
      (event) => event.type === "set" && event.time === 1,
    )?.value;
    const accentLevel = accentGain.events.find(
      (event) => event.type === "set" && event.time === 2,
    )?.value;

    expect(regularStart.time).toBe(1);
    expect(accentStart.time).toBe(2);
    expect(regularStart.offset).toBeGreaterThanOrEqual(0);
    expect(accentStart.offset).toBe(regularStart.offset);
    expect(regularStart.duration).toBeGreaterThan(0);
    expect(accentStart.duration).toBe(regularStart.duration);
    expect(accentLevel).toBeGreaterThan(regularLevel ?? 0);
  });

  it("schedules named percussion hits from the percussion sprite", async () => {
    installMockAudioWindow();

    const engine = createWebAudioEngine();
    await engine.prime();
    const group = engine.createPlaybackGroup();

    expect(
      engine.schedulePercussionHit({
        group,
        sampleId: "kick",
        startTime: 3,
        velocity: 0.8,
      }),
    ).toBe(true);

    const source = MockAudioContext.bufferSources.at(-1)!;
    const gain = MockAudioContext.gainNodes.at(-1)!
      .gain as unknown as MockAudioParam;
    const start = source.startCalls.at(-1)!;
    const level = gain.events.find(
      (event) => event.type === "set" && event.time === 3,
    )?.value;

    expect(start.time).toBe(3);
    expect(start.offset).toBeGreaterThan(0);
    expect(start.duration).toBeGreaterThan(0.1);
    expect(level).toBeGreaterThan(0);
  });

  it("creates looped drones from the bowed string sample regions", async () => {
    installMockAudioWindow();

    const engine = createWebAudioEngine();
    const handle = await engine.createDrone({
      notes: [{ id: "root", midiNote: 60 }],
      presetId: "bowed-strings",
      use: "drone",
    });
    const source = MockAudioContext.bufferSources.at(-1)!;

    expect(handle).toBeDefined();
    expect(source.loop).toBe(true);
    expect(source.loopEnd).toBeGreaterThan(source.loopStart);
    expect(source.startCalls.at(-1)?.offset).toBeGreaterThanOrEqual(0);
  });

  it("uses a quicker Bowed Strings attack for exercises than drones", async () => {
    installMockAudioWindow();

    const engine = createWebAudioEngine();
    await engine.prime();
    const group = engine.createPlaybackGroup();
    const exerciseStartTime = 1;

    engine.scheduleNote({
      durationSeconds: 1,
      group,
      midiNote: 48,
      presetId: "bowed-strings",
      startTime: exerciseStartTime,
      use: "exercise",
    });
    const exerciseGain = MockAudioContext.gainNodes.at(-1)!
      .gain as unknown as MockAudioParam;
    const exerciseAttack = exerciseGain.events.find(
      (event) =>
        event.type === "ramp" &&
        event.value !== undefined &&
        event.value > 0.0001,
    );

    await engine.createDrone({
      notes: [{ id: "root", midiNote: 48 }],
      presetId: "bowed-strings",
      use: "drone",
    });
    const droneGain = MockAudioContext.gainNodes.at(-1)!
      .gain as unknown as MockAudioParam;
    const droneAttack = droneGain.events.find(
      (event) =>
        event.type === "ramp" &&
        event.value !== undefined &&
        event.value > 0.0001,
    );

    expect(exerciseAttack?.time).toBeCloseTo(exerciseStartTime + 0.045);
    expect(droneAttack?.time).toBeCloseTo(0.12);
  });

  it("recreates drone voices when the note changes", async () => {
    installMockAudioWindow();

    const engine = createWebAudioEngine();
    const handle = await engine.createDrone({
      notes: [{ id: "root", midiNote: 60 }],
      presetId: "bowed-strings",
      use: "drone",
    });
    const sourceCount = MockAudioContext.bufferSources.length;
    const updated = engine.updateDrone(handle!, {
      notes: [{ id: "root", midiNote: 67 }],
      presetId: "bowed-strings",
      use: "drone",
    });

    expect(updated).toBe(true);
    expect(MockAudioContext.bufferSources).toHaveLength(sourceCount + 1);
  });

  it("reports an output clock from the active context", async () => {
    installMockAudioWindow();

    const engine = createWebAudioEngine();
    await engine.prime();

    expect(engine.getOutputClock()).toStrictEqual({
      contextTime: 0,
      performanceTime: 1234,
    });
  });
});
