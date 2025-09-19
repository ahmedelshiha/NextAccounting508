import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: process.cwd() });

export default [
  // Global ignores (prevents parsing of temporary/generated folders)
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "temp/**",
    ],
  },

  // Next.js and TypeScript recommended configs
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Base rules for the app
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "react/jsx-no-undef": "error",
      "@typescript-eslint/triple-slash-reference": "off",
    },
  },

  // Looser rules for tests
  {
    files: [
      "tests/**",
      "**/*.test.ts",
      "**/*.test.tsx",
      "src/app/**/tests/**",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
    },
  },

  // Scripts and edge/runtime functions can use require and any types as needed
  {
    files: ["scripts/**", "netlify/functions/**"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // Declaration files and Next generated env types
  {
    files: ["**/*.d.ts", "next-env.d.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/triple-slash-reference": "off",
    },
  },
];
