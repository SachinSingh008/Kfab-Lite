import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_ANON_KEY: z.string().min(10, 'SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(''),
  ALLOWED_ORIGINS: z
    .string()
    .default('http://localhost:3000,http://localhost:5173,https://360.kfabinfraproject.site'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid backend environment configuration:', parsedEnv.error.format());
  throw new Error('Environment configuration validation failed');
}

export const ENV = parsedEnv.data;
export const isProd = ENV.NODE_ENV === 'production';
export const allowedOriginsList = ENV.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
