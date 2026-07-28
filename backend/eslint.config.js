import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  // ESLint and TypeScript recommended rules
  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  // Disables ESLint rules that conflict with Prettier formatting
  eslintConfigPrettier,

  {
    ignores: ['node_modules/**', 'dist/**', 'coverage/**'],
  },
  {
    rules: {
      // Allow unused variables prefixed with underscore (e.g. _next in middleware)
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
);
