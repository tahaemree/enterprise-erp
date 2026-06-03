import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import unusedImports from "eslint-plugin-unused-imports";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "e2e/**",
    // Not application source — third-party agent skills and generated artifacts.
    ".claude/**",
    "coverage/**",
    "test-results/**",
    "playwright-report/**",
  ]),
  {
    plugins: { "unused-imports": unusedImports },
    rules: {
      // unused-imports handles imports (auto-fixable) and vars; disable the
      // base rule to avoid duplicate reports.
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      // Honor the `_`-prefix convention for intentionally-unused bindings
      // (e.g. `_params` in Next.js page props, ignored catch errors).
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  {
    // Declaration files legitimately contain type-only / module-augmentation
    // imports that the unused-imports rule cannot see as "used".
    files: ["**/*.d.ts"],
    rules: {
      "unused-imports/no-unused-imports": "off",
      "unused-imports/no-unused-vars": "off",
    },
  },
]);

export default eslintConfig;
