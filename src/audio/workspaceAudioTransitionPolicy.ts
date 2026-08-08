export interface AudioWorkspaceIdentity {
  readonly id: string;
  readonly kind: "arrangement" | "session";
}

export interface AudioWorkspaceScope {
  readonly mountRevision: number;
  readonly workspace: AudioWorkspaceIdentity | null;
}

function workspaceIdentitiesAreEqual(
  left: AudioWorkspaceIdentity | null,
  right: AudioWorkspaceIdentity | null,
) {
  if (left === null || right === null) {
    return left === right;
  }

  return left.kind === right.kind && left.id === right.id;
}

export function audioWorkspaceScopesAreEqual(
  left: AudioWorkspaceScope,
  right: AudioWorkspaceScope,
) {
  return (
    left.mountRevision === right.mountRevision &&
    workspaceIdentitiesAreEqual(left.workspace, right.workspace)
  );
}

/**
 * Owns the audio policy at workspace boundaries without coupling it to React.
 * Reconciliation is synchronous so stale playback is stopped before the new
 * workspace can render controls for coincidentally matching entity IDs.
 */
export class WorkspaceAudioTransitionPolicy {
  private scope: AudioWorkspaceScope;

  constructor(
    initialScope: AudioWorkspaceScope,
    private readonly stopAllPlayback: () => void,
  ) {
    this.scope = initialScope;
  }

  reconcile(nextScope: AudioWorkspaceScope) {
    if (audioWorkspaceScopesAreEqual(this.scope, nextScope)) {
      return false;
    }

    // Commit the new scope first so a re-entrant store notification cannot
    // apply the same transition twice.
    this.scope = nextScope;
    this.stopAllPlayback();
    return true;
  }
}
