module.exports = {
  presets: [
    '@babel/preset-env',
  ],
  plugins: [
  ],
  env: {
    test: {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
      ],
    },
  },
};
