import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';
import { LoggerService } from './common/logging/logger.service';
import * as cors from 'cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Use Winston logger
  const logger = app.get(LoggerService);
  app.useLogger(logger);

  // Enable CORS
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  }));

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('ElderCare Advanced API')
    .setDescription('Smart Home & Extreme Safety Module for Elder Care')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication & Authorization')
    .addTag('elder-profile', 'Elder Profile Management')
    .addTag('smart-home', 'Smart Home & IoT')
    .addTag('bookings', 'Booking & Services')
    .addTag('care-management', 'Care Management')
    .addTag('api-gateway', 'API Gateway')
    .addTag('health', 'Health Monitoring')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);

  logger.log(
    `ElderCare Advanced Backend started successfully`,
    'Bootstrap',
    {
      port,
      nodeEnv: process.env.NODE_ENV || 'development',
      apiDocs: `http://localhost:${port}/api/docs`,
    }
  );
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
