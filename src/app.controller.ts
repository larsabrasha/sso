import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Render,
  Req,
  Res,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppService } from './app.service';
import { getAbsoluteFilePath, readFileAsString } from './file.utils';

@Controller()
export class AppController {
  settings: {
    serviceName: string;
    ssoUrl: string;
    validOrigins: string[];
    validCallbackUrls: string[];
    validAuds: string[];
    sessionLength: number;
    tokenExpiresIn: number;
    secret: string;
  };

  constructor(
    private readonly appService: AppService,
    private readonly jwtService: JwtService
  ) {
    const settingsAsString = readFileAsString(
      getAbsoluteFilePath('./settings.json')
    );
    this.settings = JSON.parse(settingsAsString);
  }

  @Get('iframe')
  @Render('iframe')
  iframe() {
    return {
      serviceName: this.settings.serviceName,
      validOrigins: this.settings.validOrigins,
    };
  }

  @Get()
  @Render('index')
  root(@Query() query) {
    if (this.settings.validCallbackUrls.includes(query.callbackUrl) === false) {
      return {
        message: 'Not a valid callbackUrl',
      };
    }

    return query.error && query.error === 'wrongUsernameOrPassword'
      ? {
          serviceName: this.settings.serviceName,
          message: 'Wrong username or password',
          username: query.username ? query.username : '',
          passwordAutofocus: 'autofocus',
          callbackUrl: query.callbackUrl,
        }
      : {
          serviceName: this.settings.serviceName,
          usernameAutofocus: 'autofocus',
          callbackUrl: query.callbackUrl,
        };
  }

  @Post('login')
  async login(
    @Body('username') username,
    @Body('password') password,
    @Body('callbackUrl') callbackUrl,
    @Req() req,
    @Res() res
  ) {
    if (this.settings.validCallbackUrls.includes(callbackUrl) === false) {
      return res.status(400).send('callback url not allowed');
    }

    const authenticated = await this.appService.signIn(username, password);

    if (authenticated) {
      const ip =
        req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        (req.connection.socket ? req.connection.socket.remoteAddress : null);

      const sessionId = this.appService.createSession(username, req.ip);
      const maxAge = this.settings.sessionLength * 1000;

      res.cookie('session_id', sessionId, {
        maxAge,
        // secure: true,
        httpOnly: true,
      });
      res.redirect(callbackUrl);
    } else {
      res.redirect(
        `/?error=wrongUsernameOrPassword&username=${username}&callbackUrl=${encodeURIComponent(
          callbackUrl
        )}`
      );
    }
  }

  @Get('token')
  getToken(@Req() req, @Res() res, @Query() query) {
    const sessionId = req.cookies.session_id;

    if (
      sessionId == null ||
      this.settings.validAuds.includes(query.aud) === false ||
      this.settings.validOrigins.includes(query.origin) === false
    ) {
      res.sendStatus(401);
      return;
    }

    const sessions = this.appService.getSessions();
    const session = sessions[sessionId];

    if (session == null) {
      res.sendStatus(401);
      return;
    }

    const payload = {
      iss: this.settings.ssoUrl,
      aud: query.aud,
      sub: session.username,
    };
    const token = this.jwtService.sign(payload);
    res.send(token);
  }

  @Get('logout')
  logout(@Req() req, @Res() res) {
    const sessionId = req.cookies.session_id;

    if (sessionId) {
      this.appService.deleteSession(sessionId);
    }

    res.cookie('session_id', sessionId, {
      maxAge: 0,
      // secure: true,
      httpOnly: true,
    });

    res.end();
  }
}
