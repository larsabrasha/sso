import * as crypto from 'crypto';

const PASSWORD_LENGTH = 256;
const SALT_LENGTH = 64;
const ITERATIONS = 10000;
const DIGEST = 'sha256';
const BYTE_TO_STRING_ENCODING = 'hex'; // this could be base64, for instance

/**
 * The information about the password that is stored in the database
 */
interface PersistedPassword {
  salt: string;
  hash: string;
  iterations: number;
}

export async function generateHashPassword(
  password: string
): Promise<PersistedPassword> {
  return new Promise<PersistedPassword>((accept, reject) => {
    const salt = crypto
      .randomBytes(SALT_LENGTH)
      .toString(BYTE_TO_STRING_ENCODING);
    crypto.pbkdf2(
      password,
      salt,
      ITERATIONS,
      PASSWORD_LENGTH,
      DIGEST,
      (error, hash) => {
        if (error) {
          reject(error);
        } else {
          accept({
            salt,
            hash: hash.toString(BYTE_TO_STRING_ENCODING),
            iterations: ITERATIONS,
          });
        }
      }
    );
  });
}

export async function isPasswordCorrect(
  savedHash: string,
  savedSalt: string,
  savedIterations: number,
  passwordAttempt: string
): Promise<boolean> {
  return new Promise<boolean>((accept, reject) => {
    crypto.pbkdf2(
      passwordAttempt,
      savedSalt,
      savedIterations,
      PASSWORD_LENGTH,
      DIGEST,
      (error, hash) => {
        if (error) {
          reject(error);
        } else {
          accept(savedHash === hash.toString(BYTE_TO_STRING_ENCODING));
        }
      }
    );
  });
}
