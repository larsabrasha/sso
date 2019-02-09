import * as fs from 'fs';
import * as path from 'path';

export function readFileAsString(filePath: string) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath).toString() : null;
}

export function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  this.ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

export function getAbsoluteFilePath(sourceFilePath: string) {
  return sourceFilePath.startsWith('.')
    ? path.join(__dirname, '../', sourceFilePath)
    : sourceFilePath;
}
