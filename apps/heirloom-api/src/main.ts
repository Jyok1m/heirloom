import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
	const backPort = process.env.PORT ?? 3000;
	const app = await NestFactory.create(AppModule);
	await app.listen(backPort);
	console.log(`Backend started : http://localhost:${backPort}/api`);
	console.log(`GraphQL started : http://localhost:${backPort}/graphql`);
	console.log(`Frontend started : http://localhost:5173/`);
}

void bootstrap();
