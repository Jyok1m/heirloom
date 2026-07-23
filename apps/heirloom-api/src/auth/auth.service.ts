import { randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { UserModel } from '../generated/prisma/models';
import { TreeRole } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { hashPassword, verifyPassword } from './password';

const INVITATION_DEFAULT_DAYS = 7;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return { token: this.jwt.sign({ sub: user.id }), user: this.safe(user) };
  }

  // First account of the instance: becomes ADMIN. Rejected once a user exists.
  async setupFirstAdmin(email: string, password: string, displayName?: string) {
    const count = await this.prisma.user.count();
    if (count > 0) {
      throw new ForbiddenException(
        'Setup already done. Ask an admin to create your account.',
      );
    }
    const user = await this.createUser(email, password, 'ADMIN', displayName);
    return { token: this.jwt.sign({ sub: user.id }), user: this.safe(user) };
  }

  async createAdmin(email: string, password: string, displayName?: string) {
    return this.safe(
      await this.createUser(email, password, 'ADMIN', displayName),
    );
  }

  // ------------------------------------------------------------------ invites

  async createInvitation(
    createdBy: UserModel,
    treeId: string,
    role: TreeRole,
    expiresInDays = INVITATION_DEFAULT_DAYS,
  ) {
    const tree = await this.prisma.tree.findUnique({ where: { id: treeId } });
    if (!tree) throw new NotFoundException(`Tree ${treeId} not found`);

    const invitation = await this.prisma.invitation.create({
      data: {
        token: randomBytes(24).toString('base64url'),
        treeId,
        role,
        createdById: createdBy.id,
        expiresAt: new Date(Date.now() + expiresInDays * 24 * 3600 * 1000),
      },
    });
    const frontend = this.config.get<string>('FRONTEND_URL') ?? '';
    return {
      token: invitation.token,
      role: invitation.role,
      treeId,
      treeName: tree.name,
      expiresAt: invitation.expiresAt,
      url: `${frontend}/invite/${invitation.token}`,
    };
  }

  async getInvitation(token: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
      include: { tree: { select: { name: true } } },
    });
    if (!invitation || invitation.usedAt || invitation.expiresAt < new Date()) {
      throw new NotFoundException('Invitation not found or expired');
    }
    return invitation;
  }

  // Anonymous visitors create an account; logged-in users just gain access
  async acceptInvitation(
    token: string,
    currentUser: UserModel | undefined,
    account?: { email: string; password: string; displayName?: string },
  ) {
    const invitation = await this.getInvitation(token);

    let user = currentUser;
    if (!user) {
      if (!account) {
        throw new BadRequestException(
          'email and password are required to create your account',
        );
      }
      user = await this.createUser(
        account.email,
        account.password,
        'MEMBER',
        account.displayName,
      );
    }

    // Claim the single-use invitation atomically: the `usedAt: null` predicate
    // in updateMany lets only one of two concurrent accepts win, and the
    // membership is created in the same transaction so a lost race grants
    // nothing. getInvitation() above only guards the common (non-racing) case.
    await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.invitation.updateMany({
        where: { id: invitation.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (claimed.count !== 1) {
        throw new ConflictException('Invitation already used');
      }
      await tx.treeMembership.upsert({
        where: {
          userId_treeId: { userId: user.id, treeId: invitation.treeId },
        },
        create: {
          userId: user.id,
          treeId: invitation.treeId,
          role: invitation.role,
        },
        update: { role: invitation.role },
      });
    });

    return {
      token: currentUser ? undefined : this.jwt.sign({ sub: user.id }),
      user: this.safe(user),
      treeId: invitation.treeId,
      role: invitation.role,
    };
  }

  // -------------------------------------------------------------- self person

  async getSelfPersonId(userId: string, treeId: string): Promise<string | null> {
    const membership = await this.prisma.treeMembership.findUnique({
      where: { userId_treeId: { userId, treeId } },
      select: { selfPersonId: true },
    });
    return membership?.selfPersonId ?? null;
  }

  // "C'est moi": links the viewer to a person so cards can show kinship. Upserts
  // the membership so an admin without one can also identify themselves.
  async setSelfPerson(userId: string, treeId: string, personId: string | null) {
    if (personId) {
      const person = await this.prisma.person.findUnique({
        where: { id: personId },
        select: { treeId: true },
      });
      if (!person || person.treeId !== treeId) {
        throw new BadRequestException('Person must belong to this tree');
      }
    }
    await this.prisma.treeMembership.upsert({
      where: { userId_treeId: { userId, treeId } },
      create: { userId, treeId, role: 'CONTRIBUTOR', selfPersonId: personId },
      update: { selfPersonId: personId },
    });
    return true;
  }

  // ------------------------------------------------------------------ members

  async listMembers(treeId: string) {
    const memberships = await this.prisma.treeMembership.findMany({
      where: { treeId },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });
    return memberships.map((membership) => ({
      userId: membership.userId,
      email: membership.user.email,
      displayName: membership.user.displayName,
      role: membership.role,
      since: membership.createdAt,
    }));
  }

  async removeMember(treeId: string, userId: string) {
    try {
      await this.prisma.treeMembership.delete({
        where: { userId_treeId: { userId, treeId } },
      });
    } catch {
      throw new NotFoundException('Membership not found');
    }
    return { ok: true };
  }

  async listPendingInvitations(treeId: string) {
    const invitations = await this.prisma.invitation.findMany({
      where: { treeId, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    const frontend = this.config.get<string>('FRONTEND_URL') ?? '';
    return invitations.map((invitation) => ({
      id: invitation.id,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      url: `${frontend}/invite/${invitation.token}`,
    }));
  }

  async revokeInvitation(id: string) {
    try {
      await this.prisma.invitation.delete({ where: { id } });
    } catch {
      throw new NotFoundException('Invitation not found');
    }
    return { ok: true };
  }

  // ------------------------------------------------------------------ helpers

  private async createUser(
    email: string,
    password: string,
    role: 'ADMIN' | 'MEMBER',
    displayName?: string,
  ) {
    const existing = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) throw new ConflictException('Email already registered');
    return this.prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash: hashPassword(password),
        role,
        displayName,
      },
    });
  }

  safe(user: UserModel) {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    };
  }
}
