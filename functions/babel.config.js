module.exports = function (api) {
  api.cache(true);

  const presets = [
    [
      '@babel/preset-env',
      {
        targets: {
          node: '16',
        },
      },
    ],
  ];

  const plugins = [
    'add-module-exports',
    [
      'inline-dotenv',
      {
        path: `./.env.${process.env.NODE_ENV}`,
        unsafe: true,
      },
    ],
    [
      'module-resolver',
      {
        root: ['.'],
        alias: {
          '@': './lib',
        },
      },
    ],
  ];

  return {
    presets,
    plugins,
  };
};
