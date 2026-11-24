import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const mcAppConfig = require('@commercetools-frontend/eslint-config-mc-app');

const config = [
  {
    ignores: [
      'public/**',
      'build/**',
      'src/types/generated/**',
      'src/shared/**',
    ],
  },
  ...mcAppConfig,
];

export default config;
