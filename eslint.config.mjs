import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

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
    // Vendored Vercel AI Elements — upstream-maintained, don't hold to app lint bar.
    "src/components/ai-elements/**",
  ]),
  {
    rules: {
      "@typescript-eslint/no-empty-object-type": "error",
    },
  },
  {
    // Generated shadcn/ui components — stock patterns trip the new
    // react-hooks compiler rules; keep visible as warnings, not errors.
    files: ["src/components/ui/**"],
    rules: {
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
