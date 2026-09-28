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
import { appConfig } from '../config.js';
import { httpError } from '../common/http.js';
import { sanitizeUserId } from './upload-files.js';

const storage = diskStorage({
  destination: (req, _file, cb) => {
    const userDir = path.join(
      appConfig.uploadsDir,
      sanitizeUserId(req.query.userId),
    );
    fs.mkdirSync(userDir, { recursive: true });
    cb(null, userDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
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
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed'), false);
        }
      },
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() req: Request,
  ) {
    if (!file) throw httpError(HttpStatus.BAD_REQUEST, 'No file uploaded');
    const relativePath = `${sanitizeUserId(req.query.userId)}/${file.filename}`;
    const url = `${req.protocol}://${req.get('host')}/uploads/${relativePath}`;
    return { url, filename: relativePath };
  }

  @Delete(':userId/:filename')
  async removeForUser(
    @Param('userId') userId: string,
    @Param('filename') filename: string,
  ) {
    const safeUserId = sanitizeUserId(userId);
    const safeName = path.basename(filename);
    await this.deleteFile(
      path.join(appConfig.uploadsDir, safeUserId, safeName),
    );
    return { deleted: `${safeUserId}/${safeName}` };
  }

  @Delete(':filename')
  async remove(@Param('filename') filename: string) {
    const safeName = path.basename(filename);
    await this.deleteFile(path.join(appConfig.uploadsDir, safeName));
    return { deleted: safeName };
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
