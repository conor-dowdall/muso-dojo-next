import { type PartSequenceSnapshot } from "./partSequenceCoordinator";
import { type PartSequencePlaybackPlan } from "./partSequencePlanning";

export type PartSequencePlanReconciliation =
  "defer" | "none" | "restart" | "retime" | "stop" | "update";

/**
 * Resolves how an already-running Part sequence should react to a new plan.
 * The caller is responsible for first confirming that the snapshot belongs to
 * its Session or Arrangement.
 */
export function getPartSequencePlanReconciliation(
  snapshot: PartSequenceSnapshot,
  plan: PartSequencePlaybackPlan | undefined,
): PartSequencePlanReconciliation {
  if (!plan || snapshot.sourceSignature !== plan.sourceSignature) {
    return "stop";
  }

  // A tempo-map change must preempt an already queued handoff. Arrangement
  // transports stop; Session transports preserve their live retiming behavior.
  if (snapshot.tempoSignature !== plan.tempoSignature) {
    return plan.mode === "session" || plan.mode === "part-loop"
      ? "retime"
      : "stop";
  }

  if (snapshot.updateSignature === plan.updateSignature) {
    return "none";
  }

  // Web Audio for the handoff may already be queued. Let that boundary commit
  // before deciding whether the newly active Part needs a restart.
  if (
    snapshot.pendingIndex !== undefined &&
    snapshot.pendingKind !== "restart"
  ) {
    return "defer";
  }

  const activeIndex = snapshot.activeIndex;
  if (
    activeIndex === undefined ||
    snapshot.partResetSignatures?.[activeIndex] !==
      plan.partResetSignatures[activeIndex]
  ) {
    return "restart";
  }

  return "update";
}
