import { Controller, Delete, Get, Param, Post, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { Public, Roles } from '../auth/decorators';
import { MediaStorageService } from '../media/media-storage.service';
import { setMediaServeHeaders } from '../media/serve-headers';
import { TreesService } from './trees.service';

// Admin-only management of a tree's public read-only share link.
@Controller('api/trees')
export class TreeSharingController {
  constructor(
    private readonly treesService: TreesService,
    private readonly config: ConfigService,
  ) {}

  @Roles('ADMIN')
  @Get(':treeId/share')
  async getShare(@Param('treeId') treeId: string) {
    const token = await this.treesService.getShareToken(treeId);
    return this.state(token);
  }

  @Roles('ADMIN')
  @Post(':treeId/share')
  async enableShare(@Param('treeId') treeId: string) {
    const token = await this.treesService.enableShare(treeId);
    return this.state(token);
  }

  @Roles('ADMIN')
  @Post(':treeId/share/rotate')
  async rotateShare(@Param('treeId') treeId: string) {
    const token = await this.treesService.rotateShare(treeId);
    return this.state(token);
  }

  @Roles('ADMIN')
  @Delete(':treeId/share')
  async disableShare(@Param('treeId') treeId: string) {
    await this.treesService.disableShare(treeId);
    return this.state(null);
  }

  private state(token: string | null) {
    const frontend = this.config.get<string>('FRONTEND_URL') ?? '';
    return {
      enabled: token !== null,
      url: token ? `${frontend}/view/${token}` : null,
    };
  }
}

// Public, unauthenticated read-only access to a shared tree.
@Controller('api/public/trees')
export class PublicTreeController {
  constructor(
    private readonly treesService: TreesService,
    private readonly storage: MediaStorageService,
  ) {}

  @Public()
  @Get(':token')
  getSharedTree(@Param('token') token: string) {
    return this.treesService.publicSnapshot(token);
  }

  // Profile pictures for the public card view; scoped to the shared tree.
  @Public()
  @Get(':token/media/:mediaId/file')
  async getSharedMedia(
    @Param('token') token: string,
    @Param('mediaId') mediaId: string,
    @Res() res: Response,
  ) {
    const media = await this.treesService.sharedMediaFile(token, mediaId);
    setMediaServeHeaders(res, media.mimeType);
    res.sendFile(this.storage.absolutePath(media.filePath));
  }
}
