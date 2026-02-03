import type { FretboardTheme } from "@/types/fretboard";
import dark from "./dark";
import light from "./light";
import wood from "./wood";

const themes: Record<string, FretboardTheme> = {
  dark,
  light,
  wood,
};

export default themes;
