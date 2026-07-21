import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import type {
  ChildInUnionModel as ChildInUnion,
  CitationModel as Citation,
  EventModel as Event,
  SourceModel as Source,
  PersonModel as Person,
  UnionModel as Union,
  UnionPartnerModel as UnionPartner,
} from '../../generated/prisma/models';
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

  readonly unionById = idLoader<Union>((ids) =>
    this.prisma.union.findMany({ where: { id: { in: ids } } }),
  );

  readonly unionsByTreeId = groupLoader<Union>('treeId', (treeIds) =>
    this.prisma.union.findMany({
      where: { treeId: { in: treeIds } },
      orderBy: { createdAt: 'asc' },
    }),
  );

  readonly partnerLinksByUnionId = groupLoader<UnionPartner>(
    'unionId',
    (unionIds) =>
      this.prisma.unionPartner.findMany({
        where: { unionId: { in: unionIds } },
      }),
  );

  readonly partnerLinksByPersonId = groupLoader<UnionPartner>(
    'personId',
    (personIds) =>
      this.prisma.unionPartner.findMany({
        where: { personId: { in: personIds } },
      }),
  );

  readonly childLinksByUnionId = groupLoader<ChildInUnion>(
    'unionId',
    (unionIds) =>
      this.prisma.childInUnion.findMany({
        where: { unionId: { in: unionIds } },
      }),
  );

  readonly eventById = idLoader<Event>((ids) =>
    this.prisma.event.findMany({ where: { id: { in: ids } } }),
  );

  readonly sourceById = idLoader<Source>((ids) =>
    this.prisma.source.findMany({ where: { id: { in: ids } } }),
  );

  readonly sourcesByTreeId = groupLoader<Source>('treeId', (treeIds) =>
    this.prisma.source.findMany({
      where: { treeId: { in: treeIds } },
      orderBy: { title: 'asc' },
    }),
  );

  readonly citationsByEventId = groupLoader<Citation>('eventId', (eventIds) =>
    this.prisma.citation.findMany({ where: { eventId: { in: eventIds } } }),
  );

  readonly citationsBySourceId = groupLoader<Citation>(
    'sourceId',
    (sourceIds) =>
      this.prisma.citation.findMany({ where: { sourceId: { in: sourceIds } } }),
  );

  readonly eventsByPersonId = groupLoader<Event>('personId', (personIds) =>
    this.prisma.event.findMany({
      where: { personId: { in: personIds } },
      orderBy: [{ dateSort: 'asc' }, { createdAt: 'asc' }],
    }),
  );

  readonly eventsByUnionId = groupLoader<Event>('unionId', (unionIds) =>
    this.prisma.event.findMany({
      where: { unionId: { in: unionIds } },
      orderBy: [{ dateSort: 'asc' }, { createdAt: 'asc' }],
    }),
  );

  readonly childLinksByPersonId = groupLoader<ChildInUnion>(
    'personId',
    (personIds) =>
      this.prisma.childInUnion.findMany({
        where: { personId: { in: personIds } },
      }),
  );
}
