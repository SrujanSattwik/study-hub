import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { z } from "zod";

// ── Single Root .env Path Resolution ─────────────────────────────────────────

// Resolve candidate paths for single root .env (/study-hub/.env)
const candidatePaths = [
  path.resolve(__dirname, "../../../.env"), // relative from src/config or dist/config
  path.resolve(__dirname, "../../.env"),
  path.resolve(process.cwd(), "../.env"), // when process runs from /backend
  path.resolve(process.cwd(), ".env"), // when process runs from /study-hub
];

let loadedEnvPath: string | null = null;

for (const p of candidatePaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    loadedEnvPath = p;
    break;
  }
}

if (!loadedEnvPath) {
  dotenv.config();
}

console.log("--------------------------------------------------");
console.log("⚙️  ENVIRONMENT LOADING AUDIT (SINGLE ROOT .ENV)");
console.log(`  Current Working Directory: ${process.cwd()}`);
console.log(`  Resolved .env Path:        ${loadedEnvPath ?? "Default process.env"}`);
console.log(`  File Exists?               ${loadedEnvPath ? "✔ Yes" : "❌ No"}`);
console.log(`  DATABASE_URL loaded?       ${process.env.DATABASE_URL ? "✔ Yes" : "❌ Missing"}`);
console.log(`  JWT_SECRET loaded?         ${process.env.JWT_SECRET ? "✔ Yes" : "❌ Missing"}`);
console.log(`  SMTP_USER loaded?          ${(process.env.SMTP_USER || process.env.MAIL_USER) ? "✔ Yes" : "❌ Missing"}`);
console.log(`  SMTP_PASS loaded?          ${(process.env.SMTP_PASS || process.env.MAIL_PASS) ? "✔ Yes" : "❌ Missing"}`);
console.log("--------------------------------------------------");

// ── Zod Environment Schema Validation ─────────────────────────────────────────

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // JWT
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters for production security"),

  // Refresh token config
  ACCESS_TOKEN_EXPIRY: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRY_DAYS: z.coerce.number().int().positive().default(30),

  // Email / SMTP
  MAIL_USER: z.string().optional().or(z.literal("")),
  MAIL_PASS: z.string().optional().or(z.literal("")),
  SMTP_USER: z.string().optional().or(z.literal("")),
  SMTP_PASS: z.string().optional().or(z.literal("")),
  SMTP_HOST: z.string().default("smtp.gmail.com"),
  SMTP_PORT: z.coerce.number().default(465),
  SMTP_SECURE: z.coerce.boolean().default(true),

  // AI Integration
  GEMINI_API_KEY: z.string().optional().or(z.literal("")),

  // CORS & Cookies
  CORS_ORIGINS: z.string().optional(),
  COOKIE_DOMAIN: z.string().optional(),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ Environment configuration validation failed:");
    console.error(JSON.stringify(result.error.format(), null, 2));
    process.exit(1);
  }
  return result.data;
};

export const config = parseEnv();
export type Config = typeof config;

export const getAllowedOrigins = (): string[] => {
  if (config.CORS_ORIGINS) {
    return config.CORS_ORIGINS.split(",")
      .map((o) => o.trim())
      .filter(Boolean);
  }
  return [
    "http://localhost:5173",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ];
};

export const logEnvStatus = () => {
  // Environment status is audited above during boot
};
