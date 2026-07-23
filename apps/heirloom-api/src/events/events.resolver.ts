import {
  Args,
  ID,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { EntityLoaders } from '../common/dataloaders/entity-loaders';
import { EventType } from '../generated/prisma/enums';
import { Person } from '../persons/models/person.model';
import { Union } from '../relationships/models/union.model';
import { CreateEventInput, UpdateEventInput } from './dto/event.inputs';
import { EventsService } from './events.service';
import { Event } from './models/event.model';

// Events that establish a person is deceased (GEDCOM DEAT/BURI/CREM)
const DEATH_TYPES: EventType[] = [
  EventType.DEATH,
  EventType.BURIAL,
  EventType.CREMATION,
];

// Events that mark a union as dissolved (divorce / annulment)
const DISSOLVED_TYPES: EventType[] = [EventType.DIVORCE, EventType.ANNULMENT];

@Resolver(() => Event)
export class EventsResolver {
  constructor(
    private readonly eventsService: EventsService,
    private readonly loaders: EntityLoaders,
  ) {}

  @Query(() => Event)
  event(@Args('id', { type: () => ID }) id: string) {
    return this.eventsService.findOne(id);
  }

  @Mutation(() => Event)
  createEvent(@Args('input') input: CreateEventInput) {
    return this.eventsService.create(input);
  }

  @Mutation(() => Event)
  updateEvent(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateEventInput,
  ) {
    return this.eventsService.update(id, input);
  }

  @Mutation(() => Event)
  deleteEvent(@Args('id', { type: () => ID }) id: string) {
    return this.eventsService.delete(id);
  }

  @ResolveField(() => Person, { nullable: true })
  person(@Parent() event: Event) {
    return event.personId ? this.loaders.personById.load(event.personId) : null;
  }

  @ResolveField(() => Union, { nullable: true })
  union(@Parent() event: Event) {
    return event.unionId ? this.loaders.unionById.load(event.unionId) : null;
  }
}

@Resolver(() => Person)
export class PersonEventsResolver {
  constructor(private readonly loaders: EntityLoaders) {}

  @ResolveField(() => [Event])
  events(@Parent() person: Person) {
    return this.loaders.eventsByPersonId.load(person.id);
  }

  // Verbatim GEDCOM birth date for the card (from the BIRTH event, if any)
  @ResolveField(() => String, { nullable: true })
  async birthDate(@Parent() person: Person): Promise<string | null> {
    const events = await this.loaders.eventsByPersonId.load(person.id);
    return events.find((e) => e.type === EventType.BIRTH)?.dateValue ?? null;
  }

  // Card marker: true once a death/burial/cremation event is recorded
  @ResolveField(() => Boolean)
  async deceased(@Parent() person: Person): Promise<boolean> {
    const events = await this.loaders.eventsByPersonId.load(person.id);
    return events.some((e) => DEATH_TYPES.includes(e.type));
  }
}

@Resolver(() => Union)
export class UnionEventsResolver {
  constructor(private readonly loaders: EntityLoaders) {}

  @ResolveField(() => [Event])
  events(@Parent() union: Union) {
    return this.loaders.eventsByUnionId.load(union.id);
  }

  // Card marker: true once a divorce/annulment is recorded on the union
  @ResolveField(() => Boolean)
  async dissolved(@Parent() union: Union): Promise<boolean> {
    const events = await this.loaders.eventsByUnionId.load(union.id);
    return events.some((e) => DISSOLVED_TYPES.includes(e.type));
  }

  // Verbatim date of the union's start (marriage / getting together), for the
  // small label shown next to the union point on the canvas.
  @ResolveField(() => String, { nullable: true })
  async date(@Parent() union: Union): Promise<string | null> {
    const events = await this.loaders.eventsByUnionId.load(union.id);
    const start = events.find(
      (e) => e.type === EventType.MARRIAGE || e.type === EventType.ENGAGEMENT,
    );
    return start?.dateValue ?? null;
  }
}
