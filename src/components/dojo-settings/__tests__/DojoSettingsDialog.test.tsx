import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DojoSettingsDialog } from "@/components/dojo-settings/DojoSettingsDialog";

describe("DojoSettingsDialog", () => {
  it("places backup controls in a separated section after appearance settings", () => {
    const markup = renderToStaticMarkup(
      <DojoSettingsDialog onClose={() => undefined} />,
    );
    const appearanceIndex = markup.indexOf('aria-label="Appearance settings"');
    const backupsIndex = markup.indexOf('aria-label="Data &amp; Backups"');

    expect(markup).toContain('data-layout="stack"');
    expect(appearanceIndex).toBeGreaterThanOrEqual(0);
    expect(backupsIndex).toBeGreaterThan(appearanceIndex);
    expect(markup).toContain("Data &amp; Backups");
    expect(markup).toContain(
      "Everything in your Dojo is saved automatically on this device.",
    );
    expect(markup).toContain("Download Dojo Backup");
    expect(markup).toContain(
      "Save a portable copy of your Sessions, Arrangements, personal library, and preferences.",
    );
    expect(markup).toContain("Restore Dojo Backup");
    expect(markup).toContain(
      "Replace everything in your Dojo with a backup file.",
    );
    expect(markup).not.toContain("Save the Set");
    expect(markup).not.toContain("Recall a Set");
    expect(markup).not.toContain("current Dojo");
    expect(markup).toContain('accept=".json,application/json"');
  });
});
