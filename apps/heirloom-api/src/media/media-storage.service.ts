import { mkdirSync } from 'node:fs';
import { access, mkdir, rename, rm, unlink } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Owns the on-disk layout of uploaded files: MEDIA_ROOT/<treeId>/<mediaId>.<ext>
@Injectable()
export class MediaStorageService {
  readonly root: string;
  readonly tmpDir: string;

  constructor(config: ConfigService) {
    this.root = resolve(
      process.cwd(),
      config.get<string>('MEDIA_ROOT') ?? './data/media',
    );
    this.tmpDir = join(this.root, 'tmp');
    mkdirSync(this.tmpDir, { recursive: true });
  }

  // Rejects any relative path escaping the media root
  absolutePath(relativePath: string): string {
    const absolute = resolve(this.root, relativePath);
    if (!absolute.startsWith(this.root + sep)) {
      throw new BadRequestException('Invalid media path');
    }
    return absolute;
  }

  async exists(relativePath: string): Promise<boolean> {
    try {
      await access(this.absolutePath(relativePath));
      return true;
    } catch {
      return false;
    }
  }

  // Moves a multer temp file to its final location; returns the relative path
  async store(
    tmpPath: string,
    treeId: string,
    mediaId: string,
    originalName: string,
  ): Promise<string> {
    const ext = extname(originalName).toLowerCase();
    const safeExt = /^\.[a-z0-9]{1,10}$/.test(ext) ? ext : '';
    const relativePath = join(treeId, `${mediaId}${safeExt}`);
    const absolute = this.absolutePath(relativePath);
    await mkdir(join(this.root, treeId), { recursive: true });
    await rename(tmpPath, absolute);
    return relativePath;
  }

  // Best effort: a missing file must not fail the DB deletion
  async remove(relativePath: string): Promise<void> {
    try {
      await unlink(this.absolutePath(relativePath));
    } catch {
      /* already gone */
    }
  }

  async removeTreeDir(treeId: string): Promise<void> {
    if (!treeId) return;
    await rm(join(this.root, treeId), { recursive: true, force: true });
  }

  async discardTmp(tmpPath: string): Promise<void> {
    try {
      await unlink(tmpPath);
    } catch {
      /* already gone */
    }
  }
}
