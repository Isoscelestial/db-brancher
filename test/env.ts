import z from 'zod';

const envSchema = z.object({
  NEON_API_URL: z.string().default('https://console.neon.tech/api/v2'),
  NEON_API_KEY: z.string({
    error:
      'Missing API key! Ensure this key is scoped to include the project ID',
  }),
  NEON_PROJECT_ID: z.string(),
});

type EnvSchema = z.infer<typeof envSchema>;

const env: EnvSchema = {} as EnvSchema;

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}

/**
 * Global setup function for Vitest
 *
 * @see https://vitest.dev/config/globalsetup
 */
export default function setup() {
  try {
    process.loadEnvFile('.env.test');
  } catch (error) {
    if (isNodeError(error)) {
      switch (error.code) {
        case 'ENOENT':
          console.error('❌ Missing .env.test file (tests will be skipped)');
          break;
        default:
          console.error('Failed to load environment variables:', error);
          break;
      }
      process.exit(1);
    } else {
      throw error;
    }
  }

  const parsed = envSchema.safeParse(process.env);

  if (parsed.success) {
    Object.assign(env, parsed.data);
  } else {
    const errors = z.treeifyError(parsed.error).properties ?? [];

    let errorString = '';
    for (const [key, value] of Object.entries(errors)) {
      errorString += `\n • ${key} - ${value.errors.join('; ')}`;
    }

    console.error(
      '❌ Invalid environment variables (tests will be skipped):',
      errorString,
    );
    process.exit(1);
  }

  return function teardown() {};
}
