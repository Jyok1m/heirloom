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
import { Pedigree } from '../generated/prisma/enums';
import { Person } from '../persons/models/person.model';
import { Tree } from '../trees/models/tree.model';
import {
  CreateUnionInput,
  UnionChildInput,
  UpdateUnionInput,
} from './dto/union.inputs';
import { Union, UnionChild } from './models/union.model';
import { RelationshipsService } from './relationships.service';

@Resolver(() => Union)
export class UnionsResolver {
  constructor(
    private readonly relationshipsService: RelationshipsService,
    private readonly loaders: EntityLoaders,
  ) {}

  @Query(() => [Union])
  unions(@Args('treeId', { type: () => ID }) treeId: string) {
    return this.relationshipsService.findAll(treeId);
  }

  @Query(() => Union)
  union(@Args('id', { type: () => ID }) id: string) {
    return this.relationshipsService.findOne(id);
  }

  @Mutation(() => Union)
  createUnion(@Args('input') input: CreateUnionInput) {
    return this.relationshipsService.create(input);
  }

  @Mutation(() => Union)
  updateUnion(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateUnionInput,
  ) {
    return this.relationshipsService.update(id, input);
  }

  @Mutation(() => Union)
  deleteUnion(@Args('id', { type: () => ID }) id: string) {
    return this.relationshipsService.delete(id);
  }

  @Mutation(() => Union)
  addUnionPartner(
    @Args('unionId', { type: () => ID }) unionId: string,
    @Args('personId', { type: () => ID }) personId: string,
  ) {
    return this.relationshipsService.addPartner(unionId, personId);
  }

  @Mutation(() => Union)
  removeUnionPartner(
    @Args('unionId', { type: () => ID }) unionId: string,
    @Args('personId', { type: () => ID }) personId: string,
  ) {
    return this.relationshipsService.removePartner(unionId, personId);
  }

  @Mutation(() => Union)
  addUnionChild(@Args('input') input: UnionChildInput) {
    return this.relationshipsService.addChild(
      input.unionId,
      input.personId,
      input.pedigree,
    );
  }

  @Mutation(() => Union)
  setUnionChildPedigree(
    @Args('unionId', { type: () => ID }) unionId: string,
    @Args('personId', { type: () => ID }) personId: string,
    @Args('pedigree', { type: () => Pedigree }) pedigree: Pedigree,
  ) {
    return this.relationshipsService.setChildPedigree(
      unionId,
      personId,
      pedigree,
    );
  }

  @Mutation(() => Union)
  removeUnionChild(
    @Args('unionId', { type: () => ID }) unionId: string,
    @Args('personId', { type: () => ID }) personId: string,
  ) {
    return this.relationshipsService.removeChild(unionId, personId);
  }

  @ResolveField(() => [Person])
  async partners(@Parent() union: Union) {
    const links = await this.loaders.partnerLinksByUnionId.load(union.id);
    const persons = await Promise.all(
      links.map((link) => this.loaders.personById.load(link.personId)),
    );
    return persons.filter(Boolean);
  }

  @ResolveField(() => [UnionChild])
  children(@Parent() union: Union) {
    return this.loaders.childLinksByUnionId.load(union.id);
  }
}

@Resolver(() => UnionChild)
export class UnionChildResolver {
  constructor(private readonly loaders: EntityLoaders) {}

  @ResolveField(() => Person)
  person(@Parent() child: UnionChild) {
    return this.loaders.personById.load(child.personId);
  }
}

@Resolver(() => Person)
export class PersonRelationshipsResolver {
  constructor(private readonly loaders: EntityLoaders) {}

  // Unions this person is a partner of
  @ResolveField(() => [Union])
  async unions(@Parent() person: Person) {
    const links = await this.loaders.partnerLinksByPersonId.load(person.id);
    const unions = await Promise.all(
      links.map((link) => this.loaders.unionById.load(link.unionId)),
    );
    return unions.filter(Boolean);
  }

  // Unions this person is a child of (usually one)
  @ResolveField(() => [Union])
  async parentUnions(@Parent() person: Person) {
    const links = await this.loaders.childLinksByPersonId.load(person.id);
    const unions = await Promise.all(
      links.map((link) => this.loaders.unionById.load(link.unionId)),
    );
    return unions.filter(Boolean);
  }
}

@Resolver(() => Tree)
export class TreeUnionsResolver {
  constructor(private readonly loaders: EntityLoaders) {}

  @ResolveField(() => [Union])
  unions(@Parent() tree: Tree) {
    return this.loaders.unionsByTreeId.load(tree.id);
  }
}
