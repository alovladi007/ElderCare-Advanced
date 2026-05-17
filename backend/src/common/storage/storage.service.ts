import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../logging/logger.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

export interface UploadedFileInfo {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  url: string;
}

@Injectable()
export class StorageService {
  private readonly uploadDir: string;
  private readonly maxFileSize: number;
  private readonly allowedMimeTypes: Record<string, string[]>;

  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
  ) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR') || 'uploads';
    this.maxFileSize = this.configService.get<number>('MAX_FILE_SIZE') || 10 * 1024 * 1024; // 10MB default

    this.allowedMimeTypes = {
      image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      document: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ],
      avatar: ['image/jpeg', 'image/png', 'image/webp'],
    };

    this.ensureUploadDirectories();
  }

  /**
   * Ensure upload directories exist
   */
  private async ensureUploadDirectories() {
    const dirs = ['avatars', 'documents', 'medical-records', 'temp'];

    for (const dir of dirs) {
      const dirPath = path.join(this.uploadDir, dir);
      try {
        await fs.access(dirPath);
      } catch {
        await fs.mkdir(dirPath, { recursive: true });
        this.logger.debug('Created upload directory', 'StorageService', { directory: dirPath });
      }
    }
  }

  /**
   * Validate file before upload
   */
  validateFile(file: Express.Multer.File, type: 'image' | 'document' | 'avatar' = 'document'): void {
    // Check file size
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${this.maxFileSize / 1024 / 1024}MB`,
      );
    }

    // Check mime type
    const allowedTypes = this.allowedMimeTypes[type];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      );
    }

    // Check file name for security
    if (this.hasInvalidCharacters(file.originalname)) {
      throw new BadRequestException('File name contains invalid characters');
    }
  }

  /**
   * Check for invalid characters in filename
   */
  private hasInvalidCharacters(filename: string): boolean {
    const invalidChars = /[<>:"/\\|?*\x00-\x1F]/;
    return invalidChars.test(filename);
  }

  /**
   * Generate secure filename
   */
  generateSecureFilename(originalName: string): string {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    return `${timestamp}-${randomString}${ext}`;
  }

  /**
   * Save file to storage
   */
  async saveFile(
    file: Express.Multer.File,
    category: 'avatars' | 'documents' | 'medical-records' | 'temp',
    userId?: string,
  ): Promise<UploadedFileInfo> {
    const secureFilename = this.generateSecureFilename(file.originalname);
    const filePath = path.join(this.uploadDir, category, secureFilename);

    try {
      await fs.writeFile(filePath, file.buffer);

      const fileInfo: UploadedFileInfo = {
        filename: secureFilename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: filePath,
        url: `/uploads/${category}/${secureFilename}`,
      };

      this.logger.logEvent('File uploaded', 'File', secureFilename, {
        category,
        userId,
        size: file.size,
        mimetype: file.mimetype,
      });

      return fileInfo;
    } catch (error) {
      this.logger.error('Failed to save file', '', 'StorageService', {
        error: (error as Error).message,
        filename: file.originalname,
      });
      throw new BadRequestException('Failed to save file');
    }
  }

  /**
   * Delete file from storage
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      this.logger.debug('File deleted', 'StorageService', { filePath });
    } catch (error) {
      this.logger.error('Failed to delete file', '', 'StorageService', {
        error: (error as Error).message,
        filePath,
      });
      throw new BadRequestException('Failed to delete file');
    }
  }

  /**
   * Get file from storage
   */
  async getFile(filePath: string): Promise<Buffer> {
    try {
      return await fs.readFile(filePath);
    } catch (error) {
      this.logger.error('Failed to read file', '', 'StorageService', {
        error: (error as Error).message,
        filePath,
      });
      throw new BadRequestException('File not found');
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Move file to different category
   */
  async moveFile(
    currentPath: string,
    targetCategory: 'avatars' | 'documents' | 'medical-records',
  ): Promise<string> {
    const filename = path.basename(currentPath);
    const targetPath = path.join(this.uploadDir, targetCategory, filename);

    try {
      await fs.rename(currentPath, targetPath);
      this.logger.debug('File moved', 'StorageService', {
        from: currentPath,
        to: targetPath,
      });
      return targetPath;
    } catch (error) {
      this.logger.error('Failed to move file', '', 'StorageService', {
        error: (error as Error).message,
        from: currentPath,
        to: targetPath,
      });
      throw new BadRequestException('Failed to move file');
    }
  }

  /**
   * Clean up old temporary files (older than 24 hours)
   */
  async cleanupTempFiles(): Promise<number> {
    const tempDir = path.join(this.uploadDir, 'temp');
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    let deletedCount = 0;

    try {
      const files = await fs.readdir(tempDir);

      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);

        if (now - stats.mtimeMs > maxAge) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        this.logger.debug('Cleaned up temporary files', 'StorageService', {
          deletedCount,
        });
      }

      return deletedCount;
    } catch (error) {
      this.logger.error('Failed to cleanup temp files', '', 'StorageService', {
        error: (error as Error).message,
      });
      return deletedCount;
    }
  }

  /**
   * Get file size in human readable format
   */
  getFileSizeFormatted(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`;
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    categories: Record<string, { files: number; size: number }>;
  }> {
    const categories = ['avatars', 'documents', 'medical-records', 'temp'];
    const stats = {
      totalFiles: 0,
      totalSize: 0,
      categories: {} as Record<string, { files: number; size: number }>,
    };

    for (const category of categories) {
      const dirPath = path.join(this.uploadDir, category);
      try {
        const files = await fs.readdir(dirPath);
        let categorySize = 0;

        for (const file of files) {
          const filePath = path.join(dirPath, file);
          const fileStats = await fs.stat(filePath);
          categorySize += fileStats.size;
        }

        stats.categories[category] = {
          files: files.length,
          size: categorySize,
        };
        stats.totalFiles += files.length;
        stats.totalSize += categorySize;
      } catch (error) {
        stats.categories[category] = { files: 0, size: 0 };
      }
    }

    return stats;
  }
}
