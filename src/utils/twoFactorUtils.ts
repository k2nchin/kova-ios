/** RFC 6238 compatible TOTP utilities for authenticator applications. */

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function secureRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

function encodeBase32(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

function decodeBase32(secret: string): Uint8Array {
  const clean = secret.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const output: number[] = [];
  for (const character of clean) {
    const index = BASE32_ALPHABET.indexOf(character);
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Uint8Array.from(output);
}

// Synchronous SHA-1 is used here only because TOTP verification is synchronous.
function sha1(input: Uint8Array): Uint8Array {
  const bitLength = input.length * 8;
  const paddedLength = Math.ceil((input.length + 9) / 64) * 64;
  const data = new Uint8Array(paddedLength);
  data.set(input);
  data[input.length] = 0x80;
  const view = new DataView(data.buffer);
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000), false);
  view.setUint32(paddedLength - 4, bitLength >>> 0, false);

  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;
  let h4 = 0xc3d2e1f0;
  const words = new Uint32Array(80);

  for (let offset = 0; offset < data.length; offset += 64) {
    for (let i = 0; i < 16; i++) words[i] = view.getUint32(offset + i * 4, false);
    for (let i = 16; i < 80; i++) {
      const word = words[i - 3] ^ words[i - 8] ^ words[i - 14] ^ words[i - 16];
      words[i] = ((word << 1) | (word >>> 31)) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    for (let i = 0; i < 80; i++) {
      let f: number;
      let k: number;
      if (i < 20) {
        f = (b & c) | (~b & d);
        k = 0x5a827999;
      } else if (i < 40) {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      } else if (i < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6;
      }
      const temp = ((((a << 5) | (a >>> 27)) >>> 0) + f + e + k + words[i]) >>> 0;
      e = d;
      d = c;
      c = ((b << 30) | (b >>> 2)) >>> 0;
      b = a;
      a = temp;
    }
    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
  }

  const digest = new Uint8Array(20);
  const digestView = new DataView(digest.buffer);
  [h0, h1, h2, h3, h4].forEach((word, index) => digestView.setUint32(index * 4, word, false));
  return digest;
}

function hmacSha1(key: Uint8Array, message: Uint8Array): Uint8Array {
  const blockSize = 64;
  const normalizedKey = key.length > blockSize ? sha1(key) : key;
  const keyBlock = new Uint8Array(blockSize);
  keyBlock.set(normalizedKey);
  const innerPad = new Uint8Array(blockSize);
  const outerPad = new Uint8Array(blockSize);
  for (let i = 0; i < blockSize; i++) {
    innerPad[i] = keyBlock[i] ^ 0x36;
    outerPad[i] = keyBlock[i] ^ 0x5c;
  }
  const inner = new Uint8Array(blockSize + message.length);
  inner.set(innerPad);
  inner.set(message, blockSize);
  const innerHash = sha1(inner);
  const outer = new Uint8Array(blockSize + innerHash.length);
  outer.set(outerPad);
  outer.set(innerHash, blockSize);
  return sha1(outer);
}

export function generateTwoFactorSecret(): string {
  return encodeBase32(secureRandomBytes(20));
}

export function generateBackupCodes(count = 8): string[] {
  const codes = new Set<string>();
  while (codes.size < count) {
    const raw = encodeBase32(secureRandomBytes(5)).slice(0, 8);
    codes.add(`${raw.slice(0, 4)}-${raw.slice(4)}`);
  }
  return Array.from(codes);
}

export function getTwoFactorCurrentCode(secret: string, offsetWindow = 0): string {
  const counter = Math.floor(Date.now() / 30000) + offsetWindow;
  const message = new Uint8Array(8);
  const view = new DataView(message.buffer);
  view.setUint32(0, Math.floor(counter / 0x100000000), false);
  view.setUint32(4, counter >>> 0, false);
  const digest = hmacSha1(decodeBase32(secret), message);
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    (digest[offset + 1] << 16) |
    (digest[offset + 2] << 8) |
    digest[offset + 3];
  return (binary % 1_000_000).toString().padStart(6, '0');
}

export function getTwoFactorSecondsRemaining(): number {
  return 30 - (Math.floor(Date.now() / 1000) % 30);
}

export function getTwoFactorOtpAuthUri(secret: string, accountName: string): string {
  const issuer = 'Kova';
  const label = `${issuer}:${accountName}`;
  return `otpauth://totp/${encodeURIComponent(label)}?secret=${encodeURIComponent(secret)}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}

export interface VerificationResult {
  success: boolean;
  isBackupCode: boolean;
  remainingBackupCodes: string[];
  message?: string;
}

export function verifyTwoFactorCode(
  secret: string,
  inputCode: string,
  backupCodes: string[] = []
): VerificationResult {
  const cleanInput = inputCode.trim().toUpperCase().replace(/\s+/g, '');
  if (!cleanInput) {
    return { success: false, isBackupCode: false, remainingBackupCodes: backupCodes, message: 'Ingresa un código' };
  }

  const compactInput = cleanInput.replace('-', '');
  const backupIndex = backupCodes.findIndex((code) => code.replace('-', '').toUpperCase() === compactInput);
  if (backupIndex !== -1) {
    const updated = [...backupCodes];
    updated.splice(backupIndex, 1);
    return { success: true, isBackupCode: true, remainingBackupCodes: updated, message: 'Código de respaldo verificado' };
  }

  if (/^\d{6}$/.test(cleanInput)) {
    const valid = [-1, 0, 1].some((windowOffset) => getTwoFactorCurrentCode(secret, windowOffset) === cleanInput);
    if (valid) {
      return { success: true, isBackupCode: false, remainingBackupCodes: backupCodes, message: 'Código verificado' };
    }
  }

  return { success: false, isBackupCode: false, remainingBackupCodes: backupCodes, message: 'Código incorrecto o expirado' };
}
