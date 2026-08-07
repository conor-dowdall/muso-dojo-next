import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Dialog, DialogHeader } from "@/components/ui/dialog/Dialog";

describe("Dialog", () => {
  it("uses its visible heading as the native dialog accessible name", () => {
    const markup = renderToStaticMarkup(
      <Dialog isOpen onClose={() => undefined}>
        <DialogHeader title="Named Dialog" />
      </Dialog>,
    );
    const labelledBy = markup.match(/aria-labelledby="([^"]+)"/)?.[1];

    expect(labelledBy).toBeDefined();
    expect(markup).toContain(`id="${labelledBy}"`);
    expect(markup).toContain("Named Dialog");
  });
});
