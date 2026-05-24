type BrowserAudioContextConstructor = new (
  options?: AudioContextOptions,
) => AudioContext;

interface WindowWithWebAudio extends Window {
  AudioContext?: BrowserAudioContextConstructor;
  webkitAudioContext?: BrowserAudioContextConstructor;
}

export function getAudioContextConstructor() {
  if (typeof window === "undefined") {
    return undefined;
  }

  const browserWindow = window as WindowWithWebAudio;
  return browserWindow.AudioContext ?? browserWindow.webkitAudioContext;
}
