import express from "express";
import http from "http";
import { Server as SocketServer } from "socket.io";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { version } from "../package.json";

import { config, getAllowedOrigins } from "./utils/config";
import { logger } from "./utils/logger";
import { testDbConnection } from "./database/client";
import { initSocket } from "./services/socket.service";
import { errorHandler } from "./middleware/error.middleware";
import { perfLogger } from "./middleware/perf.middleware";

import authRouter from "./routes/auth.routes";
import materialsRouter from "./routes/materials.routes";
import communityRouter from "./routes/community.routes";
import aiRouter from "./routes/ai.routes";

const app = express();
const server = http.createServer(app);
const ALLOWED_ORIGINS = getAllowedOrigins();

// ─── Socket.io ────────────────────────────────────────────────────────────────

const io = new SocketServer(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST"],
    credentials: true,
  },
});
initSocket(io);

// ─── Security Headers (Helmet) ───────────────────────────────────────────────

app.use(
  helmet({
    crossOriginEmbedderPolicy: false, // Needed for Vite dev / some browser features
    contentSecurityPolicy:
      config.NODE_ENV === "production"
        ? undefined // Use default strict CSP in production
        : false, // Disable CSP in development (allows HMR etc.)
  }),
);

// ─── CORS ────────────────────────────────────────────────────────────────────

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, server-to-server)
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    optionsSuccessStatus: 204,
  }),
);

// ─── Global Rate Limiting ────────────────────────────────────────────────────

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please slow down." },
  skip: (req) => req.method === "OPTIONS",
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Try again later.",
  },
});

app.use(globalLimiter);
app.use("/auth/login", authLimiter);
app.use("/auth/send-otp", authLimiter);
app.use("/auth/refresh", authLimiter);

// ─── Body Parsing & Compression ──────────────────────────────────────────────

app.use(compression());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser());

// ─── Request Logger ───────────────────────────────────────────────────────────

app.use((req, _res, next) => {
  logger.debug(`→ ${req.method} ${req.path} | IP: ${req.ip}`);
  next();
});

// ─── Performance Profiler ────────────────────────────────────────────────────

app.use(perfLogger);

// ─── Static Uploads ──────────────────────────────────────────────────────────

app.use("/uploads", express.static(path.join(__dirname, "../../uploads")));

// ─── API Routes ──────────────────────────────────────────────────────────────

app.use("/auth", authRouter);
app.use("/api/materials", materialsRouter);
app.use("/api/community", communityRouter);
app.use("/api", aiRouter);

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get("/health", async (_req, res) => {
  const dbStatus = await testDbConnection();
  const httpStatus = dbStatus.success ? 200 : 503;
  res.status(httpStatus).json({
    status: dbStatus.success ? "ok" : "degraded",
    database: dbStatus.success ? "connected" : "disconnected",
    uptime: Math.floor(process.uptime()),
    version,
    env: config.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── Global Error Handler ────────────────────────────────────────────────────

app.use(errorHandler);

// ─── Boot ─────────────────────────────────────────────────────────────────────

const startServer = async () => {
  const PORT = config.PORT;
  server.listen(PORT, async () => {
    logger.info(
      `✅ StudyHub Backend running on port ${PORT} [${config.NODE_ENV}]`,
    );
    logger.info(`✅ Auth API:      http://localhost:${PORT}/auth/*`);
    logger.info(`✅ Materials API: http://localhost:${PORT}/api/materials`);
    logger.info(`✅ Community API: http://localhost:${PORT}/api/community`);
    logger.info(`✅ AI API:        http://localhost:${PORT}/api/ask`);
    logger.info(`✅ Health:        http://localhost:${PORT}/health`);

    const dbStatus = await testDbConnection();
    if (dbStatus.success) {
      logger.info(
        `🐘 PostgreSQL connected via Prisma (server time: ${dbStatus.time})`,
      );
    } else {
      logger.error(`⚠️ DB connection failed: ${dbStatus.error}`);
    }
  });
};

if (config.NODE_ENV !== "test") {
  startServer().catch((err) => {
    logger.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  });
}

export { app, server };
