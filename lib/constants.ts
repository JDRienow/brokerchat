import { generateHashedPassword } from './db/utils';

export const isProductionEnvironment = process.env.NODE_ENV === 'production';
export const isDevelopmentEnvironment = process.env.NODE_ENV === 'development';
export const isTestEnvironment = Boolean(
  process.env.PLAYWRIGHT_TEST_BASE_URL ||
    process.env.PLAYWRIGHT ||
    process.env.CI_PLAYWRIGHT,
);

// Use a static dummy password to prevent timing attacks
export const DUMMY_PASSWORD = generateHashedPassword(
  'dummy-password-for-timing-attack-protection',
);
