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

  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://172.18.0.1:5173',
      'http://192.168.56.1:5173',
      'http://192.168.0.14:5173',
      'http://172.21.112.1:5173',
    ],
    credentials: true,
  });

  const prefix = process.env.NODE_ENV === 'production' ? '' : 'api';

  app.setGlobalPrefix(prefix);

  const config = new DocumentBuilder()
    .setTitle('Connexio Backend')
    .setDescription('API для управления пользователями, документами и связями Connexio.')
    .setVersion('1.0')
    .addCookieAuth('access_token', {
      type: 'apiKey',
      in: 'cookie',
      description: 'HttpOnly cookie с access JWT.',
    })
    .addCookieAuth('refresh_token', {
      type: 'apiKey',
      in: 'cookie',
      description: 'HttpOnly cookie с refresh JWT.',
    })
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
