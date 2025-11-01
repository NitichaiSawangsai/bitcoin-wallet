import * as crypto from 'crypto';
import * as bitcoin from 'bitcoinjs-lib';

export class ValidationUtils {
  /**
   * ตรวจสอบความถูกต้องของ Bitcoin address
   */
  static isValidBitcoinAddress(address: string, network?: bitcoin.Network): boolean {
    try {
      const net = network || bitcoin.networks.bitcoin;
      bitcoin.address.toOutputScript(address, net);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * ตรวจสอบความแข็งแกร่งของรหัสผ่าน
   */
  static validatePasswordStrength(password: string): { 
    isValid: boolean; 
    score: number; 
    feedback: string[] 
  } {
    const feedback: string[] = [];
    let score = 0;

    // ความยาว
    if (password.length >= 8) score += 1;
    else feedback.push('รหัสผ่านควรมีความยาวอย่างน้อย 8 ตัวอักษร');

    if (password.length >= 12) score += 1;

    // ตัวอักษรพิมพ์เล็ก
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('ควรมีตัวอักษรพิมพ์เล็ก');

    // ตัวอักษรพิมพ์ใหญ่
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('ควรมีตัวอักษรพิมพ์ใหญ่');

    // ตัวเลข
    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('ควรมีตัวเลข');

    // สัญลักษณ์พิเศษ
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    else feedback.push('ควรมีสัญลักษณ์พิเศษ');

    // ไม่มีรูปแบบที่เดาง่าย
    const commonPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /abc123/i,
      /111111/,
      /000000/
    ];

    for (const pattern of commonPatterns) {
      if (pattern.test(password)) {
        score -= 2;
        feedback.push('หลีกเลี่ยงรูปแบบรหัสผ่านที่เดาง่าย');
        break;
      }
    }

    return {
      isValid: score >= 4,
      score: Math.max(0, score),
      feedback
    };
  }

  /**
   * ตรวจสอบ transaction ID
   */
  static isValidTransactionId(txId: string): boolean {
    return /^[a-fA-F0-9]{64}$/.test(txId);
  }

  /**
   * ตรวจสอบ derivation path
   */
  static isValidDerivationPath(path: string): boolean {
    return /^m(\/[0-9]+'?)*$/.test(path);
  }

  /**
   * ตรวจสอบ hex string
   */
  static isValidHex(hex: string): boolean {
    return /^[a-fA-F0-9]+$/.test(hex) && hex.length % 2 === 0;
  }

  /**
   * ทำความสะอาด input
   */
  static sanitizeInput(input: string): string {
    return input.trim().replace(/\s+/g, ' ');
  }

  /**
   * ตรวจสอบจำนวนเงิน
   */
  static isValidAmount(amount: number): boolean {
    return Number.isFinite(amount) && amount > 0;
  }
}

export class FormatUtils {
  /**
   * จัดรูปแบบวันที่
   */
  static formatDate(date: Date, locale: string = 'th-TH'): string {
    return date.toLocaleString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /**
   * จัดรูปแบบขนาดไฟล์
   */
  static formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * ย่อ address
   */
  static shortenAddress(address: string, startLength: number = 8, endLength: number = 8): string {
    if (address.length <= startLength + endLength) {
      return address;
    }
    return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
  }

  /**
   * ย่อ transaction ID
   */
  static shortenTxId(txId: string): string {
    return this.shortenAddress(txId, 8, 8);
  }

  /**
   * จัดรูปแบบเปอร์เซ็นต์
   */
  static formatPercentage(value: number, decimals: number = 2): string {
    return `${(value * 100).toFixed(decimals)}%`;
  }
}

export class NetworkUtils {
  /**
   * ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต (สำหรับอนาคต)
   */
  static async checkInternetConnection(): Promise<boolean> {
    try {
      // ใช้ DNS lookup แทน HTTP request เพื่อความเร็ว
      const { promisify } = require('util');
      const dns = require('dns');
      const lookup = promisify(dns.lookup);
      
      await lookup('google.com');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * สร้าง user agent string
   */
  static getUserAgent(): string {
    const version = require('../../package.json').version;
    return `BitcoinWallet/${version} (Node.js)`;
  }

  /**
   * จำกัดจำนวน request (rate limiting)
   */
  static createRateLimiter(maxRequests: number, timeWindowMs: number) {
    const requests: number[] = [];

    return () => {
      const now = Date.now();
      
      // ลบ request ที่เก่าเกินไป
      while (requests.length > 0 && requests[0] < now - timeWindowMs) {
        requests.shift();
      }

      if (requests.length >= maxRequests) {
        return false; // ถึงขิดจำกัดแล้ว
      }

      requests.push(now);
      return true;
    };
  }
}

export class CryptoUtils {
  /**
   * สร้าง secure random string
   */
  static generateSecureId(length: number = 16): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * สร้าง nonce
   */
  static generateNonce(): string {
    return Date.now().toString() + crypto.randomBytes(8).toString('hex');
  }

  /**
   * Hash ข้อมูลด้วย SHA256
   */
  static sha256(data: string | Buffer): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Hash ข้อมูลด้วย SHA256 สองครั้ง
   */
  static doubleSha256(data: string | Buffer): string {
    const firstHash = crypto.createHash('sha256').update(data).digest();
    return crypto.createHash('sha256').update(firstHash).digest('hex');
  }

  /**
   * คำนวณ checksum
   */
  static calculateChecksum(data: Buffer): Buffer {
    const hash = crypto.createHash('sha256').update(data).digest();
    const secondHash = crypto.createHash('sha256').update(hash).digest();
    return secondHash.slice(0, 4);
  }

  /**
   * เปรียบเทียบ buffer อย่างปลอดภัย
   */
  static safeBufferCompare(a: Buffer, b: Buffer): boolean {
    if (a.length !== b.length) {
      return false;
    }
    return crypto.timingSafeEqual(a, b);
  }
}

export class FileUtils {
  /**
   * ตรวจสอบว่าไฟล์มีอยู่และสามารถอ่านได้
   */
  static async isFileReadable(filePath: string): Promise<boolean> {
    try {
      const fs = require('fs').promises;
      await fs.access(filePath, require('fs').constants.R_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * ตรวจสอบว่าไฟล์สามารถเขียนได้
   */
  static async isFileWritable(filePath: string): Promise<boolean> {
    try {
      const fs = require('fs').promises;
      await fs.access(filePath, require('fs').constants.W_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * สร้างชื่อไฟล์ backup
   */
  static generateBackupFileName(prefix: string = 'backup'): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = crypto.randomBytes(4).toString('hex');
    return `${prefix}-${timestamp}-${random}.bak`;
  }

  /**
   * ตรวจสอบนามสกุลไฟล์
   */
  static hasValidExtension(fileName: string, validExtensions: string[]): boolean {
    const ext = fileName.toLowerCase().split('.').pop();
    return validExtensions.includes(ext || '');
  }
}