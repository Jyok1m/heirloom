import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Root .env, shared by the whole monorepo (__dirname = dist/ at runtime)
      envFilePath: join(__dirname, '../../../.env'),
      expandVariables: true,
    }),
  ],
})
export class AppModule {}
