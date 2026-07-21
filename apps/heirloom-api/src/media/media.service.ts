import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { rethrowAsNotFound } from '../common/prisma-errors';
import { MediaType } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateMediaInput,
  LinkMediaInput,
  UpdateMediaInput,
} from './dto/media.inputs';
import { UploadMediaDto } from './dto/upload-media.dto';
import { MediaStorageService } from './media-storage.service';

function mediaTypeFromMime(mime: string): MediaType {
  if (mime.startsWith('image/')) return MediaType.IMAGE;
  if (mime.startsWith('video/')) return MediaType.VIDEO;
  if (mime.startsWith('audio/')) return MediaType.AUDIO;
  return MediaType.DOCUMENT;
}

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: MediaStorageService,
  ) {}

  async createFromUpload(file: Express.Multer.File, dto: UploadMediaDto) {
    const tree = await this.prisma.tree.findUnique({
      where: { id: dto.treeId },
      select: { id: true },
    });
    if (!tree) {
      await this.storage.discardTmp(file.path);
      throw new NotFoundException(`Tree ${dto.treeId} not found`);
    }

    const id = randomUUID();
    const filePath = await this.storage.store(
      file.path,
      dto.treeId,
      id,
      file.originalname,
    );
    try {
      return await this.prisma.media.create({
        data: {
          id,
          treeId: dto.treeId,
          type: mediaTypeFromMime(file.mimetype),
          filePath,
          mimeType: file.mimetype,
          title: dto.title,
          notes: dto.notes,
        },
      });
    } catch (error) {
      // The record is the source of truth: no row, no file
      await this.storage.remove(filePath);
      throw error;
    }
  }

  findAll(treeId: string) {
    return this.prisma.media.findMany({
      where: { treeId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) throw new NotFoundException(`Media ${id} not found`);
    return media;
  }

  async create({ treeId, ...data }: CreateMediaInput) {
    try {
      return await this.prisma.media.create({
        data: { ...data, tree: { connect: { id: treeId } } },
      });
    } catch (error) {
      rethrowAsNotFound(error, 'Tree', treeId);
    }
  }

  async update(id: string, input: UpdateMediaInput) {
    try {
      return await this.prisma.media.update({ where: { id }, data: input });
    } catch (error) {
      rethrowAsNotFound(error, 'Media', id);
    }
  }

  async delete(id: string) {
    try {
      const media = await this.prisma.media.delete({ where: { id } });
      await this.storage.remove(media.filePath);
      return media;
    } catch (error) {
      rethrowAsNotFound(error, 'Media', id);
    }
  }

  async link({ mediaId, personId, eventId, sourceId }: LinkMediaInput) {
    const targets = [personId, eventId, sourceId].filter(Boolean);
    if (targets.length !== 1) {
      throw new BadRequestException(
        'A media link targets exactly one person, event or source',
      );
    }

    const media = await this.findOne(mediaId);
    const targetTreeId = await this.resolveTargetTreeId(
      personId,
      eventId,
      sourceId,
    );
    if (targetTreeId !== media.treeId) {
      throw new BadRequestException(
        'Media and its target belong to different trees',
      );
    }

    const existing = await this.prisma.mediaLink.findFirst({
      where: { mediaId, personId, eventId, sourceId },
    });
    if (existing) return existing;

    return this.prisma.mediaLink.create({
      data: { mediaId, personId, eventId, sourceId },
    });
  }

  async unlink(id: string) {
    try {
      return await this.prisma.mediaLink.delete({ where: { id } });
    } catch (error) {
      rethrowAsNotFound(error, 'Media link', id);
    }
  }

  private async resolveTargetTreeId(
    personId?: string,
    eventId?: string,
    sourceId?: string,
  ) {
    if (personId) {
      const person = await this.prisma.person.findUnique({
        where: { id: personId },
        select: { treeId: true },
      });
      if (!person) throw new NotFoundException(`Person ${personId} not found`);
      return person.treeId;
    }
    if (eventId) {
      const event = await this.prisma.event.findUnique({
        where: { id: eventId },
        select: {
          person: { select: { treeId: true } },
          union: { select: { treeId: true } },
        },
      });
      if (!event) throw new NotFoundException(`Event ${eventId} not found`);
      return event.person?.treeId ?? event.union?.treeId;
    }
    const source = await this.prisma.source.findUnique({
      where: { id: sourceId },
      select: { treeId: true },
    });
    if (!source) throw new NotFoundException(`Source ${sourceId} not found`);
    return source.treeId;
  }
}
