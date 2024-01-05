module.exports = {
  root: true,
  env: {
    node: true,
    es6: true,
  },
  extends: ['eslint:recommended'],
  parser: '@babel/eslint-parser',
  parserOptions: {
    requireConfigFile: false,
    ecmaVersion: 2020,
  },
  plugins: ['es-x', 'import'],
  rules: {
    'es-x/no-async-iteration': 'error',
    'es-x/no-malformed-template-literals': 'error',
    'es-x/no-regexp-lookbehind-assertions': 'error',
    'es-x/no-regexp-named-capture-groups': 'error',
    'es-x/no-regexp-s-flag': ['off'],
    'es-x/no-regexp-unicode-property-escapes': 'error',
    'no-useless-escape': ['off'],
    'no-case-declarations': ['off'],
    'no-unused-vars': ['off'],
    'no-irregular-whitespace': ['off'],
    'import/extensions': ['error', 'never', { ignorePackages: false }],
  },
  settings: {
    'es-x': { aggressive: true },
    'import/resolver': {
      node: {
        extensions: ['.js', '.mjs'],
      },
      alias: {
        extensions: ['.js', '.mjs'],
        map: ['~', './lib'],
      },
    },
  },
  ignorePatterns: ['dist/**/*.js', '**/*.test.js'],
}
