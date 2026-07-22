import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module';
import {
  PublicTreeController,
  TreeSharingController,
} from './tree-sharing.controller';
import { TreesResolver } from './trees.resolver';
import { TreesService } from './trees.service';

@Module({
  imports: [MediaModule],
  controllers: [TreeSharingController, PublicTreeController],
  providers: [TreesResolver, TreesService],
  exports: [TreesService],
})
export class TreesModule {}
