import {
  Args,
  ID,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { AuthService } from '../auth/auth.service';
import { CurrentUser } from '../auth/decorators';
import { TreeAccessService } from '../auth/tree-access.service';
import type { UserModel } from '../generated/prisma/models';
import { CreateTreeInput, UpdateTreeInput } from './dto/tree.inputs';
import { Tree } from './models/tree.model';
import { TreesService } from './trees.service';

@Resolver(() => Tree)
export class TreesResolver {
  constructor(
    private readonly treesService: TreesService,
    private readonly access: TreeAccessService,
    private readonly authService: AuthService,
  ) {}

  // The person the current viewer identifies as in this tree (for kinship)
  @ResolveField(() => ID, { nullable: true })
  mySelfPersonId(
    @Parent() tree: Tree,
    @CurrentUser() user: UserModel,
  ): Promise<string | null> {
    return this.authService.getSelfPersonId(user.id, tree.id);
  }

  @Mutation(() => Boolean)
  setSelfPerson(
    @CurrentUser() user: UserModel,
    @Args('treeId', { type: () => ID }) treeId: string,
    @Args('personId', { type: () => ID, nullable: true }) personId?: string,
  ): Promise<boolean> {
    return this.authService.setSelfPerson(user.id, treeId, personId ?? null);
  }

  @Query(() => [Tree])
  async trees(@CurrentUser() user: UserModel) {
    return this.treesService.findAll(await this.access.accessibleTreeIds(user));
  }

  @Query(() => Tree)
  async tree(
    @CurrentUser() user: UserModel,
    @Args('id', { type: () => ID }) id: string,
  ) {
    await this.access.assertView(user, id);
    return this.treesService.findOne(id);
  }

  @Mutation(() => Tree)
  createTree(@Args('input') input: CreateTreeInput) {
    return this.treesService.create(input);
  }

  @Mutation(() => Tree)
  updateTree(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateTreeInput,
  ) {
    return this.treesService.update(id, input);
  }

  @Mutation(() => Tree)
  deleteTree(@Args('id', { type: () => ID }) id: string) {
    return this.treesService.delete(id);
  }
}
