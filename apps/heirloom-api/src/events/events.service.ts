import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { rethrowAsNotFound } from '../common/prisma-errors';
import { EventType } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventInput, UpdateEventInput } from './dto/event.inputs';

// GEDCOM FAM events; everything else (except OTHER) belongs to a person
const UNION_EVENT_TYPES: EventType[] = [
  EventType.MARRIAGE,
  EventType.MARRIAGE_BANNS,
  EventType.ENGAGEMENT,
  EventType.DIVORCE,
  EventType.ANNULMENT,
];

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException(`Event ${id} not found`);
    return event;
  }

  async create({ personId, unionId, ...data }: CreateEventInput) {
    if (!personId === !unionId) {
      throw new BadRequestException(
        'An event belongs to exactly one person or one union',
      );
    }
    this.checkTypeMatchesOwner(data.type, Boolean(unionId), data.description);

    try {
      return await this.prisma.event.create({
        data: {
          ...data,
          ...(personId ? { person: { connect: { id: personId } } } : {}),
          ...(unionId ? { union: { connect: { id: unionId } } } : {}),
        },
      });
    } catch (error) {
      rethrowAsNotFound(
        error,
        personId ? 'Person' : 'Union',
        personId ?? unionId!,
      );
    }
  }

  async update(id: string, input: UpdateEventInput) {
    const event = await this.findOne(id);
    const type = input.type ?? event.type;
    const description =
      input.description !== undefined ? input.description : event.description;
    this.checkTypeMatchesOwner(type, Boolean(event.unionId), description);

    return this.prisma.event.update({ where: { id }, data: input });
  }

  async delete(id: string) {
    try {
      return await this.prisma.event.delete({ where: { id } });
    } catch (error) {
      rethrowAsNotFound(error, 'Event', id);
    }
  }

  private checkTypeMatchesOwner(
    type: EventType,
    isUnionEvent: boolean,
    description: string | null | undefined,
  ) {
    if (type === EventType.OTHER) {
      if (!description) {
        throw new BadRequestException(
          'An OTHER event requires a description',
        );
      }
      return;
    }
    if (isUnionEvent !== UNION_EVENT_TYPES.includes(type)) {
      throw new BadRequestException(
        `Event type ${type} cannot be attached to a ${isUnionEvent ? 'union' : 'person'}`,
      );
    }
  }
}
