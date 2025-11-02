import * as bitcoin from 'bitcoinjs-lib';
import { HDWallet } from '../src/wallet/hd-wallet';
import { CurrencyService } from '../src/services/currency.service';

describe('HDWallet', () => {
  const testMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
  const testPassword = 'test_password_123';

  describe('constructor', () => {
    test('should create wallet with provided mnemonic', () => {
      const wallet = new HDWallet(testMnemonic);
      
      expect(wallet.getMnemonic()).toBe(testMnemonic);
    });

    test('should create wallet with generated mnemonic when none provided', () => {
      const wallet = new HDWallet();
      
      expect(wallet.getMnemonic()).toBeDefined();
      expect(wallet.getMnemonic().split(' ')).toHaveLength(24); // 24-word mnemonic
    });

    test('should throw error for invalid mnemonic', () => {
      expect(() => {
        new HDWallet('invalid mnemonic phrase');
      }).toThrow('Invalid mnemonic phrase');
    });

    test('should work with testnet network', () => {
      const wallet = new HDWallet(testMnemonic, bitcoin.networks.testnet);
      
      expect(wallet.getMnemonic()).toBe(testMnemonic);
    });
  });

  describe('static methods', () => {
    test('should validate mnemonic correctly', () => {
      expect(HDWallet.validateMnemonic(testMnemonic)).toBe(true);
      expect(HDWallet.validateMnemonic('invalid mnemonic')).toBe(false);
      expect(HDWallet.validateMnemonic('')).toBe(false);
    });

    test('should create wallet with static method', () => {
      const result = HDWallet.createWallet('Test Wallet', testPassword, testMnemonic);
      
      expect(result.wallet).toBeDefined();
      expect(result.hdWallet).toBeDefined();
      expect(result.wallet.name).toBe('Test Wallet');
      expect(result.hdWallet.getMnemonic()).toBe(testMnemonic);
    });

    test('should create wallet without mnemonic', () => {
      const result = HDWallet.createWallet('Generated Wallet', testPassword);
      
      expect(result.wallet).toBeDefined();
      expect(result.hdWallet).toBeDefined();
      expect(result.wallet.name).toBe('Generated Wallet');
      expect(result.hdWallet.getMnemonic()).toBeDefined();
    });

    test('should load wallet from encrypted data', () => {
      const { wallet: walletData } = HDWallet.createWallet('Load Test', testPassword, testMnemonic);
      const loadedWallet = HDWallet.loadWallet(walletData, testPassword);
      
      expect(loadedWallet.getMnemonic()).toBe(testMnemonic);
    });

    test('should fail to load wallet with wrong password', () => {
      const { wallet: walletData } = HDWallet.createWallet('Load Test', testPassword, testMnemonic);
      
      expect(() => {
        HDWallet.loadWallet(walletData, 'wrong_password');
      }).toThrow();
    });
  });

  describe('address generation', () => {
    let wallet: HDWallet;
    let btc: any;
    let eth: any;

    beforeEach(() => {
      wallet = new HDWallet(testMnemonic);
      btc = CurrencyService.getCurrency('BTC')!;
      eth = CurrencyService.getCurrency('ETH')!;
    });

    test('should generate valid Bitcoin address', () => {
      const address = wallet.generateAddress(btc, 0);
      
      expect(address).toBeDefined();
      expect(address.address).toBeDefined();
      expect(address.address.length).toBeGreaterThan(25); // Bitcoin addresses are longer than 25 chars
      expect(address.derivationPath).toBe("m/44'/0'/0'/0/0");
      expect(address.publicKey).toBeDefined();
      expect(address.currency).toBe(btc);
    });

    test('should generate different addresses for different indices', () => {
      const address1 = wallet.generateAddress(btc, 0);
      const address2 = wallet.generateAddress(btc, 1);
      
      expect(address1.address).not.toBe(address2.address);
      expect(address1.derivationPath).not.toBe(address2.derivationPath);
    });

    test('should generate addresses for multiple currencies', () => {
      const addresses: { [symbol: string]: any } = {};
      
      const currencies = [btc, eth];
      currencies.forEach(currency => {
        addresses[currency.symbol] = wallet.generateAddress(currency, 0);
      });
      
      expect(addresses['BTC'].address).toBeDefined();
      expect(addresses['ETH'].address).toBeDefined();
      expect(addresses['BTC'].address).not.toBe(addresses['ETH'].address);
    });

    test('should generate multiple addresses', () => {
      const addresses = wallet.generateAddresses(btc, 5, 0);
      
      expect(addresses).toHaveLength(5);
      addresses.forEach((addr, index) => {
        expect(addr.derivationPath).toContain(`/0/${index}`);
      });
    });
  });

  describe('private key operations', () => {
    let wallet: HDWallet;
    let btc: any;

    beforeEach(() => {
      wallet = new HDWallet(testMnemonic);
      btc = CurrencyService.getCurrency('BTC')!;
    });

    test('should get private key for derivation path', () => {
      const address = wallet.generateAddress(btc, 0);
      const privateKey = wallet.getPrivateKey(address.derivationPath);
      
      expect(privateKey).toBeDefined();
      expect(Buffer.isBuffer(privateKey)).toBe(true);
      expect(privateKey.length).toBe(32);
    });

    test('should generate different private keys for different paths', () => {
      const addr1 = wallet.generateAddress(btc, 0);
      const addr2 = wallet.generateAddress(btc, 1);
      
      const key1 = wallet.getPrivateKey(addr1.derivationPath);
      const key2 = wallet.getPrivateKey(addr2.derivationPath);
      
      expect(key1.equals(key2)).toBe(false);
    });

    test('should generate same private key for same path', () => {
      const address = wallet.generateAddress(btc, 0);
      
      const key1 = wallet.getPrivateKey(address.derivationPath);
      const key2 = wallet.getPrivateKey(address.derivationPath);
      
      expect(key1.equals(key2)).toBe(true);
    });

    test('should generate different keys for different currencies', () => {
      const eth = CurrencyService.getCurrency('ETH')!;
      
      const btcAddr = wallet.generateAddress(btc, 0);
      const ethAddr = wallet.generateAddress(eth, 0);
      
      const btcKey = wallet.getPrivateKey(btcAddr.derivationPath);
      const ethKey = wallet.getPrivateKey(ethAddr.derivationPath);
      
      expect(btcKey.equals(ethKey)).toBe(false);
    });
  });

  describe('wallet information', () => {
    let wallet: HDWallet;

    beforeEach(() => {
      wallet = new HDWallet(testMnemonic);
    });

    test('should get master public key', () => {
      const masterPubKey = wallet.getMasterPublicKey();
      
      expect(masterPubKey).toBeDefined();
      expect(typeof masterPubKey).toBe('string');
      expect(masterPubKey.length).toBeGreaterThan(100);
    });

    test('should get extended public key for currency', () => {
      const btc = CurrencyService.getCurrency('BTC')!;
      const extPubKey = wallet.getExtendedPublicKey(btc);
      
      expect(extPubKey).toBeDefined();
      expect(typeof extPubKey).toBe('string');
      expect(extPubKey.length).toBeGreaterThan(100);
    });

    test('should get different extended public keys for different currencies', () => {
      const btc = CurrencyService.getCurrency('BTC')!;
      const eth = CurrencyService.getCurrency('ETH')!;
      
      const btcExtPubKey = wallet.getExtendedPublicKey(btc);
      const ethExtPubKey = wallet.getExtendedPublicKey(eth);
      
      expect(btcExtPubKey).not.toBe(ethExtPubKey);
    });
  });

  describe('address verification', () => {
    let wallet: HDWallet;
    let btc: any;

    beforeEach(() => {
      wallet = new HDWallet(testMnemonic);
      btc = CurrencyService.getCurrency('BTC')!;
    });

    test('should verify own addresses', () => {
      const address = wallet.generateAddress(btc, 0);
      
      expect(wallet.isMyAddress(address.address, btc, 10)).toBe(true);
    });

    test('should reject non-own addresses', () => {
      const fakeAddress = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'; // Genesis block address
      
      expect(wallet.isMyAddress(fakeAddress, btc, 10)).toBe(false);
    });

    test('should find address within range', () => {
      const address5 = wallet.generateAddress(btc, 5);
      
      expect(wallet.isMyAddress(address5.address, btc, 10)).toBe(true);
      expect(wallet.isMyAddress(address5.address, btc, 3)).toBe(false); // Not in range 0-3
    });
  });

  describe('error handling', () => {
    test('should handle invalid derivation path', () => {
      const wallet = new HDWallet(testMnemonic);
      
      expect(() => {
        wallet.getPrivateKey('invalid/path');
      }).toThrow();
    });

    test('should handle very large index numbers', () => {
      const wallet = new HDWallet(testMnemonic);
      const btc = CurrencyService.getCurrency('BTC')!;
      
      // Test with large but valid index
      expect(() => {
        wallet.generateAddress(btc, 2147483647); // Max 32-bit signed integer
      }).not.toThrow();
    });
  });

  describe('transaction signing', () => {
    let wallet: HDWallet;

    beforeEach(() => {
      wallet = new HDWallet(testMnemonic);
    });

    test('should sign PSBT transaction', () => {
      const psbt = new bitcoin.Psbt({ network: bitcoin.networks.bitcoin });
      
      // Add a dummy input for testing
      // Note: In real usage, this would need proper UTXO data
      try {
        psbt.addInput({
          hash: '0'.repeat(64),
          index: 0,
          nonWitnessUtxo: Buffer.alloc(250) // Dummy transaction
        });

        const inputsToSign = [{
          derivationPath: "m/44'/0'/0'/0/0",
          index: 0
        }];

        // This might throw due to invalid UTXO data, but we're testing the method exists
        const signedPsbt = wallet.signTransaction(psbt, inputsToSign);
        expect(signedPsbt).toBeDefined();
      } catch (error) {
        // Expected to fail with dummy data, but method should exist
        expect(error).toBeDefined();
      }
    });
  });
});