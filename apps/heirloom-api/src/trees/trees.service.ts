import { Injectable, NotFoundException } from '@nestjs/common';
import { rethrowAsNotFound } from '../common/prisma-errors';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTreeInput, UpdateTreeInput } from './dto/tree.inputs';

@Injectable()
export class TreesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.tree.findMany({ orderBy: { createdAt: 'asc' } });
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
      return await this.prisma.tree.delete({ where: { id } });
    } catch (error) {
      rethrowAsNotFound(error, 'Tree', id);
    }
  }
}
