import {
  Controller,
  Post,
  Get,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Param,
  Res,
  BadRequestException,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { StorageService, UploadedFileInfo } from './storage.service';
import { ImageProcessorService } from './image-processor.service';
import { LoggerService } from '../logging/logger.service';
import * as path from 'path';

@ApiTags('storage')
@Controller('storage')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StorageController {
  constructor(
    private storageService: StorageService,
    private imageProcessor: ImageProcessorService,
    private logger: LoggerService,
  ) {}

  @Post('upload/avatar')
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadedFileInfo> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file
    this.storageService.validateFile(file, 'avatar');

    // Validate image
    const isValidImage = await this.imageProcessor.validateImage(file.buffer);
    if (!isValidImage) {
      throw new BadRequestException('Invalid image file');
    }

    // Process image (create thumbnail)
    const processed = await this.imageProcessor.createAvatarThumbnail(file.buffer);

    // Save processed image
    const processedFile: Express.Multer.File = {
      ...file,
      buffer: processed.buffer,
      size: processed.size,
    };

    return this.storageService.saveFile(processedFile, 'avatars');
  }

  @Post('upload/document')
  @ApiOperation({ summary: 'Upload document' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadedFileInfo> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    this.storageService.validateFile(file, 'document');

    return this.storageService.saveFile(file, 'documents');
  }

  @Post('upload/medical-record')
  @ApiOperation({ summary: 'Upload medical record' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadMedicalRecord(
    @UploadedFile() file: Express.Multer.File,
    @Query('addWatermark') addWatermark?: string,
  ): Promise<UploadedFileInfo> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    this.storageService.validateFile(file, 'document');

    // If it's an image and watermark is requested, add watermark
    if (file.mimetype.startsWith('image/') && addWatermark === 'true') {
      const isValidImage = await this.imageProcessor.validateImage(file.buffer);
      if (isValidImage) {
        const watermarked = await this.imageProcessor.addWatermark(
          file.buffer,
          'ElderCare Medical Record',
        );
        file.buffer = watermarked.buffer;
        file.size = watermarked.size;
      }
    }

    return this.storageService.saveFile(file, 'medical-records');
  }

  @Post('upload/multiple')
  @ApiOperation({ summary: 'Upload multiple files' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files
  async uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<UploadedFileInfo[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const uploadedFiles: UploadedFileInfo[] = [];

    for (const file of files) {
      this.storageService.validateFile(file, 'document');
      const fileInfo = await this.storageService.saveFile(file, 'documents');
      uploadedFiles.push(fileInfo);
    }

    return uploadedFiles;
  }

  @Get('file/:category/:filename')
  @ApiOperation({ summary: 'Get file by filename' })
  async getFile(
    @Param('category') category: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const allowedCategories = ['avatars', 'documents', 'medical-records'];
    if (!allowedCategories.includes(category)) {
      throw new BadRequestException('Invalid category');
    }

    const filePath = path.join('uploads', category, filename);
    const exists = await this.storageService.fileExists(filePath);

    if (!exists) {
      throw new NotFoundException('File not found');
    }

    const fileBuffer = await this.storageService.getFile(filePath);

    // Determine content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    const contentTypeMap: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };

    const contentType = contentTypeMap[ext] || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', fileBuffer.length);
    res.send(fileBuffer);
  }

  @Delete('file/:category/:filename')
  @ApiOperation({ summary: 'Delete file' })
  async deleteFile(
    @Param('category') category: string,
    @Param('filename') filename: string,
  ): Promise<{ message: string }> {
    const allowedCategories = ['avatars', 'documents', 'medical-records'];
    if (!allowedCategories.includes(category)) {
      throw new BadRequestException('Invalid category');
    }

    const filePath = path.join('uploads', category, filename);
    await this.storageService.deleteFile(filePath);

    return { message: 'File deleted successfully' };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get storage statistics' })
  async getStorageStats() {
    return this.storageService.getStorageStats();
  }

  @Post('cleanup-temp')
  @ApiOperation({ summary: 'Clean up temporary files' })
  async cleanupTempFiles(): Promise<{ deletedCount: number }> {
    const deletedCount = await this.storageService.cleanupTempFiles();
    return { deletedCount };
  }
}
