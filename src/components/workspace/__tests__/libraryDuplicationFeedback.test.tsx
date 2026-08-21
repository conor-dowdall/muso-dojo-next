// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SessionManagementDialog } from "@/components/session/SessionManagementDialog";
import { WorkspaceLibraryDialog } from "@/components/workspace/WorkspaceLibraryDialog";
import { useAppStore } from "@/stores/appStore";
import {
  createStoreSnapshot,
  sessionId,
} from "@/stores/app-store/__tests__/appStoreTestUtils";

function installImmediateScheduler() {
  Object.defineProperty(window, "scheduler", {
    configurable: true,
    value: { yield: () => Promise.resolve() },
  });
}

async function duplicateFromOpenActions(actionsLabel: string) {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: actionsLabel }));
  await user.click(await screen.findByRole("button", { name: /^Duplicate / }));
}

beforeEach(() => {
  useAppStore.setState(createStoreSnapshot());
  installImmediateScheduler();
});

afterEach(() => {
  cleanup();
  useAppStore.setState(createStoreSnapshot());
  window.localStorage.clear();
  Reflect.deleteProperty(window, "scheduler");
});

describe("Library duplication feedback", () => {
  it("closes the Workspace Library after duplicating a Session", async () => {
    const onClose = vi.fn();
    render(<WorkspaceLibraryDialog onClose={onClose} />);

    await duplicateFromOpenActions(
      "Open actions for Store Test Session session",
    );

    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(useAppStore.getState().activeWorkspace).toMatchObject({
      kind: "session",
      id: expect.not.stringMatching(new RegExp(`^${sessionId}$`)),
    });
    expect(
      Object.values(useAppStore.getState().sessions).map(({ name }) => name),
    ).toEqual(["Store Test Session", "Store Test Session Copy"]);
  });

  it("closes the Workspace Library after duplicating an Arrangement", async () => {
    const arrangementId = useAppStore
      .getState()
      .addArrangement({ name: "Long Form" });
    const onClose = vi.fn();
    render(<WorkspaceLibraryDialog onClose={onClose} />);

    await duplicateFromOpenActions("Open actions for Long Form arrangement");

    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(useAppStore.getState().activeWorkspace).toMatchObject({
      kind: "arrangement",
      id: expect.not.stringMatching(new RegExp(`^${arrangementId}$`)),
    });
    expect(
      Object.values(useAppStore.getState().arrangements).map(
        ({ name }) => name,
      ),
    ).toEqual(["Long Form", "Long Form Copy"]);
  });

  it("closes the Session Library after duplicating a Session", async () => {
    const onClose = vi.fn();
    render(<SessionManagementDialog onClose={onClose} />);

    await duplicateFromOpenActions(
      "Open actions for Store Test Session session",
    );

    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(useAppStore.getState().activeSessionId).not.toBe(sessionId);
    expect(
      Object.values(useAppStore.getState().sessions).map(({ name }) => name),
    ).toEqual(["Store Test Session", "Store Test Session Copy"]);
  });
});
