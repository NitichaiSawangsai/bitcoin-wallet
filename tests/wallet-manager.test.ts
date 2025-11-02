import { WalletManager } from '../src/wallet/wallet-manager';
import { CurrencyService } from '../src/services/currency.service';
import * as fs from 'fs';
import * as path from 'path';

describe('WalletManager', () => {
  const testPassword = 'test_password_123';
  
  let walletManager: WalletManager;

  beforeEach(async () => {
    // Clean up any existing wallet directories
    const defaultWalletDir = path.join(process.cwd(), '.bitcoin-wallet');
    if (fs.existsSync(defaultWalletDir)) {
      fs.rmSync(defaultWalletDir, { recursive: true, force: true });
    }
    
    walletManager = new WalletManager();
    await walletManager.initialize(testPassword);
  });

  afterEach(() => {
    // Clean up
    const defaultWalletDir = path.join(process.cwd(), '.bitcoin-wallet');
    if (fs.existsSync(defaultWalletDir)) {
      fs.rmSync(defaultWalletDir, { recursive: true, force: true });
    }
  });

  describe('initialization', () => {
    test('should initialize with password', async () => {
      const newManager = new WalletManager();
      await expect(newManager.initialize(testPassword)).resolves.not.toThrow();
    });

    test('should initialize empty when no existing wallets', async () => {
      const wallets = walletManager.getWallets();
      expect(wallets).toHaveLength(0);
    });
  });

  describe('wallet creation', () => {
    test('should create new wallet', async () => {
      const walletName = 'Test Wallet';
      const result = await walletManager.createWallet(walletName);
      
      expect(result).toHaveProperty('walletId');
      expect(result).toHaveProperty('mnemonic');
    });

    test('should create wallet with custom mnemonic', async () => {
      const walletName = 'Custom Wallet';
      const customMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      
      const result = await walletManager.createWallet(walletName, customMnemonic);
      
      expect(result).toHaveProperty('walletId');
      expect(result.mnemonic).toBe(customMnemonic);
    });
  });

  describe('wallet operations', () => {
    test('should get all wallets', async () => {
      await walletManager.createWallet('Test Wallet');
      
      const wallets = walletManager.getWallets();
      expect(wallets).toHaveLength(1);
    });

    test('should generate new addresses', async () => {
      const wallet = await walletManager.createWallet('Address Test');
      const walletId = wallet.walletId;
      const btc = CurrencyService.getCurrency('BTC')!;
      
      const address1 = await walletManager.generateNewAddress(walletId, btc);
      const address2 = await walletManager.generateNewAddress(walletId, btc);
      
      expect(address1.address).toBeDefined();
      expect(address2.address).toBeDefined();
      expect(address1.address).not.toBe(address2.address);
    });

    test('should get balance for currency', async () => {
      const wallet = await walletManager.createWallet('Balance Test');
      const walletId = wallet.walletId;
      const btc = CurrencyService.getCurrency('BTC')!;
      
      const balance = walletManager.getBalance(walletId, btc);
      
      expect(balance).toHaveProperty('confirmed', 0);
      expect(balance).toHaveProperty('unconfirmed', 0);
      expect(balance).toHaveProperty('total', 0);
    });
  });

  describe('backup operations', () => {
    test('should create backup', async () => {
      await walletManager.createWallet('Backup Test');
      
      const backupPath = await walletManager.createBackup();
      
      expect(backupPath).toBeDefined();
      expect(fs.existsSync(backupPath)).toBe(true);
    });
  });

  describe('error handling', () => {
    test('should handle invalid wallet operations gracefully', async () => {
      const btc = CurrencyService.getCurrency('BTC')!;
      
      await expect(async () => {
        await walletManager.generateNewAddress('invalid-id', btc);
      }).rejects.toThrow();
    });
  });
});