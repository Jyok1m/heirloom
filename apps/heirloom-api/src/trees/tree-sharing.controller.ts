import { Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Public, Roles } from '../auth/decorators';
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
  constructor(private readonly treesService: TreesService) {}

  @Public()
  @Get(':token')
  getSharedTree(@Param('token') token: string) {
    return this.treesService.publicSnapshot(token);
  }
}
