import { NestFactory } from '@nestjs/core';
import { join } from 'path';
import { AppModule } from './app.module';
import bodyParser = require('body-parser');
import express = require('express');
import cookieParser = require('cookie-parser');

async function bootstrap() {
  const instance: express.Express = express();
  instance.use(bodyParser.urlencoded({ extended: true }));
  instance.use(cookieParser());

  const app = await NestFactory.create(AppModule, instance);

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  await app.listen(4000);
}
bootstrap();
