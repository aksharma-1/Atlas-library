import { z } from 'zod';

/**
 * Zod schema for all required/optional environment variables.
 * The app exits immediately at startup if validation fails,
 * preventing hard-to-debug runtime errors from missing config.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  /** Coerced to number — accepts both numeric strings and numbers */
  PORT: z.coerce.number().int().positive().default(5000),
  /** MongoDB connection URI — required, no default */
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  /** CORS allowed origin — defaults to Vite dev server URL */
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  /** Secret used to sign JWT access tokens — must be long and random in production */
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  /** JWT expiry duration string understood by jsonwebtoken, e.g. "24h", "7d" */
  JWT_EXPIRES_IN: z.string().default('24h'),
  /** Super Admin initial setup credentials — required in production for bootstrapping safely */
  SUPERADMIN_EMAIL: z.string().email().optional(),
  SUPERADMIN_PASSWORD: z.string().min(8).optional(),
  SUPERADMIN_NAME: z.string().default('Platform Super Admin'),
  /** Rate Limiting configurations */
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000), // 15 mins
  AUTH_RATE_LIMIT_MAX_ATTEMPTS: z.coerce.number().int().positive().default(10), // 10 attempts
  PASSWORD_RESET_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5), // 5 attempts per window
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('\n❌  Invalid or missing environment variables:\n');
  const fieldErrors = result.error.flatten().fieldErrors;
  for (const [field, errors] of Object.entries(fieldErrors)) {
    console.error(`   ${field}: ${errors?.join(', ')}`);
  }
  console.error('\nCopy apps/backend/.env.example → apps/backend/.env and fill in the values.\n');
  process.exit(1);
}

/** Validated, typed environment configuration. Frozen to prevent accidental mutation. */
export const env = Object.freeze(result.data);
