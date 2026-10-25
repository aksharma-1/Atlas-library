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
