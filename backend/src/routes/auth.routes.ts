import express from "express";
import { authController } from "../controllers/auth.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = express.Router();

// Public — no auth required
router.post("/send-otp", authController.sendOtp);
router.post("/verify-otp-signup", authController.verifyOtpSignup);
router.post("/login", authController.login);

// Public but uses HttpOnly cookie (no Bearer token needed)
router.post("/refresh", authController.refresh);

// Authenticated
router.post("/logout", authenticateToken, authController.logout);
router.get("/session", authenticateToken, authController.getSession);

export default router;
