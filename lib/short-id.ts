import { randomBytes } from 'crypto';

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const LENGTH = 8;

export function generateInviteCode(): string {
  let code = '';
  const bytes = randomBytes(LENGTH);
  for (let i = 0; i < LENGTH; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
}