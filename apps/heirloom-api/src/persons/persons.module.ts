import { Module } from '@nestjs/common';
import { PersonsResolver, TreePersonsResolver } from './persons.resolver';
import { PersonsService } from './persons.service';

@Module({
  providers: [PersonsResolver, TreePersonsResolver, PersonsService],
  exports: [PersonsService],
})
export class PersonsModule {}
