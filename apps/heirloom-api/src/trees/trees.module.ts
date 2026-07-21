import { Module } from '@nestjs/common';
import { TreesResolver } from './trees.resolver';
import { TreesService } from './trees.service';

@Module({
  providers: [TreesResolver, TreesService],
  exports: [TreesService],
})
export class TreesModule {}
