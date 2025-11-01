import * as readlineSync from 'readline-sync';
import { WalletManager } from '../wallet/wallet-manager';
import { CurrencyService } from '../services/currency.service';
import { StorageService } from '../services/storage.service';
import { CryptoCurrency } from '../types';

export class WalletCLI {
  private walletManager: WalletManager;

  constructor() {
    this.walletManager = new WalletManager();
  }

  /**
   * เริ่มต้นโปรแกรม
   */
  async start(): Promise<void> {
    console.log('=================================');
    console.log('🪙 Bitcoin Wallet - Secure Local Storage');
    console.log('=================================\n');

    try {
      await this.initialize();
      await this.showMainMenu();
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * เริ่มต้นระบบ
   */
  private async initialize(): Promise<void> {
    let password: string;

    if (StorageService.hasWalletData()) {
      console.log('พบข้อมูล wallet ที่มีอยู่แล้ว');
      password = readlineSync.question('กรุณาใส่รหัสผ่าน master: ', { hideEchoBack: true });
    } else {
      console.log('สร้างระบบ wallet ใหม่');
      password = readlineSync.question('สร้างรหัสผ่าน master (ความยาวอย่างน้อย 8 ตัวอักษร): ', { 
        hideEchoBack: true,
        limit: (input) => input.length >= 8,
        limitMessage: 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร'
      });
      
      const confirmPassword = readlineSync.question('ยืนยันรหัสผ่าน: ', { hideEchoBack: true });
      
      if (password !== confirmPassword) {
        throw new Error('รหัสผ่านไม่ตรงกัน');
      }
    }

    await this.walletManager.initialize(password);
    console.log('✅ ระบบพร้อมใช้งาน\n');
  }

  /**
   * เมนูหลัก
   */
  private async showMainMenu(): Promise<void> {
    while (true) {
      console.log('\n📋 เมนูหลัก:');
      console.log('1. สร้าง wallet ใหม่');
      console.log('2. กู้คืน wallet จาก mnemonic');
      console.log('3. ดู wallet ทั้งหมด');
      console.log('4. จัดการ wallet');
      console.log('5. ดูยอดเงิน');
      console.log('6. สร้าง address ใหม่');
      console.log('7. ส่งเงิน (สร้าง transaction)');
      console.log('8. สำรองข้อมูล');
      console.log('9. กู้คืนจากสำรอง');
      console.log('10. เปลี่ยนรหัสผ่าน master');
      console.log('0. ออกจากโปรแกรม');

      const choice = readlineSync.question('\nเลือกเมนู (0-10): ');

      try {
        switch (choice) {
          case '1':
            await this.createWallet();
            break;
          case '2':
            await this.restoreWallet();
            break;
          case '3':
            await this.listWallets();
            break;
          case '4':
            await this.manageWallet();
            break;
          case '5':
            await this.showBalance();
            break;
          case '6':
            await this.generateAddress();
            break;
          case '7':
            await this.sendTransaction();
            break;
          case '8':
            await this.createBackup();
            break;
          case '9':
            await this.restoreFromBackup();
            break;
          case '10':
            await this.changeMasterPassword();
            break;
          case '0':
            console.log('👋 ขอบคุณที่ใช้งาน Bitcoin Wallet');
            return;
          default:
            console.log('❌ กรุณาเลือกเมนูที่ถูกต้อง');
        }
      } catch (error) {
        console.error('❌ เกิดข้อผิดพลาด:', error instanceof Error ? error.message : 'Unknown error');
      }

      readlineSync.question('\nกด Enter เพื่อดำเนินการต่อ...');
    }
  }

  /**
   * สร้าง wallet ใหม่
   */
  private async createWallet(): Promise<void> {
    console.log('\n🆕 สร้าง Wallet ใหม่');
    
    const name = readlineSync.question('ชื่อ wallet: ');
    
    const useCustomMnemonic = readlineSync.keyInYNStrict('ต้องการใช้ mnemonic phrase ของตัวเอง?');
    
    let mnemonic: string | undefined;
    if (useCustomMnemonic) {
      mnemonic = readlineSync.question('กรุณาใส่ mnemonic phrase (12 หรือ 24 คำ): ');
    }

    const result = await this.walletManager.createWallet(name, mnemonic);

    console.log('\n✅ สร้าง wallet สำเร็จ!');
    console.log('🆔 Wallet ID:', result.walletId);
    console.log('\n🔑 Mnemonic Phrase (เก็บไว้ให้ปลอดภัย!):');
    console.log('📝', result.mnemonic);
    console.log('\n⚠️  กรุณาเก็บ mnemonic phrase ไว้ในที่ปลอดภัย!');
    console.log('   หากสูญหาย คุณจะไม่สามารถกู้คืน wallet ได้');
  }

  /**
   * กู้คืน wallet
   */
  private async restoreWallet(): Promise<void> {
    console.log('\n🔄 กู้คืน Wallet จาก Mnemonic');
    
    const name = readlineSync.question('ชื่อ wallet: ');
    const mnemonic = readlineSync.question('Mnemonic phrase: ');

    const walletId = await this.walletManager.restoreWallet(name, mnemonic);

    console.log('\n✅ กู้คืน wallet สำเร็จ!');
    console.log('🆔 Wallet ID:', walletId);
  }

  /**
   * แสดงรายการ wallet
   */
  private async listWallets(): Promise<void> {
    console.log('\n💼 รายการ Wallet ทั้งหมด');
    
    const wallets = this.walletManager.getWallets();
    
    if (wallets.length === 0) {
      console.log('ไม่มี wallet');
      return;
    }

    for (const wallet of wallets) {
      console.log(`\n📁 ${wallet.name}`);
      console.log(`   ID: ${wallet.id}`);
      console.log(`   สร้างเมื่อ: ${wallet.createdAt.toLocaleString('th-TH')}`);
      console.log(`   ใช้ครั้งล่าสุด: ${wallet.lastUsed.toLocaleString('th-TH')}`);
      console.log(`   Address ทั้งหมด: ${wallet.addresses.length}`);
    }
  }

  /**
   * จัดการ wallet
   */
  private async manageWallet(): Promise<void> {
    const walletId = await this.selectWallet();
    if (!walletId) return;

    const wallet = this.walletManager.getWallet(walletId);
    if (!wallet) return;

    console.log(`\n🔧 จัดการ Wallet: ${wallet.name}`);
    console.log('1. ดูรายละเอียด');
    console.log('2. ดู addresses ทั้งหมด');
    console.log('3. ลบ wallet');

    const choice = readlineSync.question('เลือกการจัดการ: ');

    switch (choice) {
      case '1':
        await this.showWalletDetails(walletId);
        break;
      case '2':
        await this.showAddresses(walletId);
        break;
      case '3':
        await this.deleteWallet(walletId);
        break;
    }
  }

  /**
   * แสดงยอดเงิน
   */
  private async showBalance(): Promise<void> {
    const walletId = await this.selectWallet();
    if (!walletId) return;

    console.log('\n💰 ยอดเงินในบัญชี');

    const coinInfos = this.walletManager.getCoinInfo(walletId);
    
    if (coinInfos.length === 0) {
      console.log('ไม่มีข้อมูลเหรียญ');
      return;
    }

    for (const coinInfo of coinInfos) {
      const currency = coinInfo.balance.currency;
      console.log(`\n${currency.name} (${currency.symbol}):`);
      console.log(`  ยอดยืนยันแล้ว: ${CurrencyService.formatAmount(coinInfo.balance.confirmed, currency)}`);
      console.log(`  ยอดรอยืนยัน: ${CurrencyService.formatAmount(coinInfo.balance.unconfirmed, currency)}`);
      console.log(`  ยอดรวม: ${CurrencyService.formatAmount(coinInfo.balance.total, currency)}`);
    }
  }

  /**
   * สร้าง address ใหม่
   */
  private async generateAddress(): Promise<void> {
    const walletId = await this.selectWallet();
    if (!walletId) return;

    const currency = await this.selectCurrency();
    if (!currency) return;

    const address = await this.walletManager.generateNewAddress(walletId, currency);

    console.log('\n✅ สร้าง address ใหม่สำเร็จ!');
    console.log(`💳 Address: ${address.address}`);
    console.log(`🪙 สกุลเงิน: ${currency.name} (${currency.symbol})`);
  }

  /**
   * ส่งเงิน
   */
  private async sendTransaction(): Promise<void> {
    const walletId = await this.selectWallet();
    if (!walletId) return;

    const currency = await this.selectCurrency();
    if (!currency) return;

    console.log(`\n💸 ส่ง ${currency.name}`);

    const toAddress = readlineSync.question('Address ปลายทาง: ');
    const amountStr = readlineSync.question(`จำนวนเงิน (${currency.symbol}): `);
    const amount = CurrencyService.toSatoshi(parseFloat(amountStr), currency);

    if (!CurrencyService.isValidAmount(parseFloat(amountStr), currency)) {
      console.log('❌ จำนวนเงินไม่ถูกต้อง');
      return;
    }

    const balance = this.walletManager.getBalance(walletId, currency);
    if (balance.total < amount) {
      console.log('❌ ยอดเงินไม่เพียงพอ');
      return;
    }

    try {
      const result = await this.walletManager.createTransaction(
        walletId,
        currency,
        toAddress,
        amount
      );

      console.log('\n✅ สร้าง transaction สำเร็จ!');
      console.log('🆔 Transaction ID:', result.txId);
      console.log('📄 Raw Transaction:', result.rawTx);
      console.log('\n⚠️  นี่เป็น transaction แบบ offline');
      console.log('   คุณต้องนำ raw transaction ไป broadcast ใน network');
    } catch (error) {
      console.log('❌ ไม่สามารถสร้าง transaction ได้:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * สร้างสำรองข้อมูล
   */
  private async createBackup(): Promise<void> {
    console.log('\n💾 สร้างสำรองข้อมูล');

    try {
      const backupPath = await this.walletManager.createBackup();
      console.log('✅ สร้างสำรองข้อมูลสำเร็จ!');
      console.log('📁 ไฟล์สำรอง:', backupPath);
    } catch (error) {
      console.log('❌ ไม่สามารถสร้างสำรองข้อมูลได้:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * กู้คืนจากสำรอง
   */
  private async restoreFromBackup(): Promise<void> {
    console.log('\n🔄 กู้คืนจากสำรองข้อมูล');

    const backups = StorageService.listBackups();
    
    if (backups.length === 0) {
      console.log('ไม่มีไฟล์สำรอง');
      return;
    }

    console.log('\nไฟล์สำรองที่มี:');
    for (let i = 0; i < backups.length; i++) {
      console.log(`${i + 1}. ${backups[i]}`);
    }

    const choice = readlineSync.question('เลือกไฟล์สำรอง (หมายเลข): ');
    const index = parseInt(choice) - 1;

    if (index < 0 || index >= backups.length) {
      console.log('❌ เลือกไฟล์ไม่ถูกต้อง');
      return;
    }

    const confirmRestore = readlineSync.keyInYNStrict('⚠️  การกู้คืนจะแทนที่ wallet ทั้งหมดที่มีอยู่ ยืนยันหรือไม่?');
    
    if (!confirmRestore) {
      console.log('ยกเลิกการกู้คืน');
      return;
    }

    try {
      const backupPath = backups[index];
      await this.walletManager.restoreFromBackup(backupPath);
      console.log('✅ กู้คืนจากสำรองข้อมูลสำเร็จ!');
    } catch (error) {
      console.log('❌ ไม่สามารถกู้คืนได้:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * เปลี่ยนรหัสผ่าน master
   */
  private async changeMasterPassword(): Promise<void> {
    console.log('\n🔐 เปลี่ยนรหัสผ่าน Master');

    const oldPassword = readlineSync.question('รหัสผ่านเก่า: ', { hideEchoBack: true });
    const newPassword = readlineSync.question('รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร): ', { 
      hideEchoBack: true,
      limit: (input) => input.length >= 8,
      limitMessage: 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร'
    });
    const confirmPassword = readlineSync.question('ยืนยันรหัสผ่านใหม่: ', { hideEchoBack: true });

    if (newPassword !== confirmPassword) {
      console.log('❌ รหัสผ่านใหม่ไม่ตรงกัน');
      return;
    }

    try {
      await this.walletManager.changeMasterPassword(oldPassword, newPassword);
      console.log('✅ เปลี่ยนรหัสผ่าน master สำเร็จ!');
    } catch (error) {
      console.log('❌ ไม่สามารถเปลี่ยนรหัสผ่านได้:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * เลือก wallet
   */
  private async selectWallet(): Promise<string | null> {
    const wallets = this.walletManager.getWallets();
    
    if (wallets.length === 0) {
      console.log('ไม่มี wallet กรุณาสร้าง wallet ก่อน');
      return null;
    }

    if (wallets.length === 1) {
      return wallets[0].id;
    }

    console.log('\nเลือก Wallet:');
    for (let i = 0; i < wallets.length; i++) {
      console.log(`${i + 1}. ${wallets[i].name} (${wallets[i].id})`);
    }

    const choice = readlineSync.question('เลือก wallet (หมายเลข): ');
    const index = parseInt(choice) - 1;

    if (index < 0 || index >= wallets.length) {
      console.log('❌ เลือก wallet ไม่ถูกต้อง');
      return null;
    }

    return wallets[index].id;
  }

  /**
   * เลือกสกุลเงิน
   */
  private async selectCurrency(): Promise<CryptoCurrency | null> {
    const currencies = CurrencyService.getAllCurrencies();

    console.log('\nเลือกสกุลเงิน:');
    for (let i = 0; i < currencies.length; i++) {
      console.log(`${i + 1}. ${currencies[i].name} (${currencies[i].symbol})`);
    }

    const choice = readlineSync.question('เลือกสกุลเงิน (หมายเลข): ');
    const index = parseInt(choice) - 1;

    if (index < 0 || index >= currencies.length) {
      console.log('❌ เลือกสกุลเงินไม่ถูกต้อง');
      return null;
    }

    return currencies[index];
  }

  /**
   * แสดงรายละเอียด wallet
   */
  private async showWalletDetails(walletId: string): Promise<void> {
    const wallet = this.walletManager.getWallet(walletId);
    if (!wallet) return;

    console.log(`\n📋 รายละเอียด Wallet: ${wallet.name}`);
    console.log(`🆔 ID: ${wallet.id}`);
    console.log(`📅 สร้างเมื่อ: ${wallet.createdAt.toLocaleString('th-TH')}`);
    console.log(`🕐 ใช้ครั้งล่าสุด: ${wallet.lastUsed.toLocaleString('th-TH')}`);
    console.log(`💳 จำนวน Address: ${wallet.addresses.length}`);

    const coinInfos = this.walletManager.getCoinInfo(walletId);
    console.log('\n💰 ยอดเงินตามสกุลเงิน:');
    
    for (const coinInfo of coinInfos) {
      const currency = coinInfo.balance.currency;
      console.log(`  ${currency.symbol}: ${CurrencyService.formatAmount(coinInfo.balance.total, currency)}`);
    }
  }

  /**
   * แสดง addresses
   */
  private async showAddresses(walletId: string): Promise<void> {
    const addresses = this.walletManager.getAddresses(walletId);

    console.log('\n💳 รายการ Address ทั้งหมด:');
    
    const groupedAddresses = new Map<string, typeof addresses>();
    
    for (const address of addresses) {
      const symbol = address.currency.symbol;
      if (!groupedAddresses.has(symbol)) {
        groupedAddresses.set(symbol, []);
      }
      groupedAddresses.get(symbol)!.push(address);
    }

    for (const [symbol, addrs] of groupedAddresses) {
      console.log(`\n🪙 ${symbol}:`);
      for (const addr of addrs) {
        console.log(`  📍 ${addr.address}`);
        console.log(`     ยอดเงิน: ${CurrencyService.formatAmount(addr.balance, addr.currency)}`);
        console.log(`     ใช้แล้ว: ${addr.used ? 'ใช่' : 'ไม่'}`);
      }
    }
  }

  /**
   * ลบ wallet
   */
  private async deleteWallet(walletId: string): Promise<void> {
    const wallet = this.walletManager.getWallet(walletId);
    if (!wallet) return;

    console.log(`\n⚠️  กำลังจะลบ Wallet: ${wallet.name}`);
    console.log('การลบจะไม่สามารถกู้คืนได้!');
    
    const confirm = readlineSync.keyInYNStrict('ยืนยันการลบ?');
    
    if (confirm) {
      await this.walletManager.deleteWallet(walletId);
      console.log('✅ ลบ wallet สำเร็จ');
    } else {
      console.log('ยกเลิกการลับ');
    }
  }
}