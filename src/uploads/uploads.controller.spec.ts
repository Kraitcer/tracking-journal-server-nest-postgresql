import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { UploadsController } from './uploads.controller.js';

describe('UploadsController', () => {
  let directory: string;
  let controller: UploadsController;
  const request = {
    user: { id: 'user/1' },
    protocol: 'https',
    get: () => 'api.example.test',
  } as never;

  beforeEach(async () => {
    directory = await mkdtemp(
      path.join(os.tmpdir(), 'tracking-journal-upload-'),
    );
    controller = new UploadsController();
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it('returns a user-scoped URL for a valid raster image', async () => {
    const filePath = path.join(directory, 'image.png');
    await writeFile(
      filePath,
      Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/kQAAAABJRU5ErkJggg==',
        'base64',
      ),
    );

    await expect(
      controller.upload(
        {
          path: filePath,
          mimetype: 'image/png',
          filename: 'random.png',
        } as Express.Multer.File,
        request,
      ),
    ).resolves.toEqual({
      url: 'https://api.example.test/uploads/user_1/random.png',
      filename: 'user_1/random.png',
    });
  });

  it('rejects content that only claims to be an image and removes it', async () => {
    const filePath = path.join(directory, 'spoofed.png');
    await writeFile(filePath, '<svg xmlns="http://www.w3.org/2000/svg"></svg>');

    await expect(
      controller.upload(
        {
          path: filePath,
          mimetype: 'image/png',
          filename: 'random.png',
        } as Express.Multer.File,
        request,
      ),
    ).rejects.toMatchObject({ status: 400 });
    await expect(readFile(filePath)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it("refuses to delete another user's upload directory", async () => {
    await expect(
      controller.removeForUser('other-user', 'image.png', request),
    ).rejects.toMatchObject({ status: 403 });
  });
});
