import globals from "globals";
import pluginJs from "@eslint/js";


export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
    },
  },
  {
    languageOptions: {
      globals: globals.node,
    },
  },
  pluginJs.configs.recommended,
  {
    rules: {
      "comma-dangle": ["error", "always-multiline"],
      complexity: ["error", 8],
      quotes: ["error", "double"],
      semi: ["error", "always"],
    },
  },
];
