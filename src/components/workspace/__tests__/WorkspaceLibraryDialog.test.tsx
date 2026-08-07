import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  WorkspaceLibraryDialog,
  WorkspaceLibraryResources,
} from "@/components/workspace/WorkspaceLibraryDialog";
import { WorkspaceLibraryMenuAction } from "@/components/workspace/WorkspaceLibraryMenuAction";

describe("WorkspaceLibraryDialog", () => {
  it("explains the distinction between Sessions and Arrangements", () => {
    const markup = renderToStaticMarkup(
      <WorkspaceLibraryDialog onClose={() => undefined} />,
    );

    expect(markup).toContain("New Session");
    expect(markup).toContain(
      "Build and play music in Parts with Instruments, Loopers and more.",
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

  it("presents the same recognizable Library action in either workspace", () => {
    const markup = renderToStaticMarkup(
      <WorkspaceLibraryMenuAction onClick={() => undefined} />,
    );

    expect(markup).toContain("Library");
    expect(markup).toContain("Sessions, Arrangements, and Resources");
    expect(markup).toContain("lucide-library-big");
  });

  it("shows reusable resources with saved-item counts", () => {
    const markup = renderToStaticMarkup(
      <WorkspaceLibraryResources
        progressionCount={1}
        tuningCount={2}
        onOpenProgressions={() => undefined}
        onOpenTunings={() => undefined}
      />,
    );

    expect(markup).toContain('aria-label="Resources"');
    expect(markup).toContain("My Tunings");
    expect(markup).toContain("2 saved");
    expect(markup).toContain("lucide-sliders-vertical");
    expect(markup).toContain("My Progressions");
    expect(markup).toContain("1 saved");
    expect(markup).toContain("lucide-bookmark");
    expect(markup).not.toContain("My Library");
  });
});
