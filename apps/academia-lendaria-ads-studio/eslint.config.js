import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// Espelha apps/web/eslint.config.js (REUSE — arch §2.3).
export default defineConfig([
  globalIgnores(['dist', 'src/routeTree.gen.ts']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      'react-hooks/rules-of-hooks': 'warn',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/static-components': 'warn',
      'react-refresh/only-export-components': [
        'warn',
        {
          allowConstantExport: true,
          allowExportNames: ['Route', 'loader', 'action', 'meta', 'links', 'headers', 'handle'],
        },
      ],
    },
  },
  {
    files: ['src/routes/**/*.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  // server/ é Node (BFF skeleton) — não browser. Apenas globals de Node.
  {
    files: ['server/**/*.{ts,tsx}'],
    languageOptions: {
      globals: globals.node,
    },
  },
])
