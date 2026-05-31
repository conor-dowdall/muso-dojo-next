import { appThemeNames } from "@/data/appThemes";

const appThemeNameList = JSON.stringify(appThemeNames);
const appStoreStorageKey = JSON.stringify("muso-dojo-app-store");

export function getAppThemeInitScript() {
  return `
(() => {
  try {
    const validThemes = new Set(${appThemeNameList});
    const persisted = localStorage.getItem(${appStoreStorageKey});
    const theme = persisted
      ? JSON.parse(persisted)?.state?.preferences?.appTheme
      : undefined;

    if (validThemes.has(theme)) {
      document.documentElement.dataset.theme = theme;
      return;
    }

    document.documentElement.removeAttribute("data-theme");
  } catch {
    document.documentElement.removeAttribute("data-theme");
  }
})();
`;
}
