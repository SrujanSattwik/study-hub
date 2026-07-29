import express from 'express';
import { healthController } from '../controllers/health.controller';

const router = express.Router();

// Public Health & Readiness endpoints for container health checks
router.get('/', healthController.getHealth);
router.get('/readiness', healthController.getReadiness);

export default router;
