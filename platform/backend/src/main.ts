import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Security
  app.use(helmet());
  app.use(compression());

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:31610',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // API prefix
  const apiPrefix = process.env.API_PREFIX || 'api';
  app.setGlobalPrefix(apiPrefix);

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('ElderCare Platform API')
    .setDescription('Production-grade Elder Care Platform API Documentation')
    .setVersion('2.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication & Authorization')
    .addTag('users', 'User Management')
    .addTag('elders', 'Elder Profiles & Care Teams')
    .addTag('care-plans', 'Care Plans & Tasks')
    .addTag('medications', 'Medication Management')
    .addTag('vitals', 'Vitals & Devices')
    .addTag('alerts', 'Alert System')
    .addTag('memory-care', 'Memory Care Features')
    .addTag('assessments', 'Health Assessments')
    .addTag('nutrition', 'Nutrition & Meal Planning')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 31615;
  await app.listen(port);

  console.log(`
    🚀 ElderCare Platform API is running!

    📝 API:          http://localhost:${port}/${apiPrefix}
    📚 Swagger Docs: http://localhost:${port}/api/docs
    🏥 Health Check: http://localhost:${port}/health

    Environment: ${process.env.NODE_ENV || 'development'}
  `);
}

bootstrap();
