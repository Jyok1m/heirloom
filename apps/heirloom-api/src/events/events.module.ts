import { Module } from '@nestjs/common';
import {
  EventsResolver,
  PersonEventsResolver,
  UnionEventsResolver,
} from './events.resolver';
import { EventsService } from './events.service';

@Module({
  providers: [
    EventsResolver,
    PersonEventsResolver,
    UnionEventsResolver,
    EventsService,
  ],
  exports: [EventsService],
})
export class EventsModule {}
