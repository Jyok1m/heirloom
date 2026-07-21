import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import type { UserModel } from '../generated/prisma/models';

export const IS_PUBLIC_KEY = 'isPublic';
// Route accessible without authentication (req.user still set when a valid
// token is present, e.g. for the assistant's per-role behavior)
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const ROLES_KEY = 'roles';
export const Roles = (...roles: ('ADMIN' | 'MEMBER')[]) =>
  SetMetadata(ROLES_KEY, roles);

export function requestOf(context: ExecutionContext): {
  user?: UserModel;
  cookies?: Record<string, string>;
  headers: Record<string, string | undefined>;
} {
  if (context.getType<GqlContextType>() === 'graphql') {
    return GqlExecutionContext.create(context).getContext().req;
  }
  return context.switchToHttp().getRequest();
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => requestOf(context).user,
);
