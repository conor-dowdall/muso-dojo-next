type BrowserAudioContextConstructor = new (
  options?: AudioContextOptions,
) => AudioContext;

interface BrowserOfflineAudioContextConstructor {
  new (contextOptions: OfflineAudioContextOptions): OfflineAudioContext;
  new (
    numberOfChannels: number,
    length: number,
    sampleRate: number,
  ): OfflineAudioContext;
}

interface WindowWithWebAudio extends Window {
  AudioContext?: BrowserAudioContextConstructor;
  OfflineAudioContext?: BrowserOfflineAudioContextConstructor;
  webkitAudioContext?: BrowserAudioContextConstructor;
  webkitOfflineAudioContext?: BrowserOfflineAudioContextConstructor;
}

export function getAudioContextConstructor() {
  if (typeof window === "undefined") {
    return undefined;
  }

  const browserWindow = window as WindowWithWebAudio;
  return browserWindow.AudioContext ?? browserWindow.webkitAudioContext;
}

export function getOfflineAudioContextConstructor() {
  if (typeof window === "undefined") {
    return undefined;
  }

  const browserWindow = window as WindowWithWebAudio;
  return (
    browserWindow.OfflineAudioContext ?? browserWindow.webkitOfflineAudioContext
  );
}
