import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	await app.listen(process.env.BACKEND_PORT ?? 3000);
	console.log(`Backend started : ${process.env.BACKEND_URL}/api`);
	console.log(`GraphQL started : ${process.env.BACKEND_URL}/graphql`);
	console.log(`Frontend started : ${process.env.FRONTEND_URL}`);
}

void bootstrap();
