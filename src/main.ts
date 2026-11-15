import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const prefix = process.env.NODE_ENV === 'production' ? '' : 'api';

  app.setGlobalPrefix(prefix);

  const config = new DocumentBuilder()
    .setTitle('Connexio Backend')
    .setDescription('Connexio Swagger API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document);

  app.enableShutdownHooks();

  const port = process.env.PORT || 3000;

  await app.listen(port, '127.0.0.1');

  const url = await app.getUrl();

  logger.log(`Server started on: ${url}${prefix ? '/' + prefix : ''}`);
  logger.log(`Swagger is running on: ${url}${prefix ? '/' + prefix : ''}/docs`);
}
void bootstrap();
