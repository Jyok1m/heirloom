import { join } from 'node:path';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { DataloadersModule } from './common/dataloaders/dataloaders.module';
import { EventsModule } from './events/events.module';
import { MediaModule } from './media/media.module';
import { PersonsModule } from './persons/persons.module';
import { PrismaModule } from './prisma/prisma.module';
import { RelationshipsModule } from './relationships/relationships.module';
import { SourcesModule } from './sources/sources.module';
import { TreesModule } from './trees/trees.module';
import './graphql/enums';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Root .env, shared by the whole monorepo (__dirname = dist/ at runtime)
      envFilePath: join(__dirname, '../../../.env'),
      expandVariables: true,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      // Schema is generated from the code-first decorators; the file is
      // consumed by the frontend GraphQL codegen (__dirname = dist/ at runtime).
      autoSchemaFile: join(__dirname, '../schema.gql'),
      sortSchema: true,
    }),
    PrismaModule,
    DataloadersModule,
    TreesModule,
    PersonsModule,
    RelationshipsModule,
    EventsModule,
    SourcesModule,
    MediaModule,
  ],
})
export class AppModule {}
