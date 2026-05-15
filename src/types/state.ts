export type SettingValue<T> = T | ((prev: T) => T);

export type SettingSetter<T> = (value: SettingValue<T>) => void;
