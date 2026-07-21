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
import { Person } from '../persons/models/person.model';
import { Union } from '../relationships/models/union.model';
import { CreateEventInput, UpdateEventInput } from './dto/event.inputs';
import { EventsService } from './events.service';
import { Event } from './models/event.model';

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
}

@Resolver(() => Union)
export class UnionEventsResolver {
  constructor(private readonly loaders: EntityLoaders) {}

  @ResolveField(() => [Event])
  events(@Parent() union: Union) {
    return this.loaders.eventsByUnionId.load(union.id);
  }
}
