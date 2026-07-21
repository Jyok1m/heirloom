import {
  Args,
  ID,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators';
import { TreeAccessService } from '../auth/tree-access.service';
import { EntityLoaders } from '../common/dataloaders/entity-loaders';
import type { UserModel } from '../generated/prisma/models';
import { Tree } from '../trees/models/tree.model';
import { CreatePersonInput, UpdatePersonInput } from './dto/person.inputs';
import { Person } from './models/person.model';
import { PersonsService } from './persons.service';

@Resolver(() => Person)
export class PersonsResolver {
  constructor(
    private readonly personsService: PersonsService,
    private readonly access: TreeAccessService,
  ) {}

  @Query(() => [Person])
  async persons(
    @CurrentUser() user: UserModel,
    @Args('treeId', { type: () => ID }) treeId: string,
    @Args('skip', { type: () => Int, defaultValue: 0 }) skip: number,
    @Args('take', { type: () => Int, defaultValue: 50 }) take: number,
  ) {
    await this.access.assertView(user, treeId);
    return this.personsService.findAll(treeId, skip, Math.min(take, 200));
  }

  @Query(() => Person)
  person(@Args('id', { type: () => ID }) id: string) {
    return this.personsService.findOne(id);
  }

  @Mutation(() => Person)
  createPerson(@Args('input') input: CreatePersonInput) {
    return this.personsService.create(input);
  }

  @Mutation(() => Person)
  updatePerson(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdatePersonInput,
  ) {
    return this.personsService.update(id, input);
  }

  @Mutation(() => Person)
  deletePerson(@Args('id', { type: () => ID }) id: string) {
    return this.personsService.delete(id);
  }
}

@Resolver(() => Tree)
export class TreePersonsResolver {
  constructor(private readonly loaders: EntityLoaders) {}

  @ResolveField(() => [Person])
  persons(@Parent() tree: Tree) {
    return this.loaders.personsByTreeId.load(tree.id);
  }
}
