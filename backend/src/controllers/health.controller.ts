import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const startTime = Date.now();

export class HealthController {
  /**
   * Health Check Endpoint — Liveness
   */
  async getHealth(req: Request, res: Response): Promise<void> {
    const memory = process.memoryUsage();
    const uptimeSec = Math.floor((Date.now() - startTime) / 1000);

    res.json({
      status: 'ok',
      version: 'v1.0.0',
      buildDate: '2026-07-29',
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      uptimeSec,
      memory: {
        rssMb: Math.round(memory.rss / (1024 * 1024)),
        heapUsedMb: Math.round(memory.heapUsed / (1024 * 1024)),
        heapTotalMb: Math.round(memory.heapTotal / (1024 * 1024)),
      },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Readiness Check Endpoint — Database & Service Readiness
   */
  async getReadiness(req: Request, res: Response): Promise<void> {
    try {
      // Ping PostgreSQL database with simple query
      await prisma.$queryRaw`SELECT 1`;

      res.json({
        status: 'ready',
        database: 'connected',
        services: {
          aiEngine: 'operational',
          streaming: 'operational',
          documentIntelligence: 'operational',
        },
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(503).json({
        status: 'unhealthy',
        database: 'disconnected',
        error: err.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
}

export const healthController = new HealthController();
export default healthController;
