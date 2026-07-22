import { randomBytes } from 'node:crypto';
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

  // ----------------------------------------------------------- public sharing

  // Read-only snapshot served to anyone holding the public share token.
  // Shaped for the 2D canvas (persons + unions with partner/child ids).
  async publicSnapshot(token: string) {
    const tree = await this.prisma.tree.findUnique({
      where: { publicShareToken: token },
      select: {
        id: true,
        name: true,
        persons: {
          select: { id: true, firstName: true, lastName: true, sex: true },
        },
        unions: {
          select: {
            id: true,
            partners: { select: { personId: true } },
            children: { select: { personId: true } },
          },
        },
      },
    });
    if (!tree) throw new NotFoundException('Shared tree not found');
    return {
      id: tree.id,
      name: tree.name,
      persons: tree.persons,
      unions: tree.unions.map((union) => ({
        id: union.id,
        partnerIds: union.partners.map((partner) => partner.personId),
        childIds: union.children.map((child) => child.personId),
      })),
    };
  }

  async getShareToken(treeId: string): Promise<string | null> {
    const tree = await this.findOne(treeId);
    return tree.publicShareToken;
  }

  // Idempotent: keeps the existing token if sharing is already on.
  async enableShare(treeId: string): Promise<string> {
    const tree = await this.findOne(treeId);
    if (tree.publicShareToken) return tree.publicShareToken;
    return this.setShareToken(treeId, randomBytes(24).toString('base64url'));
  }

  async disableShare(treeId: string): Promise<void> {
    await this.findOne(treeId);
    await this.setShareToken(treeId, null);
  }

  // Revoke old links and issue a fresh one in a single step.
  async rotateShare(treeId: string): Promise<string> {
    await this.findOne(treeId);
    return this.setShareToken(treeId, randomBytes(24).toString('base64url'));
  }

  private async setShareToken(
    treeId: string,
    token: string | null,
  ): Promise<string> {
    const tree = await this.prisma.tree.update({
      where: { id: treeId },
      data: { publicShareToken: token },
    });
    return tree.publicShareToken as string;
  }
}
