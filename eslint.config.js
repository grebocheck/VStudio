import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // The avatar SVG is intentionally re-rendered every animation frame and
      // reads `Date.now()` in render for procedural shake/squash. The experimental
      // purity rule flags this legitimate pattern, so it's disabled here.
      'react-hooks/purity': 'off',
      // The MediaPipe / GenAI surfaces are loosely typed; allow pragmatic `any`.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    // Server runs on Node only.
    files: ['src/server.ts'],
    languageOptions: { globals: { ...globals.node } },
  },
);
