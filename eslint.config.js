import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  // Regras recomendadas do ESLint e TypeScript
  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  // Desativa as regras do ESLint que entrariam em conflito com o Prettier
  eslintConfigPrettier,

  {
    // Ignora pastas padrões
    ignores: ['node_modules/**', 'dist/**', 'coverage/**'],
  },
  {
    // Regras customizadas para o projeto
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
);
