import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import type { GraphQLResolveInfo } from 'graphql';
import { PrismaService } from '../prisma/prisma.service';
import { IS_PUBLIC_KEY, requestOf, ROLES_KEY } from './decorators';

export interface JwtPayload {
  sub: string;
}

// Global guard: authenticates every request (cookie or bearer token),
// enforces @Public / @Roles, and restricts GraphQL mutations to admins.
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = requestOf(context);

    // Always try to attach the user, even on public routes
    const token = this.extractToken(req);
    if (token) {
      try {
        const payload = this.jwt.verify<JwtPayload>(token);
        const user = await this.prisma.user.findUnique({
          where: { id: payload.sub },
        });
        if (user) req.user = user;
      } catch {
        /* invalid or expired token: treated as anonymous */
      }
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    if (!req.user) {
      throw new UnauthorizedException('Authentication required');
    }

    const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (roles && !roles.includes(req.user.role)) {
      throw new ForbiddenException('Insufficient role');
    }

    // Writes on the GraphQL API are reserved to admins
    if (context.getType<GqlContextType>() === 'graphql') {
      const info =
        GqlExecutionContext.create(context).getInfo<GraphQLResolveInfo>();
      if (
        info.operation.operation === 'mutation' &&
        req.user.role !== 'ADMIN'
      ) {
        throw new ForbiddenException('Mutations require an admin account');
      }
    }

    return true;
  }

  private extractToken(req: {
    cookies?: Record<string, string>;
    headers: Record<string, string | undefined>;
  }): string | undefined {
    const cookie = req.cookies?.heirloom_token;
    if (cookie) return cookie;
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) return header.slice(7);
    return undefined;
  }
}
