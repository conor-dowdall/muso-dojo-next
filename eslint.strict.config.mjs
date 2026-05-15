import { fileURLToPath } from "node:url";
import { defineConfig } from "eslint/config";
import baseConfig from "./eslint.config.mjs";

const strictConfig = defineConfig([
  ...baseConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            "eslint.config.mjs",
            "eslint.strict.config.mjs",
          ],
        },
        tsconfigRootDir: fileURLToPath(new URL(".", import.meta.url)),
      },
    },
    rules: {
      "@typescript-eslint/no-deprecated": "warn",
      "@typescript-eslint/switch-exhaustiveness-check": "warn",
    },
  },
]);

export default strictConfig;
