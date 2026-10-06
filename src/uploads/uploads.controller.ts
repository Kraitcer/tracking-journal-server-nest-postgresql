import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { diskStorage } from 'multer';
import { fileTypeFromFile } from 'file-type';
import { appConfig } from '../config.js';
import { httpError } from '../common/http.js';
import { sanitizeUserId } from './upload-files.js';

type AuthenticatedRequest = Request & { user: { id: string } };

const imageExtensions: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/bmp': '.bmp',
  'image/avif': '.avif',
};

const storage = diskStorage({
  destination: (req, _file, cb) => {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) return cb(new Error('Authentication required'), '');
    const userDir = path.join(appConfig.uploadsDir, sanitizeUserId(userId));
    fs.mkdirSync(userDir, { recursive: true });
    cb(null, userDir);
  },
  filename: (_req, file, cb) => {
    const ext = imageExtensions[file.mimetype];
    if (!ext) return cb(new Error('Unsupported image type'), '');
    cb(null, crypto.randomUUID() + ext);
  },
});

@Controller('uploads')
export class UploadsController {
  @Post()
  @HttpCode(200)
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      fileFilter: (_req, file, cb) => {
        if (imageExtensions[file.mimetype]) {
          cb(null, true);
        } else {
          cb(
            httpError(HttpStatus.BAD_REQUEST, 'Unsupported image type'),
            false,
          );
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024,
        files: 1,
        fields: 1,
      },
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!file) throw httpError(HttpStatus.BAD_REQUEST, 'No file uploaded');
    return this.createUploadResponse(file, req);
  }

  private async createUploadResponse(
    file: Express.Multer.File,
    req: AuthenticatedRequest,
  ) {
    const detectedType = await fileTypeFromFile(file.path);
    if (
      !detectedType ||
      detectedType.mime !== file.mimetype ||
      !imageExtensions[detectedType.mime]
    ) {
      await fs.promises.unlink(file.path);
      throw httpError(HttpStatus.BAD_REQUEST, 'Invalid image content');
    }
    const relativePath = `${sanitizeUserId(req.user.id)}/${file.filename}`;
    const url = `${req.protocol}://${req.get('host')}/uploads/${relativePath}`;
    return { url, filename: relativePath };
  }

  @Delete(':userId/:filename')
  async removeForUser(
    @Param('userId') userId: string,
    @Param('filename') filename: string,
    @Req() req: AuthenticatedRequest,
  ) {
    if (sanitizeUserId(userId) !== sanitizeUserId(req.user.id)) {
      throw httpError(HttpStatus.FORBIDDEN, 'Access denied');
    }
    const safeUserId = sanitizeUserId(userId);
    const safeName = path.basename(filename);
    await this.deleteFile(
      path.join(appConfig.uploadsDir, safeUserId, safeName),
    );
    return { deleted: `${safeUserId}/${safeName}` };
  }

  @Delete(':filename')
  async remove(
    @Param('filename') filename: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const safeName = path.basename(filename);
    const safeUserId = sanitizeUserId(req.user.id);
    await this.deleteFile(
      path.join(appConfig.uploadsDir, safeUserId, safeName),
    );
    return { deleted: `${safeUserId}/${safeName}` };
  }

  private async deleteFile(filePath: string) {
    if (!fs.existsSync(filePath)) {
      throw httpError(HttpStatus.NOT_FOUND, 'File not found');
    }
    try {
      await fs.promises.unlink(filePath);
    } catch (err) {
      console.error('Error deleting file:', err);
      throw httpError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Failed to delete file',
      );
    }
  }
}
