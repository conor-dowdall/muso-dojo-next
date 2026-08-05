const DEFAULT_SERVICE_WORKER_CONTROL_TIMEOUT_MS = 60_000;

export type AudioServiceWorkerContainer = Pick<
  ServiceWorkerContainer,
  "addEventListener" | "controller" | "ready" | "removeEventListener"
>;

function getServiceWorkerContainer() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return undefined;
  }

  return navigator.serviceWorker;
}

export async function waitForServiceWorkerControl(
  serviceWorker:
    AudioServiceWorkerContainer | undefined = getServiceWorkerContainer(),
  timeoutMs = DEFAULT_SERVICE_WORKER_CONTROL_TIMEOUT_MS,
) {
  if (!serviceWorker) {
    return false;
  }

  const container = serviceWorker;

  if (container.controller) {
    return true;
  }

  return new Promise<boolean>((resolve) => {
    let settled = false;
    const timeout = setTimeout(() => finish(false), timeoutMs);

    function finish(controlled: boolean) {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeout);
      container.removeEventListener("controllerchange", handleControllerChange);
      resolve(controlled);
    }

    function handleControllerChange() {
      if (container.controller) {
        finish(true);
      }
    }

    container.addEventListener("controllerchange", handleControllerChange);
    handleControllerChange();

    void container.ready.then(handleControllerChange, () => finish(false));
  });
}
