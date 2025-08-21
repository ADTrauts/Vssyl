import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import parser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default tseslint.config(
  {
    ignores: ['*.json', 'server/dist/', 'web/.next/', 'web/out/', 'node_modules/'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
    },
  },
  // Storybook stories: allow unused React import and relax hooks rule
  {
    files: ['shared/stories/**/*.tsx', 'shared/stories/**/*.ts', 'shared/src/stories/**/*.tsx', 'shared/src/stories/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { varsIgnorePattern: '^React$' },
      ],
      'react-hooks/rules-of-hooks': 'off',
    },
  },
  // Node/Express (server)
  {
    files: ['server/**/*.ts', 'server/**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      parser: parser,
      parserOptions: {
        project: './server/tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      'no-console': 'off',
    },
  },
  // Next.js (web)
  {
    files: ['web/**/*.ts', 'web/**/*.tsx'],
    rules: {
      // Add Next.js/React-specific rules here if needed
    },
  },
  // Shared (React components)
  {
    files: ['shared/**/*.ts', 'shared/**/*.tsx'],
    rules: {
      // Add shared-specific rules here if needed
    },
  },
); 