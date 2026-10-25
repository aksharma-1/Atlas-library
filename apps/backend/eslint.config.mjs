import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    rules: {
      // Flag unused variables but allow underscore-prefixed params (e.g. _req, _next)
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // Warn on explicit `any` — review before shipping
      '@typescript-eslint/no-explicit-any': 'warn',
      // Return types are inferred well by TS; don't force explicit annotations everywhere
      '@typescript-eslint/explicit-function-return-type': 'off',
      // Prefer `import type` for type-only imports to keep runtime clean
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  },
);
