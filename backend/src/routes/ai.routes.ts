import express from 'express';
import { aiController } from '../controllers/ai.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

router.post('/ask', authenticateToken, aiController.ask);

export default router;
