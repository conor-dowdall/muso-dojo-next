import { afterEach, describe, expect, it, vi } from "vitest";
import { createWebAudioEngine } from "@/audio/createWebAudioEngine";

class MockAudioParam {
  readonly events: Array<{
    time: number;
    type: "cancel" | "exponentialRamp" | "hold" | "ramp" | "set";
    value?: number;
  }> = [];
  value = 0;

  cancelAndHoldAtTime(time: number) {
    this.events.push({ time, type: "hold" });
    return this;
  }

  cancelScheduledValues(time: number) {
    this.events.push({ time, type: "cancel" });
    return this;
  }

  linearRampToValueAtTime(value: number, time: number) {
    this.events.push({ time, type: "ramp", value });
    this.value = value;
    return this;
  }

  exponentialRampToValueAtTime(value: number, time: number) {
    this.events.push({ time, type: "exponentialRamp", value });
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
    return undefined;
  }
}

class MockGainNode extends MockAudioNode {
  readonly gain = new MockAudioParam() as unknown as AudioParam;
}

class MockAudioBuffer {
  readonly numberOfChannels: number;
  private readonly channels: Float32Array[];

  constructor(numberOfChannels: number, length: number) {
    this.numberOfChannels = numberOfChannels;
    this.channels = Array.from(
      { length: numberOfChannels },
      () => new Float32Array(length),
    );
  }

  getChannelData(channel: number) {
    return this.channels[channel]!;
  }
}

class MockBiquadFilterNode extends MockAudioNode {
  readonly Q = new MockAudioParam() as unknown as AudioParam;
  readonly frequency = new MockAudioParam() as unknown as AudioParam;
  type: BiquadFilterType = "lowpass";
}

class MockConvolverNode extends MockAudioNode {
  buffer: AudioBuffer | null = null;
}

class MockOscillatorNode extends MockAudioNode {
  readonly detune = new MockAudioParam() as unknown as AudioParam;
  readonly frequency = new MockAudioParam() as unknown as AudioParam;
  private readonly endedListeners = new Set<() => void>();

  addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    if (type === "ended" && typeof listener === "function") {
      this.endedListeners.add(listener as () => void);
    }
    return undefined;
  }

  emitEnded() {
    this.endedListeners.forEach((listener) => listener());
    this.endedListeners.clear();
  }

  setPeriodicWave() {
    return undefined;
  }

  start(time?: number) {
    if (time !== undefined) {
      MockAudioContext.oscillatorStartTimes.push(time);
    }
    return undefined;
  }

  stop(time?: number) {
    if (time !== undefined) {
      MockAudioContext.oscillatorStopTimes.push(time);
    }

    return undefined;
  }
}

class MockAudioBufferSourceNode extends MockAudioNode {
  buffer: AudioBuffer | null = null;

  addEventListener() {
    return undefined;
  }

  start(time?: number) {
    if (time !== undefined) {
      MockAudioContext.bufferSourceStartTimes.push(time);
    }
  }

  stop(time?: number) {
    if (time !== undefined) {
      MockAudioContext.bufferSourceStopTimes.push(time);
    }
  }
}

class MockDelayNode extends MockAudioNode {
  readonly delayTime = new MockAudioParam() as unknown as AudioParam;
}

class MockDynamicsCompressorNode extends MockAudioNode {
  readonly attack = new MockAudioParam() as unknown as AudioParam;
  readonly knee = new MockAudioParam() as unknown as AudioParam;
  readonly ratio = new MockAudioParam() as unknown as AudioParam;
  readonly release = new MockAudioParam() as unknown as AudioParam;
  readonly threshold = new MockAudioParam() as unknown as AudioParam;
}

class MockWaveShaperNode extends MockAudioNode {
  curve: Float32Array<ArrayBuffer> | null = null;
  oversample: OverSampleType = "none";
}

class MockAudioContext {
  static connectionCount = 0;
  static convolverNodeCount = 0;
  static compressorNodeCount = 0;
  static bufferSourceStartTimes: number[] = [];
  static bufferSourceStopTimes: number[] = [];
  static delayNodeCount = 0;
  static disconnectionCount = 0;
  static gainNodes: MockGainNode[] = [];
  static oscillatorNodeCount = 0;
  static oscillators: MockOscillatorNode[] = [];
  static oscillatorStopTimes: number[] = [];
  static oscillatorStartTimes: number[] = [];
  static periodicWaveCount = 0;
  static waveShaperNodeCount = 0;
  static lastInstance: MockAudioContext | undefined;
  static lastOptions: AudioContextOptions | undefined;

