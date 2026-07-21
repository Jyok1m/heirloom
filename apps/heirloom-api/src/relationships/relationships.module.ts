import { Module } from '@nestjs/common';
import {
  PersonRelationshipsResolver,
  TreeUnionsResolver,
  UnionChildResolver,
  UnionsResolver,
} from './relationships.resolver';
import { RelationshipsService } from './relationships.service';

@Module({
  providers: [
    UnionsResolver,
    UnionChildResolver,
    PersonRelationshipsResolver,
    TreeUnionsResolver,
    RelationshipsService,
  ],
  exports: [RelationshipsService],
})
export class RelationshipsModule {}
