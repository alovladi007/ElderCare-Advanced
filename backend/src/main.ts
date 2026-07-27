import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { LoggerService } from './common/logging/logger.service';
import cors from 'cors';
import helmet from 'helmet';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Use Winston logger
  const logger = app.get(LoggerService);
  app.useLogger(logger);

  // Security headers with Helmet
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow embedding for Swagger UI
  }));

  // Enable CORS with security configurations
  app.use(cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        process.env.FRONTEND_URL || 'http://localhost:31610',
        'http://localhost:31610',
        'http://localhost:31611', // Development backend
      ];

      // Allow requests with no origin (like mobile apps, Postman, curl)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID', 'X-IoT-Token'],
    exposedHeaders: ['X-Correlation-ID'],
    maxAge: 86400, // 24 hours
  }));

  // Serve uploaded files statically (for development)
  app.useStaticAssets(path.join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

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

  // Fallback must never be 3000/3001: those collide with other tooling on a
// developer machine, and .env is gitignored so a fresh clone has none.
// See PORTS.md.
  const port = process.env.PORT || 31611;
  const host = process.env.HOST || '0.0.0.0';
  await app.listen(port, host);

  logger.log(
    `ElderCare Advanced Backend started successfully`,
    'Bootstrap',
    {
      port,
      host,
      nodeEnv: process.env.NODE_ENV || 'development',
      apiDocs: `http://localhost:${port}/api/docs`,
    }
  );
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
