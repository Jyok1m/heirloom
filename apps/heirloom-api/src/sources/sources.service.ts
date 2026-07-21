import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isPrismaError, rethrowAsNotFound } from '../common/prisma-errors';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCitationInput,
  CreateSourceInput,
  UpdateCitationInput,
  UpdateSourceInput,
} from './dto/source.inputs';

@Injectable()
export class SourcesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(treeId: string) {
    return this.prisma.source.findMany({
      where: { treeId },
      orderBy: { title: 'asc' },
    });
  }

  async findOne(id: string) {
    const source = await this.prisma.source.findUnique({ where: { id } });
    if (!source) throw new NotFoundException(`Source ${id} not found`);
    return source;
  }

  async create({ treeId, ...data }: CreateSourceInput) {
    try {
      return await this.prisma.source.create({
        data: { ...data, tree: { connect: { id: treeId } } },
      });
    } catch (error) {
      rethrowAsNotFound(error, 'Tree', treeId);
    }
  }

  async update(id: string, input: UpdateSourceInput) {
    try {
      return await this.prisma.source.update({ where: { id }, data: input });
    } catch (error) {
      rethrowAsNotFound(error, 'Source', id);
    }
  }

  async delete(id: string) {
    try {
      return await this.prisma.source.delete({ where: { id } });
    } catch (error) {
      rethrowAsNotFound(error, 'Source', id);
    }
  }

  async createCitation({ eventId, sourceId, ...data }: CreateCitationInput) {
    const [event, source] = await Promise.all([
      this.prisma.event.findUnique({
        where: { id: eventId },
        include: {
          person: { select: { treeId: true } },
          union: { select: { treeId: true } },
        },
      }),
      this.findOne(sourceId),
    ]);
    if (!event) throw new NotFoundException(`Event ${eventId} not found`);

    // The event's tree comes through its person or union owner
    const eventTreeId = event.person?.treeId ?? event.union?.treeId;
    if (eventTreeId !== source.treeId) {
      throw new BadRequestException(
        'Event and source belong to different trees',
      );
    }

    try {
      return await this.prisma.citation.create({
        data: { eventId, sourceId, ...data },
      });
    } catch (error) {
      if (isPrismaError(error, 'P2002')) {
        throw new BadRequestException(
          'This source is already cited on this event with the same page',
        );
      }
      throw error;
    }
  }

  async updateCitation(id: string, input: UpdateCitationInput) {
    try {
      return await this.prisma.citation.update({
        where: { id },
        data: input,
      });
    } catch (error) {
      rethrowAsNotFound(error, 'Citation', id);
    }
  }

  async deleteCitation(id: string) {
    try {
      return await this.prisma.citation.delete({ where: { id } });
    } catch (error) {
      rethrowAsNotFound(error, 'Citation', id);
    }
  }
}
