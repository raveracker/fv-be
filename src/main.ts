import * as fs from 'fs';
import { join } from 'path';
import * as YAML from 'yamljs';
import * as swaggerUi from 'swagger-ui-express';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { LoggingInterceptor } from './utils/logging.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.useGlobalInterceptors(new LoggingInterceptor());

  app.enableCors({
    origin: configService.get('CORS_ORIGIN') ?? '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  if (configService.get('ENVIRONMENT') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Fraudvisor API')
      .setDescription('All the API endpoints for Fraudvisor')
      .setVersion('0.1')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);
    const yamlDocument = YAML.stringify(document, 10);
    fs.writeFileSync(join(process.cwd(), '../../api-spec.yaml'), yamlDocument);
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(document));
  }

  await app.listen(process.env.SERVER_PORT ?? 3000);
}
void bootstrap();
