import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { PersonsModule } from '../persons/persons.module';
import { RelationshipsModule } from '../relationships/relationships.module';
import { TreesModule } from '../trees/trees.module';
import { AssistantController } from './assistant.controller';
import { AssistantToolsService } from './assistant-tools.service';
import { AssistantService } from './assistant.service';
import { ConversationStore } from './conversation-store.service';

@Module({
  imports: [TreesModule, PersonsModule, RelationshipsModule, EventsModule],
  controllers: [AssistantController],
  providers: [AssistantService, AssistantToolsService, ConversationStore],
})
export class AssistantModule {}
