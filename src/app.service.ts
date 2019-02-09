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
import { User } from './user';

@Injectable()
export class AppService {
  sessionsFilePath: string;
  secretsFilePath: string;
  usersFilePath: string;

  secrets: { [username: string]: Secret };
  users: { [username: string]: User };

  cachedSessions: { [id: string]: Session };

  constructor() {
    this.sessionsFilePath = getAbsoluteFilePath('./data/sessions.json');
    this.secretsFilePath = getAbsoluteFilePath('./data/secrets.json');
    this.usersFilePath = getAbsoluteFilePath('./data/users.json');

    ensureDirectoryExistence(this.sessionsFilePath);
    ensureDirectoryExistence(this.secretsFilePath);
    ensureDirectoryExistence(this.usersFilePath);

    this.secrets = JSON.parse(readFileAsString(this.secretsFilePath));
    this.users = JSON.parse(readFileAsString(this.usersFilePath));
  }

  async login(username: string, password: string): Promise<boolean> {
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

  getUsers(): { [id: string]: User } {
    return this.users;
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
