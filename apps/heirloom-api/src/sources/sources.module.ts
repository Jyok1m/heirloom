import { Module } from '@nestjs/common';
import {
  CitationsResolver,
  EventCitationsResolver,
  SourcesResolver,
  TreeSourcesResolver,
} from './sources.resolver';
import { SourcesService } from './sources.service';

@Module({
  providers: [
    SourcesResolver,
    CitationsResolver,
    EventCitationsResolver,
    TreeSourcesResolver,
    SourcesService,
  ],
  exports: [SourcesService],
})
export class SourcesModule {}
