import dark from "./dark";
import light from "./light";
import wood from "./wood";

const themes = {
  dark,
  light,
  wood,
};

export type FretboardThemeName = keyof typeof themes;

export default themes;
