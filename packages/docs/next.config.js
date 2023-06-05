/** @type {import('nextra').NextConfig} */
const withNextra = require("nextra")({
  theme: "nextra-theme-docs",
  themeConfig: "./theme.config.tsx",
});

module.exports = withNextra({
  //   webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
  //     config.externals.push({
  //       "utf-8-validate": "commonjs utf-8-validate",
  //       bufferutil: "commonjs bufferutil",
  //     });
  //     return config;
  //   },
});
