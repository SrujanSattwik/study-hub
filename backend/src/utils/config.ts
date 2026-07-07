import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

// Load env variables from backend root .env
dotenv.config({ path: path.join(__dirname, "../../.env") });

const configSchema = z.object({
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Database
  DATABASE_URL: z
    .string()
    .url("DATABASE_URL must be a valid connection string"),

  // JWT — single secret for access tokens (short-lived JWTs)
  JWT_SECRET: z
    .string()
    .min(
      32,
      "JWT_SECRET must be at least 32 characters for production security",
    ),

  // Refresh token config
  ACCESS_TOKEN_EXPIRY: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRY_DAYS: z.coerce.number().int().positive().default(30),

  // Email / SMTP
  MAIL_USER: z.string().email().optional().or(z.literal("")),
  MAIL_PASS: z.string().optional().or(z.literal("")),

  // AI
  GEMINI_API_KEY: z
    .string()
    .min(1, "GEMINI_API_KEY is required")
    .optional()
    .or(z.literal("")),

  // CORS — comma-separated list of allowed origins
  CORS_ORIGINS: z.string().optional(),

  // Cookie domain (leave empty in dev)
  COOKIE_DOMAIN: z.string().optional(),
});

const parseEnv = () => {
  const result = configSchema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ Environment configuration validation failed:");
    console.error(JSON.stringify(result.error.format(), null, 2));
    process.exit(1);
  }
  return result.data;
};

export const config = parseEnv();

/**
 * Allowed CORS origins derived from CORS_ORIGINS env (comma-separated)
 * or sensible dev defaults.
 */
export const getAllowedOrigins = (): string[] => {
  if (config.CORS_ORIGINS) {
    return config.CORS_ORIGINS.split(",")
      .map((o) => o.trim())
      .filter(Boolean);
  }
  return [
    "http://localhost:5173", // Vite default
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ];
};
