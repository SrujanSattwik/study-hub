import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { materialsController } from "../controllers/materials.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = express.Router();

// ─── Upload directory setup ───────────────────────────────────────────────────

const UPLOADS_DIR = path.join(__dirname, "../../../uploads");
const FOLDERS = ["textbooks", "videos", "audio", "notes"] as const;

FOLDERS.forEach((folder) => {
  const p = path.join(UPLOADS_DIR, folder);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

// ─── Allowed MIME types ───────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  ".pdf": ["application/pdf"],
  ".mp4": ["video/mp4"],
  ".avi": ["video/x-msvideo", "video/avi"],
  ".mov": ["video/quicktime"],
  ".mp3": ["audio/mpeg", "audio/mp3"],
  ".wav": ["audio/wav", "audio/x-wav"],
  ".m4a": ["audio/mp4", "audio/x-m4a"],
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".png": ["image/png"],
  ".doc": ["application/msword"],
  ".docx": [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  ".ppt": ["application/vnd.ms-powerpoint"],
  ".pptx": [
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ],
  ".txt": ["text/plain"],
};

const ALLOWED_EXTENSIONS = Object.keys(ALLOWED_MIME_TYPES);

// ─── Multer storage ───────────────────────────────────────────────────────────

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.body?.type ?? "notes";
    const typeMap: Record<string, string> = {
      textbook: "textbooks",
      video: "videos",
      audio: "audio",
      notes: "notes",
    };
    cb(null, path.join(UPLOADS_DIR, typeMap[type] ?? "notes"));
  },
  filename: (_req, _file, cb) => {
    // Always use UUID filename — never original filename on disk (prevents path traversal)
    cb(null, `${uuidv4()}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB — reduced from 500 MB
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedMimes = ALLOWED_MIME_TYPES[ext];
    if (!allowedMimes) {
      return cb(new Error(`File type '${ext}' is not allowed`));
    }
    // Validate MIME type matches extension (double check)
    if (!allowedMimes.includes(file.mimetype)) {
      return cb(
        new Error(
          `MIME type '${file.mimetype}' does not match extension '${ext}'`,
        ),
      );
    }
    cb(null, true);
  },
});

// ─── Routes ───────────────────────────────────────────────────────────────────

// Public browse — no auth required to view materials list
router.get("/", materialsController.getMaterials);

// Auth required for upload and download tracking
router.post(
  "/",
  authenticateToken,
  upload.single("file"),
  materialsController.uploadMaterial,
);
router.post(
  "/:id/download",
  authenticateToken,
  materialsController.downloadMaterial,
);

export default router;
