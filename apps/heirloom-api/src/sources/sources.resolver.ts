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
import { Event } from '../events/models/event.model';
import { Tree } from '../trees/models/tree.model';
import {
  CreateCitationInput,
  CreateSourceInput,
  UpdateCitationInput,
  UpdateSourceInput,
} from './dto/source.inputs';
import { Citation, Source } from './models/source.model';
import { SourcesService } from './sources.service';

@Resolver(() => Source)
export class SourcesResolver {
  constructor(
    private readonly sourcesService: SourcesService,
    private readonly loaders: EntityLoaders,
  ) {}

  @Query(() => [Source])
  sources(@Args('treeId', { type: () => ID }) treeId: string) {
    return this.sourcesService.findAll(treeId);
  }

  @Query(() => Source)
  source(@Args('id', { type: () => ID }) id: string) {
    return this.sourcesService.findOne(id);
  }

  @Mutation(() => Source)
  createSource(@Args('input') input: CreateSourceInput) {
    return this.sourcesService.create(input);
  }

  @Mutation(() => Source)
  updateSource(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateSourceInput,
  ) {
    return this.sourcesService.update(id, input);
  }

  @Mutation(() => Source)
  deleteSource(@Args('id', { type: () => ID }) id: string) {
    return this.sourcesService.delete(id);
  }

  @Mutation(() => Citation)
  createCitation(@Args('input') input: CreateCitationInput) {
    return this.sourcesService.createCitation(input);
  }

  @Mutation(() => Citation)
  updateCitation(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateCitationInput,
  ) {
    return this.sourcesService.updateCitation(id, input);
  }

  @Mutation(() => Citation)
  deleteCitation(@Args('id', { type: () => ID }) id: string) {
    return this.sourcesService.deleteCitation(id);
  }

  @ResolveField(() => [Citation])
  citations(@Parent() source: Source) {
    return this.loaders.citationsBySourceId.load(source.id);
  }
}

@Resolver(() => Citation)
export class CitationsResolver {
  constructor(private readonly loaders: EntityLoaders) {}

  @ResolveField(() => Event)
  event(@Parent() citation: Citation) {
    return this.loaders.eventById.load(citation.eventId);
  }

  @ResolveField(() => Source)
  source(@Parent() citation: Citation) {
    return this.loaders.sourceById.load(citation.sourceId);
  }
}

@Resolver(() => Event)
export class EventCitationsResolver {
  constructor(private readonly loaders: EntityLoaders) {}

  @ResolveField(() => [Citation])
  citations(@Parent() event: Event) {
    return this.loaders.citationsByEventId.load(event.id);
  }
}

@Resolver(() => Tree)
export class TreeSourcesResolver {
  constructor(private readonly loaders: EntityLoaders) {}

  @ResolveField(() => [Source])
  sources(@Parent() tree: Tree) {
    return this.loaders.sourcesByTreeId.load(tree.id);
  }
}
