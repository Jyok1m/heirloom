import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module';
import { PersonsResolver, TreePersonsResolver } from './persons.resolver';
import { PersonsService } from './persons.service';

@Module({
  imports: [MediaModule],
  providers: [PersonsResolver, TreePersonsResolver, PersonsService],
  exports: [PersonsService],
})
export class PersonsModule {}
