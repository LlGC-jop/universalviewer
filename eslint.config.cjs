// eslint.config.js
const { defineConfig } = require('eslint/config');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const reactPlugin = require('eslint-plugin-react');
// get rules that turn off things that conflict with prettier i.e. prettier will fix them
const prettierConfig = require('eslint-config-prettier');
// uncomment the prettier plugin if you want formatting issues highlighted
// but as they'll be auto-fixed on save it's probably not needed.
//const prettierPlugin = require('eslint-plugin-prettier');

module.exports = defineConfig([
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      react: reactPlugin,
      //prettier: prettierPlugin,
    },
    rules: {
      //...prettierPlugin.configs.recommended.rules,
      semi: 'error',
      'prefer-const': 'error',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  prettierConfig,
]);
