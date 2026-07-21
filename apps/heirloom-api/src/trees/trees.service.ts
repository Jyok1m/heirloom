import { Injectable, NotFoundException } from '@nestjs/common';
import { rethrowAsNotFound } from '../common/prisma-errors';
import { MediaStorageService } from '../media/media-storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTreeInput, UpdateTreeInput } from './dto/tree.inputs';

@Injectable()
export class TreesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaStorage: MediaStorageService,
  ) {}

  // ids restricts the result to accessible trees (undefined = no restriction)
  findAll(ids?: string[]) {
    return this.prisma.tree.findMany({
      where: ids ? { id: { in: ids } } : undefined,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const tree = await this.prisma.tree.findUnique({ where: { id } });
    if (!tree) throw new NotFoundException(`Tree ${id} not found`);
    return tree;
  }

  create(input: CreateTreeInput) {
    return this.prisma.tree.create({ data: input });
  }

  async update(id: string, input: UpdateTreeInput) {
    try {
      return await this.prisma.tree.update({ where: { id }, data: input });
    } catch (error) {
      rethrowAsNotFound(error, 'Tree', id);
    }
  }

  async delete(id: string) {
    try {
      const tree = await this.prisma.tree.delete({ where: { id } });
      // Media rows are cascade-deleted with the tree; drop their files too
      await this.mediaStorage.removeTreeDir(id);
      return tree;
    } catch (error) {
      rethrowAsNotFound(error, 'Tree', id);
    }
  }
}
