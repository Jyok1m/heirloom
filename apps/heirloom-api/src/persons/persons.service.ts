import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { rethrowAsNotFound } from '../common/prisma-errors';
import { EventType, MediaType } from '../generated/prisma/enums';
import { MediaService } from '../media/media.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePersonInput, UpdatePersonInput } from './dto/person.inputs';

@Injectable()
export class PersonsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaService,
  ) {}

  findAll(treeId: string, skip: number, take: number) {
    return this.prisma.person.findMany({
      where: { treeId },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      skip,
      take,
    });
  }

  async findOne(id: string) {
    const person = await this.prisma.person.findUnique({ where: { id } });
    if (!person) throw new NotFoundException(`Person ${id} not found`);
    return person;
  }

  async create({ treeId, ...data }: CreatePersonInput) {
    try {
      const person = await this.prisma.person.create({
        data: { ...data, tree: { connect: { id: treeId } } },
      });
      // Everyone is born: seed the birth event so only its date is left to fill.
      await this.prisma.event.create({
        data: { type: EventType.BIRTH, personId: person.id },
      });
      return person;
    } catch (error) {
      rethrowAsNotFound(error, 'Tree', treeId);
    }
  }

  async update(id: string, input: UpdatePersonInput) {
    // Validate a new profile photo and remember the one it replaces so a
    // now-unreferenced avatar can be cleaned up after the update.
    let previousPhoto: string | null | undefined;
    if (input.photoMediaId !== undefined) {
      const person = await this.prisma.person.findUnique({
        where: { id },
        select: { treeId: true, photoMediaId: true },
      });
      if (!person) throw new NotFoundException(`Person ${id} not found`);
      previousPhoto = person.photoMediaId;
      if (input.photoMediaId) {
        const media = await this.prisma.media.findUnique({
          where: { id: input.photoMediaId },
          select: { treeId: true, type: true },
        });
        if (
          !media ||
          media.treeId !== person.treeId ||
          media.type !== MediaType.IMAGE
        ) {
          throw new BadRequestException(
            'Profile photo must be an image belonging to the same tree',
          );
        }
      }
    }

    const updated = await this.prisma.person
      .update({ where: { id }, data: input })
      .catch((error): never => rethrowAsNotFound(error, 'Person', id));

    if (previousPhoto && previousPhoto !== input.photoMediaId) {
      await this.deleteMediaIfOrphan(previousPhoto);
    }
    return updated;
  }

  async delete(id: string) {
    // Everything the person touched: its avatar and every attached media.
    const [person, links] = await Promise.all([
      this.prisma.person.findUnique({
        where: { id },
        select: { photoMediaId: true },
      }),
      this.prisma.mediaLink.findMany({
        where: { personId: id },
        select: { mediaId: true },
      }),
    ]);
    const mediaIds = new Set(links.map((link) => link.mediaId));
    if (person?.photoMediaId) mediaIds.add(person.photoMediaId);

    const deleted = await this.prisma.person
      .delete({ where: { id } })
      .catch((error): never => rethrowAsNotFound(error, 'Person', id));

    // The delete cascaded the person's media links; drop the now-orphaned media.
    for (const mediaId of mediaIds) {
      await this.deleteMediaIfOrphan(mediaId);
    }
    return deleted;
  }

  // Removes an avatar media (row + file) once nothing references it — no gallery
  // link and no other person using it as their photo. Best effort.
  private async deleteMediaIfOrphan(mediaId: string): Promise<void> {
    const [links, photoRefs] = await Promise.all([
      this.prisma.mediaLink.count({ where: { mediaId } }),
      this.prisma.person.count({ where: { photoMediaId: mediaId } }),
    ]);
    if (links === 0 && photoRefs === 0) {
      await this.media.delete(mediaId).catch(() => {
        /* already gone or referenced elsewhere: leave it */
      });
    }
  }
}
