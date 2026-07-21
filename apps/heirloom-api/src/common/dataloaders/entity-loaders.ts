import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import type { PersonModel as Person } from '../../generated/prisma/models';
import { PrismaService } from '../../prisma/prisma.service';

// Batches by primary key; resolves to null for missing ids
export function idLoader<T extends { id: string }>(
  fetch: (ids: string[]) => Promise<T[]>,
): DataLoader<string, T | null> {
  return new DataLoader(async (ids) => {
    const rows = await fetch([...ids]);
    const byId = new Map(rows.map((row) => [row.id, row]));
    return ids.map((id) => byId.get(id) ?? null);
  });
}

// Batches by foreign key; resolves to the list of rows per key
export function groupLoader<T>(
  key: keyof T & string,
  fetch: (keys: string[]) => Promise<T[]>,
): DataLoader<string, T[]> {
  return new DataLoader(async (keys) => {
    const rows = await fetch([...keys]);
    const groups = new Map<string, T[]>();
    for (const row of rows) {
      const k = row[key] as string;
      const group = groups.get(k);
      if (group) group.push(row);
      else groups.set(k, [row]);
    }
    return keys.map((k) => groups.get(k) ?? []);
  });
}

// One instance per GraphQL request: relation resolvers batch and cache
// through these loaders instead of issuing one query per parent (N+1).
@Injectable({ scope: Scope.REQUEST })
export class EntityLoaders {
  constructor(private readonly prisma: PrismaService) {}

  readonly personById = idLoader<Person>((ids) =>
    this.prisma.person.findMany({ where: { id: { in: ids } } }),
  );

  readonly personsByTreeId = groupLoader<Person>('treeId', (treeIds) =>
    this.prisma.person.findMany({
      where: { treeId: { in: treeIds } },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    }),
  );
}
