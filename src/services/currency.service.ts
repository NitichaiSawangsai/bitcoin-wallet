import { CryptoCurrency } from '../types';

export class CurrencyService {
  /**
   * รายการสกุลเงินดิจิทัลที่รองรับ
   */
  static readonly SUPPORTED_CURRENCIES: CryptoCurrency[] = [
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      network: 'mainnet',
      decimals: 8,
      derivationPath: "m/44'/0'/0'"
    },
    {
      symbol: 'BTC-TEST',
      name: 'Bitcoin Testnet',
      network: 'testnet',
      decimals: 8,
      derivationPath: "m/44'/1'/0'"
    },
    {
      symbol: 'LTC',
      name: 'Litecoin',
      network: 'mainnet',
      decimals: 8,
      derivationPath: "m/44'/2'/0'"
    },
    {
      symbol: 'DOGE',
      name: 'Dogecoin',
      network: 'mainnet',
      decimals: 8,
      derivationPath: "m/44'/3'/0'"
    },
    {
      symbol: 'BCH',
      name: 'Bitcoin Cash',
      network: 'mainnet',
      decimals: 8,
      derivationPath: "m/44'/145'/0'"
    },
    {
      symbol: 'DASH',
      name: 'Dash',
      network: 'mainnet',
      decimals: 8,
      derivationPath: "m/44'/5'/0'"
    }
  ];

  /**
   * ค้นหาสกุลเงินจาก symbol
   */
  static getCurrency(symbol: string): CryptoCurrency | undefined {
    return this.SUPPORTED_CURRENCIES.find(currency => 
      currency.symbol.toLowerCase() === symbol.toLowerCase()
    );
  }

  /**
   * ตรวจสอบว่าสกุลเงินนี้รองรับหรือไม่
   */
  static isSupported(symbol: string): boolean {
    return this.getCurrency(symbol) !== undefined;
  }

  /**
   * แปลงจาก satoshi เป็นหน่วยหลัก
   */
  static fromSatoshi(amount: number, currency: CryptoCurrency): number {
    return amount / Math.pow(10, currency.decimals);
  }

  /**
   * แปลงจากหน่วยหลักเป็น satoshi
   */
  static toSatoshi(amount: number, currency: CryptoCurrency): number {
    return Math.round(amount * Math.pow(10, currency.decimals));
  }

  /**
   * จัดรูปแบบจำนวนเงิน
   */
  static formatAmount(amount: number, currency: CryptoCurrency): string {
    const formatted = this.fromSatoshi(amount, currency);
    return `${formatted.toFixed(currency.decimals)} ${currency.symbol}`;
  }

  /**
   * ตรวจสอบความถูกต้องของจำนวนเงิน
   */
  static isValidAmount(amount: number, currency: CryptoCurrency): boolean {
    if (amount <= 0) return false;
    if (!Number.isFinite(amount)) return false;
    
    // ตรวจสอบจำนวนทศนิยม
    const satoshiAmount = this.toSatoshi(amount, currency);
    return Number.isInteger(satoshiAmount);
  }

  /**
   * รายการสกุลเงินทั้งหมด
   */
  static getAllCurrencies(): CryptoCurrency[] {
    return [...this.SUPPORTED_CURRENCIES];
  }

  /**
   * รายการสกุลเงิน mainnet เท่านั้น
   */
  static getMainnetCurrencies(): CryptoCurrency[] {
    return this.SUPPORTED_CURRENCIES.filter(currency => currency.network === 'mainnet');
  }

  /**
   * รายการสกุลเงิน testnet เท่านั้น
   */
  static getTestnetCurrencies(): CryptoCurrency[] {
    return this.SUPPORTED_CURRENCIES.filter(currency => currency.network === 'testnet');
  }

  /**
   * ค่าธรรมเนียมแนะนำ (satoshi per byte)
   */
  static getRecommendedFeeRate(currency: CryptoCurrency): number {
    const feeRates: { [key: string]: number } = {
      'BTC': 20,      // 20 sat/byte
      'BTC-TEST': 1,  // 1 sat/byte
      'LTC': 10,      // 10 sat/byte
      'DOGE': 1000,   // 1000 sat/byte (DOGE has low value)
      'BCH': 1,       // 1 sat/byte
      'DASH': 5       // 5 sat/byte
    };
    
    return feeRates[currency.symbol] || 10;
  }

  /**
   * ขนาดธุรกรรมโดยประมาณ (bytes)
   */
  static estimateTransactionSize(inputCount: number, outputCount: number): number {
    // Base size + inputs + outputs
    const baseSize = 10;
    const inputSize = 148 * inputCount;  // P2PKH input
    const outputSize = 34 * outputCount; // P2PKH output
    
    return baseSize + inputSize + outputSize;
  }

  /**
   * คำนวณค่าธรรมเนียม
   */
  static calculateFee(inputCount: number, outputCount: number, currency: CryptoCurrency, feeRate?: number): number {
    const txSize = this.estimateTransactionSize(inputCount, outputCount);
    const rate = feeRate || this.getRecommendedFeeRate(currency);
    
    return txSize * rate;
  }
}