import { Injectable, NotFoundException } from '@nestjs/common';
import { rethrowAsNotFound } from '../common/prisma-errors';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePersonInput, UpdatePersonInput } from './dto/person.inputs';

@Injectable()
export class PersonsService {
  constructor(private readonly prisma: PrismaService) {}

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
      return await this.prisma.person.create({
        data: { ...data, tree: { connect: { id: treeId } } },
      });
    } catch (error) {
      rethrowAsNotFound(error, 'Tree', treeId);
    }
  }

  async update(id: string, input: UpdatePersonInput) {
    try {
      return await this.prisma.person.update({ where: { id }, data: input });
    } catch (error) {
      rethrowAsNotFound(error, 'Person', id);
    }
  }

  async delete(id: string) {
    try {
      return await this.prisma.person.delete({ where: { id } });
    } catch (error) {
      rethrowAsNotFound(error, 'Person', id);
    }
  }
}
