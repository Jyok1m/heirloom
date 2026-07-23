import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Maps a GraphQL mutation to the tree it writes to, so contributors can be
// scoped to their own trees. Tree lifecycle and every deletion stay admin-only.
@Injectable()
export class MutationScopeService {
  constructor(private readonly prisma: PrismaService) {}

  // Deletions (delete/remove/unlink) are reserved to admins
  isDeletion(field: string): boolean {
    return /^(delete|remove|unlink)/.test(field);
  }

  isAdminOnly(field: string): boolean {
    return field === 'createTree' || field === 'updateTree';
  }

  async resolveTreeId(
    field: string,
    args: Record<string, any>,
  ): Promise<string | undefined> {
    switch (field) {
      // A member marking which person they are, scoped to that tree
      case 'setSelfPerson':
        return args.treeId;
      case 'createPerson':
      case 'createUnion':
      case 'createSource':
      case 'createMedia':
        return args.input?.treeId;
      case 'updatePerson':
        return this.personTree(args.id);
      case 'updateUnion':
        return this.unionTree(args.id);
      case 'addUnionPartner':
      case 'setUnionChildPedigree':
        return this.unionTree(args.unionId);
      case 'addUnionChild':
        return this.unionTree(args.input?.unionId);
      case 'createEvent': {
        const { personId, unionId } = args.input ?? {};
        if (personId) return this.personTree(personId);
        if (unionId) return this.unionTree(unionId);
        return undefined;
      }
      case 'updateEvent':
        return this.eventTree(args.id);
      case 'updateSource':
        return this.sourceTree(args.id);
      case 'createCitation':
        return this.eventTree(args.input?.eventId);
      case 'updateCitation': {
        const citation = await this.prisma.citation.findUnique({
          where: { id: args.id },
          select: { eventId: true },
        });
        return citation ? this.eventTree(citation.eventId) : undefined;
      }
      case 'updateMedia':
        return this.mediaTree(args.id);
      case 'linkMedia':
        return this.mediaTree(args.input?.mediaId);
      default:
        // Unknown mutation: no tree scope resolvable, caller must deny
        return undefined;
    }
  }

  private async personTree(id?: string) {
    if (!id) return undefined;
    const row = await this.prisma.person.findUnique({
      where: { id },
      select: { treeId: true },
    });
    return row?.treeId;
  }

  private async unionTree(id?: string) {
    if (!id) return undefined;
    const row = await this.prisma.union.findUnique({
      where: { id },
      select: { treeId: true },
    });
    return row?.treeId;
  }

  private async eventTree(id?: string) {
    if (!id) return undefined;
    const row = await this.prisma.event.findUnique({
      where: { id },
      select: {
        person: { select: { treeId: true } },
        union: { select: { treeId: true } },
      },
    });
    return row?.person?.treeId ?? row?.union?.treeId;
  }

  private async sourceTree(id?: string) {
    if (!id) return undefined;
    const row = await this.prisma.source.findUnique({
      where: { id },
      select: { treeId: true },
    });
    return row?.treeId;
  }

  private async mediaTree(id?: string) {
    if (!id) return undefined;
    const row = await this.prisma.media.findUnique({
      where: { id },
      select: { treeId: true },
    });
    return row?.treeId;
  }
}
