import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { AI_CONFIG } from '../config/ai.config';
import { logger } from './logger';

export class StorageUtils {
  /** Ensure AI uploads directory exists on disk */
  static initAiUploadDir(): string {
    const dir = AI_CONFIG.UPLOADS_AI_DIR;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  /** Compute SHA256 hash of a file on disk */
  static async computeFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', (err) => reject(err));
    });
  }

  /** Safely unlink a file from storage if it exists */
  static async safeUnlink(filePath: string): Promise<boolean> {
    try {
      const absolutePath = path.isAbsolute(filePath)
        ? filePath
        : path.join(__dirname, '../../../', filePath);

      if (fs.existsSync(absolutePath)) {
        await fs.promises.unlink(absolutePath);
        logger.info(`🗑️ Unlinked storage file: ${absolutePath}`);
        return true;
      }
      return false;
    } catch (err: any) {
      logger.error(`Failed to unlink storage file '${filePath}': ${err.message}`);
      return false;
    }
  }

  /** Resolve web relative URL from absolute disk path */
  static getRelativeUploadPath(absolutePath: string): string {
    const rootUploads = path.join(__dirname, '../../../uploads');
    const relative = path.relative(rootUploads, absolutePath);
    return `/uploads/${relative.replace(/\\/g, '/')}`;
  }
}
