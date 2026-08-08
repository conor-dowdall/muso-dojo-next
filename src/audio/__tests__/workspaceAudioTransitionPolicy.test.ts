import { describe, expect, it, vi } from "vitest";
import {
  WorkspaceAudioTransitionPolicy,
  type AudioWorkspaceScope,
} from "@/audio/workspaceAudioTransitionPolicy";

function scope(
  kind: "arrangement" | "session",
  id: string,
  mountRevision = 0,
): AudioWorkspaceScope {
  return { mountRevision, workspace: { id, kind } };
}

describe("WorkspaceAudioTransitionPolicy", () => {
  it("stops playback when switching between Sessions regardless of their music", () => {
    const stopAllPlayback = vi.fn();
    const policy = new WorkspaceAudioTransitionPolicy(
      scope("session", "c-major"),
      stopAllPlayback,
    );

    expect(policy.reconcile(scope("session", "a-minor"))).toBe(true);
    expect(stopAllPlayback).toHaveBeenCalledOnce();
  });

  it("stops playback across every Session and Arrangement boundary", () => {
    const stopAllPlayback = vi.fn();
    const policy = new WorkspaceAudioTransitionPolicy(
      scope("session", "session-a"),
      stopAllPlayback,
    );

    policy.reconcile(scope("arrangement", "arrangement-a"));
    policy.reconcile(scope("arrangement", "arrangement-b"));
    policy.reconcile(scope("session", "session-b"));
    policy.reconcile({ mountRevision: 0, workspace: null });
    policy.reconcile(scope("session", "session-c"));

    expect(stopAllPlayback).toHaveBeenCalledTimes(5);
  });

  it("does not stop for ordinary edits within the active workspace", () => {
    const stopAllPlayback = vi.fn();
    const policy = new WorkspaceAudioTransitionPolicy(
      scope("session", "session-a"),
      stopAllPlayback,
    );

    expect(policy.reconcile(scope("session", "session-a"))).toBe(false);
    expect(stopAllPlayback).not.toHaveBeenCalled();
  });

  it("stops when the active graph is replaced under the same workspace ID", () => {
    const stopAllPlayback = vi.fn();
    const policy = new WorkspaceAudioTransitionPolicy(
      scope("session", "session-a", 2),
      stopAllPlayback,
    );

    expect(policy.reconcile(scope("session", "session-a", 3))).toBe(true);
    expect(stopAllPlayback).toHaveBeenCalledOnce();
  });
});
