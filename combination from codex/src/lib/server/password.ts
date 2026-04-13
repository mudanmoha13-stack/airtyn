import crypto from 'node:crypto';

const KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, KEYLEN).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, expectedHex] = storedHash.split(':');
  if (!salt || !expectedHex) return false;

  const derived = crypto.scryptSync(password, salt, KEYLEN).toString('hex');
  const expectedBuffer = Buffer.from(expectedHex, 'hex');
  const derivedBuffer = Buffer.from(derived, 'hex');
  if (expectedBuffer.length !== derivedBuffer.length) return false;

  return crypto.timingSafeEqual(expectedBuffer, derivedBuffer);
}
