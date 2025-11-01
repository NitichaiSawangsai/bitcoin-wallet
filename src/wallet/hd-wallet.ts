import * as bip39 from 'bip39';
import { BIP32Factory } from 'bip32';
import * as bitcoin from 'bitcoinjs-lib';
import { WalletData, Address, CryptoCurrency } from '../types';
import { EncryptionService } from '../services/encryption.service';
import { CurrencyService } from '../services/currency.service';

// Import tiny-secp256k1
const ecc = require('tiny-secp256k1');

// Initialize BIP32
const bip32 = BIP32Factory(ecc);

export class HDWallet {
  private mnemonic: string;
  private seed: Buffer;
  private masterKey: any;
  private network: bitcoin.Network;

  constructor(mnemonic?: string, network: bitcoin.Network = bitcoin.networks.bitcoin) {
    this.network = network;
    
    if (mnemonic) {
      if (!bip39.validateMnemonic(mnemonic)) {
        throw new Error('Invalid mnemonic phrase');
      }
      this.mnemonic = mnemonic;
    } else {
      // สร้าง mnemonic ใหม่
      const entropy = EncryptionService.generateEntropy(256); // 24 words
      this.mnemonic = bip39.entropyToMnemonic(entropy);
    }
    
    this.seed = bip39.mnemonicToSeedSync(this.mnemonic);
    this.masterKey = bip32.fromSeed(this.seed, this.network);
  }

  /**
   * ดึง mnemonic phrase
   */
  getMnemonic(): string {
    return this.mnemonic;
  }

  /**
   * สร้าง wallet ใหม่
   */
  static createWallet(
    name: string, 
    password: string, 
    mnemonic?: string,
    network: bitcoin.Network = bitcoin.networks.bitcoin
  ): { wallet: WalletData; hdWallet: HDWallet } {
    try {
      const hdWallet = new HDWallet(mnemonic, network);
      const walletId = this.generateWalletId();
      
      // เข้ารหัส mnemonic
      const encryptedSeed = EncryptionService.encrypt(hdWallet.getMnemonic(), password);
      
      const walletData: WalletData = {
        id: walletId,
        name,
        encryptedSeed,
        addresses: [],
        createdAt: new Date(),
        lastUsed: new Date()
      };

      // สร้าง address เริ่มต้นสำหรับแต่ละสกุลเงิน
      const supportedCurrencies = CurrencyService.getAllCurrencies();
      for (const currency of supportedCurrencies) {
        const address = hdWallet.generateAddress(currency, 0);
        walletData.addresses.push(address);
      }

      return { wallet: walletData, hdWallet };
    } catch (error) {
      throw new Error(`Failed to create wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * โหลด wallet จากข้อมูลที่เข้ารหัส
   */
  static loadWallet(walletData: WalletData, password: string): HDWallet {
    try {
      const mnemonic = EncryptionService.decrypt(walletData.encryptedSeed, password);
      return new HDWallet(mnemonic);
    } catch (error) {
      throw new Error(`Failed to load wallet: ${error instanceof Error ? error.message : 'Invalid password'}`);
    }
  }

  /**
   * สร้าง address ใหม่สำหรับสกุลเงินที่กำหนด
   */
  generateAddress(currency: CryptoCurrency, index: number): Address {
    try {
      const derivationPath = `${currency.derivationPath}/0/${index}`;
      const child = this.masterKey.derivePath(derivationPath);
      
      let address: string;
      let network = this.network;
      
      // เลือก network ตามสกุลเงิน
      if (currency.symbol === 'BTC-TEST') {
        network = bitcoin.networks.testnet;
      }
      
      // สร้าง address ตามประเภทสกุลเงิน
      switch (currency.symbol) {
        case 'BTC':
        case 'BTC-TEST':
          address = bitcoin.payments.p2pkh({ 
            pubkey: child.publicKey, 
            network 
          }).address!;
          break;
        
        default:
          // สำหรับสกุลเงินอื่น ใช้รูปแบบเดียวกับ Bitcoin
          address = bitcoin.payments.p2pkh({ 
            pubkey: child.publicKey, 
            network 
          }).address!;
          break;
      }

      return {
        address,
        derivationPath,
        publicKey: child.publicKey.toString('hex'),
        balance: 0,
        used: false,
        currency
      };
    } catch (error) {
      throw new Error(`Failed to generate address: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * สร้าง private key สำหรับ address
   */
  getPrivateKey(derivationPath: string): Buffer {
    try {
      const child = this.masterKey.derivePath(derivationPath);
      if (!child.privateKey) {
        throw new Error('Cannot derive private key');
      }
      return child.privateKey;
    } catch (error) {
      throw new Error(`Failed to get private key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * ลงนาม transaction (offline signing)
   */
  signTransaction(
    psbt: bitcoin.Psbt, 
    inputs: Array<{ derivationPath: string; index: number }>
  ): bitcoin.Psbt {
    try {
      for (const input of inputs) {
        const child = this.masterKey.derivePath(input.derivationPath);
        if (!child.privateKey) {
          throw new Error(`Cannot derive private key for path: ${input.derivationPath}`);
        }
        
        psbt.signInput(input.index, child);
      }
      
      return psbt;
    } catch (error) {
      throw new Error(`Failed to sign transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * ตรวจสอบ mnemonic
   */
  static validateMnemonic(mnemonic: string): boolean {
    return bip39.validateMnemonic(mnemonic);
  }

  /**
   * สร้าง wallet ID
   */
  private static generateWalletId(): string {
    const timestamp = Date.now().toString();
    const random = EncryptionService.generateSecureRandom(8).toString('hex');
    return `wallet_${timestamp}_${random}`;
  }

  /**
   * ดึงข้อมูล master public key
   */
  getMasterPublicKey(): string {
    return this.masterKey.neutered().toBase58();
  }

  /**
   * ดึงข้อมูล extended public key สำหรับสกุลเงินที่กำหนด
   */
  getExtendedPublicKey(currency: CryptoCurrency): string {
    const accountKey = this.masterKey.derivePath(currency.derivationPath);
    return accountKey.neutered().toBase58();
  }

  /**
   * สร้าง address หลายๆ ตัวพร้อมกัน
   */
  generateAddresses(currency: CryptoCurrency, count: number, startIndex: number = 0): Address[] {
    const addresses: Address[] = [];
    
    for (let i = 0; i < count; i++) {
      const address = this.generateAddress(currency, startIndex + i);
      addresses.push(address);
    }
    
    return addresses;
  }

  /**
   * ตรวจสอบว่า address เป็นของ wallet นี้หรือไม่
   */
  isMyAddress(address: string, currency: CryptoCurrency, maxIndex: number = 100): boolean {
    for (let i = 0; i <= maxIndex; i++) {
      const generatedAddress = this.generateAddress(currency, i);
      if (generatedAddress.address === address) {
        return true;
      }
    }
    return false;
  }
}