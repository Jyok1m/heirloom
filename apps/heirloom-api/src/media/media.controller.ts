import {
  BadRequestException,
  ForbiddenException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { CurrentUser } from '../auth/decorators';
import { TreeAccessService } from '../auth/tree-access.service';
import type { UserModel } from '../generated/prisma/models';
import { UploadMediaDto } from './dto/upload-media.dto';
import { MediaStorageService } from './media-storage.service';
import { MediaService } from './media.service';

// File transfer stays on REST; everything else about media goes through GraphQL
@Controller('api/media')
export class MediaController {
  constructor(
    private readonly mediaService: MediaService,
    private readonly storage: MediaStorageService,
    private readonly access: TreeAccessService,
  ) {}

  // Admins and contributors of the target tree can upload
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @CurrentUser() user: UserModel,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: UploadMediaDto,
  ) {
    if (!file) {
      throw new BadRequestException('Missing "file" multipart field');
    }
    if (!(await this.access.canContribute(user, dto.treeId))) {
      await this.storage.discardTmp(file.path);
      throw new ForbiddenException(
        'You need contributor access to this tree',
      );
    }
    return this.mediaService.createFromUpload(file, dto);
  }

  @Get(':id/file')
  async serveFile(@Param('id') id: string, @Res() res: Response) {
    const media = await this.mediaService.findOne(id);
    if (!(await this.storage.exists(media.filePath))) {
      throw new NotFoundException(`File for media ${id} is missing on disk`);
    }
    res.setHeader('Content-Type', media.mimeType);
    res.sendFile(this.storage.absolutePath(media.filePath));
  }
}
