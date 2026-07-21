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
import { Person } from '../persons/models/person.model';
import { Source } from '../sources/models/source.model';
import { Tree } from '../trees/models/tree.model';
import {
  CreateMediaInput,
  LinkMediaInput,
  UpdateMediaInput,
} from './dto/media.inputs';
import { MediaService } from './media.service';
import { Media, MediaLink } from './models/media.model';

@Resolver(() => Media)
export class MediaResolver {
  constructor(
    private readonly mediaService: MediaService,
    private readonly loaders: EntityLoaders,
  ) {}

  @Query(() => [Media])
  mediaItems(@Args('treeId', { type: () => ID }) treeId: string) {
    return this.mediaService.findAll(treeId);
  }

  @Query(() => Media)
  mediaItem(@Args('id', { type: () => ID }) id: string) {
    return this.mediaService.findOne(id);
  }

  @Mutation(() => Media)
  createMedia(@Args('input') input: CreateMediaInput) {
    return this.mediaService.create(input);
  }

  @Mutation(() => Media)
  updateMedia(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateMediaInput,
  ) {
    return this.mediaService.update(id, input);
  }

  @Mutation(() => Media)
  deleteMedia(@Args('id', { type: () => ID }) id: string) {
    return this.mediaService.delete(id);
  }

  @Mutation(() => MediaLink)
  linkMedia(@Args('input') input: LinkMediaInput) {
    return this.mediaService.link(input);
  }

  @Mutation(() => MediaLink)
  unlinkMedia(@Args('id', { type: () => ID }) id: string) {
    return this.mediaService.unlink(id);
  }

  @ResolveField(() => [MediaLink])
  links(@Parent() media: Media) {
    return this.loaders.mediaLinksByMediaId.load(media.id);
  }
}

@Resolver(() => MediaLink)
export class MediaLinkResolver {
  constructor(private readonly loaders: EntityLoaders) {}

  @ResolveField(() => Media)
  media(@Parent() link: MediaLink) {
    return this.loaders.mediaById.load(link.mediaId);
  }
}

// Media attached to a person / event / source, through the link table
async function mediaOfLinks(
  loaders: EntityLoaders,
  links: MediaLink[],
): Promise<Media[]> {
  const media = await Promise.all(
    links.map((link) => loaders.mediaById.load(link.mediaId)),
  );
  return media.filter(Boolean) as Media[];
}

@Resolver(() => Person)
export class PersonMediaResolver {
  constructor(private readonly loaders: EntityLoaders) {}

  @ResolveField(() => [Media])
  async media(@Parent() person: Person) {
    const links = await this.loaders.mediaLinksByPersonId.load(person.id);
    return mediaOfLinks(this.loaders, links);
  }
}

@Resolver(() => Event)
export class EventMediaResolver {
  constructor(private readonly loaders: EntityLoaders) {}

  @ResolveField(() => [Media])
  async media(@Parent() event: Event) {
    const links = await this.loaders.mediaLinksByEventId.load(event.id);
    return mediaOfLinks(this.loaders, links);
  }
}

@Resolver(() => Source)
export class SourceMediaResolver {
  constructor(private readonly loaders: EntityLoaders) {}

  @ResolveField(() => [Media])
  async media(@Parent() source: Source) {
    const links = await this.loaders.mediaLinksBySourceId.load(source.id);
    return mediaOfLinks(this.loaders, links);
  }
}

@Resolver(() => Tree)
export class TreeMediaResolver {
  constructor(private readonly loaders: EntityLoaders) {}

  @ResolveField(() => [Media])
  mediaItems(@Parent() tree: Tree) {
    return this.loaders.mediaByTreeId.load(tree.id);
  }
}
