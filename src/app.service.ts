import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as uuid from 'uuid/v1';
import {
  ensureDirectoryExistence,
  getAbsoluteFilePath,
  readFileAsString,
} from './file.utils';
import { isPasswordCorrect } from './password.utils';
import { Secret } from './secret';
import { Session } from './session';

@Injectable()
export class AppService {
  sessionsFilePath: string;
  secretsFilePath: string;

  secrets: { [username: string]: Secret };
  cachedSessions: { [id: string]: Session };

  constructor() {
    this.sessionsFilePath = getAbsoluteFilePath('./data/sessions.json');
    this.secretsFilePath = getAbsoluteFilePath('./data/secrets.json');

    ensureDirectoryExistence(this.sessionsFilePath);
    ensureDirectoryExistence(this.secretsFilePath);

    this.secrets = JSON.parse(readFileAsString(this.secretsFilePath));
  }

  async signIn(username: string, password: string): Promise<boolean> {
    const secret = this.secrets[username];

    if (secret == null) {
      return Promise.resolve(false);
    }

    return isPasswordCorrect(
      secret.hash,
      secret.salt,
      secret.iterations,
      password
    );
  }

  getSessions(): { [id: string]: Session } {
    if (this.cachedSessions == null) {
      const fileContent = readFileAsString(this.sessionsFilePath);

      if (fileContent != null && fileContent.trim() !== '') {
        this.cachedSessions = JSON.parse(fileContent);
      } else {
        this.cachedSessions = {};
      }
    }

    return this.cachedSessions;
  }

  createSession(username: string, ip: string): string {
    const sessionId = uuid();

    const sessions = this.getSessions();
    sessions[sessionId] = { username, ip, timestamp: '' + new Date() };

    const sessionsAsString = JSON.stringify(sessions, null, '  ');
    fs.writeFileSync(this.sessionsFilePath, sessionsAsString);

    return sessionId;
  }

  getSession(sessionId: string) {
    const sessions = this.getSessions();
    return sessions[sessionId];
  }

  deleteSession(sessionId: string) {
    const sessions = this.getSessions();
    delete sessions[sessionId];
    const sessionsAsString = JSON.stringify(sessions, null, '  ');
    fs.writeFileSync(this.sessionsFilePath, sessionsAsString);
  }
}
