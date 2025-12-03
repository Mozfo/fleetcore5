import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // 1. Next.js defaults
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // 2. Ignores
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "coverage/**",
      "archive_fleetcore_20251106/**",
      "_archive/**",
      "generated-emails/**",
      "**/*.backup-*",
    ],
  },

  // 3. TypeScript STRICT rules
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      // 🚫 BLOCKERS - Dette technique interdite
      "no-console": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // ⚠️ WARNINGS - Bonnes pratiques
      "prefer-const": "warn",
      "no-unreachable": "error",
      eqeqeq: ["error", "always"],
      "no-var": "error",
      "@typescript-eslint/no-floating-promises": "error",
    },
  },

  // 4. Exceptions fichiers spécifiques
  {
    files: ["prisma/seed.ts", "scripts/**/*.ts", "*.config.ts", "*.config.mjs"],
    rules: {
      "no-console": "off",
    },
  },
];

export default eslintConfig;
