import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { EventsService } from '../events/events.service';
import {
  EventType,
  Pedigree,
  Sex,
  TreeRole,
  UnionType,
} from '../generated/prisma/enums';
import type { UserModel } from '../generated/prisma/models';
import { PersonsService } from '../persons/persons.service';
import { PrismaService } from '../prisma/prisma.service';
import { RelationshipsService } from '../relationships/relationships.service';
import { TreesService } from '../trees/trees.service';
import { AgentTool } from './providers/provider.interface';

// Mutable per-conversation context shared with AssistantService
export interface AssistantContext {
  createdTreeId?: string;
}

const PERSON_FIELDS = {
  firstName: { type: 'string' },
  lastName: { type: 'string' },
  namePrefix: { type: 'string' },
  nameSuffix: { type: 'string' },
  nickname: { type: 'string' },
  sex: { type: 'string', enum: Object.values(Sex) },
  notes: { type: 'string' },
} as const;

const EVENT_FIELDS = {
  type: { type: 'string', enum: Object.values(EventType) },
  description: { type: 'string', description: 'Required when type is OTHER' },
  dateValue: {
    type: 'string',
    description: 'GEDCOM date string, e.g. "12 JAN 1875" or "ABT 1850"',
  },
  dateSort: {
    type: 'string',
    description: 'ISO date used for sorting, e.g. "1875-01-12"',
  },
  place: { type: 'string' },
  notes: { type: 'string' },
} as const;

function schema(
  properties: Record<string, unknown>,
  required: string[] = [],
): Record<string, unknown> {
  return { type: 'object', properties, required, additionalProperties: false };
}

