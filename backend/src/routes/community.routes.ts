import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { communityController } from "../controllers/community.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import { perfLogger } from "../middleware/perf.middleware";

const router = express.Router();

// ─── Upload directories ───────────────────────────────────────────────────────

const UPLOADS_BASE = path.join(__dirname, "../../../uploads/community");
const MATERIALS_DIR = path.join(UPLOADS_BASE, "materials");
const CHAT_DIR = path.join(UPLOADS_BASE, "chat");
const POST_DIR = path.join(UPLOADS_BASE, "posts");

[MATERIALS_DIR, CHAT_DIR, POST_DIR].forEach((dir) =>
  fs.mkdirSync(dir, { recursive: true }),
);

// ─── Allowed MIME types ───────────────────────────────────────────────────────

const ALLOWED_COMMUNITY_MIMES: Record<string, string[]> = {
  ".pdf": ["application/pdf"],
  ".doc": ["application/msword"],
  ".docx": [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  ".xls": ["application/vnd.ms-excel"],
  ".xlsx": [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  ".ppt": ["application/vnd.ms-powerpoint"],
  ".pptx": [
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ],
  ".txt": ["text/plain"],
  ".zip": ["application/zip", "application/x-zip-compressed"],
  ".rar": ["application/x-rar-compressed", "application/vnd.rar"],
  ".png": ["image/png"],
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".gif": ["image/gif"],
  ".mp4": ["video/mp4"],
  ".mp3": ["audio/mpeg", "audio/mp3"],
  ".wav": ["audio/wav", "audio/x-wav"],
};

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const destType = req.body?.destType ?? "materials";
    const dirs: Record<string, string> = {
      chat: CHAT_DIR,
      posts: POST_DIR,
      materials: MATERIALS_DIR,
    };
    cb(null, dirs[destType] ?? MATERIALS_DIR);
  },
  filename: (_req, _file, cb) => {
    cb(null, uuidv4()); // Never expose original filename on disk
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024, files: 1 }, // 25 MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedMimes = ALLOWED_COMMUNITY_MIMES[ext];
    if (!allowedMimes) return cb(new Error(`File type '${ext}' not allowed`));
    if (!allowedMimes.includes(file.mimetype)) {
      return cb(new Error(`MIME type mismatch for extension '${ext}'`));
    }
    cb(null, true);
  },
});

// ─── Global middleware ────────────────────────────────────────────────────────

router.use(perfLogger);
// All community routes require authentication
router.use(authenticateToken);

// ─── Routes ──────────────────────────────────────────────────────────────────

// Home bundle & stats
router.get("/home-bundle", communityController.getHomeBundle);
router.get("/stats", communityController.getStats);
router.get("/trending", communityController.getTrending);
router.get("/challenges", communityController.getChallenges);
router.get("/events/upcoming", communityController.getUpcomingEvents);
router.get("/groups/suggested", communityController.getSuggestedGroups);
router.get("/groups/joined", communityController.getJoinedGroups);

// Groups CRUD
router.get("/groups", communityController.listGroups);
router.post("/groups", communityController.createGroup);
router.post("/groups/:id/join", communityController.joinGroup);
router.post("/groups/:id/leave", communityController.leaveGroup);
router.get("/groups/:id", communityController.getGroupWorkspace);

// Group Materials
router.get("/groups/:id/materials", communityController.getGroupMaterials);
router.post(
  "/groups/:id/materials/folders",
  communityController.createGroupFolder,
);
router.post(
  "/groups/:id/materials",
  upload.single("file"),
  communityController.uploadGroupMaterial,
);
router.delete("/groups/:id/materials/:materialId", communityController.deleteGroupMaterial);
router.post("/groups/:id/materials/:materialId/download", communityController.trackGroupMaterialDownload);

// Group Announcements
router.get("/groups/:id/announcements", communityController.getGroupAnnouncements);
router.post("/groups/:id/announcements", communityController.createGroupAnnouncement);
router.patch("/groups/:id/announcements/:announcementId", communityController.updateGroupAnnouncement);
router.delete("/groups/:id/announcements/:announcementId", communityController.deleteGroupAnnouncement);

// Q&A Board
router.get("/groups/:id/questions", communityController.getGroupQuestions);
router.post("/groups/:id/questions", communityController.createGroupQuestion);
router.patch("/groups/:id/questions/:questionId", communityController.updateGroupQuestionStatus);
router.delete("/groups/:id/questions/:questionId", communityController.deleteGroupQuestion);
router.post("/groups/:id/questions/:questionId/answers", communityController.createGroupAnswer);
router.delete("/groups/:id/answers/:answerId", communityController.deleteGroupAnswer);

// Meetings
router.get("/groups/:id/meetings", communityController.getGroupMeetings);
router.post("/groups/:id/meetings", communityController.createGroupMeeting);
router.patch("/groups/:id/meetings/:meetingId/end", communityController.endGroupMeeting);


// Feed / Posts
router.get("/feed", communityController.getFeed);
router.post("/feed", upload.single("media"), communityController.createPost);
router.post("/feed/:id/like", communityController.likePost);
router.get("/feed/:id/comments", communityController.getComments);
router.post("/feed/:id/comments", communityController.addComment);
router.delete("/feed/:id", communityController.deletePost);

export default router;
