import * as bitcoin from 'bitcoinjs-lib';
import { HDWallet } from './hd-wallet';
import { 
  WalletData, 
  UTXO, 
  Address, 
  CryptoCurrency,
  BalanceInfo,
  CoinInfo 
} from '../types';
import { CurrencyService } from '../services/currency.service';
import { StorageService } from '../services/storage.service';
import { EncryptionService } from '../services/encryption.service';

export class WalletManager {
  private wallets: Map<string, WalletData> = new Map();
  private hdWallets: Map<string, HDWallet> = new Map();
  private masterPassword: string = '';

  /**
   * เริ่มต้นใช้งาน Wallet Manager
   */
  async initialize(password: string): Promise<void> {
    try {
      this.masterPassword = password;
      const walletsData = await StorageService.loadWallets(password);
      
      for (const walletData of walletsData) {
        this.wallets.set(walletData.id, walletData);
      }
      
      console.log(`Loaded ${walletsData.length} wallets`);
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid password') {
        throw error;
      }
      // ถ้าไม่มีไฟล์ wallet ให้สร้างใหม่
      console.log('No existing wallets found, starting fresh');
    }
  }

  /**
   * สร้าง wallet ใหม่
   */
  async createWallet(
    name: string, 
    mnemonic?: string,
    network: bitcoin.Network = bitcoin.networks.bitcoin
  ): Promise<{ walletId: string; mnemonic: string }> {
    try {
      if (!this.masterPassword) {
        throw new Error('Wallet manager not initialized');
      }

      const { wallet, hdWallet } = HDWallet.createWallet(
        name, 
        this.masterPassword, 
        mnemonic, 
        network
      );

      this.wallets.set(wallet.id, wallet);
      this.hdWallets.set(wallet.id, hdWallet);

      await this.saveWallets();

      console.log(`Created wallet: ${name} (${wallet.id})`);
      return {
        walletId: wallet.id,
        mnemonic: hdWallet.getMnemonic()
      };
    } catch (error) {
      throw new Error(`Failed to create wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * กู้คืน wallet จาก mnemonic
   */
  async restoreWallet(name: string, mnemonic: string): Promise<string> {
    try {
      if (!HDWallet.validateMnemonic(mnemonic)) {
        throw new Error('Invalid mnemonic phrase');
      }

      const result = await this.createWallet(name, mnemonic);
      console.log(`Restored wallet: ${name}`);
      return result.walletId;
    } catch (error) {
      throw new Error(`Failed to restore wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * โหลด HD wallet
   */
  private async loadHDWallet(walletId: string): Promise<HDWallet> {
    if (this.hdWallets.has(walletId)) {
      return this.hdWallets.get(walletId)!;
    }

    const walletData = this.wallets.get(walletId);
    if (!walletData) {
      throw new Error('Wallet not found');
    }

    const hdWallet = HDWallet.loadWallet(walletData, this.masterPassword);
    this.hdWallets.set(walletId, hdWallet);
    return hdWallet;
  }

  /**
   * ดึง wallet ทั้งหมด
   */
  getWallets(): WalletData[] {
    return Array.from(this.wallets.values());
  }

  /**
   * ดึง wallet ตาม ID
   */
  getWallet(walletId: string): WalletData | undefined {
    return this.wallets.get(walletId);
  }

  /**
   * สร้าง address ใหม่
   */
  async generateNewAddress(walletId: string, currency: CryptoCurrency): Promise<Address> {
    try {
      const walletData = this.wallets.get(walletId);
      if (!walletData) {
        throw new Error('Wallet not found');
      }

      const hdWallet = await this.loadHDWallet(walletId);
      
      // หา index ถัดไปสำหรับสกุลเงินนี้
      const existingAddresses = walletData.addresses.filter(addr => 
        addr.currency.symbol === currency.symbol
      );
      const nextIndex = existingAddresses.length;

      const newAddress = hdWallet.generateAddress(currency, nextIndex);
      
      // เพิ่ม address ใหม่ลงใน wallet
      walletData.addresses.push(newAddress);
      walletData.lastUsed = new Date();

      await this.saveWallets();

      console.log(`Generated new ${currency.symbol} address: ${newAddress.address}`);
      return newAddress;
    } catch (error) {
      throw new Error(`Failed to generate address: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * ดึง addresses ทั้งหมดของ wallet
   */
  getAddresses(walletId: string, currency?: CryptoCurrency): Address[] {
    const walletData = this.wallets.get(walletId);
    if (!walletData) {
      return [];
    }

    if (currency) {
      return walletData.addresses.filter(addr => 
        addr.currency.symbol === currency.symbol
      );
    }

    return walletData.addresses;
  }

  /**
   * ดึงยอดเงินรวม
   */
  getBalance(walletId: string, currency: CryptoCurrency): BalanceInfo {
    const addresses = this.getAddresses(walletId, currency);
    
    const confirmed = addresses.reduce((sum, addr) => sum + addr.balance, 0);
    
    return {
      confirmed,
      unconfirmed: 0, // จะต้องดึงจาก blockchain API
      total: confirmed,
      currency
    };
  }

  /**
   * ดึงข้อมูลเหรียญทั้งหมด
   */
  getCoinInfo(walletId: string): CoinInfo[] {
    const walletData = this.wallets.get(walletId);
    if (!walletData) {
      return [];
    }

    const coinInfoMap = new Map<string, CoinInfo>();

    for (const address of walletData.addresses) {
      const key = address.currency.symbol;
      
      if (!coinInfoMap.has(key)) {
        coinInfoMap.set(key, {
          address: address.address,
          balance: this.getBalance(walletId, address.currency),
          transactions: [], // จะต้องดึงจาก blockchain API
          utxos: [] // จะต้องดึงจาก blockchain API
        });
      }
    }

    return Array.from(coinInfoMap.values());
  }

  /**
   * สร้าง transaction (offline)
   */
  async createTransaction(
    walletId: string,
    currency: CryptoCurrency,
    toAddress: string,
    amount: number,
    feeRate?: number
  ): Promise<{ rawTx: string; txId: string }> {
    try {
      const hdWallet = await this.loadHDWallet(walletId);
      const addresses = this.getAddresses(walletId, currency);
      
      if (addresses.length === 0) {
        throw new Error('No addresses found for this currency');
      }

      // จำลอง UTXO (ในระบบจริงต้องดึงจาก blockchain API)
      const utxos: UTXO[] = [];
      let totalAvailable = 0;
      
      for (const address of addresses) {
        if (address.balance > 0) {
          utxos.push({
            txId: 'sample_tx_id', // ต้องมาจาก API จริง
            outputIndex: 0,
            amount: address.balance,
            address: address.address,
            scriptPubKey: '', // ต้องมาจาก API จริง
            confirmations: 6
          });
          totalAvailable += address.balance;
        }
      }

      const fee = CurrencyService.calculateFee(utxos.length, 2, currency, feeRate);
      const totalNeeded = amount + fee;

      if (totalAvailable < totalNeeded) {
        throw new Error(`Insufficient balance. Available: ${CurrencyService.formatAmount(totalAvailable, currency)}, Needed: ${CurrencyService.formatAmount(totalNeeded, currency)}`);
      }

      // สร้าง PSBT
      const psbt = new bitcoin.Psbt({ network: bitcoin.networks.bitcoin });

      // เพิ่ม inputs
      let inputTotal = 0;
      const inputsToSign: Array<{ derivationPath: string; index: number }> = [];
      
      for (let i = 0; i < utxos.length && inputTotal < totalNeeded; i++) {
        const utxo = utxos[i];
        const address = addresses.find(addr => addr.address === utxo.address);
        
        if (address) {
          psbt.addInput({
            hash: utxo.txId,
            index: utxo.outputIndex,
            nonWitnessUtxo: Buffer.alloc(0) // ต้องมาจาก API จริง
          });

          inputsToSign.push({
            derivationPath: address.derivationPath,
            index: i
          });

          inputTotal += utxo.amount;
        }
      }

      // เพิ่ม outputs
      psbt.addOutput({
        address: toAddress,
        value: amount
      });

      // เพิ่ม change output ถ้าจำเป็น
      const change = inputTotal - amount - fee;
      if (change > 0) {
        const changeAddress = addresses[0].address; // ใช้ address แรกเป็น change
        psbt.addOutput({
          address: changeAddress,
          value: change
        });
      }

      // ลงนาม transaction
      const signedPsbt = hdWallet.signTransaction(psbt, inputsToSign);
      signedPsbt.finalizeAllInputs();

      const rawTx = signedPsbt.extractTransaction().toHex();
      const txId = signedPsbt.extractTransaction().getId();

      console.log(`Created transaction: ${txId}`);
      return { rawTx, txId };
    } catch (error) {
      throw new Error(`Failed to create transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * ลบ wallet
   */
  async deleteWallet(walletId: string): Promise<void> {
    try {
      if (!this.wallets.has(walletId)) {
        throw new Error('Wallet not found');
      }

      this.wallets.delete(walletId);
      this.hdWallets.delete(walletId);

      await this.saveWallets();
      console.log(`Deleted wallet: ${walletId}`);
    } catch (error) {
      throw new Error(`Failed to delete wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * สร้างสำรองข้อมูล
   */
  async createBackup(): Promise<string> {
    try {
      const wallets = Array.from(this.wallets.values());
      return await StorageService.createBackup(wallets, this.masterPassword);
    } catch (error) {
      throw new Error(`Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * กู้คืนจากสำรอง
   */
  async restoreFromBackup(backupPath: string): Promise<void> {
    try {
      const restoredWallets = await StorageService.restoreFromBackup(backupPath, this.masterPassword);
      
      this.wallets.clear();
      this.hdWallets.clear();

      for (const wallet of restoredWallets) {
        this.wallets.set(wallet.id, wallet);
      }

      await this.saveWallets();
      console.log(`Restored ${restoredWallets.length} wallets from backup`);
    } catch (error) {
      throw new Error(`Failed to restore from backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * บันทึก wallets
   */
  private async saveWallets(): Promise<void> {
    const wallets = Array.from(this.wallets.values());
    await StorageService.saveWallets(wallets, this.masterPassword);
  }

  /**
   * เปลี่ยนรหัสผ่าน master
   */
  async changeMasterPassword(oldPassword: string, newPassword: string): Promise<void> {
    try {
      // ตรวจสอบรหัสผ่านเก่า
      await StorageService.loadWallets(oldPassword);
      
      // อัพเดทรหัสผ่านใหม่
      this.masterPassword = newPassword;
      
      // เข้ารหัส wallets ใหม่ด้วยรหัสผ่านใหม่
      const wallets = Array.from(this.wallets.values());
      const updatedWallets: WalletData[] = [];

      for (const wallet of wallets) {
        const hdWallet = HDWallet.loadWallet(wallet, oldPassword);
        const mnemonic = hdWallet.getMnemonic();
        
        const updatedWallet: WalletData = {
          ...wallet,
          encryptedSeed: EncryptionService.encrypt(mnemonic, newPassword)
        };
        
        updatedWallets.push(updatedWallet);
        this.wallets.set(wallet.id, updatedWallet);
      }

      await StorageService.saveWallets(updatedWallets, newPassword);
      console.log('Master password changed successfully');
    } catch (error) {
      throw new Error(`Failed to change master password: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}