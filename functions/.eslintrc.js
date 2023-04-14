module.exports = {
  root: true,
  env: {
    node: true,
    es6: true,
  },
  extends: ['eslint:recommended'],
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 2020,
  },
  plugins: ['es-x'],
  rules: {
    'es-x/no-async-iteration': 'error',
    'es-x/no-malformed-template-literals': 'error',
    'es-x/no-regexp-lookbehind-assertions': 'error',
    'es-x/no-regexp-named-capture-groups': 'error',
    'es-x/no-regexp-s-flag': ['warn'],
    'es-x/no-regexp-unicode-property-escapes': 'error',
    'no-useless-escape': ['off'],
    'no-case-declarations': ['off'],
    'no-unused-vars': ['warn'],
    'no-irregular-whitespace': ['off'],
  },
  settings: {
    'es-x': { aggressive: true },
  },
  ignorePatterns: ['dist/**/*.js', '**/*.test.js'],
};