// Tools the agent can use. When the chat is bound to a tree, every tool is
// scoped to it. Without a bound tree, the agent also gets list_trees and
// create_tree, and the other tools take an explicit treeId argument.
// Deliberately no delete tools: destructive actions stay manual.
@Injectable()
export class AssistantToolsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly treesService: TreesService,
    private readonly personsService: PersonsService,
    private readonly relationshipsService: RelationshipsService,
    private readonly eventsService: EventsService,
    private readonly authService: AuthService,
  ) {}

  buildTools(options: {
    treeId?: string;
    ctx: AssistantContext;
    // Needed by admin tools (invitations are created on their behalf)
    user?: UserModel;
    // Trees the user can read (undefined = all, for admins)
    allowedTreeIds?: string[];
    // Trees the user can write to (undefined = all; [] = read-only viewer).
    // Deletions are impossible here regardless: no delete tool exists.
    writableTreeIds?: string[];
  }): AgentTool[] {
    const { treeId: boundTreeId, ctx, user, allowedTreeIds, writableTreeIds } =
      options;
    const readOnly = writableTreeIds !== undefined && writableTreeIds.length === 0;
    const isAdmin = writableTreeIds === undefined;
    const assertWritable = (treeId: string) => {
      if (writableTreeIds && !writableTreeIds.includes(treeId)) {
        throw new BadRequestException(
          'You do not have contributor access to this tree',
        );
      }
    };
    const requireWritableTree = (input: Record<string, unknown>): string => {
      const id = requireTree(input);
      assertWritable(id);
      return id;
    };
    const unionTreeId = async (unionId: string): Promise<string> => {
      const union = await this.prisma.union.findUnique({
        where: { id: unionId },
        select: { treeId: true },
      });
      if (!union) throw new NotFoundException(`Union ${unionId} not found`);
      return union.treeId;
    };
    // In unbound mode the model must say which tree it operates on
    const treeProp = boundTreeId
      ? {}
      : {
          treeId: {
            type: 'string',
            description: 'Id of the family tree to operate on',
          },
        };
    const treeRequired = boundTreeId ? [] : ['treeId'];
    const requireTree = (input: Record<string, unknown>): string => {
      const id =
        boundTreeId ??
        (typeof input.treeId === 'string' ? input.treeId : undefined);
      if (!id) throw new BadRequestException('treeId is required');
      if (allowedTreeIds && !allowedTreeIds.includes(id)) {
        throw new BadRequestException('You do not have access to this tree');
      }
      return id;
    };

    const tools: AgentTool[] = [];

    if (!boundTreeId) {
      tools.push({
        name: 'list_trees',
        description:
          'List the family trees accessible to the user, with their ids and names.',
        inputSchema: schema({}),
        execute: async () => ({
          trees: await this.prisma.tree.findMany({
            where: allowedTreeIds ? { id: { in: allowedTreeIds } } : undefined,
            select: { id: true, name: true, description: true },
            orderBy: { createdAt: 'asc' },
          }),
        }),
      });
    }

    if (!boundTreeId && isAdmin) {
      tools.push(
        {
          name: 'create_tree',
          description:
            'Create a new family tree. Returns its id, to pass to the other tools afterwards.',
          inputSchema: schema(
            { name: { type: 'string' }, description: { type: 'string' } },
            ['name'],
          ),
          execute: async (input) => {
            const tree = await this.treesService.create({
              name: String(input.name),
              description:
                typeof input.description === 'string'
                  ? input.description
                  : undefined,
            });
            ctx.createdTreeId = tree.id;
            return { treeId: tree.id, name: tree.name };
          },
        },
      );
    }

    tools.push(
      {
        name: 'search_persons',
        description:
          'Search persons in a family tree by name (first name, last name or nickname, case-insensitive). Returns matching persons with their ids. Use an empty query to list everyone.',
        inputSchema: schema({ ...treeProp, query: { type: 'string' } },
          treeRequired),
        execute: async (input) => {
          const treeId = requireTree(input);
          const q = typeof input.query === 'string' ? input.query.trim() : '';
          const persons = await this.prisma.person.findMany({
            where: {
              treeId,
              ...(q
                ? {
                    OR: [
                      { firstName: { contains: q, mode: 'insensitive' } },
                      { lastName: { contains: q, mode: 'insensitive' } },
                      { nickname: { contains: q, mode: 'insensitive' } },
                    ],
                  }
                : {}),
            },
            orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
            take: 50,
            select: { id: true, firstName: true, lastName: true, sex: true },
          });
          return { count: persons.length, persons };
        },
      },
      {
        name: 'get_person',
        description:
          'Get the full record of one person: identity, life events, unions with partners, children, and parents. Use this to answer "who is X" questions and before any update.',
        inputSchema: schema({ personId: { type: 'string' } }, ['personId']),
        execute: ({ personId }) =>
          this.getPersonDetails(String(personId), allowedTreeIds),
      },
    );

    // Member management: admins only, and no removal (deletions stay manual)
    if (isAdmin && user) {
      tools.push(
        {
          name: 'list_members',
          description:
            'List the members having access to a family tree (email, role VIEWER or CONTRIBUTOR).',
          inputSchema: schema({ ...treeProp }, treeRequired),
          execute: async (input) => ({
            members: await this.authService.listMembers(requireTree(input)),
          }),
        },
        {
          name: 'invite_member',
          description:
            'Create an invitation link granting access to a family tree. role VIEWER = read-only, CONTRIBUTOR = can add and edit (no deletion). Give the returned URL to the user so they can share it.',
          inputSchema: schema(
            {
              ...treeProp,
              role: { type: 'string', enum: Object.values(TreeRole) },
            },
            [...treeRequired, 'role'],
          ),
          execute: (input) =>
            this.authService.createInvitation(
              user,
              requireTree(input),
              input.role as TreeRole,
            ),
        },
      );
    }

    if (readOnly) return tools;

    tools.push(
      {
        name: 'create_person',
        description:
          'Create a new person in the family tree. Returns the created person with its id.',
        inputSchema: schema({ ...treeProp, ...PERSON_FIELDS }, treeRequired),
        execute: (input) => {
          const treeId = requireWritableTree(input);
          const { treeId: _ignored, ...fields } = input;
          return this.personsService.create({
            treeId,
            ...(fields as object),
          });
        },
      },
      {
        name: 'update_person',
        description:
          'Update fields of an existing person (names, sex, notes). Only the provided fields change.',
        inputSchema: schema(
          { personId: { type: 'string' }, ...PERSON_FIELDS },
          ['personId'],
        ),
        execute: async ({ personId, ...fields }) => {
          const treeId = await this.personTreeId(String(personId));
          if (boundTreeId && treeId !== boundTreeId) {
            throw new NotFoundException('Person not found in this tree');
          }
          assertWritable(treeId);
          return this.personsService.update(String(personId), fields);
        },
      },
      {
        name: 'create_union',
        description:
          'Create a union (couple) between up to two persons, e.g. a marriage. Provide the partner ids. Returns the union id, needed to attach children or union events.',
        inputSchema: schema(
          {
            ...treeProp,
            type: { type: 'string', enum: Object.values(UnionType) },
            partnerIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Ids of the partners (0 to 2 persons)',
            },
          },
          treeRequired,
        ),
        execute: async (input) => {
          const treeId = requireWritableTree(input);
          const union = await this.relationshipsService.create({
            treeId,
            type: input.type as UnionType | undefined,
          });
          const ids = Array.isArray(input.partnerIds)
            ? input.partnerIds.slice(0, 2)
            : [];
          for (const personId of ids) {
            await this.relationshipsService.addPartner(
              union.id,
              String(personId),
            );
          }
          return { unionId: union.id, type: union.type, partners: ids };
        },
      },
      {
        name: 'add_union_partner',
        description: 'Add a person as partner of an existing union (max 2).',
        inputSchema: schema(
          { unionId: { type: 'string' }, personId: { type: 'string' } },
          ['unionId', 'personId'],
        ),
        execute: async ({ unionId, personId }) => {
          assertWritable(await unionTreeId(String(unionId)));
          return this.relationshipsService.addPartner(
            String(unionId),
            String(personId),
          );
        },
      },
      {
        name: 'add_union_child',
        description:
          'Attach a person as child of a union. This is how filiation (parent-child links) is recorded: the parents are the partners of the union.',
        inputSchema: schema(
          {
            unionId: { type: 'string' },
            personId: { type: 'string' },
            pedigree: { type: 'string', enum: Object.values(Pedigree) },
          },
          ['unionId', 'personId'],
        ),
        execute: async ({ unionId, personId, pedigree }) => {
          assertWritable(await unionTreeId(String(unionId)));
          return this.relationshipsService.addChild(
            String(unionId),
            String(personId),
            pedigree as Pedigree | undefined,
          );
        },
      },
      {
        name: 'create_event',
        description:
          'Create a life event. Person events (BIRTH, DEATH, OCCUPATION...) need personId; union events (MARRIAGE, DIVORCE...) need unionId. Exactly one of the two.',
        inputSchema: schema(
          {
            personId: { type: 'string' },
            unionId: { type: 'string' },
            ...EVENT_FIELDS,
          },
          ['type'],
        ),
        execute: async (input) => {
          const ownerTree = input.personId
            ? await this.personTreeId(String(input.personId))
            : input.unionId
              ? await unionTreeId(String(input.unionId))
              : undefined;
          if (ownerTree) {
            if (boundTreeId && ownerTree !== boundTreeId) {
              throw new NotFoundException('Not found in this tree');
            }
            assertWritable(ownerTree);
          }
          const { dateSort, ...rest } = input;
          return this.eventsService.create({
            ...(rest as object),
            dateSort: dateSort ? new Date(String(dateSort)) : undefined,
          } as Parameters<EventsService['create']>[0]);
        },
      },
      {
        name: 'update_event',
        description:
          'Update an existing event (type, dates, place, description, notes).',
        inputSchema: schema({ eventId: { type: 'string' }, ...EVENT_FIELDS }, [
          'eventId',
        ]),
        execute: async ({ eventId, dateSort, ...fields }) => {
          assertWritable(await this.eventTreeId(String(eventId)));
          return this.eventsService.update(String(eventId), {
            ...(fields as object),
            dateSort: dateSort ? new Date(String(dateSort)) : undefined,
          } as Parameters<EventsService['update']>[1]);
        },
      },
    );

    return tools;
  }

  private async personTreeId(personId: string): Promise<string> {
    const person = await this.prisma.person.findUnique({
      where: { id: personId },
      select: { treeId: true },
    });
    if (!person) throw new NotFoundException(`Person ${personId} not found`);
    return person.treeId;
  }

  private async eventTreeId(eventId: string): Promise<string> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: {
        person: { select: { treeId: true } },
        union: { select: { treeId: true } },
      },
    });
    const treeId = event?.person?.treeId ?? event?.union?.treeId;
    if (!treeId) throw new NotFoundException(`Event ${eventId} not found`);
    return treeId;
  }

  private async getPersonDetails(personId: string, allowedTreeIds?: string[]) {
    const person = await this.prisma.person.findUnique({
      where: { id: personId },
      include: {
        events: { orderBy: [{ dateSort: 'asc' }] },
        unions: {
          include: {
            union: {
              include: {
                partners: { include: { person: true } },
                children: { include: { person: true } },
                events: true,
              },
            },
          },
        },
        parentLinks: {
          include: {
            union: {
              include: { partners: { include: { person: true } } },
            },
          },
        },
      },
    });
    if (
      !person ||
      (allowedTreeIds && !allowedTreeIds.includes(person.treeId))
    ) {
      throw new NotFoundException(`Person ${personId} not found`);
    }

    const shortName = (p: {
      id: string;
      firstName: string | null;
      lastName: string | null;
    }) => ({
      id: p.id,
      name: [p.firstName, p.lastName].filter(Boolean).join(' ') || '(unnamed)',
    });

    return {
      id: person.id,
      treeId: person.treeId,
      firstName: person.firstName,
      lastName: person.lastName,
      nickname: person.nickname,
      sex: person.sex,
      notes: person.notes,
      events: person.events.map((e) => ({
        id: e.id,
        type: e.type,
        date: e.dateValue,
        place: e.place,
        description: e.description,
      })),
      parents: person.parentLinks.flatMap((link) =>
        link.union.partners.map((p) => shortName(p.person)),
      ),
      unions: person.unions.map((link) => ({
        unionId: link.union.id,
        type: link.union.type,
        partners: link.union.partners
          .filter((p) => p.personId !== person.id)
          .map((p) => shortName(p.person)),
        children: link.union.children.map((c) => ({
          ...shortName(c.person),
          pedigree: c.pedigree,
        })),
        events: link.union.events.map((e) => ({
          type: e.type,
          date: e.dateValue,
          place: e.place,
        })),
      })),
    };
  }
}
