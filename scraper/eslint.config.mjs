import eslint from "@eslint/js";
import perfectionist from "eslint-plugin-perfectionist";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  globalIgnores(["./dist/**", "./node_modules/**"]),
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    plugins: {
      perfectionist,
    },
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",
      "@typescript-eslint/no-unused-vars": ["error", { caughtErrors: "none" }],
      "no-case-declarations": "off",
      "comma-dangle": ["error", "only-multiline"],
      complexity: ["error", 15],
      quotes: ["error", "double"],
      semi: ["error", "always"],
      "perfectionist/sort-imports": [
        "error",
        { order: "asc", type: "natural" },
      ],
      "perfectionist/sort-classes": [
        "error",
        {
          groups: [
            "index-signature",

            ["private-static-property", "private-static-accessor-property"],
            ["protected-static-property", "protected-static-accessor-property"],
            ["static-property", "static-accessor-property"],

            ["private-property", "private-accessor-property"],
            ["protected-property", "protected-accessor-property"],
            ["property", "accessor-property"],

            "constructor",

            ["private-static-get-method", "private-static-set-method"],
            ["protected-static-get-method", "protected-static-set-method"],
            ["static-get-method", "static-set-method"],

            ["private-get-method", "private-set-method"],
            ["protected-get-method", "protected-set-method"],
            ["get-method", "set-method"],

            ["private-static-method", "private-static-function-property"],
            ["protected-static-method", "protected-static-function-property"],
            ["static-method", "static-function-property"],

            ["private-method", "private-function-property"],
            ["protected-method", "protected-function-property"],
            ["method", "function-property"],

            "static-block",
            "unknown",
          ],
          ignoreCase: true,
          order: "asc",
          type: "alphabetical",
        },
      ],
      "perfectionist/sort-named-exports": [
        "error",
        { order: "asc", type: "natural" },
      ],
      "no-console": "off",
    },
  },
);
