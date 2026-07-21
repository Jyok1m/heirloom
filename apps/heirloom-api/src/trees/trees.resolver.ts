import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
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
  ) {}

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
