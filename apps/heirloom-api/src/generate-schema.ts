import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Boots the Nest application context so GraphQLModule writes its autoSchemaFile
// (schema.gql), then exits — regenerates the committed schema for the frontend
// codegen without ever running the HTTP server.
async function main() {
  const app = await NestFactory.create(AppModule, { logger: false });
  // The Apollo driver writes autoSchemaFile when the server starts, not at
  // init; listen on an ephemeral port (0) to trigger it, then shut down.
  await app.listen(0);
  await app.close();
}

void main().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
