export type SessionBatchSettingChoice =
  | "note-collection"
  | "display-format"
  | "note-emphasis";

export type SessionManagementSettingChoice =
  | "title"
  | "note-colors"
  | SessionBatchSettingChoice;

export interface SessionManagementInitialSetting {
  sessionId: string;
  setting: SessionManagementSettingChoice;
}
