import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DojoSettingsDialog } from "@/components/dojo-settings/DojoSettingsDialog";

describe("DojoSettingsDialog", () => {
  it("places backup controls in a separated section after appearance settings", () => {
    const markup = renderToStaticMarkup(
      <DojoSettingsDialog onClose={() => undefined} />,
    );
    const appearanceIndex = markup.indexOf('aria-label="Appearance settings"');
    const backupsIndex = markup.indexOf('aria-label="Backups"');

    expect(markup).toContain('data-layout="stack"');
    expect(appearanceIndex).toBeGreaterThanOrEqual(0);
    expect(backupsIndex).toBeGreaterThan(appearanceIndex);
    expect(markup).toContain("Save the Set");
    expect(markup).toContain("Save a portable copy of your current Dojo");
    expect(markup).toContain("Recall a Set");
    expect(markup).toContain("Replace your current Dojo with a saved set");
    expect(markup).toContain('accept=".json,application/json"');
  });
});
