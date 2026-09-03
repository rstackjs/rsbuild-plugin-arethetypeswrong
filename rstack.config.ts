// Configuration guide: https://rstack.rs/config
import { define } from 'rstack';

define.lib(async () => {
  const { pluginPublint } = await import('rsbuild-plugin-publint');

  return {
    dts: { bundle: true },
    format: 'esm',
    plugins: [pluginPublint()],
    syntax: 'es2022',
  };
});

define.test({
  coverage: {
    exclude: ['.rslib/**', './dist/**', './test/**', './rstack.config.ts'],
    thresholds: {
      statements: 100,
      functions: 100,
      branches: 98,
      lines: 100,
    },
  },
});

define.fmt({
  singleQuote: true,
  sortPackageJson: true,
});

define.staged({
  '*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}': ['rs lint', 'rs fmt'],
  '*.{json,jsonc,md,mdx,css,scss,less,html,yml,yaml}': 'rs fmt',
});

define.lint(({ js, ts }) => [js.configs.recommended, ts.configs.recommended]);
