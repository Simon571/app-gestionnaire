declare module 'meeting-schedules-parser/dist/node/index.cjs' {
  import type { MWBSchedule } from 'meeting-schedules-parser';

  export function loadPub(filePath: string): Promise<MWBSchedule[]>;
}

declare module 'crypto-js' {
  const CryptoJS: {
    AES: {
      encrypt(message: string, secret: string): { toString(): string };
      decrypt(cipherText: string, secret: string): { toString(encoder: any): string };
    };
    PBKDF2(password: string, salt: string, cfg?: Record<string, unknown>): { toString(): string };
    HmacSHA256(message: string, secret: string): { toString(): string };
    enc: {
      Utf8: any;
    };
  };
  export default CryptoJS;
}

declare module 'crypto-js/sha256' {
  const SHA256: (message: string) => { toString(): string };
  export default SHA256;
}

declare module 'crypto-js/hmac-sha256' {
  const HmacSHA256: (message: string, secret: string) => { toString(): string };
  export default HmacSHA256;
}

declare module 'crypto-js/enc-hex' {
  const Hex: any;
  export default Hex;
}