  readonly destination = new MockAudioNode(
    this,
  ) as unknown as AudioDestinationNode;
  readonly sampleRate = 48_000;
  currentTime = 0;
  state: AudioContextState = "running";

  constructor(options?: AudioContextOptions) {
    MockAudioContext.lastInstance = this;
    MockAudioContext.lastOptions = options;
  }

  static resetCounts() {
    MockAudioContext.connectionCount = 0;
    MockAudioContext.convolverNodeCount = 0;
    MockAudioContext.compressorNodeCount = 0;
    MockAudioContext.bufferSourceStartTimes = [];
    MockAudioContext.bufferSourceStopTimes = [];
    MockAudioContext.delayNodeCount = 0;
    MockAudioContext.disconnectionCount = 0;
    MockAudioContext.gainNodes = [];
    MockAudioContext.oscillatorNodeCount = 0;
    MockAudioContext.oscillators = [];
    MockAudioContext.oscillatorStopTimes = [];
    MockAudioContext.oscillatorStartTimes = [];
    MockAudioContext.periodicWaveCount = 0;
    MockAudioContext.waveShaperNodeCount = 0;
    MockAudioContext.lastInstance = undefined;
    MockAudioContext.lastOptions = undefined;
  }

  createDelay() {
    MockAudioContext.delayNodeCount += 1;
    return new MockDelayNode(this) as unknown as DelayNode;
  }

  createBiquadFilter() {
    return new MockBiquadFilterNode(this) as unknown as BiquadFilterNode;
  }

  createBuffer(numberOfChannels: number, length: number) {
    return new MockAudioBuffer(
      numberOfChannels,
      length,
    ) as unknown as AudioBuffer;
  }

  createConvolver() {
    MockAudioContext.convolverNodeCount += 1;
    return new MockConvolverNode(this) as unknown as ConvolverNode;
  }

  createBufferSource() {
    return new MockAudioBufferSourceNode(
      this,
    ) as unknown as AudioBufferSourceNode;
  }

  createDynamicsCompressor() {
    MockAudioContext.compressorNodeCount += 1;
    return new MockDynamicsCompressorNode(
      this,
    ) as unknown as DynamicsCompressorNode;
  }

  createGain() {
    const gainNode = new MockGainNode(this);

    MockAudioContext.gainNodes.push(gainNode);
    return gainNode as unknown as GainNode;
  }

  createOscillator() {
    const oscillator = new MockOscillatorNode(this);

    MockAudioContext.oscillatorNodeCount += 1;
    MockAudioContext.oscillators.push(oscillator);
    return oscillator as unknown as OscillatorNode;
  }

  createPeriodicWave() {
    MockAudioContext.periodicWaveCount += 1;
    return {} as PeriodicWave;
  }

  createWaveShaper() {
    MockAudioContext.waveShaperNodeCount += 1;
    return new MockWaveShaperNode(this) as unknown as WaveShaperNode;
  }

  addEventListener() {
    return undefined;
  }

  resume() {
    this.state = "running";
    return Promise.resolve();
  }
}

function installMockAudioWindow() {
  vi.useFakeTimers();
  MockAudioContext.resetCounts();
  vi.stubGlobal("window", {
    AudioContext: MockAudioContext,
    clearTimeout: globalThis.clearTimeout,
    setTimeout: globalThis.setTimeout,
  });
}

