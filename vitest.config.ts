import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    // Environnement: Node.js (pas browser/jsdom)
    // Justification: Nous testons des helpers backend (audit.ts), pas des composants React
    environment: "node",

    // Globals: true (évite imports répétés de describe, it, expect)
    globals: true,

    // Include/exclude patterns
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules", ".next", "dist"],

    // Coverage configuration (optionnel mais utile)
    coverage: {
      provider: "v8", // v8 est plus rapide que istanbul
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        ".next/",
        "vitest.config.ts",
        "**/*.d.ts",
        "**/*.test.ts",
        "**/*.test.tsx",
      ],
    },
  },

  resolve: {
    // Alias de chemins pour correspondre à tsconfig.json
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
