import { afterEach, describe, expect, it, vi } from "vitest";
import { createWebAudioEngine } from "@/audio/createWebAudioEngine";

class MockAudioParam {
  value = 0;

  cancelScheduledValues() {
    return this;
  }

  linearRampToValueAtTime(value: number) {
    this.value = value;
    return this;
  }

  setValueAtTime(value: number) {
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
    return destination as AudioNode;
  }

  disconnect() {
    return undefined;
  }
}

class MockGainNode extends MockAudioNode {
  readonly gain = new MockAudioParam() as unknown as AudioParam;
}

class MockOscillatorNode extends MockAudioNode {
  readonly detune = new MockAudioParam() as unknown as AudioParam;
  readonly frequency = new MockAudioParam() as unknown as AudioParam;

  setPeriodicWave() {
    return undefined;
  }

  start() {
    return undefined;
  }

  stop() {
    return undefined;
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
  static compressorNodeCount = 0;
  static delayNodeCount = 0;
  static oscillatorNodeCount = 0;
  static periodicWaveCount = 0;
  static waveShaperNodeCount = 0;

  readonly destination = new MockAudioNode(
    this,
  ) as unknown as AudioDestinationNode;
  readonly sampleRate = 48_000;
  currentTime = 0;
  state: AudioContextState = "running";

  constructor(_options?: AudioContextOptions) {}

  static resetCounts() {
    MockAudioContext.compressorNodeCount = 0;
    MockAudioContext.delayNodeCount = 0;
    MockAudioContext.oscillatorNodeCount = 0;
    MockAudioContext.periodicWaveCount = 0;
    MockAudioContext.waveShaperNodeCount = 0;
  }

  createDelay() {
    MockAudioContext.delayNodeCount += 1;
    return new MockDelayNode(this) as unknown as DelayNode;
  }

  createDynamicsCompressor() {
    MockAudioContext.compressorNodeCount += 1;
    return new MockDynamicsCompressorNode(
      this,
    ) as unknown as DynamicsCompressorNode;
  }

  createGain() {
    return new MockGainNode(this) as unknown as GainNode;
  }

  createOscillator() {
    MockAudioContext.oscillatorNodeCount += 1;
    return new MockOscillatorNode(this) as unknown as OscillatorNode;
  }

  createPeriodicWave() {
    MockAudioContext.periodicWaveCount += 1;
    return {} as PeriodicWave;
  }

  createWaveShaper() {
    MockAudioContext.waveShaperNodeCount += 1;
    return new MockWaveShaperNode(this) as unknown as WaveShaperNode;
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

  it("uses the native sine oscillator path for the default drone preset", async () => {
    installMockAudioWindow();

    const engine = createWebAudioEngine();
    await engine.prime();
    const oscillatorCountAfterPrime = MockAudioContext.oscillatorNodeCount;
    const periodicWaveCountAfterPrime = MockAudioContext.periodicWaveCount;
    const handle = await engine.startDrone({
      midiNotes: [60],
      use: "drone",
    });

    expect(handle).toBeDefined();
    expect(MockAudioContext.oscillatorNodeCount).toBe(
      oscillatorCountAfterPrime + 1,
    );
    expect(MockAudioContext.periodicWaveCount).toBe(
      periodicWaveCountAfterPrime,
    );
    expect(MockAudioContext.compressorNodeCount).toBe(0);
  });

  it("shares chorus insert effects across separately started drone handles", async () => {
    installMockAudioWindow();

    const engine = createWebAudioEngine();
    const firstHandle = await engine.startDrone({
      midiNotes: [60],
      presetId: "warm-pad",
      use: "drone",
    });
    const secondHandle = await engine.startDrone({
      midiNotes: [64],
      presetId: "warm-pad",
      use: "drone",
    });

    expect(firstHandle).toBeDefined();
    expect(secondHandle).toBeDefined();
    expect(MockAudioContext.delayNodeCount).toBe(1);
  });

  it("keeps distortion insert effects per drone voice", async () => {
    installMockAudioWindow();

    const engine = createWebAudioEngine();
    await engine.startDrone({
      midiNotes: [60],
      presetId: "distortion-guitar",
      use: "drone",
    });
    await engine.startDrone({
      midiNotes: [64],
      presetId: "distortion-guitar",
      use: "drone",
    });

    expect(MockAudioContext.waveShaperNodeCount).toBe(2);
  });

  it("releases an idle shared drone effects bus after stopped voices finish", async () => {
    installMockAudioWindow();

    const engine = createWebAudioEngine();
    const firstHandle = await engine.startDrone({
      midiNotes: [60],
      presetId: "warm-pad",
      use: "drone",
    });
    const secondHandle = await engine.startDrone({
      midiNotes: [64],
      presetId: "warm-pad",
      use: "drone",
    });

    expect(firstHandle).toBeDefined();
    expect(secondHandle).toBeDefined();
    expect(MockAudioContext.delayNodeCount).toBe(1);

    engine.stopDrone(firstHandle!);
    engine.stopDrone(secondHandle!);
    await vi.advanceTimersByTimeAsync(2_000);
    await engine.startDrone({
      midiNotes: [67],
      presetId: "warm-pad",
      use: "drone",
    });

    expect(MockAudioContext.delayNodeCount).toBe(2);
  });
});
