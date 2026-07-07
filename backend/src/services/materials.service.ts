import { prisma } from '../database/client';
import { cache } from '../database/cache';
import { logger } from '../utils/logger';
import { NotFoundError } from '../utils/errors';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export interface MaterialInput {
  title: string;
  description?: string;
  link?: string;
  type?: string;
  author?: string;
  userId: string;
  subject?: string;
  difficulty?: string;
  file?: Express.Multer.File;
}

export class MaterialsService {
  private static listCacheKey(type?: string, userId?: string, page?: number, limit?: number): string {
    return `mat:${type || 'all'}:${userId || 'any'}:${page}:${limit}`;
  }

  private static detectTypeAndFormat(file?: Express.Multer.File, link?: string) {
    if (file) {
      const ext = path.extname(file.originalname).toLowerCase();
      if (ext === '.pdf') return { type: 'textbook', format: 'pdf' };
      if (['.mp4', '.avi', '.mov'].includes(ext)) return { type: 'video', format: ext.slice(1) };
      if (['.mp3', '.wav', '.m4a'].includes(ext)) return { type: 'audio', format: ext.slice(1) };
      return { type: 'notes', format: ext.slice(1) };
    }
    if (link) {
      if (link.includes('youtube.com') || link.includes('youtu.be')) return { type: 'video', format: 'link' };
      if (link.includes('soundcloud') || link.includes('spotify')) return { type: 'audio', format: 'link' };
      return { type: 'notes', format: 'link' };
    }
    return { type: 'notes', format: 'link' };
  }

  async list(type?: string, page = 1, limit = 5, userId?: string) {
    const pageNum = Math.max(1, page);
    const limitNum = Math.min(100, Math.max(1, limit));
    const offset = (pageNum - 1) * limitNum;

    // Cache check
    const cKey = MaterialsService.listCacheKey(type, userId, pageNum, limitNum);
    const cached = cache.get(cKey);
    if (cached) {
      return cached;
    }

    const start = process.hrtime.bigint();

    // Use Prisma model calls for clean type safety
    const [materialsRaw, totalItems] = await Promise.all([
      prisma.material.findMany({
        where: {
          type: type || undefined,
          userId: userId || undefined,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limitNum,
        skip: offset,
      }),
      prisma.material.count({
        where: {
          type: type || undefined,
          userId: userId || undefined,
        },
      }),
    ]);

    const queryMs = Number(process.hrtime.bigint() - start) / 1e6;
    if (queryMs > 50) {
      logger.warn(`[MATERIALS SERVICE] Slow list query: ${queryMs.toFixed(1)}ms`);
    }

    const materials = materialsRaw.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      type: row.type,
      format: row.format,
      filePath: row.filePath,
      link: row.link,
      thumbnail: row.thumbnail,
      downloadCount: row.downloadCount,
      author: row.author,
      createdAt: row.createdAt,
      subject: row.subject,
      difficulty: row.difficulty,
    }));

    const totalPages = Math.ceil(totalItems / limitNum);
    const payload = { page: pageNum, totalPages, totalItems, materials };

    // Cache for 15 seconds
    cache.set(cKey, payload, 15);

    return payload;
  }

  async upload(input: MaterialInput) {
    const { title, description, link, type: manualType, author, userId, subject, difficulty, file } = input;

    const detected = MaterialsService.detectTypeAndFormat(file, link);
    const type = manualType || detected.type;
    const format = file ? path.extname(file.originalname).slice(1) : detected.format;

    const id = uuidv4();
    const filePath = file
      ? `/uploads/${type === 'textbook' ? 'textbooks' : type === 'video' ? 'videos' : type === 'audio' ? 'audio' : 'notes'}/${file.filename}`
      : null;

    const record = await prisma.material.create({
      data: {
        id,
        title: title.trim(),
        description: description?.trim() || null,
        type,
        format,
        filePath,
        link: link || null,
        downloadCount: 0,
        author: (author || 'Anonymous').trim(),
        userId,
        subject: subject || null,
        difficulty: difficulty || null,
      },
    });

    // Invalidate caches
    cache.delByPrefix(`mat:${type}:`);
    cache.delByPrefix('mat:all:');

    return {
      id: record.id,
      title: record.title,
      description: record.description,
      type: record.type,
      format: record.format,
      filePath: record.filePath,
      link: record.link,
      thumbnail: record.thumbnail,
      downloadCount: record.downloadCount,
      author: record.author,
      createdAt: record.createdAt.toISOString(),
      subject: record.subject,
      difficulty: record.difficulty,
    };
  }

  async trackDownload(id: string) {
    // Atomically increment and return download count
    const record = await prisma.material.update({
      where: { id },
      data: {
        downloadCount: {
          increment: 1,
        },
      },
      select: {
        downloadCount: true,
      },
    }).catch(() => {
      throw new NotFoundError('Material not found');
    });

    return { downloadCount: record.downloadCount };
  }
}
