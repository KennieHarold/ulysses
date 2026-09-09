import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appConfig, verifyUrl } from './common/config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'warn', 'error', 'debug'] });

  app.enableCors({
    origin: appConfig.webOrigin,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  });

  await app.listen(appConfig.port);

  const logger = new Logger('Bootstrap');
  logger.log(`API listening on http://localhost:${appConfig.port}`);
  logger.log(`CORS origin: ${appConfig.webOrigin}`);
  logger.log(`Action: ${appConfig.actionId}  Signal: ${appConfig.signal}`);
  logger.log(`RP: ${appConfig.rpId}  App: ${appConfig.appId}`);
  logger.log(`Verify URL: ${verifyUrl()}`);
  logger.log(`Portal API key: ${appConfig.apiKey ? 'configured' : 'not set (sending unauthenticated)'}`);
}

void bootstrap();
