import {
  BadRequestException,
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
import { UploadMediaDto } from './dto/upload-media.dto';
import { MediaStorageService } from './media-storage.service';
import { MediaService } from './media.service';

// File transfer stays on REST; everything else about media goes through GraphQL
@Controller('api/media')
export class MediaController {
  constructor(
    private readonly mediaService: MediaService,
    private readonly storage: MediaStorageService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: UploadMediaDto,
  ) {
    if (!file) {
      throw new BadRequestException('Missing "file" multipart field');
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
