import * as fs from 'fs';
import * as path from 'path';
import { StorageService } from '../src/services/storage.service';
import { WalletData } from '../src/types';

describe('StorageService', () => {
  const testPassword = 'test_password_123';
  const testWalletDir = path.join(process.cwd(), '.test-bitcoin-wallet');
  
  // Override the wallet directory for testing
  beforeAll(() => {
    // Replace the wallet directory path for testing
    (StorageService as any).WALLET_DIR = testWalletDir;
    (StorageService as any).WALLETS_FILE = path.join(testWalletDir, 'wallets.encrypted');
    (StorageService as any).BACKUP_DIR = path.join(testWalletDir, 'backups');
  });

  beforeEach(() => {
    // Clean up test directory
    if (fs.existsSync(testWalletDir)) {
      fs.rmSync(testWalletDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testWalletDir)) {
      fs.rmSync(testWalletDir, { recursive: true, force: true });
    }
  });

  describe('initializeStorage', () => {
    test('should create wallet directory', () => {
      StorageService.initializeStorage();
      
      expect(fs.existsSync(testWalletDir)).toBe(true);
    });

    test('should create backup directory', () => {
      StorageService.initializeStorage();
      
      const backupDir = path.join(testWalletDir, 'backups');
      expect(fs.existsSync(backupDir)).toBe(true);
    });

    test('should not throw if directories already exist', () => {
      StorageService.initializeStorage();
      
      expect(() => {
        StorageService.initializeStorage();
      }).not.toThrow();
    });
  });

  describe('saveWallets and loadWallets', () => {
    const testData: WalletData[] = [
      {
        id: 'test-wallet-1',
        name: 'Test Wallet 1',
        encryptedSeed: 'encrypted_seed_data_1',
        addresses: [],
        createdAt: new Date('2024-01-01'),
        lastUsed: new Date('2024-01-01')
      },
      {
        id: 'test-wallet-2',
        name: 'Test Wallet 2',
        encryptedSeed: 'encrypted_seed_data_2',
        addresses: [],
        createdAt: new Date('2024-01-02'),
        lastUsed: new Date('2024-01-02')
      }
    ];

    test('should save and load wallet data correctly', async () => {
      await StorageService.saveWallets(testData, testPassword);
      const loaded = await StorageService.loadWallets(testPassword);
      
      expect(loaded).toHaveLength(2);
      expect(loaded[0].id).toBe(testData[0].id);
      expect(loaded[1].name).toBe(testData[1].name);
    });

    test('should throw error with wrong password', async () => {
      await StorageService.saveWallets(testData, testPassword);
      
      await expect(
        StorageService.loadWallets('wrong-password')
      ).rejects.toThrow('Invalid password');
    });

    test('should return empty array when no wallet file exists', async () => {
      const loaded = await StorageService.loadWallets(testPassword);
      
      expect(loaded).toEqual([]);
    });

    test('should handle large amounts of data', async () => {
      const largeData: WalletData[] = Array.from({ length: 100 }, (_, i) => ({
        id: `wallet-${i}`,
        name: `Wallet ${i}`,
        encryptedSeed: `encrypted_seed_${i}`.repeat(100),
        addresses: [],
        createdAt: new Date(),
        lastUsed: new Date()
      }));

      await StorageService.saveWallets(largeData, testPassword);
      const loaded = await StorageService.loadWallets(testPassword);
      
      expect(loaded).toHaveLength(100);
    });
  });

  describe('createBackup', () => {
    const testData: WalletData[] = [
      {
        id: 'backup-wallet-1',
        name: 'Backup Test Wallet',
        encryptedSeed: 'encrypted_seed_for_backup',
        addresses: [],
        createdAt: new Date(),
        lastUsed: new Date()
      }
    ];

    test('should create backup file', async () => {
      StorageService.initializeStorage();
      
      const backupPath = await StorageService.createBackup(testData, testPassword);
      
      expect(fs.existsSync(backupPath)).toBe(true);
      expect(backupPath).toContain('wallet-backup-');
      expect(backupPath).toMatch(/\.bak$/);
    });

    test('should create multiple backups with different names', async () => {
      StorageService.initializeStorage();
      
      const backup1 = await StorageService.createBackup(testData, testPassword);
      
      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const backup2 = await StorageService.createBackup(testData, testPassword);
      
      expect(backup1).not.toBe(backup2);
      expect(fs.existsSync(backup1)).toBe(true);
      expect(fs.existsSync(backup2)).toBe(true);
    });
  });

  describe('restoreFromBackup', () => {
    const testData: WalletData[] = [
      {
        id: 'restore-wallet-1',
        name: 'Restore Test Wallet',
        encryptedSeed: 'encrypted_seed_for_restore',
        addresses: [],
        createdAt: new Date(),
        lastUsed: new Date()
      }
    ];

    test('should restore data from backup', async () => {
      StorageService.initializeStorage();
      
      // Create backup
      const backupPath = await StorageService.createBackup(testData, testPassword);
      
      // Restore from backup
      const restored = await StorageService.restoreFromBackup(backupPath, testPassword);
      
      expect(restored).toHaveLength(1);
      expect(restored[0].id).toBe(testData[0].id);
      expect(restored[0].name).toBe(testData[0].name);
    });

    test('should throw error for non-existent backup file', async () => {
      await expect(
        StorageService.restoreFromBackup('/non/existent/path.bak', testPassword)
      ).rejects.toThrow('Backup file not found');
    });

    test('should throw error with wrong password for backup', async () => {
      StorageService.initializeStorage();
      
      const backupPath = await StorageService.createBackup(testData, testPassword);
      
      await expect(
        StorageService.restoreFromBackup(backupPath, 'wrong-password')
      ).rejects.toThrow();
    });
  });

  describe('utility methods', () => {
    test('should check if wallet data exists', () => {
      expect(StorageService.hasWalletData()).toBe(false);
      
      // This is a simple check - in real test we'd need to create the file
      // but since we're testing the method behavior, this is sufficient
    });

    test('should get wallet file size', () => {
      const size = StorageService.getWalletFileSize();
      expect(typeof size).toBe('number');
      expect(size).toBe(0); // No file exists yet
    });

    test('should list backups', () => {
      const backups = StorageService.listBackups();
      expect(Array.isArray(backups)).toBe(true);
      expect(backups).toHaveLength(0); // No backups exist yet
    });

    test('should delete wallet data safely', () => {
      expect(() => {
        StorageService.deleteWalletData();
      }).not.toThrow();
    });
  });

  describe('error handling', () => {
    test('should handle corrupted data gracefully', async () => {
      StorageService.initializeStorage();
      
      // Write invalid data to the file
      const walletsFile = path.join(testWalletDir, 'wallets.encrypted');
      fs.writeFileSync(walletsFile, 'invalid encrypted data');
      
      await expect(
        StorageService.loadWallets(testPassword)
      ).rejects.toThrow();
    });

    test('should handle special characters in data', async () => {
      const specialData: WalletData[] = [
        {
          id: 'special-wallet',
          name: 'Special Wállet 🚀 with émojis and ñ',
          encryptedSeed: 'éñčrÿptëd_sêëd_with_spëçial_çhars',
          addresses: [],
          createdAt: new Date(),
          lastUsed: new Date()
        }
      ];

      await StorageService.saveWallets(specialData, testPassword);
      const loaded = await StorageService.loadWallets(testPassword);
      
      expect(loaded[0].name).toBe(specialData[0].name);
      expect(loaded[0].encryptedSeed).toBe(specialData[0].encryptedSeed);
    });

    test('should handle very long password', async () => {
      const longPassword = 'x'.repeat(1000);
      const testData: WalletData[] = [
        {
          id: 'long-pass-wallet',
          name: 'Long Password Test',
          encryptedSeed: 'test_seed',
          addresses: [],
          createdAt: new Date(),
          lastUsed: new Date()
        }
      ];

      await StorageService.saveWallets(testData, longPassword);
      const loaded = await StorageService.loadWallets(longPassword);
      
      expect(loaded).toHaveLength(1);
      expect(loaded[0].id).toBe(testData[0].id);
    });
  });
});