import { hash, verify } from 'argon2';

export async function hashData(data: string): Promise<string> {
  return hash(data);
}

export async function verifyData(hashedData: string, data: string) {
  return verify(hashedData, data);
}
