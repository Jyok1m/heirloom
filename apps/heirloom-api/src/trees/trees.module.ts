import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module';
import { TreesResolver } from './trees.resolver';
import { TreesService } from './trees.service';

@Module({
  imports: [MediaModule],
  providers: [TreesResolver, TreesService],
  exports: [TreesService],
})
export class TreesModule {}
