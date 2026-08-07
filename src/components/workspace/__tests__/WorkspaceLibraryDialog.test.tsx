import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { WorkspaceLibraryDialog } from "@/components/workspace/WorkspaceLibraryDialog";

describe("WorkspaceLibraryDialog", () => {
  it("explains the distinction between Sessions and Arrangements", () => {
    const markup = renderToStaticMarkup(
      <WorkspaceLibraryDialog onClose={() => undefined} />,
    );

    expect(markup).toContain("New Session");
    expect(markup).toContain(
      "Build and play music in Parts with instruments, loopers and more.",
    );
    expect(markup).toContain("New Arrangement");
    expect(markup).toContain(
      "Build a playable arrangement by capturing your Sessions as Sections.",
    );
    expect(markup).not.toContain("Editable musical material built from Parts");
    expect(markup).not.toContain(
      "Playable sequences of captured Session content.",
    );
  });
});
