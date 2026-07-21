import { ForbiddenException, Injectable } from '@nestjs/common';
import type { UserModel } from '../generated/prisma/models';
import { PrismaService } from '../prisma/prisma.service';

// Per-tree authorization: admins see everything, members only the trees
// they were invited to. Writes are admin-only.
@Injectable()
export class TreeAccessService {
  constructor(private readonly prisma: PrismaService) {}

  // undefined = unrestricted (admin)
  async accessibleTreeIds(user: UserModel): Promise<string[] | undefined> {
    if (user.role === 'ADMIN') return undefined;
    const memberships = await this.prisma.treeMembership.findMany({
      where: { userId: user.id },
      select: { treeId: true },
    });
    return memberships.map((m) => m.treeId);
  }

  async canView(user: UserModel, treeId: string): Promise<boolean> {
    if (user.role === 'ADMIN') return true;
    const membership = await this.prisma.treeMembership.findUnique({
      where: { userId_treeId: { userId: user.id, treeId } },
    });
    return membership !== null;
  }

  async assertView(user: UserModel, treeId: string): Promise<void> {
    if (!(await this.canView(user, treeId))) {
      throw new ForbiddenException('You do not have access to this tree');
    }
  }

  canWrite(user: UserModel): boolean {
    return user.role === 'ADMIN';
  }
}
