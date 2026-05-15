import js from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginReactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
  // Global ignores
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "build/**",
      "prisma/migrations/**",
      "client/dist/**",
      "coverage/**",
      "tests/**",
      "attached_assets/**",
      "**/*.config.js",
      "**/*.config.ts",
    ],
  },

  // Base recommended rules for all JS/TS files
  js.configs.recommended,

  // TypeScript recommended (without type-aware rules)
  ...tseslint.configs.recommended,

  // Global settings for all files
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
      ecmaVersion: 2022,
      sourceType: "module",
    },
    rules: {
      // Disable overly strict rules — codebase cleanup is a separate concern
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/ban-ts-comment": "warn",
      // Noisy rules with many pre-existing violations — disable until cleanup sprint
      "no-useless-escape": "off",
      "no-empty": "off",
      "no-irregular-whitespace": "off",
    },
  },

  // Client-side React files
  {
    files: ["client/src/**/*.{ts,tsx}"],
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
      "react-refresh": pluginReactRefresh,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      // React rules
      ...pluginReact.configs.recommended.rules,
      ...pluginReactHooks.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/display-name": "off",
      "react/no-unescaped-entities": "off",
      "react/no-unknown-property": "off",
      "react-refresh/only-export-components": "warn",
      "react-hooks/exhaustive-deps": "warn",
      // Pre-existing violations in shadcn/ui generated components and existing code
      "react-hooks/set-state-in-effect": "warn",
      // shadcn/ui sidebar uses Math.random() in useMemo — disable until component is refactored
      "react-hooks/purity": "off",
    },
  },

  // Server-side files — disable React rules
  {
    files: ["server/**/*.ts"],
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
    },
  },

  // Prettier last — disables ESLint rules that conflict with Prettier formatting
  eslintConfigPrettier,
);
