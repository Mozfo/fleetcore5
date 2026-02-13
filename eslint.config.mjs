import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  // 1. Next.js defaults (native flat config in v16)
  ...nextCoreWebVitals,
  ...nextTypescript,

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

  // 3. TypeScript STRICT rules (plugin/parser provided by nextTypescript)
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
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

      // React Compiler rules (new in Next 16) — disabled until code is adapted
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "react-hooks/incompatible-library": "off",
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
