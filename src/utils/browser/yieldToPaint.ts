declare global {
  interface Window {
    scheduler?: {
      yield: () => Promise<void>;
    };
  }
}

/**
 * Yields the JavaScript execution to the browser's paint engine.
 *
 * Uses the modern `scheduler.yield()` API where available to explicitly
 * allow the browser to process layout and paint before resuming execution.
 * Falls back to an optimized rAF + MessageChannel polyfill for unsupported browsers.
 *
 * Can be used as a Promise or with a callback.
 */
export async function yieldToPaint(callback?: () => void): Promise<void> {
  const performYield = async () => {
    if (
      typeof window !== "undefined" &&
      window.scheduler &&
      "yield" in window.scheduler
    ) {
      await window.scheduler.yield();
      return;
    }

    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        const { port1, port2 } = new MessageChannel();
        port1.onmessage = () => resolve();
        port2.postMessage(null);
      });
    });
  };

  await performYield();

  if (callback) {
    callback();
  }
}
