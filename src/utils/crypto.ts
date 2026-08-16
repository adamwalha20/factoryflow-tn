import SHA256 from 'crypto-js/sha256';

export async function hashPassword(password: string): Promise<string> {
  // Using crypto-js to ensure hashing works on non-secure origins (HTTP)
  // where crypto.subtle is undefined.
  return SHA256(password).toString();
}
