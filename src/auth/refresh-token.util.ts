import crypto from 'node:crypto';

export function hashRefreshToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export function refreshTokensMatch(raw: string, stored: string): boolean {
  const hashed = hashRefreshToken(raw);
  if (hashed.length === stored.length) {
    return crypto.timingSafeEqual(Buffer.from(hashed), Buffer.from(stored));
  } else {
    return false;
  }
}
