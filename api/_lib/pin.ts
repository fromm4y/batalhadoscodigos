import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

/** PIN guardado só como hash (SPEC 5.3): scrypt com sal aleatório. Formato: scrypt$<sal>$<hash>. */
const KEY_LEN = 32;

function scryptAsync(pin: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(pin, salt, KEY_LEN, (err, key) => (err ? reject(err) : resolve(key))),
  );
}

export async function hashPin(pin: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptAsync(pin, salt);
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPin(pin: string, stored: string): Promise<boolean> {
  const [algo, saltB64, keyB64] = stored.split('$');
  if (algo !== 'scrypt' || !saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, 'base64');
  const key = await scryptAsync(pin, Buffer.from(saltB64, 'base64'));
  return key.length === expected.length && timingSafeEqual(key, expected);
}
