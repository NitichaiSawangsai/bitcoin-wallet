import { EncryptionService } from '../src/services/encryption.service';

describe('EncryptionService', () => {
  const testPassword = 'test-password-123';
  const testData = 'Hello World! This is test data for encryption.';

  describe('encrypt and decrypt', () => {
    test('should encrypt and decrypt data successfully', () => {
      const encrypted = EncryptionService.encrypt(testData, testPassword);
      const decrypted = EncryptionService.decrypt(encrypted, testPassword);
      
      expect(decrypted).toBe(testData);
    });

    test('should produce different encrypted results for same data', () => {
      const encrypted1 = EncryptionService.encrypt(testData, testPassword);
      const encrypted2 = EncryptionService.encrypt(testData, testPassword);
      
      expect(encrypted1).not.toBe(encrypted2);
    });

    test('should fail to decrypt with wrong password', () => {
      const encrypted = EncryptionService.encrypt(testData, testPassword);
      
      expect(() => {
        EncryptionService.decrypt(encrypted, 'wrong-password');
      }).toThrow();
    });

    test('should handle empty data', () => {
      const empty = '';
      const encrypted = EncryptionService.encrypt(empty, testPassword);
      const decrypted = EncryptionService.decrypt(encrypted, testPassword);
      
      expect(decrypted).toBe(empty);
    });

    test('should handle special characters and Thai text', () => {
      const specialData = 'ทดสอบ 🚀 Special chars: !@#$%^&*()_+-={}[]|;:,.<>?';
      const encrypted = EncryptionService.encrypt(specialData, testPassword);
      const decrypted = EncryptionService.decrypt(encrypted, testPassword);
      
      expect(decrypted).toBe(specialData);
    });
  });

  describe('generatePasswordHash', () => {
    test('should generate consistent hashes from same password and salt', () => {
      const salt = Buffer.from('test-salt').toString('hex');
      const result1 = EncryptionService.generatePasswordHash(testPassword, salt);
      const result2 = EncryptionService.generatePasswordHash(testPassword, salt);
      
      expect(result1.hash).toBe(result2.hash);
      expect(result1.salt).toBe(result2.salt);
    });

    test('should generate different hashes with different salts', () => {
      const result1 = EncryptionService.generatePasswordHash(testPassword);
      const result2 = EncryptionService.generatePasswordHash(testPassword);
      
      expect(result1.hash).not.toBe(result2.hash);
      expect(result1.salt).not.toBe(result2.salt);
    });

    test('should generate different hashes with different passwords', () => {
      const salt = Buffer.from('same-salt').toString('hex');
      const result1 = EncryptionService.generatePasswordHash('password1', salt);
      const result2 = EncryptionService.generatePasswordHash('password2', salt);
      
      expect(result1.hash).not.toBe(result2.hash);
      expect(result1.salt).toBe(result2.salt);
    });
  });

  describe('generateChecksum', () => {
    test('should produce consistent checksums', () => {
      const checksum1 = EncryptionService.generateChecksum(testData);
      const checksum2 = EncryptionService.generateChecksum(testData);
      
      expect(checksum1).toBe(checksum2);
    });

    test('should produce different checksums for different data', () => {
      const checksum1 = EncryptionService.generateChecksum('data1');
      const checksum2 = EncryptionService.generateChecksum('data2');
      
      expect(checksum1).not.toBe(checksum2);
    });

    test('should produce 64 character hex string', () => {
      const checksum = EncryptionService.generateChecksum(testData);
      
      expect(checksum).toMatch(/^[a-f0-9]{64}$/);
    });

    test('should verify checksum correctly', () => {
      const checksum = EncryptionService.generateChecksum(testData);
      
      expect(EncryptionService.verifyChecksum(testData, checksum)).toBe(true);
      expect(EncryptionService.verifyChecksum('different data', checksum)).toBe(false);
    });
  });

  describe('edge cases', () => {
    test('should handle very long data', () => {
      const longData = 'A'.repeat(10000);
      const encrypted = EncryptionService.encrypt(longData, testPassword);
      const decrypted = EncryptionService.decrypt(encrypted, testPassword);
      
      expect(decrypted).toBe(longData);
    });

    test('should handle complex JSON data', () => {
      const jsonData = JSON.stringify({
        wallet: 'test-wallet',
        addresses: ['addr1', 'addr2'],
        balance: 1000.50,
        metadata: {
          created: new Date().toISOString(),
          version: '1.0.0'
        }
      });
      
      const encrypted = EncryptionService.encrypt(jsonData, testPassword);
      const decrypted = EncryptionService.decrypt(encrypted, testPassword);
      
      expect(decrypted).toBe(jsonData);
      expect(JSON.parse(decrypted)).toEqual(JSON.parse(jsonData));
    });
  });
});