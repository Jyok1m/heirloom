import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.use(cookieParser());
	app.useGlobalPipes(
		new ValidationPipe({ whitelist: true, transform: true }),
	);
	await app.listen(process.env.BACKEND_PORT ?? 3000);
	console.log(`Backend started : ${process.env.BACKEND_URL}/api`);
	console.log(`GraphQL started : ${process.env.BACKEND_URL}/graphql`);
	console.log(`Frontend started : ${process.env.FRONTEND_URL}`);
}

void bootstrap();
