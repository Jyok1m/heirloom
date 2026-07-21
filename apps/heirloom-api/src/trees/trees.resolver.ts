import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateTreeInput, UpdateTreeInput } from './dto/tree.inputs';
import { Tree } from './models/tree.model';
import { TreesService } from './trees.service';

@Resolver(() => Tree)
export class TreesResolver {
  constructor(private readonly treesService: TreesService) {}

  @Query(() => [Tree])
  trees() {
    return this.treesService.findAll();
  }

  @Query(() => Tree)
  tree(@Args('id', { type: () => ID }) id: string) {
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
