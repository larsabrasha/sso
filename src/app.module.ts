import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { getAbsoluteFilePath, readFileAsString } from './file.utils';

const ssoSettings = JSON.parse(
  readFileAsString(getAbsoluteFilePath('./settings.json'))
);

@Module({
  imports: [
    JwtModule.register({
      secretOrPrivateKey: ssoSettings.secret,
      signOptions: {
        expiresIn: ssoSettings.tokenExpiresIn,
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
