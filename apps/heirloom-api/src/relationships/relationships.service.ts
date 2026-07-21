import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isPrismaError, rethrowAsNotFound } from '../common/prisma-errors';
import { Pedigree } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUnionInput, UpdateUnionInput } from './dto/union.inputs';

@Injectable()
export class RelationshipsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(treeId: string) {
    return this.prisma.union.findMany({
      where: { treeId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const union = await this.prisma.union.findUnique({ where: { id } });
    if (!union) throw new NotFoundException(`Union ${id} not found`);
    return union;
  }

  async create({ treeId, ...data }: CreateUnionInput) {
    try {
      return await this.prisma.union.create({
        data: { ...data, tree: { connect: { id: treeId } } },
      });
    } catch (error) {
      rethrowAsNotFound(error, 'Tree', treeId);
    }
  }

  async update(id: string, input: UpdateUnionInput) {
    try {
      return await this.prisma.union.update({ where: { id }, data: input });
    } catch (error) {
      rethrowAsNotFound(error, 'Union', id);
    }
  }

  async delete(id: string) {
    try {
      return await this.prisma.union.delete({ where: { id } });
    } catch (error) {
      rethrowAsNotFound(error, 'Union', id);
    }
  }

  async addPartner(unionId: string, personId: string) {
    const union = await this.checkSameTree(unionId, personId);

    const [partnerCount, isChild] = await Promise.all([
      this.prisma.unionPartner.count({ where: { unionId } }),
      this.prisma.childInUnion.findUnique({
        where: { unionId_personId: { unionId, personId } },
      }),
    ]);
    if (partnerCount >= 2) {
      throw new BadRequestException('Union already has two partners');
    }
    if (isChild) {
      throw new BadRequestException(
        'Person is already a child of this union',
      );
    }

    try {
      await this.prisma.unionPartner.create({ data: { unionId, personId } });
    } catch (error) {
      if (isPrismaError(error, 'P2002')) {
        throw new BadRequestException(
          'Person is already a partner of this union',
        );
      }
      throw error;
    }
    return union;
  }

  async removePartner(unionId: string, personId: string) {
    try {
      await this.prisma.unionPartner.delete({
        where: { unionId_personId: { unionId, personId } },
      });
    } catch (error) {
      rethrowAsNotFound(error, 'Partner link', `${unionId}/${personId}`);
    }
    return this.findOne(unionId);
  }

  async addChild(unionId: string, personId: string, pedigree?: Pedigree) {
    const union = await this.checkSameTree(unionId, personId);

    const isPartner = await this.prisma.unionPartner.findUnique({
      where: { unionId_personId: { unionId, personId } },
    });
    if (isPartner) {
      throw new BadRequestException(
        'Person is already a partner of this union',
      );
    }
    if (await this.isAncestorOfUnion(unionId, personId)) {
      throw new BadRequestException(
        'Adding this child would create an ancestry cycle',
      );
    }

    try {
      await this.prisma.childInUnion.create({
        data: { unionId, personId, pedigree },
      });
    } catch (error) {
      if (isPrismaError(error, 'P2002')) {
        throw new BadRequestException(
          'Person is already a child of this union',
        );
      }
      throw error;
    }
    return union;
  }

  async setChildPedigree(
    unionId: string,
    personId: string,
    pedigree: Pedigree,
  ) {
    try {
      await this.prisma.childInUnion.update({
        where: { unionId_personId: { unionId, personId } },
        data: { pedigree },
      });
    } catch (error) {
      rethrowAsNotFound(error, 'Child link', `${unionId}/${personId}`);
    }
    return this.findOne(unionId);
  }

  async removeChild(unionId: string, personId: string) {
    try {
      await this.prisma.childInUnion.delete({
        where: { unionId_personId: { unionId, personId } },
      });
    } catch (error) {
      rethrowAsNotFound(error, 'Child link', `${unionId}/${personId}`);
    }
    return this.findOne(unionId);
  }

  // Both link mutations require the person and the union to share a tree
  private async checkSameTree(unionId: string, personId: string) {
    const [union, person] = await Promise.all([
      this.findOne(unionId),
      this.prisma.person.findUnique({ where: { id: personId } }),
    ]);
    if (!person) throw new NotFoundException(`Person ${personId} not found`);
    if (person.treeId !== union.treeId) {
      throw new BadRequestException(
        'Person and union belong to different trees',
      );
    }
    return union;
  }

  // True if the candidate child is a partner of the union or an ancestor of
  // one of its partners — linking them as child would make the person their
  // own ancestor. Walks ancestry with a recursive CTE.
  private async isAncestorOfUnion(unionId: string, childId: string) {
    const rows = await this.prisma.$queryRaw<{ personId: string }[]>`
      WITH RECURSIVE ancestors("personId") AS (
        SELECT up."personId" FROM "UnionPartner" up
        WHERE up."unionId" = ${unionId}
        UNION
        SELECT up2."personId"
        FROM ancestors a
        JOIN "ChildInUnion" c ON c."personId" = a."personId"
        JOIN "UnionPartner" up2 ON up2."unionId" = c."unionId"
      )
      SELECT "personId" FROM ancestors
      WHERE "personId" = ${childId}
      LIMIT 1
    `;
    return rows.length > 0;
  }
}
