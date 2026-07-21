import { NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';

// Converts Prisma "record not found" (P2025) into a GraphQL-friendly 404
export function rethrowAsNotFound(
  error: unknown,
  entity: string,
  id: string,
): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2025'
  ) {
    throw new NotFoundException(`${entity} ${id} not found`);
  }
  throw error;
}
