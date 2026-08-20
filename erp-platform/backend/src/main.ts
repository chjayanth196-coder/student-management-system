import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const configService = app.get(ConfigService);

// Security
  app.use(helmet());
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN', '*'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Compression
  app.use(compression());

  // Cookies
  app.use(cookieParser());

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global response transformation
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger / OpenAPI documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Multi-College ERP Platform API')
    .setDescription('Enterprise-grade ERP & Student Management System serving Schools, Colleges, Universities, and Training Institutes')
    .setVersion('1.0.0')
    .addTag('Auth', 'Authentication & authorization')
    .addTag('Users', 'User management')
    .addTag('Institutions', 'Multi-tenant institution management')
    .addTag('Academic', 'Academic structure (years, departments, classes, sections, subjects)')
    .addTag('Students', 'Student information system')
    .addTag('Staff', 'Faculty & staff management')
    .addTag('Attendance', 'Attendance tracking & reports')
    .addTag('Results', 'Examination results & transcripts')
    .addTag('Fees', 'Fee structure & payment management')
    .addTag('Dashboard', 'Role-based dashboard analytics')
    .addTag('Notifications', 'In-app notifications')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/v1/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  // Global prefix
  app.setGlobalPrefix('api/v1', {
    exclude: ['health', ''],
  });

  const port = configService.get<number>('PORT', 4000);
  await app.listen(port);
  logger.log(`🚀 ERP Platform API running on http://localhost:${port}`);
  logger.log(`📚 API Docs: http://localhost:${port}/api/v1/docs`);
}

bootstrap();

