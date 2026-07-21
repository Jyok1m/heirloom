import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto';

// scrypt from node:crypto — no native or third-party dependency
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return (
    candidate.length === expected.length &&
    timingSafeEqual(candidate, expected)
  );
}
