export type SessionManagementSettingChoice = "title" | "note-colors";

export interface SessionManagementInitialSetting {
  sessionId: string;
  setting: SessionManagementSettingChoice;
}
