import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { envs } from 'src/config/envs';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule,{
    transport: 'TCP',
    options: {
      port: envs.PORT
    }
  });
  const logger = new Logger('Orders-Main');
  await app.listen();

  logger.log(`Orders Microservice is running on port ${envs.PORT}`);
}
bootstrap();