describe("createWebAudioEngine", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("requests the configured very-low output latency", async () => {
    installMockAudioWindow();

    const engine = createWebAudioEngine();
    await engine.prime();

    expect(MockAudioContext.lastOptions).toMatchObject({
      latencyHint: 0.003,
    });
  });

  it("uses the native sine oscillator path for the default drone preset", async () => {
    installMockAudioWindow();

    const engine = createWebAudioEngine();
    await engine.prime();
    const oscillatorCountAfterPrime = MockAudioContext.oscillatorNodeCount;
    const periodicWaveCountAfterPrime = MockAudioContext.periodicWaveCount;
    const handle = await engine.createDrone({
      notes: [{ id: "root", midiNote: 60 }],
      use: "drone",
    });

    expect(handle).toBeDefined();
    expect(MockAudioContext.oscillatorNodeCount).toBe(
      oscillatorCountAfterPrime + 1,
    );
    expect(MockAudioContext.periodicWaveCount).toBe(
      periodicWaveCountAfterPrime,
    );
  });

  it("keeps dry output behind the master compressor", async () => {
    installMockAudioWindow();

    const engine = createWebAudioEngine();
    await engine.prime();

    expect(MockAudioContext.compressorNodeCount).toBe(1);
  });

  it("shares chorus insert effects across notes in one persistent drone", async () => {
    installMockAudioWindow();

    const engine = createWebAudioEngine();
    const handle = await engine.createDrone({
      notes: [
        { id: "root", midiNote: 60 },
        { id: "third", midiNote: 64 },
      ],
      presetId: "warm-pad",
      use: "drone",
    });

    expect(handle).toBeDefined();
    expect(MockAudioContext.delayNodeCount).toBe(1);

    engine.updateDrone(handle!, {
      notes: [
        { id: "root", midiNote: 60 },
        { id: "third", midiNote: 64 },
        { id: "fifth", midiNote: 67 },
      ],
      presetId: "warm-pad",
      use: "drone",
    });

    expect(MockAudioContext.delayNodeCount).toBe(1);
  });

  it("keeps distortion insert effects per drone voice", async () => {
    installMockAudioWindow();

    const engine = createWebAudioEngine();
    await engine.createDrone({
      notes: [
        { id: "root", midiNote: 60 },
        { id: "third", midiNote: 64 },
      ],
      presetId: "distortion-guitar",
      use: "drone",
    });

    expect(MockAudioContext.waveShaperNodeCount).toBe(2);
  });

  it("ramps level changes without restarting oscillators", async () => {
    installMockAudioWindow();

    const engine = createWebAudioEngine();
    const handle = await engine.createDrone({
      notes: [{ id: "root", midiNote: 60, velocity: 0.8 }],
      use: "drone",
    });
    const oscillatorCount = MockAudioContext.oscillatorNodeCount;

    engine.updateDrone(handle!, {
      notes: [{ id: "root", midiNote: 60, velocity: 0.4 }],
      use: "drone",
    });

    expect(MockAudioContext.oscillatorNodeCount).toBe(oscillatorCount);
  });

  it("reroutes a persistent drone without restarting its oscillators", async () => {
    installMockAudioWindow();

    const engine = createWebAudioEngine();
    const handle = await engine.createDrone({
      notes: [{ id: "root", midiNote: 60 }],
      presetId: "reference-tone",
      use: "drone",
    });
    const connectionCount = MockAudioContext.connectionCount;
    const disconnectionCount = MockAudioContext.disconnectionCount;
    const oscillatorCount = MockAudioContext.oscillatorNodeCount;

    engine.updateDrone(handle!, {
      notes: [{ id: "root", midiNote: 60 }],
      presetId: "reference-tone",
      use: "exercise",
    });

    expect(MockAudioContext.connectionCount).toBe(connectionCount + 1);
    expect(MockAudioContext.disconnectionCount).toBe(disconnectionCount + 1);
    expect(MockAudioContext.oscillatorNodeCount).toBe(oscillatorCount);
  });

  it("keeps released oscillators silent before stopping them", async () => {
    installMockAudioWindow();

    const engine = createWebAudioEngine();
    const handle = await engine.createDrone({
      notes: [{ id: "root", midiNote: 60 }],
      use: "drone",
    });

    engine.updateDrone(handle!, { notes: [], use: "drone" });

    const releaseEnd = Math.max(
      ...MockAudioContext.gainNodes.flatMap((gainNode) =>
        (gainNode.gain as unknown as MockAudioParam).events
          .filter((event) => event.type === "ramp" && event.value === 0)
          .map((event) => event.time),
      ),
    );
    const oscillatorStopTime = Math.max(
      ...MockAudioContext.oscillatorStopTimes,
    );

    expect(oscillatorStopTime).toBeGreaterThan(releaseEnd);
  });

  it("glides retained voices to new pitches without replacing oscillators", async () => {
    installMockAudioWindow();

    const engine = createWebAudioEngine();
    const handle = await engine.createDrone({
      notes: [{ id: "root", midiNote: 60 }],
      use: "drone",
    });
    const oscillatorCount = MockAudioContext.oscillatorNodeCount;
    const oscillator = MockAudioContext.oscillators.at(-1)!;

    engine.updateDrone(handle!, {
      notes: [{ id: "root", midiNote: 72 }],
      use: "drone",
    });

    expect(MockAudioContext.oscillatorNodeCount).toBe(oscillatorCount);
    expect(
      (oscillator.frequency as unknown as MockAudioParam).events,
    ).toContainEqual({
      time: 0.081,
      type: "exponentialRamp",
      value: expect.closeTo(523.251, 3),
    });
    expect(MockAudioContext.oscillatorStopTimes).toStrictEqual([0.01]);
  });

  it("holds the in-flight pitch before scheduling a rapid second glide", async () => {
    installMockAudioWindow();

    const engine = createWebAudioEngine();
    const handle = await engine.createDrone({
      notes: [{ id: "root", midiNote: 60 }],
      use: "drone",
    });
    const oscillator = MockAudioContext.oscillators.at(-1)!;

    engine.updateDrone(handle!, {
      notes: [{ id: "root", midiNote: 72 }],
      use: "drone",
    });
    MockAudioContext.lastInstance!.currentTime = 0.04;
    engine.updateDrone(handle!, {
      notes: [{ id: "root", midiNote: 48 }],
      use: "drone",
    });

    const heldFrequency = (
      oscillator.frequency as unknown as MockAudioParam
    ).events.find(
      (event) =>
        event.type === "set" &&
        event.time === 0.046 &&
        event.value !== undefined,
    )?.value;

    expect(heldFrequency).toBeGreaterThan(261);
    expect(heldFrequency).toBeLessThan(523);
  });

  it("crossfades voices only when the playback preset changes", async () => {
    installMockAudioWindow();

    const engine = createWebAudioEngine();
    const handle = await engine.createDrone({
      notes: [{ id: "root", midiNote: 60 }],
      presetId: "reference-tone",
      use: "drone",
    });
    const oscillatorCount = MockAudioContext.oscillatorNodeCount;

    engine.updateDrone(handle!, {
      notes: [{ id: "root", midiNote: 60 }],
      presetId: "soft-organ",
      use: "drone",
    });

    expect(MockAudioContext.oscillatorNodeCount).toBe(oscillatorCount + 1);
    expect(Math.max(...MockAudioContext.oscillatorStopTimes)).toBeGreaterThan(
      MockAudioContext.lastInstance!.currentTime,
    );
  });

  it("keeps the group reusable after releasing all notes", async () => {
    installMockAudioWindow();

    const engine = createWebAudioEngine();
    const handle = await engine.createDrone({
      notes: [{ id: "root", midiNote: 60 }],
      use: "drone",
    });
    const oscillatorCount = MockAudioContext.oscillatorNodeCount;

    engine.updateDrone(handle!, { notes: [], use: "drone" });
    await vi.advanceTimersByTimeAsync(200);
    engine.updateDrone(handle!, {
      notes: [{ id: "fifth", midiNote: 67 }],
      use: "drone",
    });

    expect(MockAudioContext.oscillatorNodeCount).toBe(oscillatorCount + 1);
  });

  it("reports a stale group after its AudioContext closes", async () => {
    installMockAudioWindow();

    const engine = createWebAudioEngine();
    const handle = await engine.createDrone({
      notes: [{ id: "root", midiNote: 60 }],
      use: "drone",
    });

    MockAudioContext.lastInstance!.state = "closed";

    expect(
      engine.updateDrone(handle!, {
        notes: [{ id: "root", midiNote: 60 }],
        use: "drone",
      }),
    ).toBe(false);
  });

  it("rebuilds master ambience only after fading the live mix out", async () => {
    installMockAudioWindow();

    const engine = createWebAudioEngine();
    await engine.prime();

    engine.setMasterAmbiencePresetId("studio-room");

    expect(MockAudioContext.convolverNodeCount).toBe(0);

    await vi.advanceTimersByTimeAsync(50);

    expect(MockAudioContext.convolverNodeCount).toBe(1);
    expect(MockAudioContext.compressorNodeCount).toBe(1);
  });

  it("schedules grouped exercise notes and metronome clicks in the future", async () => {
    installMockAudioWindow();

    const engine = createWebAudioEngine();
    await engine.prime();
    const group = engine.createPlaybackGroup();
    const voiceHandle = engine.scheduleNote({
      durationSeconds: 0.2,
      group,
      midiNote: 60,
      startTime: 1.25,
      use: "exercise",
    });
    const clickScheduled = engine.scheduleMetronomeClick({
      group,
      startTime: 1.5,
    });

    expect(voiceHandle).toBeDefined();
    expect(clickScheduled).toBe(true);
    expect(MockAudioContext.oscillatorStartTimes).toContain(1.25);
    expect(MockAudioContext.bufferSourceStartTimes).toEqual([1.5]);
    expect(
      (MockAudioContext.gainNodes.at(-1)!.gain as unknown as MockAudioParam)
        .events,
    ).toEqual([
      { time: 1.5, type: "set", value: 0.42 },
      { time: 1.568, type: "set", value: 0.42 },
      { time: 1.58, type: "ramp", value: 0 },
    ]);
  });

  it("preserves the intended end time when an exercise note is scheduled late", async () => {
    installMockAudioWindow();

    const engine = createWebAudioEngine();
    await engine.prime();
    const context = MockAudioContext.lastInstance!;
    const group = engine.createPlaybackGroup();

    context.currentTime = 1.1;
    const voiceHandle = engine.scheduleNote({
      durationSeconds: 0.2,
      group,
      midiNote: 60,
      presetId: "piano",
      startTime: 1,
      use: "exercise",
    });

    expect(voiceHandle).toBeDefined();
    expect(MockAudioContext.oscillatorStartTimes.at(-1)).toBe(1.106);
    expect(MockAudioContext.oscillatorStopTimes.at(-1)).toBeCloseTo(
      1.2 + (128 * 3) / 48_000,
    );
  });

  it("drops exercise notes that arrive too late for a click-safe envelope", async () => {
    installMockAudioWindow();

    const engine = createWebAudioEngine();
    await engine.prime();
    const context = MockAudioContext.lastInstance!;
    const group = engine.createPlaybackGroup();
    const oscillatorCount = MockAudioContext.oscillatorNodeCount;

    context.currentTime = 1.19;
    const voiceHandle = engine.scheduleNote({
      durationSeconds: 0.2,
      group,
      midiNote: 60,
      presetId: "piano",
      startTime: 1,
      use: "exercise",
    });

    expect(voiceHandle).toBeUndefined();
    expect(MockAudioContext.oscillatorNodeCount).toBe(oscillatorCount);
  });

  it("keeps one-shot oscillators alive briefly after their envelope is silent", async () => {
    installMockAudioWindow();

    const engine = createWebAudioEngine();
    await engine.prime();
    const group = engine.createPlaybackGroup();
    engine.scheduleNote({
      durationSeconds: 0.2,
      group,
      midiNote: 60,
      startTime: 1.25,
      use: "exercise",
    });

    expect(MockAudioContext.oscillatorStopTimes.at(-1)).toBeGreaterThan(1.45);
  });

  it("notifies listeners when a one-shot voice ends", async () => {
    installMockAudioWindow();

    const engine = createWebAudioEngine();
    const handle = await engine.playNote({
      durationSeconds: 0.2,
      midiNote: 60,
      use: "preview",
    });
    const listener = vi.fn();

    engine.subscribeToVoiceEnd(handle!, listener);
    MockAudioContext.oscillators.at(-1)?.emitEnded();

    expect(listener).toHaveBeenCalledOnce();
  });

  it("cancels queued playback groups and emits Stop All separately from reset", async () => {
    installMockAudioWindow();

    const engine = createWebAudioEngine();
    await engine.prime();
    const stopAllListener = vi.fn();
    const resetListener = vi.fn();
    engine.subscribeToStopAll(stopAllListener);
    engine.subscribeToReset(resetListener);
    const group = engine.createPlaybackGroup();
    engine.scheduleNote({
      group,
      midiNote: 60,
      startTime: 2,
      use: "exercise",
    });
    engine.scheduleMetronomeClick({
      group,
      startTime: 2,
    });

    engine.stopAll();

    expect(stopAllListener).toHaveBeenCalledOnce();
    expect(resetListener).not.toHaveBeenCalled();
    expect(MockAudioContext.bufferSourceStopTimes.at(-1)).toBe(2);
  });
});
