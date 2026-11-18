import js from "@eslint/js";
import tseslint from "typescript-eslint";
export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
      ".lighthouseci/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        module: "readonly",
        document: "readonly",
        window: "readonly",
        console: "readonly",
        process: "readonly",
        URL: "readonly",
        Buffer: "readonly",
        structuredClone: "readonly",
      },
    },
  },
);
