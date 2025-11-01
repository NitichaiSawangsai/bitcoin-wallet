import * as crypto from 'crypto';

export class EncryptionService {
  private static readonly KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 16;

  /**
   * สร้าง password hash ที่ปลอดภัย
   */
  static generatePasswordHash(password: string, salt?: string): { hash: string; salt: string } {
    const saltBytes = salt ? Buffer.from(salt, 'hex') : crypto.randomBytes(32);
    const hash = crypto.pbkdf2Sync(password, saltBytes, 100000, 64, 'sha512');
    
    return {
      hash: hash.toString('hex'),
      salt: saltBytes.toString('hex')
    };
  }

  /**
   * เข้ารหัสข้อมูลด้วย AES-256-CBC
   */
  static encrypt(data: string, password: string): string {
    try {
      const salt = crypto.randomBytes(32);
      const key = crypto.pbkdf2Sync(password, salt, 100000, this.KEY_LENGTH, 'sha512');
      const iv = crypto.randomBytes(this.IV_LENGTH);
      
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // รวม salt, iv และ encrypted data
      const result = {
        salt: salt.toString('hex'),
        iv: iv.toString('hex'),
        data: encrypted
      };
      
      return Buffer.from(JSON.stringify(result)).toString('base64');
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * ถอดรหัสข้อมูล
   */
  static decrypt(encryptedData: string, password: string): string {
    try {
      const parsed = JSON.parse(Buffer.from(encryptedData, 'base64').toString('utf8'));
      
      const salt = Buffer.from(parsed.salt, 'hex');
      const iv = Buffer.from(parsed.iv, 'hex');
      const encrypted = parsed.data;
      
      const key = crypto.pbkdf2Sync(password, salt, 100000, this.KEY_LENGTH, 'sha512');
      
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Invalid password or corrupted data'}`);
    }
  }

  /**
   * สร้าง checksum สำหรับตรวจสอบความถูกต้องของข้อมูล
   */
  static generateChecksum(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * ตรวจสอบ checksum
   */
  static verifyChecksum(data: string, checksum: string): boolean {
    return this.generateChecksum(data) === checksum;
  }

  /**
   * สร้าง secure random bytes
   */
  static generateSecureRandom(length: number): Buffer {
    return crypto.randomBytes(length);
  }

  /**
   * สร้าง entropy สำหรับ mnemonic
   */
  static generateEntropy(strength: number = 256): Buffer {
    if (strength % 32 !== 0) {
      throw new Error('Entropy strength must be a multiple of 32');
    }
    return this.generateSecureRandom(strength / 8);
  }
}