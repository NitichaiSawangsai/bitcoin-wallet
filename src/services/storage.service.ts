import * as fs from 'fs';
import * as path from 'path';
import { WalletData, BackupData } from '../types';
import { EncryptionService } from './encryption.service';

export class StorageService {
  private static readonly WALLET_DIR = path.join(process.cwd(), '.bitcoin-wallet');
  private static readonly WALLETS_FILE = path.join(this.WALLET_DIR, 'wallets.encrypted');
  private static readonly BACKUP_DIR = path.join(this.WALLET_DIR, 'backups');

  /**
   * สร้างโฟลเดอร์เก็บข้อมูล wallet
   */
  static initializeStorage(): void {
    try {
      if (!fs.existsSync(this.WALLET_DIR)) {
        fs.mkdirSync(this.WALLET_DIR, { recursive: true, mode: 0o700 });
      }
      
      if (!fs.existsSync(this.BACKUP_DIR)) {
        fs.mkdirSync(this.BACKUP_DIR, { recursive: true, mode: 0o700 });
      }

      // ตั้งค่า permission ให้ปลอดภัย (owner only)
      fs.chmodSync(this.WALLET_DIR, 0o700);
      fs.chmodSync(this.BACKUP_DIR, 0o700);
      
      console.log('Storage initialized successfully');
    } catch (error) {
      throw new Error(`Failed to initialize storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * บันทึก wallet ลงไฟล์
   */
  static async saveWallets(wallets: WalletData[], password: string): Promise<void> {
    try {
      this.initializeStorage();
      
      const data = JSON.stringify(wallets, null, 2);
      const encryptedData = EncryptionService.encrypt(data, password);
      
      // เขียนไฟล์แบบ atomic เพื่อป้องกันข้อมูลเสียหาย
      const tempFile = this.WALLETS_FILE + '.tmp';
      fs.writeFileSync(tempFile, encryptedData, { mode: 0o600 });
      
      // ย้ายไฟล์ temp ไปแทนที่ไฟล์จริง
      fs.renameSync(tempFile, this.WALLETS_FILE);
      
      console.log('Wallets saved successfully');
    } catch (error) {
      throw new Error(`Failed to save wallets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * โหลด wallet จากไฟล์
   */
  static async loadWallets(password: string): Promise<WalletData[]> {
    try {
      if (!fs.existsSync(this.WALLETS_FILE)) {
        return [];
      }

      const encryptedData = fs.readFileSync(this.WALLETS_FILE, 'utf8');
      const decryptedData = EncryptionService.decrypt(encryptedData, password);
      
      return JSON.parse(decryptedData) as WalletData[];
    } catch (error) {
      if (error instanceof Error && error.message.includes('Decryption failed')) {
        throw new Error('Invalid password');
      }
      throw new Error(`Failed to load wallets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * สร้างสำรองข้อมูล
   */
  static async createBackup(wallets: WalletData[], password: string): Promise<string> {
    try {
      this.initializeStorage();
      
      const timestamp = new Date();
      const backupData: BackupData = {
        wallets,
        version: '1.0.0',
        timestamp,
        checksum: EncryptionService.generateChecksum(JSON.stringify(wallets))
      };
      
      const data = JSON.stringify(backupData, null, 2);
      const encryptedData = EncryptionService.encrypt(data, password);
      
      const backupFileName = `wallet-backup-${timestamp.toISOString().replace(/[:.]/g, '-')}.bak`;
      const backupPath = path.join(this.BACKUP_DIR, backupFileName);
      
      fs.writeFileSync(backupPath, encryptedData, { mode: 0o600 });
      
      console.log(`Backup created: ${backupFileName}`);
      return backupPath;
    } catch (error) {
      throw new Error(`Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * กู้คืนข้อมูลจากสำรอง
   */
  static async restoreFromBackup(backupPath: string, password: string): Promise<WalletData[]> {
    try {
      if (!fs.existsSync(backupPath)) {
        throw new Error('Backup file not found');
      }

      const encryptedData = fs.readFileSync(backupPath, 'utf8');
      const decryptedData = EncryptionService.decrypt(encryptedData, password);
      const backupData = JSON.parse(decryptedData) as BackupData;
      
      // ตรวจสอบ checksum
      if (!EncryptionService.verifyChecksum(JSON.stringify(backupData.wallets), backupData.checksum)) {
        throw new Error('Backup data is corrupted');
      }
      
      console.log(`Restored ${backupData.wallets.length} wallets from backup`);
      return backupData.wallets;
    } catch (error) {
      throw new Error(`Failed to restore backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * ลบไฟล์ wallet (ใช้ระวัง!)
   */
  static deleteWalletData(): void {
    try {
      if (fs.existsSync(this.WALLETS_FILE)) {
        fs.unlinkSync(this.WALLETS_FILE);
        console.log('Wallet data deleted');
      }
    } catch (error) {
      throw new Error(`Failed to delete wallet data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * ตรวจสอบว่ามี wallet อยู่หรือไม่
   */
  static hasWalletData(): boolean {
    return fs.existsSync(this.WALLETS_FILE);
  }

  /**
   * รายการไฟล์สำรอง
   */
  static listBackups(): string[] {
    try {
      if (!fs.existsSync(this.BACKUP_DIR)) {
        return [];
      }
      
      return fs.readdirSync(this.BACKUP_DIR)
        .filter(file => file.endsWith('.bak'))
        .sort()
        .reverse(); // ใหม่สุดก่อน
    } catch (error) {
      console.error('Failed to list backups:', error);
      return [];
    }
  }

  /**
   * ขนาดไฟล์ wallet
   */
  static getWalletFileSize(): number {
    try {
      if (!fs.existsSync(this.WALLETS_FILE)) {
        return 0;
      }
      
      const stats = fs.statSync(this.WALLETS_FILE);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }
}