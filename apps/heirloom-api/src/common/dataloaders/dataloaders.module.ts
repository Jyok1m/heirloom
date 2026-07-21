import { Global, Module } from '@nestjs/common';
import { EntityLoaders } from './entity-loaders';

@Global()
@Module({
  providers: [EntityLoaders],
  exports: [EntityLoaders],
})
export class DataloadersModule {}
