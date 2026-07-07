import dotenv from "dotenv";
import path from "path";

// Load .env from backend root; provide safe test fallbacks for any missing vars
dotenv.config({ path: path.join(__dirname, "../../.env") });

// Ensure all required env vars have safe test fallbacks
process.env.JWT_SECRET ??= "test-secret-key-for-vitest-at-least-32-chars!";
process.env.DATABASE_URL ??= "postgresql://localhost:5432/study_hub_test";
process.env.ACCESS_TOKEN_EXPIRY ??= "15m";
process.env.REFRESH_TOKEN_EXPIRY_DAYS ??= "30";
process.env.NODE_ENV ??= "test";
process.env.GEMINI_API_KEY ??= "test-key";
