import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: process.cwd() });

const config = [
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
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["off", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "all", caughtErrorsIgnorePattern: "^_", ignoreRestSiblings: true }],
      "react/jsx-no-undef": "error",
      "react-hooks/exhaustive-deps": "off",
      "@next/next/no-img-element": "off",
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
      "@typescript-eslint/no-require-imports": "off",
    },
  },

  // Scripts and edge/runtime functions can use require and any types as needed
  {
    files: ["scripts/**", "netlify/functions/**", "netlify/plugins/**", "netlify/**"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // Allow require in prisma wrapper for lazy client creation
  {
    files: ["src/lib/prisma.ts"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
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

  // Enforce withTenantContext in API routes
  {
    files: ["src/app/api/**/route.ts", "src/app/api/**/*.ts"],
    rules: {
      "no-restricted-imports": ["error", { paths: [
        { name: "next-auth", importNames: ["getServerSession"], message: "Use withTenantContext() and requireTenantContext() instead of getServerSession in API routes" },
        { name: "next-auth/next", importNames: ["getServerSession"], message: "Use withTenantContext() and requireTenantContext() instead of getServerSession in API routes" }
      ] }],
      "no-restricted-syntax": ["error",
        {
          selector: "CallExpression[callee.name='getServerSession']",
          message: "Use withTenantContext() and requireTenantContext() in API routes"
        }
      ]
    },
  },
  // Forbid raw prisma queries in API routes (allowlist exceptions)
  {
    files: ["src/app/api/**/route.ts", "src/app/api/**/*.ts"],
    ignores: [
      "src/app/api/db-check/route.ts",
      "src/app/api/admin/system/health/route.ts",
      "src/app/api/uploads/av-callback/route.ts"
    ],
    rules: {
      "no-restricted-syntax": ["error",
        { selector: "CallExpression[callee.property.name=/^\\$?(queryRaw|executeRaw|queryRawUnsafe|executeRawUnsafe)$/]",
          message: "Use typed Prisma queries or a vetted db.raw helper with explicit tenant scoping. Raw SQL in API routes is restricted." }
      ]
    }
  },
];

export default config;
