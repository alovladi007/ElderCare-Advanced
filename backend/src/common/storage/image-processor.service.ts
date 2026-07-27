import { Injectable, BadRequestException } from '@nestjs/common';
import { LoggerService } from '../logging/logger.service';
import sharp from 'sharp';
import type { Metadata } from 'sharp';

export interface ImageProcessingOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

export interface ProcessedImage {
  buffer: Buffer;
  format: string;
  width: number;
  height: number;
  size: number;
}

@Injectable()
export class ImageProcessorService {
  constructor(private logger: LoggerService) {}

  /**
   * Process and optimize image
   */
  async processImage(
    buffer: Buffer,
    options: ImageProcessingOptions = {},
  ): Promise<ProcessedImage> {
    try {
      const {
        width,
        height,
        quality = 80,
        format = 'jpeg',
        fit = 'cover',
      } = options;

      let image = sharp(buffer);

      // Resize if dimensions provided
      if (width || height) {
        image = image.resize(width, height, {
          fit,
          withoutEnlargement: true,
        });
      }

      // Convert to specified format with quality
      switch (format) {
        case 'jpeg':
          image = image.jpeg({ quality, mozjpeg: true });
          break;
        case 'png':
          image = image.png({ quality, compressionLevel: 9 });
          break;
        case 'webp':
          image = image.webp({ quality });
          break;
      }

      const processedBuffer = await image.toBuffer();
      const metadata = await sharp(processedBuffer).metadata();

      this.logger.debug('Image processed', 'ImageProcessorService', {
        originalSize: buffer.length,
        processedSize: processedBuffer.length,
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
      });

      return {
        buffer: processedBuffer,
        format: metadata.format || format,
        width: metadata.width || 0,
        height: metadata.height || 0,
        size: processedBuffer.length,
      };
    } catch (error) {
      this.logger.error('Failed to process image', '', 'ImageProcessorService', {
        error: (error as Error).message,
      });
      throw new BadRequestException('Failed to process image');
    }
  }

  /**
   * Create avatar thumbnail (square, 200x200)
   */
  async createAvatarThumbnail(buffer: Buffer): Promise<ProcessedImage> {
    return this.processImage(buffer, {
      width: 200,
      height: 200,
      quality: 85,
      format: 'jpeg',
      fit: 'cover',
    });
  }

  /**
   * Create multiple image sizes (for responsive images)
   */
  async createMultipleSizes(
    buffer: Buffer,
    sizes: Array<{ name: string; width: number; height?: number }>,
  ): Promise<Record<string, ProcessedImage>> {
    const results: Record<string, ProcessedImage> = {};

    for (const size of sizes) {
      results[size.name] = await this.processImage(buffer, {
        width: size.width,
        height: size.height,
        quality: 80,
        format: 'jpeg',
      });
    }

    return results;
  }

  /**
   * Optimize image without resizing
   */
  async optimizeImage(buffer: Buffer): Promise<ProcessedImage> {
    return this.processImage(buffer, {
      quality: 85,
      format: 'jpeg',
    });
  }

  /**
   * Extract image metadata
   */
  async getImageMetadata(buffer: Buffer): Promise<Metadata> {
    try {
      return await sharp(buffer).metadata();
    } catch (error) {
      this.logger.error('Failed to extract image metadata', '', 'ImageProcessorService', {
        error: (error as Error).message,
      });
      throw new BadRequestException('Invalid image file');
    }
  }

  /**
   * Validate image file
   */
  async validateImage(buffer: Buffer): Promise<boolean> {
    try {
      const metadata = await sharp(buffer).metadata();

      // Check if it's a valid image
      if (!metadata.format || !metadata.width || !metadata.height) {
        return false;
      }

      // Check for reasonable dimensions (not too large)
      if (metadata.width > 10000 || metadata.height > 10000) {
        throw new BadRequestException('Image dimensions too large');
      }

      return true;
    } catch (error) {
      this.logger.warn('Image validation failed', 'ImageProcessorService', {
        error: (error as Error).message,
      });
      return false;
    }
  }

  /**
   * Create watermarked image (for medical records, etc.)
   */
  async addWatermark(
    buffer: Buffer,
    watermarkText: string,
  ): Promise<ProcessedImage> {
    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();

      // Create SVG text watermark
      const svgWatermark = `
        <svg width="${metadata.width}" height="${metadata.height}">
          <text x="50%" y="95%"
                font-family="Arial"
                font-size="16"
                fill="rgba(255,255,255,0.7)"
                text-anchor="middle">
            ${watermarkText}
          </text>
        </svg>
      `;

      const watermarkedBuffer = await image
        .composite([
          {
            input: Buffer.from(svgWatermark),
            gravity: 'southeast',
          },
        ])
        .jpeg({ quality: 85 })
        .toBuffer();

      return {
        buffer: watermarkedBuffer,
        format: 'jpeg',
        width: metadata.width || 0,
        height: metadata.height || 0,
        size: watermarkedBuffer.length,
      };
    } catch (error) {
      this.logger.error('Failed to add watermark', '', 'ImageProcessorService', {
        error: (error as Error).message,
      });
      throw new BadRequestException('Failed to add watermark to image');
    }
  }

  /**
   * Convert image to grayscale
   */
  async convertToGrayscale(buffer: Buffer): Promise<ProcessedImage> {
    try {
      const processedBuffer = await sharp(buffer)
        .grayscale()
        .jpeg({ quality: 85 })
        .toBuffer();

      const metadata = await sharp(processedBuffer).metadata();

      return {
        buffer: processedBuffer,
        format: 'jpeg',
        width: metadata.width || 0,
        height: metadata.height || 0,
        size: processedBuffer.length,
      };
    } catch (error) {
      this.logger.error('Failed to convert to grayscale', '', 'ImageProcessorService', {
        error: (error as Error).message,
      });
      throw new BadRequestException('Failed to convert image');
    }
  }
}
