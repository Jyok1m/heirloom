import { Module } from '@nestjs/common';
import {
  EventMediaResolver,
  MediaLinkResolver,
  MediaResolver,
  PersonMediaResolver,
  SourceMediaResolver,
  TreeMediaResolver,
} from './media.resolver';
import { MediaService } from './media.service';

@Module({
  providers: [
    MediaResolver,
    MediaLinkResolver,
    PersonMediaResolver,
    EventMediaResolver,
    SourceMediaResolver,
    TreeMediaResolver,
    MediaService,
  ],
  exports: [MediaService],
})
export class MediaModule {}
