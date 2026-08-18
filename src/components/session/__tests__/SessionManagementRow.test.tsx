import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SessionManagementRow } from "@/components/session/SessionManagementRow";

function renderDeleteConfirmation(arrangementReferenceCount: number) {
  const session = {
    id: "session-1",
    name: "Blues Practice",
    parts: [],
    tempoBpm: 96,
  };

  return renderToStaticMarkup(
    <SessionManagementRow
      arrangementReferenceCount={arrangementReferenceCount}
      isActive={false}
      isDeleteConfirming
      isOpen
      isRenameOpen={false}
      isTempoOpen={false}
      session={session}
      sessions={[session]}
      onCancelDeleteSession={() => undefined}
      onCloseRename={() => undefined}
      onDeleteSession={() => undefined}
      onDuplicateSession={() => undefined}
      onRenameSession={() => undefined}
      onRequestDeleteSession={() => undefined}
      onSetTempoBpm={() => undefined}
      onToggleActions={() => undefined}
      onToggleRename={() => undefined}
      onToggleTempo={() => undefined}
      onUseSession={() => undefined}
    />,
  );
}

describe("SessionManagementRow", () => {
  it("explains the consequence of deleting a Session used by one Arrangement", () => {
    const markup = renderDeleteConfirmation(1);

    expect(markup).toContain(
      "1 Arrangement uses this Session. Its existing Sections will still play, but those Sections can no longer be updated from this Session.",
    );
  });

  it("pluralizes the referenced Arrangement consequence", () => {
    const markup = renderDeleteConfirmation(2);

    expect(markup).toContain(
      "2 Arrangements use this Session. Their existing Sections will still play, but those Sections can no longer be updated from this Session.",
    );
  });
});
