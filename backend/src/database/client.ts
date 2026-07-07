import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

export const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'info' },
    { emit: 'stdout', level: 'warn' },
    { emit: 'stdout', level: 'error' },
  ],
});

// Log slow queries (>100ms) or log query events when debugging
prisma.$on('query', (e) => {
  if (e.duration >= 100) {
    logger.warn(`[SLOW DB QUERY] ${e.duration}ms | Query: ${e.query} | Params: ${e.params}`);
  }
});

export const testDbConnection = async (): Promise<{ success: boolean; time?: string; error?: string }> => {
  try {
    // Run a simple test query to ensure PostgreSQL is up
    const res = await prisma.$queryRaw<{ current_time: Date }[]>`SELECT NOW() AS current_time`;
    return { success: true, time: res[0]?.current_time?.toISOString() };
  } catch (err: any) {
    logger.error(`[DB CONNECT ERROR] Failed to connect to database: ${err.message}`);
    return { success: false, error: err.message };
  }
};
